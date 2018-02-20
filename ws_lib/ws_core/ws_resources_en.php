<?php
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
 *  LANGUAGE DEPENDENT DATA
 *  ---------------------------------------
 */

// Model and style management
// --------------------------
$ws_draft_text = "draft";
$ws_public_text = "public";
$ws_th_references = "References";
$ws_select_draft = "Delete draft";
$ws_select_public = "Delete public";
$ws_not_managed ="Not managed";

$ws_th_model = "Model";
$ws_mm_title = "Model management";

$ws_th_component = "Component type";
$ws_th_style = "Style";
$ws_sm_title = "Style management";

$ws_rename_title = "Rename";
$ws_new_name = "New name : ";
$ws_name_exists = "this name is already in use.";

// Element messages
// ----------------
$ws_model_text = "Model: ";
$ws_free_content_title = "free contents ";
$ws_in_model_text = "in model: ";

// Misc
// ----
$ws_cannot_connect = "<br /><br />Server may be down or connection parameters are wrong.<br />";
$ws_page_too_large = "The page you try to record is too heavy.";
$ws_wrong_id = "The chosen name is in use.";
$ws_forbidden_operation = "The requested operation is impossible.";
$ws_not_supported_type = "This file type is not supported.";
$ws_missing_model = "Missing model: ";
$ws_upload_error = "Could not upload the file, verify it's size is lower than ".WS_UPLOAD_MAX_FILESIZE."MB";
$ws_space_full = "Sorry, there is no more available space for your subscription.<br>Please check your subscription in the administration page of your site.";
$ws_obsolet_page = "The operation was aborted because the page has been modified meanwhile. Please retry after automatic reloading.";
$ws_empty_clipboard = "The clipboard content could not be pasted, probably because it was empty.";
$ws_model_recursion = "The operation was aborted because a model cannot be included in itself.";
$ws_form_nesting = "The operation was aborted because a form cannot be included in a form.";
$ws_notAllowed = 'Action not allowed.';
$ws_unknownError = "The operation was aborted because of an unidentified error, please retry.";

// User classes
// ------------
$ws_component_class_list = array(
				"wsstitle"=>"Title",
				"wsimage"=>"Image",
				"wstextarea"=>"Rich text",
				"wsrawtext"=>"Raw text (HTML)",
				"wssdownload"=>"Download (pdf, doc...)",
				"wssmenu"=>"Menu",
				"wsspagepath"=>"Page path",
                "wslangselector"=>"Language selector",
				"wssmailto"=>"Anti-spam mail link",
				"wssform"=>"Form",
				"wssinputfield"=>"Input element",
				"wssbadge"=>"Administration link",
				"wssrssreader"=>"RSS reader",
                "wsshowselection"=>"Selection display"
				);

$ws_class_list = array_merge(array("wsspage"=>"Page", "wscontainer"=>"Block"), $ws_component_class_list);

?>
