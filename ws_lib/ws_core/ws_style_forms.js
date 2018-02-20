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
 *  STYLE MEMBERS OF THE GLOBAL FORMS OBJECT
 *  ----------------------------------------
 */

//	SAVE A STYLE
//	------------
new ws_Form('ws_save_style_form', function(){
	this.HTML = this.buildForm(
			'<input type="hidden" name="ws_operation" value="update_user_style_sheet">'
			+ '<input type="hidden" name="ws_user_css_text">'
			+ $Str.saveStyleText
			+ '<input type="text" size="15" name="ws__user_style">',
	    '<button type="button" title="' + $Str.info + '" onclick="ws_openInfo(\'man_named_style\')"><svg viewBox="0 0 8 8"><use xlink:href="#ws_info"></use></svg></button>',
		$Str.saveStyle);

	// Callbacks, handlers
	// -------------------
	this.submit = function(){
	    var f = document.getElementById(this.id);
	    if (!f.ws__user_style.value || f.ws__user_style.value.search(/[^a-z0-9\-_]/i) != -1) {
			alert($Str.invalidName);
			return;
		}
	    if (f.ws__user_style.value in ws_currentStyleSheet.getStyles(ws_selectedElement.getAttribute('ws_class'))) {
	        ws_buildStyle(f.ws__user_style.value);
	        f.ws_user_css_text.value = ws_currentStyleSheet.getCssText();
	        ws_Form.alertAndConfirm($Str.saveStyle, f.ws__user_style.value + $Str.replaceStyle, this);
	        return;
	    }
		ws_buildStyle(f.ws__user_style.value);
		f.ws_user_css_text.value = ws_currentStyleSheet.getCssText();
		this.finalSubmit();
	};
});

// RESIZE A CELL
// -------------
new ws_Form('ws_cell_width_form', function(){
	this.HTML = this.buildForm(
			'<input type="hidden" name="ws_operation" value="update_user_style_sheet">'
			+ '<input type="hidden" name="ws_user_css_text">'
			+ '<div id="ws_cellWidthControl" class="ws_smallSlider"></div>',
		'',
		$Str.cellWidth);

	this.setup = function(){
		new ws_StyleControl({
				id: "ws_cellWidthControl", name: "width",
				resetValue: function(){
					var value = ws_selectedCssValue('width');
					if (value == false)
						value = Math.round((ws_selectedElement.offsetWidth * 1000) / ws_selectedElement.ws_owner.clientWidth) / 10;
					this.setValue(value);
					$Drag.cellResize.buildLimits();},
				onStart: function(){return false;},
				noAutoReset: true,
				min: 1, max: 100, step: 0.2, speed: 0.08, unit: "%"
		});
	};

	// Callbacks, handlers
	// -------------------
	this.onshow = function(){
		document.getElementById("ws_cellWidthControl").ws_styleControl.resetValue();
	};
});
    //  Cell height, same thing could be made when IE 8 is out
/*$Forms.ws_cell_height_form = {
	HTML: $Forms.buildPopup('ws_cell_height_form',
			'>'
				+ '<input type="hidden" name="ws_operation" value="update_user_style_sheet">'
				+ '<input type="hidden" name="ws_user_css_text">'
				+ '<div id="ws_cellHeightControl" class="ws_smallSlider"></div>',
			'',
			$Str.cellHeight),
	setup: function(){
			$Forms.setupPopup('ws_cell_width_form');
			control = new ws_StyleControl({
					id: "ws_cellHeightControl", name: "height",
					resetValue: function(){
						var value = ws_selectedCssValue('height');
						if (value == false)
							value = Math.round((ws_selectedElement.offsetWidth * 1000) / ws_selectedElement.ws_owner.clientWidth) / 10;
						this.setValue(value);
						$Drag.cellResize.buildLimits();},
					onStart: function(){return false;},
					noAutoReset: true,
					min: 1, max: 100, step: 0.2, speed: 0.08, unit: "%"
			});
			this.onshow = function(){control.resetValue()};
		}
};
*/

// STYLE EDITION
// -------------
new ws_Form('ws_style_form', function(){

	// HTML
	// ----

    // Each pane HTML
    // --------------
	var fontPane=
		'<div id="ws_font_pane" name="' + $Str.fontPane + '">'
			 + '<table class="ws_styleTable" style="margin-top: 0"><tr><td style="padding: 1em 1em 0 1em">'
		        + '<div id="fontFamily"></div>'
				+ '<div style="font-family: georgia, serif; font-size: 14px">'
				+ '<div id="bold" title="' + $Str.bold + '" class="ws_buttonHlist" style="font-weight: bold; font-style: normal">Tt</div>'
				+ '<div id="italic" title="' + $Str.italic + '" class="ws_buttonHlist" style="font-style: italic">Tt</div>'
				+ '<div id="underline" title="' + $Str.underline + '" class="ws_buttonHlist" style="text-decoration: underline; font-style: normal;">Tt</div>'
				+ '<div id="line-through" title="' + $Str.lineThrough + '" class="ws_buttonHlist" style="text-decoration: line-through; font-style: normal">Tt</div>'
				+ '<div id="overline" title="' + $Str.overline + '" class="ws_buttonHlist" style="text-decoration: overline; font-style: normal">Tt</div>'
				+ '</div>'
		    + '</td><td>'
				+ '<div id="small-caps" class="ws_buttonText" style="font-variant: small-caps">' + $Str.smallcaps + '</div>'
				+ '<div id="capitalize" class="ws_buttonText" style="text-transform: capitalize">' + $Str.capitalize + '</div>'
				+ '<div id="uppercase" class="ws_buttonText" style="text-transform: uppercase">' + $Str.uppercase + '</div>'
				+ '<div id="lowercase" class="ws_buttonText" style="text-transform: lowercase">' + $Str.lowercase + '</div>'
			+ '</td></tr>'
			+ '<tr><td colspan="2">'
				+ '<table class="ws_styleTable"><tr>'
					+ '<td><div class="ws_styleControlCell"><div class="title">' + $Str.fontSize + '</div><div id="fontSize" class="body"></div></div></td>'
					+ '<td><div class="ws_styleControlCell"><div class="title">' + $Str.lineHeight + '</div><div id="lineHeight" class="body"></div></div></div></td>'
					+ '<td style="width: 25%"><div class="ws_styleControlCell"><div class="title">' + $Str.letterSpacing + '</div><div id="letterSpacing" class="body"></div></div></div></td>'
					+ '<td><div class="ws_styleControlCell"><div class="title">' + $Str.wordSpacing + '</div><div id="wordSpacing" class="body"></div></div></div></td>'
				+ '</tr></table>'
			+ '</td></tr></table>'
		+ '</div>';

	var layoutPane =
		'<div id="ws_layout_pane" name="' + $Str.layoutPane + '">'
			+ '<table class="ws_styleTable"><tr>'
				+ '<td>'
				+ '<div id="ws_element_position" class="ws_styleControlCell">'
				+ '<div class="title">' + $Str.elementPosition + '</div>'
				+ '<div class="body">'
				+ '<div id="leftPosition" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_left.gif"></div>'
				+ '<div id="centerPosition" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_center.gif"></div>'
				+ '<div id="rightPosition" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_right.gif"></div>'
				+ '<!-- The following div is just because clear: left is not enough for IE -->'
				+ '<div></div><div id="floatLeft" class="ws_buttonHlist" style="clear: left"><img src="' + WS_CORE_PATH + 'ws_images/ws_float_left.gif"></div>'
				+ '<div id="floatRight" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_float_right.gif"></div>'
				+ '<div id="clear" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_clear.gif"></div>'
				+ '</div></div>'
				+ '</td><td>'
				+ '<div id="ws_contents_align" class="ws_styleControlCell">'
				+ '<div class="title">' + $Str.contentsAlign + '</div>'
				+ '<div class="body">'
				+ '<div id="left" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_left_align.gif"></div>'
				+ '<div id="center" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_center_align.gif"></div>'
				+ '<div id="right" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_right_align.gif"></div>'
				+ '<!-- The following div is just because clear: left is not enough for IE -->'
				+ '<div></div><div id="justify" class="ws_buttonHlist" style="clear: left"><img src="' + WS_CORE_PATH + 'ws_images/ws_justify.gif"></div>'
				+ '<div id="wrapSpaces" class="ws_buttonHlist"><img src="' + WS_CORE_PATH + 'ws_images/ws_autowrap.gif"></div>'
				+ '</div></div>'
				+ '</td><td>'
					+ '<div id="ws_absolute_width" class="ws_styleControlCell">'
						+ '<div class="title">' + $Str.widthTitle + '</div>'
						+ '<div>' + $Str.width + '</div><div id="width" class="ws_smallSlider"></div>'
						+ '<div>' + $Str.minWidth + '</div><div id="minWidth" class="ws_smallSlider"></div>'
						+ '<div>' + $Str.maxWidth + '</div><div id="maxWidth" class="ws_smallSlider"></div>'
					+ '</div>'
			+ '</td></tr></table>'
		+ '</div>';

	var borderPane =
		'<div id="ws_border_pane" name="' + $Str.borderPane + '">'
			+ '<table class="ws_styleTable"><tr>'
				+ '<td style="width: 50%">'
		        + '<div>' + $Str.sideChooser + '</div>'
				+ '<div id="ws_border" class="ws_buttonHlist" title="' + $Str.allSides + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_border_all.gif"></div>'
				+ '<div id="ws_borderTop" class="ws_buttonHlist" title="' + $Str.borderTopSide + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_border_top.gif"></div>'
				+ '<div id="ws_borderRight" class="ws_buttonHlist" title="' + $Str.borderRightSide + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_border_right.gif"></div>'
				+ '<div id="ws_borderBottom" class="ws_buttonHlist" title="' + $Str.borderBottomSide + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_border_bottom.gif"></div>'
				+ '<div id="ws_borderLeft" class="ws_buttonHlist" title="' + $Str.borderLeftSide + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_border_left.gif"></div>'
				+ '<table style="clear: both"><tr id="ws_border_width">'
					+ '<td>' + $Str.borderWidth + ':&nbsp;</td>'
					+ '<td><div id="borderWidth" class="ws_smallSlider"></div></td>'
					+ '</tr><tr id="ws_border_style">'
					+ '<td>' + $Str.borderStyle + ':&nbsp;</td>'
					+ '<td><div id="borderStyle"></div></td>'
					+ '</tr><tr id="ws_border_radius1">'
					+ '<td>' + $Str.borderRadius + ' H:&nbsp;</td>'
					+ '<td><div id="borderRadius1" class="ws_smallSlider" data-CSS3="true"></div></td>'
					+ '</tr><tr id="ws_border_radius2">'
					+ '<td>' + $Str.borderRadius + ' V:&nbsp;</td>'
					+ '<td><div id="borderRadius2" class="ws_smallSlider" data-CSS3="true"></div></td>'
					+ '</tr>'
				+ '</table>'
				+ '</td>'
				+ '<td id="ws_border_color"><div class="ws_styleControlCell"><div class="title">' + $Str.borderColor + '</div><div id="borderColor" class="body"></div></div></td>'
			+ '</tr></table>'
		+ '</div>';

	var marginPane =
		'<div id="ws_margin_pane" name="' + $Str.marginPane + '">'
			+ '<table class="ws_styleTable"><tr>'
				+ '<td><div class="ws_styleControlCell"><div class="title">' + $Str.padding + '</div><div id="padding" class="body"></div></div></td>'
				+ '<td><div id="ws_margins" class="ws_styleControlCell"><div class="title">' + $Str.margin + '</div><div id="margin" class="body"></div></div></td>'
			+ '</tr></table>'
		+ '</div>';

	var colorPane =
		'<div id="ws_color_pane" name="' + $Str.colorPane + '">'
			+ '<table class="ws_styleTable"><tr>'
				+ '<td><div class="ws_styleControlCell"><div class="title">' + $Str.color + '</div><div id="color" class="body"></div></div></td>'
				+ '<td><div class="ws_styleControlCell"><div class="title">' + $Str.backgroundColor + '</div><div id="backgroundColor" class="body"></div></div></td>'
				+ '<td>'
					+ '<div class="ws_styleControlCell">'
					+ '<div class="title">' + $Str.backgroundImage + '</div>'
					+ '<input type="hidden" name="ws_filename">'
		            + '<div class="body">'
						+ '<div id="backgroundImageToUpload" style="margin-bottom: 2px" title="' + $Str.newImage + '"></div>'
						+ '<div id="backgroundImage" title="' + $Str.backgroundImageCaption + '" style="width: 10em; float: left; margin-top: 2px"></div>'
						+ '<div id="ws_bgImageDefault" title="' + $Str.dft + '" class="ws_buttonDefault" style="float: left"></div>'
						+ '<table style="clear: left"><tr>'
							+ '<td id="backgroundPosition" title="' + $Str.bgPosition + '"></td>'
							+ '<td>'
								+ '<div id="ws_bgRepeat-x" class="ws_buttonHlist" title="' + $Str.repeatX + '" style="clear: left"><img src="' + WS_CORE_PATH + 'ws_images/ws_repeat_x.gif"></div>'
								+ '<div id="ws_bgRepeat-y" class="ws_buttonHlist" title="' + $Str.repeatY + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_repeat_y.gif"></div>'
								+ '<div id="ws_bgRepeat" class="ws_buttonHlist" title="' + $Str.repeat + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_repeat.gif"></div>'
								+ '<div id="ws_bgCover" style="clear: left; margin-top: -5px" class="ws_buttonHlist" title="' + $Str.cover + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_cover.gif"></div>'
								+ '<div id="ws_bgContain" style="margin-top: -5px" class="ws_buttonHlist" title="' + $Str.contain + '"><img src="' + WS_CORE_PATH + 'ws_images/ws_contain.gif"></div>'
							+ '</td>'
						+ '</tr></table>'
					+ '</div>'
				+ '</td>'
			+ '</tr></table>'
		+ '</div>';

	var shadowPane =
		'<div id="ws_shadow_pane" name="' + $Str.shadowPane + '">'
			+ '<table class="ws_styleTable"><tr>'
				+ '<td><div class="ws_styleControlCell ws_shadow"><div class="title">' + $Str.textShadow + '</div><div id="textShadow" class="body"></div></div></td>'
				+ '<td><div class="ws_styleControlCell ws_shadow"><div class="title">' + $Str.boxShadow + '</div><div id="boxShadow" class="body"></div></div></td>'
				+ '<td style="width: 1%"><div class="ws_styleControlCell"><div class="title">' + $Str.opacity + '</div><div class="body"><div id="opacity" data-CSS3="true"></div></div></div></td>'
			+ '</tr></table>'
		+ '</div>';

	var cssTextPane =
		'<div id="ws_cssText_pane" name="' + $Str.cssTextPane + '">'
			+ '<textarea name="ws_cssTextArea" id="ws_cssTextArea" rows="9"></textarea>'
			+ '<div>' + $Str.cssWarning
				+ '<button onclick="$Forms.' + this.id + '.applyCss(); return false">Apply</button>'
			+ '</div>'
		+ '</div>';

	// Tabbed pane HTML
	// ----------------
	this.HTML = this.buildForm(
	        '<input type="hidden" name="ws_user_css_text">'
	        + '<table width="100%"><tr>'
		        + '<td>' + $Str.stylescope + '</td>'
		        + '<td width="90%"><div id="ws_subSelector" title="' + $Str.subselectorTitle + '" style="margin: 0 1em;"></div></td>'
		        + '<td><div id="highLight_btn" title="' + $Str.highlightCaption + '" class="ws_buttonText">' + $Str.highlightText + '</div></td>'
			+ '</tr></table>'
			+ '<div id="ws_style_tabbed_pane" class="ws_tabbedPane">'
				+ '<div class="ws_tabPanes">'
					+ fontPane
					+ layoutPane
					+ borderPane
					+ marginPane
					+ colorPane
					+ shadowPane
					+ cssTextPane
				+ '</div>'
			+ '</div>'
			+ '<a style="float: left" href="javascript: ws_clearStyle(); ws_updateStyle(); ws_StyleControl.resetAll(); ws_computeLayout(true)">' + $Str.factoryReset + '</a>',
		'<button type="button" title="' + $Str.info + '" onclick="ws_openInfo(\'man_style\')"><svg viewBox="0 0 8 8"><use xlink:href="#ws_info"></use></svg></button>'
	);

	// SETUP
	//------
	this.setup = function(){
        var maskedProps = {};

	    //  Style popup window
		this.tabbedControl = new ws_TabbedPane({
			id: "ws_style_tabbed_pane",
			onSetup: function(){},
			onShowPane: function() {
                for (i in maskedProps) {
                    document.getElementById(i).style.display = '';
                    delete maskedProps[i];
                }
                for (i in this.mask) {
                    if (!(i in this.panes) && (prop = document.getElementById(i))) {
                        prop.style.display = 'none';
                        maskedProps[i] = 1;
                    }
                }
				ws_StyleControl.resetAll();
				},
			ws_cssText_pane: function() {document.getElementById('ws_cssTextArea').value = ws_currentStyleSheet.getCssText();}
		});

		new ws_Button({
			id: "highLight_btn",
			onFalse: ws_clearHighlights, onTrue: ws_highlightElement,
		  	value: true
		  });

		//	FONT PANE
		var fonts = {
	        Serif: 1,
	        Georgia: "Georgia, serif",
	        Palatino: "Palatino, Palatino Linotype, Book Antiqua, serif",
	        Times: "Times, Times New Roman, serif",
	        Sans_serif: 1,
	        Arial: "Arial, Helvetica, sans-serif",
	        Helvetica: "Helvetica, Arial, Trebuchet MS, sans-serif",
	        Arial_Black__Gadget: "Arial Black, Gadget, sans-serif",
	        Impact__Charcoal: "Impact, Charcoal, sans-serif",
	        Lucida_Sans_Unicode: "Lucida Sans Unicode, Lucida Grande, sans-serif",
	        Lucida_Grande: "Tahoma, Geneva, sans-serif",
	        Tahoma: "Tahoma, Geneva, Verdana, sans-serif",
	        Geneva: "Geneva, Verdana, Tahoma, sans-serif",
	        Trebuchet: "Trebuchet MS, Helvetica, sans-serif",
	        Verdana: "Verdana, Geneva, sans-serif",
	        Cursive: 1,
	        Comic_Sans_MS: "Comic Sans MS, cursive",
	        Monospace: 1,
	        Courier: "Courier, Courier New, monospace",
	        Courier_New: "Courier New, Courier, monospace",
	        Lucida_Console__Monaco: "Lucida Console, Monaco, monospace",
	        options: [{value: "", innerHTML: "&nbsp;"}]
	    };
	    // Add imported fonts by raw text, and only by raw text,
	    // impossible at the moment to find them in styleSheets if
	    // imported by href like <link etc. in the head section...
		var styles = document.getElementsByTagName('style');
		for (var i = 0; i < styles.length; i++) {
		    if (styles[i].innerHTML)
		    	var iFonts = styles[i].innerHTML.match(/@font-face[\s]*{[^}]*/g);
			else if (styles[i].styleSheet && styles[i].styleSheet.cssText)
				var iFonts = styles[i].styleSheet.cssText.match(/@font-face[\s]*{[^}]*/g);   // IE
		    if (iFonts) {
		        fonts['Import'] = 1;
		        for (var j = 0; j < iFonts.length; j++) {
		       		var font = iFonts[j].replace(/@font-face[ \t\n\r]*{[\s]*font-family[\s]*:[\s]*['"]?([^;}'"]*)[^}]*/g, '$1');
	                fonts[font] = font;
				}
			} else {
				iFonts = styles[i].innerHTML.match(/@font-face[\s]*{[^}]*/g);
			}
		}
	    for (var i in fonts) {
	        if (i == 'options')
	            continue;
	        if (fonts[i] == 1)
	            fonts.options.push({innerHTML: '<div class="separator">' + i + '</div>'});
	        else
	            fonts.options.push({value: fonts[i], innerHTML: '<div style="font-family: ' + fonts[i] + '">' + i.replace('__', ', ') + '</div>'});
	    }
		new ws_StyleControl({name: "fontFamily",
	        options: fonts.options
	      });
		new ws_StyleControl({id: "bold", name: "fontWeight",
			falseValue: "normal"
		  });
		new ws_StyleControl({id: "italic", name: "fontStyle",
			falseValue: "normal"
		  });
		new ws_StyleControl({id: "underline", name: "textDecoration",
			falseValue: "none"
		  });
		new ws_StyleControl({id: "line-through", name: "textDecoration",
			falseValue: "none"
		  });
		new ws_StyleControl({id: "overline", name: "textDecoration",
			group: "fontVariant",	// Overline with small-caps is not smart with IE..
			falseValue: "none"
		  });
		new ws_StyleControl({id :"small-caps", name: "fontVariant",
			group: "fontVariant",
			falseValue: "normal"
		  });
		new ws_StyleControl({id: "capitalize", name: "textTransform",
			group: "textTransform",
			falseValue: "none"
		  });
		new ws_StyleControl({id: "uppercase", name: "textTransform",
			group: "textTransform",
			falseValue: "none"
		  });
		new ws_StyleControl({id: "lowercase", name: "textTransform",
			group: "textTransform",
			falseValue: "none"
		  });
		new ws_StyleControl({name: "fontSize",
			min: 0.01, step: 0.02, unit: "em"
		  });
		new ws_StyleControl({name: "lineHeight",
			min: 0, step: 0.01, unit: "em"
		  });
		new ws_StyleControl({name: "letterSpacing",
			min: -2, step: 0.01, unit: "em"
		  });
		new ws_StyleControl({name: "wordSpacing",
			min: -2, step: 0.02, unit: "em"
		  });

		//	LAYOUT PANE
		new ws_StyleControl({id: "wrapSpaces", name: "whiteSpace",
			trueValue: "nowrap", falseValue: "normal"
		  });
		new ws_StyleControl({id: "left", name: "textAlign",
			group: "textAlign",
			trueValue: "left"
		  });
		new ws_StyleControl({id: "center", name: "textAlign",
			group: "textAlign",
			trueValue: "center"
		  });
		new ws_StyleControl({id: "right", name: "textAlign",
			group: "textAlign",
			trueValue: "right"
		  });
		new ws_StyleControl({id: "justify", name: "textAlign",
			group: "textAlign",
			trueValue: "justify"
		  });
		new ws_StyleControl({id: "floatLeft", name: "float",
			group: "hPosition",
			trueValue: "left", falseValue: "none"
		  });
		new ws_StyleControl({id: "leftPosition",
			group: "hPosition",
			onTrue: function(){ws_updateStyle("marginLeft", "0", "marginRight", "auto")},
			onFalse: function(){ws_updateStyle("marginLeft", "", "marginRight", "")},
			resetValue: function() {this.setValue(
	                                (ws_selectedStyleValue("marginLeft") != "auto"
	                                    && ws_selectedStyleValue("marginRight") == "auto") ?
	                                    this.trueValue : this.falseValue)}
	      });
		new ws_StyleControl({id: "centerPosition",
			group: "hPosition",
			onTrue: function(){ws_updateStyle("marginLeft", "auto", "marginRight", "auto")},
			onFalse: function(){ws_updateStyle("marginLeft", "", "marginRight", "")},
			resetValue: function() {this.setValue(
	                                (ws_selectedStyleValue("marginLeft") == "auto"
	                                    && ws_selectedStyleValue("marginRight") == "auto") ?
	                                    this.trueValue : this.falseValue)}
		  });
		new ws_StyleControl({id: "rightPosition",
			group: "hPosition",
			onTrue: function(){ws_updateStyle("marginLeft", "auto", "marginRight", "0")},
			onFalse: function(){ws_updateStyle("marginLeft", "", "marginRight", "")},
			resetValue: function() {this.setValue(
	                                (ws_selectedStyleValue("marginLeft") == "auto"
	                                    && ws_selectedStyleValue("marginRight") != "auto") ?
	                                    this.trueValue : this.falseValue)}
		  });
		new ws_StyleControl({id: "floatRight", name: "float",
			group: "hPosition",
			trueValue: "right", falseValue: "none"
		  });
		new ws_StyleControl({name: "clear",
			trueValue: "both", falseValue: "none"
		  });
		var widthControl = new ws_StyleControl({name: "width",
			min: 0, unit: "px",
			onStart: function(){
			    this.setValue(ws_actualStyleValue(this.name));
				minWidthControl.setValue('', true);
				maxWidthControl.setValue('', true);
				ws_updateStyle(this.name, this.value + this.unit, "minWidth", '', "maxWidth", '');
				return false;
				},
			onEnd: function(){
				minWidthControl.setValue('', true);
				maxWidthControl.setValue('', true);
				ws_updateStyle("minWidth", '', "maxWidth", '');
				}
		  });
		var minWidthControl = new ws_StyleControl({name: "minWidth",
			min: 0, unit: "px",
			onStart: function(){
				this.setValue(ws_actualStyleValue("width"));
				widthControl.setValue('', true);
				ws_updateStyle("width", '', this.name, this.value + this.unit);
				return false;
				},
			onEnd: function(){
				widthControl.setValue('', true);
				ws_updateStyle("width", '');
				}
		  });
		var maxWidthControl = new ws_StyleControl({name: "maxWidth",
			min: 0, unit: "px",
			onStart: function(){
				this.setValue(ws_actualStyleValue("width"));
				widthControl.setValue('', true);
				ws_updateStyle("width", '', this.name, this.value + this.unit);
				return false;
				},
			onEnd: function(){
				widthControl.setValue('', true);
				ws_updateStyle("width", '');
				}
		  });

		//	BORDER PANE
		function borderSide(side){
			borderWidthControl.name = "border" + side + "Width";
			borderWidthControl.resetValue();
			borderColorControl.name = "border" + side + "Color";
			borderColorControl.resetValue();
			borderStyleControl.name = "border" + side + "Style";
			borderStyleControl.resetValue();
            switch (side){
                case '':
                    borderRadiusControl.name = "borderRadius";
                    borderRadiusControl.sep = "/";
                    break;
                case 'Top':
                    borderRadiusControl.name = "borderTopLeftRadius";
                    borderRadiusControl.sep = " ";
                    break;
                case 'Right':
                    borderRadiusControl.name = "borderTopRightRadius";
                    borderRadiusControl.sep = " ";
                    break;
                case 'Bottom':
                    borderRadiusControl.name = "borderBottomRightRadius";
                    borderRadiusControl.sep = " ";
                    break;
                case 'Left':
                    borderRadiusControl.name = "borderBottomLeftRadius";
                    borderRadiusControl.sep = " ";
                    break;
            }
            borderRadiusControl.resetValue();
		}
		var allSidesBorder = new ws_Button({id: "ws_border", group: "sideChooser", trueButton: true,
			onTrue: function(){borderSide("");},
			value: true
		  });
		new ws_Button({id: "ws_borderTop", group: "sideChooser", trueButton: true,
			onTrue: function(){borderSide("Top");}
		  });
		new ws_Button({id: "ws_borderRight", group: "sideChooser", trueButton: true,
			onTrue: function(){borderSide("Right");}
		  });
		new ws_Button({id: "ws_borderBottom", group: "sideChooser", trueButton: true,
			onTrue: function(){borderSide("Bottom");}
		  });
		new ws_Button({id: "ws_borderLeft", group: "sideChooser", trueButton: true,
			onTrue: function(){borderSide("Left");}
		  });
		function resetBorder(property) {
		  	if (allSidesBorder.value){    // If all sides control is true, reset all sides
				if (property == 'Radius')
                    ws_updateStyle("borderTopLeftRadius", "", "borderTopRightRadius", "",
    								"borderBottomLeftRadius", "", "borderBottomRightRadius", "");
                else                                
                    ws_updateStyle("borderTop" + property, "", "borderRight" + property, "",
    								"borderBottom" + property, "", "borderLeft" + property, "");
            }
		}
		var borderWidthControl = new ws_StyleControl({name: "borderWidth",
			min: 0, unit: "px",
			onEnd: function(){resetBorder("Width");}
		});
		var borderStyleControl = new ws_StyleControl({name: "borderStyle",
			// Not all css options are proposed because of browsers inconsistency
			options: [{value: "solid", innerHTML: '<div style="padding: 0.5em 0.4em"><div style="border-top: solid 1px; width: 6em;"></div></div>'},
	                    {value: "dotted", innerHTML: '<div style="padding: 0.5em 0.4em"><div style="border-top: dotted 1px; width: 6em;"></div></div>'},
	                    {value: "dashed", innerHTML: '<div style="padding: 0.5em 0.4em"><div style="border-top: dashed 1px; width: 6em;"></div></div>'},
	                    {value: "double", innerHTML: '<div style="padding: 0.5em 0.4em"><div style="border-top: double 3px; width: 6em;"></div></div>'}],
			onChange: function(){resetBorder("Style");}
		});
		var borderRadiusControl = new ws_StyleControl({id: "borderRadius1",
			name: "borderRadius", min: 0, unit: "px",
            resetValue: function(){
                var value = ws_selectedStyleValue(this.name).split(this.sep)[0];
                this.setValue(value);
                this.slave.resetValue();
                value = this.getValue() * 1;		// Numeric value without 'px' to test null
                if (!value)                         // If null or empty, y radius is set to default
                    this.slave.setValue('', true);
                },
            onChange: function(){
                var value1 = this.getValue();
                var value2 = this.slave.getValue();              
                ws_quickUpdateStyle(this.name, value1 + this.unit + (value2 ? this.sep + value2 + this.unit : ''));
                return false;
                },
			onEnd: function(){
                var value1 = this.getValue();
                var value2 = value1 * 1 ? this.slave.getValue() : '';
                if (value1 !== '')              
                    ws_updateStyle(this.name, value1 + this.unit + (value2 ? this.sep + value2 + this.unit : ''));
                if (!(value1 * 1))  // null or empty
                    this.resetValue();
        		ws_computeLayout(true);
        		ws_highlightElement();
                resetBorder("Radius");
                return false;
                }
		});
        borderRadiusControl.sep = '/';                
		borderRadiusControl.slave = new ws_StyleControl({id: "borderRadius2",
			name: "borderRadius", min: 0, unit: "px", 
            resetValue: function(){
                this.master = borderRadiusControl;             
                var value2 = ws_selectedStyleValue(this.master.name).split(this.master.sep)[1];
                this.setValue(value2 || '', !value2);
                },
            onStart: function(){
                var value1 = this.master.getValue();
                var value2 = ws_actualStyleValue(this.master.name).split(this.master.sep)[1];
                this.setValue(value2 || value1 || '');
                return false;
                },
            onChange: function(){
                var value1 = this.master.getValue() * 1;
                var value2 = this.getValue();              
                if (value1)     // Update y radius only if x radius is not null or empty
                    ws_quickUpdateStyle(this.master.name, value1 + this.unit + this.master.sep + value2 + this.unit);
                else
                    this.setValue('');
                return false;
                },
			onEnd: function(){
                var value1 = this.master.getValue() * 1;
                var value2 = this.getValue();
        		if (value1)     // Update y radius only if x radius is not null or empty
            		ws_updateStyle(this.master.name, value1 + this.unit + (value2 !== '' ? this.master.sep + value2 + this.unit : ''));
                else
        			this.resetValue();
        		ws_computeLayout(true);
        		ws_highlightElement();
                resetBorder("Radius");
                return false;
                },
            onDefault: function(){
                this.setValue('');
            	this.onEnd();
                return false;
                }
		});
		var borderColorControl = new ws_StyleControl({name: "borderColor", type: "colorControl",
			onEnd: function(){resetBorder("Color");}
		});

		//	MARGIN PANE
		new ws_StyleControl({name: "padding", type: "quadControl"});
		new ws_StyleControl({name: "margin", type: "quadControl"});

		//	COLOR PANE
		new ws_StyleControl({name: "color", type: "colorControl"});
		new ws_StyleControl({name: "backgroundColor", type: "colorControl"});
	    new ws_FileInput({id: "backgroundImageToUpload", name: "ws_background_image",
	            size: 12,
	            onChange: function(files) {
	        				// A new name is generated because of cache issues
	        				var filename = files[0].name;
	        				filename = filename.replace(/.*[\\\/]/, '');
	        				filename = Math.round((Math.random() + 1) * 1000) + '_' + filename;
	        				filename = filename.replace(/[^a-z0-9\-_.]/ig, '-');
	        				if (ws_bgImages[filename]) {
	        					for (i = 1; ws_bgImages[filename + '-' + i]; i++) ;
	        					filename += '-' + i;
	        				}
	        				document.getElementById('ws_style_form').ws_filename.value = filename;
	        				// Another cache issue with FF leads to put a temporary filename in css
	        				ws_updateStyle('backgroundImage', 'url(BackgroundFilename)');
	                    }
	            });
		var options = [{value: "none", innerHTML: $Str.noImage}];
		for (var i in ws_bgImages)
		    options.push({value: 'url(' + WS_BACKGROUND_PATH + i + ')', innerHTML: ws_bgImages[i]});
		new ws_StyleControl({name: "backgroundImage",
			options: options,
			onChange: function(){imageDefault.setValue(false);}
		  });
		var imageDefault = new ws_Button({id: "ws_bgImageDefault",
			trueButton: true,
			// To simulate a style control
			resetValue: function(){this.setValue(ws_isDefaultValue("backgroundImage") &
													ws_isDefaultValue("backgroundRepeat") &
													ws_isDefaultValue("backgroundPosition") &
													ws_isDefaultValue("backgroundSize"));},
			show: function(){}, hide: function(){},
			//
			onTrue: function(){ws_updateStyle("backgroundImage", "", "backgroundRepeat", "", "backgroundPosition", "", "backgroundSize", ""); ws_StyleControl.resetAll();}
		  });
		ws_StyleControl.controls.push(imageDefault);
		new ws_StyleControl({id: "ws_bgRepeat-x", name: "backgroundRepeat",
			group: "backgroundRepeat",
			trueValue: "repeat-x", falseValue: "no-repeat",
			onClick: function(){imageDefault.setValue(false);}
		  });
		new ws_StyleControl({id: "ws_bgRepeat-y", name: "backgroundRepeat",
			group: "backgroundRepeat",
			trueValue: "repeat-y", falseValue: "no-repeat",
			onClick: function(){imageDefault.setValue(false);}
		  });
		new ws_StyleControl({id: "ws_bgRepeat", name: "backgroundRepeat",
			group: "backgroundRepeat",
			trueValue: "repeat", falseValue: "no-repeat",
			onClick: function(){imageDefault.setValue(false);}
		  });
		new ws_StyleControl({id: "ws_bgCover", name: "backgroundSize",
			group: "backgroundSize",
			trueValue: "cover", falseValue: "",
			onClick: function(){imageDefault.setValue(false);}
		  });
		new ws_StyleControl({id: "ws_bgContain", name: "backgroundSize",
			group: "backgroundSize",
			trueValue: "contain", falseValue: "",
			onClick: function(){imageDefault.setValue(false);}
		  });
		new ws_StyleControl({name: "backgroundPosition",
			resetValue: function(){this.setValue(ws_isDefaultValue(this.name) ? '0 0' : ws_selectedStyleValue(this.name));},
			onStart: function(){imageDefault.setValue(false);},
			min: 0, max: 100, step: 50, unit: "%", orientation: 3, kInputSize: 0
		  });

		//	SHADOW PANE
		new ws_StyleControl({name: "textShadow", type: "shadowControl"});
		new ws_StyleControl({name: "boxShadow", type: "shadowControl", spread: 1, inset: 1});

		new ws_StyleControl({name: "opacity",
			min: 0, step: 0.01, max: 1, amplitude: 0.3,
			// To get smooth variations
			onStart: function(){ws_selectedElement.style.transition = 'opacity 0.2s';}
		  });
	};

	// CALLBACK, HANDLERS
	// ------------------
	// Submission of this form actually submits the update form of the selected element.
	// This is to keep other alterations that could have been made before (text, ...)
	this.submit = function(){
	    if (ws_Form.checkPermission(P_WRITE)) {
	        var f = ws_selectedElement.ws_updateForm;
	        var style_form = document.getElementById(this.id);
			f.ws_operation.value = 'update_user_style_sheet';
			f.appendChild(style_form.ws_user_css_text);          // Attach inputs of this form to the form to be submitted
			f.appendChild(style_form['ws_background_image[]']);  // the name of file input has '[]' to be multiple in php sense
			f.appendChild(style_form.ws_filename);
			ws_selectedElement.ws_updateW.submit();              // submit the element form
	    }
	};

	this.onhide = function(){   // Must be here in case of reselect same element
		ws_restoreStyle(true);
		document.getElementById("ws_colormap").style.visibility = 'hidden';
	};

	this.applyCss = function(){
	    ws_currentStyleSheet = new ws_StyleSheet(document.getElementById('ws_cssTextArea').value);
	    ws_currentStyleSheet.execute();
	    ws_workRule.style = {};
	    ws_highlightElement();
	};
});
