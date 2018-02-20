<?php
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
 *  STANDARD CLASSES
 *  ---------------------------------------
 */

//  STANDARD PAGE
//  ---------------------------------------
class WssPage extends WsTopLevelContainer {
    public $description;
	public $title;
 
	public function __construct($id=0, $properties=0, $style='') {
		if (!($properties & WS_CONTAINER_ORIENTATION))
			$properties |= WS_VERTICAL_CONTAINER;		// Default orientation = vertical
        parent::__construct($id, $properties | WS_PAGE_CONTAINER, $style);
        $this->url_id = $this->id;

		$img = new WsImage(); 
		$img->SetValue('value', WS_CORE_PATH."ws_images/start_help_300.jpg");
		$img->SetValue('embedded_css_rules',
									'.id_'.$img->id.'{margin-top: 130px; margin-right:auto; margin-bottom: 30px; margin-left: auto}');
		$img->SetValue('tooltip', 'Start with Websico');
		$img->SetValue('width', 300);
		$img->SetValue('height', 199);
		$img->SetValue('href', "?mode=1");
        $badge = new WssBadge();
		$badge->SetValue('embedded_css_rules',
									'.id_'.$badge->id.'{margin-left:auto; margin-right:auto}');
   		$this->InsertContent(new WsContainer(0, WS_CONTAINER | WS_SYSTEM_CONTAINER, array($img, $badge)));
	}

	// Save is overloaded to check properties, sometimes pages were
	// saved with wrong flags, and that resulted in no possibility
	// to modify or to delete them.
	// -------------------------------------------------------------
	public function Save($force_public = false) {
		if (!($this->properties & WS_PAGE_CONTAINER)){
    	  	global $ws_unknownError;
	    	WsUtils::WsError($ws_unknownError);
	    	return false;
		} else {
            return parent::Save($force_public);
		}
	}

	// Build an RSS feed for all descendants of the actual page.
	// We take all the tree but only pages which have no children
	// are taken to feed the content.
	// Each of that feed pages produces an rss item.
	// ----------------------------------------------------------
    public function MakeRss($root = false, $anypage = false){
		global $ws_url_suffix, $ws_user_lang;

		static $rssArray = array();

		$url = $_SERVER['SERVER_NAME'].str_replace('?'.$_SERVER['QUERY_STRING'], '', $_SERVER['REQUEST_URI']);
		$url_root = WsSite::$protocol.'//'.$_SERVER['SERVER_NAME'].'/';
        $sitemap = new WsSitemap();
        $rssString = '';
        $elements = $this->GetAllContents();

		// If I am the root page
		// - open the channel
		// - loop for all descendance
		// - order items by time
		// - close the channel
		//
		// Note: if url doesn't mention a path,
		// any page in the site is taken in account
		// ----------------------------------------
		if ($root) {
			// When description comes from a rich text it may contain
			// some html entities and some readers don't like that,
			// so we translate if necessary to utf8...
			$description = html_entity_decode(strip_tags($this->makeDescriptionString($elements)));
			if (!is_utf8($description))
				$description = utf8_encode($description);
            $rssString .= '<?xml version="1.0" encoding="utf-8"?'.'>
					<rss version="2.0">
						<channel>
							<title>'.$this->makeTitleString($elements, $url).'</title>
							<link>'.WsSite::$protocol.'//'.$url.'</link>
							<description>'.$description.' </description>
				';
			$anypage = ltrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/\\');
			$anypage = (strripos($anypage, $ws_url_suffix) === false);
			$page_array = $anypage ? $sitemap->item_by_id : $sitemap->item_by_id[$this->id]->children;
            foreach ($page_array as $item) {
                $page = self::Read($item->url_id, $this->lang);
                $page->MakeRss(0, $anypage);
            }
            krsort($rssArray);
            $rssString .= implode($rssArray)."</channel></rss>";
			return $rssString;
        } else {
			// If I am a leaf (with no children) or must see any page,
			// pickup data to build an item
			// -------------------------------------------------------
            if ($anypage || !$sitemap->item_by_id[$this->id]->children){
				$link = $url_root.$ws_user_lang.'/'.$this->url_id.$ws_url_suffix;
                $rssString = '<item><link>'.$link.'</link>';

				// Item title: url_id in last resort
				// ---------------------------------
                $rssString .= '<title>'.$this->makeTitleString($elements, $this->url_id).'</title>';

				// Item description = first rich text and image, default to page description
				// -------------------------------------------------------------------------
                $rssString .= "<description>";
                $description = '';
                foreach ($elements as $element) {
                    if (get_class_lower($element) == "wsimage" && !$element->GetModel()) {
                        $tooltip = empty($element->tooltip) ? $element->original_name : htmlspecialchars($element->tooltip);
						$width = @$_REQUEST['ImageWidth'] ? $_REQUEST['ImageWidth'] : 150;
                        $description .= '<a href="'.$link.'"><img width="'.$width.'" alt="'.$tooltip.'" title="'.$tooltip.'" src="';
                        if (is_file(WS_IMAGE_PATH.$element->value))
                            $description .= $url_root.WS_IMAGE_PATH.$element->value;
                        else if (is_file($element->value))        // Because of new page default image
                            $description .= $url_root.$element->value;
                        else
                            $description .= $url_root.WS_CORE_PATH.'ws_images/noimage.svg';
                        $description .= '"></a>';
                        break;
                    }
                }
                $description .= $this->makeDescriptionString($elements);
                $rssString .= htmlspecialchars($description)."</description>";

				// Item date and closure
				// ---------------------
                $rssString .= "<pubDate>" . date('r', $this->date) . "</pubDate>";
                $rssString .= '</item>';
				$rssArray[$this->date] = $rssString;
            }

			// If I have children, walk through them
			// unless if full walk through the site.
			// -------------------------------------
			if (!$anypage && $sitemap->item_by_id[$this->id]->children) {
	            foreach ($sitemap->item_by_id[$this->id]->children as $item) {
	                $page = self::Read($item->url_id, $this->lang);
	                $page->MakeRss();
				}
            }
        }
    }

	// Feed or Item title = first level 1 title, page title,
	// page name, or $default in last resort
	// -----------------------------------------------------
	private function makeTitleString($pageElements, $default) {
		$titleString = $default;
		if (!empty($this->name))
			$titleString = $this->name;
        foreach ($pageElements as $element) {
			if (!empty($this->title))
				$titleString = $this->title;
            if (get_class_lower($element) == "wsstitle" && $element->level == 1 && !$element->GetModel()) {
                $titleString = str_replace('\n', ' ', $element->value);
                break;
            }
        }
		return htmlspecialchars($titleString);
    }

	// Description/string  = first rich text or description
	// ----------------------------------------------------/
	private function makeDescriptionString($pageElements) {
		$descriptionString = $this->description;
	    foreach ($pageElements as $element) {
			$length = @$_REQUEST['ItemDescriptionLength'] ? $_REQUEST['ItemDescriptionLength'] : 200;
			$lengthTag = '-EndOfMyDescription-';
	        if (get_class_lower($element) == "wstextarea" && !$element->GetModel()) {
				$descriptionString = strip_tags($element->value, '<p><br>');
				if ($length < strlen($descriptionString)) {
					$descriptionString = wordwrap(strip_tags($element->value, '<p><br>'), $length, $lengthTag);
					$descriptionString = substr($descriptionString, 0, stripos($descriptionString,$lengthTag)).'...';
				}
	            break;
	        }
	    }
	    return $descriptionString;
    }
}

//	STANDARD BASIC COMPONENTS
//  ---------------------------------------
class WssTitle extends WsText {
	var $level;
	var $href;

	function WssTitle($value='', $level=2) {
		parent::WsText($value);
		$this->level = $level;
	}

	function Display($prefix="", $suffix="") {
	    parent::Display($prefix."<h".$this->level, "/h".$this->level.">".$suffix);
	}

	function DisplayContent() {
		if (!empty($this->href) && !($this->properties & WS_IN_BLOCK_LINK)){
			echo '<a href="'.$this->BuildHref().'">';
			parent::DisplayContent();
			echo '</a>';
		} else {
			parent::DisplayContent();
		}
	}
}

//	WEBSICO BADGE
//  ---------------------------------------
class WssBadge extends WsComponent {

	function Display($html_prefix="", $html_suffix="") {
		if ($im = imagecreatefrompng(WS_CORE_PATH.'ws_images/ws_badge.png')) {
		  	// Fix width of <div> to fit image size
		  	// See wsimage comments about embedding the element in a div
			$html_prefix = '<div style="width: '.imagesx($im).'px"';
			$html_suffix = "/div>";
		}
		parent::Display($html_prefix, $html_suffix);
	}

	function DisplayContent() {
	  	// Do not use a <a> tag because of background issues
	  	echo '<img
 			onclick="ws_onclick_badge(event); return false"
			src="'.WS_CORE_PATH.'ws_images/ws_badge.png"
			alt="Site management" title="Site management">';
	}
}

//  MENU
//  ---------------------------------------
class WssMenu extends WsComponent {
	var $category = 0;			// Top category to display
	var $depth = 10;			// Number of levels to display

	function WssMenu() {
        parent::WsComponent();
        $this->more_classes = ' dontDisplayOnXS dontDisplayOnS';
	}
	
	function DisplayContent() {
		global $ws_permissions;

	  	$map = new WsSitemap();
		if (!array_key_exists($this->category, $map->item_by_id)) {
			$this->category = 0;
		}
		$html = '<div class="button customLink"	onclick="ws_reducedMenuButtonClick(event, this.parentNode)">≡</div>';
		$html .= "\n".'<nav><ul class="'.$this->value.'"'.
			($ws_permissions & P_EDIT ? ' ws_category="'.$this->category.'" ws_depth="'.$this->depth.'"' : '').
			'>';
		$root = empty($this->category) ? $map->root : $map->item_by_id[$this->category];
		foreach ($root->children as $item) {
            $html .= self::DisplayItem($item);
        }
		echo $html."</ul></nav>\n";
	}

	private function DisplayItem(&$item, $depth = 0) {
		global $ws_current_tlc;
		
		if (empty($item->name))
            return '';
        $isfolder = false;
		if ($depth < $this->depth)
		    foreach ($item->children as $subItem)
        		if ($isfolder = !empty($subItem->name))
					break;

        // Link to the page and submenu
        $linkTag = $this->properties & WS_IN_BLOCK_LINK ? 'span' : 'a';

		$html = "\n <li><".$linkTag;
		if ($isfolder) {
			$html .= ' onmouseover="ws_showMenu(\''.$item->id.$this->id.'\', this, event)"'
			 .' onmouseout="ws_hideMenu(\''.$item->id.$this->id.'\')"';
        }
		$html .= ($item->id == $ws_current_tlc->id ?
		  	// href="javascript:void(0)" instead of href="#" because it's safier, especially 
			// when using some script who search for anchors with href="#xxx"...
            ' href="javascript:void(0)" class="selected menuitem"' : 
            ' href="'.WsUtils::BuildURL($item->url_id).'"');
			$html .= '>'.ws_bsn2br_special($item->name).'</'.$linkTag.'>';

        // Open a submenu if necessary
        if ($isfolder) {
            $class = get_class_lower($this);
    		$html .= "\n".'<ul id="'.$item->id.$this->id.'"'
    			.' class="wscomponent vertical submenu '.($this->user_style ? ' '.$class.'_'.$this->user_style : '').'"'
    			.' onmouseover="ws_showMenu(this.id)"'
    			.' onmouseout="ws_hideMenu(this.id)">';
            foreach ($item->children as $child)
                $html .= self::DisplayItem($child, $depth + 1);
            $html .= '</ul>';
        }
        $html .= '</li>';
        return $html;
    }
}

//  PAGE PATH
//  ---------------------------------------
class WssPagePath extends WsComponent {
	function Display($html_prefix="", $html_suffix="") {
	    parent::Display('<nav', '/nav>');
	}

	function DisplayContent() {
		global $ws_current_tlc, $ws_url_suffix;

        $map = new WsSitemap();
        $page = $map->item_by_id[$ws_current_tlc->id];
        do {
            if ($page->id) {
				if (!($this->properties & WS_IN_BLOCK_LINK))
					$path = '<a href="'.$page->url_id.$ws_url_suffix.'">'.($page->name ? $page->name : $page->url_id).'</a>'.@$suffix.@$path;
				else
					$path = ($page->name ? $page->name : $page->url_id).@$suffix.@$path;
                $suffix = ' &gt; ';
            }
        } while ($page = $page->parent);
        echo $path;
    }
}

//  FILE DOWNLOAD
//  ---------------------------------------
class WssDownload extends WsRawText {

	function DisplayContent() {
	    reset($this->data_filename);
		if (!($this->properties & WS_IN_BLOCK_LINK)){
	   		echo '<a href="'.WS_RAWDATA_PATH.current($this->data_filename).'"'
	            // data-realName (original name) can be used for some analytics (cf MFF)
	            .' data-realName="'.key($this->data_filename).'" target="_blank">';
	   		parent::DisplayContent();
			echo '</a>';
	   	} else {
	   		parent::DisplayContent();
		}
	}
}

//  LANGUAGE SELECTOR
//  ---------------------------------------
class WsLangSelector extends WsComponent {
	function Display($html_prefix="", $html_suffix="") {
		global $ws_permissions;

	  	// Add an attribute for the value
		$html_prefix = '<div '.($ws_permissions & P_EDIT ? 'ws_value="'.$this->value.'"' : '');
		$html_suffix = "/div>";
		parent::Display($html_prefix, $html_suffix);
	}

	function DisplayContent() {
		global $ws_langs_array, $ws_current_tlc;
		$langs = @$this->value ? $ws_current_tlc->GetLangList() : $ws_langs_array;
		foreach ($langs as $lang)	// Must be non obstructive javascript, for search engines etc..
            // Whitespace at beginning is necessary for ie to wrap !!
		if (!($this->properties & WS_IN_BLOCK_LINK))
			echo ' <a href="'.WsUtils::BuildURL($ws_current_tlc->url_id, $lang).'"><img src="'.WS_CORE_PATH.'ws_images/flag_'.$lang.'.gif" alt="'.$lang.'" title="'.$lang.'"></a>';
		else
			echo ' <img src="'.WS_CORE_PATH.'ws_images/flag_'.$lang.'.gif" alt="'.$lang.'" title="'.$lang.'">';
	}
}

//  HIDDEN MAIL
//	Mail destination and 'mailto:' keyword are smoothly
//	obfuscated to prevent robot collection.
//  ---------------------------------------------------
class WssMailTo extends WsText {
  	var $destination;
  	var $subject;

  	function __wakeup() {
  		global $ws_subscription;
  		parent::__wakeup();
  		if (empty($this->destination))
            $this->destination = $ws_subscription['contact_mail'];  // Default Webmaster address
  	}

	function Display($prefix="", $suffix="") {
	    parent::Display($prefix.'<div data-destination="'.stringEncode($this->destination).'" data-subject="'.htmlspecialchars($this->subject).'" ', '/div>'.$suffix);
	}

	function DisplayContent() {
	  	global $ws_generic_title;
	  	$subject = empty($this->subject) ? $ws_generic_title : $this->subject;
	  	// We use onmousemove event because onmouseover is used by parent in update mode
	  	// href="javascript:void(0)" instead of href="#" because it's safier, especially 
		// when using some script who search for anchors with href="#"...
		if (!($this->properties & WS_IN_BLOCK_LINK)){
	   		echo '<a href="javascript:void(0)" onmousemove="Disp(this.parentNode.getAttribute(\'data-destination\'), this); this.href+=\'?Subject=\' + this.parentNode.getAttribute(\'data-subject\').replace(String.fromCharCode(34), \'%22\');">';
			parent::DisplayContent();
			echo '</a>';
		} else {
			parent::DisplayContent();
		}
	}
}

//  CONTACT FORM
//  ---------------------------------------
class WssForm extends WsContainer {
  	var $destination;
    var $return_url;
  	var $preamble = 'Thank you for sending the following message';
  	var $postamble = 'Best regards<br>';
  	var $ccPrompt;

	function WssForm($user_style=0, $properties = 0, $contents = 0){
        if (!$contents)
            $contents = array(
						new WssInputField ('Email', 'email', false),
						new WssInputField ('Subject', 'text', false),
						new WssInputField ('Message', 'text', true, 6),
						new WssInputField ('Submit', 'submit')); 
        parent::WsContainer(0, 0, $contents);
        $this->properties |= WS_DONT_UNCAP;
	}

    function __wakeup() {
  		global $ws_subscription, $ws_user_lang;
  		parent::__wakeup();
  		if (empty($this->destination))
            $this->destination = $ws_subscription['contact_mail'];  // Default Webmaster address
        if (!isset($this->ccPrompt))
        	$this->ccPrompt = $ws_user_lang == 'fr' ?
        		"Recevoir une copie du message à l'adresse qui suit, ou fermer la fenêtre":
        		"Send a copy of your message to the following address, or close the window";
   	}

	function Display($html_prefix = '', $html_suffix = '') {
		global $ws_permissions;

        $prefix = '<form ';
        $prefix .= ' method="post" enctype="multipart/form-data" onsubmit="';
        if (!empty($this->ccPrompt)) {
	        $prefix .= "this.askForCopy = function(){
	        	var parentForm = this;
				var ccForm = document.createElement('form');
				var inputs = this.getElementsByTagName['input'];
				var ccMail = '';
	            for (i in inputs)
	            	if (inputs[i].getAttribute('data-type') == 'email'){
						ccMail = inputs[i].value;
						break;
					}
				ccForm.onsubmit= function(){
						this.onsubmit = function(){return false};
						parentForm.ws_ccEmail.value = this.ws_mailto.value;
						parentForm.submit();
						return false;
	                };
	            ccForm.innerHTML =
					'".str_replace(array('"', "'"), array('&amp;quot;', '&amp;apos;'), (str_replace(array("\n", "\t", "\r", "\l"), '', $this->ccPrompt)))."'
	                + '<br><br><input type=\'email\' multiple=\'multiple\' name=\'ws_mailto\' size=\'25\' value=\'' + ccMail + '\' onfocus=\'this.value=null\'>'
	                + '<input type=\'submit\' value=\'OK\'>';
	            var div = document.createElement('div');
	            div.style.padding = '1em 2em 2.5em 3em';
	            div.appendChild(ccForm);
				ws_popupElement(div, 'max-width: 50em; width: 90%', -1, function(){parentForm.submit()});
				};";
	    }
        $prefix .="
				if (this.ws_freezeSubmit) return false; // This is to avoid multiple submissions
                var labels = this.getElementsByTagName('label');
                var erfound = false;
                var checkCaptcha = [];
				for (i = 0; labels[i]; i++) {
			        labels[i].style.color = '';
                    var id = labels[i].getAttribute('for') || labels[i].htmlFor;  // IE7 Compatibility
			        var inputElement = document.getElementById(id);
                    var type = inputElement.getAttribute('data-type');
                    // Very light check for old browsers and captcha
                    var erfield;
                    if (inputElement.value.length == 0) {
                        erfield = inputElement.getAttribute('data-required');
                    } else {
                        // Multiple mail addresses
                        erfield = (type == 'email' && !inputElement.value.match(/^[^@]+@[^@]+(\s*,\s*[^@]+@[^@]+)*$/));
                        if (!erfield)
                            erfield = (type == 'number' && inputElement.value.match(/[^0-9]/));
                        if (!erfield)
                            erfield = (type == 'url' && !inputElement.value.match(/^.+:\/\/[^.]+\./));
                        if (!erfield && type == 'captcha')  // As captcha control is asynchronous, we delay it to the end
							checkCaptcha.push({id: inputElement.name, label: labels[i], value: inputElement.value, name: inputElement.name});
                    }
                    if (erfield) {
				        labels[i].style.color = 'red';
        		    	alert('*!! ' + labels[i].innerHTML + ' !!*');   // Can't be lingued, we don't know the language
                        erfound = true;
                    }
				}
				if (erfound){
					return false;
				} else if (checkCaptcha.length){
					var form = this;
					for (i = 0; i < checkCaptcha.length; i++){
						ws_request('ws_service.html?WS_CMD=check_captcha&WS_CAPTCHA_ID=' + checkCaptcha[i].id + '&WS_CAPTCHA_NUM=' + i + '&WS_CAPTCHA=' + checkCaptcha[i].value,
								function(response){
			                        if ((ok = response.indexOf('-OK')) != -1){
										n = response.slice(0, ok);
                                        checkCaptcha[n].checked = true;
                                        for (i = 0; i < checkCaptcha.length; i++){
											if (!checkCaptcha[i].checked)
												return;
										}
										if (form.askForCopy)
											form.askForCopy();
			                            else
											form.submit();
			                        } else {
										form.ws_freezeSubmit = 0;
					        			checkCaptcha[response].label.style.color = 'red';
										alert('*!! ' + checkCaptcha[response].label.innerHTML + ' !!*');   // Can't be lingued, we don't know the language
		                        }
							});
						form.ws_freezeSubmit = 1;
					}
					return false;
				}
				// Everything is ok, we ask the visitor if he wants a copy
				this.ws_freezeSubmit = 1;
				if (this.askForCopy){
					this.askForCopy();
					return false;
				}
                ";
	    $prefix .= '"';
        if ($ws_permissions & P_EDIT){
            $prefix .= ' data-destination="'.$this->destination.'"';
            $prefix .= ' data-return_url="'.$this->return_url.'"';
            $prefix .= ' data-preamble="'.htmlspecialchars($this->preamble).'"';
            $prefix .= ' data-postamble="'.htmlspecialchars($this->postamble).'"';
            $prefix .= ' data-ccPrompt="'.htmlspecialchars($this->ccPrompt).'"';
        }
        parent::Display($prefix, '/form>');
    }

    function DisplayContent() {
        global $ws_current_tlc, $ws_user_lang;

        // Default submit button to enable submit by typing "enter" in a simple text input
        // if no explicit submit button is present... If it does not exists, return does nothing
		// at the moment, for some well-known browser (2017)
	  	echo '
			<input type="hidden" name="ws_user_action_page" value="'.@$ws_current_tlc->url_id.'">
			<input type="hidden" name="ws_user_action_object" value="'.$this->GetLocation().'">
			<input type="hidden" name="ws_user_lang" value="'.$ws_user_lang.'">
            <input type="hidden" name="ws_return_url" value="'.(@$this->return_url ? $this->return_url : $_SERVER['REQUEST_URI']).'">
			<input type="hidden" name="ws_message_id" value="'.time().'">
			<input type="hidden" name="ws_ccEmail" value="">
			<input type="submit" style="position: absolute; top: -5000px;">
			';
        parent::DisplayContent();
    }

    //  Action is triggered by ws_inits.php at beginning of request analysis.
    //  It checks the inputs and send the message by mail or post the values
	//  to the destination, which is supposed to be an url if it is not
	//	a correct mail address.
	//  It then sends a copy if there's a request address.
    //  ---------------------------------------------------------------------
    function Action() {
        global $ws_insecure, $ws_user_lang, $ws_subscription;

		// Do not resend same message (in case of reload, bad guy, etc...)
		$sentmessages = @unserialize(@file_get_contents("logs/sentmessages"));

        if (!empty($this->destination)
				&& $_POST['ws_message_id'] > time()-24*3600 && $_POST['ws_message_id'] < time()
				&& !isset($sentmessages[$_POST['ws_message_id']])
				&& !$ws_insecure) {
	  	    $mailText = '';
            $contents = $this->GetAllContents();
            foreach ($contents as $field){
                if (get_class_lower($field) != 'wssinputfield')
                    continue;
				if (empty($field->htmlName))
					$htmlName = ($field->type == 'submit' ? 'ws_' : '').'ws_field_'.str_replace('.', '_', $field->GetLocation());
				else
					$htmlName = $field->htmlName;
                $value = @$_POST[$htmlName] ? $_POST[$htmlName] : @$_FILES[$htmlName]['name'];
				if ($field->type == "checkbox")
					if ($ws_user_lang == 'fr')
						$value = $value == 'off' ? $value = 'non' : $value = 'oui';
					else 
						$value = $value == 'off' ? $value = 'no' : $value = 'yes'; 
                // Filter some obvious spam
    			if (self::is_spam($value) || ($field->required && empty($value))) {
    				$spam = 1;
    				break;
    			}
				if ($field->type == "email")
					$mailReplyTo = htmlspecialchars($value);	// Protection against XSS failure
                if ($field->type == "captcha"){
					session_start();
					if($value != $_SESSION['captcha'][$htmlName]){
					var_dump($value); exit();
	    				$spam = 1;
	    				break;
					}
                    continue;
				}
                if ($field->type == "submit")
                    continue;
				if (empty($mailSubject) && ($field->type == "text" || $field->type == "select" || $field->type == "number"))
					$mailSubject = strlen($value) > 30 ? substr($value, 0, 30).'...' : $value;
            	$mailText .= '<b>&gt; '.(empty($field->htmlName) ? $field->value : $field->htmlName).'</b><br>'.nl2br(htmlspecialchars($value)).'<br><br>';
            }

			if (!@$spam) {
				$sentmessages[$_POST['ws_message_id']] = true;
				fwrite(fopen("logs/sentmessages", "w"), serialize($sentmessages));
				$mailSubject = (@$mailSubject ? $mailSubject.' - ' : '').$_SERVER['SERVER_NAME']
								.preg_replace("/\?.*$/", '', $_SERVER['REQUEST_URI']);
				foreach($_FILES as $file){
					if (!empty($file['tmp_name']) && $file['error'] == 0)					
						$files[] = array('path' => $file['tmp_name'], 'name' => $file['name']);					
				}
				if (preg_match("/^[^@]+@[^@]+(\s*,\s*[^@]+@[^@]+)*$/", $this->destination)){
					// send by mail
					ws_mail($this->destination,
						@$ws_subscription['contact_mail'],
						@$mailReplyTo,
						$mailSubject,
						"<html><head></head><body>".$mailText."\n</body></html>",
						@$files);
				} else {
					// goto destination with POST data
				    echo '<form id="ws_destination_form" method="POST" action="'.$this->destination.'">';
				    foreach ($_POST as $name => $value)
				        echo '<input type="hidden" name="'.$name.'" value="'.$value.'">';
				    echo '</form><script>document.getElementById("ws_destination_form").submit()</script>';
				}

				$ccMail = $_POST['ws_ccEmail'];
				if (!empty($ccMail))
					ws_mail($ccMail,
							$this->destination,
							'',
							$_SERVER['SERVER_NAME'],
							"<html><head></head><body>".$this->preamble.'<br>'.$mailText.$this->postamble."\n</body></html>");
    		} else {
				trigger_error('SPAM: text suspicion ');
			}
        } else {
			trigger_error('SPAM: invalid form submission');
		}
		if (!empty($this->return_url)) {
    		header("Location: ".$this->return_url);
			exit;
		} 
	}
	
	static private function is_spam($text) {
        // Heuristic 1: <a href="http://bad"> ... [url=http://bad]
        if (preg_match_all("/<\s*a\s+href\s*=\s*[\"']([^\"'\s>]*)/i", $text, $matches)) {
            foreach ((array) $matches[1] as $url)
                if (preg_match("|\[\s*url\s*=\s*[\"']?".$url."|i", $text, $matches))
                    return true;
        }
        return false;
    }
}

class WssInputField extends WsText {   // Can be out of a form, so it's not named FormField..
    var $type;
    var $required;
    var $params;
    var $htmlName;
    
    function WssInputField($caption = '', $type = 'text', $required = false, $params = 0, $htmlName = '') {
        parent::WsText($caption);
        $this->type = $type;
        $this->required = $required;
        $this->params = $params;
        $this->htmlName = $htmlName;
	}
    
    function Display($html_prefix = '', $html_suffix = ''){
        global $ws_permissions;

        $prefix = '<div';
        if ($ws_permissions & P_EDIT){
            $prefix .= ' data-params="'.htmlspecialchars($this->params).'"';
            $prefix .= ' data-htmlName="'.$this->htmlName.'"';
        }
        parent::Display($prefix);
    }

    function DisplayContent(){
        global $ws_insecure, $ws_permissions;

		if ($this->type == 'captcha') $this->required = true;
        echo '<div class="wsslabel">';  // For submit the label is the value
        echo '<label for="'.$this->id.'_field"'.($this->type == 'submit' ? ' style="display: none"' : '').'>';
        parent::DisplayContent();
        echo '</label><span id="'.$this->id.'_required"'.($this->type == 'submit' ? ' style="display: none"' : '').'>'.($this->required ? '&nbsp;(*)' : '').'</span>';
        echo '</div>';

        // I'd like to make a name deducted from the label, but some chars are indesirable (translated by PHP for example)
		if (empty($this->htmlName))
			$htmlName = ($this->type == 'submit' ? 'ws_' : '').'ws_field_'.str_replace('.', '_', $this->GetLocation());
		else
			$htmlName = $this->htmlName;
        if ($ws_permissions & P_EDIT)
            echo '<div>';

        // data-type attribute is used at submit time for compatibility with 'old' browsers which don't save type attribute
        // data-required attribute is used at submit time for compatibility with VERY 'old' browsers which don't save required attribute
        $common = ($this->required ? ' required="required" data-required="1"' : '')
            .' data-type="'.$this->type.'" class="wssinput"'
            .($ws_insecure ? ' disabled>' :	' name="'.$htmlName.'" id="'.$this->id.'_field">');
        switch ($this->type){
            case 'email':
                echo '<input type="email" multiple="multiple"'.$common;
                break;
            case 'text':
    			if ($this->params <= 1)
    				echo '<input type="text"'.$common;
    			else
    				echo '<textarea rows="'.$this->params.'"'.$common.'</textarea>';
                break;
            case 'url':
                echo '<input type="url"'.$common;
                break;
            case 'number':
                echo '<input type="number"'.$common;
                break;
            case 'password':
                echo '<input type="password"'.$common;
                break;
            case 'checkbox':
				// The following line forces a value if the real checkbox is not changed
				// (http://iamcam.wordpress.com/2008/01/15/unchecked-checkbox-values/)
                echo '<input type="hidden" value="off" name="'.$htmlName.'">';  // This is to force a value if not checked (http://iamcam.wordpress.com/2008/01/15/unchecked-checkbox-values/)
                echo '<input type="checkbox" style="width: auto"'.$common;
                break;
            case 'select':
                $options = explode("\r\n", $this->params);
                echo '<select'.$common;
                // The space text with an empty value is necessary for W3C checker !!
                // If the select is "required" the first option must be empty for W3C checker !!
                if ($this->required && !empty($options[0]))
                    echo '<option value="" label=" "> </option>';
                foreach ($options as $opt) {
                    $opt = htmlspecialchars($opt);
                    echo '<option value="'.$opt.'"> '.$opt.'</option>';
                }
                echo '</select>';
                break;
            case 'file':
                echo '<input type="file"'.$common;
                break;
            case 'captcha':
				$captcha_url = WS_CORE_PATH.'ws_captcha.php?id='.$htmlName;
            	echo '<img class="captchaImg" src="'.$captcha_url.'" onclick="parentNode.getElementsByTagName(\'img\')[0].src = \''.$captcha_url.'&\' + Math.random() "alt="captcha">
					<button type="button" class="captchaRefresh" onclick="parentNode.getElementsByTagName(\'img\')[0].src = \''.$captcha_url.'&\' + Math.random()">
					<img src="'. WS_CORE_PATH .'ws_images/ws_refresh.png" alt="refresh"></button><br>';
            	echo '<input type="text"'.$common;
                break;
            case 'submit':
				echo '<button type="submit"'.$common.ws_bsn2br_special($this->value).'</button>';
                break;
        }
        if ($ws_permissions & P_EDIT)
            echo '</div>';
    }
}

//	RSS READER (from simplepie.org)
//	-------------------------------
class WssRSSReader extends WsComponent {
  	public $max_items = 20;
    public $display_date = true;
    public $display_content = true;
	public $display_channel = true;

	public function Display($prefix="", $suffix="") {
		global $ws_permissions;

        if ($ws_permissions & P_EDIT)
    		parent::Display(
                $prefix.'<article data-value="'.($this->value ? $this->value : '').'"'
                .($this->display_date ? ' data-display_date="true"' : '')
                .($this->display_content ? ' data-display_content="true"' : '')
                .($this->display_channel ? ' data-display_channel="true"' : '')
                .' data-max_items="'.$this->max_items.'"', "/article>".$suffix);
        else
    		parent::Display($prefix.'<article', '/article>'.$suffix);
	}

	public function DisplayContent() {
		require_once(WS_LIB_PATH.'third_party_includes/ws_simplepie.inc');
	  	if (!empty($this->value) && ($feed = new SimplePie())){
            $feed->set_feed_url($this->value);
            $feed->set_cache_duration(0);
            $feed->strip_comments(true);
            $feed->set_timeout(30);
			if (!$feed->init()) {
				global $ws_mode;
				if ($ws_mode & WS_EDIT)
					echo $feed->error;
			}
			if ($this->display_channel) {
	            echo '<header>';
	            if ($feed->get_image_url())
	                echo '<img class="feedImage" alt="'.$feed->get_title().'" src="'.$feed->get_image_url().'">';
				if (!($this->properties & WS_IN_BLOCK_LINK)){
					$prefix = '<a href="'.$feed->get_permalink().'" target="_blank">';
					$suffix = '</a>';
				}
				echo '<div class="feedTitle">'.@$prefix.ucfirst($feed->get_title()).@$suffix.'</div>';
	        	if ($feed->get_description())
	            	echo $feed->get_description().'<br>'.$feed->get_copyright();
	            echo '</header>';
			}
            foreach ($feed->get_items(0, $this->max_items) as $item) {
                echo '<article><header>';
				if (!($this->properties & WS_IN_BLOCK_LINK)){
					$prefix = '<a class="itemTitle" href="'.$item->get_permalink().'" target="_blank">';
					$suffix = '</a>';
				}
                echo @$prefix.$item->get_title().@$suffix;
                if ($this->display_date)
                    echo $item->get_date('j F Y | G:i');
                echo '</header>';
                if ($this->display_content)
                    echo '<div class="itemContent">'.$item->get_content().'</div>';
                echo '</article>';
            }
		} else {
		  	echo '<br>&nbsp;';
        }
	}
}
//	USER SELECTION
//	--------------
class WsShowSelection extends WsComponent {
	function DisplayContent() {
		global $ws_user_lang, $ws_permissions;

		if (!empty($_COOKIE['wsc_selected'])) {
			if ($permissions = $ws_permissions)		// No edition possible for this content
				$ws_permissions = S_DRAFT;			// Set mode preview if not simple visitor mode
			$pages = explode(',', $_COOKIE['wsc_selected']);
			foreach ($pages as $selected_id) {
				list($null, $tlc_id, $element_id) = explode('/', $selected_id);
				if ($tlc =& WsTopLevelContainer::Read($tlc_id, $ws_user_lang)) {
			  		if ($element =& $tlc->GetById($element_id)) {
			  			echo "\n<style>".$element->getEmbeddedCss()."\n</style>";
						$element->Display();
					}
				}
			}
			$ws_permissions = $permissions;
		} else {
		  echo '<br />&nbsp;';
		}
	}
}

//  OLD CLASSES must be defined here to be used in some case of restoration with older version
//	------------------------------------------------------------------------------------------
class WssContactForm extends WsComponent {
  	var $destination;
  	var $submit_caption = 'Submit';
  	var $preamble = 'Thank you for the following message<br>---------------------------';
  	var $postamble = '---------------------------<br>Best regards<br>';

	function WssContactForm(){
	    parent::WsComponent(0, array(
						new WssField ('Email',1 , false),
						new WssField ('Subject',1 , false),
						new WssField ('Message',6 , true)));
	}

  	function __wakeup() {
  		global $ws_subscription;
  		parent::__wakeup();
  		if (empty($this->destination))
            $this->destination = $ws_subscription['contact_mail'];  // Default Webmaster address
   	}
}
class WssField {
    var $caption;
    var $lines;
    var $notempty;
    
    function WssField($caption, $lines, $notempty) {
        $this->caption = $caption;
        $this->lines = $lines;
        $this->notempty = $notempty;
	}
}
?>
