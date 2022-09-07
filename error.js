make_pc();
spatial_plots = ["spatial-1", "spatial-2", "spatial-3"]
spatial_plots = spatial_plots.map((id)=>{return document.getElementById(id)});
spatial_plots.forEach((e)=>{make_surf(e)});

var pcUpdate = null;
var data_copy = null;
var exps_data = [];
var dim_order = null;
var $spatialContainer = $("#spatial-container");
var $dataErr = $("#data-err");
var $loadingCover = $("#loading-cover");

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
        z: [[1,2,3,4,5,6,7,8,9],
            [1,3,3,4,5,6,7,8,9],
            [1,3,3,4,5,6,7,8,9],
            [1,2,3,4,5,6,7,8,9],
            [1,2,3,4,5,6,7,8,9],
            [1,6,3,4,5,6,7,8,9],
            [1,9,3,4,5,6,7,8,9],
            [1,2,3,4,5,6,7,8,9],
            [1,2,3,4,5,6,7,8,9]],
        y: [-9,-8,-7,-6,-5,-4,-3,-2,-1],
        x: [0, 2, 4, 6, 8, 10, 12, 14, 16],
        type: 'surface',
        colorbar: {
            thickness: 20,
            len: 0.55
        },
    }];

    var layout = {
        title: title,
        autosize: false,
        width: 600,
        height: 600,
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 50,
        },
    };

    var config = {
        modeBarButtonsToRemove: ['toImage', 'orbitRotation', 'resetCameraLastSave3d', 'hoverClosest3d'],
        displaylogo: false
    }

    Plotly.newPlot(element, data, layout, config);
}

function make_pc() {
    csv_url = "./combo_plots.csv"; //'https://raw.githubusercontent.com/bainro/loss-landscape-viz/master/combo_plots.csv'
    Plotly.d3.csv(csv_url, function(err, rows) {
        data_copy = rows;

        var data = [{
            type: 'parcoords',
            pad: [40,40,40,40],
            line: {
                color: unpack(rows, 'log(loss)'),
                colorscale: 'RdBu'
            },
            labelfont: {
                color: 'white',
                size: 14,
            },
            rangefont: {
                color: 'black',
                size: 2
            },
            tickfont: {
                size: 16,
            },
            domain: {
                row: 10,
                column: 10
            },
            dimensions: [
                {
                    label: 'x',
                    constraintrange: [[-1.0, 1.0]],
                    values: unpack(rows, 'x')
                }, 
                {
                    label: 'skip connections',
                    values: unpack(rows, 'skip connections')
                }, 
                {
                    label: 'exp_id',
                    constraintrange: [[4.5, 6.5], [0.5, 1.5]],
                    values: unpack(rows, 'exp_id')
                },
                {
                    label: 'y',
                    constraintrange: [[-1.0, 1.0]],
                    values: unpack(rows, 'y')
                },
                {
                    label: 'z',
                    values: unpack(rows, 'log(loss)')
                }
            ]
        }];

        var layout = {};
        var config = {
            displayModeBar: false,
            responsive: true,
            displaylogo: false
        }

        pc = document.getElementById("parallel-plot");
        Plotly.newPlot(pc, data, layout, config);
        var uniqueExpIds = null;
        var num_exps = null; 
        
        function calcExpSubsets() {
            dims = pc.data[0].dimensions
            uniqueExpIds = dims[0].values.filter((item, i, ar) => ar.indexOf(item) === i);
            num_exps = uniqueExpIds.length;

            for (i=0; i<num_exps; i++) {
                exp_subset = data_copy.filter((row)=>{
                    return row["exp_id"] == uniqueExpIds[i]
                })
                exp_subset.sort((a, b) => {
                    ax = parseFloat(a.x);
                    ay = parseFloat(a.y);
                    bx = parseFloat(b.x);
                    by = parseFloat(b.y);

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
                exps_data.push(exp_subset)
            }
            console.log("Finished processing experiment data subsets")
        }
        calcExpSubsets();

        pcUpdate = () => {
            dim_order_changed = false;
            if (dim_order == null) {
                // init
                dim_order = [];
                pc.data[0].dimensions.forEach((d)=>{
                    dim_order.push(d.label)
                })
            } 
            else {
                dim_order_changed = !dim_order.every((d, i)=>{
                    return d == pc.data[0].dimensions[i].label;
                })
            }
            
            if (dim_order_changed) {
                dim_order = [];
                pc.data[0].dimensions.forEach((d)=>{
                    dim_order.push(d.label)
                })
                exps_data = [];
                calcExpSubsets();
            }

            // exclude values outside the selected range(s)
            var filteredIds = uniqueExpIds.filter((id) => {
                return checkDimRange(id, dims[0])
            });
            
            if (filteredIds.length > 3) {
                filteredIds = filteredIds.slice(0,3)
            }

            // hide spatial plots not currently in use
            if (filteredIds.length == 1) {
                $(spatial_plots[0]).show()
                $(spatial_plots[1]).fadeOut("slow")
                $(spatial_plots[2]).fadeOut("slow")
            } else if (filteredIds.length == 2) {
                $(spatial_plots[0]).show()
                $(spatial_plots[1]).show()
                $(spatial_plots[2]).fadeOut("slow")
            } else {
                $(spatial_plots).show()
            }

            try {
                filteredIds.forEach((id, idx) => {
                    data_subset = exps_data[id];
                    // filter all dims except exp_id
                    // go thru rows for each dim with ranges set
                    num_cols_not_exp_id = dims.length;
                    for (i=1; i<num_cols_not_exp_id; i++) {
                        data_subset = data_subset.filter((r, idx) => {
                            value = r[dims[i].label];
                            return checkDimRange(value, dims[i]);
                        })
                    }

                    //console.log("experiment #" + id + "'s row count:", data_subset.length)
                    Plotly.update(spatial_plots[idx], createDataObject(data_subset), {title: "Experiment #" + id})
                    $dataErr.hide();
                    $spatialContainer.css({"visibility": "visible"});
                    // Would be cool, but found several bits of evidence that it's not supported.
                    // Plotly.animate(spatial_plots[idx], [{
                    //     data: createDataObject(data_subset)
                    // }])
                })
            } 
            catch (err) {
                $dataErr.css({"display": "flex"});
                $spatialContainer.css({"visibility": "hidden"});
                //console.log(err)
            }

        }

        pc.on('plotly_restyle', pcUpdate)
    });
};

function checkDimRange(v, dim) {
    var ranges_satisfied = false;
    var limited_range = dim.hasOwnProperty("constraintrange");
    if (limited_range) {
        multiRanges = Array.isArray(dim["constraintrange"][0]);
        if (multiRanges) {
            dim["constraintrange"].some((range)=>{
                min = range[0];
                max = range[1];
                in_range = (v >= min && v <= max);
                if (in_range) {
                    ranges_satisfied = true;
                    return true;
                }
                return false;
            })
        }
        else {
            min = dim["constraintrange"][0];
            max = dim["constraintrange"][1];
            in_range = (v >= min && v <= max);
            if (in_range) {ranges_satisfied = true;}
        }
    }
    else 
        ranges_satisfied = true;
    return ranges_satisfied;
}

function unpack(rows, key) {
    return rows.map(function(row) { 
        return row[key]; 
    });
}

function createDataObject(rows) {
    if (rows == null || rows[0] == null) {return {};}
    x = [];
    y = [];
    z = [];
    z_row = []

    last_y = rows[0].y;
    all_x = false;

    rows.forEach((r) => {
        z_row.push(r["log(loss)"])
        if (r.y != last_y) {
            last_y = r.y;
            all_x = true;
            y.push(r.y)
            z.push(z_row)
            z_row = []
        }
        if (!all_x) {x.push(r.x)}
    })

    var data = {
        opacity: 0.7,
        z: [z],
        y: [y],
        x: [x],
    };

    //console.log(data)
    return data;
}

document.addEventListener('DOMContentLoaded', function() {
    var intervalID = window.setInterval(checkPageReady, 500);
    function checkPageReady() {
        if (pcUpdate != null) {
            pcUpdate();
            window.clearInterval(intervalID);
            setTimeout(()=>{
                $loadingCover.fadeOut(450);
            }, 200)
        }
    }
}, false);
