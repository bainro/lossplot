# lossplot
visualize multiple loss landscapes simultaneously in browser

There's a demo here: [Link](https://rkbain.com/loss). <br/>
Be patient as ~10MB csv file has to be downloaded and parsed. <br/>
There's some other dataset links here: [Link 1](https://rkbain.com/loss/#1) [Link 2](https://rkbain.com/loss/#2) [Link 3](https://rkbain.com/loss/#3)

### Simple setup:
```
git clone https://github.com/bainro/lossplot.git
cd lossplot
# can use python -V to ensure python3 is being used
python -m http.server 8080
```
Go to localhost:8080 in your browser of choice 😎

### Paper detailing the creation process:
https://arxiv.org/abs/2111.15133

### Code that created the csv's that lossplot demos use:
https://github.com/bainro/loss_landscape
Best of luck, this repo is very much research quality 😅

### Paper that uses lossplot:
[Visualizing the Loss Landscape of Winning Lottery Tickets
](https://arxiv.org/abs/2112.08538)

### Winning lottery ticket hypothesis repo:
https://github.com/bainro/LTH 
