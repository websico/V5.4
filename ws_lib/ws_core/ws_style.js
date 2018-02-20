/*
 *  This file is part of Websico: online Web Site Composer, http://websico.net
 *  Copyright (c) 2009-2017 Websico SAS, http://websico.com
 *	Author: O.Seston
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
 *	USER STYLE MANAGEMENT
 *  ---------------------------------------
 *
 *	We have chosen to work with style sheet rather than style properties of each element
 *	to use full power of css selectors.
 *		ex: editing background color can be done live for all elements of class "MyTitle"
 *	In addition, don't know how to edit pseudo-class (like :hover) properties by that mean...
 *	Unfortunately it's a little bit more complex (not so sure) and slower (sure).
 *
 *	We work with original css text, as stored, and not with browser css text
 *	accessible in the styleSheet element, because at least one browser authorizes itself
 *	to modify original css text. By this mean we are sure of syntax.
 *		ex: with IE6, "padding: 0;" is converted to "padding-left: 0px; padding-right: 0px;
 *			padding-top: 0px; padding-botom: 0px;", it's a bit harder to manage..
 *
 *	Another reason for working with css text is propagation of updates: modifying a rule
 *	in styleSheet object is not enough to refresh all page layout and some aberrations may
 *	appear, so we have to force the refresh; our method is to change the styleSheet css text,
 *	so it is no	more useful to do anything else than modifying css text, except to change some
 *	property more quickly, directly in element style !! ;)
 *	ALL THAT SPEECH IS TRUE IN 2007... but some truths are eternal ;) pragamatism for example...
 */

/*	HOME MADE STYLE SHEET OBJECT
 *	----------------------------
 *	The style sheet is exploded in a two levels object tree:
 *	a rule member is named by selector,
 *	each member of the rule is named by property,
 *	each property has a value.
 *  For some special cases, as @media, @font-face etc. we put the text as is
 *  in a parking member, uninterpreted for now.
 *		Ex: .abcd {color: red; background: black;}
 *          - in tree style:
 *          styleSheet
 *               rules
 *                    .abcd
 *                         color: red
 *                         background: black
 *          - or in JSON style:
 *          styleSheet: {rules: {.abcd: {color: 'red', background: 'black'}}}
 *          - to set a value:
 *			styleSheet.rules['.abcd']['color'] = 'red';
 *			styleSheet.rules['.abcd']['background'] = 'black';
 *
 *	We use regexp's to explode the sheet, according to syntax restrictions:
 *	- no comments
 *	- a selector is always at a line start
 *	- no comma separated selectors (no ".sel1, .sel2 {"...), excepted for .hover)
 *	- pseudo selector at the end of selector
 *	- ...
 *
 *	When we populate the tree, only the last value of a member stays,
 *	and the tree is naturally clean, one selector per branch and one
 *	property per leaf.
 *	------------------------------------------------------------------------*/
function ws_StyleSheet(cssText) {
    if (cssText)
	   this.rebuild(cssText);
}

ws_StyleSheet.prototype.rules = 0;	// The member 'rules', object which members are style rules

ws_StyleSheet.prototype.rebuild = function(cssText) {
	this.rules = {};
	this.unmanaged = '';
	var rules = cssText.match(/[^\s][^}]*{[^}]*}\s*}?/ig);			// Put rules in an array
	if (rules) {
		var xtractSname = /[^{,]+[{,]/ig;							// To extract selector
		var cleanupSname = /\s*[{,]/ig;								// To clean up selector name
		var xtractPname = /[{;][^:]+:/ig;							// To extract property names
		var cleanupPname = /([^a-z\-]*)(.*)(\s*:)/ig;				// To clean up property name
		var cleanupValue = /([^:]*:\s*)(.*)(\s*)/ig;				// To clean up property value
		for (var i=0; i<rules.length; i++) {						// Build rules tree
			var properties;
			if (rules[i].indexOf('@') == 0)							// Unmanaged rules
			    this.unmanaged += '\n' + rules[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			else if (properties = rules[i].match(xtractPname)) {	// Properties for the selector
				for (var j=0; j<properties.length; j++)
					properties[j] = properties[j].replace(cleanupPname, '$2');
				var selector = rules[i].match(xtractSname);
				selector = selector[0].replace(cleanupSname, '');
				if ((pseudoIndex = selector.indexOf(':')) != -1) {	// Must sort some pseudo selectors
					var pseudos = {visited: 1, hover: 1, active: 1};
					if (selector.substr(pseudoIndex + 1) in pseudos) {
						var selRoot = selector.substr(0, pseudoIndex);
						if (!(selRoot in this.rules))
							this.rules[selRoot] = {};
						if (!(selector in this.rules))	// create all the selectors in right order
							for (var p in pseudos)
								this.rules[selRoot + ':' + p] = {};
					}
				}
				if (!(selector in this.rules))
					this.rules[selector] = {};
			  	var rule = this.rules[selector];
				for (var j=0; j<properties.length; j++) {
					var property = properties[j];
					var pattern = new RegExp('[{;]\\s*' + property + '\\s*:[^;}]*', "ig");
					var values = rules[i].match(pattern);
					if (values)
						for (var k=0; k<values.length; k++)	// in case of multiple values, we keep the later
							rule[property] = values[k].replace(cleanupValue, '$2');
				}
			}
		}
	}
};

/*	Update and get css text
 *  -----------------------
 *  About specificity, css order and rules precedence
 *  - precedence is computed by browsers from specificity of matching rules; when several
 *    matching rules have same specificity, the last declared wins.
 *  - IE6- does not see any difference between .gogo.class1 and .ga.class1,
 *    an element with className="gogo class1" get same properties as another element with
 *    className="ga class1", the winning declaration being the last one.
 *  - because of a problem with pseudo-classed links (a:hover etc) and other reasons I don't
 *    remember, we don't use #id selector at the moment :
 *    For an element with id 'id' and class '<wsClass>_<className>',
 *    '#id a' (101) has precedence over '.<wsClass>_<className> a:pseudo-class' (21) and we don't
 *    want that; it's not because the element has a rule for links that it must not apply a class
 *    rule for visited links, it's a bit confusing when modifying style class (this could be reexamined in full context)
 *    Same kind of issue is with container # rule for links, which get precedence
 *    over classed inside element: '#page a {font-family: georgia}' is stronger than
 *    '.<wsClass>_<className> a {font-family: courier}'. (this could be reexamined in full context)
 *  - authorized rule selectors and specificity in our system :
 *    010 .<wsClass>_<className>            ----- For named styles
 *    011 .<wsClass>_<className> a
 *    021 .<wsClass>_<className> a:pseudo-class
 *    010 .id_<objectId>                    ----- For individual elements (after named classes to win)
 *    011 .id_<objectId> a
 *    021 .id_<objectId> a:pseudo-class
 *  - ambiguities in multiple 021 are solved by traditional order in css :
 *    visited, hover, active (cf rebuild() above).
 *  - unwanted results could appear with blocks and contained elements, in case of link rules :
 *    - an element contained in a block matches a selector '.<wsClass>_<className> a' (11)
 *    - the containing block matches a selector '.id_<objectId> a' (11)
 *    - unfortunately the second one wins, if positionned after the first one, because the link
 *      inherits from <wsClass>_<className>, it's not really its class (with no link it works fine)
 *    - in this case a property of the element class (named style in websico sense) has no
 *      precedence on a parent property, this is a violation of natural hierarchy and leads
 *      to some unsolvable issues
 *    To solve this problem, ordering all block and component rules to respect hierarchy would be
 *    a mess, so link rules are not authorized for general blocks other than page block.
 *    We think it's not a problem for general blocks but this solution creates a weakness
 *    for models..., nobody's perfect.
 *  Finally, the order in css is:
 *  - page classes
 *  - actual page, to overload other page classes
 *  - other element classes, to overload all page classes
 *  - .id_<objectId> rules, to overload element classes
 */
ws_StyleSheet.prototype.getCssText = function(workRule, filterId) {
	if (workRule && workRule.style) {	// Insert work rule (cf updateStyle and buildStyleSelector)
	    var selector = workRule.selector + workRule.selectorSuffix;
        this.rules[selector] = this.rules[selector] || {};
        var rule = this.rules[selector];
		for (var i in workRule.style)
            rule[i.replace(/([A-Z])/g, '-$1').toLowerCase()] = workRule.style[i];
	}
	var sec1 = sec2 = sec3 = sec4 = '';     // Remake stylesheet string from tree
    for (var selector in this.rules) {
		if (filterId                        // If filtered, keep general rules and filtered .id rules
            && selector.indexOf('.id_') == 0
			&& selector.indexOf('.id_' + filterId) != 0)
			continue;
        if (selector.indexOf('.wsspage_') == 0)          // Page classes first, components must overload (there was an issue with link subselectors)
            sec1 += this.makeCssText(selector);
        else if (selector.indexOf('.id_' + ws_currentPageId) == 0)  // Actual page section, for same reason
            sec2 += this.makeCssText(selector);
        else if (selector.indexOf('.id_') == 0)         // .id selectors section
            sec4 += this.makeCssText(selector);
        else                                            // Other selectors section
            sec3 += this.makeCssText(selector);
	}
	var cssText = sec1 + sec2 + WS_PAGE_BOUNDARY + '\n\n' + sec3 + sec4 + this.unmanaged;
	if (!cssText.length)       // Must be non empty to be recorded
		cssText = ' ';         // because of a security check in ws_inits.php
	return cssText;
};

/*	Make a css text from rule object
 *	--------------------------------*/
ws_StyleSheet.prototype.makeCssText = function(selector) {
	var rule = this.rules[selector];
	var emptyRule = true;
	var cssText = '';
	for (var property in rule) { emptyRule = false; break; }
	if (!emptyRule) {							// Omit empty rules
		if (selector.indexOf(':hover') != -1)	// Need a .hover rule for menus
			selector += ', ' + selector.replace(':', '.');
	  	cssText += selector + ' {\n';
		for (var property in rule)
		  	cssText += '\t' + property + ': ' + rule[property] + ';\n';
		cssText += '}\n';
	}
	return cssText;
};

/*	Execute in the DOM
 *	------------------*/
ws_StyleSheet.prototype.execute = function(workRule) {
	var style = document.getElementById('ws_userStyle');
	var DOMCssObj = style.sheet || style.styleSheet;		// Browser compat IE8-
 	if ('cssText' in DOMCssObj)								// Update modulo browser kind
		DOMCssObj.cssText = this.getCssText(workRule);
  	else if ('ownerNode' in DOMCssObj)
  		DOMCssObj.ownerNode.innerHTML = this.getCssText(workRule);
};

/*  Get named styles (css classes) for a ws_class (as wspage, wsstitle etc..)
 *  -------------------------------------------------------------------------*/
ws_StyleSheet.prototype.getStyles = function(ws_class) {
    var stylesObject = {};
	var classSelector = '.' + ws_class + '_';
    var extractClass = new RegExp(classSelector + '([a-z0-9\-_]*).*', 'i');
	for (var i in this.rules) {
		if (i.indexOf(classSelector) == 0)
			stylesObject[i.replace(extractClass, '$1')] = 1;
	}
	return stylesObject;
};

/*	Get a property or a rule contents
 *	---------------------------------*/
ws_StyleSheet.prototype.get = function(selector, jsProperty) {
	var property = jsProperty ? jsProperty.replace(/([A-Z])/g, '-$1').toLowerCase() : 0;

	if (property) {
		if (this.rules[selector] && this.rules[selector][property])
			return this.rules[selector][property];
	} else if (this.rules[selector]) {
		return this.rules[selector];
	}
	return false;
};

/*	Erase a property or a rule
 *  In case of a rule we erase the rule and all the descendants:
 *  [<rule> *] or [<rule>:*] 
 *  In case of a property we erase it in the rule and all pseudo-descendants
 *  [<rule>:*]  
 *	------------------------------------------------------------------------*/
ws_StyleSheet.prototype.erase = function(selector, jsProperty) {
	var property = jsProperty ? jsProperty.replace(/([A-Z])/g, '-$1').toLowerCase() : 0;
    var matcher = new RegExp('^' + selector.replace('[', '\\[').replace(']', '\\]') + (property ? '($|[:])' : '($|[ :])'));

    for (var i in this.rules){
        if (i.match(matcher)){  // Work on selector and its descendants
        	if (property)
        		delete this.rules[i][property];
        	if (!property || this.rules[i].length == 0)
        	    // If the rule is empty and is an embedded rule, we delete it, otherwise
                // we must keep a pseudo property to overload the published style if it exists
        	    if (i.indexOf('.id_') == 0)
        	        delete this.rules[i];
    			else
    	    		this.rules[i] = {'ws-dummy-property': 'dummy'};
        }
    }
};

/*	END OF STYLE SHEET OBJECT
 *	-------------------------*/

/*	Some global inits
 *	-----------------*/
var ws_currentStyleSheet;
var ws_workRule = {};
ws_workRule.style = {};

var ws_saved_css = document.getElementById('user_StyleSheet').innerHTML;
var ws_originalStyleSheet = new ws_StyleSheet(ws_saved_css);
ws_originalStyleSheet.execute();    // cf coreclasses, getCss()

/*	Decide which rule to modify. The css selector is computed with asked scope.
 *	0 => .<selectedObjectWsClass> (no more in use, a bit confusing for user interface)
 *	1 => .<selectedObjectWsClass>_<selectedObjectStyle>[<data-subclass attribute value>]
 *	2 => .id_<selectedObjectId>[<data-subclass attribute value>]
 *	where ObjectWsClass is object class in Websico sense,
 *	and ObjectStyle is className in css sense.
 *	------------------------------------------------------------------------------------*/
function ws_buildStyleSelector(scope, styleClass) {
	var elt = ws_selectedElement;
	var subclass = elt.getAttribute('data-subclass') ?
					'[data-subclass=' + elt.getAttribute('data-subclass') + ']' : '';	

    ws_currentStyleSheet = ws_clone(ws_originalStyleSheet);
	ws_workRule.scope = scope;
	switch (scope) {
		case 0: ws_workRule.selector = "." + elt.getAttribute('ws_class'); break;
		case 1: ws_workRule.selector = "." + elt.getAttribute('ws_class')
										+ "_" + styleClass + subclass;
				break;
		case 2: ws_workRule.selector = ".id_" + elt.id + subclass;
				elt.className += " id_" + elt.id;
				break;
	}
//	if (!('selectorSuffix' in ws_workRule))
		ws_workRule.selectorSuffix = '';
//	for (var i in ws_workRule.style) {ws_updateStyle(); break;}	// Update style if necessary
}

/*	Delete current rule or a property inside
 *	in current style sheet and selected object.
 *	-------------------------------------------*/
function ws_clearStyle(jsProperty) {
	// Current rule object
	if (jsProperty) {								// Reset a property
    	ws_currentStyleSheet.erase(ws_workRule.selector + ws_workRule.selectorSuffix, jsProperty);
		if (jsProperty in ws_workRule.style)
			delete ws_workRule.style[jsProperty];
		if (document.all && jsProperty == 'backgroundPosition') {	// Especially for IE
			ws_selectedElement.style.backgroundPositionX = '';		// Must erase each dimension
			ws_selectedElement.style.backgroundPositionY = '';		// otherwise position is set to '0px 0px'
		} else {
			ws_selectedElement.style[jsProperty] = '';
		}
	} else {
        // Build a new array of subselectors to reset
/*        var options = ws_selectedElement.ws_cssSubselectorOptions.slice(0);  // Reset for all subselectors
        if (ws_workRule.selectorSuffix.length > 2)      // Reset for selected subselector, if more accurate than ' a'
            options = [{value: ws_workRule.selectorSuffix}];
        else if (ws_workRule.selectorSuffix == ' a')    // Reset for all subselectors but blank (first one)
            options.shift();
        for (i = 0; options[i]; i++)                // In style sheet*/
            ws_currentStyleSheet.erase(ws_workRule.selector + ws_workRule.selectorSuffix);
		for (var i in ws_workRule.style)            // In element style rules
			ws_selectedElement.style[i] = '';
		ws_workRule.style = {};
	}
}

/*	Update some properties in the current rule.
 *	Parameters are couples of (property, value)
 *	Ex: ws_updateStyle("fontSize", "1em", "borderSize", 2);
 *	-------------------------------------------------------*/
function ws_updateStyle() {
  	if (ws_selectedElement) {
  		if (arguments[0]) // Sometimes the first argument is 'undefined'
			ws_delayedUpdateStyle(declarations = arguments);// Must use intermediate variable
		ws_currentStyleSheet.execute(ws_workRule);
		ws_highlightElement();								// Because caret may have to be updated
	}
}
function ws_delayedUpdateStyle() {							// Accept also an array as argument
	var declarations = arguments;

	if (typeof(declarations[0]) != "string")
		declarations = declarations[0];
  	for (var i=0; i<declarations.length; i+=2) {
  	  	// First we erase this property in css, in current rule and possible id rule for the element
  		ws_clearStyle(declarations[i]);
        ws_currentStyleSheet.erase('.id_' + ws_selectedElement.id + ws_workRule.selectorSuffix, declarations[i]);

  	  	// Update the property in the actual rule
		if (declarations[i+1] && declarations[i+1].length)
  			ws_workRule.style[declarations[i]] = declarations[i+1];
	}
}
function ws_quickUpdateStyle() {
	if (ws_selectedElement && !ws_workRule.selectorSuffix) {
	  	for (var i=0; i<arguments.length; i+=2) {
		  	ws_workRule.style[arguments[i]] = arguments[i+1];	// To remember the property to clear or update
			ws_selectedElement.style[arguments[i]] = arguments[i+1];
		}
		ws_highlightElement();									// Because caret may have to be updated
	} else {
	  	ws_updateStyle(arguments[0], arguments[1]);				// Must see later if more arguments...
	}
}

/*	Full restoration of the original user style sheet
 *	and selected object style.
 *	-------------------------------------------------*/
function ws_restoreStyle(fullRestoration) {
	if (fullRestoration) {
	  	ws_currentStyleSheet = ws_clone(ws_originalStyleSheet);
	  	ws_originalStyleSheet.execute();

		if (ws_selectedElement)
			for (var i in ws_workRule.style)
				ws_selectedElement.style[i] = '';
        if (fullRestoration != 'simpleReset')
            ws_workRule = {};
		ws_workRule.style = {};
	}
    if (fullRestoration != 'simpleReset'
            && ws_selectedElement && 'ws_savedClassName' in ws_selectedElement)
		ws_selectedElement.className = ws_selectedElement.ws_savedClassName;
}

/*	Get an obj which members are colors in use in current style sheet
 *	-----------------------------------------------------------------*/
function ws_getColorsInUse() {
  	var pattern = new RegExp("#[0-9a-f]{6}", "gi");
	var colors = ws_currentStyleSheet.getCssText().match(pattern);
  	var colorObj = {};
	if (colors)
	  	for (var i = 0; colors[i]; i++)		// To make a list of distinct colors
	  		colorObj[colors[i].toLowerCase()] = 1;
  	return colorObj;
}

/*	Create or update a style from .id rules
 *	and current class of element.
 *	---------------------------------------*/
function ws_buildStyle(styleName, elt) {
	var elt = elt || ws_selectedElement;
	var stylePrefix = '.' + elt.getAttribute('ws_class') + '_';
	var subclass = elt.getAttribute('data-subclass') ?
					'[data-subclass=' + elt.getAttribute('data-subclass') + ']' : '';	
  	var currentStyle = stylePrefix + elt.getAttribute('ws_style') + subclass;
	ws_workRule.scope = 1;
	ws_workRule.selector = stylePrefix + styleName + subclass;
	ws_workRule.style = {};
    
    // Erase target style if not current one
    if (ws_workRule.selector != currentStyle)
        ws_currentStyleSheet.erase(ws_workRule.selector);

	// A loop for all valid selector suffixes
    var options = elt.ws_cssSubselectorOptions;
	for (var i = options.length - 1; i >= 0; i--) {
		var selectorSuffix = options[i].value;
		ws_workRule.selectorSuffix = selectorSuffix;
		ws_workRule.style = {};
		if (rule = ws_currentStyleSheet.get(currentStyle + selectorSuffix))
			for (var j in rule)
				ws_workRule.style[j] = rule[j];
		if (rule = ws_currentStyleSheet.get('.id_' + elt.id + selectorSuffix)) {
			for (var j in rule)
				ws_workRule.style[j] = rule[j];
		}
		ws_currentStyleSheet.getCssText(ws_workRule);	// To update it
	}
    
    // Erase local style
    ws_currentStyleSheet.erase('.id_' + elt.id);
}

/*	Test if a style property is set in the style sheet or selected element
 *	----------------------------------------------------------------------*/
function ws_isDefaultValue(jsProperty) {
    value = 0;

    // Search in element style (if selector suffix, like '.zzz a', value is not in element style)
    // In case of quickUpdate (like column width)
    if (!ws_workRule.selectorSuffix)
        value = ws_selectedElement.style[jsProperty];
    // Search in current selector
    if (!value) {
        value = ws_selectedCssValue(jsProperty);
    }
    return !value;
}

/*	Get the value of a property in the style sheet, for current selector
 *	--------------------------------------------------------------------*/
function ws_selectedCssValue(jsProperty) {
	var selector = ws_workRule.selector + ws_workRule.selectorSuffix;

	return ws_currentStyleSheet.get(selector, jsProperty);
}

/*  Get the value of style property in selected style
 *  -------------------------------------------------*/
function ws_selectedStyleValue(jsProperty) {
    if ((elt = ws_selectedElement) && ws_workRule.selector) {
        if (ws_workRule.selector == '.id_' + elt.id) {
            // In case of id selector, return the actual value
            return ws_actualStyleValue(jsProperty);
        } else {
            // In case of named style, return the value in css, or '' if not found
            return ws_currentStyleSheet.get(ws_workRule.selector + ws_workRule.selectorSuffix,
                                            jsProperty) || '';
        }
    }
    return false;
}

/*	Get actual value of an element style property, in specs then in computed style
 *	We do what we can for selectors like ".style a:hover"...
 *	------------------------------------------------------------------------------*/
ws_em_values = {fontSize: 1, lineHeight: 1, letterSpacing: 1, wordSpacing: 1};
ws_wrong_margins = {marginLeft: 1, marginRight: 1}; // For webkit bug

function ws_actualStyleValue(jsProperty, elt) {
    var elt = elt || ws_selectedElement;
	var value = 0;

	// If selector is suffixed, keep default as ''
    if (elt == ws_selectedElement && ws_workRule.selector && ws_workRule.selectorSuffix
            && !(value = ws_currentStyleSheet.get(ws_workRule.selector + ws_workRule.selectorSuffix, jsProperty))) {
        return '';
    }

    // Search the value in specs
    // Useful at least for properties not in computed style, like 'margin',
    // and for approximation values from computed style (like px to em)
    if (!value) {
    	if (!ws_currentStyleSheet)
            ws_currentStyleSheet = ws_clone(ws_originalStyleSheet);
        value = elt.style[jsProperty]                                       // In element itself
                || ws_currentStyleSheet.get('.id_' + elt.id, jsProperty)    // In its id style
                || ws_currentStyleSheet.get(                                // In its named style
                        '.' + elt.getAttribute('ws_class') + '_' + elt.getAttribute('ws_style'),
                        jsProperty);
    }

	// Search the value in computed style
	if (!value) {
		// Browser dependences
		var computedStyle = elt.currentStyle || window.getComputedStyle(elt, null);
		if (jsProperty == 'float') {
			if (computedStyle.styleFloat)
				jsProperty = 'styleFloat';
			else if (computedStyle.cssFloat)
				jsProperty = 'cssFloat';
		}
	  	value = computedStyle[jsProperty];
        // Webkit Bug #13343; Feb 2011, fixed in Webkit 78436
        // Try to find margin left or right in style if computedStyle different from default
        if (jsProperty in ws_wrong_margins && value != '5px' && value != '0px') {
            var styleSelector = '.' + elt.getAttribute('ws_class') + '_' + elt.getAttribute('ws_style');
            value = elt.style[jsProperty] || elt.style['margin']        // In case of quickUpdate
                    || ws_currentStyleSheet.get('.id_' + elt.id, jsProperty)
                    || ws_currentStyleSheet.get('.id_' + elt.id, 'margin')
                    || ws_currentStyleSheet.get(styleSelector, jsProperty)
                    || ws_currentStyleSheet.get(styleSelector, 'margin')
                    || '5px';
        }
    }

	// Convert value in em if necessary
  	if (jsProperty in ws_em_values) {
		if ((i = value.indexOf('p')) != -1) {
			value = value.substr(0, i);
			if (jsProperty == "fontSize") {
			  	if (window.getComputedStyle)
					var ref = window.getComputedStyle(elt.parentNode, null).fontSize;
				else
					var ref = elt.parentNode.currentStyle.fontSize;
			} else {
				var ref = computedStyle.fontSize;
			}
			ref = ref.substr(0, ref.indexOf('p'));
			value = (Math.round((value / ref) * 100) / 100) + 'em';
		} else if ((i = value.indexOf('%')) != -1) {
			value = value.substr(0, i);
			value = value / 100 + 'em';
		}
	}
	// Fix fontWeight value
	if (jsProperty == 'fontWeight') {
	    if (value != 'normal')
			if (value == 400) value = 'normal';
			else value = 'bold';
	}
	// Fix backgroundImage url value (strip site root to get a relative path)
	if (jsProperty == 'backgroundImage') {
	  	var mask = document.location.href.replace(/(.*\/+)([^\/]*)/, '$1');
	  	value = value.replace(mask, './');
	  	value = value.replace(/"/g, '');		// Because IE adds double quotes
	}
	// Fix backgroundPosition value
	if (jsProperty == 'backgroundPosition') {
		if (!value && computedStyle['backgroundPositionX'])	// IE
			value = computedStyle['backgroundPositionX'] + ' ' + computedStyle['backgroundPositionY'];
		else if (!value)		// FF
			value = '0 0';
	}
	// Fix textDecoration value to force ccs2, as webkit returns sometimes 'none rgb(...)' as default in computed style
	if (jsProperty == 'textDecoration') {
		value = value.replace(/.*none.*/, 'none');
	}
	return value || '';
}

//	STYLE BUTTONS IN ELEMENT UPDATE WINDOW
//	--------------------------------------
var ws_styleSelector;
function ws_buildStyleButtons() {
	var elt = ws_selectedElement;
	var buttonsElt = document.getElementById(elt.ws_updateForm.id + '_update_style');

	var buttons = '<table><tr>';
    buttons += '<td>' + $Str.elementStyle + ':</td><td><div id="' + buttonsElt.id + '_styleSelect" title="' + $Str.chooseStyle + '"></div></td>';
	buttons += '<td style="text-align: right"><button onclick="return ws_styleEditPopup(event);">' + $Str.editStyle + '...</button></td>';
	buttonsElt.innerHTML = buttons + '</tr></table>';

    // We are in the first window after clicking an element,
    // so this is the place to initialize style sheet object
    ws_currentStyleSheet = ws_clone(ws_originalStyleSheet);

    // Build style selector
	var stylesSorted = new Array();
	var elt = ws_selectedElement;
	var eltStyle = elt.getAttribute('ws_style');
	var ws_class = elt.getAttribute('ws_class');
	var stylePrefix = ws_class + '_';

	var basicClassName = elt.className;
	if (eltStyle) {                        // Erase style name in basic className
        fullStyleName = stylePrefix + eltStyle;
        str = elt.className;
        beg = str.indexOf(fullStyleName);
        end = beg + fullStyleName.length;
        if ((beg == 0 || str.charAt(beg - 1) == ' ') && (str.length == end || str.charAt(end) == ' '))
            basicClassName = str.substr(0, beg) + str.substring(end);
    }
	elt.ws_savedClassName = elt.className;

	var stylesObject = ws_currentStyleSheet.getStyles(ws_class);
	for (var i in stylesObject)
        stylesSorted.push(i);
	stylesSorted.sort(function(x,y){   // Case insensitive sort
            var a = String(x).toUpperCase();
            var b = String(y).toUpperCase();
            return a > b ? 1 : (a < b ? -1 : 0);
        });

	var options = [{value: $Str.ownStyle}];
	if (eltStyle)
		options.push({value: '', innerHTML: $Str.none});
	options.push({value: $Str.newone});
    if (stylesSorted.length)
        options.push({innerHTML: '<div class="separator">' + $Str.availableStyles + '</div>'});
    for (var i = 0; i < stylesSorted.length; i++)
        options.push({value: stylesSorted[i]});
	ws_styleSelector = new ws_Select({
        id: buttonsElt.id + '_styleSelect',
        options: options,
        onMouseOverOption: function(index) {        // Display selected object with right style
                value = this.options[index].value;
                switch (value) {
					case '':
                        ws_restoreStyle();
                        ws_selectedElement.className = basicClassName;
                        break;
                    case $Str.newone:
                    case $Str.ownStyle:
                    case eltStyle:
                        ws_restoreStyle();
                        break;
                    default:
                        if (!ws_workRule.selector) {
                            ws_buildStyleSelector(2);
                            ws_clearStyle();
                            ws_updateStyle();
                        }
                        ws_selectedElement.className = basicClassName + ' ' + stylePrefix + value;
                }
                ws_highlightElement();
            },
		onClose: function() {
                if (this.value != $Str.ownStyle)        
                    ws_selectedElement.className = basicClassName + ' ' + stylePrefix + this.value;
                else                    
                    ws_restoreStyle(true);
                ws_highlightElement();
			},
        onChange: function(index, event) {                 // Set right values in form inputs and submit
				if (this.value == $Str.newone) {
				    var w = $Forms.ws_save_style_form.build();
                    var f = document.getElementById('ws_save_style_form');
				    f.ws__user_style.value = eltStyle;
                    w.show(event, WS_CENTER | WS_FIXEDPOSITION | WS_DRAGGABLE | WS_MODAL);
                    try {f.ws__user_style.focus();} catch(e){}
                    return;
				} else if (this.value == eltStyle || this.value == $Str.ownStyle) {
					return;
                } else if (this.value != '') {
                    elt.ws_updateForm.ws__embedded_css_rules.value = '';
				}
				elt.ws_updateForm.ws__user_style.value = this.value;
                elt.ws_updateW.submit();
			}
    });
    ws_styleSelector.setValue(eltStyle ? eltStyle : $Str.ownStyle);
}

//	STYLE POPUP WINDOW
//	------------------

/*  Modifiable properties for each class:
 *  the panes to display and the properties or sections to hide
 *  -----------------------------------------------------------*/ 
var ws_classMask = {
    wsspage: {
        ws_font_pane: 1, textDecoration: 1,
        ws_margin_pane: 1, ws_margins: 1,
        ws_color_pane: 1, ws_shadow_pane: 1},
    wstoplevelcontainer: {
        allPanes: 1,
        ws_contents_align: 1},    //text-align doesn't work for image elements inside because the widthed div around
    wscontainer: {
        allPanes: 1,
        ws_contents_align: 1},    //text-align doesn't work for image elements inside because the widthed div around
    wsstitle: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wsimage: {
        allPanes: 1,
        ws_absolute_width: 1},
    wstextarea: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wsrawtext: {
        allPanes: 1},
    wssdownload: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wssmenu: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wsspagepath: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wslangselector: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wssmailto: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wssform: {  // It's a container descendant
        allPanes: 1},
    wssinputfield: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wsscontactform: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wssbadge: {
        allPanes: 1},
    wssrssreader: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1},
    wsshowselection: {
        allPanes: 1,
        ws_absolute_width: 1, leftPosition: 1, centerPosition: 1, rightPosition: 1}
};

/*  Open edit popup
 *  ---------------*/
function ws_styleEditPopup(event) {
	var w = $Forms.ws_style_form.build();

	// An ugly trick to prevent browser (FF, Opera..) to reshow the form when typing <CR> on it
	// for a quite mysterious reason.
	if (w == $Forms.active)
		return;
	
	var elt = ws_selectedElement;
	var styleClass = ws_styleSelector.value || elt.getAttribute('ws_style') || $Str.ownStyle;
	var scope = styleClass == $Str.ownStyle ? 2 : 1;
	var classProperties = ws_classMask[elt.getAttribute('ws_class')];
	classProperties.ws_cssText_pane = 1;	// Always cssText_pane

	//	Title
	var title = document.getElementById('ws_style_form_title');
	switch (scope) {
	  	case 0: title.innerHTML = ws_type_title + elt.title; break;
	  	case 1: title.innerHTML = $Str.elementStyle + ' ' + styleClass; break;
	  	case 2:
            var brokenTitle = ws_breakTitle(elt);
        	var subtitle = document.getElementById('ws_style_form_subtitle');
            title.innerHTML = brokenTitle.title;
            if (brokenTitle.subtitle) {
                subtitle.innerHTML = brokenTitle.subtitle;
                subtitle.style.display = 'block';
            } else {
                subtitle.style.display = 'none';
            }
	}

	// Popup
	ws_buildStyleSelector(scope, styleClass);
    new ws_Select({
        id: "ws_subSelector",
        options: elt.ws_cssSubselectorOptions,
        // We disable link style in case of block because that one would have precedence
        // over named styles of elements inside; it's always true if the block style is a
        // named style, randomly true if it is not (cf order in the style sheet)
        // The page container is an exception, it's style is always overloaded by elements style,
        // because page styles are at the beginning of the style sheet.
        // In case of block link it is enabled.
		disabled: (elt.ws_props & WS_CONTAINER && !(elt.ws_props & WS_PAGE_CONTAINER)
						&& !(elt.getAttribute('data-subclass') == 'block_link')),
        onChange: ws_changeStyleSelectorSuffix,
        noAutoReset: true       // Don't need to be resetted by ws_StyleControl.resetAll()
      });

	document.getElementById('ws_style_tabbed_pane').ws_tabbedPane.showPane(0, classProperties);
	w.show(event);
	return false;
}

/*	Change style selector suffix
 *	----------------------------*/
function ws_changeStyleSelectorSuffix(selectorSuffixIndex) {
    var option = ws_selectedElement.ws_cssSubselectorOptions[selectorSuffixIndex];
  	var mask = option.mask || ws_classMask[ws_selectedElement.getAttribute('ws_class')];
    
	ws_restoreStyle('simpleReset');		// Abort current alterations
	ws_workRule.selectorSuffix = option.value;
	mask.ws_cssText_pane = mask.ws_cssText_pane || 1;	// Always cssText_pane
	document.getElementById('ws_style_tabbed_pane').ws_tabbedPane.showPane(0, mask);
	ws_StyleControl.resetAll();
}
