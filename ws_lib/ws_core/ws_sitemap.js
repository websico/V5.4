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
 *	SITEMAP MANIPULATION
 *  ---------------------------------------
 */

new ws_Form('ws_sitemap_form', function(){
	this.HTML = this.buildForm(
		'<input type="hidden" name="ws_operation" value="sitemap">'
		+ '<input type="hidden" name="ws_publish_what" value="sitemap">'
		+ '<input type="hidden" name="ws_sitemap">'
		+ '<div id="ws_sitemap_window" class="popupVList"></div>'
		,
		'<button type="button" title="' + $Str.info + '"'
			+ 'onclick="ws_openInfo(\'man_sitemap\')">'
		    + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_info"></use></svg>'
		+ '</button>'
		+ '<button type="button" title="' + $Str.forget + '..."'
			+ 'onclick="$Forms.' + this.id + '.forget()">'
		    + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_forget"></use></svg>'
		+ '</button>'
		+ (ws_sitemapIsDraft ?
			'<button type="button" title="' + $Str.smPublishCaption + '..."'
				+ 'onclick="$Forms.' + this.id + '.publish()">'
		        + '<svg viewBox="0 0 8 8"><use xlink:href="#ws_publish"></use></svg>'
			+ '</button>' : '')
        ,
		$Str.sitemap);

	this.setup = function(){
		document.getElementById('ws_sitemap_window').innerHTML = buildMapHTML();
	    movingLabel = document.getElementById('ws_movingLabel');
		savedSitemap = this.DOMElement.innerHTML;
		// Inter-page targets handlers
		for (var div = this.DOMElement.getElementsByTagName('div'), i = 0; i < div.length; i++) {
			if (div[i].getAttribute('ws_sm_target'))
				div[i].onmouseup = dropPage;
		}
		// Page line handlers
		for (var a = this.DOMElement.getElementsByTagName('a'), i = 0; i < a.length; i++) {
			if (a[i].getAttribute('ws_sm_target')) {
				a[i].onmousedown = prepareDragPage;
				a[i].onmouseup = dropPage;
			} else if (a[i].className == 'ws_folder_button') {
				a[i].onclick = function() {openCloseFolder(this.parentNode.parentNode)};
			}
		}

	    function buildMapHTML(item) {
	        if (item) {
	    		var html = "\n"
	    			+ '<div style="margin-left: 1em;' + (item.parent_id ? ' display: none' : '') + '" ws_page_id="' + item.id + '">'
						+ '<div style="height: 6px" ws_sm_target="yes"></div>'
						+ '<div class="ws_status_' + item.status + '" title="' + $Str['status_' + item.status] + '">'
							+ '<a href="javascript:void(0)" class="ws_folder_button" id="' + item.id + '_button" ' + (item.children.length ? '' : ' style="visibility: hidden"') + '>&gt;</a>'
							+ '<a class="ws_folder' + (item.id == ws_currentPageId ? ' selected' : '') + '" ws_sm_target="yes"'
								+ ' href="' + item.url + '"'
								+ ' title="Url: ' + item.url + '">'
								+ (item.name.replace(/\s/g, '').length ? item.name : item.url)
							+ '</a>'
						+ '</div>';
	            for (var i = 0; i < item.children.length; i++)
	                html += buildMapHTML(ws_sitemap[item.children[i]]);
	            html += '</div>';
	        } else {
	            var html = '';
	            for (var id in ws_sitemap) {
	                var item = ws_sitemap[id];
	                if (!item.parent_id)	// Root children
	                	html += buildMapHTML(item);
				}
	        }
	        return html;
	    }
	};

	// Callbacks, handlers
	// ------------------- 
	this.submit = function(){
		var f = document.getElementById(this.id);
		var pages = f.getElementsByTagName('div');
		f.ws_sitemap.value = '';
		for (var i = 0; i < pages.length; i++) {
			if (id = pages[i].getAttribute('ws_page_id'))
				f.ws_sitemap.value +=
				  		id + '/' +
				  		(pages[i].parentNode.getAttribute('ws_page_id') || '') +
						'/';
		}
		this.finalSubmit();
	};

	this.forget = function(){
		var title = ws_sitemapIsDraft ? $Str.smDeleteDraftTitle : $Str.smDeleteTitle;
		var text = ws_sitemapIsDraft ? $Str.smDeleteDraftText : $Str.smDeleteText;
		var f = document.getElementById(this.id);

		f.ws_operation.value = 'forget_sitemap';
		ws_Form.alertAndConfirm(title, text,this);
	};

	this.publish = function(){
		var f = document.getElementById(this.id);

		f.ws_operation.value = 'publish';
		ws_Form.alertAndConfirm($Str.smPublish, $Str.smPublishText, this);
	};

	this.restore = function(){
		endDragPage();
		if (this.DOMElement) {
			this.DOMElement.innerHTML = savedSitemap;
		}
	};

	// Private functions and vars
	// --------------------------
	var draggedPage;
	var overObj;
	var movingLabel;
	var savedSitemap;

	// Select a page to move
	// ---------------------
	function prepareDragPage() {
		movingLabel.innerHTML = this.innerHTML;
		draggedPage = this;
		ws_mouseCacheOn();
		document.onmousemove = dragPage;
		document.onmouseup = endDragPage;
		if (document.all) {		// Another IE quirk :o)
			var pages = this.DOMElement.getElementsByTagName('div');
			for (var i = 0; i < pages.length; i++)
				if (pages[i].getAttribute('ws_page_id'))
					pages[i].getElementsByTagName('div')[0].style.width = pages[i].offsetWidth + 'px';
		}
		return false;
	}

	// Move a page
	// -----------
	function dragPage(event) {
		event = window.event || event;
		var target = event.target || event.srcElement;

		movingLabel.className = 'display';
		movingLabel.style.left = event.clientX + ws_getScrollX() + 'px';
		movingLabel.style.top = event.clientY + 20 + ws_getScrollY() + 'px';
		draggedPage.style.color = '#029ddf';
		if (target != overObj) {
			if (overObj) {
				overObj.style.cursor = '';
				overObj.style.backgroundColor = '';
			}
			overObj = target;
			if (target.getAttribute('ws_sm_target')) {
				target.style.cursor = 'default';
				target.style.backgroundColor = '#029ddf';
			}
		}
		return false;
	}

	// Drop a page on a target
	// -----------------------
	function dropPage(event) {
		event = window.event || event;
		var target = event.target || event.srcElement;
		try {
		  	if (draggedPage && target != draggedPage) {
			    var page = draggedPage.parentNode.parentNode;

	            // Close folder if it becomes empty
	            if (category = page.parentNode.getAttribute('ws_page_id')) {
	                folder = page.parentNode;
	                for (allPages = folder.firstChild; allPages; allPages = allPages.nextSibling) {
	                    var keepCat = 0;
	                    if (allPages.nodeType == 1 && allPages.getAttribute('ws_page_id') && allPages != page) {
	                        keepCat = 1;
	                        break;
	                    }
	                }
	                if (!keepCat) {
	                    var folderButton = document.getElementById(category + '_button');
	                    folderButton.style.visibility = 'hidden';
	                    folderButton.innerHTML = '&gt;';
	                }
	            }
		  		if (target.tagName == 'A') {		// Target is a page, insert in category
	    		    var targetPage = target.parentNode.parentNode;
	    	  		targetPage.appendChild(page);
	    	  		ws_openCloseFolder(targetPage);
		  		} else {							// Move dragged page before target
	    		    var targetPage = target.parentNode;
					targetPage.parentNode.insertBefore(page, targetPage);
		  		}
				page.style.marginLeft = ws_actualStyleValue('marginLeft', targetPage);
		  	}
		} catch (e) {}
		endDragPage();
		return false;
	}

	// End of dragging page
	// --------------------
	function endDragPage() {
		if (draggedPage)
			movingLabel.className = '';
		draggedPage = 0;
		if (overObj) {
			overObj.style.backgroundColor = '';
			overObj = 0;
		}
		ws_mouseCacheOff();
		if (document.onmousemove == dragPage)
			document.onmousemove = document.ws_default_onmousemove;
		if (document.onmouseup == endDragPage)
			document.onmouseup = document.ws_default_onmouseup;
	}

	// Open/close folder switch
	// ------------------------
	function openCloseFolder(folder) {
	    folderButton = document.getElementById(folder.getAttribute('ws_page_id') + '_button');
	    folderButton.innerHTML = folderButton.innerHTML == '&gt;' ? '&lt;' : '&gt;';
	    folderButton.style.visibility = 'visible';
	    for (page = folderButton.parentNode; page = page.nextSibling;) {
	        if (page.nodeType == 1)
	            page.style.display = folderButton.innerHTML == '&lt;' ? '' : 'none';
	    }
	}
});
