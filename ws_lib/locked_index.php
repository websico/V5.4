<?php
/*
 *  This file is part of WebSiCo: online Web Site Composer, http://websico.net
 *  Copyright (c) 2005-2017 Olivier Seston, http://seston.net
 *	All rights reserved.
 *  --------------------------------------------------------------------------
 *  SHOW A PAGE
 *  ---------------------------------------
 */

//  THIS FILE IS SAVED AS 'LOCKED_INDEX.PHP' IN WS_LIB AND RENAMED AS INDEX.PHP
//  WHEN SITE IS IN ORDER.

// BEFORE ANY OUTPUT
// ---------------------------------------------------
	// Paths and other useful parameters
	require_once "ws_config.php";

	// All inits, database open, updates, ...
	require WS_CORE_PATH."ws_preamble.php";
	$page_id = empty($ws_requested_page) ? "home" : $ws_requested_page;

	// Find page and title, $ws_current_tlc is a global which MUST be set
	// for subsequent operations
	if (!$ws_current_tlc && !($ws_current_tlc = WsTopLevelContainer::Read($page_id, $ws_requested_lang))) {       // Page in user language
        if ($page_id != 'home') {
            // Try home page in requested language
            header("Location: .");
            exit();
        } else if ($ws_requested_lang != $ws_langs_array[0]) {
            // Try home page in default language
            header("Location: ..");
            exit();
        } else if (!($ws_current_tlc =& WsTopLevelContainer::Read('home'))) {
            // Create home page in default language if no unlangued home page
            $ws_site->lockData("WRITE");    // it might be locked for read
      			$ws_current_tlc = new WssPage('home');
      			$ws_current_tlc->lang = $ws_langs_array[0];
      			$ws_current_tlc->Save(true);
        }
	}

	// Produce an RSS feed
	if(@$_REQUEST['output'] == 'rss'){
		header('Content-Type: application/rss+xml; charset=utf-8');
        $buff = $ws_current_tlc->MakeRss(true);
        exit($buff);
	}

	// Is there a redirection for that page
	if (!($ws_mode & WS_EDIT) && !empty($ws_current_tlc->redir_url)) {
		header("Location: ".$ws_current_tlc->redir_url);
		exit();
	}

// HTML HEAD SECTION
// ---------------------------------------------------
    require_once WS_CORE_PATH."ws_head_start.php";
    echo "\n</head>";

// HTML BODY SECTION
// -------------------------------------------------------
	require_once WS_CORE_PATH."ws_body_start.php";
	$ws_current_tlc->Display();
    include WS_ADMIN_PATH."ws_after_user_code.php";
	echo "\n</body></html>";
?>
