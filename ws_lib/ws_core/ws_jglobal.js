/*
 *  This file is part of Websico: online Web Site Composer, http://websico.net
 *  Copyright (c) 2009-2017 Websico SAS, http://websico.com
 *  Author: O.Seston
 *
 *  This is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  It is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this file. If not, see <http://www.gnu.org/licenses/>.
 *  
 *  --------------------------------------------------------------------------
 *	GLOBAL OPERATIONS IN ANY MODE
 *  ---------------------------------------
 */

//	Globals set by bodystart.php
//	----------------------------
var ws_mode;

//	Add event listener kind of compatibility for old browsers, not only IE
//  Probably buggy, should be revisited.....
//	Useful only in visitor mode, we assume addEventListener() is available in edit modes (IE9+)
//	-------------------------------------------------------------------------------------------
var ws_addWindowHandler = function(event_name, handler){
    if (window.addEventListener)
        ws_addWindowHandler = window.addEventListener;
    else if (window.attachEvent)
        ws_addWindowHandler = function(event_name, handler){
            window.attachEvent('on' + event_name, handler);
        };
    else {
        ws_addWindowHandler = function(event_name, handler) {
        	var old_handler = window['on' + event_name] ? window['on' + event_name] : function(){};
        	window['on' + event_name] = function() {old_handler(); return handler();};
        };
    }
    ws_addWindowHandler(event_name, handler);
};

//  If I'm in an info window, I become suicidal when my parent dies..
//  -----------------------------------------------------------------
if (self.name == 'ws_info_window')
    setInterval(function(){if (!self.opener || self.opener.closed) self.close()}, 500);

//	An ugly attempt to fix containers height:
//	We are in a flexible (horizontal and vertical) layout made of an undefined
//	of imbricated rows and columns in an undefined depth arrangement.
//	We'd like each container would get 100% height of it's container, with a
//	controlled repartion of space for it's contents.
//  The css flexible box model would be a solution (in theory), when it'll be
//  really specified and widely implemented, which is not the case for now (2012).
//  So we use a table model (implemented in html table for old browsers and in css
//	for modern ones) and even with that we encounter issues and limitations
//	(relative height computing of table rows by a certain browser, you can guess
//	which one, including version 8).
//	Issues coming from different behaviours of different browsers
//	and from margins, borders and paddings do not facilitate the job.
//  So it's more secure to hard fix here...
//  Some parts of code are only for browsers that don't like css display: table
//	---------------------------------------------------------------------------
var ws_containerList = new Array();				// Setup by Display() of each container
var ws_rTout = 0;
ws_addWindowHandler("load", ws_computeLayout, false);
ws_addWindowHandler("resize", function(){
							clearTimeout(ws_rTout);
							ws_rTout = setTimeout(function(){ws_computeLayout(true)}, 10); // Not too often
						}, false);

function ws_computeLayout(withReset) {

	// Loops start from the first container contained by the page,
	// the page being the last one in the list
	if (withReset) {  
		// First we reset height of involved containers (useful when resizing window)
		for (var i = ws_containerList.length-2; i >= 0; i--) {
			var elt = ws_containerList[i];
			elt.style.height = '';
			// ***** All that stuff should be forgotten when IE7- is dead
			if (WS_HTML_TABLED){
			    for (wrapper = elt.firstChild; wrapper; wrapper = wrapper.nextSibling){
			        if (wrapper.className
							&& wrapper.className.indexOf('stretchWrapper') != -1){
			            wrapper.style.height = '';
					}
				}
			}
		}
		if (WS_HTML_TABLED) {
		    var tds = document.getElementById('firstContainer').getElementsByTagName('TD');
		    for (var j = 0; tds[j]; j++) {  // Don't remember why it's useful...
		        tds[j].height = '';
			}
		}
			// *****
	}
	//  Then we fix them
	var ws_alpha_part = new RegExp(/[^0-9.\-]+.*/);
	ws_fixTable(document.getElementById('firstContainer')); // ***** IE7-
	for (var i = ws_containerList.length-2; i >= 0; i--) {
		var elt = ws_containerList[i];

		// The system container case
		// If alone in its cell, it's heighted like its parent 
		if (elt.ws_props & WS_SYSTEM_CONTAINER && elt.ws_props & WS_ALONE
				/*if this one is not stretched => && !(elt.ws_owner.ws_props & WS_VALIGN && elt.ws_props & WS_HORIZONTAL_CONTAINER)*/) {
			var newHeight = ws_actualHeight(elt.ws_owner);
			var computedStyle;
			if (!(elt.ws_owner.ws_props & WS_SYSTEM_CONTAINER)) {
				computedStyle = elt.ws_owner.currentStyle || window.getComputedStyle(elt.ws_owner, null);
				newHeight -= computedStyle.borderTopWidth.replace(ws_alpha_part, '') * 1
							+ computedStyle.borderBottomWidth.replace(ws_alpha_part, '') * 1
							+ computedStyle.paddingTop.replace(ws_alpha_part, '') * 1
							+ computedStyle.paddingBottom.replace(ws_alpha_part, '') * 1;
			} else {
			    // Fix parent cell height, otherwise it might grow (in a vertical container)
				elt.ws_owner.style.height = ws_actualHeight(elt.ws_owner) + 'px';
			}
			elt.style.height = newHeight + 'px';
		    // ***** All that stuff should be forgotten when IE7- is dead
		    if (WS_HTML_TABLED && elt.tagName == 'TABLE'){
				ws_fixTable(elt);
			}
			// *****
		}

		// The stretched user container case
		else if (!(elt.ws_props & WS_SYSTEM_CONTAINER) && elt.ws_props & WS_VALIGN) {
		    elt.ws_owner.style.verticalAlign = 'top';   // To squeeze top space
			var lastContent = document.getElementById(elt.ws_owner.ws_lastContentId);
			var computedStyle = lastContent.currentStyle || window.getComputedStyle(lastContent, null);
			var lastContentBottom = lastContent.getBoundingClientRect().bottom
									+ computedStyle.marginBottom.replace(ws_alpha_part, '') * 1;
			computedStyle = elt.ws_owner.currentStyle || window.getComputedStyle(elt.ws_owner, null);
			var ownerInnerBottom = elt.ws_owner.getBoundingClientRect().bottom
								- computedStyle.paddingBottom.replace(ws_alpha_part, '') * 1
								- computedStyle.borderBottomWidth.replace(ws_alpha_part, '') * 1;
			if (lastContentBottom < ownerInnerBottom || ws_permissions & P_EDIT) {
			    // If there is available room we wrap the block contents
				// in a valignable html block, unless valign is top and mode is visitor
				if (!elt.ws_outerWrapper && (!(elt.ws_props & WS_VALIGN_T) || ws_permissions & P_EDIT)) {
					var insideClass = elt.ws_props & WS_VALIGN_T ? "top" :
					                    elt.ws_props & WS_VALIGN_M ? "middle" : "bottom";
					if (WS_HTML_TABLED) {    // Should disappear with IE7-
					    var outerWrapper = document.createElement('table');
					    var innerWrapper = document.createElement('td');
						outerWrapper.appendChild(document.createElement('tbody'));
						outerWrapper.firstChild.appendChild(document.createElement('tr'));
						outerWrapper.firstChild.firstChild.appendChild(innerWrapper);
					} else {
					    var outerWrapper = document.createElement('div');
					    var innerWrapper = document.createElement('div');
						outerWrapper.appendChild(innerWrapper);
					}
				    outerWrapper.className = "stretchWrapper";
				    innerWrapper.className = insideClass;
				    while (e = elt.firstChild) {
						innerWrapper.appendChild(e);
					}
					elt.appendChild(outerWrapper);
					elt.ws_innerWrapper = innerWrapper;
					elt.ws_outerWrapper = outerWrapper;
				}
				computedStyle = elt.currentStyle || window.getComputedStyle(elt, null);
				var newHeight = elt.getBoundingClientRect().bottom - elt.getBoundingClientRect().top
								- computedStyle.borderTopWidth.replace(ws_alpha_part, '') * 1
								- computedStyle.borderBottomWidth.replace(ws_alpha_part, '') * 1
								- computedStyle.paddingTop.replace(ws_alpha_part, '') * 1
								- computedStyle.paddingBottom.replace(ws_alpha_part, '') * 1
								+ ownerInnerBottom - lastContentBottom;
				if (elt.ws_owner.ws_props & WS_SYSTEM_CONTAINER) {
					// Fix parent cell height, otherwise it might grow (in a vertical container)
					elt.ws_owner.style.height = ws_actualHeight(elt.ws_owner) + 'px';
				}
				elt.style.height = newHeight + 'px';
			    // ***** All that stuff should be forgotten when IE7- is dead
			    if (WS_HTML_TABLED){
				    for (wrapper = elt.firstChild; wrapper; wrapper = wrapper.nextSibling){
				        if (wrapper.className
								&& wrapper.className.indexOf('stretchWrapper') != -1){
				            wrapper.style.height = elt.style.height;
						}
					}
				}
				// ****
			}
		}
	}
	// In case of edition mode
	if (window.$Drag && $Drag.cellResize && $Drag.cellResize.buildLimits)
		$Drag.cellResize.buildLimits();
	if (window.ws_selectedElement)
	    ws_highlightElement();

	// Responsive cols
//	ws_fixCols(); 	// Not so good idea ?
}
function ws_fixTable(elt){
	// If tabled layout (IE7-) we have to fix
	// all tds before resizing their contents...
    var tds = elt.getElementsByTagName('TD');
    var heights = [];
    for (var j = 0; tds[j]; j++) {  // get heights before resizing any td
        heights[j] = ws_actualHeight(tds[j]);
	}
    for (var j = 0; tds[j]; j++) {
        var parent = tds[j].parentNode;
		while (parent = parent.parentNode) {
		    if (parent.tagName == 'TABLE') {
		        if (parent == elt)
			        tds[j].style.height = heights[j] + 'px';
		        break;
			}
		}
	}
}

//  More actual and accurate offsetHeight (apparently)
function ws_actualHeight(elt){
	return (elt.getBoundingClientRect().height
			|| (elt.getBoundingClientRect().bottom - elt.getBoundingClientRect().top)
			|| elt.offsetHeight);
}

// Column reduction in responsive mode
// -----------------------------------
var ws_fixCols = function(){
	var edges =[];
	var depth = 1;
	var maxDepth = 5;
	return function(){
		if (!(ws_permissions & P_EDIT)) {
			while (edges[depth-1] && document.body.clientWidth > edges[depth-1] + 20){
				depth--;
				document.body.className = document.body.className.replace(' squeeze' + depth, '');		
				edges[depth] = 0;
			}
			while (document.body.scrollWidth > document.body.clientWidth && depth <= maxDepth) {
				if (document.body.className.indexOf(' squeeze' + depth) == -1) {
					document.body.className += ' squeeze' + depth;
					edges[depth++] = document.body.clientWidth;
				}
			}
		}
	};
}();

//	Special command keys (mode switch, gallery control, ...)
//  Use bestial method to be sure with all browsers.
//	--------------------------------------------------------
document.onkeydown =
	function(event) {
		var event = window.event || event;
		if ($Gallery && $Gallery.active >= 0) { // Gallery keydowns in general handler, beuark..
		    if (event.keyCode == 27) {									// ESC
		    	$Gallery.hide();
			} else if (event.keyCode == 39 || event.keyCode == 32) {	// Right arrow or space bar
				$Gallery.show($Gallery.active + 1);
			} else if (event.keyCode == 37) {							// Left arrow
				$Gallery.show($Gallery.active - 1);
            } else {
    			return true;
            }
        } else if (event.keyCode == 123 && event.altKey && event.shiftKey) {	// ALT + SHIFT + F12
        	ws_reloadRequest({mode: (ws_mode == WS_DEBUG ? 0 : WS_DEBUG)});
        } else if (event.keyCode == 123 && event.altKey && !ws_dont_explore) {	// ALT + F12
			ws_reloadRequest({mode: (ws_mode == WS_EXPLORE ? 0 : WS_EXPLORE)});
        } else if (event.keyCode == 123 && event.shiftKey) {					// SHIFT + F12
        	ws_reloadRequest({mode: (ws_mode == WS_PREVIEW ? 0 : WS_PREVIEW)});
        } else if (event.keyCode == 123) {                                      // F12
          	ws_reloadRequest({mode: (ws_mode == WS_EDIT ? 0 : WS_EDIT)});
        } else {
			return true;
		}
        return false;
	};

function ws_onclick_badge(event) {
	if (!event.ctrlKey) {
		if (event.altKey && event.shiftKey)
			ws_reloadRequest({mode: (ws_mode == WS_DEBUG ? 0 : WS_DEBUG)});
	    else if (event.altKey)
	        if (!ws_dont_explore)
	            ws_reloadRequest({mode: (ws_mode == WS_EXPLORE ? 0 : WS_EXPLORE)});
	        else
	            return false;
		else if (event.shiftKey)
			ws_reloadRequest({mode: (ws_mode == WS_PREVIEW ? 0 : WS_PREVIEW)});
		else
			ws_reloadRequest({mode: (ws_mode == WS_EDIT ? 0 : WS_EDIT)});
		event.cancelBubble = true;
		return false;
	}
}

/*  GALLERY MANAGEMENT
 *  ------------------*/
var $Gallery;		// Global gallery object unique instance
ws_addWindowHandler("load",
	function(){
		$Gallery = new function(){
		    // Public members
		    this.show = show;
		    this.hide = hide;
			this.active = -1;
			this.control;           		// The control layer
			this.movieControl = movieControl;
			this.setMoviePeriod = setMoviePeriod;
			this.moviePeriod = 2500;		// In millisecond unit
			//
			var me = this;      // To prevent 'this' confusions by external calls
			var windowWidth, windowHeight;
		    var hideControl;
			var movie, movieTimer;
			var movieImg = document.createElement('img');	// To load it in cache
			movieImg.src = WS_CORE_PATH + 'ws_images/ws_gallery_play.gif';
			var movieOnImg = document.createElement('img');	// To load it in cache
			movieOnImg.src = WS_CORE_PATH + 'ws_images/ws_gallery_pause.gif';

			// Build table of images and set onclick callbacks
			images = [];
			var links = document.getElementsByTagName('a');
			for (var i = 0, j = 0; i < links.length; i++) {	// Images encapsulated in a link of class "zoomable"
				if (links[i].firstChild && links[i].firstChild.tagName == 'IMG' && links[i].className.indexOf("zoomable") != -1) {
					var a = links[i];
					var img = a.firstChild;
					images[j] = {
						thumbNail: img,
						path: a.href,
						width: img.width,
						height: img.height,
						img: document.createElement('img'),
						loaded_path: 0,
						requested_path: 0,
						progressImg: document.createElement('img')	// Each one has it's own progress bar (this is because of concurrence issues)
					};
					images[j].progressImg.className = "progressBar";
					images[j].progressImg.src = WS_CORE_PATH + 'ws_images/ws_progress.gif';
					images[j].img.ws_galleryIndex = j;
					var caption = links[i].parentNode.getElementsByTagName('div');
					for (var k = 0; caption[k]; k++){
					    if (caption[k].className == 'ws_img_caption') {
							images[j].caption = caption[k].innerHTML;
							break;
						}
					}
					a.ws_gIndex = j++;
					a.onclick = function(event){
									event = window.event || event;
									if (window.ws_cancelAction) ws_cancelAction();
									me.show(this.ws_gIndex);
									gallery.onmousemove();   // To show controls
									event.cancelBubble = true;
									return false};
					a.onmousedown = function(event){return false};
					img.onmouseover = function(){loadImage(this.parentNode.ws_gIndex); return false};
				}
			}

			// Build DOM elements
			if (images.length) {

				// Gallery image
				var gallery = document.createElement('div');
				gallery.onmousemove = function() {
					clearTimeout(hideControl);
					ws_setOpacity($Gallery.control, 0.6);
					hideControl = setTimeout(function(){ws_setOpacity($Gallery.control, 0)}, 3000);
					};
				gallery.appendChild(document.createElement('div'));	// Just to build a first child, will be replaced by progressBar
				img = gallery.appendChild(document.createElement('img'));
				img.className = "image";
				img.onclick = gallery.onmousemove;

				// Control layer
				this.control = gallery.appendChild(document.createElement('div'));
				this.control.className = "control";
				this.control.innerHTML =
					'<a href="javascript:$Gallery.hide()"><img src="' + WS_CORE_PATH + 'ws_images/ws_close.png" class="close"></a>'				
					+ '<a href="javascript:$Gallery.show($Gallery.active - 1)"><img src="' + WS_CORE_PATH + 'ws_images/ws_gallery_previous.gif" class="previous"></a>'				
					+ '<a href="javascript:$Gallery.show($Gallery.active + 1)"><img src="' + WS_CORE_PATH + 'ws_images/ws_gallery_next.gif" class="next"></a>';				
				counter = this.control.appendChild(document.createElement('div'));
				counter.className = "counter";
				movieMapImg = this.control.appendChild(document.createElement('img'));
				movieMapImg.src = movieImg.src;
				movieMapImg.className = 'play';
				movieMapImg.useMap = "#controlMap";
				var map = this.control.appendChild(document.createElement('map'));
				map.id = "controlMap";
				map.name = "controlMap";
				map.innerHTML =
					'<area href="javascript:$Gallery.movieControl()" coords="0,0,25,25">'
					+ '<area href="javascript:$Gallery.setMoviePeriod($Gallery.moviePeriod/2 - 1)" coords="30,0,55,25">'
					+ '<area href="javascript:$Gallery.setMoviePeriod($Gallery.moviePeriod*2 + 1)" coords="60,0,88,25">';
				caption = this.control.appendChild(document.createElement('div'));
				caption.className = "caption";

				// Add event handlers
				// Keydown is in general keydown handler
				ws_addWindowHandler("resize", resize, false);
				resize();	// To set initial size
			}

			function show(i) {
				i = (i < 0) ? images.length - 1 : (i >= images.length) ? 0 : i;

				// Progress bar
				gallery.replaceChild(images[i].progressImg, gallery.firstChild);
				gallery.firstChild.style.left = (document.documentElement.clientWidth - gallery.firstChild.width) / 2 + 'px';
				me.active = i;

				// Caption and counter
				if (images[i].caption) {
					caption.innerHTML = images[i].caption;
					caption.style.display = '';
				} else {
					caption.style.display = 'none';
				}
				counter.innerHTML = (i+1) + '/' + images.length;

				// Image
				var ratio = Math.min(windowWidth / images[i].width, windowHeight / images[i].height);
				var width = images[i].width * ratio;
				var height = images[i].height * ratio;
				img.style.width = width + 'px';
				img.style.height = height + 'px';
				img.style.marginTop = (document.documentElement.clientHeight - height) / 2 + 'px';
				img.src = images[i].loaded_path || images[i].thumbNail.src;
				loadImage(i);
				loadImage(i + 1);
				loadImage(i - 1);

				// Page obfuscation must happen after scroll savings
				document.body.appendChild(gallery);
				var page = document.getElementById('outerContainer');
				if ((pageToolBar = document.getElementById('ws_pageToolbar'))) {
					pageToolBar.style.display = 'none';
					page = page.parentNode;
				}
				if (!page.style.display.length) {
					savedScrollX = ws_getScrollX();
					savedScrollY = ws_getScrollY();
				}
				page.style.display = 'none';
				document.body.className = 'gallery';
				window.scroll(0, 0);
			}

			function loadImage(i) {		// Load images
				i = (i < 0) ? images.length - 1 : (i >= images.length) ? 0 : i;
				var gImg = images[i];

				// For some browsers it's really better to size image with the help of a server php
				var imagePath = gImg.path;
				if (imagePath != gImg.requested_path) {	// Some acrobatics because .src is modified by browser
					gImg.requested_path = imagePath;
					gImg.img.ws_galleryIndex = i;
					gImg.progressImg.style.visibility = 'visible';
					gImg.img.onload = function() {
						var gImg = images[this.ws_galleryIndex];
						gImg.loaded_path = gImg.requested_path;
						gImg.progressImg.style.visibility = 'hidden';
						if (me.active == this.ws_galleryIndex) {
							img.src = this.src;
							// To avoid FF & IE little resizing caused by border
			            	img.style.width = '';
			            	img.style.height = '';
			            }
						};
					gImg.img.src = gImg.requested_path;
				}
			}

			function resize() {			// Resize window
				windowWidth = document.documentElement.clientWidth - 40;
				windowHeight = document.documentElement.clientHeight - 40;
			//	progressBar.style.left = (document.documentElement.clientWidth - progressBar.width) / 2 + 'px';
				if ((i = me.active) >= 0)
					show(i);
			}

			function hide() {			// Hide gallery
				if (me.active >= 0) {
				    var page = document.getElementById('outerContainer');
					if ((pageToolBar = document.getElementById('ws_pageToolbar'))) {
						pageToolBar.style.display = '';
						page = page.parentNode;
					}
					document.body.className = '';
					document.body.removeChild(gallery);
			        // The display reset must be after removeChild (for IE8, probably a sequencing issue)
					page.style.display = '';
					document.body.focus();	// To clear blinking cursor with FF (!?)
					clearTimeout(hideControl);
					movieControl(0);
					me.active = -1;
					// Very strange but the scroll must be at the end,
			        // otherwise at best it's not done and at worst the gallery is not hidden (IE8)
					window.scroll(savedScrollX, savedScrollY);
				}
			}

			function movieControl(action) {
				movie = arguments.length ? action : !movie;
				clearInterval(movieTimer);
				if (movie) {
					movieMapImg.src = movieOnImg.src;
					movieTimer = setInterval(function(){$Gallery.show($Gallery.active + 1)}, me.moviePeriod);
				} else {
					movieMapImg.src = movieImg.src;
				}
			}

			function setMoviePeriod(period) {
				if (movie) {
					me.moviePeriod = period;
					if (me.moviePeriod < 0) me.moviePeriod = 0;
					movieControl(1);
				}
			}
		}
	}, false);

//	MENU SHOW/HIDE
//	--------------
function ws_showMenu(menuId) {
	var menu = document.getElementById(menuId);
	var parentItem = menu.parentNode;
	if (menu && !menu.ws_active) {
		menu.ws_active = true;
		var parentA = menu.parentNode.getElementsByTagName('a')[0];
		if (parentA.className.indexOf(' hover') == -1)
			parentA.className += ' hover';
		// Don't display if yet displayed, especially when in tree mode (forced or media queried)
		var computedStyle = menu.currentStyle || window.getComputedStyle(menu, null);
	  	if (computedStyle['display'] != 'block') {
			menu.style.display = 'block';			// When hidden display is set to 'none', to disapear from layout
			menu.style.fontSize = '100%';			// To keep font-size same as parent
			if (!menu.ws_displayed) {
				parentItem.appendChild(menu);	// This is to display over parent (works with IE, in place of z-index..)
				var scrollX = ws_getScrollX();
				var scrollY = ws_getScrollY();
				var parentX = parentItem.offsetLeft;
				var parentY = parentItem.offsetTop;
				menu.style.margin = 0;				// To be close to parent
				// Try normal position
				var viewportRight = document.documentElement.clientWidth + scrollX;
				if (parentItem.parentNode.className == "horizontal") {
					menu.style.top = '';
					menu.style.left = '';
					menu.style.minWidth = parentItem.offsetWidth + 'px';
					if (menu.getBoundingClientRect().right > viewportRight)
						menu.style.left = parentX - (menu.offsetWidth - parentItem.offsetWidth) + 10 + 'px';
				} else {
					menu.style.top = parentY + 'px';
					menu.style.left = parentX + parentItem.offsetWidth - 10 + 'px';
					if (menu.getBoundingClientRect().right > viewportRight)
						menu.style.left = parentX - menu.offsetWidth + 10 + 'px';
				}
				// Adjust position in case of overflow
				if ((overflow = menu.getBoundingClientRect().bottom - document.documentElement.clientHeight) > 0)
					menu.style.top = parentY - overflow + 'px';
				var menuRect = menu.getBoundingClientRect();
				if (menuRect.top < 0)
					menu.style.top = scrollY + 'px';
				if (menuRect.left < 0)
					menu.style.left = scrollX + 'px';
			}
			menu.ws_displayed = true;
			ws_overPopup = 1;						// To hide some maintenance targets
		}
	}
}
function ws_hideMenu(menuId) {
	var menu = document.getElementById(menuId);
	if (menu && menu.ws_active) {
		menu.ws_active = false;
		setTimeout(function(){
            			if (!menu.ws_active){
							menu.style.display = '';	// Reset css displayability, 'none' or 'block'
							menu.style.margin = '';		// Reset css margin, useful for mediaqueried tree
            				ws_overPopup = 0;
            				var parentA = menu.parentNode.getElementsByTagName('a')[0];
            				parentA.className = parentA.className.replace(' hover', '');
            				menu.ws_displayed = false;
            			}
                    }, 100);
	}
}
function ws_reducedMenuButtonClick(event, menu) {
	if (!(event.metaKey || event.ctrlKey)) {
		var nav = menu.getElementsByTagName('nav')[0];	// The list of links to show or hide
		if (!nav.style.opacity) {
			nav.className = menu.className;				// To get the background and other props
			nav.style.top = menu.getBoundingClientRect().top + ws_getScrollY() + 50 + 'px';
			nav.style.opacity = 1;
		} else {
			nav.style.opacity = '';
			setTimeout(function(){nav.className = ''; nav.style.top = '-1000%'}, 500);	// To let enough time for smooth opacity change
		}
	}
}

//	USER SELECTION
//	--------------
function ws_userSelect(objectId, check) {
	var cdata = '';
	if (document.cookie.search('wsc_selected=') != -1) {
		cdata = document.cookie.replace(/.*wsc_selected=([^;]*).*/, '$1');
	  	cdata = cdata.replace(objectId, '');
	  	cdata = cdata.replace(/^,*/, '');
	  	cdata = cdata.replace(/(,*)$/, '');
	  	cdata = cdata.replace(/,,*/g, ',');
	}
	if (check) {
	  	if (cdata.length) cdata += ',';
	  	cdata += objectId;
	}
	d = new Date(new Date().getTime() + 30*24*3600*1000).toGMTString();
	document.cookie = 'wsc_selected=' + cdata + '; expires=' + d;
}

//	GET WINDOW SCROLL VALUES
//	Chrome compatibility
//	------------------------
function ws_getScrollX() {
	return document.documentElement.scrollLeft || document.body.scrollLeft;
}
function ws_getScrollY() {
	return document.documentElement.scrollTop || document.body.scrollTop;
}

//	COOKIES MANAGEMENT
//	------------------
//	Thanks to Peter-Paul Koch, www.quirksmode.org
//	---------------------------------------------
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ')
			c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0)
			return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

//	SET HTML ELEMENT OPACITY
//	------------------------
//	Not too many opacity manip with IE because of well known font anti-aliasing issue:
//	anti-aliasing fall back in 'standard' even if 'cleartype' is used on the user os,
//	with surprising bad visual effect in some cases.
//	So we must use it with (great) care...,
//	so great care that it's sometimes not called for IE :)
//	----------------------------------------------------------------------------------
function ws_setOpacity(element, opacity) {
	element.style.zoom = 1;		// Element must have layout to take filter in account (IE specific..)
	element.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + opacity*100 + ')';
	element.style.opacity = opacity;
}

//	MISC UTILS
//	----------

//	String manipulation
//	-------------------
function ws_bsn2nl(s) {
	return s.replace(/\\n/g, "\n");
}

//  Setup some element members
//  Called at the end of body element
//  ---------------------------------
function ws_setupElements() {
	var all = document.getElementById('outerContainer').getElementsByTagName('*');
	for (i = 0; i < all.length; i++){
		var elt = all[i];
	    if (properties = elt.getAttribute('data-props')) {
	        properties & WS_CONTAINER ? ws_containerList.push(elt) : ws_componentList.push(elt);
	        if (properties & WS_BUBBLE && properties & WS_ALONE)
				ws_bubbleElements.push(elt);
	    	elt.ws_props = properties;
			ownerId = elt.getAttribute('data-owner');
	    	elt.ws_owner = properties & WS_PAGE_CONTAINER ? 0 : document.getElementById(ownerId);
	    	elt.ws_lastContentId = elt.getAttribute('data-last_content');
		}
    }
}

//	Reload actual page with query variables
//	---------------------------------------
function ws_reloadRequest(variables) {
    var sep = "?";
	for (var i in variables) {
		str = new String(location.href);
		if (location.search) {
			var match = str.match(new RegExp('([?&])' + i + '=[^&#]*'));
		    if (match) {
	        	str = str.replace(match[0], match[1] + i + "=" + variables[i]);
	        	if (str.indexOf('?') == -1 && str.indexOf('&') != -1)
	        		str = str.replace(/(^[^&]+)&/, '$1?');
			} else {
		        str += "&" + i + "=" + variables[i];
			}
		} else if (location.hash) {
		        str = str.replace("#", "?" + i + "=" + variables[i] + "#");
		} else {
			str += sep + i + "=" + variables[i];
			sep = "&";
		}
	}
	location.href = str;
}

//	Mail address decode for mailto link
//	-----------------------------------
function Disp(str, obj) {
	var res = "";
	for(var i = 0; i < str.length; i++)
			res += String.fromCharCode(str.charCodeAt(i) + i%4 - 1);
	if (obj)
    	obj.href = 'mailto:' + res;
    return res;
}

//	Open miniWindow
//	---------------
/*var ws_miniWindow = 0;
function miniWindow(url, width, height) {
  	if (ws_miniWindow)
  		ws_miniWindow.close();	// To be recreated on top
  	if (!width) width = 100;
  	if (!height) height = 100;
	ws_miniWindow = open(url,'miniWindow','resizable, scrollbars, width=' + width + ', height=' + height);
}*/

//  User popup on top, obfuscating the page contents
//  ------------------------------------------------
function ws_popupElement(element, style, days, onClose){
	if (element.nodeType == 1)
		var id = element.id;
	else if (typeof element == "string")
		var id = element.substr(element.lastIndexOf('/') + 1);
	else
		return false;
	if (days == -1 || !readCookie('ws_' + id + '_closed')){
	    var popupWrapper = document.createElement('div');
	    popupWrapper.className = 'ws_popup_wrapper';
	    popupWrapper.innerHTML =
			'<div class="ws_popup_inner_wrapper" onclick="var target = event.target || event.srcElement; if (target == this) {ws_close_' + id + '(); return false}">'
				+ '<div id="ws_' + id + '" class="ws_popup" style="' + style + '">'
					+ '<a href="javascript:ws_close_' + id + '()" title="Close" class="ws_close_popup">&nbsp;</a>'
					+ '<div id="ws_' + id + '_body"></div></div>'
			+ '</div>';
	    document.body.appendChild(popupWrapper);
		window['ws_close_' + id] = function(){
			createCookie('ws_' + id + '_closed', 'yes', days);
		    document.body.removeChild(popupWrapper);
		    if (window.ws_cancelAction) window.ws_cancelAction();
		    if (onClose) onClose();
		};
		if (element.nodeType == 1) {
			element.style.display = 'block';
			document.getElementById('ws_' + id + '_body').appendChild(element);
		} else {
			ws_getElementById(element, 'ws_' + id + '_body');
		}
		// Must setup maxHeight by program, because doesn't work fine in percentage
		// with css property and FF or Safari or...
		document.getElementById('ws_' + id).style.maxHeight = document.documentElement.clientHeight*0.8 + 'px';
		ws_addWindowHandler("resize", function(){
				var popup = document.getElementById('ws_' + id);
				if (popup)
					popup.style.maxHeight = document.documentElement.clientHeight*0.8 + 'px';
			}, false);
	}
}

//	BUBBLE ELEMENTS, Smart Scrolling
//	Because of IE slowness we can't update top coordinate
//	each time (it flicks), so we fix top of the element for
//	for each case, and that leads to some complexity(!!)
//	-------------------------------------------------------
var ws_bubbleElements = [];
onscroll = function(){
	var alpha_part = new RegExp(/[^0-9.\-]+.*/);
	var fixedTop = 1;
	var fixedBottom = 2;
	var inContainer = 3;
	var lastScroll = ws_getScrollY();
	return function(){
		var scroll = ws_getScrollY();
		// Page toolbar
		if (mainToolbar = document.getElementById('ws_pageToolbar')){
			var tBarRect = mainToolbar.getBoundingClientRect();
			if (scroll == 0)
				mainToolbar.style.zIndex = '';
			else
				mainToolbar.style.zIndex = '12';
			if (document.documentElement.className.indexOf('ws_hideMenu') == -1) {
				document.getElementById('outerContainer').style.marginTop = mainToolbar.offsetHeight + 'px';
				mainToolbar.style.position = 'fixed';
			} else {
				document.getElementById('outerContainer').style.marginTop = 0;
				mainToolbar.style.position = '';
			}
/*			if (scroll == 0 || (scroll > lastScroll && mainToolbar.style.position == 'fixed')) {
				mainToolbar.style.position = 'absolute';	// So we have not to modify margin of outerContainer
				mainToolbar.style.top = scroll + 'px';
			} else if (scroll < lastScroll && mainToolbar.style.position != 'fixed'){
				if (mainToolbar.offsetTop < scroll - mainToolbar.offsetHeight) {
					mainToolbar.style.top = scroll - mainToolbar.offsetHeight + 'px';
				} else if (tBarRect.top >= 0) { 
					document.getElementById('outerContainer').style.marginTop = mainToolbar.offsetHeight + 'px';
					mainToolbar.style.position = 'fixed';
					mainToolbar.style.top = 0;
				}
			}*/
		} 
		// Bubble elements
		for (i in ws_bubbleElements) {
			var elt = ws_bubbleElements[i];
			var container = elt.ws_owner;
			var eltStyle = elt.currentStyle || window.getComputedStyle(elt, null);
			var margin = {
					top: eltStyle.marginTop.replace(alpha_part, '') * 1,
					bottom: eltStyle.marginBottom.replace(alpha_part, '') * 1};
			var eltHeight = elt.offsetHeight + margin.top + margin.bottom;
			if (eltHeight < container.offsetHeight) {
				var windowBottom = document.documentElement.clientHeight;
				var eltRect = elt.getBoundingClientRect();
				var eltTop = eltRect.top - margin.top;
				var eltBottom = eltRect.bottom + margin.bottom;
				var containerRect = container.getBoundingClientRect();
				var containerTop = containerRect.top;
				var containerBottom = containerRect.bottom;
				if (!elt.bubbleStatus
						&& (eltTop < 0 && eltHeight < windowBottom)
						|| (eltTop > 0 && elt.bubbleStatus == inContainer)) {
					fixElt(fixedTop);
				} else if (elt.bubbleStatus != fixedBottom
						&& ((eltTop < 0 && eltBottom < windowBottom && containerBottom > windowBottom)
							|| (eltTop > 0 && eltBottom > windowBottom && eltHeight + containerTop < windowBottom))) {
					fixElt(fixedBottom);
				} else if ((elt.bubbleStatus == fixedBottom && scroll < lastScroll)
							|| (elt.bubbleStatus == fixedTop && scroll > lastScroll && eltHeight > windowBottom)
							|| eltBottom > containerBottom) {
					fixElt(inContainer);
				} else if (!(elt.ws_props & WS_BUBBLE)	// May have changed in edition mode 
						|| (elt.bubbleStatus && eltTop <= containerTop)) {
					elt.style.top = '';
					elt.style.position = '';
					elt.style.width = '';
					container.style.width = '';
					elt.bubbleStatus = 0;
				}
			}
			// In case of edition mode
			if (elt == window.ws_selectedElement)
			    ws_highlightElement();
		}
		lastScroll = ws_getScrollY();
		
		function fixElt(bubbleStatus){
			if (bubbleStatus == inContainer) {
				elt.style.position = 'relative';
				elt.style.top = Math.min(containerBottom - containerTop - eltHeight, eltTop - containerTop) + 'px';
			} else {
				elt.style.width = elt.offsetWidth
							- eltStyle.paddingLeft.replace(alpha_part, '') * 1
							- eltStyle.borderLeftWidth.replace(alpha_part, '') * 1
							- eltStyle.paddingRight.replace(alpha_part, '') * 1
							- eltStyle.borderRightWidth.replace(alpha_part, '') * 1
							+ 'px';
				// container is supposed to have no padding/border
				container.style.width = container.offsetWidth + 'px';
				elt.style.position = 'fixed';
				if (bubbleStatus == fixedTop)
					elt.style.top = 0;
				else
					elt.style.top = windowBottom - eltHeight + 'px';
			}
			elt.bubbleStatus = bubbleStatus;
		}
	};}();

//  DROP-DOWN CONTAINER
//  -------------------
function ws_dropDown(id){
    if (eltToDropDown = document.getElementById(id)){
        if (eltToDropDown.className == 'dropDownOpen')
            eltToDropDown.className = 'dropDownClosed';
        else
            eltToDropDown.className = 'dropDownOpen';
    }
	// In case of edition mode
    // Timeout because of transition
	if (window.$Drag && $Drag.cellResize && $Drag.cellResize.buildLimits)
		setTimeout($Drag.cellResize.buildLimits, 1000);
}

/*
CSS Browser Selector v0.4.0 (Nov 02, 2010)
Rafael Lima (http://rafael.adm.br)
http://rafael.adm.br/css_browser_selector
License: http://creativecommons.org/licenses/by/2.5/
Contributors: http://rafael.adm.br/css_browser_selector#contributors
*/
function css_browser_selector(u){var ua=u.toLowerCase(),is=function(t){return ua.indexOf(t)>-1},g="gecko",w="webkit",s="safari",o="opera",m="mobile",h=document.documentElement,b=[(!(/opera|webtv/i.test(ua))&&/msie\s(\d)/.test(ua))?("ie ie"+RegExp.$1):is("firefox/2")?g+" ff2":is("firefox/3.5")?g+" ff3 ff3_5":is("firefox/3.6")?g+" ff3 ff3_6":is("firefox/3")?g+" ff3":is("gecko/")?g:is("opera")?o+(/version\/(\d+)/.test(ua)?" "+o+RegExp.$1:(/opera(\s|\/)(\d+)/.test(ua)?" "+o+RegExp.$2:"")):is("konqueror")?"konqueror":is("blackberry")?m+" blackberry":is("android")?m+" android":is("chrome")?w+" chrome":is("iron")?w+" iron":is("applewebkit/")?w+" "+s+(/version\/(\d+)/.test(ua)?" "+s+RegExp.$1:""):is("mozilla/")?g:"",is("j2me")?m+" j2me":is("iphone")?m+" iphone":is("ipod")?m+" ipod":is("ipad")?m+" ipad":is("mac")?"mac":is("darwin")?"mac":is("webtv")?"webtv":is("win")?"win"+(is("windows nt 6.0")?" vista":""):is("freebsd")?"freebsd":(is("x11")||is("linux"))?"linux":"","js"]; c = b.join(" "); c=c.toUpperCase();h.className += " "+c; return c;}; css_browser_selector(navigator.userAgent);
