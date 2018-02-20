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
 *  OUTPUT DOCUMENT DEFINITION AND HEAD SECTION
 *  -------------------------------------------
 */

// Fix user language, compute lang attributes for <html> tag
if (!empty($ws_current_tlc->lang))
    $ws_user_lang = $ws_current_tlc->lang;
else
    $ws_user_lang = $ws_langs_array[0];
$ws_e_lang = (empty($ws_user_lang) ? '' : 'lang="'.$ws_user_lang.'"');

// Output document definition
echo "<!doctype html>\n<html ".$ws_e_lang.'>';

// Head beginning
echo '
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>'.htmlspecialchars($ws_generic_title.(@$ws_no_name_in_title ? '' : $ws_current_tlc->name).' '.@$ws_current_tlc->title).'</title>';
if (!empty($ws_current_tlc->description))
	echo "\n<meta name=\"description\" content=\"".htmlspecialchars($ws_current_tlc->description)."\">";
if (@$ws_norobots || @$ws_current_tlc->no_robots)
	echo "\n<meta name=\"robots\" content=\"noindex, nofollow\">";
if (!@$ws_current_tlc->not_responsive && !@$ws_session->notResponsive)
	echo "\n".'<meta id="viewport" name="viewport" content="width=device-width, initial-scale=1">';

// Some settings before user can alter anything by javascript or unsecured text (eg for free sites)
include WS_ADMIN_PATH.'ws_before_user_code.php';

if (!is_file("icon.ico"))
	copy(WS_LIB_PATH."icon.ico", "icon.ico");
echo '
<meta name="generator" content="Websico">
'.($ws_permissions & P_SOURCE ? htmlspecialchars(@$ws_current_tlc->hdr_html) : @$ws_current_tlc->hdr_html).'
<link rel="shortcut icon" type="image/x-icon" href="icon.ico">';

if ($ws_permissions & P_EDIT) {
	$css_file = WS_CACHE_PATH."system_E.css";
	ws_concat(WS_CORE_PATH,
		array("ws_core_classes.css", "ws_standard_classes.css", "ws_jcontrols.css", "ws_edit_mode.css"),
		$css_file);
} else {
	$css_file = WS_CACHE_PATH."system.css";
	ws_concat(WS_CORE_PATH,
		array("ws_core_classes.css", "ws_standard_classes.css"),
		$css_file);
}
echo "\n".'<link rel="stylesheet" href="'.$css_file.'" type="text/css">';

if (!@$ws_current_tlc->not_responsive && !@$ws_session->notResponsive) {
	if (@filemtime(WS_CACHE_PATH.'responsive.css') < 
			max(@filemtime($ws_site->path."ws_preferences.php"), filemtime(WS_CORE_PATH.'ws_responsive.php'))) {
		include "ws_responsive.php";
	}
	echo "\n".'<link rel="stylesheet" href="'.WS_CACHE_PATH.'responsive.css" type="text/css">';
}
echo $ws_current_tlc->GetUserCss();			// User style sheet associated with actual page

// For IE8-
if (strpos(@$_SERVER['HTTP_USER_AGENT'], 'MSIE') !== false
		&& preg_replace("/.*MSIE ([0-9]+)\..*/", '$1', $_SERVER['HTTP_USER_AGENT']) < 9) {
	// Enable HTML5 elements
	echo "\n".'<script src="//html5shiv.googlecode.com/svn/trunk/html5.js"></script>';
	// Media queries emulation
	echo "\n".'<script src="'.WS_LIB_PATH.'third_party_includes/respond.js"></script>';
}

// Don't display toolbars in some modes
if (!($ws_permissions & P_TOOLBARS)) {
	echo '<style>#ws_pageToolbar, #ws_elementsBar {display: none}</style>';
}
?>