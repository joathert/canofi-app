


// set up pyodide
async function main_as() {
    document.getElementById('load').setAttribute("class", "loader");
    document.getElementById("loadtxt").innerHTML = "Loading Pyodide modules";
    
    await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.17.0/full/" });
    await pyodide.loadPackage(['numpy','pillow','scikit-image']);
    console.log("Modules loaded");
    
    document.getElementById('load').setAttribute("class", ".hide-loader");
    document.getElementById("loadtxt").innerHTML = "Modules loaded, ready to go!";
    };



function handleImage(e){
    
    var reader = new FileReader();
    reader.onload = function(event){
        var img = new Image();
        img.onload = function(){
            ctx.drawImage(img, 0, 0, img.width,    img.height,     // source rectangle
                          0, 0, canvas.width, canvas.height); // destination rectangle
     
        }
        img.src = event.target.result;
	var output = document.getElementById('output');
	output.src = img.src
    }
    reader.readAsDataURL(e.target.files[0]);     
    }

var processSuccess=0;


function pyProcessImage() {

    im_data = canvas.toDataURL("image/png").replace(/^data:.+;base64,/, '');
    document.getElementById("image_data").setAttribute("b64", im_data);

    try {
	
    pyodide.runPython(`
    from js import document
    import io
    import base64    

    import numpy as np
    from PIL import Image   # TODO remove dependency, use skimage for io
    from skimage.transform import warp
    import skimage.io as iosk  

    str_base64 = document.getElementById('image_data').getAttribute('b64')
    
    # deal with jpeg
    #from PIL import ImageFile
    #ImageFile.LOAD_TRUNCATED_IMAGES = True

    simg = base64.b64decode(str_base64)
    simg = io.BytesIO(simg)
    
    # JPEG issue https://github.com/python-pillow/Pillow/issues/3863
    # try opening the image using PIL (sklearn method also works fine for png
    img_decode = Image.open(simg )    
    #pano = np.array(img_decode)
    pano = np.asarray(img_decode)

    simg.close()

    #-- Image processing starts here
    pano_top = pano[:int(pano.shape[0]/2),:,:] # top half
    input_shape = pano_top.shape   
    output_shape = (input_shape[0]*2, input_shape[0]*2)

    def fisheye_in_polar(coords):
        x = coords[:,0]
        y = coords[:,1]
        x_center = output_shape[0]/2 # Check this
        y_center = x_center

        #  dist from center, sqrt2 accounts for square shape. where >1 is undefined 
        r = np.sqrt( (x - x_center)  ** 2 + (y - y_center) ** 2)
        r = r / max(r) * np.sqrt(2)   

        # polar angle, theta, with origin set to the center
        y_invert_centered = y[::-1] - y_center
        x_centered = x - x_center
        theta = np.arctan2(y_invert_centered, x_centered) 

        # scale theta between 0 and 1
        theta[theta<0] += 2*np.pi 
        theta /= 2*np.pi
  
        return np.vstack((r, theta)).T

    def polar_to_equidistant(r_theta):
        r, theta = r_theta[:,0], r_theta[:,1]
        max_x, max_y = input_shape[1]-1, input_shape[0]-1
        xs = theta * max_x
        ys = r * max_y # First change here
        return np.hstack((xs, ys))

    def inverse_map(fisheye_xy):
        polar = fisheye_in_polar(fisheye_xy)
        equi_xy = polar_to_equidistant(polar)
        return equi_xy 

    polar_top = warp(pano_top, inverse_map, output_shape=output_shape)

    # scale to 0 -255
    polar_top = ((polar_top - polar_top.min()) * (1/(polar_top.max() - polar_top.min()) * 255)).astype('uint8')
     
    #-- Image processing ends here    

    # output 
    hemi_img = Image.fromarray(polar_top) # TODO remove dependency
    buf = io.BytesIO()
    hemi_img.save(buf, 'PNG')

    buf.seek(0)
    img_str = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')   
    
    img_tag = document.getElementById('fig')
    img_tag.src = img_str
    buf.close()

	 `);
	document.getElementById("loadtxt").innerHTML = "Processing succeeded";
	processSuccess=1;
	
    }
    catch(err) {
	
	document.getElementById("loadtxt").innerHTML = "Processing error: open browser console for more infomation";
    }	
    finally {
	document.getElementById('load').setAttribute("class", ".hide-loader");
	
    }	
    
    
}


//html download requires a href
function prepHref(linkElement) { 
    var myImage = document.getElementById('fig'); 
    linkElement.href = myImage.src;
    
} 



// https://github.com/naturalis/Hemiphot
function pyCalcLAI() {


    
    if (processSuccess==0){
	document.getElementById("loadtxt").innerHTML = "Reproject image before estimating LAI";
    }else {

	// reset image before proceeding
	fig.src=pyodide.globals.get("img_str");
	
	try {
	
	    pyodide.runPython(`

            from js import document            
            import io
            import base64    
            import numpy as np
            
            # load the image and remove b64 start string
            str_base64 = document.getElementById("fig").getAttribute("src").split(",")[1]
            simg = base64.b64decode(str_base64)
            simg = io.BytesIO(simg)
    
            img_decode = Image.open(simg ) # close this?    
            im_hemi = np.asarray(img_decode) / 255.0

            simg.close()  # needed?
             
            # load threshold value 
            threshold = float(document.getElementById("threshold").value)
            
            def image2hemiphot(im_hemi): 
                # get shape params
                cy,cx,_ = im_hemi.shape
                cy = cy / 2  # y center
                cx = cx / 2  # x center
                cr = cy - 2  # radius TODO check math
                return cx,cy,cr

            def threshold_image(im_hemi,threshold):
                im_hemi[im_hemi>threshold] = 1
                im_hemi[im_hemi<=threshold] = 0 # TODO check this
                return im_hemi

            cx,cy,cr = image2hemiphot(im_hemi)
            im_blue = im_hemi[:,:,2]
            im_thres = threshold_image(np.copy(im_blue), threshold)
            
            def calc_gap_fractions(im_segment,circ_params):
                # calculate gap fractions on 89 circles
                deg2rad = np.pi / 180
                steps = np.arange(360) + 1
                cx,cy,cr = circ_params
                circles = np.arange(89) + 1
                gap_fractions = np.zeros(89)
    
                for i in circles:
                    x = np.round(cx + np.cos(steps*deg2rad)*i*cr/90.,0)
                    y = np.round(cy + np.sin(steps*deg2rad)*i*cr/90.,0)
                    for j in steps:
                        gap_fractions[i-1] = gap_fractions[i-1] + im_segment[int(y[j-1])-1, int(x[j-1] ) -1  ]
    
                return np.array(gap_fractions) / 360.0

            def calc_LAI(gap_fractions,width=6):
                # angles of LAI2000
                # weights given by Licor canopy analyzer manual
                deg2rad = np.pi/180.0
                angle = np.array([7, 23, 38, 53, 68])                  
                wi = np.array([0.034, 0.104, 0.160, 0.218, 0.494])  
                T = np.zeros(5)
    
                for i in (-6,-5,-4,-3,2,1,0,1,2,3,4,5,6):
                    angle_idx = angle + i - 1
                    T =  T + gap_fractions[angle_idx]
    
                T = T/(2*width +1)    
                return  2 * np.sum(-np.log(T) * wi * np.cos(angle*deg2rad))


            gap_fractions = calc_gap_fractions(im_thres,(cx,cy,cr))
            LAI = calc_LAI(gap_fractions) # slight difference in some
            
            
            # output 
            
            im_thres = (im_thres * 255).astype('uint8')
    
            out_img = Image.fromarray(im_thres) # TODO remove dependency
            buf = io.BytesIO()
            out_img.save(buf, 'PNG')

            buf.seek(0)
            img_str_thres = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')   
            buf.close() 

            #img_tag = document.getElementById('fig')
            #img_tag.src = img_str

            `);

	    var LAI = pyodide.globals.get("LAI").toFixed(2); 
	    document.getElementById("loadtxt").innerHTML = "LAI estimated as " + LAI +  " m<sup>2</sup>/m<sup>2</sup> (threshold=" + document.getElementById("threshold").value +  ")";
	    document.getElementById("lai_output").innerHTML = "LAI estimated as " + LAI +  " m<sup>2</sup>/m<sup>2</sup> (threshold=" + document.getElementById("threshold").value +  ")";

	    
	    // set image to binary
	    fig.src=pyodide.globals.get("img_str_thres");
	    document.getElementById("checkbox").checked = true;
 
	}
	catch(err) {
	    
	    document.getElementById("loadtxt").innerHTML = "Processing error: open browser console for more infomation";
	}	
	finally {
	    document.getElementById('load').setAttribute("class", ".hide-loader");
	
	}

    }
}

//html download requires a href
function switchImage() {

    if(pyodide.globals.get("img_str_thres")==undefined) {
	document.getElementById("lai_output").innerHTML = "Cannot show threshold image until LAI has been estimated"
	return;
    }
    if (document.getElementById("checkbox").checked == true){
	
	fig.src=pyodide.globals.get("img_str_thres");
    }
    else{
	fig.src=pyodide.globals.get("img_str");

    }
} 
