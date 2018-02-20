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
 *	--------------------------------------------------------------------------
 *	BASIC INTERACTIVE CONTROLS
 *	--------------------------------------------------------------------------
 */
var ws_jControls = ws_jControls || {buttonGroups: {}};
var ws_alpha_part = new RegExp(/[^0-9.\-]+.*/);

//  A control is declared by a <div> html element.
//  Controls can be setup one by one by javascript new(), or/and in html code
//  and calling ws_controlSetup() after declaration.
//  In last case, a special attribute in html contains a JSON-like formatted string
//  containing all parameters to setup the control.
//  For a button <div ws_button="member: value, ...">,
//  for a tabbed pane <div ws_tabbed_pane="member: value, ...">,
//  for a slider <div ws_input="member: value, ...">
//  See examples and each control to find a parameter description.

//  Setup of html-defined controls
//  ------------------------------
//  The function can be called with or without arguments:
//  - ws_controlSetup(): setup all ws_jControls found in the DOM (ie with ws_xx attribute)
//  - ws_controlSetup(id1, id2): setup controls with id="id1" or id="id2"
//  It must be called after DOM initialization, for example at body onload.
//  When controls are not named, all <div> elements are checked, so it can take a bit of
//  time ! In that case it's preferable to use ws_controlSetup(id1, id2, ..), or to use
//  pure javascript setup, by "newing" each control object.
//  --------------------------------------------------------------------------------------
function ws_controlSetup(eltIdsToSetup) {
    if (!eltIdsToSetup) {   // By default, setup all controls
        var divs = document.getElementsByTagName('div');
    } else {                // Setup identified controls
        var divs = new Array();
        for (var i = 0; i < arguments.length; i++)
            divs[divs.length] = document.getElementById(arguments[i]);
    }
    for (var i = 0; i < divs.length; i++) {
        if (settings = divs[i].getAttribute('ws_input'))
            new ws_Input(eval('settings = {' + settings + '}'), divs[i]);
        else if (settings = divs[i].getAttribute('ws_button'))
            new ws_Button(eval('settings = {' + settings + '}'), divs[i]);
        else if (settings = divs[i].getAttribute('ws_select'))
            new ws_Select(eval('settings = {' + settings + '}'), divs[i]);
        else if (settings = divs[i].getAttribute('ws_file_input'))
            new ws_FileInput(eval('settings = {' + settings + '}'), divs[i]);
        else if (settings = divs[i].getAttribute('ws_tabbed_pane'))
            new ws_TabbedPane(eval('settings = {' + settings + '}'), divs[i]);
    }
}

//--------------------------------------------------------------------------
//  				NUMERIC INPUT (SLIDER, WHEEL, MAP..)
//	Actually a non numeric value can be typed in, but not managed by slider
//--------------------------------------------------------------------------
function ws_Input(settings, domElt) {
					       // Settings ----------
	this.id = 0;				// Associated DOM element id (must be set in settings if !domElt)
	this.unit = "";				// A string for unit label just after slider
  	this.min = -2000000000;		// Low limit
  	this.max = 2000000000;		// High limit
	this.value = 0;				// Initial value of the control
	this.yValue = 0;			// Case of 2 dimensions
  	this.step = 1;				// Resolution, used also for decimal precision
  	this.amplitude = 0;			// Number of units in a length of slider
  	this.speed = 1;				// Mouse move ratio, may be useful under some obscure circumstances :)
  	this.orientation = 2;		// 1 => vertical, 2 => horizontal, 3 => 2 dimensions
	this.kInputSize = 2;		// Size of text input, 0 for no keyboard input
  	this.onStart = function(){};             // User pressed mouse button on the slider
  	this.onChange = function(value){};       // User moved mouse to value with button pressed
  	this.onShiftChange = function(value){};  // User moved mouse to value whith button and shift key pressed
  	this.onEnd = function(value){};          // User released mouse button after moving, or typed a character in input
  	this.onDefault = function(){};           // User clicked the default button, created if this parameter is set
  	for (var i in settings)		// Settings overload defaults
		this[i] = settings[i];
					       // Internals and fixes ----------
    this.elt = domElt || document.getElementById(this.id);  // Associated DOM element
    this.id = this.id || this.elt.id || Math.random();      // Assign an id
    this.elt.id = this.id;
    this.elt.ws_control = this;

	this.setDefault = function(){};		                    // Function to set default true or false
  	this.unitsPerPixel = 0;                                 // As it says
  	this.definedInterval = ('min' in settings && 'max' in settings);
  	if (!this.amplitude && this.definedInterval)
  		this.amplitude = this.max - this.min;

  	var sliderId = this.id + '_WSslider';
  	var inputId = this.id + '_WSinput';
  	var yInputId = this.id + '_WSyInput';
  	var defaultButtonId = this.id + '_WSdefault';
	var html = '';
  	
  	// Slider
  	var sliderClass;
  	switch (this.orientation) {
  		case 1: sliderClass = " ws_vSlider"; break;
  		case 2: sliderClass = " ws_hSlider"; break;
		case 3: sliderClass = " ws_2dimSlider";
	}
	html += '<div id="' + sliderId + '" class="ws_slider ' + sliderClass + '"><div class="layer1"></div></div>';
	
	// Optional keyboard input
  	if (this.kInputSize) {
		html += '<input id="' + inputId + '" class="ws_kInput" type="text" size="' + this.kInputSize + '"';
		html += 'onkeyup="if (!this.value.replace(\' \', \'\').length) this.ws_inputObj.onDefault(); else {this.ws_inputObj.setValue(this.value); this.ws_inputObj.onEnd()}" />&nbsp;' + this.unit;
  		if (this.orientation == 3) {
			html += '<br /><input id="' + yInputId + '" class="ws_kInput" type="text" size="' + this.kInputSize + '"';
			html += 'onkeyup="this.ws_inputObj.setValue(this.ws_inputObj.value, this.value); this.ws_inputObj.onEnd()" />&nbsp;' + this.unit;
  		}
	}

	// Optional default button
	if (settings.onDefault) {
		html += '<div id="' + defaultButtonId + '" class="ws_buttonDefault"';
		html += ' title="' + ($Str.dft || 'Default') + '"';
		html += '></div>';
	}

	// DOM elements related inits
	this.elt.innerHTML += html;			// Append html! do not erase preexistant
	this.elt.className += " ws_Input";
	this.slider = document.getElementById(sliderId);
	this.slider.ws_inputObj = this;
	this.slider.onmousedown = function(event) {this.ws_inputObj.start(event); return false;};
  	if (this.kInputSize) {
  		this.input = document.getElementById(inputId);
  		this.input.ws_inputObj = this;
  		if (this.orientation == 3) {
	  		this.yInput = document.getElementById(yInputId);
	  		this.yInput.ws_inputObj = this;
  		}
  	}
	if (settings.onDefault) {
		this.defaultButton = new ws_Button({
			id: defaultButtonId,
			trueButton: true,
			onTrue: function(){this.ws_inputObj.onDefault();}
		  });
		this.setDefault = function(bValue){this.defaultButton.setValue(bValue);};
		this.defaultButton.ws_inputObj = this;
	}
  	this.setValue(this.value, this.yValue);
}

ws_Input.prototype.computeScale =
	function() {
	  	var length = this.orientation == 1 ? this.slider.offsetHeight -5: this.slider.offsetWidth -3;
	  	if (this.amplitude)
	  	  	this.unitsPerPixel = this.amplitude / length;
	  	else if (this.definedInterval)
			this.unitsPerPixel = (this.max - this.min) / length;
	  	else
	  		this.unitsPerPixel = this.step;
	};

ws_Input.prototype.setValue =
	function(value, yValue) {
	  	for (var i = 0; i < arguments.length; i++) {
	  		if (typeof(arguments[i]) == "string") {
	  			arguments[i] = arguments[i].replace(' ', '');
				arguments[i] = arguments[i].replace(ws_alpha_part, '');
			} else if (typeof(arguments[i]) == "number" || arguments[i].length) {
			  	if (arguments[i] < this.min) arguments[i] = this.min;
				if (arguments[i] > this.max) arguments[i] = this.max;
			}
		}
	  	if (this.slider.offsetHeight) {	// offsetWidth and offsetHeight are not set up before display
			if (!this.unitsPerPixel)
				this.computeScale();
		  	var xPos = this.orientation == 1 ? 'left ' : Math.round(value / this.unitsPerPixel) + 'px';
		  	var yPos = this.orientation == 2 ? 'center ' :
			  						(this.orientation == 3 ? Math.round(yValue / this.unitsPerPixel) :
									  			this.slider.offsetHeight-Math.round(value / this.unitsPerPixel)-8) + 'px';
			this.slider.style.backgroundPosition = xPos + ' ' + yPos;
		}
	    this.value = value;
		if (this.input)
			this.input.value = value;
	    if (arguments.length > 1) {
			this.yValue = yValue;
			if (this.yInput)
				this.yInput.value = yValue;
		}
	    this.setDefault(false);
	};

ws_Input.prototype.start =
	function (event) {		// We enter here by mousedown callback of the slider
		event = window.event || event;

		// What we must do at start time
		this.onStart();
        this.slider.className += " active";

		// offsetWidth is not set up before display, so scale cannot be initialized at building time
		if (!this.unitsPerPixel)
			this.computeScale();

		// Precision = to get a result with same number of digits after decimal point than step
		// because some float computings introduce rounding errors
		var precision = (this.step % 1) ? new String(this.step).replace(/.*\.(.*)/, '$1').length : 0;
		precision = Math.pow(10, precision);

		// Set origin
		var originX = event.clientX;
		var originY = event.clientY;
		var originValue = this.value * 1;
		var yOriginValue = this.yValue * 1;

		// Event handlers
		var cntrl = this;
		if (window.ws_mouseCacheOn)	// A websico trick to prevent cursor and event issues
			ws_mouseCacheOn('inSlider');
		document.ws_saved_onmousemove = document.onmousemove;
		document.onmousemove = function(event) {
			event = window.event || event;
			if ((this.all && !event.button) || (!this.all && this.ws_mouse_walked_out)) {
				this.onmouseup();
				return false;
			}
			var delta = cntrl.orientation == 1 ? originY - event.clientY : event.clientX - originX;
			delta *= cntrl.unitsPerPixel * cntrl.speed;
			delta -= delta % cntrl.step;				// Round to step
			var value = Math.round((originValue + delta) * precision) / precision;
		  	if (cntrl.orientation == 3) {
				delta = (event.clientY - originY) * cntrl.unitsPerPixel * cntrl.speed;
				delta -= delta % cntrl.step;
		  	  	var yValue = Math.round((yOriginValue + delta) * precision) / precision;
			  	cntrl.setValue(value, yValue);
		  	} else {
			  	cntrl.setValue(value);
			}
	  		event.shiftKey ? cntrl.onShiftChange(value) : cntrl.onChange(value);
		  	return false;
		};
		document.ws_saved_onmouseup = document.onmouseup;
		document.onmouseup = function(event) {
		  	cntrl.onEnd();
		  	cntrl.slider.className = cntrl.slider.className.replace(' active', '');
		  	if (window.ws_mouseCacheOff)	// A websico trick to prevent cursor and event issues
				ws_mouseCacheOff();
			this.onmousemove = this.ws_saved_onmousemove;
			this.onmouseup = this.ws_saved_onmouseup;
			this.onmouseout = this.ws_saved_onmouseout;
		};

		// When a mouse up occurs out of the browser window we miss it and it's a mess
		// to get saved event handlers of document after that.
		// We don't know how to test mouse button status in mousemove handler with FF,
		// so we do something when mouse leaves document.
		document.ws_mouse_walked_out = 0;
		document.ws_saved_onmouseout = document.onmouseout;
		document.onmouseout = function(event){
			event = window.event || event;
			var toElt = event.relatedTarget || event.toElement;
			try {
				if (!toElt || toElt.tagName == 'HTML')
					this.ws_mouse_walked_out = 1;
			} catch (e) {}
		};
	};

//--------------------------------------------------------------------------
//  					BOOLEAN/RADIO BUTTON CONTROL
//--------------------------------------------------------------------------
function ws_Button(settings, domElt) {
					       // Settings ----------
	this.id = 0;				        // Associated DOM element id (must be set in settings if !domElt)
	this.group = {};					// A string or an array of names for mutual exclusion, transformed to an internal object
	this.trueInnerHTML = 0;				// Button display contents when true
	this.falseInnerHTML = 0;			// Button display contents when false
	this.trueButton = false;			// One way button: set true by mouseclick, set false only by program.
	this.value = 0;						// Value of the control
	this.disabled = 0;                  // As it says
	this.onClick = function(){};        // User has clicked
  	this.onTrue = function(){};         // User has clicked and the new value is true
  	this.onFalse = function(){};		// User has clicked and the new value is false
  										//		this function receives an argument saying if
  										//		it was set to false by mutual group exclusion
  	for (var i in settings)             // User settings overload
		this[i] = settings[i];
					       // Internals and fixes ----------
    this.elt = domElt || document.getElementById(this.id);  // Associated DOM element
    this.id = this.id || this.elt.id || Math.random();      // Assign an id
    this.elt.id = this.id;
    this.elt.ws_control = this;

	// Associated DOM element style and behaviour
  	var elt = this.elt;
  	elt.className += " ws_Button";
  	if (!elt.innerHTML.length) elt.innerHTML = '&nbsp;';	// To be visible
  	elt.onmousedown = function()                            // Must manage active status for ie
	  			{if (elt.className.indexOf(' active') == -1) elt.className += ' active'; return false;};
  	elt.onclick = function(){elt.ws_control.onCtrlClick(); return false;};

	// Exclusion management, store this button reference in appropriate groups
	// and store group names in this.group as members for cross referencing.
	if (settings.group) {
  	  	var groups = ws_jControls.buttonGroups;
		settings.group = (typeof(settings.group) == "string") ? [settings.group] : settings.group;
		this.group = {};
	  	for (var i = 0; i < settings.group.length; i++) {
	  	  	var group = settings.group[i];
			groups[group] = groups[group] || {};
			groups[group][this.id] = this;
	  	  	this.group[group] = 1;
		}
	}

	// Set initial value and disable status to load the right look
	this.setValue(this.value);
    this.setDisabled(this.disabled);
}

ws_Button.prototype.setDisabled =
	function(status) {
        if (!(this.disabled = status))
            this.elt.className = this.elt.className.replace(' disabled', '');
        else if (this.elt.className.indexOf(' disabled') == -1)
            this.elt.className += ' disabled';
	};

ws_Button.prototype.setValue =
	function(value, processExclusion) {
		var elt = this.elt;

		this.value = value ? 1 : 0;		// 0/1 is better than true/false when transmitted by a form: "true" or "false" are strings are both logically true.
		elt.className = elt.className.replace(' true', '').replace(' false', '').replace(' active', '');
		elt.className = elt.className + (this.value ? ' true' : ' false');
		if (this.value && this.trueInnerHTML)
			elt.innerHTML = this.trueInnerHTML;
		if (!this.value && this.falseInnerHTML)
			elt.innerHTML = this.falseInnerHTML;
		if (processExclusion && value && this.group) {	// Exclusion management
			for (var i in this.group) {
		  	  	var group = ws_jControls.buttonGroups[i];
				for (var j in group) {
				  	var b = group[j];
					if (b != this && b.value) {
						b.setValue(false);
						b.onFalse("byExclusion");
					}
				}
			}
		}
	};

ws_Button.prototype.onCtrlClick =
	function() {
        if (!this.disabled) {
    		this.setValue((!this.value | this.trueButton), true);
    		this.onClick(this.value);
    		this.value ? this.onTrue() : this.onFalse();
        }
	};

//--------------------------------------------------------------------------
//  					SELECT CONTROL
//--------------------------------------------------------------------------
function ws_Select(settings, domElt) {
					       // Settings ----------
	this.id = 0;							// Associated DOM element id (must be set in settings if !domElt)
	this.value = 0;							// Value of the control, scalar or array of options in case of multi selection
	this.options = new Array();				// Array of options {value: <string>, innerHTML: <html string>, selected: <boolean>, custom_members: ...}
	this.disabled = 0;						// As it says
	this.onClick = function(){};			// User clicked the control
	this.onChange = function(index){};		// User clicked an option, index in this.options
	this.onMouseOverOption = function(index){}; // Cursor is over an option, index in this.options
	this.onClose = function(){};            // Called on option panel closing (mouseout)
	this.multiSelect = 0;                   // Contains string to display in case of multiselection
  	for (var i in settings)					// User settings overload
		this[i] = settings[i];
					       // Internals and fixes ----------
    this.elt = domElt || document.getElementById(this.id);  // Associated DOM element
    this.id = this.id || this.elt.id || Math.random();      // Assign an id
    this.elt.id = this.id;
    this.elt.ws_control = this;
    this.optionsPanel = 0;      // Options popup

	// Associated DOM element style and behaviour
  	var elt = this.elt;
  	if (!elt.ws_selectObj) {
        elt.className += " ws_Select";
      	elt.onclick = function(){elt.ws_selectObj.onCtrlClick(); return false;};
    }
	elt.ws_selectObj = this;   // Member name is not 'ws_select' because of IE confusions
    this.setDisabled(this.disabled);

    // Options panel
    this.optionsPanel = document.createElement('div');
    var opts = this.optionsPanel;
    opts.id = this.id + '_optionsPanel';
    opts.className = 'ws_Select optionsPanel';
	opts.style.position = 'absolute';
    opts.ws_selectObj = this;   // Member name is not 'ws_select' because of IE confusions
    opts.onmouseout = function(e){
                // If not yet closed, reset when mouse quits the options panel
                // to a non child element destination (not yet closed is important for IE8
                // because onmouseout is raised after closing the panel by onCtrlChange())
                if (this.style.display != 'none') {
                    e = e || window.event;
                    var target = e.toElement || e.relatedTarget;
                    if (!this.contains(target)) {
                        this.style.display = 'none';
                        this.ws_selectObj.onClose();
                    }
                }
            };
    opts.onmousedown = opts.onmousemove = function(e){return false;};   // To prevent from draggging
    this.elt.parentNode.appendChild(opts);
	this.optionsPanel.style.display = 'none';

	if (this.multiSelect) {
        this.elt.innerHTML = '<div style="overflow: hidden">' + this.multiSelect + '</div>';
		this.setValue(this.options);
	} else {
		this.setValue(this.value || this.options[0].value);
	}
}

ws_Select.prototype.setValue =
	function(value) {
		this.value = value; // A scalar for simple select or an array of options for multiselect

        // Refresh options panel
        var html = '';
        for (i = 0; i < this.options.length; i++) {
            if (!this.options[i].innerHTML)
                this.options[i].innerHTML = this.options[i].value;
			if (!this.multiSelect)
				this.options[i].selected = (value == this.options[i].value);
            if ('value' in this.options[i]) {   // A real choice
                html += '<a class="option' + (this.options[i].selected ? ' selected' : '') + '"';
				html += ' onmouseover="this.parentNode.ws_selectObj.onMouseOverOption(' + i + ')"';
				html += ' onclick="this.parentNode.ws_selectObj.onCtrlChange(' + i + ', event)">';
				html += this.options[i].innerHTML + '</a>';
				if (!this.multiSelect && this.options[i].selected)
		        	this.elt.innerHTML = '<div style="overflow: hidden">' + this.options[i].innerHTML + '</div>';
            } else {                            // Just a title
                html += '<div>' + this.options[i].innerHTML + '</div>';
			}
        }
        this.optionsPanel.innerHTML = html;
	};

ws_Select.prototype.onCtrlClick =
	function() {
        if (!this.disabled) {   // Position is set up here to be more accurate (offsetWidth and parent not set before display)
            if (this.optionsPanel.style.display == 'none') {
                this.optionsPanel.style.display = 'block';
                var opHierarchy = this.optionsPanel.offsetParent;
                var x = y = 0;
                while (opHierarchy) {   // Must find common offsetParent
                    var selHierarchy = this.elt;
                    while (selHierarchy && opHierarchy != selHierarchy) {
                        x += selHierarchy.offsetLeft;
                        y += selHierarchy.offsetTop;
                        selHierarchy = selHierarchy.offsetParent;
                    }
                    if (selHierarchy)
                        break;
                    opHierarchy = opHierarchy.offsetParent
                }
                this.optionsPanel.style.left = x + 'px';
                this.optionsPanel.style.top = y + this.elt.offsetHeight + 'px';
                this.optionsPanel.focus();
            } else {
                this.optionsPanel.style.display = 'none';
            }
        }
	};

ws_Select.prototype.setDisabled =
	function(status) {
        if (!(this.disabled = status))
            this.elt.className = this.elt.className.replace(' disabled', '');
        else
            this.elt.className += ' disabled';
	};

ws_Select.prototype.onCtrlChange =
	function(index, event) {
		if (this.multiSelect) {
			var value = this.options;
		    this.options[index].selected = !(this.options[index].selected);
		} else {
			var value = this.options[index].value;
			this.optionsPanel.style.display = 'none';
		}
		this.setValue(value);   // A scalar or object value: the new value for the control
        this.onChange(index, event);
    };

//--------------------------------------------------------------------------
//  					FILE INPUT CONTROL
//--------------------------------------------------------------------------
function ws_FileInput(settings, domElt) {
					       // Settings ----------
	this.id = 0;							// Associated DOM element id (must be set in settings if !domElt)
	this.value = 0;							// Value of the control
	this.name = 0;							// Name of form file input
	this.size = 20;							// Size of input
	this.text = $Str.browse;				// Browse button text
	this.multiple = false;					// Multiple upload
	this.onChange = function(files){};		// User chose file(s), files = [{name: <fileName>}, {name: <fileName>}, ...]
  	for (var i in settings)					// User settings overload
		this[i] = settings[i];
					       // Internals and fixes ----------
    this.elt = domElt || document.getElementById(this.id);  // Associated DOM element
    this.id = this.id || this.elt.id || Math.random();      // Assign an id
    this.elt.id = this.id;

	// Associated DOM elements
	// As seen in litterature an input file field is written over a button, with opacity 0,
    // so that it is invisible but catch the click.
    // Interpretations have been made from that litterature to exactly fit the context
  	var elt = this.elt;
  	if (!elt.ws_control) {
          	elt.className += " ws_FileInput";
          	html = '<div class="visibleFileInput">' // Tried to save that div but didn't succeed :(
              	+ '<input size="' + this.size + '" />'   // To get the right size, equal to file input size
                + '<div class="ws_Button">' + this.text + '</div>'
              	+ '<input type="file" class="realFileInput" id="' + this.id + '_finput"'
              	    + (this.multiple ? 'multiple' : '')
          	        + ' onchange="this.parentNode.getElementsByTagName(\'input\')[0].value = this.value; this.ws_control.onChange(this.files || [{name: this.value}])"'
                    + ' name="' + this.name + '[]" size="' + (this.size + 1) + '" />' // Better alignment for FF
                + '</div>';
          	elt.innerHTML = html;
          	var realInput = document.getElementById(this.id + '_finput');
          	realInput.ws_control = this;
          	realInput.style.width = this.elt.getElementsByTagName('input')[0].offsetWidth + this.elt.getElementsByTagName('div')[1].offsetWidth + "px";
            // Top position is fixed for some browsers don't compute exactly top 0px
            // from CSS when the controled is in an inlined block
          	realInput.style.top = this.elt.getElementsByTagName('input')[0].offsetTop + "px";
    }
	elt.ws_control = this;   // Setup there because of test of existence
}

//------------------------------------------------------------------------------
//  	TABBED PANES (Inspired from works by Jonathan Hedley and Douglas Bowman)
//------------------------------------------------------------------------------
function ws_TabbedPane(settings, domElt) {
					       // Settings ----------
	this.id = 0;				                   // Associated DOM element id (must be set in settings if !domElt)
	this.onShowPane = function(){};                // General callback
	this.onSetup = function(){this.showPane()};    // Show first pane by default
  	for (var i in settings)                        // User settings overload
		this[i] = settings[i];
					       // Internals and fixes ----------
    this.elt = domElt || document.getElementById(this.id);  // Associated DOM element
    this.id = this.id || this.elt.id || Math.random();      // Assign an id
    this.elt.id = this.id;
    this.elt.ws_control = this;

	this.panes = {};         // Each member is a pane object, identified by its html element id
  	this.mask = {};          // An object which members are names of authorized panes
  	this.activePane = 0;

	// Insert a div with tab elements before panes
	// Compute max height to contain
	// Populate the panes object
	var tabsHtml = '\n<ul>';
	var tabbedPane = domElt || document.getElementById(this.id);	// Get the dom element
	tabbedPane.ws_tabbedPane = this;								// Keep a reference to object
	var paneContainer = tabbedPane.getElementsByTagName('div')[0];
	paneContainer.className += ' ws_tabPanes';
	var panes = paneContainer.childNodes;
	var maxHeight = paneContainer.offsetHeight;	// In case of height fixed by container
	for (var i = 0; i < panes.length; i++) {
	 	if (panes[i].nodeType == 1) {
	 	  	var pane = panes[i];
	 	  	tabsHtml += '\n<li><a href="javascript:void(0)" onmousedown="return false" onclick="document.getElementById(\'' + tabbedPane.id + '\').ws_tabbedPane.showPane(\'' + pane.id + '\'); return false">' + panes[i].getAttribute('name') + '</a></li>';
			if (pane.offsetHeight > maxHeight) maxHeight = pane.offsetHeight;
			this.panes[pane.id] = {		// New pane object
			  		pane: pane,                    // The pane html element
					onShowPane: this[pane.id],     // showPane callback for this one
					tab: 0};                       // Associated html tab element
			this.mask[pane.id] = 1;                // This pane is authorized
		}
	}
	tabsHtml += '\n</ul>';
	var tabs = document.createElement('div');
	tabs.innerHTML = tabsHtml;
	tabs.className = 'ws_tabs';
	tabbedPane.insertBefore(tabs, paneContainer);
	paneContainer.style.height = maxHeight + 'px';

	// Fix panes object, after html elements have been put in the DOM
	tabs = tabs.getElementsByTagName('li');
	var j = 0;
	for (var i in this.panes) {
		this.panes[i].tab = tabs[j++];
	}
	this.onSetup();
}

ws_TabbedPane.prototype.showPane = 
	function(paneId, mask) {
	  	// Optionnal mask
		if (mask)
			this.mask = mask;
		
		// If no pane specified we try with last opened one
		if (!paneId && this.activePane
                && (this.mask[this.activePane.pane.id] || (this.mask['allPanes'] && !(this.activePane.pane.id in this.mask))))
			paneId = this.activePane.pane.id;

	  	// Activate pane and tab
		for (var i in this.panes) {
		  	var pane = this.panes[i];
			pane.pane.style.display = "none";
			if (this.mask[pane.pane.id] || (this.mask['allPanes'] && !(pane.pane.id in this.mask))) {
			  	if (!paneId) paneId = i;		// First pane is active by default
				pane.tab.className = 'ws_tab';
			} else {							// Disable this one
				pane.tab.className = 'ws_tab_disabled';
			}
		}
		this.activePane = this.panes[paneId];
		this.activePane.pane.style.display = "block";
		this.activePane.tab.className = "ws_tab ws_tab_active";
		if (this.activePane.onShowPane)
			this.activePane.onShowPane(this);
		else
			this.onShowPane();
	};
