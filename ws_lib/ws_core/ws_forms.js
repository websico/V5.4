/*
 *  This file is part of Websico: online Web Site Composer, http://websico.net
 *  Copyright (c) 2009-2016 Websico SAS, http://websico.com
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
 *  GLOBAL FORMS OBJECT
 *  ---------------------------------------
 */
 
//  Forms are inserted on demand in the DOM, to minimize the number
//  of elements always initialized in the DOM structure; with all forms,
//  it's not a small number of unused elements (can be more than 1000).
//  Furthermore, defining the forms HTML in javascript allows to cache it
//  in the browser cache.

// STANDARD FORM CLASS
// ----------------------------------------
function ws_Form(id, setMembers){
	$Forms[id] = this;  // Put me in the global object
	this.id = id;
	setMembers.call(this);
}

// OBJECT METHODS AND PROPERTIES
// -----------------------------

// Build a standard maintenance form
// ---------------------------------
// Add standard buttons and hidden fields
ws_Form.prototype.buildForm = function(formBody, buttons, title, moreControls){
    formBody = formBody || '';
    buttons = buttons || '';
    title = title || '';
    moreControls = moreControls || '';
	return '<form class="ws_maintenance_popup" id="' + this.id + '" method="post" enctype="multipart/form-data">'
    		    + '<div class="ws_menubar">'
                    + '<span id="' + this.id + '_buttons">' + buttons + '</span>'
                    + '<span id="' + this.id + '_title" class="ws_title"> ' + title + '</span>'
                + '<div style="clear: both"></div></div>'
                + moreControls
    		    + '<div class="ws_popup_layer1">'
    			    + '<div id="' + this.id + '_subtitle" class="ws_subtitle"></div>'
    				+ '<div class="ws_popup_layer2">'
    					+ formBody
    					+ '<div class="ws_submit_pack">'
    					    + '<button class="button" onclick="$Forms.' + this.id + '.submit(); return false">' + $Str.record + '</button>'
    					    + '<button class="button" onclick="ws_cancelAction(); return false">' + $Str.cancel + '</button>'
    				    + '</div>'
    					+ '<input type="hidden" name="ws_page_id">'
    					+ '<input type="hidden" name="ws_object_location">'
    					+ '<input type="hidden" name="ws_transaction_id">'
    					+ '<input type="hidden" name="ws_scrollX">'
    					+ '<input type="hidden" name="ws_scrollY">'
    			    + '</div>'
    		    + '</div>'
            + '</form>';
};

// Build a form in the DOM then setup
// ----------------------------------
ws_Form.prototype.build = function(){
	if (!this.DOMElement) {
		var elt = document.createElement('div');              // A container for convenience
		elt.innerHTML = this.HTML;
		document.body.appendChild(elt);                       // Build it in the DOM
		this.DOMElement = elt.firstChild;
        document.body.replaceChild(elt.firstChild, elt);      // Kill the convenience container
        this.DOMElement.onmouseover = function(){ws_lowlightElement(ws_preselected)};        
		this.setup();
	}
	return this;
};

ws_Form.prototype.setup = function(){};

// Display a form
// --------------
var WS_NEARCURSOR = 1;          // Display flags
var WS_NONEXCLUSIVE = 2;
var WS_WITHEFFECT = 4;
var WS_FIXEDPOSITION = 8;
var WS_CENTER = 16;
var WS_MODAL = 32;
var WS_DRAGGABLE = 64;
var WS_ONCURSOR = 128;

var WS_NOCANCEL = 256;          // For alertAndConfirm()
var WS_NOICON = 512;
var WS_NODEFAULTFLAGS = 1024;

ws_Form.prototype.show = function(event, flags, delay){
    this.build();
	var flags = flags || 0;
	var w = this.DOMElement;
	var margin = 15;
    var wSide, wX, wY;
    var viewportWidth = document.documentElement.clientWidth;
    var viewportHeight = document.documentElement.clientHeight;

    if (!(flags & WS_FIXEDPOSITION))
	   flags |= WS_DRAGGABLE;

	if (!(flags & WS_NONEXCLUSIVE))
		$Forms.hide();

    // Fixed, draggable, or both
    w.style.position = flags & WS_FIXEDPOSITION ? 'fixed' : '';
	if (flags & WS_DRAGGABLE) {
        w.style.cursor = '';
        w.onmousedown = $Drag.dragMe;
        w.ontouchstart = w.ontouchenter = function(evt){if (evt.targetTouches.length == 1) $Drag.dragMe(evt.targetTouches[0])};
    } else {
        w.style.cursor = 'default';
        w.onmousedown = function(){};
    }
    
    // Double click on the element, sometimes the second click may occur
    // in the update window if it is positionned on the element, so the action is
	// aborted by drag operation and we have to fix that.
	var elt = ws_selectedElement;
	this.showTime = (new Date).getTime(); 
    if (elt && w == elt.ws_updateForm) {
    	var old = w.onmousedown;
    	w.onmousedown = function(event){
							if ((new Date).getTime() < elt.ws_updateW.showTime + 500)
								return elt.ondblclick(event);
							else
								return old.call(w, event);
						};
	}

    // Pseudo cursor position
    var xCur = event ? event.clientX : (viewportWidth - w.offsetWidth) / 2;
    var yCur = event ? event.clientY : (viewportHeight - w.offsetHeight) / 2;

    //  On the cursor
	if (flags & WS_ONCURSOR) {
    	wX = xCur - w.offsetWidth/2;
    	wY = yCur - w.offsetHeight/2;
    }

    //  Centered iif requested or non computable position
	else if (flags & WS_CENTER || (!event && (!ws_selectedElement  || flags & WS_NEARCURSOR))) {
    	wX = (viewportWidth - w.offsetWidth) / 2;
    	wY = (viewportHeight - w.offsetHeight) / 2;
    }

    //  Near the cursor position iif requested or no selected element
    else if (flags & WS_NEARCURSOR || !ws_selectedElement) {
		wSide = (yCur > viewportHeight/2) ? 0 : 2;
        wX = xCur - Math.round(w.offsetWidth * (1 - 0.618033));    // Divine proportion ;)
		wY = wSide ? yCur + margin : yCur - w.offsetHeight - margin;
    }

	// Compute position close to selected element
	else {
		var eltRect = ws_selectedElement.getBoundingClientRect();
		var xElt = eltRect.left;
		var yElt = eltRect.top;
	  	var sideRoom = new Array(      // Room available out each side
		  	yElt - w.offsetHeight - margin,
		  	viewportWidth - w.offsetWidth - (xElt + ws_selectedElement.offsetWidth) - margin,
		  	viewportHeight - w.offsetHeight - (yElt + ws_selectedElement.offsetHeight) - margin,
		  	xElt - w.offsetWidth - margin);
	  	var sideList = new Array(      // Distance from cursor to each side
	  		{side: 0, value: Math.abs(yCur - yElt)},
	  		{side: 1, value: Math.abs(xCur - (xElt + ws_selectedElement.offsetWidth))},
	  		{side: 2, value: Math.abs(yCur - (yElt + ws_selectedElement.offsetHeight))},
	  		{side: 3, value: Math.abs(xCur - xElt)});
	  	sideList.sort(function(a, b){return (a.value - b.value)});
	  	for (var i = 0; i < 4; i++)    // Look for nearest side with enougn room
	  		if (sideRoom[sideList[i].side] > 0)
	  			break;
	  	if (i == 4) {                  // If not enough space any side, take the largest one
	  	  	var maxRoom = sideRoom[sideList[0].side];
	  	  	var maxRoomSide = 0;
	  	  	for (i = 1; i < 4; i++) {
	  	  	  	if (sideRoom[sideList[i].side] > maxRoom) {
	  	  	  		maxRoom = sideRoom[sideList[i].side];
	  	  	  		maxRoomSide = i;
	  	  	  	}
	  	  	}
			i =  maxRoomSide;
		}
		wSide = sideList[i].side;
		if (wSide == 0) {        // And now we compute the almost final position
			wX = xCur - Math.round(w.offsetWidth * (1 - 0.618033));    // Divine proportion ;)
			wY = yElt - w.offsetHeight - margin;
		} else if (wSide == 1) {
			wX = xElt + ws_selectedElement.offsetWidth + margin;
			wY = yCur - Math.round(w.offsetHeight * 0.618033);
		} else if (wSide == 2) {
			wX = xCur - Math.round(w.offsetWidth * (1 - 0.618033));
			wY = yElt + ws_selectedElement.offsetHeight + margin;
		} else {
			wX = xElt - w.offsetWidth - margin;
			wY = yCur - Math.round(w.offsetHeight * 0.618033);
		}
	}
	// Fix target computed position to be contained in the window
	this.onshow();     // Needed here to get updated width
	wX =  Math.max(0, Math.min(viewportWidth -  w.offsetWidth - margin, wX));
	wY =  Math.max(0, Math.min(viewportHeight -  w.offsetHeight - margin, wY));
	if (w.style.position != 'fixed') {
	  	wX += ws_getScrollX();
	  	wY += ws_getScrollY();
	}
	w.style.left = wX + 'px';
	w.style.top = wY + 'px';
    w.style.visibility = 'visible'; // Visibility must be set after positionning, to avoid artefacts
    w.style.clip = 'auto';  // Right for everybody but IE8, which clips the subwindows like selectors
    if (document.documentElement.className.indexOf('IE8') != -1)
        w.style.clip = "rect(0px, 3000px, 3000px, 0px)";
    this.delayToShow = setTimeout(function(){w.style.opacity = '1'}, delay);

	// Must set to invisible some external videos,
    // otherwise the popup is not displayed in their region.
    // Actually it is player dependent, but how to detect ?
    // Change className of page inner container
    document.getElementById(ws_currentPageId).className += ' hideEmbedded';

    // The end
	if (flags & WS_MODAL)
        ws_mouseCacheOn('popupOnTop');
	this.exposed = true;
	$Forms.active = this;
};

ws_Form.prototype.onshow = function(){};

// Hide a form
// -----------
ws_Form.prototype.hide = function(){
	if (this.exposed) {
		clearTimeout(this.delayToShow);
        var w = this.DOMElement;
        w.style.clip = "rect(0px," + w.offsetWidth + "px," + w.offsetHeight + "px,0px)";
        w.style.clip = "rect(" + w.offsetHeight/2 + "px," + w.offsetWidth/2 + "px," + w.offsetHeight/2 + "px," + w.offsetWidth/2 + "px)";
	  	w.style.visibility = 'hidden';   // display none would destroy position...
        w.style.opacity = '0';
		this.exposed = false;
		if (this == $Forms.active)
		    $Forms.active = $Forms.defaultActive;
		this.onhide();
	}
};

ws_Form.prototype.onhide = function(){};

// Set form opacity
// ----------------
ws_Form.prototype.opacity = function(opacity){
	if (!document.all && this.DOMElement)     // IE breaks fonts antialiasing
		ws_setOpacity(this.DOMElement, opacity);
};

// Submit a standard maintenance form
// ----------------------------------
// Submit the form with scroll values, transaction ID and other common fields.
// Use a transaction id that will be checked
// at execution of request (ws_inits.php) to prevent reprocessing
// of same request, with potentially harmful consequences.
// This reprocessing can be caused especially by reloading a page.
// This prevents also from concurrent updates.
ws_Form.prototype.submit =
ws_Form.prototype.finalSubmit = function() {
	var f = document.getElementById(this.id);

	// Beware of the order of the tests, some permission controls are centralized here
	if ((f.ws_operation && f.ws_operation.value == 'logout') || ws_Form.checkPermission(P_WRITE)
			&& (!ws_getModelContainer(ws_selectedElement)
				|| f.ws_operation.value == 'move'
				|| !ws_Form.checkPermission(P_TRIAL_PAGES, 1))
			&& ((f.ws_operation.value != 'publish'
					&& f.ws_operation.value != 'new_page'
					&& f.id != 'ws_sitemap_form')
				|| ws_Form.checkPermission(P_ADMIN))
			){
		ws_mouseCacheOn('waitForPage'); // Inhibit interactions during submission
		f.ws_page_id.value = ws_currentUrlId;
		if (ws_selectedElement && f.ws_object_location) {
			f.ws_object_location.value = ws_getLocation(ws_selectedElement);
			if (f.ws_user_css_text)  // Must contain only general styles, and id rules for selected object (see management of object embedded rules)
				f.ws_user_css_text.value = ws_currentStyleSheet.getCssText(ws_workRule, ws_selectedElement.id);
		}
		f.ws_scrollX.value = ws_getScrollX();
		f.ws_scrollY.value = ws_getScrollY();
		f.ws_transaction_id.value = ws_transaction_id;	// Set up by bodystart
		document.cookie = "ws_submit=submit;path=/";	// Tells the server it's a real submission, not a reload
        f.submit();
    }
};

// Confirm or abort delete or drag/drop from, to, or in a model
// ------------------------------------------------------------
ws_Form.prototype.conditionalModelOperation = function(event) {
	var elt = ws_selectedElement;
	var copy = $Drag.eltMove.target && event.ctrlKey;
	var fromModel = ws_getModelContainer(elt, 1);
	var toModel = $Drag.eltMove.target ? ws_getModelContainer($Drag.eltMove.target.elt, 1) : 0;

    if (!copy && fromModel && toModel != fromModel) {
		// Drag element from or delete element from a model
        if (elt.ws_props & WS_FREE_CONTENTS_IN_MODEL)
            ws_Form.alertAndConfirm($Str.alterModel, $Str.dontRemoveFromModel);
        else if (!event.shiftKey)
            ws_Form.alertAndConfirm($Str.alterModel, $Str.removeFromModelShift);
        else
            ws_Form.alertAndConfirm($Str.alterModel, $Str.removeFromModel, this);
    } else if (toModel) {
		// Drag element to
        if (!event.shiftKey)
            ws_Form.alertAndConfirm($Str.alterModel, $Str.alterModelShiftText);
        else
            ws_Form.alertAndConfirm($Str.alterModel, $Str.alterModelText, this);
    } else {
        this.submit();
    }
};

// "STATIC" METHODS AND PROPERTIES
// -------------------------------

// Confirmation popup
// ------------------
ws_Form.alertAndConfirm = function(title, text, onSubmit, onCancel, flags){
	var f = $Forms.ws_confirm_popup.build();
	flags = flags || 0;
	var confirm = document.getElementById('ws_confirm_button');
	var cancel = document.getElementById('ws_cancel_button');
	if (onSubmit) {
        var img = 'warning.gif';
		confirm.style.display = '';
		// onSubmit is a function or a form object that will be finally submitted
		confirm.onclick = typeof(onSubmit) == 'function' ? onSubmit : function(){onSubmit.finalSubmit()};
	} else {
        var img = 'no.gif';
		confirm.style.display = 'none';
	}
	document.getElementById('ws_confirm_title').innerHTML = title || '';
    if (!(flags & WS_NOICON))
        text = '<img style="float: left; margin-right: 5px" src="ws_lib/ws_core/ws_images/'
                + img + '" />' + text;
	document.getElementById('ws_confirm_text').innerHTML = text;
	if (!(flags & WS_NODEFAULTFLAGS))
		flags |= WS_CENTER | WS_FIXEDPOSITION | WS_DRAGGABLE | WS_MODAL;
	f.show(0, flags);
	if (flags & WS_NOCANCEL) {
		cancel.style.display = 'none';
		confirm.focus();
    } else {
        cancel.onclick = onCancel || ws_cancelAction;
		cancel.style.display = '';
		cancel.focus();
    }
	return false;
};

// Check permissions
// -----------------
ws_Form.checkPermission = function(flag, negate){
	if (ws_permissions & flag) {
		if (negate)
			ws_Form.alertAndConfirm('', $Str.notAllowed, function(){ws_cancelAction()}, 0, WS_NOCANCEL);
		return true;
	} else {
		if (!negate)
			ws_Form.alertAndConfirm('', $Str.notAllowed, function(){ws_cancelAction()}, 0, WS_NOCANCEL);
		return false;
	}
};

// -----------------------------------------------------------------------------

// GLOBAL FORMS OBJECT
// ----------------------------------------
$Forms = {
	// Hide all exposed forms
	// ----------------------
	hide: function(){
		  	for (i in this){
		  	    if (this[i] && this[i].exposed)
			  		this[i].hide();
			}
			var body = document.getElementById(ws_currentPageId);
		    body.className = body.className.replace(' hideEmbedded', '');
		}
};

// ALERT AND CONFIRM
// ----------------------------------------
new ws_Form('ws_confirm_popup', function(){
	this.HTML =
		'<div class="ws_maintenance_popup" id="' + this.id + '">'
        + '<div class="ws_menubar"><span id="ws_confirm_title" class="ws_title"></span></div>'
        + '<div class="ws_popup_layer1">'
			+ '<div class="ws_popup_layer2">'
		    	+ '<div id="ws_confirm_text"></div>'
		    	+ '<div class="ws_submit_pack">'
			    	+ '<button id="ws_confirm_button" class="button">' + $Str.goOn + '</button>'
			    	+ '<button id="ws_cancel_button" class="button">' + $Str.abandon + '</button>'
		    	+ '</div>'
    	+ '</div></div>'
		+ '</div>';
});

// MOVE AN ELEMENT
// ----------------------------------------
new ws_Form('ws_element_move_form', function(){
	this.HTML =
		'<form id="' + this.id + '" method="post" style="position:absolute; visibility: hidden;">'
			+ '<input type="hidden" name="ws_scrollX">'
			+ '<input type="hidden" name="ws_scrollY">'
			+ '<input type="hidden" name="ws_page_id">'
			+ '<input type="hidden" name="ws_object_location">'
			+ '<input type="hidden" name="ws_operation" value="move">'
			+ '<input type="hidden" name="ws_element_move_to_location">'
			+ '<input type="hidden" name="ws_transaction_id">'
			+ '<input type="hidden" name="ws_element_move_to_side">'
		+ '</form>';
});

// REQUEST FOR A MODEL IN THE MODEL SHOP
// ----------------------------------------
new ws_Form('ws_import_model', function(){
	this.HTML =
		'<div class="ws_maintenance_popup" id="' + this.id + '">'
	        + '<div class="ws_menubar"><span id="ws_management_title" class="ws_title">' + $Str.importModel + '</span></div>'
	        + '<div class="ws_popup_layer1">'
				+ '<div class="ws_popup_layer2">'
			    	+ '<iframe id="ws_import_model_body"></iframe>'
			    	+ '<div class="ws_submit_pack">'
						// After action we'll reload the same page
						// but not by reload() because of the confirmation popup of the browser.
			    		+ '<button class="button" onclick="location.href = \'./' + ws_currentUrlId + '.html\'">' + $Str.finish + '</button>'
			    	+ '</div>'
	    		+ '</div>'
			+ '</div>'
		+ '</div>';
});

// STYLE OR MODEL MANAGEMENT
// ----------------------------------------
new ws_Form('ws_sm_management_popup', function(){
	this.HTML =
		'<div class="ws_maintenance_popup" id="' + this.id + '">'
	        + '<div class="ws_menubar"><span id="ws_management_title" class="ws_title"></span></div>'
	        + '<div class="ws_popup_layer1">'
				+ '<div class="ws_popup_layer2">'
			    	+ '<div id="ws_sm_management_body"></div>'
			    	+ '<div class="ws_submit_pack">'
			    		+ '<button class="button" id="ws_import_button" onclick="ws_importModel()">' + $Str.importModel + '</button>'
			    		+ '<button class="button" onclick="$Forms.' + this.id + '.checkUnused()">' + $Str.checkUnused + '</button>'
			    		+ '<button class="button" onclick="$Forms.' + this.id + '.deleteSelection()">' + $Str.deleteSelection + '...</button>'
			    		+ '<button class="button" id="ws_finish_management">' + $Str.finish + '</button>'
			    	+ '</div>'
	    		+ '</div>'
			+ '</div>'
		+ '</div>';

	// Callbacks, handlers
	// -------------------
	this.checkUnused = function(){
        var rows = document.getElementById("ws_sm_management_body").getElementsByTagName('tr');
        for (i = 0; i < rows.length; i++){
            var cols = rows[i].getElementsByTagName('td');
            var lastCol = cols.length - 1;
 
            if (cols[lastCol] && !cols[lastCol].innerHTML.length){  // No references in last col
                for (j = 1; j <= 2; j++)                            // Check draft and public checkboxes
                    if ((check = cols[lastCol - j].getElementsByTagName('input')[0])
                            && check.type == 'checkbox')
                        check.click();
            }
        }
    };

	this.deleteSelection = function(){
		var w = $Forms[this.id].build();
		var type = $Forms.ws_pageToolbar.lastManaged;
	    var checks = document.getElementById('ws_sm_management_body').getElementsByTagName('input');
	    var listing = '<div style="margin: 1em 0; font-weight: bold;">';
	    for(i = 0; checks[i]; i++)
	        if (checks[i].checked) {
	            var name = checks[i].name.replace('_draft', ' (' + $Str.draft + ')').replace('_public', ' (' + $Str.public + ')');
	            if (type == 'style')
	                name = name.replace(/ws[^_]+_/, '');    // Erase component class in case of style
	            listing += name + '<br />';
	        }
	    listing += '</div>';
	    ws_Form.alertAndConfirm($Str['delete_' + type + 's'], $Str['delete_' + type + 'sText'] + listing,
	        function(){ // In case of confirmation, call asynchronous process
	            var request =
	                     'ws_service.html?WS_CMD=forget_' + type + 's'
	                     + '&WS_LANG=' + ws_user_lang;
	            var checks = document.getElementById('ws_sm_management_body').getElementsByTagName('input');
	            for(i = 0; checks[i]; i++)
	                if (checks[i].checked)
	                    request += '&' + checks[i].name;
	            ws_request(request,
			        function(responseText) {
			            if (responseText != 'OK') {
				            ws_Form.alertAndConfirm('', responseText,
				                                    $Forms.ws_pageToolbar.smManage,
				                                    0, WS_NOCANCEL | WS_NOICON);
						} else {
					        $Forms.ws_pageToolbar.smManage();
						}
						// After action we'll reload the same page
						// but not by reload() because of the confirmation popup of the browser.
						document.getElementById('ws_finish_management').onclick = function(){location.href = './' + ws_currentUrlId + '.html'};
			        });
	        },
	        function(){ // In case of cancel, come back to the listing window
	            w.show(0, WS_FIXEDPOSITION);
	        });
	};

	this.onName = function(oldName, wsClass){           // Onclick a model or style name
		var w = $Forms.ws_rename_popup.build();
		document.getElementById('ws_rename_oldName').innerHTML = oldName;
		document.getElementById('ws_rename_wsClass').value = wsClass;
		var input = document.getElementById('ws_rename_input');
		input.onkeydown =  // Continue on <return>
		    function(event) {
				if ((window.event || event).keyCode == 13)
					$Forms.ws_rename_popup.goOn();
			};
		input.value = oldName;
		w.show(0, WS_FIXEDPOSITION | WS_DRAGGABLE);
	};
});

// RENAME A STYLE OR A MODEL
// ----------------------------------------
new ws_Form('ws_rename_popup', function(){
	this.HTML =
		'<div class="ws_maintenance_popup" id="' + this.id + '">'
	        + '<div class="ws_menubar"><span class="ws_title">' + $Str.rename + '</span></div>'
	        + '<div class="ws_popup_layer1">'
				+ '<div class="ws_popup_layer2">'
			    	+ '<div id="ws_rename_oldName" style="margin-bottom: 0.5em; text-align: center; font-weight: bold"></div>'
					+ '<label for="ws_rename_input">' + $Str.newName + '</label>'
					+ '<input type="text" id="ws_rename_input">'
					+ '<input type="hidden" id="ws_rename_wsClass">'
			    	+ '<div class="ws_submit_pack">'
			    		+ '<button class="button" onclick="$Forms.' + this.id + '.goOn()">' + $Str.goOn + '...</button>'
			    		+ '<button class="button" onclick="$Forms.' + this.id + '.cancel()">' + $Str.abandon + '</button>'
			    	+ '</div>'
	    		+ '</div>'
			+ '</div>'
		+ '</div>';

	// Callbacks, handlers
	// -------------------
	this.goOn = function(){
		var oldName = document.getElementById('ws_rename_oldName').innerHTML;
		var newName = document.getElementById('ws_rename_input').value;
		var wsClass = document.getElementById('ws_rename_wsClass').value;
	    if (!newName || newName.search(/[^A-Za-z0-9\-_]/) != -1) {
			alert($Str.invalidName);
			return false;
		}
		ws_mouseCacheOn('waitLocal');
	    var request = 
	             'ws_service.html?WS_CMD=change_' + $Forms.ws_pageToolbar.lastManaged + '_name'
	             + '&WS_OLD_NAME=' + oldName
	             + '&WS_NEW_NAME=' + newName
	             + (wsClass ? '&WS_TYPE=' + wsClass : '')
	             + '&WS_LANG=' + ws_user_lang;
	    ws_request(request,
			        function(responseText) {
			            if (responseText != 'OK') {
				            ws_Form.alertAndConfirm($Str.rename, responseText,
				                                    function(){$Forms.ws_pageToolbar.smManage()},	// Call smManage forcing no argument, so not just the function reference
				                                    0, WS_NOCANCEL | WS_NOICON);
						} else {
					        $Forms.ws_pageToolbar.smManage();
						}
						// After action we'll reload the same page, but not by reload() because of the confirmation popup of the browser.
						document.getElementById('ws_finish_management').onclick = function(){location.href = './' + ws_currentUrlId + '.html'};
			        });
	};

	this.cancel = function(){
		$Forms.ws_sm_management_popup.build().show(0, WS_FIXEDPOSITION);
	};
});

// SAVE A CONTAINER AS A MODEL
// ----------------------------------------
new ws_Form('ws_save_model_form', function(){
	this.HTML = this.buildForm(
			'<input type="hidden" name="ws_operation" value="save_model">'
			+ $Str.saveModelText
			+ '<input type="text" size="15" name="ws_model_name">',
		'<button type="button" title="' + $Str.info + '" onclick="ws_openInfo(\'man_model\')"><svg viewBox="0 0 8 8"><use xlink:href="#ws_info"></use></svg></button>',
		$Str.saveModel);

	// Callbacks, handlers
	// -------------------
	this.submit = function(){
	    var f = document.getElementById(this.id);
	    if (!f.ws_model_name.value || f.ws_model_name.value.search(/[^a-z0-9\-_]/i) != -1) {
			alert($Str.invalidName);
	        return;
	    }
	    for (i = 0; i < ws_models.length; i++)
	        if (f.ws_model_name.value == ws_models[i]) {
	            ws_Form.alertAndConfirm($Str.saveModel, '<b>' + f.ws_model_name.value + '</b>' + $Str.replaceModel, this);
	            return;
	        }
	    this.finalSubmit();
	};
});

// PUBLISH FORM
// ----------------------------------------
new ws_Form('ws_publish_form', function(){
	this.HTML = this.buildForm(
		    '<input type="hidden" name="ws_operation" value="publish">'
		    + '<input type="hidden" name="ws_publish_what">'
			+ $Str.publishText
			+ '<div id="ws_publish_group">'
		    	+ '<div id="publish_page" class="ws_buttonText">' + $Str.publishPageText + '</div>'
		    	+ '<div id="publish_models"></div>'
		    	+ '<div id="publish_css" class="ws_buttonText">' + $Str.publishCssText + '</div>'
		    	+ '<div id="publish_sitemap" class="ws_buttonText">' + $Str.publishSitemapText + '</div>'
		    + '</div>',
		'',
		$Str.publishTitle);

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
	    var f = document.getElementById('ws_publish_form');
		f.ws_operation.value = 'publish';
	    f.ws_publish_what.value = '';

	    // Page
	    new ws_Button({
			id: "publish_page",
			onFalse: function(){f.ws_publish_what.value = f.ws_publish_what.value.replace('tlc,', '')},
	        onTrue: function(){f.ws_publish_what.value += 'tlc,'},
		  	value: false
		  });

	    // Each draft model contained in the page
	    var publish_models = document.getElementById('publish_models');
		for (var i = 0; i < ws_containerList.length; i++) {
			var elt = ws_containerList[i];
			if (elt.ws_props & WS_MODEL_CONTAINER) {
	            var modelName = elt.getAttribute('ws_model');
	            var model = document.createElement('div');
	            model.id = ('Model:' + modelName);
	            model.className = 'ws_buttonText';
	            model.innerHTML = elt.title;
	            if (oldModel = document.getElementById('Model:' + modelName))
	                publish_models.removeChild(oldModel);
	            publish_models.appendChild(model);
	            new ws_Button({
	        		id: model.id,
	        		model_elt: elt,
	        		onFalse: function(){this.model_elt.className = this.model_elt.className.replace(' ws_show_element', ''); f.ws_publish_what.value = f.ws_publish_what.value.replace(this.id + ',', '')},
	                onTrue: function(){this.model_elt.className += ' ws_show_element'; f.ws_publish_what.value += this.id + ','},
	                disabled: !(elt.ws_props & WS_DRAFT)
	        	  });
	        }
	    }

	    // CSS
	    var disabled = !(document.getElementById('user_StyleDraft'));   // Test just if a draft exists, in case of css modifications by hand
	    new ws_Button({
			id: "publish_css",
			onFalse: function(){f.ws_publish_what.value = f.ws_publish_what.value.replace('css,', '')},
	        onTrue: function(){f.ws_publish_what.value += 'css,'},
	        disabled: disabled
		  });

	    // Sitemap
	    new ws_Button({
			id: "publish_sitemap",
			onFalse: function(){f.ws_publish_what.value = f.ws_publish_what.value.replace('sitemap,', '')},
	        onTrue: function(){f.ws_publish_what.value += 'sitemap,'},
	        disabled: !ws_sitemapIsDraft
		  });
		this.onhide = function(){
	            for (var i = 0; i < ws_containerList.length; i++) {
	        		var elt = ws_containerList[i];
	        		if (elt.ws_props & WS_MODEL_CONTAINER) {
	                    elt.className = elt.className.replace(' ws_show_element', '');                }
	            }
	        };
	};
});

// CHOOSE NEW PAGE LANGUAGE
// ----------------------------------------
new ws_Form('ws_new_page_form', function(){
	var me = this;  // To avoid handler confusion

	this.HTML = this.buildForm(
			'<div style="margin-bottom: 1em">' + $Str.newPageLang
				+ '<input type="hidden" name="ws_lang" value="' + ws_user_lang + '">'
				+ '<div id="ws_newPageLang"></div>'
			+ '</div>',
		'',
		$Str.newPageTitle);

	this.setup = function(){
		new ws_Select({id: "ws_newPageLang",
                onChange: function(){
                    var f = document.getElementById(me.id);
                    f.ws_lang.value = this.value;
                    me.submit();},
				options: function(){
		            var options = [];
					for (var i = 0; ws_langs[i]; i++)
						options.push({value: ws_langs[i]});
					return options;}()
			}).setValue(ws_user_lang);
	};

	// Callbacks, handlers
	// -------------------
	this.submit = function(){
		var f = $Forms.ws_pageToolbar.DOMElement;
		f.ws_operation.value = 'new_page';
		f.ws_lang.value = document.getElementById(this.id).ws_lang.value;
		$Forms.ws_pageToolbar.finalSubmit();
	};
});
