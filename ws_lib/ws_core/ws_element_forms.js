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
 *	ELEMENT FORM CLASS
 *	----------------------------------------
 */

ws_ElementForm.prototype = Object.create(	// Inherit from ws_Form and setup a Parent class property
							ws_Form.prototype,
							{Parent: {value: ws_Form.prototype}});

function ws_ElementForm(id, setMembers){
	this.Parent.constructor.call(this, id, setMembers);	// Setup my members
	var onshow = this.onshow;							// Onshow I call my class standard onshow, then my specific one
	this.onshow = function(){ws_ElementForm.onshow.call(this); onshow.call(this)};
}

// Build the form HTML
// -------------------
ws_ElementForm.prototype.buildForm = function(formBody, moreControls){
	return this.Parent.buildForm.call(this,
	    // Common fields
		'<input type="hidden" name="ws_operation">'
		+ '<input type="hidden" name="ws__properties">'
		+ '<input type="hidden" name="ws__user_style">'
		+ '<input type="hidden" name="ws__more_classes">'
		+ '<input type="hidden" name="ws__embedded_css_rules">'
		// Own fields
		+ (formBody || '')
		// Style block
		+ '<div id="' + this.id + '_update_style" class="ws_styleButtons"></div>'
        , '', '',
        '<div id="' + this.id + '_more" class="ws_more_panel">'
            // More panel
            + '<div class="content">'
	            // The id is not modifiable but copyable, to select it the input must be enabled (for FF at least)
				+ 'id: &nbsp;<input type="text" name="ws_id"'
	                + ' onkeydown="if(!((event.metaKey || event.ctrlKey) && event.keyCode == 67)) return false"'
	                + ' onkeyup="return this.onkeydown(event)" onkeypress="return this.onkeydown(event)">'
	            // Display control in responsive mode
	            + '<table><tr><td>' + $Str.displayOn + ':&nbsp;</td><td>'
		    	+ '<div id="ws_displayOnXS_' + this.id + '" class="ws_buttonText onBlack" title="' + $Str.Sizes + '">' + $Str.XS_device + '</div>'
		    	+ '<div id="ws_displayOnS_' + this.id + '" class="ws_buttonText onBlack" title="' + $Str.Sizes + '">' + $Str.S_device + '</div>'
		    	+ '<div id="ws_displayOnM_' + this.id + '" class="ws_buttonText onBlack" title="' + $Str.Sizes + '">' + $Str.M_device + '</div>'
		    	+ '<div id="ws_displayOnL_' + this.id + '" class="ws_buttonText onBlack" title="' + $Str.Sizes + '">' + $Str.L_device + '</div>'
		    	+ '</td></tr></table>'
	            // Specific controls
                + (moreControls || '')
            + '</div>'
        + '</div>');
};

// Standard building of the selected element form,
// with optional buttons, style selection etc.
// -----------------------------------------------
ws_ElementForm.onshow = function(){
	$Forms.ws_pageToolbar.DOMElement.style.opacity = '0.2';
	$Forms.ws_elementsBar.DOMElement.style.opacity = '0.2';
	if (!ws_selectedElement) return; // Useful for IE when abort drag
	var elt = ws_selectedElement;
	var f = elt.ws_updateForm;
 	var popupSubtitle = document.getElementById(f.id + '_subtitle');
    var popupButtons = document.getElementById(f.id + '_buttons');
    var buttons = {
	    more:
	        '<button title="' + $Str.moreCaption + '" onclick="return ws_ElementForm.more(this)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_open_bottom"></use></svg>',
	    info:
	        '<button title="' + $Str.info + '" onclick="return ws_ElementForm.info(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_info"></use></svg>',
	    forget:
	        '<button title="' + $Str.forget + '..." onclick="return ws_ElementForm.forget(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_forget"></use></svg>',
	    toClipboard:
	        '<button title="' + $Str.toClipboard + '" onclick="return ws_ElementForm.toClipboard(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_to_clipboard"></use></svg>',
	    embed:
	        '<button title="' + $Str.embed + '" onclick="return ws_ElementForm.embed(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_embed"></use></svg>',
	    freeContent:
	        '<button title="' + $Str.freeContent + '" onclick="return ws_ElementForm.freeContent(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_free_content"></use></svg>',
	    unembed:
	        '<button title="' + $Str.unembed + '..." onclick="return ws_ElementForm.unembed(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_unembed"></use></svg>',
	    saveModel:
			'<button title="' + $Str.saveModel + '..." onclick="return ws_ElementForm.saveModel(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_save_model"></use></svg>',
	    detachModel:
			'<button title="' + $Str.detachModel + '" onclick="return ws_ElementForm.detachModel(event)">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_detach_model"></use></svg>',
	};

    // Add a dummy button to avoid unwanted action on typing a <cr> (try a bad html name for an input field for example)
    popupButtons.innerHTML = '<button onclick="return false" style="width: 0; min-width: 0; padding: 0; margin: 0; border: none"></button>';
    popupButtons.innerHTML += buttons.more + buttons.info;
	if (elt.ws_props & WS_PAGE_CONTAINER) {
        popupButtons.innerHTML += buttons['embed'];
    } else {
        popupButtons.innerHTML += buttons['toClipboard'];
        if (!ws_aloneInContainer(elt, WS_MODEL_CONTAINER | WS_FREE_CONTENTS_IN_MODEL))
            popupButtons.innerHTML += buttons['forget'];
        popupButtons.innerHTML += buttons['embed'];
    	if (elt.ws_props & WS_CONTAINER) {
            if (!(elt.ws_props & (WS_MODEL_CONTAINER | WS_FREE_CONTENTS_IN_MODEL))) {
                if (ws_getModelContainer(elt, 1))
                    popupButtons.innerHTML += buttons['freeContent'];
                if (!(elt.ws_props & WS_DONT_UNCAP))
                    popupButtons.innerHTML += buttons['unembed'];
            }
            if (elt.ws_props & WS_MODEL_CONTAINER)
                popupButtons.innerHTML += buttons['detachModel'];
            if (!(elt.ws_props & WS_FREE_CONTENTS_IN_MODEL))
                popupButtons.innerHTML += buttons['saveModel'];
        }
    }

    // Title
    brokenTitle = ws_breakTitle(elt);
 	document.getElementById(f.id + '_title').innerHTML = brokenTitle.title;
	popupSubtitle.innerHTML = brokenTitle.subtitle || '';

	// Style buttons
	ws_buildStyleButtons();

	// More controls panel
    f.ws_id.value = elt.id;
    f.ws__more_classes.value = elt.getAttribute('ws_more_classes');
	for (i in {XS:1, S:1, M:1, L:1})
		new ws_Button({
			id: "ws_displayOn" + i + '_' + this.id,
			className: 'dontDisplayOn' + i, 
			value: f.ws__more_classes.value.indexOf('dontDisplayOn' + i) == -1,
			onTrue: function(){
				f.ws__more_classes.value = f.ws__more_classes.value.replace(' ' + this.className, '');},
			onFalse: function(){
				if (f.ws__more_classes.value.indexOf(' ' + this.className) == -1)
					f.ws__more_classes.value += ' ' + this.className;}
		  });
    
    // Other inits and show
	f.ws_operation.value = 'update_field';		// Default operation
	f.ws__properties.value = elt.ws_props;
	f.ws__user_style.value = 'ws_do_not_modify';
	f.ws__embedded_css_rules.value = 'ws_do_not_modify';

	// Try to put the focus somewhere useful
    // Delay because of visibility transition
    setTimeout(function(){
            	   try {if (f.ws__value.type != 'file') f.ws__value.focus();} catch(e){};
                }, 300);
};

// On hide we close the more panel
// -------------------------------
ws_ElementForm.prototype.onhide = function(){
    var morePanel = document.getElementById(ws_selectedElement.ws_updateForm.id + '_more');
    morePanel.className = morePanel.className.replace(' visible', '');
	$Forms.ws_pageToolbar.DOMElement.style.opacity = '';
	$Forms.ws_elementsBar.DOMElement.style.opacity = '';
};

// Handlers for title bar buttons
// ------------------------------
ws_ElementForm.more = function(button){
    var morePanel = document.getElementById(ws_selectedElement.ws_updateForm.id + '_more');
    var buttonImage = button.getElementsByTagName('svg')[0];
    if (morePanel.className.indexOf(' visible') != -1) {
        morePanel.className = morePanel.className.replace(' visible', '');
        buttonImage.innerHTML = '<use xlink:href="#ws_open_bottom">';
        button.className = '';
    } else {
        morePanel.className += ' visible';
        buttonImage.innerHTML = '<use xlink:href="#ws_close_bottom">';
        button.className = 'on';
    }
    return false;
};

ws_ElementForm.info = function(){
    if (ws_selectedElement.ws_props & WS_MODEL_CONTAINER)
        ws_openInfo('man_model');
    else
        ws_openInfo('man_' + ws_selectedElement.ws_type);
    return false;
};

ws_ElementForm.forget = function(event){
	if (!ws_selectedElement)
	    if (ws_preselected)
	    	ws_selectElement(ws_preselected);
		else
		    return;
    var f = ws_selectedElement.ws_updateForm;
    f.ws_operation.value = 'forget';
    if (ws_getModelContainer(ws_selectedElement, 1))
        $Forms[f.id].conditionalModelOperation(event);
    else
        ws_Form.alertAndConfirm($Str.forget, $Str.forgetElementText, $Forms[f.id]);
    return false;
};

ws_ElementForm.fromClipboard = function(){
	$Forms.ws_elementsBar.addElement('clipboard', 'clipboard');
};

ws_ElementForm.toClipboard = function(event, forget){ // Called by the button and shorthand
	var elt = ws_selectedElement || ws_preselected;
	if (!(elt.ws_props & WS_PAGE_CONTAINER)) {
		ws_request(
			'ws_service.html?WS_CMD=copy_to_clipboard&WS_LOCATION='
			+ ws_currentUrlId + '/' + ws_getLocation(elt)
			+ '&WS_TRANSACTION_ID=' + ws_transaction_id
			+ '&WS_LANG=' + ws_user_lang,
			function(response){
				if (response == 'OK') {
					if (forget && forget == "forget") {
						ws_selectElement(elt);
					    var f = elt.ws_updateForm;
                        var w = elt.ws_updateW;
					    f.ws_operation.value = 'forget';
					    if (ws_getModelContainer(elt, 1))
					        w.conditionalModelOperation(event);
					    else
							w.submit();
				    } else {
						ws_cancelAction();
					}
					return false;
				} else {
					ws_Form.alertAndConfirm($Str.toClipboard, response);
				}
			});
		ws_mouseCacheOn('waitForPage');
	}
	return false;
};

ws_ElementForm.embed = function(){
    ws_selectedElement.ws_updateForm.ws_operation.value = 'embed';
    ws_selectedElement.ws_updateW.submit();
    return false;
};

ws_ElementForm.freeContent = function(){
    ws_selectedElement.ws_props |= WS_FREE_CONTENTS_IN_MODEL;
    ws_selectedElement.ws_updateW.submit();
    return false;
};

ws_ElementForm.unembed = function(){
    ws_selectedElement.ws_updateForm.ws_operation.value = 'unembed';
    ws_Form.alertAndConfirm($Str.unembed, $Str.unembedText, ws_selectedElement.ws_updateW);
    return false;
};

ws_ElementForm.saveModel = function(event) {
	var w = $Forms.ws_save_model_form.build();
    var f = w.DOMElement;
    f.ws_model_name.value = ws_selectedElement.getAttribute('ws_model');
    w.show(event, WS_CENTER | WS_FIXEDPOSITION | WS_DRAGGABLE | WS_MODAL);
    try {f.ws_model_name.focus();} catch(e){}
    return false;
};

ws_ElementForm.detachModel = function() {
    ws_selectedElement.ws_updateForm.ws_operation.value = 'detach_model';
    ws_selectedElement.ws_updateW.submit();
    return false;
};

// Text input utilities
// --------------------
ws_ElementForm.prototype.buildTextInput = function(){
    return '<input type="text" title="' + $Str.inputTextCaption + '" name="ws__value" onkeyup="$Forms.' + this.id + '.updateTextInput(this.value)" onkeypress="this.onkeyup()" size="40">';
};

ws_ElementForm.prototype.onshowTextInput = function(textElementInPage){
    var f = ws_selectedElement.ws_updateForm;
	ws_selectedElement.ws_textElement = textElementInPage;
	f.ws__value.value = ws_br2bsn_special_decode(textElementInPage.innerHTML);
};

ws_ElementForm.layoutTmo;
ws_ElementForm.prototype.updateTextInput = function(string){
	//  Called at every key press; update the text in real time in the displayed page document element.
	//	We save the original text to be able to restore it in case of cancel action.
	//	Sometimes no element is selected or there is no corresponding page element displayed.
	if ((elt = ws_selectedElement) && elt.ws_textElement) {
	   	if (elt.ws_saved_text == null) {
			elt.ws_saved_text = elt.ws_textElement.innerHTML;
			elt.ws_cancelAction =
				(function(oldAction){
				    return function(){  // Call previous cancel action and restore text
				        if (oldAction)
				        	oldAction.call(this);
						var textElement = this.ws_textElement;
				    	if ('ws_saved_text' in this)
				    		textElement.innerHTML = this.ws_saved_text;
						textElement.style.display = !textElement.innerHTML && textElement.ws_hideOnEmpty ? 'none' : '';
                        delete this.ws_saved_text;
					};
				})(elt.ws_cancelAction);
		}
	    elt = elt.ws_textElement;
		elt.innerHTML = string ?
	            (ws_selectedElement.ws_props & WS_TEXTAREA ? string : ws_bsn2br_special(string))
	            : (elt.ws_hideOnEmpty ? '' : ws_selectedElement.title.replace(new RegExp('(\\(.*)'), ''));
	    elt.style.display = !string && elt.ws_hideOnEmpty ? 'none' : '';
		ws_highlightElement();
		clearTimeout(ws_ElementForm.layoutTmo);
		ws_ElementForm.layoutTmo = setTimeout(function(){ws_computeLayout(true)}, 100); // Not too often
	}
};

// TinyMCE setup
// -------------
ws_ElementForm.doNotConvertURL = function(url, node, on_save) {return url;};

ws_ElementForm.initTinyMce = function(){
    // Ultraviolent cleanup plugin !! (especially for paste from word processors)
    tinymce.create('tinymce.plugins.StrongCleanup', {
        init : function(ed, url) {
            // Register an example button
            ed.addButton('StrongCleanup', {
                title : $Str.tinyMCE_cleanupPlugin,
                onclick : function() {
                    // Tags are supposed to be well-formed thanks to auto cleanup
                    value = ed.getContent();
                    // strip xml and style elements
                    for (var i in {xml: 1, style: 1})
                        while (value.indexOf("<" + i) != -1)
                            value = value.substring(0, value.indexOf("<" + i)) + value.substring(value.indexOf("</" + i + ">")+("</" + i + ">").length);
                    // strip almost all tags
                    var tags = value.match(/<[^>]*>/gi);
                    var toKeep = {"ul": 1, "ol": 1, "li": 1, "p>": 1, "br": 1, "a ": 1, "/a": 1};
                    for (var i=0; i < tags.length; i++) {
                        if (!(tags[i].substr(1, 2) in toKeep
                                || (tags[i][1] == '/' && tags[i].substr(2, 2) in toKeep)))
                            value = value.replace(tags[i], "");
                    }
                    ed.setContent(value);
                    // To be redisplayed after all filters
                    $Forms.updateTextInput(ed.getContent());
                },
                'class' : 'mce_cleanup' // Use the cleanup icon from the theme
            });
        }
    });

    // Register plugin
    tinymce.PluginManager.add('StrongCleanup', tinymce.plugins.StrongCleanup);

    // Init
	tinyMCE.init({
		mode : "none",
		language : ws_lang,
		theme : "advanced",
		plugins : "searchreplace,nonbreaking,-StrongCleanup",
		theme_advanced_buttons1 : "bold,italic,underline,strikethrough,sup,sub,separator,forecolor,backcolor,separator,bullist,numlist,indent,outdent,separator,search,replace,separator,link,unlink,separator,nonbreaking,code,StrongCleanup",
		theme_advanced_buttons2 : "",
		theme_advanced_buttons3 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
        fix_list_elements : true,
		urlconverter_callback : "ws_ElementForm.doNotConvertURL",
		setup: function(ed) {
//            ed.addShortcut('shift+ ', 'Nonbreaking space', 'mceNonBreaking'); Does not work
            ed.addShortcut('ctrl+s', 'Save', function(){if ($Forms.active) $Forms.active.submit();});
            ed.onKeyDown.add(function(ed, e) {document.onkeydown(e)});
            ed.onKeyUp.add(function(ed, e) {$Forms.updateTextInput(ed.getContent());});
            ed.onExecCommand.add(function(ed, e) {$Forms.updateTextInput(ed.getContent());});
            ed.onClick.add(function(ed, e) {$Forms.updateTextInput(ed.getContent());});
            },
		content_css : WS_LIB_PATH + "tiny_mce_custom/editor_content_V3.css",
		editor_css : WS_LIB_PATH + "tiny_mce_custom/editor_ui_V3.css",
		valid_elements : "+a[name|href|target|title|id],font[color|style],strong/b,em/i,strike,sup,sub,u,ol,ul,li,br,p[id],blockquote,div[id],span[class|align|style]"
		});
};

// -----------------------------------------------------------------------------

// BLOCK UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wscontainer_form', function(){
	this.HTML = this.buildForm(
		'<span id="ws_userSelectControl" class="ws_buttonText">' + $Str.selectable + '</span>'
            + '<span id="ws_dropDownControl" class="ws_buttonText" title="' + $Str.dropDownCaption + '">' + $Str.dropDown + '</span>'
			+ '<span id="ws_stretchControl" title="' + $Str.stretchCaption + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_stretch.gif"></span>'
			+ '<span id="ws_valignControl" title="' + $Str.valignCaption + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_valign.gif"></span>'
			+ '<span id="ws_bubbleControl" title="' + $Str.bubbleCaption + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_bubble.gif"></span>'
	    	+ '<div title="' + $Str.hrefCaption + '" style="margin-top: 0.5em">' + $Str.href + '<input name="ws__href" onfocus="$Forms.' + this.id + '.onLinkFocus(this)" type="text" size="40"></div>'
	);
	this.submit = function(){
		var elt = ws_selectedElement;
		elt.ws_updateForm.ws__properties.value = elt.ws_props;
		this.finalSubmit();		
	};

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
		var elt = ws_selectedElement;
		elt.ws_updateForm.ws__properties.value = elt.ws_props;
		elt.ws_savedProps = elt.ws_props;
		elt.ws_savedBubbleElements = ws_bubbleElements.slice();
		elt.ws_cancelAction = function(){
			if (elt.ws_savedProps != elt.ws_props) {
				elt.ws_props = elt.ws_savedProps;
				ws_bubbleElements = elt.ws_savedBubbleElements;
				onscroll();
//				unstretch(elt);
				updateStretch();
//				ws_computeLayout();
                updateDropDown();
			}
		};
		new ws_Button({
			id: 'ws_userSelectControl',
			onTrue: function(){
			    elt.ws_props |= WS_USER_SELECTABLE_CONTAINER;
				},
			onFalse: function(){
			    elt.ws_props &= ~WS_USER_SELECTABLE_CONTAINER;
				}
		}).setValue(elt.ws_props & WS_USER_SELECTABLE_CONTAINER);

		var href = elt.getAttribute("href");
		elt.ws_updateForm.ws__href.value = href ? href : "";
		elt.ws_updateForm.ws__href.oninput = elt.ws_updateForm.ws__href.onkeyup =	// onkeyup for IE8 only...
			function() {
				if (this.value.length && ddbtn.value)
					ddbtn.onCtrlClick();
				ddbtn.setDisabled(!ddbtn.savedDropdownability || this.value.length);
			};
		
		var ddbtn = new ws_Button({
			id: 'ws_dropDownControl',
            group: 'stretch',
			onTrue: function(){
			    elt.ws_props |= WS_DROPDOWN;
				elt.ws_updateForm.ws__properties.value = elt.ws_props;
                updateDropDown();
                ws_highlightElement();
				},
			onFalse: function(){
			    elt.ws_props &= ~WS_DROPDOWN;
				elt.ws_updateForm.ws__properties.value = elt.ws_props;
                updateDropDown();
                ws_highlightElement();
				}
		});
		ddbtn.setValue(elt.ws_props & WS_DROPDOWN);
		ddbtn.savedDropdownability = updateDropDown();
		ddbtn.setDisabled(!ddbtn.savedDropdownability || href);

		new ws_Button({
			id: 'ws_stretchControl',
            group: 'stretch',
			onTrue: function(){
				elt.ws_props |= WS_VALIGN_T;
				updateStretch();
				document.getElementById('ws_valignControl').ws_control.setDisabled(false);
				},
			onFalse: function(){
				elt.ws_props &= ~WS_VALIGN;
				updateStretch();
				document.getElementById('ws_valignControl').ws_control.setDisabled(true);
				}
		}).setValue(elt.ws_props & WS_VALIGN);
		new ws_Button({
			id: 'ws_valignControl',
			onClick: function(){
			    if (elt.ws_props & WS_VALIGN_T) {
			        newValign = WS_VALIGN_M;
			        elt.ws_innerWrapper.className = "middle";
				} else if (elt.ws_props & WS_VALIGN_M) {
			        newValign = WS_VALIGN_B;
			        elt.ws_innerWrapper.className = "bottom";
				} else {
			        newValign = WS_VALIGN_T;
			        elt.ws_innerWrapper.className = "top";
				}
				elt.ws_props &= ~WS_VALIGN;
				elt.ws_props |= newValign;
				elt.ws_updateForm.ws__properties.value = elt.ws_props;
			    this.setValue(false);
				}
		});

		var sbtn = new ws_Button({
			id: 'ws_bubbleControl',
            group: 'stretch',
			onTrue: function(){
				elt.ws_props |= WS_BUBBLE;
				ws_bubbleElements.push(elt);
				onscroll();				
				},
			onFalse: function(){
				elt.ws_props &= ~WS_BUBBLE;
				onscroll();				
				for (i in ws_bubbleElements)
					if (ws_bubbleElements[i] == elt)								
						delete ws_bubbleElements[i];
				}
		});
		sbtn.setValue(elt.ws_props & WS_BUBBLE);
		sbtn.setDisabled(!(elt.ws_props & WS_ALONE));	
	};
	
	this.onLinkFocus = function(input){
		var elt = ws_selectedElement;
		if (elt.getElementsByTagName('a') && !input.value.length) {
			ws_Form.alertAndConfirm($Str.blockLink, $Str.blockLinkText,
						function(){$Forms.ws_confirm_popup.hide()},
						function(){},
						WS_NODEFAULTFLAGS | WS_NONEXCLUSIVE | WS_NOCANCEL);
			$Forms.active = this;
		}
		input.onfocus = function(){};
	};

	// Some private utilities
	// ----------------------
    function updateDropDown(){
        var elt = ws_selectedElement;
        var eltTitle;
        var eltAfterTitle;                
        
        // Search if dropdownable, ie first child is a title and there is at least one more element after 
        var child = elt.firstChild, disabled = true;
        while (child && child.nodeType != 1)
            child = child.nextSibling;
        if (child && child.getAttribute('ws_class') == 'wsstitle') {
            eltTitle = child;
            child = child.nextSibling;
            while (child && child.nodeType != 1)
                child = child.nextSibling;
            eltAfterTitle = child;
        }
        if (eltAfterTitle){
            if (elt.ws_props & WS_DROPDOWN){
                // add title link
                var text = eltTitle.innerHTML.replace(/<\/?\s*a[^>]*>/g, '');
                eltTitle.innerHTML = '<a href="javascript: ws_dropDown(\'' + elt.id + 'dropdown\')">' + text + '</a>';
                // encapsulate contents
                if (eltAfterTitle.id != elt.id + 'dropdown') {
                    var e = eltAfterTitle;
                    eltAfterTitle = document.createElement('div');
                    eltAfterTitle.className = "dropDownClosed";
                    eltAfterTitle.id = elt.id + 'dropdown';
                    do {
                        next = e.nextSibling;
                        eltAfterTitle.appendChild(e);
                        e = next;
                    } while (e);
                    elt.appendChild(eltAfterTitle);
                }
            } else {
                // destroy title link
                eltTitle.innerHTML = eltTitle.innerHTML.replace(/<\/?\s*a[^>]*>/g, '');
                // uncap dropdown contents
                if (eltAfterTitle.id == elt.id + 'dropdown') {
                    while (e = eltAfterTitle.firstChild)
                        elt.insertBefore(e, eltAfterTitle);
                    eltAfterTitle = 0;
                }
            }
        }
        return eltAfterTitle;   // Return dropdownability
    }
	function updateStretch(){
	    var elt = ws_selectedElement;

		// Unstretch or restore siblings (only one block in a cell is stretched)
		for (var i = ws_containerList.length-2; i >= 0; i--) {
			var sibling = ws_containerList[i];
			if (sibling != elt && sibling.ws_owner == elt.ws_owner) {
			    if (elt.ws_props & WS_VALIGN) {
				    sibling.ws_savedProps = sibling.ws_props;
					sibling.ws_props &= ~WS_VALIGN;
				} else {
				    sibling.ws_props = sibling.ws_savedProps;
				}
			}
			unstretch(sibling);
		}
		unstretch(elt);
		ws_computeLayout(true);
		ws_highlightElement();
	}
	function unstretch(elt){
		if (elt.ws_outerWrapper) {
			while (e = elt.ws_innerWrapper.firstChild) {
				elt.appendChild(e);
			}
		    elt.removeChild(elt.ws_outerWrapper);
		    elt.ws_outerWrapper = 0;
			for (var tag in {'div': 1, 'table': 1, 'td': 1}) {  // Cleanup when IE7- is dead
			    var conts = elt.getElementsByTagName(tag);
			    for (var i = 0; conts[i]; i++)
			        if (conts[i].ws_props && conts[i].ws_props & WS_CONTAINER)
			            conts[i].style.height = '';
			}
			elt.style.height = '';
		}
	}
});

// PAGE UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wsspage_form', function(){
	var path = location.href.substr(0, location.href.lastIndexOf("/"));
	this.HTML = this.buildForm(

		// Not responsive
		'<div style="whitespace: nowrap">'
		+ '<input type="hidden" name="ws__not_responsive">'
		+ '<div id="ws_responsiveControl" class="ws_buttonText inline">' + $Str.notResponsive + '</div>'
		// Meta robots
		+ '<input type="hidden" name="ws__no_robots">'
		+ '<div id="ws_robotsControl" class="ws_buttonText inline">' + $Str.noRobots + '</div>'
		+ '</div>'

		// Title
		+ '<div class="item">' + $Str.titleText + '</div>&nbsp;&nbsp;&nbsp;&nbsp;'
		+ '<input type="text" style="width: 95%" name = "ws__title" title="' + $Str.titleCaption + '">'

		// Meta description
		+ '<div class="item">' + $Str.metaDescription + '</div>&nbsp;&nbsp;&nbsp;&nbsp;'
		+ '<input type="text" style="width: 95%" name="ws__description" title="' + $Str.metaDescriptionCaption + '">'

	    // Page url_id
		+ '<div class="item">' + $Str.pageUrl + '</div>&nbsp;&nbsp;&nbsp;&nbsp;'
		+ path + '/<input type="text" size="20" name="ws__url_id">.html'

	    // Redirection URL
		+ '<div class="item">' + $Str.redirectTo + '</div>&nbsp;&nbsp;&nbsp;&nbsp;'
		+ '<input type="text" size="30" name="ws__redir_url" title="' + $Str.redirectToCaption + '">'

		// Other meta tags
		+ '<div class="item">' + $Str.hdrHtml + '</div>&nbsp;&nbsp;&nbsp;&nbsp;'
		+ '<textarea style="width: 95%; height: 5em" rows="5" name="ws__hdr_html" title="' + $Str.hdrHtmlCaption + '" id="ws__hdr_html"></textarea>');

	this.onshow = function(){
	    var f = ws_selectedElement.ws_updateForm;
		f.ws__no_robots.value = new ws_Button({
			id: "ws_robotsControl",
			disabled: ws_noRobotsGlobal,
			value: ws_noRobots || ws_noRobotsGlobal,
			onClick: function(){f.ws__no_robots.value = this.value}
		  }).value;
		f.ws__not_responsive.value = new ws_Button({
			id: "ws_responsiveControl",
			value: ws_notResponsive,
			onClick: function(){f.ws__not_responsive.value = this.value}
		  }).value;
	    f.ws__title.value = ws_currentPageTitle;
	    f.ws__description.value = ws_currentPageDescription;
	    f.ws__url_id.value = ws_currentUrlId;
	    f.ws__redir_url.value = ws_redirUrl;
	    f.ws__hdr_html.value = ws_currentPageHdrHtml;
	};

	this.submit = function(){
	    var f = ws_selectedElement.ws_updateForm;
	    if (!f.ws__url_id.value || f.ws__url_id.value.search(/[^a-z0-9\-_]/i) != -1) {
	        ws_Form.alertAndConfirm($Str.pageUrl, $Str.invalidName);
	        return;
	    }
	    if (f.ws__url_id.value != ws_currentUrlId) {
	        // Control url existence by asynchronous php
	        ws_mouseCacheOn('popupOnTop');
	        var request =
	                 'ws_service.html?WS_CMD=url_exists'
	                 + '&WS_LANG=' + ws_user_lang
	                 + '&WS_URL_ID=' + f.ws__url_id.value
	                 + '&WS_INDEX=' + ws_currentPageId;
            var me = this;
	        ws_request(request,
	            function(responseText) {
	                if (responseText == 'NO')
				        me.finalSubmit();
	                else if (responseText == 'YES')
	                    ws_Form.alertAndConfirm($Str.pageUrl, $Str.changeUrlText, me);
				    else
				    	ws_Form.alertAndConfirm($Str.pageUrl, responseText);

	            });
	        return;
	    }
		this.finalSubmit();
	};
});

// TITLE UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wsstitle_form', function(){
	this.HTML = this.buildForm(
		'<div style="float: left"><input type="hidden" name="ws__level">'
			+ this.buildTextInput()
	        + '&nbsp&nbsp;' + $Str.level + ' :</div>'
            + '<div id="ws_level" style="float: left; width: 1em; margin: 0.2em 0 0 0.5em"></div>'
			+ '<div title="' + $Str.hrefCaption + '" style="clear: both">' + $Str.href + '<br><input name="ws__href" type="text" size="40"></div>'
	);

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
        var elt = ws_selectedElement;        
	    var f = elt.ws_updateForm;

		this.onshowTextInput(elt.getElementsByTagName('a')[0] || elt);
		new ws_Select({id: "ws_level",
                options: [{value: 1}, {value: 2}, {value: 3}, {value: 4}, {value: 5}, {value: 6}],
                onChange: function(){elt.ws_updateForm.ws__level.value = this.value;}
                }).setValue(elt.tagName.charAt(1));
        f.ws__level.value = elt.tagName.charAt(1);
		var href = elt.getAttribute("ws_href");
		f.ws__href.value = href ? href : "";
	};
});

// IMAGE UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wsimage_form', function(){
	this.HTML = this.buildForm(
		'<input type="hidden" name="old_width">'
			+ '<input type="hidden" name="old_height">'
	    	+ '<input type="hidden" name="ws__keep_format">'
	    	+ '<input type="hidden" name="ws__in_gallery">'
	    	+ '<input type="hidden" name="ws__notFlexible">'
	    	+ '<div id="ws_imageFileInput" style="margin-bottom: 0.4em" title="' + $Str.imagefileCaption + '"></div>'
	    	+ '<table style="width: 100%"><tr><td>'
		    	+ '<div id="ws_keepFormatControl" class="ws_buttonText" title="' + $Str.keepFormatCaption + '" >' + $Str.keepFormat + '</div>'
		    	+ '<div id="ws_galleryControl" class="ws_buttonText" title="' + $Str.inGalleryCaption + '" >' + $Str.inGallery + '</div>'
		    	+ '<div id="ws_notFlexibleControl" class="ws_buttonText" title="' + $Str.notFlexibleCaption + '" >' + $Str.notFlexible + '</div>'
	    	+ '</td><td>'
				+ $Str.imageWidth + '<input type="text" size="3" name="ws__width"'
					+ 'onkeyup="this.value = this.value.replace(/[^0-9]/, \'\'); if (this.value) $Drag.eltResize.resize(0, this.value, 0)">'
				+ '<br>' + $Str.imageHeight + '<input type="text" size="3" name="ws__height"'
					+ 'onkeyup="this.value = this.value.replace(/[^0-9]/, \'\'); if (this.value) $Drag.eltResize.resize(0, 0, this.value)">'
			+ '</td></tr></table>'
	    	+ '<div title="' + $Str.captionCaption + '" style="margin-top: 0.5em; text-align: right; white-space: nowrap">' + $Str.caption + '<input name="ws__caption" type="text" onkeyup="$Forms.' + this.id + '.updateTextInput(this.value)" onkeypress="this.onkeyup()" size="40"></div>'
	    	+ '<div title="' + $Str.tooltipCaption + '" style="text-align: right; white-space: nowrap">' + $Str.tooltip + '<input name="ws__tooltip" type="text" size="40"></div>'
	    	+ '<div title="' + $Str.hrefCaption + '" style="text-align: right; white-space: nowrap">' + $Str.href + '<input name="ws__href" type="text" size="40"></div>'
	);

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
		var elt = ws_selectedElement;
	    var f = elt.ws_updateForm;

		// Sometimes the popup is reshown and we must keep eventual modifications
		if (!this.lastAttachedElt || this.lastAttachedElt != elt) {
			this.lastAttachedElt = elt;
			new ws_FileInput({id: "ws_imageFileInput", name: "ws__value", size: 40});
			elt.ws_textElement = document.getElementById(elt.id + '_caption');
			elt.ws_textElement.ws_hideOnEmpty = 1;
			var b = new ws_Button({
				id: "ws_keepFormatControl",
				group: "GalForm",
				value: elt.getAttribute("ws_keep_format"),
				// Don't use onClick() because of mutual exclusion
				onTrue: function(){ws_selectedElement.ws_updateForm.ws__keep_format.value = this.value},
				onFalse: function(){ws_selectedElement.ws_updateForm.ws__keep_format.value = this.value}
			  });
			f.ws__keep_format.value = b.value;
			b = new ws_Button({
				id: "ws_galleryControl",
				group: "GalForm",
				value: elt.getAttribute("ws_in_gallery"),
				// Don't use onClick() because of mutual exclusion
				onTrue: function(){ws_selectedElement.ws_updateForm.ws__in_gallery.value = this.value},
				onFalse: function(){ws_selectedElement.ws_updateForm.ws__in_gallery.value = this.value}
			  });
			f.ws__in_gallery.value = b.value;
			b = new ws_Button({
				id: "ws_notFlexibleControl",
				value: elt.getAttribute("ws_notFlexible"),
				disabled: ws_noFleximage || ws_notResponsive,
				onClick: function(){
						elt = ws_selectedElement;
						var f = elt.ws_updateForm;
						f.ws__notFlexible.value = this.value;
						if (this.value) {		// Fixed
							elt.style.maxWidth = '';
							elt.style.width = f.ws__width.value + 'px';
						} else {				// Flexible
							elt.style.maxWidth = f.ws__width.value + 'px';
							elt.style.width = 'auto';
						}
						ws_highlightElement();
						ws_computeLayout(true);
					}
			  });
			f.ws__notFlexible.value = b.value;
			f.ws__tooltip.value = elt.getAttribute("ws_tooltip");
			f.ws__caption.value = ws_br2bsn_special_decode(elt.ws_textElement.innerHTML);
			var href = elt.getAttribute("ws_href");
			f.ws__href.value = href ? href : "";
		}
		var width = parseInt(ws_actualStyleValue('maxWidth'));
		f.ws__width.value = isNaN(width) ? elt.ws_img.width : width;
		f.ws__height.value = elt.ws_img.height;
	};
	
});

// RICH TEXT UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wstextarea_form', function(){
	this.HTML = this.buildForm(
		'<textarea name="ws__value" id="ws_richtextarea" cols="70" rows="12"></textarea>'
	);

	this.setup = function(){
	    $Forms.updateTextInput = this.updateTextInput;  // For tinyMCE
		ws_ElementForm.initTinyMce();
		tinyMCE.execCommand("mceAddControl", true, "ws_richtextarea");
	};

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
	    elt = ws_selectedElement;
		elt.ws_textElement = ws_selectedElement;
		setTimeout(function(){bindTinyMCE()}, 1);	// Delay for IE11, because interactions with mous events (dblclick doesn't work)
	};

	function bindTinyMCE(){ // tinyMCE.execCommand may be not yet done
		if (!tinyMCE.activeEditor)
			setTimeout(function(){bindTinyMCE()}, 10);
        else
			tinyMCE.activeEditor.setContent(ws_selectedElement.innerHTML);
	}
});

// RAW TEXT UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wsrawtext_form', function(){
	this.HTML = this.buildForm(
		'<div>' + $Str.rawtext + '</div><textarea name="ws__value" cols="70" rows="8"></textarea>'
			+ '<div id="ws_rawtexInfo" style="font-size: 1.2em; margin: 0.5em 0"></div>'
			+ '<div id="ws_rawtextVariables"></div>'
			+ '<div>' + $Str.datafiles + '</div>'
			+ '<input type="hidden" name="ws__attached_files">'
			+ '<input type="hidden" name="ws__variables">'
			+ '<div id="ws_dataFileInputS" style="margin:  0.2em 1em" title="' + $Str.datafileCaption + '"></div>'
			+ '<div id="ws_dataFileList" style="margin: 0.2em 1em"></div>'
	);

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
	    var f = ws_selectedElement.ws_updateForm;
		f.ws__attached_files.value = ws_selectedElement.getAttribute('data-attached_files');
		newFile();
		var str = ws_selectedElement.getAttribute("ws_content");
		f.ws__value.value = str != ws_selectedElement.title ? str : "";

		/* Wippet variables, development in progress
	    document.getElementById('ws_rawtexInfo').innerHTML = ws_selectedElement.getAttribute('data-info');
		eval('this.variables = eval(' + ws_selectedElement.getAttribute('data-variables') + ");");
		str = '';
		for (i in this.variables) {
			str += '<div style="margin-top: 0.5em; text-align: right; white-space: nowrap">' + this.variables[i].text + ': <input value="' + this.variables[i].value + '" size="30" onkeyup="ws_selectedElement.ws_updateW.variables[\'' + i + '\'].value=this.value; ws_selectedElement.ws_updateForm.ws__variables.value=JSON.stringify(ws_selectedElement.ws_updateW.variables);"></div>';
		}
		document.getElementById('ws_rawtextVariables').innerHTML = str;
		*/
	};

	// Some private utilities
	// ----------------------
	var fileNumber = 0;
	var me = this;
	function newFile(files, inputId){
		if (files) {    // Loop in the possibly multiple file selection
		    for (var i = 0; i < files.length; i++) {
				var file = files[i].name;
				// Keep only basename
				file = file.substring(file.substring(file.lastIndexOf('/') + 1).lastIndexOf('\\') + 1);
				// Not twice same file
				me.unlinkFile(file);
				document.getElementById(inputId).fileName = file;
				// Add file to associated
				var allFiles = ws_selectedElement.ws_updateForm.ws__attached_files;
				allFiles.value += (allFiles.value.length ? ',' : '') + '"' + file + '"';
			}
		}
		showFiles();
		fileNumber++;
		// Undisplay old file inputs
		var fileInputs = document.getElementById("ws_dataFileInputS");
		var children = fileInputs.childNodes;
		for (var i = 0; i < children.length; i++)
		    children[i].style.display = "none";
		// Append a new file input
		var newFileInput = document.createElement('span');
	    newFileInput.id = 'ws_dataFileInput' + fileNumber;
		fileInputs.appendChild(newFileInput);
		new ws_FileInput({id: "ws_dataFileInput" + fileNumber,
			name: "ws__data_file",
			multiple: true,
			onChange: function(files){newFile(files, this.id)},
			size: 20});
	}
	function showFiles() {
		var fileList = document.getElementById("ws_dataFileList");
		var files = ws_selectedElement.ws_updateForm.ws__attached_files;
		files = eval('[' + files.value + ']');
		fileList.innerHTML = '';
		for (var i = 0; i < files.length; i++) {
			fileList.innerHTML +=
			    '<a title="' + $Str.forget + '" href="javascript:void(0)" onclick="$Forms.' + me.id + '.unlinkFile(\'' + files[i] + '\'); return false" class="ws_unlinkDatafile">' + files[i] + '</a>';
		}
	}
	this.unlinkFile = function(file){
		var files = ws_selectedElement.ws_updateForm.ws__attached_files;
		files.value = files.value.replace('"' + file + '"', '');    // Don't use regexp cause of special chars as '['
		files.value = files.value.replace(',,', ',');
		files.value = files.value.replace(/^,|,$/, ''); // Trim commas
		showFiles();
	}
});

// FILE DOWNLOAD UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wssdownload_form', function(){
	this.HTML = this.buildForm(
		this.buildTextInput()
			+ '<input type="hidden" name="ws__attached_files">'
			+ '<input type="hidden" name="MAX_FILE_SIZE" value="100000000">'
			+ '<div style="margin: 0.5em 0 0 1em">' + $Str.datafile + '<span id="ws_fileDisplay" style="margin: 0.2em 1em"></span></div>'
			+ '<div id="ws_fileToUpload" style="margin: 0.2em 1em" title="' + $Str.downloadCaption + '"></div>'
	);

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
        var elt = ws_selectedElement;    
	    var f = elt.ws_updateForm;
        
		this.onshowTextInput(elt.getElementsByTagName('a')[0] || elt);
		f.ws__attached_files.value = elt.getAttribute("data-attached_files");
		document.getElementById("ws_fileDisplay").innerHTML = f.ws__attached_files.value.replace(/"/g, "");
		new ws_FileInput({id: "ws_fileToUpload",
			name: "ws__data_file",
			size: 30,
			onChange: function(files) {
		        var f = elt.ws_updateForm;
		        var file = files[0].name;
				file = file.substring(file.substring(file.lastIndexOf("/") + 1).lastIndexOf("\\") + 1);
				f.ws__attached_files.value = '"' + file + '"';
				document.getElementById("ws_fileDisplay").innerHTML = file;
			}
		});
	};
});

// MENU UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wssmenu_form', function(){
	this.HTML = this.buildForm(
		'<input name="ws__value" type="hidden">'
			+ '<input name="ws__category" type="hidden">'
			+ '<table width="100%"><tr>'
			+ '<td>' + $Str.layout + '</td>'
			+ '<td><div id="ws_menuDisplayControl" style="width: 8em"></div></td>'
			+ '</tr><tr>'			
			+ '<td>' + $Str.category + '</td>'
			+ '<td><div id="ws_categoryControl" style="width: 8em"></div></td>'
			+ '<td>&nbsp;&nbsp;' + $Str.depth + '&nbsp;<input name="ws__depth" type="text" size="2"></td>'
			+ '</tr></table>'
	);
	
	this.setup = function(){
	    var me = this;
		var options = [{value: "", innerHTML: "&nbsp;"}];
		for (var id in ws_sitemap)
		    if (ws_sitemap[id].children.length)
				options.push({value: id, innerHTML: ws_sitemap[id].name});
        new ws_Select({
                id: "ws_categoryControl",
                options: options,
                onChange: function(){
                    ws_selectedElement.ws_updateForm.ws__category.value = this.value;
                    me.submit();
                }
		});
		new ws_Select({
				id: "ws_menuDisplayControl",
                options: [{value: "horizontal", innerHTML: $Str.hOption},
							{value: "vertical", innerHTML: $Str.vOption},
							{value: "tree", innerHTML: $Str.tOption}]
		});
	};

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
		if (m = ws_selectedElement.getElementsByTagName("ul")[0]) {
			var elt = ws_selectedElement;
			var f = ws_selectedElement.ws_updateForm;
			var displayCtrl = document.getElementById('ws_menuDisplayControl').ws_control;
			var categoryCtrl = document.getElementById('ws_categoryControl').ws_control;
			elt.ws_savedDisplay = m.className;
			elt.ws_cancelAction = function() {m.className = elt.ws_savedDisplay};
			displayCtrl.onMouseOverOption = function(index){
					f.ws__value.value = m.className = this.options[index].value;
					ws_highlightElement();
				};
			displayCtrl.onClose = function(){
					f.ws__value.value = m.className = elt.ws_savedDisplay;
					ws_highlightElement();
				};
			displayCtrl.setValue(m.className);
			categoryCtrl.setValue(m.getAttribute("ws_category"));
			f.ws__value.value = m.className;
			f.ws__category.value = categoryCtrl.value;
			f.ws__depth.value = m.getAttribute("ws_depth");
		}
	};
});

// PAGE PATH UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wsspagepath_form', function(){
	this.HTML = this.buildForm();
});

// LANGUAGE SELECTOR UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wslangselector_form', function(){
	this.HTML = this.buildForm(
		'<input type="hidden" name="ws__value">'
			 + '<div id="ws_valueControl" class="ws_buttonText" >' + $Str.validLanguages + '</div>'
	);

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
	    var f = ws_selectedElement.ws_updateForm;
		f.ws__value.value = ws_selectedElement.getAttribute("ws_value");
		new ws_Button({
			id: "ws_valueControl",
			onTrue: function(){f.ws__value.value = 1;},
			onFalse: function(){f.ws__value.value = 0;}
		}).setValue(f.ws__value.value != 0);
	};
});

// ANTISPAM MAILTO UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wssmailto_form', function(){
	this.HTML = this.buildForm(
	    this.buildTextInput()
			+ '<br>' + $Str.destination + '<br><input type="text" size="50" name="ws__destination">'
			+ '<br>' + $Str.subject + '<br><input type="text" size="50" name="ws__subject">'
	);

	this.onshow = function(){
        var elt = ws_selectedElement;    
	    var f = elt.ws_updateForm;
        
		this.onshowTextInput(elt.getElementsByTagName('a')[0] || elt);
  		f.ws__destination.value = Disp(elt.getAttribute('data-destination'));
  		f.ws__subject.value = elt.getAttribute('data-subject');
	};
});

// CONTACT UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wssform_form', function(){
	this.HTML = this.buildForm(
		$Str.destination + '<br><input type="text" size="50" name="ws__destination">'
			+ '<div style="margin-top: 0.8em">'
			+ $Str.returnURL + ':<input type="text" size="20" name="ws__return_url" title="' + $Str.returnURLCaption + '"></div>'
			+ '<div>'
			+ '<div id="ws_preambleControl" class="ws_buttonText inline" title="' + $Str.preambleCaption + '" style="margin: 5px 0 2px 0">' + $Str.preamble + '</div>'
			+ '<div id="ws_postambleControl" class="ws_buttonText inline" title="' + $Str.postambleCaption + '" style="margin: 5px 0 2px 0">' + $Str.postamble + '</div>'
			+ '<div id="ws_ccPromptControl" class="ws_buttonText inline" title="' + $Str.ccPromptCaption + '" style="margin: 5px 0 2px 0">' + $Str.ccPrompt + '</div>'
			+ '</div>'
			+ '<br style="clear: left">'
			+ '<textarea name="ws__preamble" id="ws_msg_preamble" cols="62" rows="6"></textarea>'
			+ '<textarea name="ws__postamble" id="ws_msg_postamble" cols="62" rows="6"></textarea>'
			+ '<textarea name="ws__ccPrompt" id="ws_msg_ccPrompt" cols="62" rows="6"></textarea>'
	);

	this.setup = ws_ElementForm.initTinyMce;

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
		var elt = ws_selectedElement;
		var f = elt.ws_updateForm;

		new ws_Button({
			id: "ws_preambleControl",
			group: "usrtxt",
			value: false,
			onTrue: function(){
				document.getElementById("ws_msg_preamble").style.display = "block";
				tinyMCE.execCommand("mceAddControl", false, "ws_msg_preamble");},
			onFalse: function(){
				tinyMCE.execCommand("mceRemoveControl", false, "ws_msg_preamble");
				document.getElementById("ws_msg_preamble").style.display = "none";}
		}).onFalse();
		new ws_Button({
			id: "ws_postambleControl",
			group: "usrtxt",
			value: false,
			onTrue: function(){
				document.getElementById("ws_msg_postamble").style.display = "block";
				tinyMCE.execCommand("mceAddControl", false, "ws_msg_postamble");},
			onFalse: function(){
				tinyMCE.execCommand("mceRemoveControl", false, "ws_msg_postamble");
				document.getElementById("ws_msg_postamble").style.display = "none";}
		}).onFalse();
		new ws_Button({
			id: "ws_ccPromptControl",
			group: "usrtxt",
			value: false,
			onTrue: function(){
				document.getElementById("ws_msg_ccPrompt").style.display = "block";
				tinyMCE.execCommand("mceAddControl", false, "ws_msg_ccPrompt");},
			onFalse: function(){
				tinyMCE.execCommand("mceRemoveControl", false, "ws_msg_ccPrompt");
				document.getElementById("ws_msg_ccPrompt").style.display = "none";}
		}).onFalse();

		f.ws__destination.value = elt.getAttribute('data-destination');
		f.ws__return_url.value = elt.getAttribute('data-return_url');
		f.ws__preamble.value = elt.getAttribute('data-preamble');
		f.ws__postamble.value = elt.getAttribute('data-postamble');
		f.ws__ccPrompt.value = elt.getAttribute('data-ccPrompt');
    }; 
});

// INPUT FIELD UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wssinputfield_form', function(){
	this.HTML = this.buildForm(
        this.buildTextInput()
            + '<input type="hidden" name="ws__required">'
            + '&nbsp;&nbsp;<span title="' + $Str.requiredCaption + '" id="requiredControl">*</span>'
            + '<div id="ws_fieldParamsBody">'
                + '<div>'
                    + '<div>' + $Str.htmlNameCaption + ':&nbsp;</div><div><input type="text" style="margin-left: 0" name="ws__htmlName" size="25" title="' + $Str.htmlNameTitle + '"></div>'
                + '</div>'
                + '<input type="hidden" name="ws__type">'
                + '<div>'
                    + '<div>' + $Str.typeCaption + ':&nbsp;</div><div id="ws_fieldTypeControl"></div>'
                + '</div>'
                + '<input type="hidden" name="ws__params">'
                + '<div id="ws_fieldParams"></div>'
            + '</div>'
	);

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
        var elt = ws_selectedElement;
	    var f = elt.ws_updateForm;
        var inputField = document.getElementById(elt.id + '_field');

		elt.ws_savedHTML = elt.innerHTML;
		elt.ws_cancelAction = function(){
			this.innerHTML = this.ws_savedHTML;
		};
        
        f.ws__value.value = '';

		f.ws__required.value = inputField.getAttribute('data-required') ? 1 : 0;  // Testing an input value for true or false is not well-working, it's better to compare it
        new ws_Button({
			id: "requiredControl",
			value: inputField.getAttribute('data-required'),
			onClick: function(){
				f.ws__required.value = this.value;
                document.getElementById(elt.id + '_required').innerHTML = this.value ? '&nbsp;(*)' : '';
			}
		});

        f.ws__htmlName.value = elt.getAttribute('data-htmlName');

        f.ws__type.value = inputField.getAttribute('data-type');
        var me = this;
		new ws_Select({
			id: "ws_fieldTypeControl",
            options: new Array(
                    {value: 'email', innerHTML: $Str.emailField},
                    {value: 'text', innerHTML: $Str.textField},
                    {value: 'url', innerHTML: $Str.urlField},
                    {value: 'number', innerHTML: $Str.numberField},
                    {value: 'password', innerHTML: $Str.passwordField},                    
                    {value: 'checkbox', innerHTML: $Str.checkboxField},
                    {value: 'select', innerHTML: $Str.selectField},
                    {value: 'file', innerHTML: $Str.attachedFileField},
                    {value: 'captcha', innerHTML: $Str.captchaField},
                    {value: 'submit', innerHTML: $Str.submitButton}),
			value: f.ws__type.value,
			onChange: function(){
                        f.ws__type.value = this.value;
                        me.displayFieldInForm();
                        me.displayFieldControls();
                    }
		});

        f.ws__params.value = elt.getAttribute('data-params');

        this.displayFieldInForm();
        this.displayFieldControls();
        
    };
    this.displayFieldInForm = function(){
        var elt = ws_selectedElement;
	    var f = elt.ws_updateForm;
        var buf;
        var common = ' class="wssinput" id="' + elt.id + '_field" data-type="' + f.ws__type.value + '"' + (f.ws__required.value == 1 ? ' required="required" data-required="1"' : '') + '>';
        var label = elt.getElementsByTagName('label')[0];
        var required = document.getElementById(elt.id + '_required');

        label.style.display = '';
        required.style.display = '';
        if (f.ws__value.value)    // Actualize label in case of type change
            label.innerHTML = ws_bsn2br_special(f.ws__value.value);
        else                            // Setup value in form
        	f.ws__value.value = ws_br2bsn_special_decode(label.innerHTML);

        switch (f.ws__type.value){
            case 'email':
                buf = '<input type="email" multiple="multiple"' + common;
                break;
            case 'text':
    			if (f.ws__params.value <= 1)
    				buf = '<input type="text"' + common;
    			else
    				buf = '<textarea rows="' + f.ws__params.value + '"' + common + '</textarea>';
                break;
            case 'url':
                buf = '<input type="url"' + common;
                break;
            case 'number':
                buf = '<input type="number"' + common;
                break;
            case 'password':
                buf = '<input type="password"' + common;
                break;
            case 'checkbox':
                buf = '<input type="checkbox" class="wsscheckbox"' + common;
                break;
            case 'select':
                buf = '<select' + common + '</select>';
                break;
            case 'file':
                buf = '<input type="file"' + common;
                break;
            case 'captcha':
                buf = '<input type="text"' + common;
                break;
            case 'submit':
                label.style.display = 'none';
                required.style.display = 'none';
                buf = '<button type="submit"' + common + label.innerHTML + '</button>';
                break;
        }
        document.getElementById(elt.id + '_field').parentNode.innerHTML = buf;
        this.onshowTextInput(f.ws__type.value == 'submit' ? document.getElementById(elt.id + '_field') : label);
        ws_highlightElement();
	};
    
    this.displayFieldControls = function(){
        var elt = ws_selectedElement;
	    var f = elt.ws_updateForm;
        var typedParams = {text: '<div>' + $Str.linesCaption + ':&nbsp;</div><div><input type="text" style="width: 2em; text-align: right" onkeyup="if (event.keyCode != 27) {this.value = this.value.replace(/[^0-9]/, \'\'); if (this.value > 99) this.value = 99; ws_selectedElement.ws_updateForm.ws__params.value=this.value; $Forms.' + this.id + '.displayFieldInForm()}" size="2" value="' + (f.ws__params.value*1 || 1) + '"></div>',
                            select: '<div>' + $Str.optionsCaption + ':&nbsp;</div><div><textarea rows="4" style="margin-left: 0" onkeyup="ws_selectedElement.ws_updateForm.ws__params.value=this.value">' + f.ws__params.value + '</textarea></div>'};
        var fieldParams = document.getElementById("ws_fieldParams");
        fieldParams.innerHTML = typedParams[f.ws__type.value] || '';
    };

    this.submit = function(){
        var elt = ws_selectedElement;
        var htmlName = elt.ws_updateForm.ws__htmlName.value;
	    if (htmlName.search(/(^ws_)|[^a-z0-9\-_]/i) != -1) {
			alert($Str.invalidHtmlName);
	        return;
	    }
        var inputParentForm = document.getElementById(ws_selectedElement.id + '_field').form;
        if (inputParentForm && inputParentForm[htmlName]){
            alert ($Str.htmlNameInUse + ': ' + htmlName);
            return;
        }
        this.finalSubmit();   
    };

});

// BADGE UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wssbadge_form', function(){
	this.HTML = this.buildForm();
});

// RSS READER UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wssrssreader_form', function(){
	this.HTML = this.buildForm(
	  	$Str.rssSource + '<br><input type="text" size="50" name="ws__value">'
            + '<input type="hidden" name="ws__display_date">'
            + '<input type="hidden" name="ws__display_content">'
            + '<input type="hidden" name="ws__display_channel">'
	  		+ '<br>' + $Str.rssMaxItems + '<input type="text" size="5" name="ws__max_items">'
			+ '<div><div id="ws_channelControl" class="ws_buttonText inline">' + $Str.rssShowChannel + '</div>'
			+ '<div id="ws_dateControl" class="ws_buttonText inline">' + $Str.rssShowDate + '</div>'
			+ '<div id="ws_contentControl" class="ws_buttonText inline">' + $Str.rssShowContent + '</div>'
			+ '</div>'
	);

	this.onshow = function(){
        var elt = ws_selectedElement;
	    var f = ws_selectedElement.ws_updateForm;

  		f.ws__value.value = elt.getAttribute('data-value');
  		f.ws__max_items.value = elt.getAttribute('data-max_items');
		var b = new ws_Button({
			id: "ws_channelControl",
			value: elt.getAttribute("data-display_channel"),
			onClick: function(){f.ws__display_channel.value = this.value}
		  });
		f.ws__display_channel.value = b.value;
		b = new ws_Button({
			id: "ws_dateControl",
			value: elt.getAttribute("data-display_date"),
			onClick: function(){f.ws__display_date.value = this.value}
		  });
		f.ws__display_date.value = b.value;
		b = new ws_Button({
			id: "ws_contentControl",
			value: elt.getAttribute("data-display_content"),
			onClick: function(){f.ws__display_content.value = this.value}
		  });
		f.ws__display_content.value = b.value;
	};
});

// USER SELECTION UPDATE FORM
// ----------------------------------------
new ws_ElementForm('wsshowselection_form', function(){
	this.HTML = this.buildForm();
});
