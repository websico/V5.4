<?PHP
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
 *  PREAMBLE
 *  ---------------------------------------
 *  /////////////////////////////////////////////
 *  THIS FILE MUST BE INCLUDED BEFORE ANY OUTPUT.
 *  /////////////////////////////////////////////
 */

//	Include site def's and class
require_once "ws_site.php";

//	Config global variables
require_once "ws_default_config.php";			// Released config file
@include "ws_preferences.php";                  // Site preferences file overload
if (empty($ws_site_name))                       // Site name MUST be set
    WsUtils::WsError("Site name undefined", true);

//	Global management variables
$ws_master_db = 0;          // The master database object
$ws_subscription = 0;       // The subscription record for that site
$ws_site = 0;               // Actual site object
			
// Retain output because of:
// - possible redirection to another page (backup for egs)
// - put all non-scoped style elements in the head section (to be W3C valid)
// See also the Action() in some classes (WssForm) 
ob_start('fix_styles');
$ws_glob_styles = '';
function fix_styles($buf){  // not bullet-proof, cause doesn't not process comments
    global $ws_mode;
    if (!$ws_mode){
        global $ws_glob_styles;
        $endhead = stripos($buf, '</head>');
        $head = substr($buf, 0, $endhead);
        $body = substr($buf, $endhead);
        $body = preg_replace_callback('#<\s*style[^>]*>[^<]+<\s*/style[^>]*>#i', 'replace_styles', $body);
        return $head.$ws_glob_styles.$body;
    }
    return $buf;
}
function replace_styles($match){
    global $ws_glob_styles;
    if (!(preg_match('#<\s*style.*\s+scoped[\s>]#', $match[0]))){
        $ws_glob_styles .= $match[0];
        return '';
    }
    return $match[0];
}

//	Cleanup args
if (get_magic_quotes_gpc()) {
	// Must be done for each potentially dangerous table...
	foreach ($_REQUEST as $key => $value)
		$_REQUEST[$key] = stripslashes($value);
	foreach ($_POST as $key => $value)
		$_POST[$key] = stripslashes($value);
	foreach ($_GET as $key => $value)
		$_GET[$key] = stripslashes($value);
}

//  Redirect to 404 in some prohibition cases
if (!($ws_master_db = new WsMasterDB())
        || !($ws_subscription = $ws_master_db->getSubscriptionBySite($ws_site_name))) {
    include "ws_core_classes.php";
    WsUtils::WsError('', true);
}
if ($ws_subscription['status'] & (WsMasterDB::SB_DEAD | WsMasterDB::SB_ZOMBIE)
        || $ws_subscription['alert_level'] == WsMasterDB::SB_DESTROYED) {
    ws_exit404();
}
  
$ws_lang = $ws_subscription['admin_lang'];             // Maintenance language

//  Requested language is extracted from uri. Ex: xxxxxx/en/ccc.html -> lang is 'en'
//  Requested page is extracted from uri. Ex: xxxxxxx/en/ccc.html -> page is 'ccc'
//  URI is fixed to be clean in browser address bar
//  All that stuff is a little bit complicate, but it must work for local test config and
//	for standalone sites located in any directory.
if (empty($ws_langs))       // Valid languages
    $ws_langs = $ws_lang;
$ws_langs_array = preg_split("/[^[:alnum:]\-]+/", trim($ws_langs));
$ws_default_lang = $ws_langs_array[0];

$ws_uri_name = basename(preg_replace("/\?.*$/", '', $_SERVER['REQUEST_URI']));
$dotHtml = strrpos($ws_uri_name, $ws_url_suffix);
if ($dotHtml != strlen($ws_uri_name) - strlen($ws_url_suffix)
        && $ws_uri_name && !in_array($ws_uri_name, $ws_langs_array)
        && !@$ws_no_page_request
        && $ws_uri_name != basename(getcwd()))
    ws_exit404();
$ws_requested_page = substr($ws_uri_name, 0, $dotHtml);
 
$ws_requested_lang = $ws_uri_name;
if (!in_array($ws_requested_lang, $ws_langs_array))
    $ws_requested_lang = basename(dirname($_SERVER['REQUEST_URI']));
if (!in_array($ws_requested_lang, $ws_langs_array))
    $ws_requested_lang = '';

$ws_fixed_uri = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));	// IIS
if ($ws_fixed_uri != '/')
    $ws_fixed_uri .= '/';
if ($ws_requested_lang && $ws_requested_lang != $ws_default_lang)
    $ws_fixed_uri .= $ws_requested_lang.'/';
if ($ws_requested_page || @$ws_no_page_request)
    $ws_fixed_uri .= $ws_uri_name;
if (($ws_uri_params = strpos($_SERVER['REQUEST_URI'], '?')) !== false)
    $ws_fixed_uri .= substr($_SERVER['REQUEST_URI'], $ws_uri_params);
if ($ws_fixed_uri != $_SERVER['REQUEST_URI']) { // Reload to fix browser address bar
    header("Location: ".$ws_fixed_uri);
    exit();
}

if (empty($ws_requested_lang))
    $ws_requested_lang = $ws_default_lang;		// Default requested language
$ws_user_lang = $ws_requested_lang;             // Unfixed user language, necessary for some classes

// Open session once for all !!
define ("WS_SESSION_PATH", 'ws_sessions/');
define ("WS_SESSION_TIMEOUT", $ws_protection_timeout * 2);
require 'ws_session.php';
$ws_session = new ws_UserSession("ws_session_".$ws_site_name);

// Control responsive display
if (@$_REQUEST['responsive'] == 'no'){
	$ws_noFleximage = true;
	$ws_session->notResponsive = true;
} else if (@$_REQUEST['responsive'] == 'yes'){
	unset($ws_session->notResponsive);
} else if (@$ws_session->notResponsive){
	$ws_noFleximage = true;
} 
  
// Mode management (0 = public, ...)
if (@$_REQUEST['ws_operation'] == 'logout' || isset($_REQUEST['abort'])) {
    $ws_session->logout();
    $_REQUEST['mode'] = 0;
    $_POST['mode'] = 0;     // For login reloads
}
$rq_mode = @$ws_session->mode ? $ws_session->mode : 0;		// Previous mode
if (isset($_REQUEST['mode']))			// Requested mode
	$rq_mode = $_REQUEST['mode'];
if ($ws_subscription['alert_level'] >= WsMasterDB::SB_NO_VISIT)
    $rq_mode = WS_EDIT;
if (@$_REQUEST['forgotten_pwd'])        // Admin password reset
    include WS_ADMIN_PATH.'ws_pwd_replace.php';

// (very) old browser compatibility, with no display=table
if (strpos(@$_SERVER['HTTP_USER_AGENT'], 'MSIE') !== false
		&& preg_replace("/.*MSIE ([0-9]+)\..*/", '$1', $_SERVER['HTTP_USER_AGENT']) < 8) {
	define ("WS_HTML_TABLED", true);    // IE7-
} else {
	define ("WS_HTML_TABLED", false);     // Other browsers
}

// Login, fix access mode
$valid_users = array('admin' => $ws_subscription['admin_pwd']);
if (defined("WS_SU_PWD"))
	$valid_users['SuperUser'] = WS_SU_PWD;
if (in_array($rq_mode, array(WS_EDIT, WS_PREVIEW, WS_DEBUG))
		|| $ws_master_db->isFactory($ws_subscription['offer'])) {		// Protected modes
	$ws_session->login($valid_users, $ws_protection_timeout);
	$ws_mode = $rq_mode;
} else if (@$ws_protected) {
    $ws_session->login($valid_users, $ws_protection_timeout, $ws_login_warning);
	$ws_mode = $rq_mode;
} else if ($rq_mode == WS_EXPLORE) {								// Exploration mode
	$ws_mode = @$ws_dont_explore ? @$ws_session->mode : $rq_mode;
} else if ($rq_mode && ($rq_mode == @WS_TRIAL || $rq_mode == @WS_MORE_TRIAL)) {		// Trial modes
	$ws_mode = $rq_mode;
	if (!preg_match('/^_[0-9,a-f]{13}$/i', @$ws_session->user)){
		$ws_session->user = uniqid('_');
	}
} else {
	$ws_mode = 0;
}

//	Security flags according mode and kind of subscription
require WS_ADMIN_PATH.'ws_permissions.php';
if (!defined("P_TRIAL_PAGES"))
	define("P_TRIAL_PAGES", 0);
if ($ws_master_db->isFactory($ws_subscription['offer']))
	$ws_permissions |= P_ADMIN;

// Fix admin lang for trial modes
if ($ws_permissions & P_TRIAL_PAGES && $ws_user_lang != 'fr')
	$ws_lang = 'en';

// Save the session for next access
if (!@$ws_asynchronous_request && $ws_session->user) {
	$ws_session->mode = $ws_mode;
	if (@$_REQUEST['ws_referer'])  // Must be kept intact if not present
        $ws_session->referer = $_REQUEST['ws_referer'];
    // As the site could be accessed via several iframes in a short time,
    // we keep the same session id to prevent a session recreation (cf ws_session.php)
    // Another very special case is while importing models, as the import operation is initiated
    // by the model shop server.
	// Also ws_tools can be called by a supervisor for some children sites, in multiple windows,
	// or when i'm invoked to produce an rss feed.
	$ws_session->save($ws_permissions & P_TRIAL_PAGES
						|| ($ws_requested_page == 'ws_service' && @$_POST['WS_CMD'] == 'import_model')
						|| ($ws_requested_page == 'ws_tools' && @$_REQUEST['subsite'])
						|| @$_REQUEST['output'] === 'rss');
}

//  Edition permission control
if (($ws_mode == WS_EDIT) && !$ws_master_db->canEdit($ws_subscription)
        && $ws_uri_name != "ws_tools.html") {
    header("Location: ./ws_tools.html");
	exit();
}

// Language dependent strings
include "ws_resources_".$ws_lang.".php";

//	Core classes and options, some of them are mode dependent
require "ws_core_classes.php";
require "ws_standard_classes.php";

//  Open current site, data verification, get all params etc.
$ws_site = new WsSite($ws_site_name);

//  New version check (for administred version)
if (file_exists('../../ws_lib_ref/version_time') && $ws_mode == WS_EDIT && $ws_session->freshly_logged
		&& $ws_uri_name != "ws_tools.html") {
	$ws_actualV = filemtime($ws_site->path.WS_LIB_PATH.'version_time');
	$ws_refV = filemtime('../../ws_lib_ref/version_time');
	if ($ws_actualV < $ws_refV && @filemtime($ws_site->path.'update_later') < $ws_refV) {
		header("Location: ./ws_tools.html");
		exit();
	}
}

//	Redirection to special pages
if ($ws_requested_page == 'ws_see_invoice') {
    include WS_ADMIN_PATH.$ws_requested_page.'.php';
	exit();
}
if (in_array($ws_requested_page, array('ws_tools', 'ws_service'))) {
    include $ws_requested_page.'.php';
	exit();
}
if ($ws_requested_page == 'ws_children') {
    include WS_CORE_PATH.'../ws_multisite/'.$ws_requested_page.'.php';
	exit();
}

//	---------------------------------------------------------
//	UTILITIES
//	---------------------------------------------------------
function ws_exit404() {
    header('HTTP/1.1 404 Not Found');
    exit('<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
        <html><head>
        <title>404 Not Found</title>
        </head><body>
        <div style="font-size: 1.5em; text-align: center; margin-top: 25%">
        	<a href="/"><img src="'.WS_CORE_PATH.'ws_images/logo_450.png" style="width: 15em; max-width: 80%"></a>
	        <h1>Not Found</h1>
	        <p>The requested URL was not found in this site.</p>
	    </div>
        </body></html>'
        );
}

//  Go to real work
//	MUST BE AT THE END OF THIS FILE BECAUSE OF SOME FUNCTION DEFINITION
if (!@$ws_no_page_request)
	require_once WS_CORE_PATH."ws_inits.php";
?>
