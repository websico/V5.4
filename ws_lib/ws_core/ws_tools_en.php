<?php
/*
 *  This file is part of Websico: online Web Site Composer, http://websico.net
 *  Copyright (c) 2009-2015 Websico SAS, http://websico.com
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
 *  LANGUAGE DEPENDANT DATA
 *  ---------------------------------------
 *	Language is defined in config file.
 */

$ws_tools_title = 'Site administration';
$ws_preferences_title = 'Preferences';
$ws_editor_language_text = 'Editor language :';
$ws_editor_password_text = 'Editor password :';
$ws_pwd_error = "Password must contain 6 to 32 characters, with at least a special one ('-', '+', '$', ...)";
$ws_timeout_text = 'Password timeout (sec) :';
$ws_title_prefix_text = 'Title prefix for browser windows :';
$ws_no_name_in_title_text = 'Do not include page name in page title :';
$ws_icon_text = 'Site icon (xxx.ico 16x16 recommended) :';
$ws_robots_text = 'Exclude search engines exploration :';
$ws_explore_text = 'Disable exploration mode :';
$ws_site_languages_text = 'Target languages, first one will be used as default<br />IANA registry language codes, Ex: "en, zh, fr, fr-CA" :';
$ws_responsive_title = "Responsive behaviour";
$ws_fleximage_text = "Disable flexible images :";
$ws_column_text = "Disable automatic column arrangement for small widths :";
$ws_XS_Width_text = "XS size = maximum width of extra small device (like smartphone, in pixel units) :";
$ws_S_Width_text = "S size = maximum width of small device (like tablet, in pixel units) :";
$ws_M_Width_text = "M size = maximum width of medium device (like desktop, in pixel units) :";
$ws_model_ix_title = "Import/export of models";
$ws_default_model_shop_text = "Server of models :";
$ws_model_export_authorized_text = "Authorize export of models :";

$ws_update_software_title = 'Program update';
$ws_actual_install_text = 'Current version : ';
$ws_ref_install_text = 'Reference version : ';
$ws_uptodate_text = 'Your program is up to date.';
$ws_outofdate_text = 'A newer version is available. Click to update. Your current site will automatically be saved before updating. You will be able to restore the current version later if necessary.';
$ws_update_software = 'Update now';
$ws_update_later = 'Later';
$ws_confirm_update = "The software will be replaced by a newer version. Don't forget to refresh pages when returning to the site, display may be perturbed.";

$ws_hosts_title = 'Attached domain names';
$ws_detach_host = 'Detach';
$ws_attach_host = 'Attach';
$ws_hosts_text = 'To link names to this site (yourname.com for example), you have to reserve the domain names at a registrar, set their DNS area (type A record) to point to actual server address <b>'.@$_SERVER['SERVER_ADDR'].'</b>, then add them in the following input field.';

$ws_backup_title = 'Site backup';
$ws_backup = 'Full site backup';
$ws_download_data = 'Download site data to your station...';
$ws_upload_data = 'Upload site data from your station: ';
$ws_restore = 'Restore full site saved on ';
$ws_windows_alert = WINDOWS ? 'ATTENTION aux écrasements de fichiers dûs à la gestion majuscule/minuscule des noms de fichier sous Windows !\n\n' : '';
$ws_confirm_restore = "The site will be replaced by a saved version. Don't forget to refresh pages when returning to the site, display may be perturbed.";
$ws_ok_caption = "Ok";

$ws_record_caption = 'Save';
$ws_exit_caption = 'Exit';

$ws_corrupted_pwd = 'Invalid password, unchanged !!';
$ws_cant_edit = 'Some contact and/or bank data must be filled out before exiting !';
$ws_nosite = ' does not exist !!';
?>
