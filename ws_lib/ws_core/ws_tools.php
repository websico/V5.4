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
 *  TOOLS PAGE
 *  ---------------------------------------
 */
//	Called by the following command:
//		"ws_tools.html[&subsite=subsite]"
//	Chain of includes:
//	index.php in the actual site directory
//		ws_preamble.php from lib directory
//			ws_preferences.php from the actual site directory,
//			and this file from lib directory
//	So all path variables and controls are these of actual site.
//
//  CAN BE CALLED FROM WEBSICO ADMIN OR SITE PAGE !!!!!!!!!!!!!!!!
//  EXTREME CAUTION ABOUT GLOBAL VARIABLES !!!!!!!!!!!!!!!!!!!!!!!
//	------------------------------------------------------------------------
if (!($ws_permissions & P_ADMIN)
		|| (isset($_REQUEST['subsite'])
			&& $ws_site_name != 'websico'
			&& !($ws_master_db->isChildOf($_REQUEST['subsite'], $ws_site_name))))
    exit(1);          // Die silently if not authorized

require WS_ADMIN_PATH.'ws_meta_site.php';
include "ws_tools_".$ws_lang.".php";    // Language dependent data

if (isset($_REQUEST['subsite'])) {		// Work with a subsite, replace current site
	$ws_master_called = true;
	$subsite = $_REQUEST['subsite'];
    if (!WsMetaSite::SiteExists($subsite))
		WsUtils::WsError($subsite.$ws_nosite, true);
    $ws_site = new WsSite($subsite);
	unset($ws_norobots);
	unset($ws_noFleximage);
	unset($ws_noColumnReduction);
	unset($ws_dont_explore);
	unset($ws_model_export_authorized);
	$ws_bashkroun = '';
	@include ($ws_site->path."ws_preferences.php");
    $ws_langs_array = preg_split("/[^[:alnum:]\-]+/", trim(@$ws_langs));    // commonly done by preamble
    $ws_subscription = $ws_site->master_db->getSubscriptionBySite($ws_site->name);
	$ws_site_name = $ws_site->name;
}
$site = $ws_site;               // Set in preamble or above

//	EXECUTE REQUESTED ACTION
//	------------------------
if (@$_POST['ws_backup']) {
	WsMetaSite::Backup($site);
} else if (@$_POST['ws_download_data']) {
    $tmpfile = $site->path.uniqid('tmp/backup').'.ws_data';
    WsMetaSite::BackupData($site, $tmpfile);
    if (file_exists($tmpfile)) {	// Some error may have occurred during backup (yes)
	    header("Content-Transfer-Encoding: binary" );
	    header("Content-Description: Websico backup file");
	    header("Content-Type: application/octet-stream" );
	    header('Content-Disposition: attachment; filename="'.$ws_site_name.'.ws_data"');
	    header('Expires: 0');
	    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
	    header('Pragma: public');
	    header('Content-Length: '.filesize($tmpfile));
	    ob_end_clean();
	    flush();
		$file = fopen($tmpfile, 'rb');		// A loop instead of readfile() to save memory
		while (!feof($file)) {
			echo fread($file, 1024 * 1024);
			flush();
		}
		unlink($tmpfile);
	}
    exit();
} else if (($data = @$_FILES['ws_upload_data']) && $data['tmp_name']) {
	WsMetaSite::RestoreData($site, $data['tmp_name']);
	header ("Location: ".$_SERVER['REQUEST_URI']);  // Self reload in case of update of preferences
    exit();
} else if (@$_POST['ws_restore']) {
	WsMetaSite::Restore($site, $_POST['ws_restore_folder']);
	header ("Location: ".$_SERVER['REQUEST_URI']);  // Self reload in case of update of this file
    exit();
} else if (@$_POST['ws_update_software']) {
    WsMetaSite::Backup($site);
    WsMetaSite::Update($site->name);
    header ("Location: ".$_SERVER['REQUEST_URI']);  // Self reload in case of update of this file
    exit();
} else if (@$_POST['ws_update_later']) {
	touch($site->path.'update_later', time());
} else if (isset($_POST['ws_detach_host'])) {
    WsMetaSite::DetachHost($site->name, $_POST['ws_host_to_detach']);
} else if (isset($_POST['ws_attach_host'])) {
    $host = strtolower($_POST['ws_host_to_attach']);
    if ($linked = WsMetaSite::AttachHost($site->name, $host))
        echo '<h1 style="color: red">'.$host.' --> ' .$linked.' !!</h1>';
}

//  UPDATE PREFERENCES
//  ------------------
else if (isset($_POST['ws_save_preferences'])) {
    // Unset all params that don't have to be saved
	unset($_POST['ws_save_preferences'],
        $_POST['ws_backup'], $_POST['ws_restore'], $_POST['ws_restore_folder'], $_POST['MAX_FILE_SIZE'],
        $_POST['ws_data_download'], $_POST['ws_data_upload'],
        $_POST['ws_update_software'],
        $_POST['ws_detach_host'], $_POST['ws_host_to_detach'], $_POST['ws_host_to_attach']);

	// Password, in subscription data
	$admin_pwd = @$_POST['ws_bashkroun'];
	if ($admin_pwd && $admin_pwd != 'No Bashkroun') {
		$admin_pwd = substr($admin_pwd, 16).substr($admin_pwd, 0, 16);
        if (strlen($admin_pwd) != 32 || preg_match('/[^0-9a-f]/i', $admin_pwd)) {
            echo '<h1 style="color: red">'.$ws_corrupted_pwd.'</h1>';
        } else {
            $ws_bashkroun = $admin_pwd;
            $ws_master_db->updateSubscription($ws_subscription['reference'], array('admin_pwd'=>$admin_pwd));
		    $_POST['ws_pwd'] = $admin_pwd;	// To keep it also in preferences file
        }
    }
    unset($_POST['ws_bashkroun']);

    // Language, in subscription data
    $ws_lang = $_POST['ws_lang'];
    $ws_master_db->updateSubscription($ws_subscription['reference'], array('admin_lang'=>$ws_lang));
	unset($_POST['ws_lang']);

    // Other preferences in file
	$old_langs_array = $ws_langs_array;
	$preferences = '<?php
/*
 * WebSiCo site preferences
 * File produced by tools.php, handmade modifications at your own risks !!
 */'."\n";
	@copy($site->path."ws_preferences.php", $site->path."ws_preferences.back");
	foreach($_POST as $parameter => $value)
		$preferences .= '$'.$parameter.' = "'.$value.'";'."\n";

	fwrite(fopen($site->path."ws_preferences.php", "w"), $preferences);
	unset($ws_norobots);						// Unset checks before reloading
	unset($ws_noFleximage);
	unset($ws_noColumnReduction);
	unset($ws_dont_explore);
	unset($ws_model_export_authorized);
	require $site->path."ws_preferences.php";	// Reload preferences
	if (($icon = @$_FILES['ws_title_icon']) && $icon['tmp_name'])
        if (strtolower(substr($icon['name'], strrpos($icon['name'], "."))) == '.ico') {
            @unlink($site->path.'icon.ico');
	  		move_uploaded_file($icon['tmp_name'], $site->path.'icon.ico');
        } else {
            echo '<h1 style="color: red">Bad icon file !!"</h1>';
        }
    // Update unique language in pages
    $ws_langs_array = preg_split("/[^[:alnum:]\-]+/", trim(@$ws_langs));    // commonly done by preamble
    if ($ws_langs_array != $old_langs_array
            && count($ws_langs_array) == 1 && count($old_langs_array) == 1) {
        WsTopLevelContainer::ChangeLang($ws_langs_array[0], $old_langs_array[0]);
    }
}

//	REQUEST FORM
//	------------
include "ws_tools_".$ws_lang.".php";    // Language dependent data after change
echo '<!doctype html>
<html class="tools">
<head>
<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
<title>'.$site->name.' - Administration</title>
<link rel="shortcut icon" type="image/x-icon" href="'.$site->path.'icon.ico">
<link rel="StyleSheet" href="'.WS_CORE_PATH.'ws_tools.css" type="text/css">
<script type="text/javascript" src="'.WS_LIB_PATH.'third_party_includes/jap.js"></script>
</head>
<body class="tools">
<script type="text/javascript">
function cache(){
    document.getElementById(\'ws_cache\').style.display = \'block\';
}
function popupProperties(inobj) {
	op = window.open();
	op.document.open("text/html");
	for (objprop in inobj) {
		op.document.write("-***-" + objprop + \' => \' + inobj[objprop] + \'<br>\');
	}
	op.document.close();
	op.focus();
}
function switchNextDivFocus(elt){
	elt = elt.parentNode.getElementsByTagName("div")[0];
	if (elt.className.indexOf(" focus") == -1)
		elt.className += " focus";
	else
	    elt.className = elt.className.replace(" focus", "");
}
</script>
<div id="ws_cache"></div>
';

//  Language + exit
//  ---------------
echo '
<div id="toolbar">
<span id="tools_title">'.$ws_tools_title.'</span>
<a id="infoButton" href="'.WsSite::$protocol.'//help.websico.net/'.$ws_lang.'/man_admin.html" target=_blank title="Documentation"><img src="'.WS_CORE_PATH.'ws_images/question.png"></a>
<a href="javascript:void(0)" class="langChoice" onclick="
            f = document.getElementById(\'preferences\');
            f.ws_lang.value=\'en\'; f.ws_save_preferences.click();" >
    <img src="'.WS_CORE_PATH.'ws_images/flag_en.gif" alt="en" title="Choose English for all administration messages"></a>
<a href="javascript:void(0)" class="langChoice" onclick="
            f = document.getElementById(\'preferences\');
            f.ws_lang.value=\'fr\'; f.ws_save_preferences.click();" >
    <img src="'.WS_CORE_PATH.'ws_images/flag_fr.gif" alt="fr" title="Choisir le Français pour tous les messages d\'administration"></a>
<div style="clear: both"></div>
</div>';
echo '
<button title="'.$ws_exit_caption.'" id="exit_from_tools" href=""
        onclick="';
if (isset($_REQUEST['subsite'])) // If it is a subsite we close the window
	echo 'window.close()';
else
	echo 'document.location.href =\''.(@$ws_session->referer ? $ws_session->referer : '/').'\'';
echo '; return false">'.$ws_exit_caption.'</button>';
echo '
<div id="title"><span id="siteName">'.ucfirst($ws_site_name).'</span> ('.$_SERVER['SERVER_NAME'].')</div>';

//  Personal data
//  -------------
if ($ws_site->offer != 'MultiChild')
	@include WS_ADMIN_PATH."ws_personal_dataV2.php";

//  Subscription data
//  -----------------
if ($ws_site->offer != 'MultiChild')
	@include WS_ADMIN_PATH."ws_subscription_dataV2.php";

//  Preferences
//  -----------
echo '
<div class="group">
<h2 id="preferences_title" onclick="switchNextDivFocus(this)">'.$ws_preferences_title.'</h2>
<div class="body">
<form id="preferences" method="post" enctype="multipart/form-data" action=""
	onsubmit="
            if (ws_bashkroun.value != \'No Bashkroun\') {
                if (ws_bashkroun.value.length < 6 || ws_bashkroun.value.search(/[^a-z0-9]/i) == -1) {
                    ws_bashkroun.value = \'No Bashkroun\';
                    alert(\''.addslashes($ws_pwd_error).'\');
                } else {
                    ws_bashkroun.value = hex_md5(ws_bashkroun.value);
                    ws_bashkroun.value = ws_bashkroun.value.substr(16) + ws_bashkroun.value.substr(0, 16);
            }}"
>
<input type="hidden" name="ws_lang" value="'.$ws_lang.'">
<div class="paramItem">'.$ws_editor_password_text.'
<input type="password" name="ws_bashkroun" value="No Bashkroun">
</div><div class="paramItem">'.$ws_timeout_text.'
<input type="text" size="5" name="ws_protection_timeout" value="'.$ws_protection_timeout.'">
</div><div class="paramItem">'.$ws_title_prefix_text.'
<input type="text" name="ws_generic_title" value="'.$ws_generic_title.'">
</div><div class="paramItem">'.$ws_no_name_in_title_text.'
<input type="checkbox" name="ws_no_name_in_title"'.(@$ws_no_name_in_title ? ' checked="checked"' : '').'>
</div><div class="paramItem">'.$ws_icon_text.'
<input type="file" name="ws_title_icon">
</div><div class="paramItem">'.$ws_robots_text.'
<input type="checkbox" name="ws_norobots"'.(@$ws_norobots ? ' checked="checked"' : '').'>
</div><div class="paramItem">'.$ws_site_languages_text.'
<input type="text" name="ws_langs" value="'.$ws_langs.'">
</div><div class="paramItem">'.$ws_explore_text.'
<input type="checkbox" name="ws_dont_explore"'.(@$ws_dont_explore ? ' checked="checked"' : '').'>
</div>
<div class="subParagraph">
<div class="title">'.$ws_responsive_title.'</div>
<div class="paramItem">'.$ws_fleximage_text.'
<input type="checkbox" name="ws_noFleximage"'.(@$ws_noFleximage ? ' checked="checked"' : '').'>
</div><div class="paramItem">'.$ws_column_text.'
<input type="checkbox" name="ws_noColumnReduction"'.(@$ws_noColumnReduction ? ' checked="checked"' : '').'>
</div><div class="paramItem">'.$ws_XS_Width_text.'
<input type="text" size="5" name="ws_XS_Width" value="'.$ws_XS_Width.'">
</div><div class="paramItem">'.$ws_S_Width_text.'
<input type="text" size="5" name="ws_S_Width" value="'.$ws_S_Width.'">
</div><div class="paramItem">'.$ws_M_Width_text.'
<input type="text" size="5" name="ws_M_Width" value="'.$ws_M_Width.'">
</div></div>
<div class="subParagraph">
<div class="title">'.$ws_model_ix_title.'</div>
<div class="paramItem">'.$ws_default_model_shop_text.'
<input type="text" size="30" name="ws_default_model_shop" value="'.$ws_default_model_shop.'">
</div><div class="paramItem">'.$ws_model_export_authorized_text.'
<input type="checkbox" name="ws_model_export_authorized"'.(@$ws_model_export_authorized ? ' checked="checked"' : '').'>
</div></div>
<button type="submit" name="ws_save_preferences">'.$ws_record_caption.'</button>
</form>
</div>
</div>';

//  Software management
//  -------------------
if (is_dir('../../ws_lib_ref') && (@$ws_master_called || $ws_site->offer != 'MultiChild')) {	// For administered versions
	setlocale(LC_TIME, $ws_lang == 'fr' ? 'fr_FR' : 'en_US');
	$actualVersion = filemtime($site->path.WS_LIB_PATH.'version_time');
	$refVersion = filemtime('../../ws_lib_ref/version_time');
	$mustSay = ($actualVersion < $refVersion && @filemtime($site->path.'update_later') < $refVersion);
	echo '
	<div class="group">
	<h2 id="update_software_title" onclick="switchNextDivFocus(this)">'.$ws_update_software_title.'</h2>
	<div class="body'.($mustSay ? ' focus' : '').'">
	<form method="post" action="">
	    <div class="'.($actualVersion >= $refVersion ? 'uptodate' : 'warning').'">'
	    .$ws_actual_install_text.utf8_encode(strftime("%d %B %Y %H:%M:%S", localToClientTime($actualVersion))).' (V'.WS_VERSION.')'
	    .'<br>'.$ws_ref_install_text.utf8_encode(strftime("%d %B %Y %H:%M:%S", localToClientTime($refVersion))).'</div>';
	if ($actualVersion >= $refVersion)
	    echo $ws_uptodate_text;
	else
	    echo '<br>'.$ws_outofdate_text
	        .'<br><br>
			<button type="submit" name="ws_update_software" value="1"
			onclick="if (confirm(\''.addslashes($ws_confirm_update).'\')) {cache(); return true;} return false;">'.$ws_update_software.'</button>
			&nbsp;<button type="submit" value="1" name="ws_update_later">'.$ws_update_later.'</button>';
	echo '</form></div></div>';
}

//  Host names attachments
//  ----------------------
if (function_exists('symlink') && !WINDOWS
		&& (@$ws_master_called || !in_array($ws_site->offer, array('MultiChild', 'Free', 'Personal', 'Standalone')))) {
    echo '
    <div class="group">
    <h2 id="hostnames_title" onclick="switchNextDivFocus(this)">'.$ws_hosts_title.'</h2>
    <div class="body">
	<form method="post" action="">
    '.$ws_hosts_text.'
    <div class="paramItem" style="white-space: nowrap"><br>
    <button type="submit" disabled="disabled" name="ws_detach_host" id="ws_detach_host">'.$ws_detach_host.'</button>
    <select name="ws_host_to_detach"
        onchange="
            if (this.value != \''.$ws_site_name.'.websico.net\'
                && this.value != \''.$_SERVER['SERVER_NAME'].'\')
                    document.getElementById(\'ws_detach_host\').disabled=0;
            else
                    document.getElementById(\'ws_detach_host\').disabled=1;">';
    foreach(WsMetaSite::GetHosts($site->name) as $host) {
        echo '<option>'.$host.'</option>';
    }
    echo '
    </select>
    <button type="submit" style="margin-left: 2em" disabled="disabled" name="ws_attach_host" id="ws_attach_host" value="1">'.$ws_attach_host.'</button>
    <input type="text" name="ws_host_to_attach"
        onkeyup="
            // Websico string is reserved to admin, ie if subsite param is set
            if (this.value.search(/.+\..{2,}/) != -1'.(isset($_REQUEST['subsite']) ? '' : ' && this.value.search(/websico/i) == -1').'
                && this.value.search(/[^a-z0-9\-_\.]/i) == -1)
                    document.getElementById(\'ws_attach_host\').disabled=0;
            else
                    document.getElementById(\'ws_attach_host\').disabled=1;">
    </div></form></div></div>';
}

//	Backup/Restore
//  ---------------------------------------------------
if (@$ws_master_called || !in_array($ws_site->offer, array('MultiChild', 'Personal'))){
	echo '
	<div class="group">
	<h2 id="backups_title" onclick="switchNextDivFocus(this)">'.$ws_backup_title.'</h2>
	<div class="body">
	<form method="post" enctype="multipart/form-data" action="">';
	if ($ws_site->offer != 'Standalone'){
		echo '
		<button type="submit" name="ws_backup" value="1" onclick="cache()">'.$ws_backup.'</button>';
		if ($bups = @WsMetaSite::BackupFolders($site)) {
		    echo '<br>'.$ws_restore.' <select name="ws_restore_folder">';
		    foreach ($bups as $bup => $time) {
		        echo '<option value="'.$bup.'">'.utf8_encode(strftime("%d %B %Y %H:%M:%S", localToClientTime($time))).'</option>';
		    }
		    echo '</select>
			<input type="submit" class="defaultSubmit" name="ws_restore" value="'.$ws_ok_caption.'"
		            onclick="if (confirm(\''.addslashes($ws_confirm_restore).'\')) {cache(); return true;} return false;">';
		}
	}
	echo '
	<div style="margin-top: 1em">
	<button type="submit" name="ws_download_data" value="1">'.$ws_download_data.'</button>
	</div><div>'.$ws_upload_data.'
	<input type="hidden" name="MAX_FILE_SIZE" value="'.(WS_UPLOAD_MAX_FILESIZE*1000000).'">
	<input id="ws_upload_data" name="ws_upload_data" type="file"
	    onchange="if (confirm(\''.addslashes($ws_windows_alert.$ws_confirm_restore).'\')) {cache(); this.form.submit();} return false;">
	</div></form>';
	echo '
	</div>
	</div>
	';
}

//  Disable exit if some data are missing
if (!$ws_master_db->canEdit($ws_subscription))
    echo '<script>document.getElementById("exit_from_tools").onclick=function(){alert(\''.$ws_cant_edit.'\');return false;}</script>';

//  MESSAGES
//  --------
echo '</div><br clear="left">';

echo '
</body>
</html>';
?>