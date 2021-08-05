## Canofi: convert 360 panoramas to hemispherical imagery for plant science applications

https://joathert.github.io/canofi-app/

https://www.cano.fi

# canofi-app

Canofi is powered by [Pyodide](https://pyodide.org/en/stable/). Pyodide runs the scientific python stack within the browser. 

# some details on the algorithms
The image loading is complicated by the fact that the browser python (pyodide) code refused to work with jpeg files. That is why input image files are first sent to a canvas and re-read in as fixed sized png files at lower resolution.  This convoluted step is not neccessary using standard python, so use that for important research.  

Note that the reprojection method can be achieved with a whole bunch of different software including the Gimp, 
ImageMagick, or even Scipy.Griddata. The Scipy.Griddata method was used in Haozhou Wang’s thesis, which you can find [here](https://github.com/HowcanoeWang/Spherical2TreeAttributes). Wang's method appeared to produce somewhat smoother imagery than the method used here, at the expense of processing time and memory. That is why we use the sklearn method for the browser but again, if you are conducting research, then should investigate the various options.   

# attribution
The LAI algorithm is a port of [Hemiphot.R](https://github.com/naturalis/Hemiphot):

Hans ter Steege (2018). Hemiphot.R: Free R scripts to analyse hemispherical photographs for canopy openness, leaf area index and photosynthetic active radiation under forest canopies. Unpublished report. Naturalis Biodiversity Center, Leiden, The Netherlands 

