var dataCopy = null;
var expsData = [];
var uniqueExpIds = null;
var $spatialContainer = $("#spatial-container");
var $dataErr = $("#data-err");
var $loadingCover = $("#loading-cover");
var $selectionCover = $("#selection-cover");
var $selectPrompt = $("#select-prompt");
var csv_uri = './skips.csv';
var $table = $("table");
var $tableParent = $("#data-table-parent");
var $loadWizard = $("#load-wizard");
var dimId = null;
var dimX = null;
var dimY = null;
var dimZ = null;
var dimOthers = [];
var hash = window.location.hash;
var globalControls = {
    clip: false,
    contours: false,
};

// lenet batch size sweep
if (hash == "#1") {
    csv_uri = './resnets_1_thru_3k.csv';
}
if (hash == "#2") {
    csv_uri = './bs_lenet5+_fmnist.csv';
}
if (hash == "#3") {
    csv_uri = './lenet5_cifar10_bs9600_35iters_lth+random.csv';
}

$loadWizard.on("click", loadWizardClick)
downloadData(csv_uri, true);
spatial_plots = ["spatial-1", "spatial-2", "spatial-3", "spatial-4", "spatial-5", "spatial-6"]
spatial_plots = spatial_plots.map((id)=>{return document.getElementById(id)});
spatial_plots.forEach((e)=>{
    make_surf(e);
    e.clip = false;
    e.contours = false;
});

// add "enter" key handler for data load's URL <input>
$("#url").keyup(function (event) {
    if (event.keyCode === 13) {
        downloadData($("#url")[0].value, false)
        $loadWizard.hide()
    }
});

function make_surf(element) {
    var title = {
        text: element.id,
        font: {
            family: 'Courier New, monospace',
            size: 24,
            color: 'darkgray'
        },
    }

    var data = [{
        z: [[1,2,3,],
            [1,3,3,],
            [1,3,3,],],
        y: [-9,-8,-7],
        x: [0, 2, 4],
        type: 'surface',
        colorbar: {
            thickness: 20,
            len: 0.55
        },
    }];

    var layout = {
        title: title,
        autosize: true,
        margin: {
            l: 50,
            r: 50,
            b: 40,
            t: 40,
        },
    };

    var clip_icon = {
        'width': 500,
        'height': 600,
        'path': 'M278.06 256L444.48 89.57c4.69-4.69 4.69-12.29 0-16.97-32.8-32.8-85.99-32.8-118.79 0L210.18 188.12l-24.86-24.86c4.31-10.92 6.68-22.81 6.68-35.26 0-53.02-42.98-96-96-96S0 74.98 0 128s42.98 96 96 96c4.54 0 8.99-.32 13.36-.93L142.29 256l-32.93 32.93c-4.37-.61-8.83-.93-13.36-.93-53.02 0-96 42.98-96 96s42.98 96 96 96 96-42.98 96-96c0-12.45-2.37-24.34-6.68-35.26l24.86-24.86L325.69 439.4c32.8 32.8 85.99 32.8 118.79 0 4.69-4.68 4.69-12.28 0-16.97L278.06 256zM96 160c-17.64 0-32-14.36-32-32s14.36-32 32-32 32 14.36 32 32-14.36 32-32 32zm0 256c-17.64 0-32-14.36-32-32s14.36-32 32-32 32 14.36 32 32-14.36 32-32 32z'
    }

    var contour_icon = {
        'width': 500,
        'height': 600,
        'path': 'M268.3 32.7C115.4 42.9 0 176.9 0 330.2V464c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V320C64 186.8 180.9 80.3 317.5 97.9 430.4 112.4 512 214 512 327.8V464c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V320c0-165.3-140-298.6-307.7-287.3zm-5.6 96.9C166 142 96 229.1 96 326.7V464c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V320c0-74.8 64.5-134.8 140.8-127.4 66.5 6.5 115.2 66.2 115.2 133.1V464c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V320c0-114.2-100.2-205.4-217.3-190.4zm6.2 96.3c-45.6 8.9-76.9 51.5-76.9 97.9V464c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V320c0-17.6 14.3-32 32-32s32 14.4 32 32v144c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V320c0-59.2-53.8-106-115.1-94.1z'
    }

    var config = {
        modeBarButtonsToRemove: ['orbitRotation', 'resetCameraLastSave3d', 'hoverClosest3d'],
        displaylogo: false,
        responsive: true,
        modeBarButtonsToAdd: [
            {
                name: 'toggle clipping',
                icon: clip_icon,
                click: function(plt) {
                    plt.clip = !plt.clip;
                    selectionUpdate();
                }
            },
            {
                name: 'toggle contours',
                icon: contour_icon,
                click: function(plt) {
                    plt.contours = !plt.contours;
                    selectionUpdate();
                }
            },
        ],
    }

    Plotly.newPlot(element, data, layout, config);
}

function downloadData(csv_uri, demo) {
    expsData = [];
    $loadingCover.show();
    Plotly.d3.csv(csv_uri, function(err, rows) {
        dataCopy = rows;
        $table.children().remove();
        spatial_plots.forEach((e)=>{
            $(e).parent().hide();
        })

        $selectPrompt.text("Select the experiment id data column")
        $("li").remove();

        dims = [];
        for (prop in dataCopy[0]) {
            if (prop != null) {
                dims.push(prop)
                $("#list-columns").append(createLi(prop))
            }
        }
    
        if (demo) {
            if (hash == "") {
                $("li").get(0).click()
                $("li").get(2).click()
                $("li").get(3).click()
                $("li").get(4).click()
	    }
	    // resnet w/ variable # test ex's
	    else if (hash == "#1") {
                $("li").get(0).click()
                $("li").get(3).click()
                $("li").get(4).click()
                $("li").get(5).click()
	    }
	    // lenet batch size sweep
	    else if (hash == "#2") {
                $("li").get(0).click()
                $("li").get(3).click()
                $("li").get(4).click()
                $("li").get(5).click()
	    }
	    // LTH / IMP & random masks
	    else if (hash == "#3") {
                $("li").get(0).click()
                $("li").get(4).click()
                $("li").get(5).click()
                $("li").get(6).click()
	    }
            setTimeout(1000, ()=>{$loadingCover.fadeOut(450);})
        }
        else {
            $selectionCover.show();
            $loadingCover.fadeOut(450);
        }
    });
};

function createLi(str) {
    return $("<li>" + prop + "</li>").click((e)=>{
        $e = $(e.target);
        $e.toggleClass("clicked")
        num_clicked = $("li.clicked").length;

        if (num_clicked == 1) {
            if ($("#list-columns").hasClass("done")) {
                $("#list-columns").toggleClass("done")
            }
            $e.toggleClass("exp-id")
            $selectPrompt.text("Select the two data columns which are directions in the model's weight space.")
            return
        }
        if (num_clicked <= 3) {
            $e.toggleClass("x-y")
            if (num_clicked == 3) {
                $("#list-columns").toggleClass("done")
                $("#select-prompt").text("Select the loss data column")
                dimX = $("li.clicked.x-y").eq(0).text()
                dimY = $("li.clicked.x-y").eq(1).text()
            }    
        }
        else {
            dimOthers = [];
            $e.toggleClass("z")
            dimZ = $e.eq(0).text();
            $("li").each((i, e)=>{
                if (!$(e).hasClass("clicked")) {
                    dimOthers.push($(e).text())
                }
            })
            $selectionCover.fadeOut(()=>{
                calcExpSubsets()
                makeDataTable()
                selectionUpdate()
                $loadingCover.hide()  
            })
            $loadingCover.show()
        }
    })
}

function makeDataTable() {
    expRows = [[dimId]];
    expSoFar = [];

    dataCopy.forEach((r, i)=>{
        if (!(r[dimId] in expSoFar)) {
            new_row = [r[dimId],]
            dimOthers.forEach((d)=>{
                if (i == 0) {
                    // add header columns once
                    expRows[0].push(d)
                }
                new_row.push(r[d])
            }) 
            expRows.push(new_row)
            expSoFar.push(r[dimId])
        }
    })

    $table.get(0);
    expRows.forEach((r, i)=>{
        var domString = "";
        if (i == 0) {
            domString += "<tr style='font-style: italic;'><td style='font-size: 1.3em; color: green'>&#10004;</td>"
        }
        else {
            domString += "<tr><td><input type='checkbox'></td>"
        }
        
        r.forEach((v, j)=>{
            domString += "<td>" + String(v) + "</td>"
        })
        domString += "</tr>"
        $ele = $(domString)

        if (i != 0) {
            // if not headers
            $ele.find("input").attr("id", String(r[0]));
            $ele.on("click", function _(e){
                if ($(e.target).is("input"))
                    selectionUpdate();
            })
        }

        $table.append($ele.get(0))
    })
}

function calcExpSubsets() {
    dimId = $(".exp-id").eq(0).text()
    
    expIdValues = []
    dataCopy.forEach((r, i)=>{
        expIdValues.push(r[dimId])
    })
    uniqueExpIds = expIdValues.filter((item, i, ar) => ar.indexOf(item) === i);
    num_exps = uniqueExpIds.length;
 
    for (i=0; i<num_exps; i++) {
        expSubset = dataCopy.filter((row)=>{
            return row[dimId] == uniqueExpIds[i]
        })
        expSubset.sort((a, b) => {
            ax = parseFloat(a[dimX]);
            ay = parseFloat(a[dimY]);
            bx = parseFloat(b[dimX]);
            by = parseFloat(b[dimY]);

            if (ay < by) {
                return -1;
            }
            else if (ay == by) {
                if (ax < bx) {
                    return -1;  
                }
                else if (ax > bx) {
                    return 1;
                }
                return 0;
            }

            return 1;
        })
        expsData.push(expSubset)
    }
    //console.log("Finished processing experiment data subsets")
}

function unpack(rows, key) {
    return rows.map(function(row) { 
        return row[key]; 
    });
}

function getSelectedIds() {
    var selectedIds = [];
    $("input:checked").each((i, e)=>{
        selectedIds.push(e.id)
    })
    if (selectedIds.length > 6) {
        selectedIds = selectedIds.slice(0,6);   
    }
    return selectedIds
}

function globalHome() {
    spatial_plots.forEach((plt)=>{
        $(plt).find(".modebar-btn[data-title='Reset camera to default']")[0].click()
    })
}

function toggleClip(e) {
    $(e).toggleClass("active")
    globalControls["clip"] = !globalControls["clip"];
    spatial_plots.forEach((plt)=>{
        if (globalControls["clip"] != plt.clip) 
            $(plt).find(".modebar-btn[data-title='toggle clipping']")[0].click()
    })
}

function toggleContours(e) {
    $(e).toggleClass("active")
    globalControls["contours"] = !globalControls["contours"];
    spatial_plots.forEach((plt)=>{
        if (globalControls["contours"] != plt.contours) 
            $(plt).find(".modebar-btn[data-title='toggle contours']")[0].click()
    })
}

function applyGlobals(plt) {
    if (globalControls["clip"] != plt.clip) {
        $(plt).find(".modebar-btn[data-title='toggle clipping']")[0].click()
    }
    if (globalControls["contours"] != plt.contours) {
        $(plt).find(".modebar-btn[data-title='toggle contours']")[0].click()
    }
};

function showLoadWizard() {
    $loadWizard.css("display", "flex");
}

function loadCustomData(_e) {
    var file = $("#file")[0].files[0];
    if (file) {
        $loadWizard.hide();
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            downloadData(evt.target.result, false);
        }
        reader.readAsDataURL(file);
    }
}

function loadWizardClick(e) {
    if (e.target.id == $loadWizard.get(0).id) {
        $loadWizard.hide()
    }
}

function selectionUpdate() {
    var selectedIds = getSelectedIds();
    $(spatial_plots).parent().hide();

    // display the graphs differently depending on how many experiments are selected
    var num_ids = selectedIds.length;
    switch (num_ids) {
        case 0:
            break
        case 1:
            var plt = $(spatial_plots[0]);
            plt.css("height", "100vh").parent().css("width", "100%").show()
            Plotly.Plots.resize(plt)
            break
        case 2:
            var plts = $(spatial_plots.slice(0, num_ids))
            plts.css("height", "100vh").each((i, e)=>{
                Plotly.Plots.resize(e)
                $(e).parent().css("width", "50%").show()
            })
            break
        case 3:
            var plts = $(spatial_plots.slice(0, num_ids))
            plts.css("height", "60vh").each((i, e)=>{
                $(e).parent().css("width", "33%").show()
                Plotly.Plots.resize(e)
            })
            break
        case 4:
            var plts = $(spatial_plots.slice(0, num_ids))
            plts.css("height", "50vh").each((i, e)=>{
                $(e).parent().css("width", "50%").show()
                Plotly.Plots.resize(e)
            })
            break
        case 5:
        case 6:
            var plts = $(spatial_plots.slice(0, num_ids))
            plts.css("height", "50vh")
            plts.each((i, e)=>{
                $(e).parent().css("width", "33%").show()
            }).each((i, e)=>{
                Plotly.Plots.resize(e)
            })
            break
        default:    
            alert("YOU SELECTED TOO MANY!!!")
    }

    try {
        selectedIds.forEach((id, idx) => {
            surf_plot = spatial_plots[idx];
            data_subset = expsData[id];
            // radius clip
            clip = surf_plot.clip;
            r_thresh = null;

            if (clip) {
                max_x = max_y = Number.NEGATIVE_INFINITY;
                min_x = min_y = Number.POSITIVE_INFINITY;

                data_subset.forEach((r, idx) => {
                    x = parseFloat(r[dimX]);
                    if (x > max_x) {max_x = x;}
                    else if (x < min_x) {min_x = x;}
                    y = parseFloat(r[dimY]);
                    if (y > max_y) {max_y = y;}
                    else if (y < min_y) {min_y = y;}                    
                })

                // get height and width of selected region
                w = Math.abs(max_x - min_x);
                h = Math.abs(max_y - min_y);
                r_thresh = Math.max(w, h) / 2;
            }

            //console.log("experiment #" + id + "'s row count:", data_subset.length)
            Plotly.update(surf_plot, createDataObject(surf_plot, data_subset, r_thresh), {title: "Experiment #" + id})
            $dataErr.hide();
            $spatialContainer.css({"visibility": "visible"});
        })
    } 
    catch (err) {
        $dataErr.css({"display": "flex"});
        $spatialContainer.css({"visibility": "hidden"});
        console.log(err)
    }
}

function createDataObject(plt, rows, r_thresh) {
    if (rows == null || rows[0] == null) {return {};}
    x = [];
    y = [];
    z = [];
    z_row = []

    last_y = rows[0][dimY];
    all_x = false;

    rows.forEach((r) => {
        if (r_thresh != null) {
            rad = Math.sqrt(r[dimX]**2 + r[dimY]**2)
            if (rad > r_thresh) {
                z_row.push(NaN);
            }
            else {
                z_row.push(r[dimZ]);
            }
        }
        else {
            z_row.push(r[dimZ]);
        }

        if (r[dimY] != last_y) {
            last_y = r[dimY];
            all_x = true;
            y.push(r[dimY])
            z.push(z_row)
            z_row = []
        }

        if (!all_x) {
            x.push(r[dimX])
        }
    })

    contours = {};
    if (plt.contours) {
        contours = {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: "#00ff00",
                project: {z: true}
            }
        }
    }

    var data = {
        opacity: 0.7,
        z: [z],
        y: [y],
        x: [x],
        contours: contours,
    };

    //console.log(data)
    return data;
}

function syncIIFE() {
    var lastHovered = null;
    var syncToggle = false;

    spatial_plots.forEach(function _(e, i){
        e.on('plotly_relayout', function(){
            if (lastHovered != i || !syncToggle) {
                return
            }

            camConf = spatial_plots[lastHovered].layout.scene.camera;
            layout = {
                scene: {
                    camera: {
                        "center": camConf["center"],
                        "eye": camConf["eye"],
                        "up": camConf["up"],
                    }
                }
            }
            
            spatial_plots.forEach(function __(plt, j){
                // don't call update on the one the user just interacted with
                if (j == i) return;
                Plotly.update(plt, null, layout)
            });
        });
    })
    spatial_plots.forEach(function _(e, i){
        e.on('plotly_hover', function(){
            lastHovered = i;
        });
    })

    return function switchSyngToggle(){syncToggle = !syncToggle;}
}

var _toggleSync = syncIIFE()
function toggleSync(e) {
    _toggleSync()
    $(e).toggleClass("active")
}

// pragmatic way to set default button states
$("#sync").click();
$("#clip").click();
$("#contours").click();
