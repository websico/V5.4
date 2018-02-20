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
 *  BODY SECTION BEGINNING
 *  -------------------------------------------
 */
echo "\n<body>";

//      MISC
//      ----
if ($ws_permissions & P_EDIT) {
	// Divs for select element
	echo '
		<div id="ws_se1" class="ws_se"></div>
		<div id="ws_se2" class="ws_se"></div>
		<div id="ws_se3" class="ws_se"></div>
		<div id="ws_se4" class="ws_se"></div>';
	// Divs for highlight element, after select to be visually above
	echo '
		<div id="ws_he1" class="ws_he"></div>
		<div id="ws_he2" class="ws_he"></div>
		<div id="ws_he3" class="ws_he"></div>
		<div id="ws_he4" class="ws_he"></div>';
	// An image for container menu button (top-left corner when mouse is over)
  		echo '
		<img id="ws_block_corner" style="position: absolute; visibility: hidden" src="'.WS_CORE_PATH.'ws_images/ws_embed.gif">';
 	// A div for container limits
	echo '
		<div id="ws_container_limit"></div>';
	// A div for targets when moving element (by drag-drop)
	echo '
		<div id="ws_near_target"></div>';
	echo '
		<div id="ws_close_target"></div>';
	// A div for color picker
	echo '
		<div id="ws_colormap" class="ws_maintenance_popup" style="position: absolute; visibility: hidden">
		<img src="'.WS_CORE_PATH.'/ws_images/ws_color_scale.jpg">
		<div id="ws_color_blocks"></div>
		</div>';
	// A div for moving message (move a page in sitemap, show model warning, ..)
	echo '
		<div id="ws_movingLabel"></div>';
	// An insulating layer is maintained on window during mouse driven or other modal operations.
	// A CSS class is associated for each operation, setting color, opacity, cursor etc.
	echo '
		<div id="ws_mouse_cache"></div>';
   
}

//      JAVASCRIPT INITS
//      ----------------
echo '
    <script>
    var ws_mode = '.$ws_mode.';
    var ws_permissions = '.$ws_permissions.';
    var ws_dont_explore = '.(@$ws_dont_explore ? '1' : '0').';';
// Can be useful for tracker ...
if (empty($ws_current_tlc->name)) {
	$ws_currentPageName = parse_url($_SERVER['REQUEST_URI']);
	$ws_currentPageName = substr($ws_currentPageName['path'], strrpos($ws_currentPageName['path'], '/') + 1);
} else {
	$ws_currentPageName = $ws_current_tlc->name;
}
echo '
    var ws_currentPageName = "'.htmlspecialchars($ws_currentPageName).'";';
//
echo '
	var WS_CORE_PATH = "'.WS_CORE_PATH.'";
	var WS_EDIT = '.WS_EDIT.';
	var WS_PREVIEW = '.WS_PREVIEW.';
	var WS_EXPLORE = '.WS_EXPLORE.';
	var WS_DEBUG = '.WS_DEBUG.';
	var P_EDIT = '.P_EDIT.';
	var P_WRITE = '.P_WRITE.';
	var P_ADMIN = '.P_ADMIN.';
	var P_TRIAL_PAGES = '.P_TRIAL_PAGES.';
	var WS_CONTAINER = '.WS_CONTAINER.';
	var WS_SYSTEM_CONTAINER =  '.WS_SYSTEM_CONTAINER.';
	var WS_PAGE_CONTAINER =  '.WS_PAGE_CONTAINER.';
	var WS_VERTICAL_CONTAINER = '.WS_VERTICAL_CONTAINER.';
	var WS_HORIZONTAL_CONTAINER = '.WS_HORIZONTAL_CONTAINER.';
	var WS_CONTAINER_ORIENTATION = '.WS_CONTAINER_ORIENTATION.';
	var WS_HTML_TABLED = '.(WS_HTML_TABLED ? 'true' : 'false').';
	var WS_VALIGN_T = '.WS_VALIGN_T.';
	var WS_VALIGN_M = '.WS_VALIGN_M.';
	var WS_VALIGN_B = '.WS_VALIGN_B.';
	var WS_VALIGN = '.WS_VALIGN.';
	var WS_ALONE = '.WS_ALONE.';
	var WS_DROPDOWN = '.WS_DROPDOWN.';
	var WS_DONT_UNCAP = '.WS_DONT_UNCAP.';
	var WS_BUBBLE = '.WS_BUBBLE.';
	var WS_RAWDATA_PATH = "'.WS_RAWDATA_PATH.'";
	var ws_site_name = "'.$ws_site_name.'";
	var ws_user_lang = "'.$ws_user_lang.'";
	var ws_lang = "'.$ws_lang.'";
	var ws_page_langs = ["'.(count($ws_langs_array) > 1 ? implode('", "', $ws_current_tlc->GetLangList()) : $ws_user_lang).'"];
	</script>
    ';

if ($ws_permissions & P_EDIT) {
	$svg_sprite_sheet = WS_CACHE_PATH."spritesheet.svg";
	$script_file = WS_CACHE_PATH."scripts_E_".$ws_lang.".js";
	if (ws_concat(WS_CORE_PATH."ws_images/ws_svg_sprites/"
				, scandir(WS_CORE_PATH."ws_images/ws_svg_sprites/")
				, $svg_sprite_sheet)){
		@unlink($script_file);	// If spritesheet rebuild, force script rebuild
	}
	if (ws_concat(WS_CORE_PATH, array("ws_jglobal.js", "ws_jajax.js",
				"ws_main.js", "ws_str_".$ws_lang.".js",
				"ws_drag.js", "ws_jcontrols.js", "ws_style.js", "ws_style_controls.js", "ws_scrollbar.js",
				"ws_forms.js", "ws_toolbars.js", "ws_element_forms.js", "ws_style_forms.js", "ws_sitemap.js")
				, $script_file)){
		file_put_contents($script_file
						, "document.write('".file_get_contents($svg_sprite_sheet)."');"
						, FILE_APPEND | LOCK_EX);
	}
} else {
	$script_file = WS_CACHE_PATH."scripts.js";
	ws_concat(WS_CORE_PATH, array("ws_jglobal.js", "ws_jajax.js"), $script_file);
}
if ($ws_permissions & P_EDIT) {
	echo
    	"\n".'<div id="user_StyleSheet" style="display: none">'."\n".$ws_css_string."\n</div>".
        (empty($ws_css_draft_string) ? '' :
        "\n".'<div id="user_StyleDraft" style="display: none">'."\n".$ws_css_draft_string."\n</div>").'
		<script>
		var WS_USER_SELECTABLE_CONTAINER = '.WS_USER_SELECTABLE_CONTAINER.';
		var WS_MODEL_CONTAINER = '.WS_MODEL_CONTAINER.';
		var WS_DRAFT = '.WS_DRAFT.';
		var WS_FREE_CONTENTS_IN_MODEL = '.WS_FREE_CONTENTS_IN_MODEL.';
		var WS_TEXT = '.WS_TEXT.';
		var WS_RAWTEXT = '.WS_RAWTEXT.';
		var WS_IMAGE = '.WS_IMAGE.';
		var WS_TEXTAREA = '.WS_TEXTAREA.';
		var WS_ALL_TYPES = 0xffff;
		var WS_PAGE_BOUNDARY = "'.WS_PAGE_BOUNDARY.'";
		var WS_BACKGROUND_PATH = "'.WS_BACKGROUND_PATH.'";
		var WS_LIB_PATH = "'.WS_LIB_PATH.'";
		var WS_HELP_SERVER = "'.WS_HELP_SERVER.'";
		var ws_default_model_shop = "'.$ws_default_model_shop.'";
		var ws_currentPageId = "'.@$ws_current_tlc->id.'";
		var ws_currentUrlId = "'.@$ws_current_tlc->url_id.'";
		var ws_redirUrl = "'.@$ws_current_tlc->redir_url.'";
		var ws_currentPageProperties = '.@$ws_current_tlc->properties.';
		var ws_currentPageName = "'.htmlspecialchars(@$ws_current_tlc->name).'";
		var ws_currentPageTitle = "'.htmlspecialchars(@$ws_current_tlc->title).'";
		var ws_currentPageDescription = "'.htmlspecialchars(@$ws_current_tlc->description).'";
		var ws_noRobots = '.(@$ws_current_tlc->no_robots ? '1' : '0').';
		var ws_noRobotsGlobal = '.(@$ws_norobots ? '1' : '0').';
		var ws_notResponsive = '.(@$ws_current_tlc->not_responsive ? '1' : '0').';
		var ws_noFleximage = '.(@$ws_noFleximage ? '1' : '0').';
		var ws_currentPageHdrHtml = "'.preg_replace('@(["/])@', '\\\\$1', preg_replace("/[\n\r]+/", '\n', @$ws_current_tlc->hdr_html)).'";
		var ws_he_thickness = '.$ws_he_thickness.';
		var ws_se_thickness = '.$ws_se_thickness.';
		var ws_transaction_id = '.@$ws_current_tlc->save_number.';
		';
		// Available languages
		echo
		"\nvar ws_langs = ['".implode("', '", $ws_langs_array)."'];"
		."\nvar ws_requested_lang = \"".$ws_requested_lang.'";';

        // Background images ordered list
		$ws_dir = opendir(WS_BACKGROUND_PATH);
		$ws_bg_array = array();
		$ws_work = "\nvar ws_bgImages = {";
		while (($ws_filename = readdir($ws_dir)) !== false)
		  	if (!is_dir(WS_BACKGROUND_PATH.$ws_filename) && $ws_filename != 'Thumbs.db')
		        $ws_bg_array[$ws_filename] = preg_replace('/^[^_]*_/', '', $ws_filename);
		natcasesort($ws_bg_array);
		foreach($ws_bg_array as $ws_filename => $ws_imagename) {
			$ws_work .= "'".$ws_filename."':'".$ws_imagename."', ";
		}
		echo rtrim($ws_work, ' ,').'};';

		// Sitemap
  		$ws_map = new WsSitemap();
  		echo "\nvar ws_sitemap = ".$ws_map->BuildJS();
  		if ($ws_map->draft)
  			echo "\nvar ws_sitemapIsDraft = true;";
		else
  			echo "\nvar ws_sitemapIsDraft = false;";

		// Class list
		$ws_work = "\nvar ws_componentClasses = {";
		foreach ($ws_component_class_list as $class => $caption) {
			$ws_work .= '"'.$class.'":"'.htmlspecialchars($caption).'", ';
		}
		echo rtrim($ws_work, ' ,').'};';

        // Model list
		$ws_models =
			array_keys(WsTopLevelContainer::GetTLCList("where properties & ".WS_MODEL_CONTAINER));
		natcasesort($ws_models);
		echo "\nvar ws_models = ".(empty($ws_models) ? '0' : "['".implode("', '", $ws_models)."']").';';
		echo "\n</script>";
 
		// Javascripts
		echo '<script src="'.WS_LIB_PATH.'third_party_includes/tiny_mce_V3/tiny_mce.js"></script>'."\n";
	}
echo '<script src="'.$script_file.'"></script>'."\n";

//      RESTORE SCROLL POSITION
//      -----------------------
$scrollX = @$_REQUEST['ws_scrollX'];
$scrollY = @$_REQUEST['ws_scrollY'];
if ($scrollX || $scrollY)
	echo '
		<script>
			addEventListener("load", function() {window.scroll('.$scrollX.', '.$scrollY.');}, false);
		</script>';

//      A GLOBAL TO ECHO AT BEGINNING, AFTER INITS
//      ------------------------------------------
echo @$ws_body_message;
?>
