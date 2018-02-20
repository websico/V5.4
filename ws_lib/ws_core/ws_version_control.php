<?PHP
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
 *  VERSION CONTROL
 *  ---------------------------------------------
 *
 *  included in WsSite class if needed
 *
 */

//  Compute actual version
//  Create database structure if system table does not exist
//  --------------------------------------------------------
$data_version = @$system_record['data_version'];     // Managed version
global $ws_site;
$ws_site = $this;	// Necessary for core_classes called below :(

if (!@$system_record) {
    foreach (self::$tables as $table) {
    	$query = "CREATE TABLE IF NOT EXISTS ".$table.self::$create_table[str_replace('_draft', '', $table)];
    	self::execQuery($query, 3);
    }
}

//  UPWARD COMPATIBILITY
//  --------------------

//  1.0 - First version management
//  ------------------------------
if ($data_version <= 1) {

    $query = "ALTER TABLE `".self::SYSTEM.'`
        ADD `data_version` FLOAT NOT NULL FIRST,
        CHANGE `date` `date` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
    self::execQuery($query);
    $query = "ALTER TABLE `".self::TLC.'` DROP `version`';
    self::execQuery($query);
    $query = "ALTER TABLE `".self::TLC_DRAFT.'` DROP `version`';
    self::execQuery($query);
}

//  1.1 - CSS files, clean up CSS selectors
//  ---------------------------------------
if ($data_version < 1.1) {
    // Styles
    foreach (array(self::USER_CSS, self::USER_CSS_DRAFT) as $css_table) {
		$query = "SELECT `csstext` from ".$css_table." where `id`='default'";
		if ($row = self::execQueryFetch($query)) {
            $css_text = $row['csstext'];
            if (($length = strpos($css_text, ".id.")) !== false)
                $css_text = substr($css_text, 0, $length);
            $css_text = trim(preg_replace('<([\s,}]\.ws[^\s{]+)\.>', '$1_', "\n".$css_text));
            $ws_css_obj = new WsUserCSS();
     		$ws_css_obj->Save($css_text, $css_table == self::USER_CSS);
        }
    }
    // Embedded rules
    ini_set('memory_limit', '128M');      // Hope it's enough

	foreach (array(self::TLC, self::TLC_DRAFT) as $tlc_table) {
		$query = "SELECT `serialized_object` from ".$tlc_table;
		$res = self::execQuery($query, 3);
		while ($row = $res->fetch()) {
            $changed = 0;
		  	$tlc = unserialize($row['serialized_object']);
		  	$all_contents = $tlc->GetAllContents();
		  	foreach($all_contents as $element) {
		  	    // WsRawText compat
		  	    if (get_class_lower($element) == 'wsrawtext') {
		  	        if (!@is_array($element->original_name)) {
			            if (empty($element->original_name)) {
			        		$element->original_name = array();
			        		$element->data_filename = array();
			            } else {
			                $element->original_name = array('data_file' => $element->original_name);
			                $element->data_filename = array('data_file' => $element->data_filename);
			            }
			            $changed++;
			        }
				}
				// Embedded CSS rules compat
                if (preg_match('<[\s,}]\.id\.>s', "\n".$element->embedded_css_rules)) {
                    $new_embedded = preg_replace('<([\s,}]\.id)\.>s', '$1_', "\n".$element->embedded_css_rules);
                    $element->SetValue('embedded_css_rules', $new_embedded);
                    $changed++;
                }
            }
			if ($changed) {
        		$query = "UPDATE `".$tlc_table."` SET `serialized_object`=".self::quoteString(serialize($tlc))."
                            WHERE `id`='".$tlc->id."' AND `lang`='".$tlc->lang."'";
				self::execQuery($query, 1);
            }
		}
	}
}

//  1.7 - New contact form
//  ----------------------
if ($data_version < 1.7) {
    ini_set('memory_limit', '256M');      // Hope it's enough

	foreach (array(self::TLC, self::TLC_DRAFT) as $tlc_table) {
		$query = "SELECT `serialized_object` from ".$tlc_table;
		$res = self::execQuery($query, 3);
		while ($row = $res->fetch()) {
            $changed = 0;
		  	$tlc = unserialize($row['serialized_object']);
		  	$all_contents = $tlc->GetAllContents();
		  	foreach($all_contents as $element) {
		  	    // Contact form
		  	    if (get_class_lower($element) == 'wsscontactform') {
					if (empty($element->value)) {
						$element->value = array(new WssField ($element->email_caption, 1, true),
								new WssField ('',1 , false),
								new WssField ($element->name_caption, 1, true),
								new WssField ($element->address_caption, 4, false),
								new WssField ($element->phone_caption, 1, false),
								new WssField ($element->message_caption, 4, true));
			            $changed++;
					}
				}
            }
			if ($changed) {
        		$query = "UPDATE `".$tlc_table."` SET `serialized_object`=".self::quoteString(serialize($tlc))."
                            WHERE `id`='".$tlc->id."' AND `lang`='".$tlc->lang."'";
				self::execQuery($query, 1);
            }
		}
	}
}

//  2.0 - New contact form
//  ----------------------
if ($data_version < 2.0) {
    ini_set('memory_limit', '256M');      // Hope it's enough
	foreach (array(self::TLC, self::TLC_DRAFT) as $tlc_table) {
		$query = "SELECT `serialized_object` from ".$tlc_table;
		$res = self::execQuery($query, 3);
		while ($row = $res->fetch()) {
            $changed = 0;
		  	$tlc = unserialize($row['serialized_object']);
            $tlc->FixTree();
		  	$all_contents = $tlc->GetAllContents();
		  	foreach($all_contents as $element) {
		  	    // Contact form
		  	    if (get_class_lower($element) == 'wsscontactform') {
                    $field = $element->value;
                    $newForm = new WssForm($element->user_style);
                    $newForm->contents = array();
                    $newForm->destination = $element->destination;
                    $newForm->preamble = $element->preamble;
                    $newForm->postamble = $element->postamble;
                    $newForm->embedded_css_rules = $element->embedded_css_rules;
                    $newForm->embedded_css_rules = str_replace($element->id, $newForm->id, $newForm->embedded_css_rules);
                    if (!empty($field[0]->caption))
                        $newForm->InsertContent(
                            new WssInputField($field[0]->caption, 'email', $field[0]->notempty));
                    if (!empty($field[1]->caption))
                        $newForm->InsertContent(
                            new WssInputField($field[1]->caption, 'text', $field[1]->notempty));
                    for ($i = 2, $nField = count($field); $i < $nField; $i++){
                        $newForm->InsertContent(
                            new WssInputField($field[$i]->caption, 'text', $field[$i]->notempty, $field[$i]->lines));
                    }
                    $newForm->InsertContent(new WssInputField($element->submit_caption, 'submit'));
                    $element->owner->contents[$element->index] = $newForm;
    	            $changed++;
				}
            }
			if ($changed) {
        		$query = "UPDATE `".$tlc_table."` SET `serialized_object`=".self::quoteString(serialize($tlc))."
                            WHERE `id`='".$tlc->id."' AND `lang`='".$tlc->lang."'";
				self::execQuery($query, 1);
            }
		}
	}
}

//  2.1 - Fix rgb colors IE8- not compatible
//  ----------------------------------------
if ($data_version < 2.1) {

	function fixRgb($cssText){
		$pattern = "/rgb\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/im";
  		if (preg_match($pattern, $cssText)){
			return preg_replace_callback($pattern,
					function($matches){
						return '#'.dechex($matches[1]).dechex($matches[2]).dechex($matches[3]);
					}, $cssText);
		} else {
			return false;
		}
	}
    // Styles
    foreach (array(self::USER_CSS, self::USER_CSS_DRAFT) as $css_table) {
		$query = "SELECT `csstext` from ".$css_table." where `id`='default'";
		if ($row = self::execQueryFetch($query)) {
			if ($newCss = fixRgb($row['csstext'])){
	            $ws_css_obj = new WsUserCSS();
	     		$ws_css_obj->Save($newCss, $css_table == self::USER_CSS);
	     	}
        }
    }
    // Embedded rules
    ini_set('memory_limit', '256M');      // Hope it's enough

	foreach (array(self::TLC, self::TLC_DRAFT) as $tlc_table) {
		$query = "SELECT `serialized_object` from ".$tlc_table;
		$res = self::execQuery($query, 3);
		while ($row = $res->fetch()) {
            $changed = 0;
		  	$tlc = unserialize($row['serialized_object']);
		  	$all_contents = $tlc->GetAllContents();
		  	foreach($all_contents as $element) {
		  		if ($newCss = fixRgb($element->embedded_css_rules)){
					$element->embedded_css_rules = $newCss;
					$changed = 1;
				}
            }
			if ($changed) {
				$query = "UPDATE `".$tlc_table."` SET `serialized_object`=".self::quoteString(serialize($tlc))."
                                WHERE `id`='".$tlc->id."' AND `lang`='".$tlc->lang."'";
				self::execQuery($query, 1);
            }
		}
	}
}

//  3.0 Responsive design
//  ---------------------
if ($data_version < 3.0) {
    ini_set('memory_limit', '256M');      // Hope it's enough

	foreach (array(self::TLC, self::TLC_DRAFT) as $tlc_table) {
		$query = "SELECT `serialized_object` from ".$tlc_table;
		$res = self::execQuery($query, 3);
		while ($row = $res->fetch()) {
		  	$tlc = unserialize($row['serialized_object']);
		  	if ($tlc->properties & WS_PAGE_CONTAINER){
		  		$tlc->not_responsive = true;
        		$query = "UPDATE `".$tlc_table."` SET `serialized_object`=".self::quoteString(serialize($tlc))."
                            WHERE `id`='".$tlc->id."' AND `lang`='".$tlc->lang."'";
				self::execQuery($query, 1);
            }
		}
	}
}

//  ACTUALIZE SYSTEM TABLE
//  ----------------------
$query = (@$system_record ? 'UPDATE ' : 'INSERT ').self::SYSTEM.' SET `data_version`='.WS_VERSION;
self::execQuery($query, 3);
?>
