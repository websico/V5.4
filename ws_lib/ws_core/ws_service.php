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
 *  SERVICES
 *  ---------------------------------------
 *  This script is called by the URL:
 *  ws_service.html?WS_CMD=<command>&WS_LANG=<lang>...
 *  Returns text data, html etc., according to the requested operation.
 *  Some operations are protected and must be done exclusively in edit mode.
 */

switch (@$_REQUEST['WS_CMD']) {

/*
 *  CONTROL OF URL
 *  --------------
 *  Check if a url candidate for a page is not yet in use for another page.
 *  WS_URL_ID=<url ident part>
 *  WS_PAGE_INDEX=<internal page index>
 *  Returns 'YES' or 'NO'.
 */
case 'url_exists':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);

    if (($tlc = WsTopLevelContainer::Read(@$_REQUEST['WS_URL_ID'], @$_REQUEST['WS_LANG']))
            && !($tlc->properties & WS_MODEL_CONTAINER) && $tlc->id != @$_REQUEST['WS_PAGE_INDEX'])
        echo 'YES';
    else
        echo 'NO';
    break;

/*
 *  LIST MODELS WITH THEIR REFERENCES
 *  ---------------------------------
 *  WS_FORM=<string $Forms.ws_sm_management_popup> This is a parameter because
 *  $Forms is dynamically renamed by js compressor in ws_body_start.php
 *  Returns an HTML table, one model per row,
 *  with buttons to kill and references.
 */
case 'model_refs':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);

    echo '<table class="smManagement"><tr><th></th><th>'.$ws_th_model.'</th><th>'.ucfirst($ws_draft_text).'</th><th>'.ucfirst($ws_public_text).'</th><th>'.$ws_th_references.'</th></tr>';

    // Build all models array
    $status = array();
    $tlcs = WsTopLevelContainer::GetTLCList("WHERE `properties`&".WS_MODEL_CONTAINER." AND `properties`&".WS_DRAFT);
    foreach($tlcs as $model_id => $name)
        $status[$model_id] = 1;
    $tlcs = WsTopLevelContainer::GetTLCList("WHERE `properties`&".WS_MODEL_CONTAINER." AND NOT `properties`&".WS_DRAFT);
    foreach ($tlcs as $model_id => $name)
        $status[$model_id] = (@$status[$model_id]) | 2;
    $sorted_models = array_keys($status);
    natcasesort($sorted_models);

    // Build references array
    $references = array(array());
    ws_site_walk('ws_add_model_reference', $references, "WHERE `properties`&".WS_PAGE_CONTAINER);

    // Display row
    $i = 1;
    foreach ($sorted_models as $model_id) {
        echo '<tr class="'.($i % 2 ? 'even' : 'odd').'"><td>'.$i++.'</td><td><a href="javascript:void(0)" title="'.$ws_rename_title.'..." onclick="'.$_REQUEST['WS_FORM'].'.onName(\''.$model_id.'\')">'.$model_id.'</a></td>';
        echo '<td class="check" title="'.$ws_select_draft.'">'.($status[$model_id] & 1 ? '<input type="checkbox" name="'.$model_id.'_draft">' : '&nbsp;').'</td>';
        echo '<td class="check" title="'.$ws_select_public.'">'.($status[$model_id] & 2 ? '<input type="checkbox" name="'.$model_id.'_public">' : '&nbsp;').'</td>';
        echo '<td>';
        if ($hrefs = @$references[$model_id]) {
            $hrefs = array_unique($references[$model_id]);
            foreach($hrefs as $href)
                echo '<a target="refpage" href=".'.$href.'">'.$href.'</a>';
        }
        echo '</td></tr>';
    }
    echo '</table>';
    break;

/*
 *  CHANGE A MODEL NAME
 *  -------------------
 *  WS_OLD_NAME=<name of the model to change>
 *  WS_NEW_NAME=<new name for the model>
 *  Returns 'OK' or an error text.
 */
case 'change_model_name':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);

    $ws_site->lockData();
	$ws_old_name = @$_REQUEST['WS_OLD_NAME'];
	$ws_new_name = @$_REQUEST['WS_NEW_NAME'];

	// Test if new name exists
    $tlcs = WsTopLevelContainer::GetTLCList("WHERE `properties`&".WS_MODEL_CONTAINER." AND `id`='".$ws_new_name."'");
    if (count($tlcs)) {
		die($ws_new_name.' : '.$ws_name_exists);
	}

	// Change model name in references must be done before because of model call with old name
	$tmp = array($ws_old_name, $ws_new_name);   // A temporary array to be passed by reference
    ws_site_walk('ws_change_model_name', $tmp);

	// Change name in model tlc must be done after
	foreach (array(WsSite::TLC, WsSite::TLC_DRAFT) as $tlc_table) {
		$query = "UPDATE `".$tlc_table."` SET `id`='".$ws_new_name."' WHERE `id`='".$ws_old_name."'";
		WsSite::execQuery($query, 3);
    }

  	echo 'OK';
    break;

/*
 *  FORGET MODELS
 *  -------------
 *  - model_id_[draft, public]
 *  Returns the list of destroyed models
 */
case 'forget_models':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);

    unset($_REQUEST['WS_CMD'], $_REQUEST['WS_LANG']);
    foreach ($_REQUEST as $model_id => $nothing) {
        $type = strrchr($model_id, '_');
        if ($type == '_draft') {
            $draft_public = $ws_draft_text;
            $tbl_name = WsSite::TLC_DRAFT;
        } else if ($type == '_public') {
            $draft_public = $ws_public_text;
            $tbl_name = WsSite::TLC;
        } else {
            continue;
        }
        $model_id = substr($model_id, 0, strlen($model_id) - strlen($type));
        $query = "DELETE from ".$tbl_name." where `id`='".$model_id."' AND `properties`&".WS_MODEL_CONTAINER;
		WsSite::execQuery($query, 3);
    }
    echo 'OK';
    break;

/*
 *  LIST STYLES WITH THEIR REFERENCES
 *  ---------------------------------
 *  WS_FORM=<string $Forms.ws_sm_management_popup> This is a parameter because
 *  $Forms is dynamically renamed by js compressor in ws_body_start.php
 *  Returns an HTML table, one style per row,
 *  with buttons to kill and references.
 */
case 'style_refs':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);

    echo '<table class="smManagement"><tr><th></th><th>'.$ws_th_component.'</th><th>'.$ws_th_style.'</th><th>'.ucfirst($ws_draft_text).'</th><th>'.ucfirst($ws_public_text).'</th><th>'.$ws_th_references.'</th></tr>';

    // Build all styles array
    $status = array();
    foreach (array(WsSite::USER_CSS_DRAFT, WsSite::USER_CSS) as $css_table) {
        $matches = array();
		$query = "SELECT `csstext` from ".$css_table." where `id`='default'";
		if (($row = WsSite::execQueryFetch($query))
                && preg_match_all('/^\.([a-z0-9_\-]+).*{/im',
                                    str_replace(WS_PAGE_BOUNDARY, '', $row['csstext']), $matches)) {
            foreach($matches[1] as $style_id) {
                if ($css_table == WsSite::USER_CSS_DRAFT)
                    $status[$style_id] = 1;
                else
                    $status[$style_id] = (@$status[$style_id]) | 2;
            }
        }
    }
    $sorted_styles = array_keys($status);
    natcasesort($sorted_styles);

    // Build references array
    $references = array(array());
    ws_site_walk('ws_add_style_reference', $references, "WHERE `properties`&".WS_PAGE_CONTAINER);

    // Display row
    $i = 1;
    foreach ($sorted_styles as $style_id) {
        $style = preg_split('@_@', $style_id, 2);
        echo '<tr class="'.($i % 2 ? 'even' : 'odd').'">';
        if(!@$style[1] || !@$ws_class_list[$style[0]]) {  // Hand coded style
	        echo '<td>'.$i++.'</td><td>'.$ws_not_managed.'</td><td colspan="10">'.$style_id.'...</td>';
		} else {
	        echo '<td>'.$i++.'</td><td>'.@$ws_class_list[$style[0]].'</td><td><a href="javascript:void(0)" title="'.$ws_rename_title.'..." onclick="'.$_REQUEST['WS_FORM'].'.onName(\''.$style[1].'\', \''.$style[0].'\')">'.$style[1].'</a></td>';
	        echo '<td class="check" title="'.$ws_select_draft.'">'.($status[$style_id] & 1 ? '<input type="checkbox" name="'.$style_id.'_draft">' : '&nbsp;').'</td>';
	        echo '<td class="check" title="'.$ws_select_public.'">'.($status[$style_id] & 2 ? '<input type="checkbox" name="'.$style_id.'_public">' : '&nbsp;').'</td>';
	        echo '<td>';
	        if ($hrefs = @$references[$style[1]]) {
	            $hrefs = array_unique($references[$style[1]]);
	            foreach($hrefs as $href)
	                echo '<a target="refpage" href=".'.$href.'">'.$href.'</a>';
	        }
		}
        echo '</td></tr>';
    }
    echo '</table>';
    break;

/*
 *  CHANGE A STYLE NAME
 *  -------------------
 *  WS_OLD_NAME=<name of the style to change>
 *  WS_NEW_NAME=<new name for the style>
 *  WS_TYPE=<type of the element>
 *  Returns 'OK' or an error text.
 */
case 'change_style_name':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);

    $ws_site->lockData();
	$ws_old_name = @$_REQUEST['WS_OLD_NAME'];
	$ws_new_name = @$_REQUEST['WS_NEW_NAME'];
	$ws_type = @$_REQUEST['WS_TYPE'];

	// Test if new name exists
    foreach (array(WsSite::USER_CSS_DRAFT, WsSite::USER_CSS) as $css_table) {
		$query = "SELECT `csstext` from ".$css_table." where `id`='default'";
		if (($row = WsSite::execQueryFetch($query))
				&& preg_match('/\.'.$ws_type.'_'.$ws_new_name.'[\s{]/', $row['csstext']))
			die($ws_new_name.' : '.$ws_name_exists);
	}

	// Change name in css tlc
    foreach (array(WsSite::USER_CSS_DRAFT, WsSite::USER_CSS) as $css_table) {
		$query = "SELECT `csstext` from ".$css_table." where `id`='default'";
		if ($row = WsSite::execQueryFetch($query)) {
            $row['csstext'] = preg_replace('/\.'.$ws_type.'_'.$ws_old_name.'([:\[\.\s{])/', '.'.$ws_type.'_'.$ws_new_name.'$1', $row['csstext']);
	    	$query = "REPLACE ".$css_table." SET `id`='default', `csstext`=".WsSite::quoteString($row['csstext']);
			WsSite::execQuery($query, 3);
		}
    }

	// Change style name in references
	$tmp = array($ws_old_name, $ws_new_name, $ws_type);   // A temporary array to be passed by reference
    ws_site_walk('ws_change_style_name', $tmp);

  	echo 'OK';
    break;

/*
 *  FORGET STYLES
 *  -------------
 *  - style_id_[draft, public]
 *  Returns the list of destroyed styles
 */
case 'forget_styles':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);

    unset($_REQUEST['WS_CMD'], $_REQUEST['WS_LANG']);
    foreach (array(WsSite::USER_CSS_DRAFT, WsSite::USER_CSS) as $css_table) {
		$query = "SELECT `csstext` from ".$css_table." where `id`='default'";
		if ($row = WsSite::execQueryFetch($query)) {
            foreach ($_REQUEST as $style_id => $nothing) {
                $type = strrchr($style_id, '_');
                $style_id = substr($style_id, 0, strlen($style_id) - strlen($type));
                if (($type == '_draft' && $css_table == WsSite::USER_CSS_DRAFT)
                        || ($type == '_public' && $css_table == WsSite::USER_CSS)) {
                    $draft_public = $type == '_draft' ? $ws_draft_text : $ws_public_text;
                    $row['csstext'] = trim(preg_replace('/\s*\.'.$style_id.'[:\[\.\s{][^}]*}\s*/', "\n", $row['csstext']));
                } else {
                    continue;
                }
            }
        	$query = "REPLACE ".$css_table." SET `id`='default', `csstext`=".WsSite::quoteString($row['csstext']);
			WsSite::execQuery($query, 3);
        }
    }
    echo 'OK';
    break;

/*
 *  COPY TO CLIPBOARD
 *  -----------------
 *  - WS_LOCATION=<page_url/element_location>
 *  - WS_TRANSACTION_ID=<page version>
 *  Returns OK or error
 */
case 'copy_to_clipboard': 
    if (!($ws_permissions & P_WRITE)) die($ws_notAllowed);
    
	$ws_service_lang = @$_REQUEST['WS_LANG'] ? @$_REQUEST['WS_LANG'] : $ws_user_lang;
	list($tlc_id, $location) = explode('/', $_REQUEST['WS_LOCATION']);
	if (($tlc =& WsTopLevelContainer::Read($tlc_id, $ws_service_lang))) {
	    if ($_REQUEST['WS_TRANSACTION_ID'] != $tlc->save_number)
	        exit ($ws_obsolet_page);
		else if (($element =& $tlc->GetByLocation($location)) && $element->CopyToClipboard())
			exit ('OK');
	}
	echo 'ERROR';
	break;

/*
 *  GET ELEMENT BY ID
 *  -----------------
 *  - WS_ID=<page_url/element_id>
 *  Returns the displayed element
 */
case 'get_element_by_id': 
	$ws_service_lang = @$_REQUEST['WS_LANG'] ? $_REQUEST['WS_LANG'] : $ws_user_lang;
	if ($ws_permissions)		// No edition possible for this content
		$ws_permissions = P_DRAFT;			// Set mode preview if not simple visitor mode
	if (@$_REQUEST['WS_ID']){		
		list($tlc_id, $element_id) = explode('/', $_REQUEST['WS_ID']);
		if ($tlc =& WsTopLevelContainer::Read($tlc_id, $ws_service_lang)) {
	  		if ($element =& $tlc->GetById($element_id)) {
	            $style = trim($element->getEmbeddedCss());
	            if (!empty($style))
	                echo "\n<style>\n".$style."\n</style>\n";
				$element->Display();
			}
		}
	}		
    break;

/*
 *  SEND PROCESSED FORM BY MAIL
 *  --------------------------
 *  - WS_DESTINATION=<mailto address> 
 *  - WS_WHAT=<file to send> (subset of the full name, see ws_form class)
 *  - WS_SUBJECT=<subject> 
 *  Returns OK if mailed
 */
case 'mail':
    $fileToSend = '24h/'.$_GET['WS_WHAT'].'.filled_form';
    if (file_exists($fileToSend)
	    		&& ws_mail($_GET['WS_DESTINATION'],
					@WS_CONTACT_MAIL,
					'',
					$_GET['WS_SUBJECT'],
					'<html><head></head><body>'.file_get_contents($fileToSend)."\n</body></html>")){
		unlink($fileToSend);	// To prevent some resend attacks (it has been seen)
	    echo 'OK';
	}
    break;

/*
 *  SEND A MODEL TO AN EXTERNAL WEBSICO SITE
 *  ----------------------------------------
 *  This function is copyrighted and not available in free distrib 
 */
case 'export_model':
	if (!is_file(WS_ADMIN_PATH."ws_copyrighted.php")) {
		WsUtils::WsError('export model: Sorry, necessary ressources not found to do this action !!', 1);
	} else {
		require(WS_ADMIN_PATH."ws_copyrighted.php");
		echo ws_export_model($ws_site);
	}
    break;

/*
 *  RECEIVE A MODEL FROM AN EXTERNAL WEBSICO SITE
 *  ---------------------------------------------
 *  - WS_MODELNAMES=<model names, comma separated>
 *  - WS_MODELSTYLES=<styles rules (json encoded array)>
 *  - WS_MODELCONTENTS=<zipped file>  
 *  No return.
 *  Display the listing if models are well received and saved, then returns to the catalog.
 */
case 'import_model':
    if (!($ws_permissions & P_ADMIN)) die($ws_notAllowed);
    
	define('IMPORT_PATH', 'import/');
	define('IMPORT_PREFIX', '_x_');
	define("WINDOWS", stripos(php_uname('s'), 'Windows') === 0);
	if (WINDOWS)
		if (!defined("WS_7za_PATH")) define ("WS_7za_PATH", '');
	define('UNZIP_COMMAND', WINDOWS ? WS_7za_PATH.'7za x -o'.IMPORT_PATH.' -y >logs/zip_log ' : 'unzip -oq -d'.IMPORT_PATH.' ');
	define('ZIP_ERROR', 'logs/zip_errors');

	if (!@$_FILES['WS_MODELCONTENTS'] || @$_FILES['WS_MODELCONTENTS']['error']) {
		echo "receive model: Didn't receive file";
		return;
	}
	
	//	Unzip all the stuff
    @rm_recur(IMPORT_PATH);		// Clean up import dir
    exec(UNZIP_COMMAND.' '.$_FILES['WS_MODELCONTENTS']['tmp_name'].' 2>'.ZIP_ERROR);
    if (@filesize(ZIP_ERROR)) {
        echo file_get_contents(ZIP_ERROR);
        return;
    }
    $models = explode(',', $_POST['WS_MODELNAMES']);
    $styles = json_decode($_POST['WS_MODELSTYLES'], 1);

	// Lock concurrent writings, and let us write
	$ws_site->lockData('WRITE');
    
    // Add import prefix to model names, inject in database
    $sql = file_get_contents(IMPORT_PATH.$_POST['WS_SQL_FILE']);
    foreach($models as $model)
		$sql = str_replace("'".$model."'", "'".IMPORT_PREFIX.$model."'", $sql);
	$sql_lines = explode(PHP_EOL, $sql);
	foreach ($sql_lines as $query) {
		if (!empty($query) && !WsSite::execQuery($query)) {
			echo "db error: Couldn't rename model";
            return;
		}
	}
	
	// Walk in the models to make consistency and
	// to prefix all references with import prefix
	$imported_models = '';
	foreach($models as $model_name) { 
		$model = WsTopLevelContainer::Read(IMPORT_PREFIX.$model_name);	// Read the shell
		$model = $model->contents[0];									// Get the nut
		if ($model->user_style)
			$model->user_style = IMPORT_PREFIX.$model->user_style;
		$model->GetAllContents(
			function(&$elt) use ($models, $styles) {
				if (empty($elt->model_id) && !empty($elt->missing_model_id))
					$elt->model_id = $elt->missing_model_id;
		  		if (@$elt->model_id && in_array($elt->model_id, $models))
					$elt->model_id = IMPORT_PREFIX.$elt->model_id;
		  		if ($elt->user_style && array_key_exists('.'.get_class_lower($elt).'_'.$elt->user_style, $styles))
					$elt->user_style = IMPORT_PREFIX.$elt->user_style;
			});
		$model->GetDataFiles(
			function($path) {
				$filename = basename($path);
				$new_path = $path;
				if ($filename && strchr($filename, IMPORT_PREFIX) !== 0){
					$new_path = dirname($path).'/'.IMPORT_PREFIX.$filename;
					copy(IMPORT_PATH.$path, $new_path);
				}
				return $new_path;
			});
        $model->SaveAsModel(IMPORT_PREFIX.$model_name);
        $imported_models .= IMPORT_PREFIX.$model_name.' --> OK\n';
    }
	
	// Import css and associated files
	$css = new WsUserCSS();
	$css_text = $css->GetRules();
	foreach ($styles as $selector => $properties){
		preg_match_all("<background-image.*url\(\"?(\./)*([^\")]+)>", $properties, $result);
		foreach ($result[2] as $path){
			$filename = basename($path);
			$new_path = $path;
			if ($filename && strchr($filename, IMPORT_PREFIX) !== 0){
				$new_path = dirname($path).'/'.IMPORT_PREFIX.$filename;
				copy(IMPORT_PATH.$path, $new_path);
			}
			$properties = str_replace($path, $new_path, $properties);
		}
		$style_name = substr_replace($selector, IMPORT_PREFIX, strpos($selector, '_') + 1, 0);
		$css_text .= "\n".$style_name.$properties;
	}
	$css->Save($css_text);
	echo $imported_models;
    break;

/*
 *  DATA INJECTION
 *  --------------
 *  WS_DATA_FILE=<a ws_data file name>
 *  No return.
 */
case 'data_injection':
	if ($ws_mode != WS_EDIT && $ws_mode != WS_DEBUG)  die($ws_notAllowed);

    require WS_ADMIN_PATH."ws_meta_site.php";
	WsMetaSite::RestoreData($ws_site, $_REQUEST['WS_DATA_FILE']);	// $ws_site is a global setup in ws_preamble.php
    break;

/*
 *	CHECK CAPTCHA
 *  -------------
 * WS_CAPTCHA_ID = captcha id
 * WS_CAPTCHA_NUM = captcha order number in the form
 * WS_CAPTCHA = input code
 * Return OK if valid
 */
case 'check_captcha':
	if (isset($_REQUEST['WS_CAPTCHA'])) {
		session_start();
		if($_REQUEST['WS_CAPTCHA'] == $_SESSION['captcha'][$_REQUEST['WS_CAPTCHA_ID']])
	        echo @$_REQUEST['WS_CAPTCHA_NUM']."-OK";
		else
			echo @$_REQUEST['WS_CAPTCHA_NUM'];
	}
    break;

}

/*
 *  Misc functions
 *  --------------
 */
function ws_site_walk($user_func, &$user_arg, $conditions = ''){
    ini_set('memory_limit', '128M');      // Hope it's enough
    $updated_pages = 0;
	foreach (array(WsSite::TLC, WsSite::TLC_DRAFT) as $tlc_table) {
		$query = "SELECT * from ".$tlc_table." ".$conditions;
 
		$res = WsSite::execQuery($query, 3);
		while ($row = $res->fetch()) {
            $must_rewrite = 0;
		  	$tlc = unserialize($row['serialized_object']);
		  	$all_contents = $tlc->GetAllContents();
		  	for($i = 0; @$all_contents[$i]; $i++) {
		  	    $must_rewrite |= call_user_func_array($user_func, array($row, &$all_contents[$i], &$user_arg));
            }
			if ($must_rewrite) {
        		$query = "UPDATE `".$tlc_table."` SET `serialized_object`=".WsSite::quoteString(serialize($tlc))."
                            WHERE `id`='".$row['id']."' AND `lang`='".$row['lang']."'";
				WsSite::execQuery($query, 3);
				$updated_pages++;
            }
		}
    }
    return $updated_pages;
}

/*
 *  Callbacks for ws_site_walk()
 *  ----------------------------
 */
function ws_add_style_reference($row, &$element, &$references){
	if (@$element->user_style) {
	    $references[$element->user_style][] = "/".$row['lang']."/".$row['url_id'].".html";
	}
	return false;
}
function ws_change_style_name($row, &$element, &$names){
	if (get_class_lower($element) == $names[2] && @$element->user_style === $names[0]) {
		$element->user_style = $names[1];
	    return true;
	} else {
		return false;
	}
}
function ws_add_model_reference($row, &$element, &$references){
	if (@$element->model_id) {
	    $references[$element->model_id][] = "/".$row['lang']."/".$row['url_id'].".html";
	}
	return false;
}
function ws_change_model_name($row, &$element, &$names){
	if (@$element->model_id === $names[0]) {
		$element->model_id = $names[1];
	    return true;
	} else {
		return false;
	}
}
?>
