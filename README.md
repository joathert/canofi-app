# Canofi: convert 360 panoramas to hemispherical imagery for plant science applications

![Alt text](attributes/corrected_banner.jpg?raw=true "Canofi")

https://app.cano.fi/

https://www.cano.fi

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.5171971.svg)](https://doi.org/10.5281/zenodo.5171971)

info@cano.fi

## Canofi-app
Canofi (rhymes with butterfly)  is an educational web-app that uses panoramic imagery to characterise plant canopy structure. 

Canofi's focus is on the estimation of the leaf area index (LAI) via a hemispherical fisheye type reprojection of input panorama data. You can read all about LAI on [wikipedia](https://en.wikipedia.org/wiki/Leaf_area_index) where there is also a decent introduction to [hemispherical photography](https://en.wikipedia.org/wiki/Hemispherical_photography). 

The use of panoramas means we can skip the expensive hardware (e.g. DSLR + lens + levelling equipment) that is usually used to collect hemispherical imagery. Smartphone panoramas work just fine, especially when collected with the Google Street View app. The banner picture above illustrates the basic reprojection concept; the rectangular panoramic input data is on the left and the output fisheye type image on the right. Once computed, the fisheye image is segmented into sky and vegetation and used to derive structural parameters such as the LAI. 

Canofi is powered by the excellent [Pyodide](https://pyodide.org/en/stable/), which runs the scientific python stack within the browser. The python code used for the reprojection and LAI calculation is embedded in the functions.js file [here](functions.js#L51) and [here](functions.js#L176), and can be extracted (minus the convoluted browser image i/o) to run offline as a normal script.


## Accuracy of algorithms
Canofi performs 2 main steps: 
1. reprojection from panorama to fisheye. 
2. LAI estimation.

Both steps were checked for accuracy versus reference algorithms. This testing is only for validation of the algorithms used in Canofi versus
offline reference implementations. It does not test the validty of the reporjection method
versus fisheye hardware, there are recent publications on that (e.g. [here](http://www.azandisresearch.com/wp-content/uploads/2021/07/cpab034.pdf)).

Note that the reprojection step can be achieved with a whole bunch of different software including the Gimp, 
ImageMagick, or a Scipy (interpolate.griddata) method used in Haozhou Wang’s thesis, which you can find [here](https://github.com/HowcanoeWang/Spherical2TreeAttributes). We use that as our reference reprojection code. As our LAI method was a line-by-line port of [Hemiphot.R](https://github.com/naturalis/Hemiphot), then we will use the R code as our reference LAI implementation.

To check for errors, LAI output was compared from 3 different _Reprojection-LAI estimation_ pairs for 3 different panoramas and 4 differing threshold values:
1. Wang's Scipy Reprojection -> Hemiphot.R LAI   (This is the X-axis on below graph)
2. Canofi skimage Reprojection -> Canofi LAI      (blue points on graph)
3. Canofi skimage Reprojection -> Hemiphot.R LAI  (red points on graph, obscured by blue points) 

![Alt text](attributes/output_fig.png?raw=true "Canofi")

Note that data-sets 2 and 3 overlie each other, but both are plotted. This means that Canofi LAI method is comparable (though not exactly equivalent) to Hemiphot.R implementation. 

At High LAI, both 2 and 3 diverge from the reference values caculated with _Wang's Scipy Reprojection -> Hemiphot.R LAI_. This means that the skimage reprojection gives different results to the reference algorithm. Some of this difference is accounted for by the lower resolution of the web image (see **More issues** below), but some of it is also due to differences in the interpolation codes themselves. Further work is needed to ascertain which re-projection method is most accurate. For this reason, **please do not (yet) use Canofi for important research** where maximum reprojection accuracy is required. 

Note that a bug was indentified in the LAI python routines in October 2022. See this [issue](https://github.com/joathert/canofi-app/issues/17#issue-1424290650).  

## More issues  
The browser image loading is complicated by the fact that the embedded python code refused to work with jpeg files. That is why input image files are first sent to a canvas and re-read in as fixed sized png files at lower resolution. This decrease in resolution affects the computed LAI value a little. Further, this convoluted step is not neccessary using standard python + full resolution imagery that you might want to run on a desktop. 

## References and attributions
A Z Andis Arietta (2021) Estimation of forest canopy structure and understory light using spherical panorama images from smartphone photography, Forestry: An International Journal of Forest Research;, cpab034, https://doi.org/10.1093/forestry/cpab034

Hans ter Steege (2018). Hemiphot.R: Free R scripts to analyse hemispherical photographs for canopy openness, leaf area index and photosynthetic active radiation under forest canopies. Unpublished report. Naturalis Biodiversity Center, Leiden, The Netherlands 

Haozhou WANG, (2019), ESTIMATING FOREST ATTRIBUTES FROM SPHERICAL IMAGES, University of New Brunswick

The reprojection code was inspired by this blog post:
http://www.richwareham.com/little-planet-projection/.


