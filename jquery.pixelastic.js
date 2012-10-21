/*
    Pixelastic - jQuery Plugin
    Version 1.0
    www.pixelasticjs.com
    
    By Mike Ferron (www.mikeferron.com)
    Released under MIT License / GPL License
*/

(function(jQuery){
    jQuery.pixelastic = function(el, options){

        var base = this;
        
        // Access to jQuery and DOM versions of element
        base.$el = jQuery(el);
        base.el = el;
        
        // Manage our data object
        if(base.$el.data('pixelastic') == undefined)
        {
            // Add a reverse reference to the DOM object
            base.$el.data("pixelastic", base);
        }else{
            // Use the existing object if already initialized
            base = base.$el.data('pixelastic');
        }

        // Public methods
        base.methods = {   
            //
            // Fit the image to its parent                  
            resize : function(){
                base.helpers.runFit();
            },

            //
            // Bind the window resize event
            bindListener : function(){
                jQuery(window).bind('resize.pixelastic', base.methods.resize);
            },

            //
            // Unbind the window resize event
            unbindListener : function(){
                jQuery(window).unbind('resize.pixelastic');
            }
        }

        // Not so public methods
        base.helpers = {

            //
            // Get it started in here
            init: function()
            {
                base.options = jQuery.extend({},jQuery.pixelastic.defaultOptions, options);

                if(base.imgW == undefined || base.imgH == undefined)
                {
                    base.$el.css('position', base.options.position);
                    base.$el.css('overflow', 'hidden');
                    base.$el.css('background-color', base.options.background_color);

                    // Attempt to grab the dimensions of the image
                    if(!base.helpers.fitPrep())
                    {
                        // Not loaded, we'll wait
                        base.$el.children('img').bind("load.pixelastic", base.helpers.fitPrep);

                        if(base.options.overlay)
                        {
                            // Put up the overlay
                            var overlay = jQuery("<div></div>");
                            overlay.css('width', '100%').css('height', '100%');
                            overlay.css('position', 'absolute').css('top', '0').css('left', '0');
                            overlay.css('background', 'black');
                            overlay.attr('class', 'pixelastic-overlay');
                            base.$el.prepend(overlay);
                        }
                    }
                }

                if (base.options.bind_resize)
                    base.methods.bindListener();
            },

            //
            // Resolve our image's native dimensions, and set up the overlay
            fitPrep : function(){
                // Reference to image
                var img = base.$el.children('img');
                
                // Grab the native dimensions of the image by creating a copy off to the side
                var imageTmp = new Image();
                imageTmp.src = img.attr("src");
                
                base.imgH = imageTmp.height;
                base.imgW = imageTmp.width;
                
                //  Get rid of it
                imageTmp = null;
                
                // Sanity check
                if(base.imgW == 0 || base.imgW == 0)
                    return false;
                    

                var img = base.$el.children('img');

                base.options.position_x = base.helpers.reformatPosition(base.options.position_x);
                base.options.position_y = base.helpers.reformatPosition(base.options.position_y);


                newW = base.$el.width();
                newH = base.$el.height();

                if(base.supported_browser)
                {
                    // Configure our style rules for the background image
                    base.$el.css("background-image", "url("+img.attr('src')+")");
                    base.$el.css("background-position", (base.options.position_x * 100) + "% " + (base.options.position_y * 100) + "%");
                    base.$el.css("background-repeat", "no-repeat");

                    // Get rid of the child image, or not
                    if(base.options.clean)
                        img.remove();
                    else
                        img.css("visibility", "hidden");

                }else{

                    img.css("width", newW + "px").css('height', newH + "px");

                    //we need a sub-container to allow overflow functionality
                    var container = jQuery("<div></div>");
                    container.css("width", "100%").css("height", "100%").css("overflow", "hidden").css("position", "relative");
                    img.appendTo(container);
                    container.appendTo(base.$el);
                }
                
                base.helpers.runFit();

                // Fade out and get rid of the overlay, if present
                base.$el.children('.pixelastic-overlay').fadeOut(function(){
                    jQuery(this).remove();
                });

                if(base.options.constrain)
                    base.$el.css("max-width", base.imgW+"px").css("max-height", base.imgH+"px");

                return true;
            },

            //
            // Execute desired fit function
            runFit : function()
            {
                if(base.imgW == 0 || base.imgW == 0)
                    return
                
                switch(base.options.fit_type)
                {
                    case "cover":
                        base.helpers.coverFit();
                        break;
                    case "width":
                        base.helpers.widthFit();                     
                        break;
                    case "height":
                        base.helpers.heightFit();
                        break;
                    case "contain":
                        base.helpers.containFit();
                        break;
                    case "focus":
                        base.helpers.focusFit();
                        break;
                }
            },

            //
            //  Fill container with image, clip as necessary
            coverFit : function()
            {
                newW = base.$el.width();
                newH = base.$el.height();

                var pHeight = base.imgH / base.imgW;
                var pWidth = base.imgW / base.imgH;

                if(base.supported_browser)
                {
                    base.$el.css("background-position", (base.options.position_x * 100) + "% " + (base.options.position_y * 100) + "%");

                    if(base.options.use_best_css)
                    {
                        base.$el.css("background-size", "cover");
                    }else{
                        //Calculate Manually
                        if ((newH / newW) < pHeight)
                            base.$el.css("background-size", newW + "px " + pHeight * newW + "px");
                        else
                            base.$el.css("background-size", pWidth * newH + "px " + newH + "px");
                    }
                }else{
                    var img = base.$el.find('img');
                    if ((newH / newW) < pHeight)
                        img.css("width", newW + "px").css('height', pHeight * newW + "px");
                    else
                        img.css("width", pWidth * newH + "px").css('height', newH + "px");

                    img.css("position", "absolute");
                    img.css("top", (newH - img.height())*base.options.position_y);
                    img.css("left", (newW - img.width())*base.options.position_x);
                }
            },

            //
            // Fit image into container, clip height if applicable
            widthFit : function()
            {
                newW = base.$el.width();
                newH = base.$el.height();

                if(base.supported_browser)
                {
                    base.$el.css("background-size", "100% " + Math.round(base.imgH*(newW/base.imgW)) + "px");
                    base.$el.css("background-position", "50% 50%");
                }else{
                    var img = base.$el.find('img');
                    img.width('100%').height(Math.round(base.imgH*(img.width()/base.imgW)));
                    img.css('margin', 'auto');
                } 
            },

            //
            // Fit image into container, clip width if applicable
            heightFit : function()
            {
                newW = base.$el.width();
                newH = base.$el.height();

                if(base.supported_browser)
                {
                    base.$el.css("background-size", Math.round(base.imgW*(newH/base.imgH)) + "px 100%");
                    base.$el.css("background-position", "50% 50%");
                }else{
                    var img = base.$el.find('img');
                    img.height('100%').width(Math.round(base.imgW*(img.height()/base.imgH)));
                    img.css('margin', 'auto');
                }
            },

            //
            // Fit image into container, no clip
            containFit : function()
            {
                if(base.options.use_best_css)
                {
                    base.$el.css("background-size", "contain");
                }else{
                    newW = base.$el.width();
                    newH = base.$el.height();

                    var rW = newW / base.imgW;
                    var rH = newH / base.imgH;

                    if(rH > rW)
                        base.helpers.widthFit();
                    else
                        base.helpers.heightFit();
                }
            },

            //
            //  
            focusFit : function()
            {
                newW = base.$el.width();
                newH = base.$el.height();

                var x, y;

                if(base.options.constrain)
                {
                    x = base.imgW;
                    y = base.imgH;
                }else{
                    x = Math.max(newW, base.imgW);
                    y = Math.max(newH, base.imgH);
                }

                if(base.supported_browser)
                {
                    base.$el.css("background-position", (base.options.position_x * 100) + "% " + (base.options.position_y * 100) + "%");
                    base.$el.css("background-size", x + "px " + y + "px");
                }else{
                    var img = base.$el.find('img');
                    img.css("width", x).css("height", y);

                    img.css("top", (newH - img.height())*base.options.position_y);
                    img.css("left", (newW - img.width())*base.options.position_x);
                }
            },

            //
            // Does the browser support the desired functionality? (background-size)
            browserSupport : function()
            {
                // If Modernizr is being used, lets take advantage of that
                if(window.Modernizr)
                {
                    return Modernizr.testProp('backgroundSize');
                }else{
                    // otherwise just do it ourselves
                    var test = document.createElement('div');

                    var supported = !!(0 + test.style['background-size']);

                    return supported;
                }
            },

            //
            // utility function to standardize the position_x or position_y inputs into a single format
            // a value between 0 and 1, designating a percentage.
            reformatPosition : function(value)
            {
                switch(value)
                {
                    case "top":
                        return 0;
                        break;
                    case "bottom":
                        return 1;
                        break;
                    case "left":
                        return 0;
                        break;
                    case "right":
                        return 1;
                        break;
                    case "center":
                        return 0.5;
                        break;
                }

                var val = undefined;

                if((value.indexOf("%") != -1) || (value.indexOf("px") != -1))
                    val = parseFloat(value);

                if(isNaN(val))
                    jQuery.error( 'pixelastic: "' +  value + '" does not appear to be a valid position value.');
                else
                    return val/100;

                jQuery.error( 'pixelastic: "' +  value + '" does not appear to be a valid position value.');
            }
        } 
        
        // 
        if (base.methods[options]) {
            // Run method
            base.methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof options === 'object' || !options) {
            base.supported_browser = base.helpers.browserSupport();
            // Run initializer
            base.helpers.init();
        } else {
            jQuery.error( 'Method "' +  options + '" does not exist in pixelastic!');
        }
    };
    
    jQuery.pixelastic.defaultOptions = {
        constrain       : 1,
        fit_type        : 'cover',
        use_best_css    : 1,
        position_x      : 'center',
        position_y      : 'center',
        overlay         : 1,
        bind_resize     : 0,
        clean           : 1,
        background_color: "#000000",
        position        : "relative"
    };
    
    jQuery.fn.pixelastic = function(options){
        return this.each(function(){
            (new jQuery.pixelastic(this, options));
        });
    };
    
})(jQuery);