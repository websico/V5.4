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
 *  CORE CLASSES
 *  ---------------------------------------
 */

//      ---------
//      SOME DEFS
//      ---------

define('MAX_PAGE_LENGTH', 1000000);		// Stay human please

//  Element properties
define ("WS_HORIZONTAL_CONTAINER", 1);
define ("WS_VERTICAL_CONTAINER", 1<<1);
define ("WS_CONTAINER_ORIENTATION", WS_HORIZONTAL_CONTAINER | WS_VERTICAL_CONTAINER);
define ("WS_USER_SELECTABLE_CONTAINER", 1<<2);
define ("WS_PAGE_CONTAINER", 1<<3);
define ("WS_SYSTEM_CONTAINER", 1<<4);
define ("WS_CLIPBOARD", 1<<5);
define ("WS_MODEL_CONTAINER", 1<<6);
define ("WS_FREE_CONTENTS_IN_MODEL", 1<<7);
define ("WS_DRAFT", 1<<8);
define ("WS_PUBLISHED", 1<<9);          // Internal use, not saved in db
define ("WS_TEXT", 1<<10);
define ("WS_TEXTAREA", 1<<11);
define ("WS_IMAGE", 1<<12);
define ("WS_CONTAINER", 1<<13);
define ("WS_RAWTEXT", 1<<14);
define ("WS_VALIGN_T", 1<<15);          // For stretchy containers
define ("WS_VALIGN_M", 1<<16);
define ("WS_VALIGN_B", 1<<17);
define ("WS_VALIGN", WS_VALIGN_T | WS_VALIGN_M | WS_VALIGN_B);
define ("WS_ALONE", 1<<18);
define ("WS_DROPDOWN", 1<<19);
define ("WS_DONT_UNCAP", 1<<20);
define ("WS_IN_BLOCK_LINK", 1<<21);
define ("WS_TRIAL_PAGE", 1<<22);		// Trial mode temporary page
define ("WS_BUBBLE", 1<<23);			// Vertically mobile element (smart scrolling)

define ("WS_NOT_A_COMPONENT", ~(WS_TEXT | WS_TEXTAREA | WS_IMAGE | WS_RAWTEXT));

//  Misc
define ("WS_TOP_CATEGORY", '');
define ("WS_UNDEFINED", -1);
define ("WS_PAGE_BOUNDARY_SELECTOR", ".WS_PAGE_END ");
define ("WS_PAGE_BOUNDARY", WS_PAGE_BOUNDARY_SELECTOR."{}");   // css actual page separator

define ("WS_CONTAINER_ID_PREFIX", 'Z');    // JUST ONE CHAR, please !o|
define ("WS_COMPONENT_ID_PREFIX", 'Y');
define ("WS_NAME_IN_MODEL_PREFIX", 'M');
define ("WS_PAGE_ID_PREFIX", 'p');

//		---------------
//		SOME GLOBALS !!
//		---------------
$ws_must_purge_data = false;
$ws_container_list = array();
$ws_setup_components = '';
$ws_sitemap = 0;
$ws_css_string = '';
$ws_css_draft_string = '';

/**
 * To output a string with html conversion for special characters
 * and special newline '\' followed by 'n' ('\n' and not "\n").
 * This allows a user to ouput a simple text input on a multiline, by
 * introducing \n sequences for a "newline" emulation.
 */
function ws_bsn2br_special($str) {		// For normal output
	return str_replace('\n', '<br>', htmlspecialchars($str));
}
function ws_bsn2nl_special($str) {		// For submit input type
	return str_replace('\n', '&#010;', htmlspecialchars($str));
}
/**
 * Class name compatibility, which was lowercase before php5
 */
function get_class_lower($obj){
    return strtolower(get_class($obj));
}
/**
 * Returns true if $string is valid UTF-8 and false otherwise.
 *
 * @since        1.14
 * @param [mixed] $string     string to be tested
 * @subpackage
 */
function is_utf8($string) {
    // From http://w3.org/International/questions/qa-forms-utf-8.html
    return preg_match('%^(?:
          [\x09\x0A\x0D\x20-\x7E]            # ASCII
        | [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
        |  \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
        | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte
        |  \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
        |  \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
        | [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
        |  \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
    )*$%xs', $string);
}

//  -------------------------------------------
//  A COMMON PARENT FOR CONTAINER AND COMPONENT
//  -------------------------------------------
class WsElement {
  	var $id;						// Unique ident
	static $id_index = 0;			// To be more unique (uniqid is not enough unique with Windows)
	var $properties = 0;
//	var $name_in_model;				// Element is named when included in a model
	var $owner = 0;					// Reference to owner container
	var $index;						// Index in element list of owner
	var $user_style;				// User defined style
	var $more_classes;				// Additional css classNames
	var $embedded_css_rules;		// Style rules for this id selector

//	Compatibility, default methods
//	------------------------------
	function __sleep(){$this->properties &= ~WS_IN_BLOCK_LINK; return array_keys(get_object_vars($this));}	// Ephemere flag
	function CandidateToPurge(){return false;}
	function FixTree(){}
	function GetEmbeddedCss(){return $this->embedded_css_rules;}
	function RemoveFromOwner(){$this->owner->RemoveContent($this->index);}
	function __wakeup(){;}

//  Get variable contents from target and put them in my contents
//  if I'm a free contents in model.
//  -------------------------------------------------------------
    function ApplyVariableContents($from) {
        if ($this->properties & WS_FREE_CONTENTS_IN_MODEL) {
            if ($source = $from->GetByNim($this->name_in_model)) {
                $contents = $source->GetContents();
                foreach ($contents as $var => $content)
                    $this->$var = $content;
            }
            return true;
        }
        return false;
    }

//	Build link with appropriate target,
//  external links are opened in a new window.
//	------------------------------------------
	function BuildHref() {
		return $this->href.(preg_match('@^http.?://@', $this->href) ? '" target="_blank' : '');
	}

//	Destroy embedded css rules
//	--------------------------
	function ClearEmbeddedCss() {
		for ($n=count(@$this->contents); $n;)
			$this->contents[--$n]->ClearEmbeddedCss();
		unset($this->embedded_css_rules);
	}

//	Make a copy
//	-----------
	function &CloneElement() {						// php4/5 compatible
		$clone = unserialize(serialize($this));		// Make a real full duplication
		$clone->RenewInstance();
		unset ($clone->name_in_model);
		return $clone;
	}

//	Compute a new unique id
//	-----------------------
	function NewId($prefix){
		return uniqid($prefix.self::$id_index++);
	}

//	Copy to clipboard
//  Unique client clipboard id is saved
//  in a cookie to allow concurrent actions
//	---------------------------------------
	function CopyToClipboard(){
		$clipboard_id = empty($_COOKIE['ws_clipboard']) ?
									uniqid('Clipboard_') : $_COOKIE['ws_clipboard'];
		// Save clipboard id in a cookie, for 23 hours (clipboards are deleted after 24 hours)
		// it must be accessible for all languages from xxx/en/ or xxx/
		$domain = $_SERVER['SERVER_NAME'] == '127.0.0.1' ? '' : $_SERVER['SERVER_NAME'];
		setcookie('ws_clipboard', $clipboard_id, time() + 23*60*60, '/', $domain);
		$clipboard = new WsTopLevelContainer($clipboard_id, WS_CLIPBOARD);
		$clipboard->SetValue('name', '_Clipboard');
		$clipboard->InsertContent($this);
		return $clipboard->Save();
	}

//  Get reference to element identified by it's name in model
//  ---------------------------------------------------------
    function &GetByNim($name) {
        return $this->GetById($name);
	}

//	Get reference to identified element
//  by it's id or name in model
//	-----------------------------------
	function &GetById($id) {
	  	if ($id == $this->id || ($id[0] == WS_NAME_IN_MODEL_PREFIX && $id == @$this->name_in_model))
	  		return $this;
		for ($n=count(@$this->contents); $n;)
			if ($elt =& $this->contents[--$n]->GetById($id))
				return $elt;
        $elt = 0;
        return $elt;    // return a REFERENCE to 0 (had some issues about that)
	}

//	Get name of background image files extracted from embedded css
//	and return them as keys of an array
//	Execute a user function for each file
//	--------------------------------------------------------------
	function GetDataFiles($user_func = 0){
		$files = array();
		preg_match_all("<background-image.*url\(\"?(\./)*([^\")]+)>", $this->embedded_css_rules, $result);
		foreach ($result[2] as $path){
			$new_path = $path;		
						
			// If user_func returns a different path change it, 
			// the caller is supposed to have yet moved the file
			if ($user_func && ($new_path = $user_func($path)) != $path){
				$this->embedded_css_rules = str_replace($path, $new_path, $this->embedded_css_rules);			
			}				
			$files[$new_path] = 1;
		}
		return $files;
	}

//	Get element location (cf GetByLocation())
//	-----------------------------------------
    function GetLocation() {
        $elt = $this;
    	$location = '';
    	while ($elt->owner) {
    		$location = $elt->index.'.'.$location;
    		$elt = $elt->owner;
    	}
    	return $location;
    }

//  Return model container
//	----------------------
	function &GetModel() {
		if (!empty($this->model_id)) {
			return $this;
		} else if ($this->owner && !($this->owner->properties & WS_FREE_CONTENTS_IN_MODEL)) {
	        return $this->owner->GetModel();
		} else {
            $false = false; // This is for return by reference
			return $false;
		}
	}

//	Get owner TLC
//	-------------
	function &GetTlc() {
		return $this->owner->GetTlc();
	}

//	Test if an element is in contents of another
//	--------------------------------------------
	function IsContentOf($container) {
		if (!@$container->properties & WS_CONTAINER || !$this->owner)
			return false;
		if ($this->owner->id == $container->id)
			return true;
		return $this->owner->IsContentOf($container);
	}

//  Build title attribute in edit mode
//  ----------------------------------
	function MakeTitle() {
		global $ws_class_list, $ws_free_content_title, $ws_in_model_text;
	
		$title = @$ws_class_list[get_class_lower($this)];
	    $title .= empty($this->user_style) ? '' : " - Style: ".$this->user_style;
		if ($model =& $this->GetModel()) {
			$title .= ' (';
	        if ($this->properties & WS_FREE_CONTENTS_IN_MODEL)
	           $title .= $ws_free_content_title;
	        $title .= $ws_in_model_text.$model->model_id.')';
	    }
	    return $title;
	}

//  Transform an element to be model saveable.
//  ------------------------------------------
    function Modelize($model_id) {
		if (!@$this->name_in_model) {
			// It's id will be renewed at each ApplyModel(), so we keep a name
			// to retrieve it later.
			$this->name_in_model = WS_NAME_IN_MODEL_PREFIX.$this->id;
		}
	}

//	Move an element to another place (eg drag'n drop, but not only)
//	---------------------------------------------------------------
	function MoveTo(&$destination, $direction) {
	  	// Recursion is forbidden (a model cannot contain itself, so is for a banal container...)
	  	if ($this->ModelRecursion($destination) || $destination->IsContentOf($this)) {
            global $ws_model_recursion;
			WsUtils::WsPopup($ws_model_recursion);
            return;
		}
        // Nesting forms is forbidden (should not be here because wssform is not a core class but it's easier)
        if ($this->Contains("wssform") && $destination->ContainedIn("wssform")) {
            global $ws_form_nesting;
			WsUtils::WsPopup($ws_form_nesting);
            return;
        }
		// Move near itself is no operation
		if ($destination->id == $this->id)
			return;
		// Preamble
		$subindex = ($direction == "E" || $direction == "S") ? 1 : 0;
		if ($destination->owner){
			$new_owner =& $destination->owner;
			$index = $destination->index;
		} else {
			$new_owner =& $destination;
			$index = $subindex * 65534;			// To the end of tlc
		}
		if ($this->owner) {
		  	if ($this->owner->id == $destination->id && count($this->owner->contents) == 1) {
		  	  	switch ($direction) {
		  			case "N":
						$this->owner->valign = 'top';
						return;
					case "S":
						$this->owner->valign = 'bottom';
						return;
					case "M":
						$this->owner->valign = 'middle';
						return;
				}
		  	}
			$this->RemoveFromOwner();
			if ($new_owner->id == $this->owner->id && $this->index < $index)
				$index--;
		}
		// Compute new container need
		$new_props = WS_UNDEFINED;
		if (($direction == "N" || $direction == "S") && $new_owner->properties & WS_HORIZONTAL_CONTAINER)
			{$new_props = WS_VERTICAL_CONTAINER | WS_SYSTEM_CONTAINER;}
		else if (($direction == "E" || $direction == "W") && !($new_owner->properties & WS_HORIZONTAL_CONTAINER))
			$new_props = WS_HORIZONTAL_CONTAINER | WS_SYSTEM_CONTAINER;
		// No need for a new container
		if ($new_props == WS_UNDEFINED)
			$new_owner->InsertContent($this, $index + $subindex);
		// Need a new container
		else {
			$new_container = new WsContainer(0, $new_props);
		  	if ($destination->owner) {						// Common case
				// Replace destination by a new container
				$new_owner->RemoveContent($index);
				$new_owner->InsertContent($new_container, $index);
				// Put destination in the new container
				$new_container->InsertContent($destination);
				// Put this object in the new container
				$new_container->InsertContent($this, $subindex);

			} else {										// Page border case
				// New container takes page contents, with same orientation
				$new_container->contents = $new_owner->contents;
				$new_container->properties ^= WS_CONTAINER_ORIENTATION;
				// Page is filled in by new container (old page contents) and this object, reoriented
				$new_owner->contents = array($new_container);
				$new_owner->InsertContent($this, $subindex);
				$new_owner->properties ^= WS_CONTAINER_ORIENTATION;
			}
		}
	}
	function ModelRecursion($destination) {
	  	if (!empty($this->contents)) {
		  	foreach ($this->contents as $content)
		  		if ($content->ModelRecursion($destination))
		  			return true;
		  	if (!empty($this->model_id))
		  		for ($owner = $destination->owner; $owner; $owner = $owner->owner)
		  			if ($owner->model_id === $this->model_id)
		  			  	return true;
		}
		return false;
	}
	function Contains($className) {
        if (get_class_lower($this) == $className) {
            return true;
	  	} else if (!empty($this->contents)) {
		  	foreach ($this->contents as $content)
		  		if ($content->Contains($className))
		  			return true;
		}
		return false;
	}
	function ContainedIn($className) {
  		for ($owner = $this->owner; $owner; $owner = $owner->owner)
  			if (get_class_lower($owner) == $className)
  			  	return true;
		return false;
	}

//	Update an attribute
//	-------------------
	function SetValue($field_name, $value) {
		if ($field_name == "embedded_css_rules") {
	  		// Keep only .id rules and fix object id (in case of model)
	  		if (preg_match_all("/^\.id_[^{}]+{[^}]*}.*/m", $value, $rules))
                $this->embedded_css_rules = preg_replace("/\.id_[^\s{\[]+/m", ".id_".$this->id, implode("\n", $rules[0]));
            else
                $this->embedded_css_rules = '';
		} else {
			$this->{$field_name} = $value;
		}
	}
}

//  -------------------
//  TOP LEVEL CONTAINER
//  -------------------
//  Top level container is a persistent class, containing all lower
//  level objects; that ones are serialized and stored in the database
//  table of all top level containers.

class WsTopLevelContainer extends WsContainer {
    var $url_id;        // For pages only
	var $date;
	var $save_number;
	var $name;

//	Constructor
//	-----------
	function WsTopLevelContainer($id=0, $properties=0, $user_style='') {
		$this->id = empty($id) ? $this->NewId() : $id;
		$this->lang = '';
		$this->date = time();
		$this->owner = 0;
		$this->user_style = $user_style;
		$this->properties = $properties | WS_DRAFT | WS_CONTAINER;
		$this->name = "Neo";
		$this->index = 0;
		$this->contents = array();
	}

//  Change language in all pages
//  ----------------------------
    static function ChangeLang($to_lang, $from_lang) {

    	// Don't catch error, because if target language yet existes it's not an error...
    	$query = "UPDATE ".WsSite::TLC_DRAFT." SET `lang`='".$to_lang."' where `properties` & ".WS_PAGE_CONTAINER." and `lang` like '".$from_lang."'";
    	WsSite::execQuery($query);
    	$query = "UPDATE ".WsSite::TLC." SET `lang`='".$to_lang."' where `properties` & ".WS_PAGE_CONTAINER." and `lang` like '".$from_lang."'";
    	WsSite::execQuery($query);
    	$query = "UPDATE ".WsSite::MAP_DRAFT." SET `lang`='".$to_lang."' where `lang` like '".$from_lang."'";
    	WsSite::execQuery($query);
    	$query = "UPDATE ".WsSite::MAP." SET `lang`='".$to_lang."' where `lang` like '".$from_lang."'";
    	WsSite::execQuery($query);
    }

//  Get effective languages
//  -----------------------
    static function GetLangs(){
        $query = "SELECT DISTINCT lang FROM ";
        $retArray = array();

        foreach (array(WsSite::TLC, WsSite::TLC_DRAFT) as $table) {
            if ($res = WsSite::execQuery($query.$table, 1))
	            while ($row = $res->fetch())
	                if (!empty($row['lang']))
	                    $retArray[$row['lang']] = $row['lang'];
        }
        return $retArray;
    } 

//  Forgetor
//	--------
	function Forget(){
		global $ws_permissions;
		 
		if ($ws_permissions & P_ADMIN){
		    global $ws_must_purge_data;
	
		    $tbl_name = $this->properties & WS_DRAFT ? WsSite::TLC_DRAFT : WsSite::TLC;
		    $query = "DELETE from ".$tbl_name." where id='".$this->id."' and lang='".$this->lang."'";
	    	WsSite::execQuery($query, 2);
			unset($this);
			$ws_must_purge_data = true;
		} else {
            global $ws_notAllowed;
			WsUtils::WsPopup($ws_notAllowed);
		}
	}

//	Get reference to element with its location
//	Location is a string like "0.1.0.3", where each figure
//	is the index of the related element in its container.
//	0.1.0.3 refers to: element 3 in container 0 in container 1 in container 0
//  We have to use such an identification way instead of getById, because id is
//  not always stable, especially in models where they are renewed at __wakeup().
//	-----------------------------------------------------------------------------
	function &GetByLocation($location) {
		$elt =& $this;
		$index = strtok($location, '.');
		while ($index !== false) {
			$elt =& $elt->contents[$index];
			$index = strtok('.');
		}
		return $elt;
	}

//	Returns an array of distinct languages for this tlc id
//	------------------------------------------------------
	function GetLangList() {
	    global $ws_permissions;

		$langs = array();

		// Prepare hierarchy search in tables
   		$tables = array(WsSite::TLC);			// Public
		if ($ws_permissions & P_DRAFT)			// Overload by draft zone
			$tables[] = WsSite::TLC_DRAFT;

		// Build an array of all found langs for that tlc's url_id (draft overloads public)
        foreach($tables as $table) {
			$query = "SELECT DISTINCT lang from ".$table." WHERE `url_id`='".$this->url_id."'";
	    	if ($res = WsSite::execQuery($query, 2))
	            while ($row = $res->fetch())
					$langs[$row['lang']] = $row['lang'];
		}
		return $langs;
	}

//	Returns an array of distinct tlc's satisfying where_clause
//	----------------------------------------------------------
	static function GetTLCList($where_clause = "where 1", &$url_id = 0, &$status = 0) {
	    global $ws_permissions;

		$tlc = 0;

		// Prepare hierarchy search in tables
   		$tables = array(WsSite::TLC);			// Public
		if ($ws_permissions & P_DRAFT)			// Overload by draft zone
			$tables[] = WsSite::TLC_DRAFT;

		// Build an array of all more recent tlcs indexed by id (draft overloads public)
		$tlcs = array();
		$selectfrom = "SELECT id, url_id, name, properties from ";
        foreach($tables as $table) {
			$query = $selectfrom.$table.' '.$where_clause." ORDER BY `date`";
	    	$res = WsSite::execQuery($query, 3);
            while ($row = $res->fetch()) {
				$tlcs[$row['id']] = $row['name'];
				if ($url_id != 0)
                    @$url_id[$row['id']] = $row['url_id'];
				if ($status != 0)
                    @$status[$row['id']] |= $row['properties'] & WS_DRAFT ? WS_DRAFT : WS_PUBLISHED;
            }
		}
		return $tlcs;
	}

//	Get owner TLC
//	-------------
	function &GetTlc() {
		return $this;
	}

//	Return user style sheet rebuilt for the actual page
//	---------------------------------------------------
	function GetUserCss($css_id = "default") {
	  	global $ws_permissions;

        // Build all elements embedded rules
        $id_rules = '';
        foreach ($this->contents as $content)
            $id_rules .= trim($content->GetEmbeddedCss());
        $css = new WsUserCSS($css_id, $ws_permissions & P_TRIAL_PAGES && !($this->properties & WS_TRIAL_PAGE));

		if ($ws_permissions) {
            global $ws_css_string, $ws_css_draft_string, $ws_permissions;
            // In case of edition, we have to build full css embedded in the page
            // In case of preview it's really easier, because of draft issues
    		$ws_css_string = $css->GetPageRules()."\n".trim($this->embedded_css_rules)."\n".WS_PAGE_BOUNDARY."\n".$css->GetElementRules()."\n".$id_rules;
            $ws_css_draft_string = $css->GetDraftStyles();
            if ($ws_permissions & P_EDIT) {
                // In edition mode we write an empty style sheet that will be filled
                // by javascript stuff, taking the content of a div written by ws_body_start.php
                $ret = "\n".'<style id="ws_userStyle"></style>';
            } else {
                // In preview mode we just write the css
                $ret = "\n".'<style id="ws_userStyle">'."\n".$ws_css_string."\n</style>";
            }
        } else {
            $css_prefix = WS_CACHE_PATH.$css_id;
    		// Css file for pages
            $ret = "\n".'<link rel="StyleSheet" href="'.$css_prefix.'_page.css" type="text/css">';
    		// Insert actual page embedded rules
            if (!empty($this->embedded_css_rules))
                $ret .= "\n<style>\n".trim($this->embedded_css_rules)."\n</style>";
    		// Css file for elements
            $ret .= "\n".'<link rel="StyleSheet" href="'.$css_prefix.'_elements.css" type="text/css">';
            // Add sub-hierarchy embedded rules
            $ret .= "\n<style>\n".$id_rules."\n</style>";
        }
        return $ret;
	}

//	Compute a new id
//	----------------
	function NewId($dummy){
        do {    // Make a new id...
    		$query = "UPDATE ".WsSite::SYSTEM." SET `last_id`=`last_id`+1";
    		WsSite::execQuery($query, 3);
    		$row = WsSite::execQueryFetch("SELECT `last_id` FROM ".WsSite::SYSTEM, 3);
    		$newid = $row['last_id'];
    		// ...while it exists
        } while (WsSite::execQueryFetch('SELECT id FROM '.WsSite::TLC.' WHERE id=\''.WS_PAGE_ID_PREFIX.$newid.'\'')
                    || WsSite::execQueryFetch('SELECT id FROM '.WsSite::TLC_DRAFT.' WHERE id=\''.WS_PAGE_ID_PREFIX.$newid.'\''));
		return WS_PAGE_ID_PREFIX.$newid;
	}

//	Publish from draft zone to public zone
//	--------------------------------------
	function Publish($what = 'tlc'){
	    global $ws_permissions;
	    
	    if ($ws_permissions & P_ADMIN){
			global $ws_must_purge_data;
	
			// Publish tlc (save in public and destroy from draft table)
	        if ($what == 'tlc')
	            $tlc = $this;
	        else if (strpos($what, 'Model:') === 0)
	            $tlc = self::Read(substr($what, 6));
	        if (@$tlc && $tlc->properties & WS_DRAFT) {
	            if ($tlc->Save(true)){
	    	    	$tbl_name = WsSite::TLC_DRAFT;
	    		    $query = "DELETE from ".$tbl_name." where id='".$tlc->id."' and lang='".$tlc->lang."'";
	    	    	WsSite::execQuery($query, 2);
	            }
	        }
			$ws_must_purge_data = true;
		} else {
            global $ws_notAllowed;
			WsUtils::WsPopup($ws_notAllowed);
		}
	}

//	Get tlc from database with ident and lang
//	-----------------------------------------
	static function &Read($id=0, $lang='') {
	    global $ws_permissions, $ws_session;

		$tlc = 0;

		// Prepare hierarchy search in tables
		$tables = array(WsSite::TLC);
		if (!$id) {								// If no id, it's a reload from public, glp..
	    	$id = $this->id;
        } else if ($ws_permissions & P_DRAFT	// Otherwise we look for it in work or public zone
				&& (!($ws_permissions & P_TRIAL_PAGES)
					|| preg_match('/'.$ws_session->user.'$/', $id)
					|| preg_match('@Clipboard_[^/]+$@', $id))){
    		$tables = array(WsSite::TLC_DRAFT, WsSite::TLC);
	    }

	    // Loop select
	    $selectfrom = "SELECT `serialized_object`, `id`, `lang`, `url_id`, UNIX_TIMESTAMP(`date`) as `date`, `name`, `properties` from ";
        foreach($tables as $table) {
			$query = $selectfrom.$table." WHERE (`url_id` = '".$id."' OR (`id` = '".$id."' AND `url_id` IS NULL)) AND `lang` = '".$lang."'";
	    	if ($row = WsSite::execQueryFetch($query)) {
				$tlc = unserialize($row['serialized_object']);	// Restore the actual class !!!!
				$tlc->id = $row['id'];                          // Force redundancies consistency
				$tlc->lang = $row['lang'];
				$tlc->url_id = $row['url_id'];
				$tlc->date = $row['date'];
				$tlc->save_number = (int) @$tlc->save_number;
				$tlc->name = $row['name'];
				$tlc->properties = $row['properties'];
				$tlc->owner = 0;
				$tlc->FixTree();
				break;
			}
		}
		return $tlc;
	}

//  Save to database
//	----------------
	function Save($force_public = false) {
		global $ws_permissions, $ws_session;
 
	    if (($old =& $this->Read($this->id, $this->lang))
			&& (($this->properties & (WS_PAGE_CONTAINER | WS_MODEL_CONTAINER))
					!= ($old->properties & (WS_PAGE_CONTAINER | WS_MODEL_CONTAINER)))) {
    	  	global $ws_wrong_id;
	    	WsUtils::WsError($ws_wrong_id);
	    	return false;
		}

		$this->FixTree();		// Maybe not the most elegant place to do that, but most secure
		$this->date = time();
		$this->save_number = @$this->save_number + 1;
		if ($force_public) {
			$this->properties &= ~WS_DRAFT;
		    $tbl_name = WsSite::TLC;
		} else {
			$this->properties |= WS_DRAFT;
		    $tbl_name = WsSite::TLC_DRAFT;
		}
		// In TRIAL_PAGE mode, the page or model is derived from original read page, for each user
		if ($ws_permissions & P_TRIAL_PAGES && !($this->properties & WS_TRIAL_PAGE)	&& ($this->properties & WS_PAGE_CONTAINER)){
			$this->properties |= WS_TRIAL_PAGE;
			$this->RenewInstance($this->id.$ws_session->user);
			$this->url_id .= $ws_session->user;
		}

    	$values = " `id`='".$this->id."'";
    	$values .= ", `lang`= '".$this->lang."'";
    	if (!empty($this->url_id))
            $values .= ", `url_id`= '".$this->url_id."'";
		$values .= ", `name`=".WsSite::quoteString($this->name);
		$values .= ", `date`= FROM_UNIXTIME(".$this->date.")";
    	$values .= ", `properties`=".$this->properties;
    	$values .= ", `serialized_object`=".WsSite::quoteString(serialize($this));
    	if (strlen($values) > MAX_PAGE_LENGTH) {	// We must check before breaking database :-|
    	  	global $ws_page_too_large;
	    	WsUtils::WsError($ws_page_too_large);
	    	return false;
		}
//    	$query = "INSERT ".$tbl_name." SET".$values." ON DUPLICATE KEY UPDATE".$values;
    	$query = "REPLACE ".$tbl_name." SET".$values;
    	if (!WsSite::execQuery($query, 2)) {
	    	return false;
		}

		// Delete other pages with same url_id
	    $tbl_name = $force_public ? WsSite::TLC : WsSite::TLC_DRAFT;
    	return WsSite::execQuery("DELETE FROM ".$tbl_name
                                    ." WHERE `url_id`='".$this->url_id."'"
                                    ." AND `id` != '".$this->id."'"
                                    ." AND `lang` = '".$this->lang."'", 2);
	}
}

//  --------
//  USER CSS
//  --------
//  Keep in mind that css is splitted in 2 parts: first part is made of rules applying to pages,
//  second part is made of rules applying to other elements.
//  The reason why is a matter of precedence in the cascading process (cf ws_jstyle.js).

class WsUserCSS {
    private $css_id;
    private $public_css;
    private $draft_css;
    private $actual_css;

//  Constructor
//  -----------
    function WsUserCSS($css_id = 'default', $purge = false) {
	  	global $ws_permissions;

        $this->public_css = $this->Read($css_id);
        $this->actual_css = $this->public_css;

        // Overload public with draft styles
        if ($ws_permissions & P_DRAFT && ($this->draft_css = $this->Read($css_id, 'draft', $purge)) != '') {
            $public_css = explode(WS_PAGE_BOUNDARY, $this->public_css);
            $public_css[0] = $this->CssToArray($public_css[0]);
            $public_css[1] = $this->CssToArray(@$public_css[1]);
            $draft_css = explode(WS_PAGE_BOUNDARY, $this->draft_css);
            $draft_css[0] = $this->CssToArray($draft_css[0]);
            $draft_css[1] = $this->CssToArray(@$draft_css[1]);
            $this->actual_css = $this->ArrayToCss(array_merge($public_css[0], $draft_css[0]))
                                    ."\n".WS_PAGE_BOUNDARY."\n"
                                    .$this->ArrayToCss(array_merge($public_css[1], $draft_css[1]));
        }
        $this->css_id = $css_id;
    }

//  Get functions
//  -------------
    function GetRules() {
        return $this->actual_css;
    }

    function GetDraftStyles() {
        $styles = $this->CssToArray($this->draft_css);
        return implode(array_keys($styles));
    }

    function GetPublicCss() {
        return $this->CssToArray($this->public_css);
    }

    function GetPageRules() {
        $rules = explode(WS_PAGE_BOUNDARY, $this->actual_css);
        return trim($rules[0]);
    }

    function GetElementRules() {
        $rules = explode(WS_PAGE_BOUNDARY, $this->actual_css);
        return trim(@$rules[1]);
    }

//  Save user css to database
//	-------------------------
	function Save($csstext, $force_public = false) {
		$this->date = time();
		if ($force_public) {
            // In public area we save the full css,
            // without dummy properties useful only for draft
			// and without the @{} rule, useful only to empty @ rules.
            $csstext = str_ireplace('ws-dummy-property: dummy;', '', $csstext);
            $csstext = str_ireplace('@{}', '', $csstext);
		    $tbl_name = WsSite::USER_CSS;
		} else {
            // In draft area we save only difference between draft and public
            $css_draft = $this->CssToArray(trim(str_replace("\r", '', $csstext)));
            $css_public = $this->CssToArray($this->public_css);
            unset($css_public[WS_PAGE_BOUNDARY_SELECTOR]);
            $csstext = $this->ArrayToCss(array_diff_assoc($css_draft, $css_public));
		    $tbl_name = WsSite::USER_CSS_DRAFT;
		}

		// In TRIAL_PAGE mode, the stylesheet is derived from original read sheet, for each user
		global $ws_permissions, $ws_session;
		if ($ws_permissions & P_TRIAL_PAGES && !preg_match('/'.$ws_session->user.'$/', $this->css_id)){
			$this->css_id = 'ws_trial'.$ws_session->user;
		}
		
    	$values = " `id`='".$this->css_id."'";
    	$values .= ", `csstext`=".WsSite::quoteString(trim($csstext));
    	$query = "REPLACE ".$tbl_name." SET".$values;
    	return WsSite::execQuery($query, 2);
	}

	function Publish() {
		if ($this->Save($this->actual_css, true)) {
        	$query = "DELETE FROM ".WsSite::USER_CSS_DRAFT." WHERE `id`='".$this->css_id."'";
    		return WsSite::execQuery($query, 2);
		}
		return false;
    }

//  Convert CSS string to an associative array,
//  indexed by selectors without changing order.
//  And vice-versa.
//  --------------------------------------------
    private function CssToArray($string) {
        $matches = array();
        $parts = explode('@', $string, 2);      // The last part is reserved for @ rules, unmanaged
        if (preg_match_all("/(^\.[^{]+)({[^}]*})/m", $parts[0], $matches))
            $res = array_combine($matches[1], $matches[2]);
        else
            $res = array();
		if (@$parts[1])
			$res['Unmanaged'] = '@'.$parts[1];
        return $res;
    }
    private function ArrayToCss($array) {
        $cssText = '';
        array_walk($array,
			function($value, $key) use (&$cssText) {
				$cssText .= "\n".($key == 'Unmanaged' ? '' : $key).$value;
			});			
        return trim($cssText);
    }

//  Read css from database
//  ----------------------
	private function Read($css_id, $draft = 0, $purge = 0) {
        $css = '';
		$table = $draft ? WsSite::USER_CSS_DRAFT : WsSite::USER_CSS;

		// In TRIAL_PAGE mode, the stylesheet is derived from original read sheet, for each user
		global $ws_permissions, $ws_session;
		if ($draft && $ws_permissions & P_TRIAL_PAGES && !preg_match('/'.$ws_session->user.'$/', $css_id)){
			$css_id = 'ws_trial'.$ws_session->user;
		}
/*		if ($purge) {   ????????????????????????????????????????? if table locked read it doesn't work
useless operation ??????????
		    $query = "DELETE from ".WsSite::USER_CSS_DRAFT." WHERE `id`='".$css_id."'";
	    	WsSite::execQuery($query, 1);
		}?????????????????????????????????????????????????????*/

    	if ($css = WsSite::execQueryFetch("SELECT `csstext`, `date` FROM ".$table." WHERE `id`='".$css_id."'", 1)) {
            // Build cached css files
            if (!$draft) {
                $css_splitted = explode(WS_PAGE_BOUNDARY, $css['csstext']);
                $css_file = WS_CACHE_PATH.$css_id.'_page.css';
        		$last_update = strtotime($css['date']);
                if ($last_update > @filemtime($css_file))
                    file_put_contents($css_file, $css_splitted[0]);
                $css_file = WS_CACHE_PATH.$css_id.'_elements.css';
                if ($last_update > @filemtime($css_file))
                    file_put_contents($css_file, $css_splitted[1]);
            }
            $css = trim(str_replace("\r", '', $css['csstext']));
        }
		return $css;
    }
}


//  -------------------------------
//  FREE CONTENTS REGION (IN MODEL)
//  -------------------------------
class WsFreeContents extends WsContainer {  // Oldies
}

//  -----------------
//  CONTAINER
//  -----------------
//	Contents member is an array of references to objects (containers or components).
//	Arrays of references are fragile, we must take care to avoid object duplication
//	and reference break.

class WsContainer extends WsElement {
	var $valign;			// Vertical alignment of contents
	var $model_id = 0;		// Only if I am a model
//	var $href;				// Only if I am a link
	var $contents;			// An array of contained elements

//	Constructor
//	-----------
	function WsContainer($user_style=0, $properties = 0, $contents = 0) {
		$this->id = $this->NewId(WS_CONTAINER_ID_PREFIX);
	    $this->user_style = $user_style;
		$this->properties = $properties | WS_CONTAINER;
		$this->contents = array();
		if (is_array($contents))
			for ($i=0, $n=count($contents); $i<$n; $i++)	// Do not use foreach !
				$this->InsertContent($contents[$i]);
		else if ($contents)
			$this->InsertContent($contents);
	}
	function __wakeup() {
		parent::__wakeup();

        // Oldies
        $this->embedded_css_rules = str_replace('#'.$this->id, '.id_'.$this->id, $this->embedded_css_rules);
	  	$this->properties |= WS_CONTAINER;
	  	$this->properties &= WS_NOT_A_COMPONENT; // To fix an old bug
        if (!empty($this->user_selectable)) {
            $this->properties |= WS_USER_SELECTABLE_CONTAINER;
            unset($this->user_selectable);
        }
	  	// Not oldies
        if (!($this->properties & WS_DROPDOWN
                && count($this->contents > 1)
                && get_class_lower($this->contents[0]) == 'wsstitle'))
            $this->properties &= ~WS_DROPDOWN;  // Clean up dropdown flag
	  	$this->ApplyModel();					// Apply model because it may have changed since last save
		if (!empty($this->href)) {				// Disable nested links in link block
		  	$all_contents = $this->GetAllContents();
		  	array_shift($all_contents);			// Skip $this
		  	foreach($all_contents as $element)
		  		$element->properties |= WS_IN_BLOCK_LINK;
		}
	}

//	Apply a model to the actual container.
//	--------------------------------------
	function ApplyModel(){
		global $ws_permissions, $ws_missing_model;

		if (!empty($this->model_id)){
            $shell = WsTopLevelContainer::Read($this->model_id);
            if (!empty($shell->contents)) {
		  		$model =& $shell->contents[0];              // Model is first content of tlc
                $model->ApplyVariableContents($this);

                foreach ($this as $member => $value)        // Cleanup 
                    unset($this->$member);
                foreach ($model as $member => $value)       // Initialize with model data
                    $this->$member = $value;
            	$this->properties = $shell->properties;     // Get right flag values, as WS_DRAFT
                $this->model_id = $shell->id;               // Remember the model id
				$this->FixTree();
				$this->RenewInstance();                     // Get new id's
			} else if ($ws_permissions & P_DRAFT) {  // If no model available keep the public display as is
				$this->contents = array(new WsRawText('<div class="ws_error">'.$ws_missing_model.$this->model_id.'</div>'));
				$this->missing_model_id = $this->model_id;	// Used by model import (ws_service.php)
				$this->model_id = 0;
				$this->properties &= ~WS_MODEL_CONTAINER;
			}
		} else {
			$this->properties &= ~WS_MODEL_CONTAINER;
        }
	}

//  Copy contents if I'm a free contents container
//  recursion otherwise
//  ----------------------------------------------
    function ApplyVariableContents($from) {
        if (!parent::ApplyVariableContents($from))
            for ($n=count($this->contents); $n;)
                $this->contents[--$n]->ApplyVariableContents($from);
    }

//	Display whole container
//	-----------------------
	function Display($html_prefix="", $html_suffix="") {
		global $ws_container_list, $ws_setup_components, $ws_noFlexCols, $ws_permissions;

		// So the caller may set a default prefix and its own suffix
		if (empty($html_prefix))
			$html_prefix = empty($this->href) || $this->properties & WS_IN_BLOCK_LINK ? '<div' : '<a href="'.$this->BuildHref().'" data-subclass="block_link"';
		if (empty($html_suffix))
			$html_suffix = empty($this->href) || $this->properties & WS_IN_BLOCK_LINK ? '/div>' : '/a>';              		

		// Element local css props
        $class_name = empty($this->embedded_css_rules) ? '' : "id_".$this->id;

		// Level of horizontal imbrication for responsive mode
		if (!(@$ws_noFlexCols || @$this->GetTLC()->not_responsive)) {
	    	$this->hDepth = @$this->owner->hDepth;
	    	if ($this->properties & WS_HORIZONTAL_CONTAINER && !($this->properties & WS_PAGE_CONTAINER)) {
	    		$this->hDepth++;
	    		$class_name .= ' hDepth'.$this->hDepth;
			}
		}
		
		// className complements
        if (!($this->properties & WS_PAGE_CONTAINER)) {
			if ($this->properties & WS_CONTAINER_ORIENTATION) {
				$class_name .= " wssystemcontainer";	// An oriented system container
				$class_name .= $this->properties & WS_HORIZONTAL_CONTAINER ? ' H' : ' V';
			} else if (!($this->properties & WS_SYSTEM_CONTAINER)) {
				$class_name .= " wscontainer";			// A user container
			}
		}
		if (($actual_class = get_class_lower($this)) !== "wscontainer")
			$class_name .= ' '.$actual_class;
		if (!empty($this->user_style))
			$class_name .= ' '.$actual_class.'_'.$this->user_style;
		$class_name .= ' '.@$this->more_classes;
		
		// Other attributes
		if ($this->owner && count($this->owner->contents) == 1)
			$this->properties |= WS_ALONE;
		else
			$this->properties &= ~WS_ALONE;
		$ctnr_attr = !empty($this->valign) ? ' style="vertical-align: '.$this->valign.'"' : '';
		if ($ws_permissions & P_EDIT) {
			$ctnr_attr .= ' ws_index="'.$this->index.'" ws_class="'.$actual_class.'"';
			if (!empty($this->user_style))
				$ctnr_attr .= ' ws_style="'.$this->user_style.'"';
			if (!empty($this->more_classes))
				$ctnr_attr .= ' ws_more_classes="'.$this->more_classes.'"';
			if (!empty($this->model_id))
				$ctnr_attr .= ' ws_model="'.$this->model_id.'"';
			if ($this->properties & WS_PAGE_CONTAINER) {
				echo '<div id="pageContainer">';
			}
			if (!($this->properties & WS_SYSTEM_CONTAINER)) {
			  	global $ws_model_text;
				$class_name .= ' ws_editable_container'.(empty($this->model_id) ? '' : ' ws_model_container');
				$class_name .= $this->properties & WS_VALIGN ? ' ws_stretch' : '';
                $title = empty($this->model_id) ? $this->MakeTitle() : $ws_model_text.$this->model_id;
				$ctnr_attr .=
                    ' title="'.$title.'" onmouseover="ws_onmouseoverElement(event, this)"';
			}
		}
		$ctnr_attr .= ' data-props="'.(WS_CONTAINER | $this->properties | ($this->model_id  ? WS_MODEL_CONTAINER : 0)).'"'
                    .' data-owner="'.@$this->owner->id.'"'
					.' data-last_content="'.@$this->contents[count($this->contents)-1]->id.'"';
		$ctnr_attr = ' id="'.$this->id.'"'.(empty($class_name) ? '' : ' class="'.$class_name.'"').$ctnr_attr;
/*		if ($ws_permissions) {
		  	$p = $this->properties & WS_SYSTEM_CONTAINER ? 'System / ' : 'User / ';
			if ($this->properties & WS_VERTICAL_CONTAINER)
				$p .= 'Vertical';
			else if ($this->properties & WS_HORIZONTAL_CONTAINER)
				$p .= 'Horizontal';
			else
				$p .= 'Unoriented';
			echo "\n<!-- Container ".$this->id." ".$p." -->\n";
		}*/

		if (!WS_HTML_TABLED) {
		// NEW FASHION ***************************************************************************************
			if ($this->properties & WS_CONTAINER_ORIENTATION) { 	// Oriented container (system)
			  	if ($this->properties & WS_PAGE_CONTAINER) {
			  	  	$ws_container_list = array();
			  	  	$ws_setup_components = '';
			  	  	// Combine containers, tables to fill whole page in width and height whith little content
	                echo '<div id="outerContainer" class="wssystemcontainer H">';
	                // Don't put height 100% for page in css because it disrupts old fashion generation
	                $ctnr_attr = str_replace(' class="', ' class="wssystemcontainer ', $ctnr_attr);
			  		echo '<div'.$ctnr_attr.' style="height: 100%"><div id="firstContainer" class="wssystemcontainer '.($this->properties & WS_HORIZONTAL_CONTAINER ? 'H' : 'V').'">';
			  	} else {
					echo '<div'.$ctnr_attr.'>';
				}
				$this->DisplayContent();
				echo "\n</div>";
			} else if ($this->properties & WS_SYSTEM_CONTAINER) {	// System unoriented container (a cell)
				if ($this->owner->properties & WS_VERTICAL_CONTAINER) {				// Parent is vertical
					echo '<div><div'.$ctnr_attr.'>';
    				$this->DisplayContent();
					echo '</div></div>';
				} else if ($this->owner->properties & WS_HORIZONTAL_CONTAINER) {	// Parent is horizontal
				echo '<div'.$ctnr_attr.'>';
    				$this->DisplayContent();
					echo '</div>';
				}
			} else {												// User container (unoriented by nature)
			  	echo $html_prefix.$ctnr_attr.'>';
				if ($this->properties & WS_USER_SELECTABLE_CONTAINER) {
					$tlc = $this->GetTlc();
					echo '<input type="checkbox" class="ws_selection"
								'.((strpos(@$_COOKIE['wsc_selected'], '/'.$this->id) !== false) ? 'checked="true"' : '').'
								onchange="ws_userSelect(\'/'.$tlc->url_id.'/'.$this->id.'\', this.checked)">';
				}
                // If a title is the first content in a drop-down container
                // it is a link to open the drop-down 
                if ($this->properties & WS_DROPDOWN
                        && count($this->contents > 1)
                        && get_class_lower($this->contents[0]) == 'wsstitle'){
                    $this->contents[0]->href = 'javascript: ws_dropDown(\''.$this->id.'dropdown\')';
                    $this->contents[0]->Display();
                    echo '<div id="'.$this->id.'dropdown">';
    				for ($i = 1; @$this->contents[$i]; $i++)
    					$this->contents[$i]->Display();
                    echo '</div>';
                    // If no javascript, the contents are always displayed
                    echo '<script>document.getElementById("'.$this->id.'dropdown").className = "dropDownClosed"</script>';
                } else {
    				$this->DisplayContent();
                }

				// Fix height of block containing floating elements
				// css overflow trick doesn't work safely:
				// in variable width when the container becomes too small the content is
				// clipped, scrolled or displayed outside, according to the value of overflow.
				echo "\n<div style='clear: both;'></div>";
				echo "\n<".$html_suffix;
			}
			$ws_container_list[] = $this;
/*			if ($ws_permissions)
				echo "\n<!-- End of container ".$this->id." -->\n\n";*/
		} else {
		// OLD FASHION UPDATED ***************************************************************************************
			if ($this->properties & WS_CONTAINER_ORIENTATION) { 	// Oriented container (system)
			  	if ($this->properties & WS_PAGE_CONTAINER) {
			  	  	$ws_container_list = array();
			  	  	$ws_setup_components = '';
	                echo '<div id="outerContainer">';
			  		echo '<div'.$ctnr_attr.'><table id="firstContainer" class="wssystemcontainer">';
			  	} else {
					echo '<table'.$ctnr_attr.'>';
				}
				$this->DisplayContent();
				echo "\n</table>";
			} else if ($this->properties & WS_SYSTEM_CONTAINER) {	// System unoriented container (a cell)
			    if ($this->owner->properties & WS_VERTICAL_CONTAINER) {				// Parent is vertical
					echo '<tr><td'.$ctnr_attr.'>';
    				$this->DisplayContent();
					echo '</td></tr>';
				} else if ($this->owner->properties & WS_HORIZONTAL_CONTAINER) {	// Parent is horizontal
				  	if ($this->index == 0)
			  			echo '<tr>';
					echo '<td'.$ctnr_attr.'>';
    				$this->DisplayContent();
					echo '</td>';
					if ($this->index == count($this->owner->contents) - 1)
				  		echo '</tr>';
				}
			} else {												// User container (unoriented by nature)
//				if ($this->model_id && $ws_permissions & P_EDIT) echo '<div style="background: yellow; color: black">'.$title.'</div>';
			  	echo $html_prefix.$ctnr_attr.'>';
				if ($this->properties & WS_USER_SELECTABLE_CONTAINER) {
					$tlc = $this->GetTlc();
					echo '<input type="checkbox" class="ws_selection"
								'.((strpos(@$_COOKIE['wsc_selected'], '/'.$this->id) !== false) ? 'checked="true"' : '').'
								onchange="ws_userSelect(\'/'.$tlc->url_id.'/'.$this->id.'\', this.checked)">';
				}

                // If a title is the first content in a drop-down container
                // it is a link to open the drop-down 
                if ($this->properties & WS_DROPDOWN
                        && count($this->contents > 1)
                        && get_class_lower($this->contents[0]) == 'wsstitle'){
                    $this->contents[0]->href = 'javascript: ws_dropDown(\''.$this->id.'dropdown\')';
                    $this->contents[0]->Display();
                    echo '<div id="'.$this->id.'dropdown">';
    				for ($i = 1; @$this->contents[$i]; $i++)
    					$this->contents[$i]->Display();
                    echo '</div>';
                    // If no javascript, the contents are always displayed
                    echo '<script>document.getElementById("'.$this->id.'dropdown").className = "dropDownClosed"</script>';
                } else {
    				$this->DisplayContent();
                }
//				foreach ($this->contents as $content)
//					$content->Display();
				// Fix height of block containing floating elements (css overflow trick doesn't work everywhere)
				// to verify: font-size &nbsp; are there for IE6..
				echo "\n<div style='clear: both; height: 0.1px; font-size: 0.01px;'>&nbsp;</div>";
				echo "\n<".$html_suffix;
			}
			$ws_container_list[] = $this;
//			if ($ws_permissions)
//			echo "\n<!-- End of container ".$this->id." -->\n\n";
		}
	  	if ($this->properties & WS_PAGE_CONTAINER) {
	  		echo "\n</div></div>".($ws_permissions & P_EDIT? '</div>' : '');
	  		echo "\n<script>";
			echo 'ws_setupElements()';
	  		echo "\n</script>";
	  	}
	}

//	Default display content
//	-----------------------
	function DisplayContent() {
		foreach ($this->contents as $content)
			$content->Display();
	}

//	Fix whole descendance tree of a container.
//	Fix index and owner reference, purge useless containers.
//	Called especially at save and load time, but not only
//	--------------------------------------------------------
	function FixTree($start_index = 0, $end_index = 65535) {
		// Fix whole descendance
	    for ($i = $start_index; $i <= $end_index && $i < count($this->contents); $i++) {
            $this->contents[$i]->index = $i;             		// Fix index
            $this->contents[$i]->owner =& $this;                // Fix reference to owner
 			if ($this->contents[$i]->CandidateToPurge()) {      // Suppress if possible
				array_splice($this->contents, $i, 1, $this->contents[$i]->contents);
				if (count($this->contents) <= 1 && $this->owner)
					$this->owner->FixTree($this->index, $this->index);
				else
	     			$this->FixTree($i);
     			return;
     		} else if (($this->properties & WS_CONTAINER_ORIENTATION)	// Encapsulate content if necessary
     					&& (empty($this->contents[$i]->properties)
			 				|| ($this->contents[$i]->properties & WS_CONTAINER_ORIENTATION)
							|| !($this->contents[$i]->properties & WS_SYSTEM_CONTAINER))) {
				$this->contents[$i] =
						new WsContainer(0, WS_SYSTEM_CONTAINER, array($this->contents[$i]));
	   			$this->FixTree($i);
	   			return;
			} else {
				$this->contents[$i]->FixTree();
			}
		}
	}
	function CandidateToPurge() {
		return
			// Empty container
			(count($this->contents) == 0) ||
			// System container with only one content
			(count($this->contents) == 1 && (
					// oriented
					($this->properties & WS_CONTAINER_ORIENTATION) ||
					// owner and child of same orientation
					(($this->properties & WS_SYSTEM_CONTAINER) &&
						(@$this->contents[0]->properties & WS_CONTAINER_ORIENTATION)
							== ($this->owner->properties & WS_CONTAINER_ORIENTATION)))) ||
			// System container of same orientation than its owner
			(($this->properties & WS_SYSTEM_CONTAINER) &&
				($this->properties & WS_CONTAINER_ORIENTATION)
					== ($this->owner->properties & WS_CONTAINER_ORIENTATION));
	}

//	Forgetor
//	--------
	function Forget() {
		if (!$this->model_id) { // Don't kill descendance if comes from a model (not necessary to purge images after that)
			foreach ($this->contents as $content)
				$content->Forget();
		}
		$this->RemoveFromOwner();
	}

//  Get an array of element contents, not properties
//  ------------------------------------------------
    function &GetContents() {
        $contents = array('contents' => $this->contents);   // Intermediate for reference return
        return $contents;
    }

//	Get embedded css of the hierarchy
//	---------------------------------
//	This method is not too efficient, because we walk through every node.
//	Tried non-recursive method with same performance results.
//	The poor response time is visible at publish time with a big site,
//	where we do a purge of background images.
	function GetEmbeddedCss() {
	  	$css = parent::GetEmbeddedCss();
		foreach ($this->contents as $child)
			$css .= $child->GetEmbeddedCss();
		return $css;
	}

//  Get an array of hierarchy contents
//	Execute a user function for each content
//  ----------------------------------------
    function GetAllContents($user_func = 0, $params = 0) {
        if (!$user_func) $user_func = function(){};
        $contents[] = $this;
        foreach ($this->contents as $elt) {
            if (!empty($elt->contents))
                $contents = array_merge($contents, $elt->GetAllContents($user_func, $params));
            else
                $contents[] = $elt;
            $user_func($elt, $params);
        }
        return $contents;
    }

//	Get name of data files of the container and its contents
//	Execute a user function for each file
//	--------------------------------------------------------
	function GetDataFiles($user_func = 0){
		$files = parent::GetDataFiles($user_func);
		foreach ($this->contents as $child){
	  		$files = array_merge($files, $child->GetDataFiles($user_func));
	  	}
	  	return $files;
	}

//	Insert a content, at designated index, by default at the end.
//	Linked content data (as index) will be updated by subsequent FixTree().
//	-----------------------------------------------------------------------
	function InsertContent(&$content, $index = 65535) {
		if ($content !== false) {
			if ($index < 0)
	            $index = 0;
			if ($index >= count($this->contents)) {
				$this->contents[] =& $content;
			} else {
				$warray[$index] =& $content;    // Probably useful to use a work array...
				array_splice($this->contents, $index, 0, $warray);
			}
		}
	}

//  Transform a container and its contents to be model saveable
//  -----------------------------------------------------------
	function Modelize($model_id) {
		for ($i=0, $n=count($this->contents); $i<$n; $i++)
			$this->contents[$i]->Modelize($model_id);
		parent::Modelize($model_id);
		if ($this->model_id == $model_id)
			$this->model_id = '';   // This is to eliminate possible self-containing model
	}

//	Remove content
//	--------------
	function RemoveContent($index) {
		unset($this->contents[$index]);
		$this->contents = array_merge($this->contents);
	}

//	Refresh object as a new instance
//	--------------------------------
	function RenewInstance($new_id = 0) {
		if (!$new_id)
			$new_id = $this->NewId(WS_CONTAINER_ID_PREFIX);
    	$this->embedded_css_rules = str_replace($this->id, $new_id, $this->embedded_css_rules);
    	$this->id = $new_id;
		for ($i=0, $n=count($this->contents); $i<$n; $i++) {	// Do not use foreach, work on the original object !
			$this->contents[$i]->owner = &$this;
			$this->contents[$i]->RenewInstance();
		}
	}

//	Save a model container
//	Put it in a new top level container which is saved in database.
//	---------------------------------------------------------------
	function SaveAsModel($model_id = 0){
		global $ws_permissions;

		if ($ws_permissions & P_ADMIN){
			if (!$model_id)
				$model_id = $this->model_id;
			$this->Modelize($model_id);         // Warning: possibly reset $this->model_id
	        $this->model_id = '';               // To avoid loop during read() in ApplyModel()
			$new_container = new WsTopLevelContainer($model_id, WS_MODEL_CONTAINER | $this->properties);
			$new_container->SetValue('name', '_Model container');
			$new_container->InsertContent($this);
			$new_container->Save();
	        $this->model_id = $model_id;
			$this->FixTree();      // Important to do that AFTER save, for GetModel() from descendance
		} else {
            global $ws_notAllowed;
			WsUtils::WsPopup($ws_notAllowed);
		}
	}

//	Update an attribute
//	-------------------
	function SetValue($field_name, $value) {
		if ($field_name == 'properties' && $value & WS_VALIGN) {
		    // Only one container can be extended (valigned) in a same cell
		    foreach ($this->owner->contents as $sibling)
		        $sibling->properties &= ~WS_VALIGN;
		}
        $saved_model = $this->model_id;
        parent::SetValue($field_name, $value);
		if ($field_name == "model_id" && $value !== $saved_model) {
            $this->ApplyModel();                // Necessary before a SaveAsModel (cf ws_inits.php)
			if (empty($value))
				$this->RenewInstance();         // Renew id is useful for css
		}
	}
}

//  -------------------------------
//  COMPONENT (text, textarea, ..).
//  -------------------------------
class WsComponent extends WsElement {
	var $value;

//	Constructor
//	-----------
	function WsComponent($properties=0, $value=0) {
	  	$this->id = $this->NewId(WS_COMPONENT_ID_PREFIX);
        $this->properties = $properties;
		$this->value = $value;
	}

	function __wakeup() {
		parent::__wakeup();

        // Oldies
        $this->embedded_css_rules = str_replace('#'.$this->id, '.id_'.$this->id, $this->embedded_css_rules);
        $this->properties &= ~WS_FREE_CONTENTS_IN_MODEL;
	}

//  Display
//	-------
	function Display($html_prefix="", $html_suffix="") {
		global $ws_permissions;

	    $actual_class = get_class_lower($this);
		$class_name = "wscomponent ".$actual_class.(empty($this->embedded_css_rules) ? '' : " id_".$this->id);
		if (!empty($this->user_style)) {
			$class_name .= ' '.$actual_class.'_'.$this->user_style;
			$style_name_attribute = '" ws_style="'.$this->user_style;
		}
		if (!empty($this->more_classes)) {
			$class_name .= ' '.$this->more_classes;
			@$style_name_attribute .= '" ws_more_classes="'.$this->more_classes;
		}
		if (empty($html_prefix)) $html_prefix = "<div";   // So the caller may set a default prefix and its own suffix
		if (empty($html_suffix)) $html_suffix = "/div>";
	    if ($ws_permissions & P_EDIT) {
//	      	global $ws_setup_components;

			// Display component with editable features
	      	$class_name .= ' ws_editable_component';
	      	$href = empty($this->href) ? "" : 'ws_href="'.$this->href.'"';
			if ($this->owner && count($this->owner->contents) == 1)
				$this->properties |= WS_ALONE;
			else
				$this->properties &= ~WS_ALONE;
	        echo "\n".$html_prefix.'
				id="'.$this->id.'"
				ws_class="'.$actual_class.@$style_name_attribute.'"
				ws_index="'.$this->index.'"
				class="'.$class_name.'" '.$href.'
				title="'.$this->MakeTitle().'"
                onmouseover="ws_onmouseoverElement(event, this)"
				data-props="'.$this->properties.'"
				data-owner="'.$this->owner->id.'"
			>';
			$this->DisplayContent();
			echo '<'.$html_suffix;
	    } else {
	    	echo $html_prefix.' id="'.$this->id.'" class="'.$class_name.'">';
			$this->DisplayContent();
			echo '<'.$html_suffix;
		}
	}

//	Default display content
//	-----------------------
	function DisplayContent() {
	  	global $ws_component_class_list;
		echo empty($this->value) ? $ws_component_class_list[get_class_lower($this)] : $this->value;
	}

//	Forgetor
//	--------
	function Forget() {
	  	$this->RemoveFromOwner();
	}

//  Get an array of element contents, not properties
//  ------------------------------------------------
    function &GetContents() {
        return array('value' => $this->value);
    }

//	Refresh instance, normally after cloning this or it's owner
//	-----------------------------------------------------------
	function RenewInstance() {
		$new_id = $this->NewId(WS_COMPONENT_ID_PREFIX);
    	$this->embedded_css_rules = str_replace($this->id, $new_id, $this->embedded_css_rules);
    	$this->id = $new_id;
	}
}

//  --------------
//  TEXT component
//  --------------
class WsText extends WsComponent {
	function WsText($value='') {
		$this->WsComponent(WS_TEXT, $value);
	}

//	Display content
//	---------------
	function DisplayContent() {
	  	if (!empty($this->value) || $this->value == '0')    // '0' is not empty for us !!
			// Replace encoded non break space or normal space before some chars by non break space
			echo preg_replace('/((&amp;nbsp;)| )([:?!;])/', '&nbsp;$3', ws_bsn2br_special($this->value));
		else
			parent::DisplayContent();
	}
}

//  ------------------
//  RICHTEXT component
//  ------------------
class WsTextarea extends WsComponent {
	function WsTextarea($value='') {
		$this->WsComponent(WS_TEXTAREA, $value);
	}
	
	function DisplayContent(){
	  	global $ws_component_class_list;
		if (empty($this->value))
			echo $ws_component_class_list[get_class_lower($this)]; 
		else if ($this->properties & WS_IN_BLOCK_LINK)
			echo preg_replace('@(<[\s]*a[^>]*>)|(<[\s]*/a[^>]*>)@im', '', $this->value);
		else
			// Replace normal space before some chars by non break space
			echo preg_replace('/ ([:?!;])/', '&nbsp;$1', $this->value);
	}
}

//  -------------------
//  RAWTEXT component
//  -------------------
//	Associated data files are managed as image files,
//	see comments in image component.
//	The text may be taken from a wippet code file.
//	-------------------------------------------------
class WsRawText extends WsComponent {
	var $data_filename;			// Array of associated file names on server, indexed by original names
	var $source_filename;		// Filename of source code
	var $variables;				// Array of source variables, name=>value
	var $decoded_value;			// Decoded value in case of wippet code in value

	function WsRawText($value = '', $source_filename = 0) {
		$this->WsComponent(WS_RAWTEXT, $value);
		$this->data_filename = array();
//		$source_filename = 'imgSimpleSlider.ws_code';
		$this->source_filename = $source_filename;
		$this->decoded_value = $this->value;
	}

	function __wakeup() {
	    parent::__wakeup();
	    if (isset($this->original_name)) {  // oldies
	        $new_data_filename = array();
	        foreach ($this->original_name as $key => $original_name) {
	            $new_data_filename[$original_name] = $this->data_filename[$key];
			}
			unset($this->original_name);
			$this->data_filename = $new_data_filename;
		}
		
		// Manage and process the source code
	    if (empty($this->value) && is_file(WS_WIPPETS_PATH.$this->source_filename)) {
			$this->value = file_get_contents(WS_WIPPETS_PATH.$this->source_filename); 
		}
		$this->decoded_value = $this->process($this->value);
	}

	// Initialize variables, transform ws_code to HTML code
	private function process($codeText){
		global $ws_lang;

		$declarations = substr($codeText, stripos($codeText, '<WS_DECLARATIONS>') + 17);
		$declarations = substr($declarations, 0, stripos($declarations, '</WS_DECLARATIONS>'));
		if (empty($declarations)) return $codeText;
		// jsonification of declarations, by adding <"> around member names if not yet done
		$declarations = preg_replace('/([{,\s]+)([^},:"]+)(\s*:)/', '$1"$2"$3', $declarations);
		// Decode declarations
		$declarations = json_decode('{'.$declarations.'}');
		$code = substr($codeText, stripos($codeText, '</WS_DECLARATIONS>') + 18);
		$bT = $declarations->ws_syntax->variable_beg_tag;
		$eT = $declarations->ws_syntax->variable_end_tag;
		$wT = $declarations->ws_syntax->websico_reserved_prefix;
		$this->info = @$declarations->ws_info->$ws_lang;
		// Substitute websico variables
		$code = str_replace($bT.'ws_element_id'.$eT, $this->id, $code);
		// Substitute user variables
		foreach ($declarations as $variable => $attrs) {
			if (strpos($variable, $wT) !== 0) {
				$value = empty($this->variables[$variable]['value']) ? $declarations->$variable->default_value : $this->variables[$variable]['value'] ;
				$this->variables[$variable] = array('value' => $value, 'text' => $declarations->$variable->text->$ws_lang);
				$code = str_replace($bT.$variable.$eT, $value, $code);
			}
		}
		// Purge undeclared variables
		foreach ($this->variables as $variable => $value){
			if (empty($declarations->$variable)){
				unset($this->variables[$variable]);
			}
		}
		return $code;
	}

//  Display
//	The raw text is taken from a wippet code file if value attribute is empty and source file exists. 
//	Add a ws_content attribute to pass the original raw text because the text in innerHTML
//	may be modified by itself, or if it's wippet code or...
//	----------------------------------------------------------------------------------------
	function Display($html_prefix="", $html_suffix="") {
		global $ws_permissions;

		$prefix = '<div';
		if ($ws_permissions & P_EDIT) {
            foreach ($this->data_filename as $original_name => $server_name) {
		        if (!is_file(WS_RAWDATA_PATH.$server_name))
		            unset($this->data_filename[$original_name]);
			}
			$prefix .=  ' ws_content="'.htmlspecialchars($this->value).'"';
			if (!empty($this->variables)) {
				$prefix .= ' data-variables="'.htmlspecialchars(json_encode($this->variables)).'"';
			}
			if (!empty($this->info)) {
				$prefix .= ' data-info="'.htmlspecialchars($this->info).'"';
			}
		}
		if (!empty($this->data_filename)) {
			// Filelist, server names and original names, used by some javascript 
			$prefix .= ' data-server_files="'.htmlspecialchars('"'.implode('","', array_values($this->data_filename)).'"').'"';
			$prefix .= ' data-attached_files="'.htmlspecialchars('"'.implode('","', array_keys($this->data_filename)).'"').'"';
		}
		parent::Display($prefix, "/div>");
	}

//	Display content
//	---------------
	function DisplayContent() {
	  	if (!empty($this->value)) {
            global $ws_permissions;

	  	    $str = $ws_permissions & P_SOURCE ? nl2br(htmlspecialchars($this->value)) : $this->decoded_value;
            foreach ($this->data_filename as $original_name => $server_name)	// Not secure substitution !!!
				$str = str_replace($original_name, WS_RAWDATA_PATH.$server_name, $str);
            echo $str;
		} else {
			parent::DisplayContent();
        }
	}

//	Display content to allow php processing
//	---------------------------------------
/*	function DisplayContent() {
			EXTREMELY DANGEROUS TO ALLOW THAT  !!!!!
			IF WEBSICO WERE IMPLEMENTED AS SAAS,
			ANYBODY HAVING UPDATE ACCESS COULD LIST OR DESTROY SOURCES WITH THE HELP
			OF A LITTLE PHP....
			But it's so cool... I keep the code :o)

		if (strpos($this->value, "<?php") !== false) {	// Not rigorous but no hurt to process a file with no php inside
			fwrite(fopen("php_tmp.php", "w"), $this->value);
			include("php_tmp.php");
		} else {
			parent::DisplayContent();
		}
	}
*/

//	Forgetor
//	--------
	function Forget() {
	  	global $ws_must_purge_data;

		parent::Forget();
		$ws_must_purge_data = true;
	}

//	Get name of data files and put them in the keys of array
//	Execute a user function for each file
//	--------------------------------------------------------
	function GetDataFiles($user_func = 0){
		$files = parent::GetDataFiles($user_func);
        foreach ($this->data_filename as $key => $filename){
        	$new_path = $path = WS_RAWDATA_PATH.$filename;        
			
			// If user_func returns a different path change it, 
			// the caller is supposed to have yet moved the file
			if ($user_func && ($new_path = $user_func($path)) != $path){
				$this->data_filename[$key] = basename($new_path);
			}
			$files[$new_path] = 1;
		}
		return $files;
	}

//	Get data files and save them
//	----------------------------
//	We must check what kind of file is uploaded to prevent malicious attacks
//	by executable data on server (as with php file).
//  This check must of course be done on server side, at lower level operation.
//	Unfortunately I didn't find anything better than check extension, as
//  "mime type" in uploaded file array ($_FILES['formvar']['type']) is also deduced from
//  extension and not too reliable (varies from browser to another and probably from os to other)
//	Another solution would be to isolate the data file, maybe in an another domain, to prevent
//	access to sensible area (the one which contains php core files).
	function SetValue($field_name, $value) {
	    global $ws_must_purge_data;

		if (strpos($field_name, 'data_file') === 0 && is_array($value)){
           $valid_extensions = array(   // No file types potentially dangerous (even HTML, that could contain <?php or other script)
                        // Multimedia
                        "au", "mid", "midi", "ra", "ram", "rm", "wav",
                        "avi", "mov", "qt", "mpg", "mpeg", "mp2", "mp3", "mp4", "wmv",
                        "swf", "dir", "dxr", "dcr", "wrl", "vrml", "flv", "ogg",
                        "bmp", "gif", "ico", "img", "jpg", "jpeg", "png", "cur",
                        "ppm", "tif", "tiff", "xbm", "svg",
                        // Documents
                        "pdf", "ps", "doc", "docx", "csv", "xls", "xlsx", "ppt", "pptx", "pps",
                        "rtf", "txt", "odt", "css",
                        "gz", "gzip", "hqx", "zip", "tar", "rar",
                        // Fonts
                        "eot", "ttf", "woff",
                        // Executable
                        "exe", "js",
                        // Misc
                        "ws_data"
                        );
			foreach ($value['name'] as $n => $filename) {   // Multiple file input
			    if ($value['tmp_name'][$n]) {
		            $extension = strtolower(substr($filename, strrpos($filename, ".") + 1));
				  	if (in_array($extension, $valid_extensions)) {
		                global $ws_site;
		                if (!$ws_site->availableSpace()) {
		                    global $ws_space_full;
		        			WsUtils::WsError($ws_space_full);
		                } else if (@$this->data_filename[$filename]) {  // The file must be yet in the list, updated before
		    				$this->data_filename[$filename] = WsUtils::ComputeFilename($filename, WS_RAWDATA_PATH);
		    	  			move_uploaded_file($value['tmp_name'][$n], WS_RAWDATA_PATH.$this->data_filename[$filename]);
		    				$ws_must_purge_data = true;
		                }
					} else {
						global $ws_not_supported_type;
						WsUtils::WsError($ws_not_supported_type);
					}
				}
			}
		} else if ($field_name == 'attached_files') {
		    $value = trim(trim($value, '["'), '"]'); // Must strip quotes from filenames (filenames are quoted to support commas)
		    $files = $value ? explode('","', $value) : array();
			// Add missing filenames
		    foreach ($files as $missing) {
				if (!isset($this->data_filename[$missing]))
					$this->data_filename[$missing] = 'new';
			}
			// Remove files not in list
		    foreach ($this->data_filename as $file => $actual_file) {
		        if (!in_array($file, $files)) {
					unset($this->data_filename[$file]);
    				$ws_must_purge_data = true;
				}
			}
		} else if ($field_name == 'variables') {
			return;
		} else {
		  	parent::SetValue($field_name, $value);
		}
	}
}

//  ---------------
//  IMAGE component
//	---------------
//	Image files management:
//	- images are stored in separate files in a special directory
//	- images are stored resized in jpeg format, more efficient, unless 'keep_format' is set
//	- each time an image is uploaded, a new file with a new unique name is created
//	- image files can be shared (after a copy of an element..)
//	- sometime (when publishing, deleting ...) a purge utility is processed
//
//	The main advantage is to allow image sharing and to free each operation of thinking:
//	"what must I do with the image file ? delete, rename, what about image duplication when
//	I rewrite a page in draft database ?" etc..
//	The main disadvantage is to cause a potentially long operation when purging site
//	with hundreds or thousands of image files.
//  ---------------------------------------------------------------------------------------
class WsImage extends WsComponent {
  	var $caption;			// Text below image
  	var $href;				// Target url in case of link
  	var $tooltip;			// Tooltip showed when cursor is over image
  	var $original_name;		// Name of source image file on the client
  	var $in_gallery;		// Image is galleryable
  	var $uploaded_image;	// Uploaded image, fixed for an acceptable size unless keep_format
  	var $keep_format;		// Format must not be changed to jpg, to keep animation etc.
  	var $width;				// Width to display
  	var $height;			// Height to display
	var $notFlexible;		// Width and height are fixed

	function WsImage() {
  		global $ws_image_default_width, $ws_image_default_height;

		$this->WsComponent(WS_IMAGE);
        $this->width = $ws_image_default_width;
		$this->height = $ws_image_default_height;
	}
	
	function __wakeup() {
		$this->value = preg_replace('&^'.WS_IMAGE_PATH.'&', '', $this->value);
		if (isset($this->origin_path)){	// name has changed, shoud be done in version management
			$this->uploaded_image = $this->origin_path;
			unset($this->origin_path); 
		}
	}

//  Display
//	-------
	function Display($html_prefix="", $html_suffix="") {
	  	global $ws_noFleximage, $ws_permissions;

	  	// Width of <div> to fit image size
		if ($ws_noFleximage || @$this->notFlexible || @$this->GetTLC()->not_responsive)
			$html_prefix .= '<div style="width: '.$this->width.'px"';
		else
			$html_prefix .= '<div style="max-width: '.$this->width.'px"';
		if ($ws_permissions & P_EDIT) {
			$html_prefix .= ' ws_tooltip="'.htmlspecialchars($this->tooltip).'"';
			if ($this->keep_format)
				$html_prefix .= ' ws_keep_format="true"';
			else if ($this->in_gallery)
				$html_prefix .= ' ws_in_gallery="true"';
			if ($this->notFlexible)
				$html_prefix .= ' ws_notFlexible="true"';
		}
		$html_suffix = "/div>";
		parent::Display($html_prefix, $html_suffix);
	}

//	Display image
//	-------------
	function DisplayContent() {
		global $ws_noFleximage, $ws_permissions;

		// Link or gallery results to a link
		$write_link = 0;
		if (!($this->properties & WS_IN_BLOCK_LINK)){		
			if ($write_link = @$this->in_gallery) {
				echo '<a class="zoomable"';
				echo ' href="'.WS_IMAGE_PATH.(@$this->uploaded_image ? $this->uploaded_image : $this->value).'">';
			} else if ($write_link = !empty($this->href))
				echo '<a href="'.$this->BuildHref().'">';
		}				

		// Image
		$class = $this->keep_format ? '' : 'class="filter" ';
		if (is_file(WS_IMAGE_PATH.$this->value))
	    	echo '<img '.$class.'src="'.WS_IMAGE_PATH.$this->value.'"';
	    else if (is_file($this->value))		// Because of new page default image
	    	echo '<img '.$class.'src="'.$this->value.'"';
        else
	    	echo '<img '.$class.'src="'.WS_CORE_PATH.'ws_images/noimage.svg"';
		$tooltip = empty($this->tooltip) ? $this->original_name : htmlspecialchars($this->tooltip);
		echo ' alt="'.$tooltip.'" title="'.$tooltip.'">';
		if ($write_link)
			echo '</a>';

		// Image caption ('0' is not an empty string for us)
		$style = empty($this->caption) && $this->caption != '0' ? ' style="display: none"' : '';
		if (!empty($this->caption) || $this->caption == '0' || $ws_permissions & P_EDIT) {
			$write_link = !empty($this->href) && !($this->properties & WS_IN_BLOCK_LINK);
    		echo $write_link ? '<a href="'.$this->BuildHref().'"' : '<div';
			echo ' class="ws_img_caption" id="'.$this->id.'_caption" '.$style.'>'.preg_replace('/((&amp;nbsp;)| )([:?!;])/', '&nbsp;$3', ws_bsn2br_special($this->caption));
            echo $write_link ? '</a>' : '</div>';
		}
	}

//	Forgetor
//	--------
	function Forget() {
	  	global $ws_must_purge_data;

		parent::Forget();
		$ws_must_purge_data = true;
	}

//	Get name of image files and return them as keys of array
//	Execute a user function for each file
//	--------------------------------------------------------
	function GetDataFiles($user_func = 0){
		$files = parent::GetDataFiles($user_func);
		if (!empty($this->value)){
			$new_path = $path = WS_IMAGE_PATH.$this->value;		
			
			// If user_func returns a different path change it, 
			// the caller is supposed to have yet moved the file
			if ($user_func && ($new_path = $user_func($path)) != $path){
				$this->value = basename($new_path);			
			}
			$files[$new_path] = 1;
		}
		if (!empty($this->uploaded_image)){
			$new_path = $path = WS_IMAGE_PATH.$this->uploaded_image;

			// If user_func returns a different path change it, 
			// the caller is supposed to have yet moved the file
			if ($user_func && ($new_path = $user_func($path)) != $path){
				$this->uploaded_image = basename($new_path);
			}
			$files[$new_path] = 1;
		}
		return $files;
	}

//	Get image file and save it.
//	Uploaded image file is kept and referenced by $this->uploaded_image,
//	fixed for an acceptable size unless keep_format
//	--------------------------------------------------------------------
	function SetValue($field_name, $value) {
	    global $ws_must_purge_data, $ws_site;

        if (!$this->uploaded_image)
        	$this->uploaded_image = $this->value;
		if ($field_name != 'value') {
            // If width changes after the image file was yet uploaded (ie type is not null)
			// and (keep_format is or must become false, or type is png or jpg),
			// we try to recompute image, this to avoid unvolontary big images
            // (frequently seen for basic users).
			// beurk, but we must take all the form values in account...
			if (isset($_POST['ws__width']) && $_POST['ws__width'] != $this->width
					&& $this->uploaded_image
					&& is_file(WS_IMAGE_PATH.$this->uploaded_image)) {
				list($width, $height, $type, $attr) = getimagesize(WS_IMAGE_PATH.$this->uploaded_image);
				if ($type && (!$_POST['ws__keep_format'] || $type == IMAGETYPE_PNG || $type == IMAGETYPE_JPEG)) {
	                $this->width = $_POST['ws__width'];
	                $this->height = $_POST['ws__height'];
					if ($_POST['ws__width'] < $width) {										
						$extension = $type == IMAGETYPE_PNG ? '.png' : '.jpg';
		                $this->value = WsUtils::ComputeFilename($this->original_name, WS_IMAGE_PATH, $extension);
						WsUtils::ResizeImage(WS_IMAGE_PATH.$this->uploaded_image, $this->width, $this->height, WS_IMAGE_PATH.$this->value);
					} else {
						$this->value = $this->uploaded_image;										
					}												
	                $ws_must_purge_data = true;
	            }
	        }
		  	parent::SetValue($field_name, $value);
		} else if (is_array($value) && ($uploadedfile = @$value['tmp_name'][0])) {
			if ($ws_site->availableSpace()) {
				list($width, $height, $type, $attr) = getimagesize($uploadedfile);
				// The svg special case
				if (preg_match("/svg/i", substr($value['name'][0], strrpos($value['name'][0], ".")))) {
					$this->keep_format = 1;
					$type = -1;
				}
				if (!$type) {
					// Security against non-standard image file saving
		            global $ws_not_supported_type;
				    WsUtils::WsError($ws_not_supported_type);
	            } else if (!$this->keep_format) {
	            	// In normal case, we keep png format, set jpg for others
	                $this->original_name = $value['name'][0];
					$extension = $type == IMAGETYPE_PNG ? '.png' : '.jpg';
                	$this->uploaded_image = WsUtils::ComputeFilename($this->original_name, WS_IMAGE_PATH, $extension);
                    if ($width > 2048 || $height > 1600) {  // We limit image dimension to save ressources
                        $width = 2048;
                        $height = 1600;
                        WsUtils::ResizeImage($uploadedfile, $width, $height, WS_IMAGE_PATH.$this->uploaded_image);
                    } else {
                        move_uploaded_file($uploadedfile, WS_IMAGE_PATH.$this->uploaded_image);
                    }
	                $this->value = WsUtils::ComputeFilename($this->original_name, WS_IMAGE_PATH, $extension);
	                WsUtils::ResizeImage(WS_IMAGE_PATH.$this->uploaded_image, $this->width, $this->height, WS_IMAGE_PATH.$this->value);
	                $ws_must_purge_data = true;
			    } else {
			    	// In case of keep format we save the uploaded image as is
	                $this->original_name = $value['name'][0];
					$this->uploaded_image = WsUtils::ComputeFilename($this->original_name, WS_IMAGE_PATH);
					move_uploaded_file($uploadedfile, WS_IMAGE_PATH.$this->uploaded_image);
	                $this->value = $this->uploaded_image;
	                $this->width = $width;
	                $this->height = $height;
	                $ws_must_purge_data = true;
	            }
			} else {
				global $ws_space_full;
				WsUtils::WsError($ws_space_full);
			}
		} else if (is_string($value)) {
            $this->value = $value;
        }
	}
}

//	--------------
//	SITE MAP CLASS
//	--------------
class WsMapItem {  // A map item is a page with or without children
    var $parent = 0;
    var $id;
    var $name = 0;
    var $status;
    var $children = array();

    function WsMapItem($id, $url_id, $name, $status = 0) {
        $this->id = $id;
        $this->url_id = $url_id;
        $this->name = $name;
        $this->status = $status;
    }
    function AddChild(&$child) {
        $this->children[$child->id] = $child;
        $child->parent = $this;
        return $child;
    }
    function MoveAfterMe($item) {
        $parent_children = $this->parent->children;
        $this->parent->children = array();
        foreach ($parent_children as $id => $child) {
            $this->parent->children[] = $child;
            if ($id == $this->id) {
                $this->parent->children[$id] = $item;
                unset($item->parent->children[$item->id]);
                $item->parent = $this->parent;
            }
        }
    }
}

class WsSitemap {
  	var $root;           // Root of map items
  	var $item_by_id;     // Array of item references in map tree, indexed by page id
  	var $draft = 1;      // Map status

	function WsSitemap($map = 0) {
	    global $ws_user_lang, $ws_permissions, $ws_sitemap;
        $status = array();
        $url_id = array();
		$page_list = WsTopLevelContainer::GetTLCList(
				"where properties & ".WS_PAGE_CONTAINER." and `lang` = '".$ws_user_lang."'",
                $url_id, $status);
		$map_array = array();
		if ($map) {
            // Build the sitemap from a predefined map (used by modification of the sitemap)
			$map = explode('/', $map);
			$n = count($map) - 1;
			for ($i = 0; $i < $n; )
				$map_array[] = array('id' => $map[$i++], 'category' => $map[$i++]);
		} else if (!$ws_sitemap) {
			// Read sitemap, draft overloads public
	   		$tables = array(WsSite::MAP);			// Public
			if ($ws_permissions & P_DRAFT)			// Overload by draft zone
				$tables[] = WsSite::MAP_DRAFT;
			$selectfrom = "SELECT * from ";
	        foreach($tables as $table) {
				$query = $selectfrom.$table." where `lang`='".$ws_user_lang."'";
		    	if ($row = WsSite::execQueryFetch($query, 1)) {
	    			$this->draft = ($table == WsSite::MAP_DRAFT);
					$map_array = unserialize($row['map_array']);
				}
			}
		} else {
            // Return the cached map
            return $ws_sitemap;
        }

        // Don't keep published pages with same url as a draft page with a different id
        $multiples = array_count_values($url_id);
        foreach ($multiples as $url=>$n) {
            if ($n > 1) {
                foreach (array_keys($url_id, $url) as $id) {
                    if (!($status[$id] ^ WS_PUBLISHED))
                        unset($page_list[$id]);
                }
            }
        }

		// Build map tree
		$not_seen = $page_list;
		$this->root = new WsMapItem(0, 0, 0);
		$current_cat = $this->root;
		foreach($map_array as $key => $page) {
			if (array_key_exists($page['id'], $page_list)) {     // Check page existence
                $cat = (string) $page['category'];
				if (!empty($cat)) {
    				if (isset($this->item_by_id[$cat])) {       // Check category existence (ie is a page)
    					$current_cat = $this->item_by_id[$cat];
    				}
                } else {
                    $current_cat = $this->root;
                }
                $this->item_by_id[$page['id']] =
                            $current_cat->AddChild(
                                        new WsMapItem(
                                            $page['id'],                // id
                                            $url_id[$page['id']],       // url_id
                                            $page_list[$page['id']],    // name
                                            $status[$page['id']]));     // status
				unset($not_seen[$page['id']]);
			}
		}
		foreach($not_seen as $id => $name)					// Add pages not yet in map
            $this->item_by_id[$id] = $this->root->AddChild(new WsMapItem($id, $url_id[$id], $name, $status[$id]));
		$ws_sitemap = &$this;
    }

    function BuildJS(){
        global $ws_url_suffix;

  		$work = "{";
  		foreach ($this->item_by_id as $item) {
			$work .= "\n".$item->id.': {'
			    .'id:"'.$item->id.'",'
				.($item->parent->id ? ('parent_id:"'.($item->parent->id).'", ') : '')
				.'url:"'.$item->url_id.$ws_url_suffix.'", '
				.'name:"'.ws_bsn2br_special($item->name).'", '
				.'status:"'.$item->status.'", '
				.'children:[';
				foreach($item->children as $child)
				    $work .= '"'.$child->id.'",';
                $work = rtrim($work, ' ,').']},';
		}
		return rtrim($work, ' ,')."\n};";
	}

	function Save($force_public = false) {
		global $ws_permissions;
		
		if ($ws_permissions & P_ADMIN){
	        global $ws_user_lang;
	
			$map_array = $this->BuildMapArray($this->root);
		    $tbl_name = $force_public ? WsSite::MAP : WsSite::MAP_DRAFT;
	    	$values = "`lang`= '".$ws_user_lang."'";
			$values .= ", `map_array`=".WsSite::quoteString(serialize($map_array));
	    	$query = "REPLACE ".$tbl_name." SET".$values;
	    	return WsSite::execQuery($query, 2);
	    } else {
            global $ws_notAllowed;
			WsUtils::WsPopup($ws_notAllowed);
		}
	}

    private function BuildMapArray($root) {
        $map_array = array();
        foreach ($root->children as $item) {
            $map_array[] = array('id' => $item->id, 'category' => $item->parent->id);
            $map_array = array_merge($map_array, $this->BuildMapArray($item));
        }
        return $map_array;
    }

	function Publish() {
		if ($this->Save(true)) {
			$this->draft = true;
			$this->Forget();
		}
	}

	function Forget() {
		global $ws_permissions;
		
		if ($ws_permissions & P_ADMIN){
		    global $ws_user_lang;
	
		    $tbl_name = $this->draft ? WsSite::MAP_DRAFT : WsSite::MAP;
		    $query = "DELETE from ".$tbl_name." where `lang`='".$ws_user_lang."'";
	    	return WsSite::execQuery($query, 2);
	    } else {
            global $ws_notAllowed;
			WsUtils::WsPopup($ws_notAllowed);
			return false;
		}
	}
}

//  ------------------
//  UTILITIES CLASS
//  ------------------
class WsUtils {

//	Build page url according with url rewriting
//	-------------------------------------------
	static function BuildURL($url_id, $lang = 0) {
		global $ws_url_suffix, $ws_requested_lang, $ws_default_lang;

        $pathname = $url_id.$ws_url_suffix;
        if ($lang) {
        	if ($lang != $ws_default_lang)
            	$pathname = $lang.'/'.$pathname;
            if (strpos($_SERVER['REQUEST_URI'], '/'.$ws_requested_lang.'/') !== false)
                $pathname = '../'.$pathname;
        }
        return $pathname;
	}

//	Create and return an exclusive file name
//  All weird characters in name, before extension, are replaced by '-',
//  so for '.' to exclude some SECURITY holes like 'file.php.x', which could
//  be interpreted by php on the server (I saw that), with potential extreme damages.
//	---------------------------------------------------------------------------------
	static function ComputeFilename($original, $path, $suffix = 0){
		$typos = strrpos($original, ".");
		if (!$suffix)
            $suffix = substr($original, $typos);
		// Replace all damageables characters ('.' is quite important!)
	  	$name = preg_replace("/[^a-z0-9\-_]/i", "-", substr($original, 0, $typos));
        $filename = strtolower($name.$suffix);  // Lower case avoids some windows tranfert issues
        while (file_exists($path.$filename))
			$filename = strtolower($name.'-'.substr(strrev(uniqid('')), 0, 4).$suffix);
		return $filename;
	}

//	Display error
//	-------------
	static function WsError($error='', $must_die=false) {
		echo '<link rel="StyleSheet" href="'.WS_CORE_PATH.'ws_core_classes.css" type="text/css">';
		echo '<div class="ws_error">--&nbsp;System message&nbsp;--<br>'.$error, '<br>';
		if ($must_die)
			echo "Operation aborted.";
//		echo '<br><input type="button" value="Back" onclick="history.back()">';
		echo '</div>';
		if ($must_die)
			die();
		return $error;
	}
	
//  Popup after loading
//  -------------------
	static function WsPopup($msg){
	    global $ws_body_message;

		$ws_body_message = @$ws_body_message.
			'<script>
			addEventListener("load",
				function(){ws_Form.alertAndConfirm("", "'.addslashes($msg).'", ws_cancelAction, 0, WS_NOCANCEL)},
				false);
			</script>';
	}

//	Clean up string for inclusion in a Javascript statement
//	-------------------------------------------------------
	static function JstringCleanup($str) {
		return str_replace(array("'", '"', "\r\n"), array("&#39", "&#34", " "), $str);
//		return addslashes(str_replace(array('"', "\r\n"), array("&#34", " "), $str));
	}

//	Resize an image from a file to a new file,
//  in jpg or png format, as said by the output filename extension
//	--------------------------------------------------------------
	static function ResizeImage($fromfile, &$newwidth, &$newheight, $tofile) {
        list($oldwidth, $oldheight, $type, $attr) = @getimagesize($fromfile);
        ini_set('memory_limit', '256M'); // Sometimes we need more than 16M to create images
        switch ($type) {
            case IMAGETYPE_JPEG:    $img = imagecreatefromjpeg($fromfile); break;
            case IMAGETYPE_GIF:     $img = imagecreatefromgif($fromfile); break;
            case IMAGETYPE_PNG:     $img = imagecreatefrompng($fromfile); break;
            default:        // Not supported types, as bmp...
	            global $ws_not_supported_type;
			    WsUtils::WsError($ws_not_supported_type);
        }
        if (@$img) {
            $tofile = $tofile ? $tofile : $fromfile;
    		$ratio = min($newwidth / $oldwidth, $newheight / $oldheight);
    		$newwidth = round($oldwidth * $ratio);
    		$newheight = round($oldheight * $ratio);
    		$resized = imagecreatetruecolor($newwidth, $newheight);
			$output_type = substr($tofile, strrpos($tofile, "."));
			switch ($output_type) {
			    case '.png':
			        imagealphablending($resized, false);
			        imagesavealpha($resized, true);
		    		imagecopyresampled($resized, $img, 0, 0, 0, 0, $newwidth, $newheight, $oldwidth, $oldheight);
		    		imagepng($resized, $tofile, 9);
		    		break;
				default:
		    		imagecopyresampled($resized, $img, 0, 0, 0, 0, $newwidth, $newheight, $oldwidth, $oldheight);
		    		imagejpeg($resized, $tofile, 90);
    		}
    		imageDestroy($resized);
    		return $type;
        } else {
            return false;
        }
	}
}
?>
