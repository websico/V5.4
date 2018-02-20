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
 *	STYLE CONTROL OBJECT
 *  ---------------------------------------
 *
 *	Versatile control object to manage most of style properties.
 *	Made of basic controls (buttons, sliders, etc.).
 *  Should be revisited and maybe respecified...
 */

//	GENERIC STYLE CONTROL
//	---------------------
function ws_StyleControl(settings) {
	settings.id = settings.id || settings.name;    // Default id is name of the property

	this.id = settings.id;                         // Id of the control
	this.name = settings.name || settings.id;      // Name of the controlled property

	this.onStart = settings.onStart || function(){};
	this.onChange = settings.onChange || function(){};
	this.onShiftChange = settings.onShiftChange || function(){};
	this.onEnd = settings.onEnd || function(){};
	// onDefault = 0 must be kept to inhibit default button in some case
	this.onDefault = 'onDefault' in settings ? settings.onDefault : function(){};

	this.noAutoReset = settings.noAutoReset || false;   // Non noAutoReset controls are resetted by resetAll()
	if (settings.resetValue)						// Overload prototype
		this.resetValue = settings.resetValue;

	//	SELECT
	if (settings.options) {
		this.ws_control = new ws_Select(settings);
		this.setValue = function(value){this.ws_control.setValue(value)};
		this.onChange = settings.onChange || function(){ws_updateStyle(this.name, this.ws_control.value);};
		this.ws_control.onChange = function(){this.elt.ws_styleControl.onChange();};
		this.ws_control.onMouseOverOption = function(index){ws_quickUpdateStyle(this.elt.ws_styleControl.name, this.options[index].value);};
		this.ws_control.onClose = function(){ws_quickUpdateStyle(this.elt.ws_styleControl.name, this.value);}
	}
	//	RADIO BUTTON
	else if ('trueValue' in settings || 'falseValue' in settings || 'onTrue' in settings || 'onFalse' in settings) {
		// trueValue can be 0 or false, default trueValue is id
		this.trueValue = 'trueValue' in settings ? settings.trueValue : settings.id;
		this.falseValue = settings.falseValue || '';
		settings.onTrue = settings.onTrue || onChangeBoolean;
		settings.onFalse = settings.onFalse || onChangeBoolean;
		this.ws_control = new ws_Button(settings);
		this.ws_control.ws_styleControl = this;
		this.setValue = setBoolean;
	}
	//	COLOR CHOOSER
	else if (settings.type == "colorControl") {
		this.ws_colorControl = colorControlBuilder.call(this, settings);
	}
	//	SHADOW CONTROL
	else if (settings.type == "shadowControl") {
		this.ws_colorControl = shadowControlBuilder.call(this, settings);
	}
	//	QUAD NUMERIC
	else if (settings.type == "quadControl") {
		this.setValue = function(){};
		var html = '<table class="ws_quadStyleInput">';
		html += '<tr><td><b>' + $Str.allSides + ':&nbsp;</b></td><td><div id="' + this.name + 'All"></div></td></tr>';
		html += '<tr><td>' + $Str.topSide + ':&nbsp;</td><td><div id="' + this.name + 'Top"></div></td></tr>';
		html += '<tr><td>' + $Str.rightSide + ':&nbsp;</td><td><div id="' + this.name + 'Right"></div></td></tr>';
		html += '<tr><td>' + $Str.bottomSide + ':&nbsp;</td><td><div id="' + this.name + 'Bottom"></div></td></tr>';
		html += '<tr><td>' + $Str.leftSide + ':&nbsp;</td><td><div id="' + this.name + 'Left"></div></td></tr>';
		html += '</table>';
		document.getElementById(settings.id).innerHTML += html;
		var quad = new ws_StyleControl({id: this.name + "All", name: this.name,
			min: 0, unit: "px",
			onEnd: propagateValue
		});
		quad.TopControl = new ws_StyleControl({name: this.name + "Top", min: 0, unit: "px"});
		quad.LeftControl = new ws_StyleControl({name: this.name + "Left", min: 0, unit: "px"});
		quad.RightControl = new ws_StyleControl({name: this.name + "Right", min: 0, unit: "px"});
		quad.BottomControl = new ws_StyleControl({name: this.name + "Bottom", min: 0, unit: "px"});
	}
	//	X AND Y NUMERIC
	else if (settings.orientation == 3) {
		this.unit = settings.unit || '';
        this.separator = settings.separator || ' ';
        settings.onStart = onStartNumeric;
		settings.onChange = onChangeNumeric;
		settings.onShiftChange = onShiftChangeNumeric;
		settings.onEnd = onEndNumeric;
		settings.ws_styleControl = this;
		this.ws_control = new ws_Input(settings);
		this.setValue = setNumeric;
	}
	//	NUMERIC
	else {
		this.unit = settings.unit || '';
		if (this.unit == 'em')    // em unit is a bit confusing for users
            delete(settings.unit);
        settings.onStart = onStartNumeric;
		settings.onChange = onChangeNumeric;
		settings.onShiftChange = onShiftChangeNumeric;
		settings.onEnd = onEndNumeric;
		settings.onDefault = this.onDefault ? onDefault : 0;
		settings.ws_styleControl = this;
		this.ws_control = new ws_Input(settings);
		this.setValue = setNumeric;
	}

	var elt = document.getElementById(settings.id);
	elt.ws_styleControl = this;
	if (!elt.title.length && settings.id in $Str)
		elt.title = $Str[settings.id];
    if (settings.name) {
        elt.title += (elt.title ? ' ' : '') + '<' + settings.name + (this.trueValue ? ':' + this.trueValue : '') + '>';
    }
    if (elt.getAttribute('data-CSS3'))
        elt.title += ' (CSS3)';
	this.styleControlElement = elt;
	ws_StyleControl.controls.push(this);

    //  PRIVATE
    //  ---------------------------------------
    
    //  ALL CONTROLS FUNCTIONS AND CALLBACKS
    //  onXxx user handlers work like normal event handlers:
    //  if they return false the standard processing is aborted.
    //  --------------------------------------------------------
    function onDefault(){
    	var cntrl = this.ws_styleControl;	// Called from the low-level control
        if (cntrl.onDefault() != false) {
        	ws_updateStyle(cntrl.name, '');
        	cntrl.resetValue();
        	cntrl.onEnd();
    //    	ws_computeLayout(true);
    //    	ws_highlightElement();
        }
    }

    //	BOOLEAN CONTROL / RADIO BUTTON
    //	------------------------------
    function setBoolean(value) {
    	if (this.name == 'textDecoration') {			// Hum, textDecoration is a cumulative property
            this.ws_control.setValue(value.indexOf(this.trueValue) != -1)
    	} else {
            this.ws_control.setValue(value == this.trueValue);
        }
    }
    function onChangeBoolean(byExclusion) {	// Called from the low-level control (ws_Button)
    	var cntrl = this.ws_styleControl;
    	var value = this.value ? cntrl.trueValue : cntrl.falseValue;
    	if (cntrl.name == 'textDecoration') {			// Hum, textDecoration is a cumulative property
    		var v = ws_selectedStyleValue(cntrl.name);
    		if (v != cntrl.falseValue) {
    			value = v.replace(cntrl.trueValue, '');
    			if (this.value)
    				value += ' ' + cntrl.trueValue;
    			else if (value.replace(' ', '').length == 0)
    				value = cntrl.falseValue;
    		}
    	}
    	ws_delayedUpdateStyle(cntrl.name, value);
    	if (!byExclusion) {
    		ws_updateStyle();
    		ws_computeLayout(true);
    	}
    }

    //	QUAD NUMERIC CONTROL
    //	--------------------
    function propagateValue() {
    	ws_updateStyle(
    				this.name + "Top", "",
    				this.name + "Right", "",
    				this.name + "Bottom", "",
    				this.name + "Left", "");
    	this.TopControl.resetValue();
    	this.RightControl.resetValue();
    	this.BottomControl.resetValue();
    	this.LeftControl.resetValue();
    }

    //	NUMERIC CONTROL
    //	---------------
    //	We must take in account the case of two dims control,
    //	like backgroundPosition... argh :-(
    //	--------------------------------------------------------
    function setNumeric(value, def) {
      	if (this.ws_control.orientation == 3) {		// Bidirectional
      	  	if (typeof(value) == 'string' && value.indexOf(' ') != -1) {
    			value = value.split(' ');
    			this.ws_control.setValue(value[0], value[1]);
    		}
    	} else {
    		this.ws_control.setValue(value);		// Mono
    		this.ws_control.setDefault(def || ws_isDefaultValue(this.name));
    	}
    }
    function onStartNumeric() {
    	var cntrl = this.ws_styleControl;
    	if (cntrl.onStart() != false)
    		cntrl.setValue(ws_actualStyleValue(cntrl.name));
    }
    function onChangeNumeric() {				// Called from the low-level control (ws_Input)
    	var cntrl = this.ws_styleControl;
    	if (cntrl.onChange() != false) {
    		ws_quickUpdateStyle(cntrl.name,
    			this.value + cntrl.unit + (this.orientation == 3 ? cntrl.separator + this.yValue + cntrl.unit : ''));
    	}
    }
    function onShiftChangeNumeric() {			// Called from the low-level control (ws_Input)
    	var cntrl = this.ws_styleControl;
    	if (cntrl.onShiftChange() != false) {
    		ws_updateStyle(cntrl.name,
    			this.value + cntrl.unit + (this.orientation == 3 ? cntrl.separator + this.yValue + cntrl.unit : ''));
    	}
    }
    function onEndNumeric() {					// Called from the low-level control (ws_Input)
    	var cntrl = this.ws_styleControl;
        if (cntrl.onEnd() != false) {
    		ws_updateStyle(cntrl.name,
    			this.value + cntrl.unit + (this.orientation == 3 ? cntrl.separator + this.yValue + cntrl.unit : ''));
    		if (this.value == '')
    			cntrl.resetValue();
    		ws_computeLayout(true);
    		ws_highlightElement();
    	}
    }

    //	COLOR CONTROL
    //	-------------
    function colorControlBuilder(settings) {
      	for (var i in settings)		// Settings overload defaults
    		this[i] = settings[i];
   
      	// Output html
      	var html = '<table><tr><td id="ws_' + this.name + 'redCntrl" class="ws_redCntrl" title="' + $Str.red + '"></td>';
      	html += '<td id="ws_' + this.name + 'greenCntrl" class="ws_greenCntrl" title="' + $Str.green + '"></td>';
      	html += '<td id="ws_' + this.name + 'blueCntrl" class="ws_blueCntrl" title="' + $Str.blue + '"></td>';
      	var kInput = "ws_" + settings.id + 'Kinput';
      	html += '<td><input id="' + kInput + '" size="8" class="ws_kInput" type="text">';
    	html += '<div style="margin: 5px"></div><div class="ws_colorPickerImg" title="' + $Str.colormap + '"><img onclick="ws_StyleControl.colorPicker(document.getElementById(\'' + settings.id + '\').ws_styleControl, event.clientY + ws_getScrollY(), event.clientX + ws_getScrollX())" src="' + WS_CORE_PATH + '/ws_images/ws_color_scale.jpg"></div>';
    	html += '<span id="ws_' + this.name + 'Default" class="ws_buttonDefault" title="' + $Str.dft + '"></span></td></tr></table>';
      	html += '<table><tr><td><img src="' + WS_CORE_PATH + 'ws_images/ws_light_min.gif"></td><td id="ws_' + this.name + 'LightCntrl" class="ws_lightCntrl" title="' + $Str.lightness + '"></td><td><img src="' + WS_CORE_PATH + 'ws_images/ws_light_max.gif"></td></tr>';
      	html += '<tr><td><img src="' + WS_CORE_PATH + 'ws_images/ws_saturation_min.gif"></td><td id="ws_' + this.name + 'SaturationCntrl" class="ws_lightCntrl" title="' + $Str.saturation + '"></td><td><img src="' + WS_CORE_PATH + 'ws_images/ws_saturation_max.gif"></td></tr></table>';
    	document.getElementById(settings.id).innerHTML += html;
    
    	// Control setup
      	for (var i in {red: 1, green: 1, blue: 1}) {			// RGB sliders
    		this[i + "Cntrl"] = new ws_Input({orientation: 1, id: "ws_" + this.name + i + "Cntrl",
				ws_styleControl: this,
    			min: 0, max: 255, value: 128, kInputSize: 0,
    			onChange: onChangeColor, onShiftChange: onShiftChangeColor, onEnd: onEndColor
    		  });
    	}
    	this.kInput = document.getElementById(kInput);			// Keyboard input
      	this.kInput.onkeyup = keyboardInput;
      	this.kInput.ws_styleControl = this;
    	this.defCntrl = new ws_Button({							// Default color button
    		id: "ws_" + this.name + "Default",
			ws_styleControl: this,
    		trueButton: true,
    		onTrue: onDefault
    	  });
    	this.lightCntrl = new ws_Input({						// Brightness slider
    		id: "ws_" + this.name + "LightCntrl",
			ws_styleControl: this,
    		min: 0, max: 255*3, amplitude: 100, kInputSize: 0,
    		onStart: onStartLight,
    		onChange: onChangeLight, onShiftChange: onShiftChangeLight, onEnd: onEndLight
    	  });
    	this.saturationCntrl = new ws_Input({					// Saturation slider
    		id: "ws_" + this.name + "SaturationCntrl",
			ws_styleControl: this,
    		min: -255, max: 255, amplitude: 50, kInputSize: 0,
    		onStart: onStartSaturation,
    		onChange: onChangeSaturation, onShiftChange: onShiftChangeSaturation, onEnd: onEndSaturation
    	  });

    	this.resetValue = resetColor;
    	this.getValue = function(){return this.kInput.value};
    	this.setValue = setColor;
    }
    
    //	Methods
    //	-------
    validColors = {transparent: 1, red: 1, green: 1, blue: 1};
    
    function resetColor() {
    	this.setValue(ws_selectedStyleValue(this.name));
    	this.defCntrl.setValue(ws_isDefaultValue(this.name));
    }
    function setColor(value) {	// Color value is formated #hhhhhh
    	if (value.search(/rgba?\(/i) == 0) {
    	  	var values = value.split(',');
    	  	value = '#' + ws_hexByte[parseInt(values[0].split('(')[1])]
    		  			+ ws_hexByte[parseInt(values[1])]
    		  			+ ws_hexByte[parseInt(values[2])];
    	}
    	if (value.charAt(0) == '#') {
    		this.redCntrl.setValue(parseInt(value.substr(1, 2), 16));
    		this.greenCntrl.setValue(parseInt(value.substr(3, 2), 16));
    		this.blueCntrl.setValue(parseInt(value.substr(5, 2), 16));
    	} else if (!(value in validColors) && value != '') {
    		return;
    	}
    	this.kInput.value = value;
    	this.defCntrl.setValue(false);
    }
    
    //	Callback methods of children controls
    //	-------------------------------------
    function keyboardInput(event) {			// Text input of color or shadow
		event = window.event || event;
    	if (event.keyCode != 37 && event.keyCode != 39){
	    	var cntrl = this.ws_styleControl;
	    	if (this.value.trim().length) {
	    		cntrl.setValue(this.value);
	    		ws_updateStyle(cntrl.name, this.value);
	    	} else {
	    		cntrl.defCntrl.onTrue();
	    	}
	        cntrl.onEnd();
	    }
    }
    function onChangeColor() {			// RGB sliders
      	var cntrl = this.ws_styleControl;
    	cntrl.setValue('#' + ws_hexByte[cntrl.redCntrl.value] + ws_hexByte[cntrl.greenCntrl.value] + ws_hexByte[cntrl.blueCntrl.value]);
    	ws_quickUpdateStyle(cntrl.name, cntrl.kInput.value);
    }
    function onShiftChangeColor() {
      	var cntrl = this.ws_styleControl;
    	cntrl.setValue('#' + ws_hexByte[cntrl.redCntrl.value] + ws_hexByte[cntrl.greenCntrl.value] + ws_hexByte[cntrl.blueCntrl.value]);
    	ws_updateStyle(cntrl.name, cntrl.kInput.value);
    }
    function onEndColor() {
    	var cntrl = this.ws_styleControl;
    	ws_updateStyle(cntrl.name, cntrl.kInput.value);
        cntrl.onEnd();
    }
    function onStartLight() {			// Lightness slider, empirical algorithm
    	var cntrl = this.ws_styleControl;
    	this.savedRed = cntrl.redCntrl.value;
    	this.savedGreen = cntrl.greenCntrl.value;
    	this.savedBlue = cntrl.blueCntrl.value;
    	this.value = this.savedRed + this.savedGreen + this.savedBlue;
    	this.origin = this.value;
    }
    function onChangeLight() {
      	var cntrl = this.ws_styleControl;
      	var offset = this.value - this.origin;
    	var red = Math.max(Math.min(this.savedRed + offset, 255), 0);
    	var green = Math.max(Math.min(this.savedGreen + offset, 255), 0);
    	var blue = Math.max(Math.min(this.savedBlue + offset, 255), 0);
    	cntrl.setValue('#' + ws_hexByte[red] + ws_hexByte[green] + ws_hexByte[blue]);
    	ws_quickUpdateStyle(cntrl.name, cntrl.kInput.value);
    }
    function onShiftChangeLight() {
      	this.onChange();
      	var cntrl = this.ws_styleControl;
    	ws_updateStyle(cntrl.name, cntrl.kInput.value);
    }
    function onEndLight() {
    	var cntrl = this.ws_styleControl;
    	ws_updateStyle(cntrl.name, cntrl.kInput.value);
        cntrl.onEnd();
    }
    function onStartSaturation() {		// Saturation slider, empirical algorithm
    	var cntrl = this.ws_styleControl;
    	this.savedRed = cntrl.redCntrl.value;
    	this.savedGreen = cntrl.greenCntrl.value;
    	this.savedBlue = cntrl.blueCntrl.value;
		this.pivot = Math.round((this.savedRed + this.savedGreen + this.savedBlue) / 3);
		this.value = 0;
    }
    function onChangeSaturation() {
      	var cntrl = this.ws_styleControl;
      	
      	var red = this.savedRed;
      	if (red > this.pivot)
      		red = Math.max(Math.min(red + this.value, 255), this.pivot);
      	else if (red < this.pivot)
      		red = Math.min(Math.max(red - this.value, 0), this.pivot);
      		
      	var green = this.savedGreen;
      	if (green > this.pivot)
      		green = Math.max(Math.min(green + this.value, 255), this.pivot);
      	else if (green < this.pivot)
      		green = Math.min(Math.max(green - this.value, 0), this.pivot);
      		
      	var blue = this.savedBlue;
      	if (blue > this.pivot)
      		blue = Math.max(Math.min(blue + this.value, 255), this.pivot);
      	else if (blue < this.pivot)
      		blue = Math.min(Math.max(blue - this.value, 0), this.pivot);
      		
    	cntrl.setValue('#' + ws_hexByte[red] + ws_hexByte[green] + ws_hexByte[blue]);
    	ws_quickUpdateStyle(cntrl.name, cntrl.kInput.value);
    }
    function onShiftChangeSaturation() {
      	this.onChange();
      	var cntrl = this.ws_styleControl;
    	ws_updateStyle(cntrl.name, cntrl.kInput.value);
    }
    function onEndSaturation() {
    	var cntrl = this.ws_styleControl;
    	ws_updateStyle(cntrl.name, cntrl.kInput.value);
        cntrl.onEnd();
    }

    //	SHADOW CONTROL
    //	--------------
    function shadowControlBuilder(settings) {
    	var me = this;
    	
      	for (var i in settings)		// Settings overload defaults
    		this[i] = settings[i];

      	// Output html
		var html = '<div style="float: left" id="ws_' + this.name + 'Offset" title="' + $Str.shadowOffset + '"></div>'
			+ '<div style="float: left; padding-top: 0.4em;">' + $Str.shadowBlur + ':&nbsp;</div><div id="ws_' + this.name + 'Blur" class="ws_smallSlider" title="' + $Str.shadowBlur + '"></div>'
			+ '<div class="ws_colorPickerImg" title="' + $Str.colormap + '"><img onclick="ws_StyleControl.colorPicker(document.getElementById(\'' + settings.id + '\').ws_styleControl.colorInterface, event.clientY + ws_getScrollY(), event.clientX + ws_getScrollX())" src="' + WS_CORE_PATH + '/ws_images/ws_color_scale.jpg"></div>';
		if (settings.spread)
			html += '<div style="float: left; clear: left; padding-top: 0.3em;">' + $Str.shadowSpread + ':&nbsp;</div><div id="ws_' + this.name + 'Spread" class="ws_smallSlider" title="' + $Str.shadowSpread + '"></div>';
		if (settings.inset)
			html += '<div style="clear: left" id="ws_' + this.name + 'Inset" title="' + $Str.shadowInset + '" class="ws_buttonText">' + $Str.shadowInset + '</div>';
      	var kInput = "ws_" + settings.id + 'Kinput';
		html += '<input id="' + kInput + '" title="' + $Str[this.name] + ' <' + this.name + '> (CSS3)">'
			+ '<span id="ws_' + this.name + 'Default" title="' + $Str.dft + '" class="ws_buttonDefault"></span>';
    	document.getElementById(settings.id).innerHTML += html;

    	// Control setup
    	this.offsetCntrl = new ws_Input({					// Offset slider
			id: 'ws_' + this.name + 'Offset',
			ws_styleControl: this,
			step: 1, amplitude: 10, orientation: 3, kInputSize: 0,
			onChange: function(){
					return onChangeShadow.call(this, {offsetX: this.value + 'px', offsetY: this.yValue + 'px'});
				},
			onShiftChange: onShiftChangeShadow,
			onEnd: onEndShadow
		  });

    	this.blurCntrl = new ws_Input({						// Blur slider
			id: 'ws_' + this.name + 'Blur',
			ws_styleControl: this,
			step: 1, min: 0, amplitude: 15, kInputSize: 0, onDefault: 0,
			onChange: function(){
					return onChangeShadow.call(this, {blur: this.value + 'px'});
				},
			onShiftChange: onShiftChangeShadow,
			onEnd: onEndShadow
		  });

        if (settings.spread){								// Spread slider
	    	this.spreadCntrl = new ws_Input({
				id: 'ws_' + this.name + 'Spread',
				ws_styleControl: this,
				step: 1, amplitude: 15, kInputSize: 0, onDefault: 0,
				onChange: function(){
						return onChangeShadow.call(this, {spread: this.value + 'px'});
					},
				onShiftChange: onShiftChangeShadow,
				onEnd: onEndShadow
			  });
	    }
	    
	    if (settings.inset){								// Inset switch
			this.insetCntrl = new ws_Button({
				id: 'ws_' + this.name + 'Inset',
				ws_styleControl: this,
				onTrue: function(){
					me.setValue({inset: 'inset'});
					ws_updateStyle(me.name, me.getValue())},
				onFalse: function(){
					me.setValue({inset: ''});
					ws_updateStyle(me.name, me.getValue())},
			  });
		}  

    	this.kInput = document.getElementById(kInput);		// Keyboard input
      	this.kInput.onkeyup = keyboardInput;
      	this.kInput.ws_styleControl = this;

    	this.defCntrl = new ws_Button({						// Default button
    		id: 'ws_' + this.name + 'Default',
    		trueButton: true,
    		onTrue: onDefault
    	  });
    	this.defCntrl.ws_styleControl = this;
    	
		this.colorInterface = {								// Interface for color picker
			resetValue: function(){},
			getValue: function(){return me.parseValue().color},
			setValue: function(value){onChangeShadow({color: value})},
			onEnd: function(){ws_updateStyle(me.name, me.getValue())}
		};

    	this.resetValue = resetShadow;
    	this.getValue = function(){return this.kInput.value};
    	this.parseValue = parseShadow;
    	this.setValue = setShadow;
    	
    	// Methods
    	function resetShadow(){
			this.setValue(ws_selectedStyleValue(this.name));
			this.offsetCntrl.setValue(this.parseValue().offsetX, this.parseValue().offsetY);
			this.blurCntrl.setValue(this.parseValue().blur);
			if (this.spreadCntrl)
				this.spreadCntrl.setValue(this.parseValue().spread);
			if (this.insetCntrl)
				this.insetCntrl.setValue(this.parseValue().inset);
			this.defCntrl.setValue(ws_isDefaultValue(this.name));
		}
		function setShadow(value){
			if (typeof value == "string"){
				this.kInput.value = value;
			} else {
				var valueObj = this.parseValue();
				for (i in value){
			    	if (i == 'color' && value[i].search(/rgba?\(/i) == 0) {
			    	  	var values = value[i].split(',');
			    	  	value[i] = '#' + ws_hexByte[parseInt(values[0].split('(')[1])]
			    		  			+ ws_hexByte[parseInt(values[1])]
			    		  			+ ws_hexByte[parseInt(values[2])];
			    	}
					valueObj[i] = value[i];
				}
				this.kInput.value = (valueObj.offsetX + ' '	+ valueObj.offsetY + ' '
								+ valueObj.blur + ' ' + valueObj.spread + ' '
								+ valueObj.color + ' ' + valueObj.inset).trim();
			}
			this.defCntrl.setValue(false);
		}
		function parseShadow(){
				var ret = {offsetX: '', offsetY: '', blur: '', spread: '', color: '', inset: ''};
				var value = this.kInput.value;
				
				// special values as color must be processed and extracted before metrics
				// because color values could be taken as metrics
				if (value.length)
					ret.color = '#444';		// default color because of Safari
				if (value.indexOf('#') != -1)
					ret.color = value.replace(/.*(#[0-F]+).*/i, '$1');
				else if (value.indexOf('rgb') != -1)
					ret.color = value.replace(/.*(rgb.*\)).*/i, '$1');
				else if (value.indexOf('hsl') != -1)
					ret.color = value.replace(/.*(hsl.*\)).*/i, '$1');
				var wValue = value.replace(/(hsl.*\))|(rgb.*\))|(#[0-F]+)/i, '');
				if (value.indexOf('inset') != -1)
					ret.inset = 'inset';
				var j = 0;
				var metricValues = ['offsetX', 'offsetY', 'blur', 'spread'];
				var valueArray = wValue.split(' ');
				for (i = 0; i < valueArray.length; i++)
					if (valueArray[i].length && valueArray[i][0].match(/[0-9\-]/))
						ret[metricValues[j++]] = valueArray[i];
				return ret;
		}
		
		// Callbacks from children
		function onChangeShadow(value){
			me.setValue(value);
			ws_quickUpdateStyle(me.name, me.getValue());
			return false;
		}
		function onShiftChangeShadow(){
			this.onChange();
			return this.onEnd();			
		}
		function onEndShadow(){
			ws_updateStyle(me.name, me.getValue());
			return false;
		}
	}
}

//  PROTOTYPE
//  ---------
ws_StyleControl.prototype.resetValue =
	function() {
		this.setValue(ws_selectedStyleValue(this.name));
	};
ws_StyleControl.prototype.getValue =
	function() {
	  	return this.ws_control.value;
	};
ws_StyleControl.prototype.getYValue =
	function() {
	  	return this.ws_control.yValue || 0;
	};
ws_StyleControl.prototype.show =
	function() {
		this.styleControlElement.style.display = '';
	};
ws_StyleControl.prototype.hide =
	function() {
		this.styleControlElement.style.display = 'none';
	};

//  'CLASS' static attributes
//  -------------------------
ws_StyleControl.controls = new Array();     // An array of all style controls

ws_StyleControl.resetAll = function(){
	for (var i in this.controls) {
	  	var cntrl = this.controls[i];
	    if (!(cntrl.noAutoReset)) {
			// Hide control with id in mask
		  	if (cntrl.name in $Forms.ws_style_form.tabbedControl.mask) {
			  	cntrl.hide();
			} else {
				cntrl.show();		// Show before resetValue() because resetValue() can hide ;)
				cntrl.resetValue();
			}
		}
	}
};

//	Color picking
//	-------------
ws_StyleControl.colorPicker = function(colorControl, top, left){
  	var colormap = document.getElementById("ws_colormap");
  	var colorscale = colormap.getElementsByTagName("img")[0];
  	var colorblocks = document.getElementById("ws_color_blocks");
	var palette = ws_getColorsInUse();

	palette['transparent'] = 1;
	while (colorblocks.firstChild) 
	    colorblocks.removeChild(colorblocks.firstChild);
	for (var i in palette) {
		var colorBlock = document.createElement("div");
	  	colorBlock.ws_colormap = colormap;
		colorBlock.style.backgroundColor = i;
		colorBlock.className = "ws_colorBlock";
	  	colorBlock.onmouseover = colorBlockPicking;
		colorBlock.onclick = colorPick;
		colorblocks.appendChild(colorBlock);
	}
  	colormap.ws_colorControl = colorControl;
  	colormap.ws_value = colormap.ws_colorControl.getValue();
    colormap.ws_locked = false;
  	colormap.style.top = top + 'px';
  	colormap.style.left = left + 'px';
  	colormap.style.visibility = 'visible';
  	colormap.onmouseout = outColormap;
  	colorscale.ws_colormap = colormap;
  	colorscale.onmousemove = colorScalePicking;
	colorscale.onclick = colorPick;

    function colorScalePicking(event) {
        if (!this.ws_colormap.ws_locked){
          	event = window.event || event;
        	ws_overPopup = 1;		// A trick to avoid highlighing of container resize limits
          	var cntrl = this.ws_colormap.ws_colorControl;
          	var thisRect = this.getBoundingClientRect();
        	var h = Math.round((event.clientX - thisRect.left) * (370/this.offsetWidth)) - 5; // For h in [0,360] (with margins..)
        	if (h < 0) h = 0;
        	if (h > 359) h = 359;	// Not very proud of that, but otherwise...
        	var y = Math.round((event.clientY - thisRect.top) * (110/this.offsetHeight)) - 5;
        	if (y < 0) y = 0;
        	if (y > 100) y = 100;
        	var s = 1;
        	var v = 1;
        	if (y < 50)
        		s = y / 50;
        	else
        	  	v = (100 - y) / 50;
          	cntrl.setValue(hsvToRgb(h, s, v));
        	if (event.shiftKey)
        		ws_updateStyle(cntrl.name, cntrl.getValue());
        	else
        		ws_quickUpdateStyle(cntrl.name, cntrl.getValue());
        }
    }
    function colorBlockPicking(event) {
        if (!this.ws_colormap.ws_locked){
          	event = window.event || event;
          	var cntrl = this.ws_colormap.ws_colorControl;
          	cntrl.setValue(this.style.backgroundColor);
        	if (event.shiftKey)
        		ws_updateStyle(cntrl.name, cntrl.getValue());
        	else
        		ws_quickUpdateStyle(cntrl.name, cntrl.getValue());
        }
    }
    function outColormap(event) {
      	event = window.event || event;
        var target = event.toElement || event.relatedTarget;
        if (!this.contains(target)){
            closeColormap.call(this);
    	}
    }
    function colorPick() {
		var cntrl = this.ws_colormap.ws_colorControl;
        var colormap = this.ws_colormap;
        colormap.ws_locked = true;  // Freeze the instant value
        this.onmouseover = null;
      	colormap.ws_value = cntrl.getValue();
        closeColormap.call(colormap);
    	cntrl.onEnd();
    }
    function closeColormap() {
	  	var cntrl = this.ws_colorControl;
	  	cntrl.setValue(this.ws_value);
		ws_updateStyle(cntrl.name, this.ws_value);
        this.onmouseout = null;
		this.style.visibility = 'hidden';
		ws_overPopup = 0;
    }
    function hsvToRgb(h, s, v) {		// From Wikipedia formulas
      	var hi = Math.floor((h / 60) % 6);
      	var f = (h / 60) - hi;
    	var p = (v * (1 - s));
    	var q = (v * (1 - (f * s)));
    	var t = (v * (1 - ((1 - f) * s)));
    	switch (hi) {
    		case 0: r = v; g = t; b = p; break;
    		case 1: r = q; g = v; b = p; break;
    		case 2: r = p; g = v; b = t; break;
    		case 3: r = p; g = q; b = v; break;
    		case 4: r = t; g = p; b = v; break;
    		default: r = v; g = p; b = q;
    	}
    	r = Math.round(r * 255);
    	g = Math.round(g * 255);
    	b = Math.round(b * 255);
    	return ('#' + ws_hexByte[r] + ws_hexByte[g] + ws_hexByte[b]);
    }
};

