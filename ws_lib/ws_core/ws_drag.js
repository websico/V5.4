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
 *	DRAG/DROP OPERATIONS : MOVE, RESIZE...
 *  ---------------------------------------
 */
 
// GLOBAL DRAG/DROP OBJECT
// =======================
$Drag = new function(){

	// PUBLIC
	this.eltMove = new EltMove();			// Child for moving an element
	this.eltResize = new EltResize();		// Child for resizing an element
	this.cellResize = new CellResize();		// Child for resizing a grid cell

	this.dragMe = dragMe;           		// Drag DOM element
	this.autoScroll = autoScroll;           // Must be public to be called by timeout
	this.prepare =                          // Called at mouse down on an element
		function(event){
			this.eltResize.prepare(event) || this.eltMove.prepare(event);
		};

	// PRIVATE

	//  OBJECT FOR MOVING A WEBSiCO ELEMENT
	//  -----------------------------------
	function EltMove(){

		// PUBLIC
		this.prepare = prepare;     // Called at mouse down
		this.beginNew = beginNew;	// Same thing for a new element

		this.target = 0;			// Last target highlighted

		// PRIVATE
		var me = this;				// To avoid confusion in event handlers
		var movingLabel = document.getElementById('ws_movingLabel');
		var cacheClass;
		var moveTargets;
		var mouseDownPosition = {x:0, y:0};

		// Prepare at mouse down (no right button) on the element
		// ------------------------------------------------------
		function prepare(event){
			event = window.event || event;
			if (event.button != 2){
				document.onmousemove = begin;
				document.onmouseup = function(){
	                    document.onmousemove = document.ws_default_onmousemove;
	                    document.onmouseup = document.ws_default_onmouseup;
	                };                                    
				mouseDownPosition = {x: event.clientX, y: event.clientY};
			}
		}

		// Begin to drag selected element
		// ------------------------------
		function begin(event) {
			event = window.event || event;

		    // Do not begin to drag if initial mouse move is not large enough,
		    // we have had some issues with some parkinsonian browsers or users
			if (Math.abs(mouseDownPosition.x - event.clientX) > 10
		                || Math.abs(mouseDownPosition.y - event.clientY) > 10) {
		      	// Cannot move page in itself, or element alone in model or free contents block,
		      	// because it would destroy the block, causing undefined damages on a model or
		      	// destruction of free contents block for all occurrences of the model.
		      	if (ws_selectedElement.ws_props & WS_PAGE_CONTAINER
		                || (!event.ctrlKey && ws_aloneInContainer(ws_selectedElement, WS_MODEL_CONTAINER | WS_FREE_CONTENTS_IN_MODEL))) {
		    		ws_cancelAction();
		    		ws_Form.alertAndConfirm('', $Str.lastElt);
		        }
		    	if (!document.all) {
		    		ws_setOpacity(ws_selectedElement, 0.5);
		        } else {
			    	ws_selectedElement.style.cursor = 'default';
				}
				ws_selectedElement.ws_cancelAction = end;
		        computeTargets();

		    	// Cursor management
		        cacheClass = 'dragElement';
		    	ws_mouseCacheOn(cacheClass);
		        document.onkeydown = function(oldKeydown) {
						return function(event){
							var event = window.event || event;
							if(event.keyCode == 17) {
								if (me.target)
									ws_mouseCacheOn('copyElement');
								return false;
							} else if (oldKeydown) {
								return oldKeydown(event);
							}
						};
					} (document.onkeydown);
		        document.onkeyup = function(oldKeyup) {
						return function(event){
							var event = window.event || event;
							if(event.keyCode == 17) {
								if (me.target)
									ws_mouseCacheOn(cacheClass);
								return false;
							} else if (oldKeyup) {
								return oldKeyup(event);
							}
						};
					} (document.onkeyup);
		        document.onmousemove = move;
			    document.onmouseup = drop;
		    }
			return false;
		}

		// Begin to drag a new element
		// ---------------------------
		function beginNew(){
			cacheClass = 'copyElement';
			ws_mouseCacheOn(cacheClass);
			ws_selectedElement.ws_cancelAction = end;
			computeTargets();
			document.onmousemove = move;
			document.onmouseup = function(event) {
									event = window.event || event;
								    ws_mouseCacheOff();     // Must be done before submit
									if (me.target) {
										var f = $Forms.ws_elementsBar.DOMElement;
										f.ws_element_move_to_location.value = ws_getLocation(me.target.elt);
										f.ws_element_move_to_side.value = me.target.pole;
                                        var target = me.target;
                                        ws_cancelAction();          // Cancel must be done before conditionalModelOperation()
                                        me.target = target;         // Needed by conditionalModelOperation()
                                        ws_selectedElement = elt;   // Needed by conditionalModelOperation()
                        		        $Forms[f.id].conditionalModelOperation(event);
                                        return false;
									}
									ws_cancelAction();
									return false;
								};
		}

		// Drag element, search target
		// ---------------------------
		function move(event) {
			event = window.event || event;

			var i;
			var x = event.clientX + ws_getScrollX();
			var y = event.clientY + ws_getScrollY();
			var oldDestination = me.target;
			//  Find target
		    me.target = 0;
		    i = moveTargets.length - 4;							// Page border
		    if (y <= moveTargets[i].top || x >= moveTargets[++i].right
		    		|| y >= moveTargets[++i].bottom || x <= moveTargets[++i].left) {
		            me.target = moveTargets[i];
		    }
		    if (!me.target) {
				for (i = 0; i < moveTargets.length; i++) {		// Elements border
					var target = moveTargets[i];
					if (x > target.left && x < target.right
						&& y > target.top && y < target.bottom
						// skip borders of selected element, except if copy
						&& (target.elt != ws_selectedElement || event.ctrlKey)
						// skip some H targets, except if shift key down
						/*&& ((event.shiftKey	&& target.targetDiv.id != 'ws_close_target')
                            ||(!event.shiftKey && target.targetDiv.id == 'ws_close_target'))*/ 
						&& (event.shiftKey
							|| target.targetDiv.id == 'ws_close_target'
							|| target.pole == 'E' ||  target.pole == 'W')
						) {
		// not sure this test is really useful				if (!me.target || target.elt.ws_depth < me.target.elt.ws_depth) {
		    	            me.target = target;
		//                }
					}
				}
			}
		  	if (oldDestination && me.target != oldDestination) {
				oldDestination.blur();
			}
		    // If target is in a model, display tooltip
			movingLabel.className = '';
		    if (me.target) {
		    
				ws_mouseCacheOn(event.ctrlKey ? 'copyElement' : cacheClass);
		    	me.target.focus();
		    	if (!('model' in me.target) && me.target.elt.ws_owner
		                && !(me.target.elt.ws_owner.ws_props & WS_FREE_CONTENTS_IN_MODEL))
		    		me.target.model = ws_getModelContainer(me.target.elt.ws_owner);
		    	if (me.target.model) {
		    		movingLabel.innerHTML = '<b> ></b> ' + me.target.model.title + ' ';
		    		movingLabel.className = 'display';
		    		movingLabel.style.left = x - movingLabel.offsetWidth + 10 + 'px';
		    		movingLabel.style.top = y - 20 + 'px';
		    	}
		    } else {
				ws_mouseCacheOn('dontDrop');
			}

			//	Scroll window if necessary
			autoScroll(event.clientX, event.clientY);
			return false;
		}

		// End of dragging element
		// -----------------------
		function drop(event) {
			event = window.event || event;
			var elt = ws_selectedElement;

		    ws_mouseCacheOff();     // Must be done before submit

			if (me.target && (me.target.elt != ws_selectedElement || event.ctrlKey)) {
				var f = $Forms.ws_element_move_form.build().DOMElement;  // Build the form if necessary
				f.ws_element_move_to_location.value = ws_getLocation(me.target.elt);
				f.ws_element_move_to_side.value = me.target.pole;
				f.ws_operation.value = event.ctrlKey ? 'duplicate' : 'move';
                var target = me.target;
                ws_cancelAction();          // Cancel must be done before conditionalModelOperation()
                me.target = target;         // Needed by conditionalModelOperation()
                ws_selectedElement = elt;   // Needed by conditionalModelOperation()
		        $Forms[f.id].conditionalModelOperation(event);
                return false;
			} /*else if (elt.ws_changedMargin) {
			  	ws_updateStyle('marginLeft', elt.style.marginLeft,
				  				'marginRight', elt.style.marginRight);
				document.getElementById('ws_style_form').ws_submitButton.click();	// To process onsubmit attribute
			}*/
            ws_cancelAction();
			return false;
		}

		function end() {
			if (me.target)
				me.target.blur();
			if (!document.all)
				ws_setOpacity(ws_selectedElement, 1);
			else
				ws_selectedElement.style.cursor = '';
		    me.target = 0;
			cancelAutoScroll();
		}

		// Target object
		// Used by computeTargets(), below
		// -------------------------------
		function MoveTarget(elt, pole, targetDiv) {
			var margin = 5;
		    if (elt.ws_props & WS_CONTAINER) {
		    	var selectHeight = elt.ws_depth*2 + 2;
		    	var selectWidth = elt.ws_depth*2 + 2;
			} else {
		        var selectHeight = Math.min(elt.ws_depth + (elt.ws_bottom - elt.ws_top)/3, 24);
		    	var selectWidth = Math.min(elt.ws_depth + (elt.ws_right - elt.ws_left)/3, 24);
		    }
			this.elt = elt;
			this.pole = pole;
			this.targetDiv = targetDiv;
			if (this.pole == 'E' || this.pole == 'W') { // H target y
			    if (ws_aloneInContainer(elt)) {
			        var y = elt.ws_owner.getBoundingClientRect().top + ws_getScrollY();
					this.top = y + margin;
					this.bottom = y + elt.ws_owner.offsetHeight - margin;
				} else {
					this.top = elt.ws_top + margin;
					this.bottom = elt.ws_bottom - margin;
				}
			} else {                                     // V target x
			    if (ws_aloneInContainer(elt)) {
			        var x = elt.ws_owner.getBoundingClientRect().left + ws_getScrollX();
					this.right = x + elt.ws_owner.offsetWidth - margin;
					this.left = x + margin;
				} else {
					this.right = elt.ws_right - margin;
					this.left = elt.ws_left + margin;
				}
			}
			switch (this.pole) {
				case 'N':
					this.top = elt.ws_top;
					this.bottom = elt.ws_top + selectHeight;
					break;
				case 'E':
					this.right = elt.ws_right;
					this.left = elt.ws_right - selectWidth;
					break;
				case 'S':
					this.top = elt.ws_bottom - selectHeight;
					this.bottom = elt.ws_bottom;
					break;
				case 'W':
					this.right = elt.ws_left + selectWidth;
					this.left = elt.ws_left;
					break;
				case 'M':
					this.top = (elt.ws_top + elt.ws_bottom) / 2 - 2*margin;
					this.bottom = (elt.ws_top + elt.ws_bottom) / 2 + 2*margin;
			}
			this.focus = targetFocus;
			this.blur = targetBlur;
		}

		// Prepare to drag element, build list of targets
		// ----------------------------------------------
		// Order does matter in ws_target_types and ws_containerList, generated by ws_core_classe.php:
		// - ELEMENTS ARE PROCESSED BEFORE THEIR OWNER CONTAINER
		// - PAGE MUST BE THE LAST ELEMENT
		var targetTypes = {components: ws_componentList, containers: ws_containerList};

		function computeTargets(){
			var j = 0;
			var nearTarget = document.getElementById('ws_near_target');
			var closeTarget = document.getElementById('ws_close_target');
            var forbiddenTargetTree = ws_selectedElement.ws_doNotIncludeInForm ? 'FORM' : 0;
			moveTargets = [];
			for (var targetType in targetTypes) {
				for (var i = 0; i < targetTypes[targetType].length; i++) {
					var elt = targetTypes[targetType][i];
					// For descendants
		            elt.ws_southDoneIndex = - 1;
		            elt.ws_northDoneIndex = - 1;
		            elt.ws_westDoneIndex = - 1;
		            elt.ws_eastDoneIndex = - 1;
                    // Target must not be a descendant of the element to drag
					var skip = false;
					var depth = 1;		// By the way we compute depth, useful later
                    for (var owner = elt; !skip && owner.ws_owner; owner = owner.ws_owner) {
						depth++;
						skip = (owner.ws_owner == ws_selectedElement
                                    || owner.parentNode.tagName == forbiddenTargetTree
                                    || owner.parentNode.offsetHeight === 0) // DropDown block case 
					}
					if (skip)
						continue;
					// Keep only non vertical containers and components
					if (elt.ws_props & (WS_VERTICAL_CONTAINER | WS_PAGE_CONTAINER))
						continue;

		            ws_setOuterGeometry(elt);
					elt.ws_depth = depth;

					// In case of a system container containing a single element
					// targets show vertical positions: top, middle, bottom
					if (elt.ws_props & WS_SYSTEM_CONTAINER
							&& elt == ws_selectedElement.ws_owner
							&& ws_aloneInContainer(ws_selectedElement)) {
						moveTargets[j++] =
							new MoveTarget(elt, 'N', closeTarget);
						moveTargets[j++] =
							new MoveTarget(elt, 'M', closeTarget);
						moveTargets[j++] =
							new MoveTarget(elt, 'S', closeTarget);
					} else if (elt.ws_owner) {
		                var index = elt.getAttribute('ws_index') * 1;
		                // Horizontal targets
		/*                if (!(elt.ws_props & WS_SYSTEM_CONTAINER)
		                        || elt.ws_props & WS_HORIZONTAL_CONTAINER
		                        || elt == ws_selectedElement.ws_owner)*/ {
							// North target if not done by previous sibling
							if (index != elt.ws_owner.ws_northDoneIndex) {
								moveTargets[j++] = new MoveTarget(
									elt, 'N',
		                            (elt.ws_props & WS_SYSTEM_CONTAINER) && !(elt.ws_props & WS_CONTAINER_ORIENTATION) ? nearTarget : closeTarget);
		                    }
							// South target if not done by previous sibling
							if (index != elt.ws_owner.ws_southDoneIndex) {
		    					moveTargets[j++] = new MoveTarget(
		    						elt, 'S',
		                            (elt.ws_props & WS_SYSTEM_CONTAINER) && !(elt.ws_props & WS_CONTAINER_ORIENTATION) ? nearTarget : closeTarget);
		                    }
		                    elt.ws_owner.ws_southDoneIndex = index - 1;
		                    elt.ws_owner.ws_northDoneIndex = index + 1;
		                }
						// See below when vertical targets are useless
						if (!elt.ws_no_vertical) {
							// West target if not done by previous sibling
		                    // or in non horizontal container (vertical or unoriented, which is the same)
							if (index != elt.ws_owner.ws_westDoneIndex || !(elt.ws_owner.ws_props & WS_HORIZONTAL_CONTAINER))
								moveTargets[j++] =
									new MoveTarget(elt, 'W', nearTarget);
							// East target if not done by previous sibling
		                    // or in non horizontal container (vertical or unoriented, which is the same)
							if (index != elt.ws_owner.ws_eastDoneIndex || !(elt.ws_owner.ws_props & WS_HORIZONTAL_CONTAINER))
								moveTargets[j++] =
									new MoveTarget(elt, 'E', nearTarget);
		                    elt.ws_owner.ws_westDoneIndex = index + 1;
		                    elt.ws_owner.ws_eastDoneIndex = index - 1;
						}
						// System container of unique element does not have vertical targets
						// because they would be with same effect as those on content
						elt.ws_owner.ws_no_vertical =
							(ws_aloneInContainer(elt) && elt.ws_owner.ws_props & WS_SYSTEM_CONTAINER)
					}
				}
			}
			// Add first container
			var elt = document.getElementById('firstContainer');
			elt.ws_depth = 0;
			elt.ws_props = WS_CONTAINER;
			ws_setOuterGeometry(elt);
			moveTargets[j++] = new MoveTarget(elt, 'N', nearTarget, 0);
			moveTargets[j++] = new MoveTarget(elt, 'E', nearTarget, 0);
			moveTargets[j++] = new MoveTarget(elt, 'S', nearTarget, 0);
			moveTargets[j] = new MoveTarget(elt, 'W', nearTarget, 0);
		}
	}

	//  OBJECT FOR RESIZING A WEBSiCO ELEMENT
	//  -------------------------------------
	//	Actually, ONLY IMAGE contained in the selected element can be resized...
	//	------------------------------------------------------------------------
	function EltResize(){

		// PUBLIC
		this.check = check;				// Check if mouse is in a resizing area
		this.prepare = prepare;			// Called at mousedown
		this.resize = resize;           // Called when a size in typed

		// PRIVATE
		var lastResizedElt;

		function check(event, elt) {
		  	event = window.event || event;
			var x = elt.getBoundingClientRect().left;
			var delta = Math.min(elt.offsetWidth / 4, 100);

			if ((event.clientX - x < delta) || (x + elt.offsetWidth - event.clientX < delta)) {
				elt.className += elt.className.indexOf(' hResize') == -1 ? ' hResize' : '';
				return true;
			} else {
		        elt.className = elt.className.replace(' hResize', '');
				return false;
			}
		}

		function prepare(event) {
		  	if (ws_selectedElement.ws_props & WS_IMAGE) {
			  	event = window.event || event;
				var elt = ws_selectedElement;

				if (elt != lastResizedElt) {		// Necessary for update form, even if don't drag
				  	lastResizedElt = elt;
					elt.ws_img = elt.getElementsByTagName('img')[0];
				  	elt.ws_hw_ratio = elt.ws_img.height / elt.ws_img.width;
				  	elt.ws_savedWidth = ws_actualStyleValue('width');
				  	elt.ws_savedMaxWidth = ws_actualStyleValue('maxWidth');
					elt.ws_cancelAction = function(){
												elt.style.width = elt.ws_savedWidth;
												elt.style.maxWidth = elt.ws_savedMaxWidth;
												elt.ws_img.style.width = '';	// modified in resize()
												lastResizedElt = 0;
											};
				}
				if (event.button != 2 && check(event, elt)) {	// No right button drag
					document.onmousemove = begin;
					document.onmouseup = function(event) {
						if (!(elt.ws_updateForm.ws__notFlexible.value * 1) && !ws_notResponsive){
							elt.style.maxWidth = elt.style.width;
							elt.style.width = '';
//							elt.ws_img.style.maxWidth = '100%';	// seems to be useful when image is floating
						}								
						end();
						elt.ws_updateW.show(window.event || event);
						return false;
					};
					return true;
				}
			}
			return false;
		}

		function begin(event) {
			event = window.event || event;
			var elt = ws_selectedElement;

			ws_mouseCacheOn('hResize');
			elt.ws_updateW.opacity(0.4);
			elt.ws_mousedown_width = elt.ws_img.width;
		    elt.ws_mouse_downX = event.clientX;
			var centerX = elt.getBoundingClientRect().left + (elt.ws_mousedown_width / 2);
			elt.ws_sign = (elt.ws_mouse_downX - centerX > 0) ? 1 : -1;
			document.onmousemove = resize;
			return false;
		}

		function resize(event, new_width, new_height) {
		  	event = window.event || event;
			if (elt = ws_selectedElement){     // Sometimes no element selected because of other calls
				// The order of following code is important for response time !o|
				if (new_width) {
					var new_height = Math.round(new_width * elt.ws_hw_ratio);
				} else if (new_height) {
					var new_width = Math.round(new_height / elt.ws_hw_ratio);
				} else {
					var new_width = elt.ws_mousedown_width + (event.clientX - elt.ws_mouse_downX) * elt.ws_sign;
					var new_height = Math.round(new_width * elt.ws_hw_ratio);
				}
				if (new_width < 0) new_width = 10;
				elt.ws_updateForm.ws__width.value = new_width;
				if (new_height < 0) new_height = 10;
				elt.ws_updateForm.ws__height.value = new_height;
				elt.style.width = new_width + "px";
				elt.style.maxWidth = '';
				elt.ws_img.style.width = elt.style.width;	// seems to be useful when image is floating
			}
			return false;
		}

		function end() {
			document.onmousemove = document.ws_default_onmousemove;
			document.onmouseup = document.ws_default_onmouseup; 
			ws_mouseCacheOff();
			ws_highlightElement();
			ws_computeLayout(true);
			return false;
		}
	}

	//  OBJECT FOR RESIZING GRID CELL
	//  -----------------------------
	function CellResize(){

		// PUBLIC
		this.buildLimits = buildLimits;

		// PRIVATE
		var lastResizedElt;
		var cellLimits = new Array();
		var limitTarget;
		var cellControl;

		function CellLimit(settings) {
			for (var i in settings)
				this[i] = settings[i];
			this.focus = targetFocus;
		}

		//  Build cell limits list
		//  Called by ws_computeLayout() in ws_jglobal.js
		//  ---------------------------------------------
		function buildLimits(){
		  	var targetDiv = document.getElementById('ws_container_limit');

			for (var i=0, j = 0; i < ws_containerList.length; i++) {
			  	var cell = ws_containerList[i];
			  	if (cell.ws_props & WS_CONTAINER_ORIENTATION) continue;
				var container = cell.ws_owner;
				if (!container) continue;			// In case of user selection

				if (container.ws_props & WS_HORIZONTAL_CONTAINER && ws_isVisible(container)) {
					var scrollX = ws_getScrollX();
					var scrollY = ws_getScrollY();
					var cellRect = cell.getBoundingClientRect();
					var containerRect = container.getBoundingClientRect();
    				var x = cellRect.left + scrollX;
    				var y = cellRect.top + scrollY;
    				var cx = containerRect.left + scrollX;   // Container is not necessarily offsetParent !! (Chrome, Opera)
//    				var cy = containerRect.top + scrollY;
    				var delta_select = 10;

					if (x != cx) {					// No left limit for first cell
						cellLimits[j++] = new CellLimit({
							container: cell,
							targetDiv: targetDiv,
							pole: 'W',
							left: x,
							top: y,
							right: x + delta_select,
							bottom: y + cell.offsetHeight
						});
					}								// No right limit for last cell
					if (x + cell.offsetWidth != cx + container.offsetWidth) {
						cellLimits[j++] = new CellLimit({
							container: cell,
							targetDiv: targetDiv,
							pole: 'E',
							left: x + cell.offsetWidth - delta_select,
							top: y,
							right: x + cell.offsetWidth,
							bottom:  y + cell.offsetHeight
						});
					}
		/*		} else if (container.ws_props & WS_VERTICAL_CONTAINER) {
					if (y != cy) {					// No top limit for first cell
						cellLimits[j++] = new CellLimit({
							container: cell,
							targetDiv: targetDiv,
							pole: 'N',
							left: x,
							top: y,
							right: x + cell.offsetWidth,
							bottom: y + delta_select
						});
					}								// No bottom limit for last cell
					if (y + cell.offsetHeight != cy + container.offsetHeight) {
						cellLimits[j++] = new CellLimit({
							container: cell,
							targetDiv: targetDiv,
							pole: 'S',
							left: x,
							top: y + cell.offsetHeight - delta_select,
							right: x + cell.offsetWidth,
							bottom:  y + cell.offsetHeight
						});
					}*/
				}
			}
		}

		//	Find the target limit under mouse
		//	---------------------------------
		document.ws_default_onmousemove =
		document.onmousemove =

		function(event) {
			event = window.event || event;
			var target = event.target || event.srcElement;

			// Do not test if a popup is displayed while not in cell sizing
			// (it means another action is in progress), or the mouse is on a link (like menu).
			if (($Forms.active != $Forms.defaultActive && !lastResizedElt) || target.tagName == 'A')
				return;

			var found = 0;
			var x = event.clientX + ws_getScrollX();
			var y = event.clientY + ws_getScrollY();

			//  Find target
			for (var i=0; i<cellLimits.length; i++) {
				target = cellLimits[i];
				if (x > target.left && x < target.right
					&& y > target.top && y < target.bottom) {
					// The only target accepted is the current one
					if (!ws_selectedElement || ws_selectedElement == target.container) {
						target.focus();
			            if (!ws_selectedElement)
							ws_clearHighlights();
						document.onmousedown = 	begin;
			            limitTarget = target;
		                ws_mouseCacheOn(target.pole == 'E' || target.pole == 'W' ? 'hResize' : 'vResize');
						found = 1;
					}
		            break;
				}
			}
			if (!found && document.onmousedown != document.ws_default_onmousedown) {
				document.getElementById('ws_container_limit').style.visibility = 'hidden';
				document.onmousedown = document.ws_default_onmousedown;
			    limitTarget = 0;
				ws_mouseCacheOff();
			}
		};

		//	Begin to resize a cell
		//	----------------------
		function begin(event) {
		  	event = window.event || event;
			//  With some browsers mouse event comes here even if the mouse in on a scrollbar,
			//	document.documentElement.clientWidth doesn't take in account scrollbar width...
			if (event.clientX < document.documentElement.clientWidth) {
			  	ws_selectElement(limitTarget.container);
				var elt = ws_selectedElement;

			    ws_mouseCacheOn(limitTarget.pole == 'E' || limitTarget.pole == 'W' ? 'hResize' : 'vResize');
			    elt.ws_cancelAction = function() {
						elt.ws_owner.className = elt.ws_owner.className.replace(" ws_cellResizeParent", '');
						lastResizedElt = 0;
						document.getElementById('ws_container_limit').style.visibility = 'hidden';
						ws_restoreStyle(true);
						cancelAutoScroll();
					};
				elt.ws_mousedown_width = elt.offsetWidth;
				elt.ws_mousedown_height = elt.offsetHeight;
			    elt.ws_mouse_downX = event.clientX + ws_getScrollX();
			    elt.ws_mouse_downY = event.clientY + ws_getScrollY();
			    elt.pole = limitTarget.pole;
				elt.sign = (limitTarget.pole == 'N' || limitTarget.pole == 'W') ? -1 : 1;
				elt.ws_yet_moved = false;
			    if (elt != lastResizedElt) {
			      	lastResizedElt = elt;
					ws_selectedElement = elt;
					ws_highlightElement();
				  	ws_buildStyleSelector(2);
				  	//if (elt.pole == 'W' || elt.pole == 'E') {
				  	    var w = $Forms.ws_cell_width_form.build();
					/*} else {
				  	    var w = $Forms['ws_cell_height_form'].build();
						ws_cell_height_control.resetValue();
					}*/
					w.show(event, WS_FIXEDPOSITION | WS_DRAGGABLE);
					cellControl = document.getElementById("ws_cellWidthControl").ws_styleControl;
					elt.ws_owner.className += " ws_cellResizeParent";
				}
				document.onmousemove = drag;
				document.onmouseup = stop;
				return false;  // To prevent from text selection or other side effects
			}
		}

		// Drag cell size
		// --------------
		function drag(event) {
		  	event = window.event || event;
			var elt = ws_selectedElement;

		    // First move event is not significant (Chrome)
		    if (elt.ws_yet_moved) {
		        var limit = limitTarget.targetDiv;
		        if (elt.pole == 'W' || elt.pole == 'E') {
		            var x = event.clientX + ws_getScrollX();
			    	var new_value = elt.ws_mousedown_width + (x - elt.ws_mouse_downX) * elt.sign;
					limit.style.left = x - limit.offsetWidth / 2 + 'px';
			      	new_value = Math.round((new_value * 1000) / elt.ws_owner.clientWidth) / 10;
			      	cellControl.setValue(new_value);		// Value is checked by the control
			    	ws_quickUpdateStyle('width', cellControl.getValue() + '%');
				} else {
		/*	Will be useful when IE 8 is out, for an accurate height setting
		            var y = event.clientY + ws_getScrollY();
			    	var new_value = elt.ws_mousedown_height + (y - elt.ws_mouse_downY) * elt.sign;
					limit.style.top = y - limit.offsetHeight / 2 + 'px';
			      	new_value = Math.round((new_value * 1000) / elt.ws_owner.clientHeight) / 10;
			      	ws_cell_height_control.setValue(new_value);		// Value is checked by the control
			    	ws_quickUpdateStyle('height', ws_cell_height_control.getValue() + '%')*/;
				}

		    	//	Scroll window if necessary
		    	autoScroll(event.clientX, event.clientY);
		    }
		    elt.ws_yet_moved = true;
		    return false;
		}

		// Stop cell resizing
		// ------------------
		function stop() {
			cancelAutoScroll();
		   	ws_mouseCacheOff();
		   	if (limitTarget)
		   		limitTarget.targetDiv.style.visibility = 'hidden';
		/*	Will be useful when IE 8 is out, for an accurate height setting
			if (ws_selectedElement.pole == 'N' || ws_selectedElement.pole == 'S')
				ws_cell_height_control.ws_control.onEnd();
			else*/
				ws_computeLayout(true);
			document.onmousemove = document.ws_default_onmousemove;
			document.onmouseup = document.ws_default_onmouseup;
		}
	}

	//  DRAG'n DROP DOM ELEMENT
	//	-----------------------
	//	(Inspired by Michael Burt : http://mburt.funpic.org)
	//	----------------------------------------------------
	function dragMe(event){
		elt = this;			// To avoid confusion in event handlers

		// Enter here by mousedown callback of the element
		event = window.event || event;
		var target = event.target || event.srcElement;
		var undraggableTags = {INPUT: 1, BUTTON: 1, A: 1, IMG: 1, TEXTAREA: 1, SELECT: 1, LABEL: 1};

		// Target may be input or other element child object which must catch mouse events,
		// so we have to ignore event in this case.
		while (target != this) {
			if ((target.tagName in undraggableTags) || target.onmousedown || target.onclick)
				return true;
			target = target.parentNode;
		}
		if (event.preventDefault)
			event.preventDefault();			// iOS
				
	  	// Prepare event handlers
		var offsetx = event.clientX - this.offsetLeft;
		var offsety = event.clientY - this.offsetTop;
		document.ws_saved_onmousemove = document.onmousemove;
		if (!(cacheWasOn = ws_mouseCacheIsOn()))
	        ws_mouseCacheOn();                          // To prevent perturbations like browser selection
		document.ontouchmove = function(event) {		// Tactile device
				return document.onmousemove(event.targetTouches[0]);
			}; 
		document.onmousemove = function(event) {		// Drag
				event = event || window.event;
				elt.style.left = event.clientX - offsetx + 'px';
				elt.style.top = event.clientY - offsety + 'px';
				return false;
			};
		document.ws_saved_onmouseup = document.onmouseup;
		document.ontouchend =							// Tactile device 
		document.onmouseup = function() {				// Drop
				document.onmousemove = document.ws_saved_onmousemove;
				document.onmouseup = document.ws_saved_onmouseup;
				document.ontouchmove = document.ontouchend = null;
				if (!cacheWasOn)
		            ws_mouseCacheOff();
				if (!document.all)
			  		ws_setOpacity(elt, 1);
			};

		// Transparentify window
		if (!document.all)
	  		ws_setOpacity(this, 0.8);
		return false;
	}

	//  SCROLL WINDOW IF CURSOR NEAR BORDER
	//	-----------------------------------
	var tmo = 0;
	function autoScroll(xCur, yCur) {
	  	var deltax = 0, deltay = 0;
		if (yCur < 50 && ws_getScrollY()) {
			deltay = yCur - 50;
		} else if (yCur > document.documentElement.clientHeight - 50) {
			deltay = yCur - document.documentElement.clientHeight + 50;
		} else if (xCur < 50 && ws_getScrollX()) {
			deltax = xCur - 50;
		} else if (xCur > document.documentElement.clientWidth - 50) {
			deltax = xCur - document.documentElement.clientWidth + 50;
		}
		clearTimeout(tmo);
		if (deltax || deltay) {
			window.scrollBy(deltax, deltay);
			tmo = setTimeout(function(){autoScroll(xCur, yCur)}, 50);
		}
	}
	function cancelAutoScroll() {
		clearTimeout(tmo);
	}

	//	HIGHLIGHT A TARGET
	//	------------------
	//	during resize a container or drag/drop an element
	//	-------------------------------------------------
	function targetFocus() {
	  	var thickness = 6;
	  	var offset = thickness / 2;
	  	var target = this.targetDiv;
	  	target.style.visibility = 'visible';
	  	target.style.top = this.top - offset + 'px';
	  	target.style.left = Math.max(this.left - offset, 0) + 'px';
	  	target.style.width = this.right - this.left + 'px';
	  	target.style.height = thickness + 'px';
	  	switch (this.pole) {
		  	case 'S':
		  	  	target.style.top = this.bottom - offset + 'px';
		  	case 'N':
			  	target.style.left = this.left + 'px';
		  	  	break;
		  	case 'E':
		  	  	target.style.left = this.right - offset + 'px';
		  	case 'W':
			  	target.style.top = this.top + 'px';
		   	  	target.style.width = thickness + 'px';
			  	target.style.height = this.bottom - this.top + 'px';
			  	break;
		  	case 'M':
		  	  	target.style.top = (this.bottom + this.top - thickness) / 2 + 'px';
	  	}
	}
	function targetBlur() {
	  	this.targetDiv.style.visibility = 'hidden';
	}
};
