# Canofi: convert 360 panoramas to hemispherical imagery for plant science applications

![Alt text](attributes/corrected_banner.jpg?raw=true "Canofi")

https://app.cano.fi/

https://www.cano.fi

## canofi-app
Canofi (rhymes with butterfly)  is an educational web-app that explores the use of panoramic imagery for plant science applications. 

The current focus of Canofi is on the estimation of the leaf area index (LAI) via a hemispherical reprojection. You can read all about LAI on [wikipedia](https://en.wikipedia.org/wiki/Leaf_area_index) where there is also a decent introduction to [hemispherical photography](https://en.wikipedia.org/wiki/Hemispherical_photography).

The use of panoramas means we can skip the expensive hardware that is usually used when collecting hemispherical imagery. Smartphone panoramas work just fine, especially when collected with the Google Street View app. 

Canofi is powered by the excellent [Pyodide](https://pyodide.org/en/stable/), which lets us run the scientific python stack within the browser. 

## Accuracy of algorithms
Canofi performs 2 different main steps: 
1. Reprojection 
2. LAI estimation.
Both steps should be checked for accuracy versus reference algorithms. This testing is only for validation of the algorithms used in Canofi versus
offline reference implementations. It does not test the validty of the (abstract) method
versus fisheye hardware, there are publications on that (e.g. [here](https://www.biorxiv.org/content/10.1101/2020.12.15.422956v2.full)).

Note that the reprojection step can be achieved with a whole bunch of different software including the Gimp, 
ImageMagick, or a Scipy (interpolate.griddata) method used in Haozhou Wang’s thesis, which you can find [here](https://github.com/HowcanoeWang/Spherical2TreeAttributes). During early testing, Wang's method appeared to produce somewhat smoother imagery than the method used here, at the expense of processing time and memory.

To check for errors, LAI output was compared from 3 different _projection-LAI estimation_ pairs for 3 different panoramas and 4 differing threshold values:
1. Wang's Scipy Reprojection -> Hemiphot.R LAI   (This is the X-axis on below graph)
2. Canofi Skimage Reprojection -> Canofi LAI      (blue points on graph)
3. Canofi Skimage Reprojection -> Hemiphot.R LAI  (red points on graph, obscured by blue points) 

![Alt text](attributes/output_fig.png?raw=true "Canofi")

Note that data-sets 2 and 3 overlie each other, but both are plotted. This means that Canofi LAI method is comparable (though not exactly equivalent) to Hemiphot.R implementation. 

At High LAI, both 2 and 3 diverge from the reference values. This means that the skimage reprojection gives different results to the reference algorithm. This chimes with our previous experience. Based on our casual observations it is likely that Wang's method is more accurate, but this is an issue that needs further investigation. For this reason, **please do not use Canofi for critical research**!     


## More issues  
The browser image loading is complicated by the fact that the embedded python code refused to work with jpeg files. That is why input image files are first sent to a canvas and re-read in as fixed sized png files at lower resolution.  This convoluted step is not neccessary using standard python, so use that for important research.  


## Attribution
The LAI algorithm is a port of [Hemiphot.R](https://github.com/naturalis/Hemiphot):

Hans ter Steege (2018). Hemiphot.R: Free R scripts to analyse hemispherical photographs for canopy openness, leaf area index and photosynthetic active radiation under forest canopies. Unpublished report. Naturalis Biodiversity Center, Leiden, The Netherlands 

