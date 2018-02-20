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
 *	MAIN JAVASCRIPT AND UTILITIES
 *  ---------------------------------------
 */

// SOME CONDERATIONS ABOUT STRUCTURE OF THE CLIENT SIDE
// ----------------------------------------------------
// This main script contains all essential elements, like foundation objects,
// general initialisations and setups, common routines and functions.
//
// In general case, all operations result from user actions associated with a form,
// and this form will be submitted to the server with resulting POST data.
//
// So the essential objects are forms, associated with their multiple handlers.
// The forms are introduced in the DOM on the fly, only when necessary, to
// avoid DOM overloading. The forms HTML is scripted to be cached by the browser,
// saving around 50KB of bandwidth on each access (august 2012).
//
// NAMING RULES
// ------------
// $Xxxx for unique instance of global objects
// ws_xxxXxx for global identifier (ie members of DOM objects, as window, document etc.)
// ws_XxxXxx for global object constructor ('class')
// WS_XXXXXX for global constant
// xxxXxx for local identifier (ie members of Websico objects, as functions etc.)


//  Global objects
//  --------------
var $Forms;             // Forms HTML strings, parameters, handlers and utilities
var $Drag;				// Object for all drag/drop operations (almost)
var $Str;               // Message strings

var ws_containerList = new Array();				// Setup by Display() of each container
var ws_componentList = new Array();				// Setup by Display() of each component

//  Put timezone offset of the client in a cookie to be used later by php
//  ---------------------------------------------------------------------
document.cookie = "timezoneOffset=" + (-((new Date()).getTimezoneOffset())) + ";path=/";

//	Tells the server the next request will be a reload unless it's an explicit submission
//	(not set by php because of inconsistencies in the path when the cookie is set by js and php,
//	it must be set always by the same side)
//  --------------------------------------------------------------------------------------------
document.cookie = "ws_submit=reload;path=/";

//  Overload some document event handlers
//  -------------------------------------
document.onkeydown =
	(function(oldHandler) {
		// Keydown handler has been set up by jglobals,
		// we add specific edition controls
		return function(event) {
                event = event || window.event;
				var target = event.target || event.srcElement;

                // ESC -- Cancel current action
				if (event.keyCode == 27) {
                    ws_cancelAction();
                    return oldHandler(event);   // In case of gallery active...
                }
                // TAB -- Preselect container of preselected element if no active popup
				else if (event.keyCode == 9 && ws_preselected && $Forms.active == $Forms.defaultActive){
                    ws_lowlightElement(ws_preselected);
                    while ((ws_preselected = ws_preselected.ws_owner)
                            && ws_preselected.ws_props & WS_SYSTEM_CONTAINER) {}
                    ws_preselected = ws_preselected || ws_preselectedByMouse;
					ws_highlightElement(ws_preselected);
                }
                // ENTER -- Submit active form if target of event is an input field
				else if (event.keyCode == 13 && target.tagName == "INPUT")
					$Forms.active.submit();
                // ENTER -- Simulate a click on preselected element if any
				else if (event.keyCode == 13 && ws_preselected && !ws_selectedElement){
                    ws_selectElement(ws_preselected);
                    ws_selectedElement.ws_updateW.show(event);
                }
				// CTRL + S -- Submit active form        
				else if ((event.metaKey || event.ctrlKey) && event.keyCode == 83)
					$Forms.active.submit();
                // CTRL + C -- Copy preselected element to clipboard
				else if (ws_preselected && (event.metaKey || event.ctrlKey) && event.keyCode == 67
							 && $Forms.active == $Forms.defaultActive && document.activeElement.tagName != 'INPUT')
    				ws_ElementForm.toClipboard();
                // CTRL + X -- Cut and copy preselected element to clipboard
				else if (ws_preselected && (event.metaKey || event.ctrlKey) && event.keyCode == 88
							 && $Forms.active == $Forms.defaultActive && document.activeElement.tagName != 'INPUT')
    				ws_ElementForm.toClipboard(event, 'forget');
				// CTRL + V -- Paste from clipboard
				else if (ws_preselected && !ws_selectedElement && (event.metaKey || event.ctrlKey) && event.keyCode == 86)
    				ws_ElementForm.fromClipboard();
				// OTHERS -- Do old action
				else
					return oldHandler(event);
				// PROCESSED
				return false;
			}
	})(document.onkeydown);
document.ws_default_onmousemove = null;			// Default defaults (modified, sometimes...)
document.ws_default_onmouseup = null;
document.ws_default_onmousedown = null;
document.ws_default_onkeydown = document.onkeydown;
document.ws_default_onkeyup = document.onkeyup;

//	Callback on resize window to display window geometry
//	----------------------------------------------------
addEventListener("resize", function(){
        if (document.onmousemove == document.ws_default_onmousemove) {  // Because of IE when moving popups out of window
			var movingLabel = document.getElementById('ws_movingLabel');
            movingLabel.innerHTML = document.documentElement.clientWidth + ' x ' + document.documentElement.clientHeight;
            movingLabel.className = "windowResize";
            movingLabel.style.cssText = '';
    		movingLabel.onmouseover = function(){this.className = ''};
        }
	}, false);

//  Callback onload
//  ---------------
addEventListener("load", function(){
		ws_mouseCacheOff();					// Cache is active during loading
		$Forms.wstextarea_form.build();		// It's a long setup, we do it now to mask it (FF)
		$Forms.ws_style_form.build();		// It's a long setup, we do it now to mask it (FF)
	}, false);

//--------------------------------------------------------------------------
//  				COMMON ELEMENT MOUSE EVENT HANDLERS
//--------------------------------------------------------------------------
document.documentElement.onmouseout = function(event){
    event = event || window.event;
    target = event.relatedTarget || event.toElement;
    if (ws_preselected && !target)
        ws_lowlightElement(ws_preselected);
};
document.documentElement.ontouchstart = function(event){
    event = event || window.event;
};

function ws_onmouseoverElement(event, elt){
    elt.onmouseover = function(event){
        if (ws_preselected && ws_preselected != elt)
            ws_lowlightElement(ws_preselected);
        ws_highlightElement(elt, elt.ws_props & WS_CONTAINER ? 300 : 200);
        ws_preselectedByMouse = elt;
        ws_preselected = elt;
        (event || window.event).cancelBubble = true;
        return false;
    };
    elt.onmousedown = function(event){return ws_eltOnmousedown(event || window.event, ws_preselected || elt)};
    elt.onclick = function(event){return ws_eltOnclick(event || window.event, ws_preselected || elt)};
    elt.oncontextmenu = function(event){return ws_eltOncontextmenu(event || window.event, ws_preselected || elt)};
    elt.ondblclick = ws_styleEditPopup;
    elt.onmouseover(event);
    if (elt.ws_props & WS_IMAGE)	// Not the ideal place but must be in a javascript (not php)
    	elt.onmousemove = function(event) {$Drag.eltResize.check(event, this)};
}
function ws_isStandardTarget(event){
	var target = event.target || event.srcElement;
	var standardTarget = {INPUT: 1, TEXTAREA: 1, SELECT: 1, A: 1, LABEL: 1};
	// A click on a standard target keep the default handling, excepted if ctrl or alt is down
	// (alt for IE because ctrl mask onclick event...) or it's a mousedown on a link
	// svg className is not a text, so indexOf doesn't exist, so we test if it exists ;)
  	return (!(event.ctrlKey || event.altKey)
	  		&& (target.tagName in standardTarget || target.parentNode.tagName == 'A' || (target.className.indexOf && target.className.indexOf('customLink') != -1))
			&& !(event.type == 'mousedown' && (target.tagName == 'A' || target.parentNode.tagName == 'A')))	// link or img in link
}
function ws_eltOnmousedown(event, element){
	if (ws_isStandardTarget(event))
		return true;
	ws_selectElement(element);
	$Drag.prepare(event);
	event.cancelBubble = true;
	return false;
}
function ws_eltOnclick(event, element){
	if (ws_isStandardTarget(event)){
        ws_cancelAction();
		return true;
    }
    if (ws_selectedElement)
        ws_selectedElement.ws_updateW.show(event, 0, 200);	// delay to let dblclick work and hide the update window
	event.cancelBubble = true;
	return false;
}
function ws_eltOncontextmenu(event, element) {
	ws_selectElement(element);
	ws_selectedElement.ws_updateW.show(event, 0, 200);		// delay to let dblclick work and hide the update window
	event.cancelBubble = true;
	return false;
}

//--------------------------------------------------------------------------
//  					COMMON ELEMENT OPERATIONS
//--------------------------------------------------------------------------

//	SELECT
//	------
var ws_selectedElement;
var ws_preselected;
var ws_preselectedByMouse;

function ws_selectElement(elt) {
  	var was_selected = (ws_selectedElement == elt);

  	if (!was_selected)
		ws_cancelAction();
	if (elt) {
		ws_selectedElement = elt;
		ws_preselected = elt;
		// Some attributes may be used without showing the popup (^x ou ^c shortcuts ...)
		if (!elt.ws_type) {
		    elt.ws_type = elt.getAttribute('ws_class'); // Don't use the name ws_class for IE8-, confusion with the attribute
			elt.ws_updateW = $Forms[elt.ws_type + '_form'].build();
			elt.ws_updateForm = elt.ws_updateW.DOMElement;
            elt.ws_cssSubselectorOptions = new Array($Str.elementSubselector)
                    .concat($Str['subselectorList_' + elt.ws_type] || $Str.subselectorList.slice(0));
            elt.ws_doNotIncludeInForm = elt.ws_type == 'wssform' || elt.getElementsByTagName('form').length;
        }
		ws_highlightElement();
	}
	return was_selected;
}

//	CANCEL ACTION IN PROGRESS
//	-------------------------
function ws_cancelAction() {
	if (elt = ws_selectedElement) {
        ws_restoreStyle(true);      // Should be done in elt.ws_cancelAction, but not obvious to init that
        if (elt.ws_cancelAction) {
        	elt.ws_cancelAction();	// Specific action on element
			delete elt.ws_cancelAction;
		}
		if (elt.ws_updateW && elt.ws_updateW.lastAttachedElt)
			delete elt.ws_updateW.lastAttachedElt;
	}
	if (document.selection)         // Useful when aborting drag element or... (IE8-)
		document.selection.clear();
    document.getElementById('ws_pageToolbar').reset();
	document.getElementById('ws_movingLabel').className = '';
	$Forms.hide();                // Must be done before unselect element
	ws_clearHighlights();
    ws_selectedElement = 0;
    ws_preselected = 0;
	ws_computeLayout(true);
	ws_mouseCacheOff();
	$Forms.ws_sitemap_form.restore();
	if (hlBtn = document.getElementById("highLight_btn"))
		hlBtn.ws_control.setValue(true);
	document.onmousemove = document.ws_default_onmousemove;
	document.onmouseup = document.ws_default_onmouseup;
  	document.onmousedown = document.ws_default_onmousedown;
	document.onkeydown = document.ws_default_onkeydown;
	document.onkeyup = document.ws_default_onkeyup;
}

//	HIGHLIGHT
//	---------
var ws_focusObj = {selected: {top: document.getElementById('ws_se1'),
								right: document.getElementById('ws_se2'),
								bottom: document.getElementById('ws_se3'),
								left: document.getElementById('ws_se4')
								},
					unselected: {top: document.getElementById('ws_he1'),
								right: document.getElementById('ws_he2'),
								bottom: document.getElementById('ws_he3'),
								left: document.getElementById('ws_he4')
								}
					};
var ws_dhTimeout;
function ws_highlightElement(elt, delay) {
  	elt = elt || ws_selectedElement;
    clearTimeout(ws_dhTimeout);
    if (delay) {
        ws_dhTimeout = setTimeout(function(){ws_highlightElement(elt)}, delay);
    } else if (elt && (elt == ws_selectedElement || !ws_mouseCacheIsOn())
                    && (elt != ws_selectedElement
						 || !(highlight = document.getElementById("highLight_btn"))
						 || highlight.ws_control.value)) { 
		// "Border" and shadowing of the element
		ws_setOuterGeometry(elt, true);
        if (elt != ws_selectedElement && elt.className.indexOf(' ws_highlightElement') == -1){
            elt.className += ' ws_highlightElement';
            setTimeout(function(){elt.className = elt.className.replace(' ws_highlightElement', '')}, 500);
        }
	  	var focusObj = (elt == ws_selectedElement) ? ws_focusObj.selected : ws_focusObj.unselected;
	  	var thickness = (elt == ws_selectedElement) ? ws_se_thickness : ws_he_thickness;
	  	var margin = 0;
	  	var focus = focusObj.top.style;							// Top side
        focus.left = elt.ws_left - thickness - margin + 'px';
        focus.width = elt.ws_right - elt.ws_left + (2*thickness) + 2*margin + 'px';
        focusObj.top.innerHTML = '';
        if (elt.title) {
            focusObj.top.innerHTML = '<div>' + elt.title + '</div>';
	  	    focus.height = '';
        } else {
            focusObj.top.innerHTML = '';
	  	    focus.height = thickness + 'px';
        }
        focus.top = elt.ws_top - focusObj.top.offsetHeight + 'px';
	  	focus.visibility = 'visible';
		focus = focusObj.right.style;							// Right side
	  	focus.top = elt.ws_top - thickness - margin + 1 + 'px';
	  	focus.left = elt.ws_right + margin + 'px';
	  	focus.width = thickness + 'px';
	  	focus.height = elt.ws_bottom - elt.ws_top + 2*thickness + 2*margin - 2 + 'px';
	  	focus.visibility = 'visible';
	  	focus = focusObj.bottom.style;							// Bottom side
	  	focus.top = elt.ws_bottom + margin + 'px';
	  	focus.left = elt.ws_left - thickness - margin + 1 + 'px';
	  	focus.width = elt.ws_right - elt.ws_left + 2*thickness + 2*margin - 2 + 'px';
	  	focus.height = thickness + 'px';
	  	focus.visibility = 'visible';
	  	focus = focusObj.left.style;							// Left side
	  	focus.top = elt.ws_top - thickness - margin + 1 + 'px';
	  	focus.left = elt.ws_left - thickness - margin + 'px';
	  	focus.width = thickness + 'px';
	  	focus.height = elt.ws_bottom - elt.ws_top + 2*thickness + 2*margin - 2 + 'px';
	  	focus.visibility = 'visible';
	
		// Top left corner of user container
		ws_showCorner(ws_getUserContainer(elt));
	}
}

function ws_showCorner(elt) {
	if (elt && elt.ws_props & WS_CONTAINER && !(elt.ws_props & WS_SYSTEM_CONTAINER)) {
		var corner = document.getElementById('ws_block_corner');
		if (elt.ws_props & WS_FREE_CONTENTS_IN_MODEL)
            corner.src = WS_CORE_PATH + 'ws_images/ws_free_content.gif';
		else if (elt.ws_props & WS_MODEL_CONTAINER)
            corner.src = WS_CORE_PATH + 'ws_images/ws_save_model.gif';
		else
            corner.src = WS_CORE_PATH + 'ws_images/ws_embed.gif';
        var eltRect = elt.getBoundingClientRect();
		corner.style.top = eltRect.top + ws_getScrollY() + 'px';
		corner.style.left = eltRect.left + ws_getScrollX() + 'px';
		corner.style.visibility = 'visible';
		corner.onmouseover = function() {ws_highlightElement(elt);};
		corner.onmousedown = function(event) {elt.onmousedown(event); return false;}; // Tried "return elt.onmousedown(event);", but error with IE !!
		corner.onclick = function(event) {elt.onclick(event); return false;};
		corner.title = elt.title;
	} else {
		document.getElementById('ws_block_corner').style.visibility = 'hidden';
	}
}

function ws_lowlightElement(elt) {
  	if (elt && elt != ws_selectedElement) {
      	if (ws_dhTimeout)    // Must not be null for IE
            clearTimeout(ws_dhTimeout);
		for (var i=1; i<=4; i++)
			document.getElementById('ws_he' + i).style.visibility = 'hidden';
		elt.className = elt.className.replace(' ws_highlightElement', '');
		if (elt.ws_props & WS_CONTAINER)
			document.getElementById('ws_block_corner').style.visibility = 'hidden';
	}
}

function ws_clearHighlights() {
	for (var i=1; i<=4; i++) {
		document.getElementById('ws_se' + i).style.visibility = 'hidden';
		document.getElementById('ws_he' + i).style.visibility = 'hidden';
		document.getElementById('ws_block_corner').style.visibility = 'hidden';
	}
    if (ws_preselected)
        ws_preselected.className = ws_preselected.className.replace(' ws_highlightElement', ''); 
}

//--------------------------------------------------------------------------
//  					MAINTENANCE UTILITIES
//--------------------------------------------------------------------------

//	SITE INJECTION
//	--------------
function ws_inject_data(filepath){
	var request = 'ws_service.html?WS_CMD=data_injection'
	        	             + '&WS_LANG=' + ws_user_lang
	        	             + '&WS_DATA_FILE=' + filepath;
	ws_request(request, function(responseText){if (!responseText.length) location.reload(); else alert('ERROR !!\n' + responseText); ws_mouseCacheOff();});
}

//	REQUEST TO THE SHOP OF MODELS
//	-----------------------------
function ws_importModel(modelShopUrl){
	modelShopUrl = modelShopUrl || ws_default_model_shop;
	ws_cancelAction();
	var w = $Forms.ws_import_model;
	w.show(0, WS_FIXEDPOSITION|WS_MODAL);
	var i = document.getElementById('ws_import_model_body');
	i.src = modelShopUrl + '?mode=0&WS_CMD=export_model&WS_REQUEST_URL=' + location.host + location.pathname + '&WS_SITENAME=' + ws_site_name + '&WS_ID=' + readCookie('ws_session_' + ws_site_name);
	i.style.height = w.DOMElement.offsetHeight - 100 + 'px';
}

//  INFO PANEL
//  ----------
function ws_openInfo(pageName, anchor) {
    var doc;
    var hideControl;

    if (!(doc = document.getElementById('ws_docDOMObject'))){
        doc = document.createElement('div');
        doc.id = 'ws_docDOMObject';
        doc.onmouseover = function(){
                    var control = document.getElementById('ws_docControl');
					clearTimeout(hideControl);
					control.className = 'visible';
					hideControl = setTimeout(function(){control.className = 'hidden'}, 2000);
                    this.className = 'open';
                    };
        var control = document.createElement('div');
        control.id = 'ws_docControl'; 
        control.className = 'hidden';
        control.innerHTML = 
            '<a href="javascript:void(0)" onclick = "document.getElementById(\'ws_docDOMObject\').className = \'closed\'; return false" title="Close">X</a>';
        doc.appendChild(control);
        doc.innerHTML += 
            '<iframe id="ws_docIframe"></iframe>';
        document.body.appendChild(doc);
    }
    anchor = anchor || 'info';
    document.getElementById('ws_docIframe').src = WS_HELP_SERVER + '/' + ws_lang + '/' + pageName + '.html#' + anchor;    
    doc.className = 'open';
}

//	WINDOW EVENT CACHE
//	------------------
//	The cache is inserted over the window to prevent mouse events 
//	propagation during resizing or other mouse driven operation,
//  or modal popup display.
//	-------------------------------------------------------------
ws_mouseCacheOn('waitForPage');

function ws_mouseCacheOn(className) {
  	var cache = document.getElementById('ws_mouse_cache');
    if (!cache.offsetHeight || cache.className != className) {	// To limit reflow
        cache.className = className || '';
    	cache.style.width = '100%';     // This is the best place to do that, because css is sometimes loaded after (do a reload with ff to see that)
    	cache.style.height = '100%';
    }
}
function ws_mouseCacheOff() {
  	var cache = document.getElementById('ws_mouse_cache');
  	cache.className = '';	// To reset cursor
  	if (cache.offsetHeight)
		cache.style.width = cache.style.height = '0';
}
function ws_mouseCacheIsOn() {
	return (document.getElementById('ws_mouse_cache').offsetHeight != 0);
}

//  GET ABSOLUTE GEOMETRY OF AN OBJECT, INCLUDING MARGINS
//  -----------------------------------------------------
function ws_setOuterGeometry(elt, force) {
    if (force || !elt.ws_margins) {
        elt.ws_inline = ws_actualStyleValue('display', elt).indexOf('inline') === 0;
        elt.ws_margins = (elt.ws_props & WS_PAGE_CONTAINER) ?
            {top: 0, right: 0, bottom: 0, left: 0} :
            {
                top: ws_actualStyleValue('marginTop', elt).replace(ws_alpha_part, '') * 1,
                right: ws_actualStyleValue('marginRight', elt).replace(ws_alpha_part, '') * 1,
                bottom: ws_actualStyleValue('marginBottom', elt).replace(ws_alpha_part, '') * 1,
                left: ws_actualStyleValue('marginLeft', elt).replace(ws_alpha_part, '') * 1
            };
    }
	var eltRect = elt.getBoundingClientRect();
	var x = eltRect.left + ws_getScrollX();
	var y = eltRect.top + ws_getScrollY();
	elt.ws_top = y - elt.ws_margins.top;
	elt.ws_right = x + elt.offsetWidth + elt.ws_margins.right;
	elt.ws_bottom = y + elt.offsetHeight + elt.ws_margins.bottom;
	elt.ws_left = x - elt.ws_margins.left;
}

//  RETURN BROKEN ELEMENT TITLE
//  ---------------------------
function ws_breakTitle(elt) {
    var brokenTitle = {title: elt.title};
    if (ws_getModelContainer(elt, 1)
            && (breakIndex = brokenTitle.title.lastIndexOf('(')) != -1) {
        brokenTitle.subtitle = brokenTitle.title.substring(breakIndex);
        brokenTitle.title = brokenTitle.title.substring(0, breakIndex);
    }
    if ((breakIndex = brokenTitle.title.indexOf(' - ')) != -1) {
        brokenTitle.title = brokenTitle.title.substring(0, breakIndex);
    }
    return brokenTitle;
}

//	SOME CONTAINER UTILITIES
//	------------------------
function ws_getUserContainer(elt) {
  	do {
        elt = elt.ws_owner;
  	} while (elt && (elt.ws_props & (WS_SYSTEM_CONTAINER | WS_PAGE_CONTAINER)));
	return elt;
}

function ws_getModelContainer(elt, skipElt) {
	if (!elt)
		return false;
    if (skipElt && elt.ws_props & WS_MODEL_CONTAINER)
        if (!(elt = elt.ws_owner) || elt.ws_props & WS_FREE_CONTENTS_IN_MODEL)
            return false;
  	while (!(elt.ws_props & WS_MODEL_CONTAINER) && (elt = elt.ws_owner))
        if (elt.ws_props & WS_FREE_CONTENTS_IN_MODEL)
            return false;
	return elt;
}

function ws_aloneInContainer(elt, containerType) {
    if (!containerType)
        return (elt.ws_props & WS_ALONE);
  	while (elt.ws_props & WS_ALONE && (elt = elt.ws_owner))
	  	if (elt.ws_props & containerType)
	  		return elt;
	return false;
}

function ws_isVisible(elt){
    var visible = true;            // DropDown block case
    while((elt = elt.parentNode) && (visible = (elt.offsetHeight !== 0))) ; 
    return visible;
}

//	Get element location
//	--------------------
function ws_getLocation(elt) {
	var location = '';
	while (elt && elt.ws_owner) {
		location = elt.getAttribute('ws_index') + '.' + location;
		elt = elt.ws_owner;
	}
	return location;
}

//	PRELOAD IMAGES
//	--------------
function preloadImages() {
	if (!document.preloadArray)
		preloadArray = new Array();
	var i = preloadArray.length;
	for (var j = 0; j < PreloadImages.arguments.length; j++) {
		preloadArray[i] = new Image;
		preloadArray[i++].src = preloadImages.arguments[j];
	}
}

//	SHOW OBJECT PROPERTIES
//	----------------------
function popupProperties(inobj) {
	op = window.open();
	op.document.open("text/html");
	for (objprop in inobj) {
		op.document.write("-***-" + objprop + ' => ' + inobj[objprop] + '<br>');
	}
	op.document.close();
	op.focus();
}

//	OBJECT CLONE
//	------------
function ws_clone(obj) {
	if(!obj || typeof(obj) != 'object')
		return obj;
	var objectClone = new obj.constructor();
	for (var i in obj)
		objectClone[i] = ws_clone(obj[i]);
	return objectClone;
}

//	HEX CONVERSIONS
//	---------------
var ws_hexByte = new Array();
for (var i = 0; i < 16; i++) {
	ws_hexByte[i] = '0' + ws_d2h(i);
}
for (var i = 16; i < 256; i++) {
	ws_hexByte[i] = ws_d2h(i);
}
function ws_d2h(d) {
	var hD="0123456789ABCDEF";
	var h = hD.substr(d&15, 1);
	while(d>15) {d >>= 4; h = hD.substr(d&15, 1) + h;}
	return h;
}
function ws_h2d(h) {return parseInt(h,16);}

//	UPPERCASE FIRST CHARACTER OF A STRING
//	-------------------------------------
function ws_ucFirst(s) {
	return s.charAt(0).toUpperCase() + s.substring(1);
}

//	A COMBINATION OF HTML SPECIAL CHARS ENCODE DECODE
//	AND NEWLINES CONVERSIONS
//	-------------------------------------------------
function ws_bsn2br_special(s) {
	s = s.replace(/&/g, "&amp;");
	s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	return s.replace(/\\n/gi, "<br />");
}
function ws_br2bsn_special_decode(s) {
	s = s.replace(/<br[ \/]*>/gi, "\\n");
	s = s.replace(/&amp;/g,"&");
	s = s.replace(/&quot;/g,'"').replace(/&#039;/g,"'");
	return s.replace(/&lt;/g,"<").replace(/&gt;/g,">");
}
function ws_bsn2nl_special(s) {		// For submit input type
	s = s.replace(/&/g, "&amp;");
	s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	return s.replace(/\\n/g, '&#010;');
}
 