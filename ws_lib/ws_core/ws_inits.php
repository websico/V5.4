<?PHP
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
 *  CORE INITIALIZATIONS
 *  ---------------------------------------
 */
/*print_r($_REQUEST);
echo '<br>';
print_r($_FILES);*/

// Lock all tables during operation to avoid any multiuser write interaction
// (violent but we think efficient and not so expensive)
$ws_site->lockData($ws_permissions & P_WRITE && !empty($_POST['ws_operation']) ? "WRITE" : "READ");

//		EXECUTE USER ACTION IF ANY REQUESTED
//      Save message to display for ws_body_start.php
//		---------------------------------------------
if (!empty($_POST['ws_user_action_page']) && !empty($_POST['ws_user_action_object']))
	if ($tlc =& WsTopLevelContainer::Read($_POST['ws_user_action_page'], $ws_user_lang))
  		if ($element =& $tlc->GetByLocation($_POST['ws_user_action_object']))
            $ws_body_message = $element->Action();

//      UPDATE IF REQUESTED
//      -------------------

// Current top level container
$ws_current_tlc = null;

// Just display a message
//if (@$_REQUEST['ws_operation'] == 'display_message' && @$_REQUEST['ws_message'])
//	WsUtils::WsPopup($_REQUEST['ws_message']);

// We proceed transaction if necessary (not twice as it has been seen ;))
// Object is identified by 'ws_page_id' and 'ws_object_location'
if ($ws_permissions & P_WRITE && !empty($_POST['ws_page_id'])
		&& (($ws_current_tlc =& WsTopLevelContainer::Read($_POST['ws_page_id'], $ws_requested_lang))
		  || ($ws_current_tlc =& WsTopLevelContainer::Read($_POST['ws_page_id'], $ws_langs_array[0])))
		&& !empty($_POST['ws_operation'])) {
	// If we are sure it's a submission with a bad transaction id, popup an error
	if ($_POST['ws_transaction_id'] != $ws_current_tlc->save_number) {
		if (@$_COOKIE['ws_submit'] == 'submit')
			WsUtils::WsPopup($ws_obsolet_page);
	} else {
		if (!empty($_POST['ws_object_location']))
			$ws_target_object =& $ws_current_tlc->GetByLocation($_POST['ws_object_location']);
		else
			$ws_target_object =& $ws_current_tlc;
	    // User language, useful for sitemap operations
	    $ws_user_lang = empty($ws_current_tlc->lang) ? $ws_langs_array[0] : $ws_current_tlc->lang;

		switch($_POST['ws_operation']) {
			
		//	Create a new page
		case 'new_page':
			if ($ws_permissions & P_ADMIN){
				// New lang becomes actual one
				$ws_new_lang = empty($_POST['ws_lang']) ? $ws_langs_array[0] : $_POST['ws_lang'];
			  	$ws_oldid = $ws_current_tlc->id;				// Keep id
			  	$ws_oldurl = $ws_current_tlc->url_id;
			  	$ws_current_tlc =& $ws_current_tlc->CloneElement();
			  	if (WsTopLevelContainer::Read($ws_oldurl, $ws_new_lang))
		            // If page exists with same url_id in new lang, we don't keep old url_id
		    	  	$ws_current_tlc->url_id = $ws_current_tlc->id;
			  	$ws_current_tlc->lang = $ws_new_lang;
			  	if (preg_match('/\+\)$/', $ws_current_tlc->name))
			  		$ws_current_tlc->name = preg_replace('/\+\)$/', '++)', $ws_current_tlc->name);
			  	else
			  		$ws_current_tlc->name .= ' (+)';
				$ws_current_tlc->Save();
				// Move after old page if it exists in langued site map
				$ws_user_lang = $ws_current_tlc->lang;
			  	$ws_sitemap = new WsSitemap();
			  	if (@$ws_sitemap->item_by_id[$ws_oldid]) {
		            $ws_sitemap->item_by_id[$ws_oldid]->MoveAfterMe($ws_sitemap->item_by_id[$ws_current_tlc->id]);
		            $ws_sitemap->Save();
		        }
		        $ws_sitemap = 0;    // Because it's a global cache and it's not a complete init
				// Redirect browser to new page
				echo '
					<script>location.href="'.WsUtils::BuildURL($ws_current_tlc->url_id, $ws_new_lang).'"</script>';
			}
			exit;

		//  Delete an element or a page
		case 'forget':
			$ws_target_object->Forget();
			if (!$ws_target_object->owner)
				$ws_current_tlc = null;     	// If it was a tlc
			else if ($ws_model = $ws_target_object->owner->GetModel())
				$ws_model->SaveAsModel();		// Containing model must be re-saved
			break;

		//  Create and place an element
		case 'add_element':
		  	$ws_moveto_target =& $ws_current_tlc->GetByLocation($_POST['ws_element_move_to_location']);
		  	if ($_POST['ws_type_type'] == "clipboard") {		// Paste clipboard content
		  	    if (!empty($_COOKIE['ws_clipboard']))
			  	    $ws_new_element =& WsTopLevelContainer::Read($_COOKIE['ws_clipboard']);
		  	    if (!empty($ws_new_element)) {
		  	        $ws_new_element = $ws_new_element->contents[0];
				} else {
					WsUtils::WsPopup($ws_empty_clipboard);
					break;
				}
				$ws_new_element->RenewInstance();
			} else if ($_POST['ws_type_type'] == "uclass") {	// A standard element
				$ws_new_element = new $_POST['ws_type']();
			} else {											// A model'd container
                $modelClass = 'WsContainer';
                $shell = WsTopLevelContainer::Read($_POST['ws_type']);
                if (!empty($shell->contents))                        // Get the final class of the model
    		  		$modelClass = get_class($shell->contents[0]);    // Model is first content of tlc
				$ws_new_element = new $modelClass();
				$ws_new_element->SetValue('model_id', $_POST['ws_type']);
			}
			$ws_new_element->MoveTo($ws_moveto_target, $_POST['ws_element_move_to_side']);
			if ($ws_moveto_target->owner && $ws_model = $ws_moveto_target->owner->GetModel())
				$ws_model->SaveAsModel();		// Containing model must be re-saved
			break;

		//  Duplicate an element
		case 'duplicate':
		  	$ws_moveto_target =& $ws_current_tlc->GetByLocation($_POST['ws_element_move_to_location']);
			$ws_new_element = $ws_target_object->CloneElement();
			$ws_new_element->owner = 0;
			$ws_new_element->MoveTo($ws_moveto_target, $_POST['ws_element_move_to_side']);
			if ($ws_moveto_target->owner && $ws_model = $ws_moveto_target->owner->GetModel())
				$ws_model->SaveAsModel();		// Containing model must be re-saved
			break;

		//  Move an element
		case 'move':
		  	$ws_moveto_target =& $ws_current_tlc->GetByLocation($_POST['ws_element_move_to_location']);
			$ws_target_object->MoveTo($ws_moveto_target, $_POST['ws_element_move_to_side']);
			if ($ws_model = $ws_target_object->owner->GetModel())
				$ws_model->SaveAsModel();		// Containing model must be re-saved
			if ($ws_moveto_target->owner && $ws_model = $ws_moveto_target->owner->GetModel())
				$ws_model->SaveAsModel();		// Containing model must be re-saved
			break;

		//  Embed an element in a new container
		case 'embed':
	        if (@$ws_target_object->properties & WS_PAGE_CONTAINER) {
	            // To embed the page we make a new system container with
	            // the contents of the page if necessary, then insert a new
	            // user container between the page and the newly created
	            // system container, in order to keep the page as the outer
	            // container.
	            $ws_parent =& $ws_target_object;
	            if (count($ws_target_object->contents > 1)) {
	                $ws_capsule = new WsContainer(0, 0,
	                				new WsContainer(0,
										$ws_target_object->properties & WS_CONTAINER_ORIENTATION | WS_SYSTEM_CONTAINER | WS_CONTAINER,
										$ws_target_object->contents));
				} else {
		            $ws_capsule = new WsContainer(0, 0, $ws_target_object->contents);
				}
	            $ws_parent->contents = array($ws_capsule);
	        } else {
	            // Embedding a normal element is straightforward, we insert
	            // a new user container between the element and its parent.
	            $ws_parent =& $ws_target_object->owner;
	            $ws_capsule = new WsContainer(0, 0, $ws_target_object);  // MUST use an intermediate variable since PHP5.3 for an obscure reference reason
	     		$ws_parent->contents[$ws_target_object->index] =& $ws_capsule;
	        }
			if ($ws_model = $ws_parent->GetModel())
				$ws_model->SaveAsModel();		// Containing model must be re-saved
			break;

		//  Unembed elements from a container
		case 'unembed':
			$ws_target_object->owner->contents =
	            array_merge(
	                array_slice($ws_target_object->owner->contents, 0, $ws_target_object->index),
	                $ws_target_object->contents,
	                array_slice($ws_target_object->owner->contents, $ws_target_object->index));
			$ws_target_object->contents = array();    // The empty container will be cleared at save time
			if ($ws_model = $ws_target_object->owner->GetModel())
				$ws_model->SaveAsModel();		// Containing model must be re-saved
			break;

		//  Update user style sheet
		case 'update_user_style_sheet':
		  	$ws_user_css = $_POST['ws_user_css_text'];
		  	if (!empty($ws_user_css)) {			// Security check
		  		// Save background image
		  		if (!empty($_FILES['ws_background_image']['tmp_name'][0])) {
		  			move_uploaded_file($_FILES['ws_background_image']['tmp_name'][0], WS_BACKGROUND_PATH.$_POST['ws_filename']);
		  			$ws_user_css = str_replace('BackgroundFilename', WS_BACKGROUND_PATH.$_POST['ws_filename'], $ws_user_css);
	                $ws_must_purge_data = true;
		  		}
		  		// Embed .id rules in case of later deletion of this object (yes, this rule must be deleted with the object to keep css clean)
		  		$ws_target_object->SetValue('embedded_css_rules', $ws_user_css);
		  		// Erase .id rules in the style sheet and save it
	            $ws_css_obj = new WsUserCSS();
	     		$ws_css_obj->Save(trim(preg_replace("/^\.id_[^{}]+{[^}]*}.*/m", '', $ws_user_css)));
			}
			if ($ws_model = $ws_target_object->GetModel())
				$ws_model->SaveAsModel();  // Model must be re-saved
			break;

		//  Save site map
		case 'sitemap':
			$map = new WsSitemap($_POST['ws_sitemap']);
			$map->Save();
			break;

		//  Forget site map
		case 'forget_sitemap':
			$map = new WsSitemap();
			$map->Forget();
			break;

		//  Save a model container
		case 'save_model':
			$ws_target_object->SaveAsModel($_POST['ws_model_name']);
			if (($ws_model = $ws_target_object->owner->GetModel())
									&& $ws_model->model_id != $_POST['ws_model_name'])
				$ws_model->SaveAsModel();	// Containing model must be re-saved because of model_id change !!
			break;

		//  Detach a container from its model
		case 'detach_model':
	        $ws_target_object->SetValue('model_id', 0);
	        $ws_target_object->properties &= ~WS_MODEL_CONTAINER;
			if (($ws_model = $ws_target_object->owner->GetModel()))
				$ws_model->SaveAsModel();	// Containing model must be re-saved because of model_id change !!
			break;

		//	Publish a page and/or associated data (must not be resaved!!)
		case 'publish':
	        $ws_to_publish = explode(',', rtrim(@$_POST['ws_publish_what'], ','));
	        foreach($ws_to_publish as $what) {
	            if ($what == 'sitemap') {               // Publish sitemap
	        		$map = new WsSitemap();
	        		$map->Publish();
	            } else if ($what == 'css') {            // Publish css
	        		$css = new WsUserCss();
	        		$css->Publish();
	            } else {
	        		$ws_current_tlc->Publish($what);	// Publish other objects
	            }
			}

		// End of switch
		}

		//  Process object field values, if any to update, after almost any operation
		//  Each field to update is a request param which name is: ws__{field name}
		if (!in_array($_POST['ws_operation'], array('forget', 'move', 'publish'))) {
			$ws_field_updated = false;
			foreach (array("_REQUEST", "_FILES") as $params)  // Files is intentionnally after Request params (cf WsImage or WsRawtext classes)
				foreach (${$params} as $fieldname=>$value) {
					if ($params == "_FILES") {  // Loop in the multiple files input to check common errors
					    foreach($value['size'] as $ws_fn=>$ws_size) {
				 			if ($ws_size > (WS_UPLOAD_MAX_FILESIZE*1000000) || ($value['error'][$ws_fn] && $value['error'][$ws_fn] != 4)){
			                    $value['tmp_name'][$ws_fn] = 0;
			                    WsUtils::WsPopup($ws_upload_error);
							}
						}
	                }
					if (strpos($fieldname, "ws__") === 0 && $value != "ws_do_not_modify") {  // 0 and not false
						$ws_target_object->SetValue(substr($fieldname, strlen("ws__")), $value);
						$ws_field_updated = true;
					}
	            }
			if ($ws_field_updated) {
				if ($ws_model = $ws_target_object->GetModel())
					$ws_model->SaveAsModel();			// Model must be re-saved
			}
		}

		//  Save and reload current_tlc to be clean and update the very useful save number
		if ($ws_current_tlc) {
	        if ($_POST['ws_operation'] != 'publish') {
	    		$ws_current_tlc->Save();
	    		// If changed url_id or new demo page, redirect browser to it
	        	if ((isset($_POST['ws__url_id']) && $_POST['ws__url_id'] != $_POST['ws_page_id'])
						|| $ws_current_tlc->url_id != $_POST['ws_page_id']) {
	                header("Location: ./".WsUtils::BuildURL($ws_current_tlc->url_id));
	                exit();
	            }
	        }
	    	$ws_current_tlc =& WsTopLevelContainer::Read($ws_current_tlc->url_id, $ws_requested_lang);
		}

		//	Purge images and data files after save (but not after shave... sorry... really)
		if ($ws_must_purge_data)
		  	$ws_site->purgeDataFiles();

	    //  Size may have changed
	    $ws_site->alterSize();

	}
}

// In case it was locked WRITE some deadlock could happen with self rss reading for example
$ws_site->lockData("READ");
?>
