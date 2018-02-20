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
 *  TOOLBARS FORMS AND CALLBACKS
 *  ---------------------------------------
 */

// MAIN TOOLBAR
// ----------------------------------------
new ws_Form('ws_pageToolbar', function(){
	$Forms.defaultActive = this;    // I am the default active form
	$Forms.active = this;

	this.HTML =
		'<form id="' + this.id + '" method="post" class="ws_menubar">'
		+ '<input type="hidden" name="ws_scrollX">'
		+ '<input type="hidden" name="ws_scrollY">'
		+ '<input type="hidden" name="ws_page_id">'
		+ '<input type="hidden" name="ws_operation" value="update_field">'
		+ '<input type="hidden" name="ws_transaction_id">'

		//	Preview, page settings, save, publish and exit buttons
		+ '<span class="ws_right_buttons">'

			+ '<button type="button" title="' + $Str.exitCaption + '"'
				+ 'onclick="$Forms.' + this.id + '.logout()">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_exit"></use></svg>'
			+ '</button>'
			+ (ws_currentPageProperties & WS_DRAFT ?
				'<button type="button" title="' + $Str.publishCaption + '"'
					+ 'onclick="$Forms.' + this.id + '.publish(event)">'
		        	+ '<svg viewBox="0 0 8 8"><use xlink:href="#ws_publish"></use></svg>'
				+ '</button>'
			: '')
			+ '<button type="button" title="' + $Str.recordCaption + '"'
				+ 'onclick="$Forms.active.submit()">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_save"></use></svg>'
			+ '</button>'
			+ '<button type="button" title="' + $Str.pageSettingsCaption + '..."'
				+ 'onclick="$Forms.' + this.id + '.pageSettings(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_page_settings"></use></svg>'
			+ '</button>'
			+ '<button type="button" title="' + $Str.previewCaption + '"'
				+ 'onclick="$Forms.' + this.id + '.preview()">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_preview"></use></svg>'
			+ '</button>'

		+ '</span> '
 		+ '<span class="left_stuff">'
			//	Element menu
	        + '<button type="button" title="' + $Str.moreCaption + '"'  
				+ 'onclick="$Forms.' + this.id + '.switchClass(\'ws_hideMenu\')">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_bar_of_elements"></use></svg>'
			+ '</button>'
	
			//	Info button
			+ '<button type="button" title="' + $Str.info + '"'
				+ 'onclick="ws_openInfo(\'man_toolbar\')">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_info"></use></svg>'
			+ '</button>'
			
			//	Admin button
			+ '<button type="button" title="' + $Str.toolsCaption + '"'
				+ 'onclick="$Forms.' + this.id + '.tools()">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_tools"></use></svg>'
			+ '</button>'

	        //	Models button
			+ '<button type="button" title="' + $Str.modelManagement + '..."'
				+ 'onclick="$Forms.' + this.id + '.smManage(\'model\')">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_tools_model"></use></svg>'
			+ '</button>'

	        //	Styles button
			+ '<button type="button" title="' + $Str.styleManagement + '..."'
				+ 'onclick="$Forms.' + this.id + '.smManage(\'style\')">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_tools_style"></use></svg>'
			+ '</button>'
	
			//	Show grid button
			+ '<button type="button" title="' + $Str.gridCaption + '" id="ws_showGrid"'
				+ 'onclick="$Forms.' + this.id + '.switchClass(this.id)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_show_grid"></use></svg>'
			+ '</button>'
	
			//	Show user blocks button
			+ '<button type="button" title="' + $Str.showBlocksCaption + '" id="ws_showBlocks"'
				+ 'onclick="$Forms.' + this.id + '.switchClass(this.id)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_show_blocks"></use></svg>'
			+ '</button>'
	
			//	Show models button
			+ '<button type="button" title="' + $Str.showModelsCaption + '" id="ws_showModels"'
				+ 'onclick="$Forms.' + this.id + '.switchClass(this.id)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_show_models"></use></svg>'
			+ '</button>'
			
			//	Add page button
			+ '<button type="button" title="' + $Str.addCaption + '"'
				+ 'onclick="$Forms.' + this.id + '.newPage(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_new_page"></use></svg>'
			+ '</button>'
	
			//	Forget button
			+ '<button type="button" title="' + $Str.forget + '..."'
				+ 'onclick="$Forms.' + this.id + '.forgetPage()">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_forget"></use></svg>'
			+ '</button>'
	
			//	Language select
			+ (ws_langs.length > 1 ?
				'<input type="hidden" name="ws_lang"><div id="ws_selectLang"></div>'
			: '')
	
			//	Site map button
			+ '<button type="button" title="' + $Str.sitemap + '..."'
				+ 'onclick="$Forms.' + this.id + '.sitemap(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_sitemap"></use></svg>'
			+ '</button>'
		+ '</span>'

		+ '<div style="display: inline-block">'
			//	Name
			+ '<div class="ws_textInput">' + $Str.nameText
				+ '<input type="text" size="15" value="' + ws_currentPageName + '" title="' + $Str.nameCaption + '"'
					+ 'name="ws__name" onclick="$Forms.' + this.id + '.inputFocus()">'
			+ '</div>'
		+ '</div>'

		//	Toolbar end
		+ '</form>';

	this.setup = function(){
	    var toolBar = $Forms.ws_pageToolbar.DOMElement;
	    var me = this;

	    if (ws_langs.length > 1) {
	        new ws_Select({id: "ws_selectLang",
	            onChange: function() {
	                // If lang is in path, we replace it, else we insert the new one
	                var newLoc = location.href;
	                if (newLoc.indexOf('/'+ ws_requested_lang + '/') != -1)
	                    newLoc = newLoc.replace('/' + ws_requested_lang + '/', '/' + this.value + '/');
	                else
	                    newLoc = newLoc.substr(0, newLoc.lastIndexOf('/')) + '/' + this.value + newLoc.substr(newLoc.lastIndexOf('/'));
	                location.href = newLoc;},
				options: function(){
		            var options = [];
					for (var i = 0; ws_page_langs[i]; i++)
						options.push({value: ws_page_langs[i]});
					return options;}()
				}).setValue(ws_user_lang);
		}
		
	    toolBar.onreset =
	        function(){
	            var inputs = this.getElementsByTagName('input');
	            for (i = 0; inputs[i]; i++)     // Must lose focus to unactivate the 'enter' shortcut
	                try {inputs[i].blur();} catch (e){}
	        };
	    toolBar.reset();

        toolBar.onmouseover = function(){ws_lowlightElement(ws_preselected)};        

		for (var i in {'ws_showGrid': 1, 'ws_showBlocks': 1, 'ws_showModels': 1})
			if (document.cookie.indexOf(i + '=yes') != -1)
				this.switchClass(i);            // To show the latest status

		// The following is IE specific to fix height of 'responsive' svg icons !!!!!!!!!!
		var buttons = toolBar.getElementsByTagName('button');
		if (buttons[0].offsetHeight > buttons[0].offsetWidth) {
			for (i = 0; buttons[i]; i++)
				buttons[i].style.height = buttons[i].offsetWidth + 'px';
		}
		
//		var height = toolBar.offsetHeight;	// Explicit to get the transition effect
//		document.documentElement.addEventListener("mouseleave", function(){if (ws_getScrollY() > height) toolBar.style.height = 0});
//		document.documentElement.addEventListener("mouseenter", function(){toolBar.style.height = height + 'px'});
	};

	// Callbacks, handlers
	// -------------------
	this.inputFocus = function(){				// Onclick some input text
	    var toolBar = document.getElementById(this.id);
	    var savedReset = toolBar.reset;
	    toolBar.reset = function(){};	// To cancelAction without toolbar reset
	    ws_cancelAction();
	    toolBar.reset = savedReset;
	    $Forms.active = this;           // Actual active form
	};

	this.newPage = function(event){				// Onclick add a new page
	    event = event || window.event;
		if (ws_langs.length > 1) {
		    var w = $Forms.ws_new_page_form.build();
		    w.show(event, WS_WITHEFFECT | WS_FIXEDPOSITION | WS_DRAGGABLE);
		} else {
    	    var f = document.getElementById(this.id);
    		f.ws_operation.value =  'new_page';
	        this.finalSubmit();
		}
	};

	this.forgetPage = function(){						// Onclick delete current page
		if (ws_Form.checkPermission(P_ADMIN)){
		    var f = document.getElementById(this.id);
		    var title = ws_currentPageProperties & WS_DRAFT ? $Str.deletePageDraftTitle : $Str.deletePageTitle;
		    var text = ws_currentPageProperties & WS_DRAFT ? $Str.deletePageDraftText : $Str.deletePageText;
			ws_cancelAction();						// To unselect any element
			f.ws_operation.value = 'forget';
			ws_Form.alertAndConfirm(title, text, this);
		}
	};

	this.switchClass = function(classN) {		// Show/hide some elements (grid, models etc.) by puting or suppressing a class in document className
		var h = document.documentElement;
		if (h.className.indexOf(' ' + classN) != -1) {
		    h.className = h.className.replace(' ' + classN, '');
			document.cookie = classN + "=no;path=/";    // Remember the status for subsequent loading
			if (button = document.getElementById(classN)) button.className = ('');
		} else {
		    h.className = h.className + ' ' + classN;
			document.cookie = classN + "=yes;path=/";    // Remember the status for subsequent loading
			if (button = document.getElementById(classN)) button.className = ('on');
		}
	};

	this.sitemap = function(event){				// Onclick sitemap button
	    event = event || window.event;
	    var w = $Forms.ws_sitemap_form.build();
	    w.exposed ? w.hide() : w.show(event, WS_NEARCURSOR | WS_FIXEDPOSITION | WS_DRAGGABLE);
	};

	this.preview = function(){					// Onclick preview button
	    ws_reloadRequest({mode: WS_PREVIEW});
	};
	
	this.pageSettings = function(){		// Onclick page settings button
	    var page = document.getElementById(ws_currentPageId);
		ws_selectElement(page);
		ws_clearHighlights();
	    if (page.ws_updateW.exposed) {
	    	ws_cancelAction();
	    } else {
			page.ws_updateW.show(0, WS_WITHEFFECT | WS_FIXEDPOSITION | WS_CENTER | WS_DRAGGABLE);
		}
	};

	this.publish = function(){             // Onclick publish button
	    var w = $Forms.ws_publish_form;
	    var isExposed = w.exposed;	//w.exposed is cleared by cancel
		ws_cancelAction();			// To unselect any element
	    isExposed ? w.hide() : w.show(0, WS_WITHEFFECT | WS_FIXEDPOSITION | WS_CENTER | WS_DRAGGABLE);
	};

	this.logout = function(){                       // Onclick logout button
	    var f = document.getElementById(this.id);
		ws_cancelAction();	// To unselect any element
	    f.ws_operation.value = 'logout';
		this.finalSubmit();
	};

	this.tools = function(){                        // Onclick admin button
		if (ws_Form.checkPermission(P_ADMIN))
	    	document.location.href = 'ws_tools.html?ws_referer=' + encodeURIComponent(document.location.href);
	};

	this.smManage = function(type) {                // Onclick style or model management
		if (ws_Form.checkPermission(P_ADMIN)){
			var w = $Forms.ws_sm_management_popup.build();
			ws_cancelAction();
		    ws_mouseCacheOn('waitLocal');
		    if (type)
				this.lastManaged = type;
			else
			    type = this.lastManaged;
			document.getElementById('ws_finish_management').onclick = ws_cancelAction;
			document.getElementById('ws_management_title').innerHTML = $Str[type + 'Management'];
			document.getElementById('ws_import_button').style.display = /*type == 'model' ? '' :*/ 'none';
		    var request =
					'ws_service.html?WS_CMD=' + type + '_refs'
					+ '&WS_LANG=' + ws_user_lang
					+ '&WS_FORM=$Forms.ws_sm_management_popup';
		    ws_request(request,
		        function(responseText) {
				    ws_mouseCacheOn('popupOnTop');
		            document.getElementById('ws_sm_management_body').innerHTML = responseText;
		            w.show(0, WS_FIXEDPOSITION);
		        });
		}
	};
});

// Build it !!
$Forms.ws_pageToolbar.build();

// ADD AN ELEMENT
// ----------------------------------------
new ws_Form('ws_elementsBar', function(){

	// HTML
	var types = '<div class="jssb-content">';
	for (var i in ws_componentClasses)
		types += '<div class="ws_element_to_add" onmousedown="$Forms.' + this.id + '.addElement(\'uclass\', \'' + i + '\'); return false;" title="' + $Str.addElement + '"><svg viewBox="0 0 8 8"><use xlink:href="#' + i + '"></use></svg>' + ws_componentClasses[i] + '</div>';
	types += '<div class="ws_element_to_add" onmousedown="$Forms.' + this.id + '.addElement(\'clipboard\', \'clipboard\'); return false;" title="' + $Str.addElement + '"><svg viewBox="0 0 8 8"><use xlink:href="#wsclipboard"></use></svg>' + $Str.paste + '</div>';
	types += '<div id="ws_add_model_selector" class="ws_element_to_add" onmousedown="return false"><svg viewBox="0 0 8 8"><use xlink:href="#wsmodels"></use></svg>' + $Str.models
				+ '<div id="ws_model_list">';
	for (var i = 0; i < ws_models.length; i++)
		types += '<div onmousedown="$Forms.' + this.id + '.addElement(0, \'' + ws_models[i] + '\'); return false">' + ws_models[i] + '</div>';
	types += '<div onmousedown="ws_importModel()">' + $Str.more + '</div>';
	types += '</div></div></div>';
	this.HTML =                                                           
		'<form id="' + this.id + '" method="post" class="hidden">'
		+ '<input type="hidden" name="ws_scrollX">'
		+ '<input type="hidden" name="ws_scrollY">'
		+ '<input type="hidden" name="ws_page_id">'
		+ '<input type="hidden" name="ws_operation" value="add_element">'
		+ '<input type="hidden" name="ws_element_move_to_location">'
		+ '<input type="hidden" name="ws_element_move_to_side">'
		+ '<input type="hidden" name="ws_transaction_id">'
		+ '<input type="hidden" name="ws_type_type">'
		+ '<input type="hidden" name="ws_type">'
		+ types
		+ '</form>';
	this.addElement = function(typeType, type){    // called on mousedown
		if (type != 'clipboard' || document.cookie.indexOf('ws_clipboard') != -1) {
			var form = this.DOMElement;
			form.ws_type_type.value = typeType;
			form.ws_type.value = type;
		    ws_cancelAction();
			ws_selectedElement = {  // A dummy selected element
                ws_doNotIncludeInForm: (typeType == 'uclass' && type == 'wssform'), // A form cannot be included in a form
				style: {}
				};
			$Drag.eltMove.beginNew();
		}
	};
	this.setup = function(){
		var f = this.DOMElement;
		f.style.width = 'auto';
		var fullWidth = f.offsetWidth;						// Must use an absolute value for width transition
		var toolBar = $Forms.ws_pageToolbar.DOMElement;

		f.style.top = toolBar.offsetHeight + 'px';
		f.style.height = document.documentElement.clientHeight - toolBar.offsetHeight - 10 + 'px';
		scrollBar = jsScrollbar('ws_elementsBar', {horizontalScrolling: false});
		this.fullDisplay = function(){
			f.style.width = fullWidth + 'px';
			scrollBar._scrollY.el.style.opacity = '';
		};
		this.reduce = function(){
			f.style.width = '';
	    	document.documentElement.className = document.documentElement.className.replace(' ws_hideMenu', '');
			scrollBar._scrollY.el.style.opacity = 0;
		};
		this.hide = function(){
			f.style.width = '';
			if (document.documentElement.className.indexOf(' ws_hideMenu') == -1) {
			    document.documentElement.className += ' ws_hideMenu';
			}
		};
		var me = this;
		f.onmouseenter = function(){if (!f.style.width.length) me.fullDisplay()};
		f.onmouseleave = function(){if (f.style.width.length) me.reduce()};
		if (document.cookie.indexOf('ws_hideMenu=yes') != -1)	// cf switchClass() above
			this.hide();
		else
			this.reduce();

		//  Recompute geometry at window resize
		var scrollBar;
		var resizeT;
		addEventListener("resize", function(){
									clearTimeout(resizeT);
									resizeT = setTimeout(function(){
											f.style.top = toolBar.offsetHeight + 'px';
											f.style.height = document.documentElement.clientHeight - toolBar.offsetHeight - 10 + 'px';
											scrollBar.recalc();
										}, 20); // Not too often
								}, false);
	};
});

// Build it !!
$Forms.ws_elementsBar.build();
