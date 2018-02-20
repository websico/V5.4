<?php
/*
 *  This file is part of WebSiCo: online Web Site Composer, http://websico.net
 *  Copyright (c) 2005-2016 Olivier Seston, http://seston.net
 *  All rights reserved.
 *  --------------------------------------------------------------------------
 */

// THIS FILE MUST BE LOCATED IN THE ROOT DIRECTORY OF THE SITE, WITH INDEX.PHP //
// --------------------------------------------------------------------------- //

// The following main paths are absolute
// The root path can be used to include this file, admin can be out of the tree
define ("WS_SITE_PATH", realpath(pathinfo(__FILE__, PATHINFO_DIRNAME)).'/');
define ("WS_ADMIN_PATH", realpath(pathinfo(__FILE__, PATHINFO_DIRNAME).'/../../ws_admin/').'/');

// Directories are seen from the site root directory, where is located this file.
// Canonical RELATIVE path is very necessary !! (tinyMCE)
// It's a good idea to keep data paths unchanged, as it is not guaranted that they
// are always used by their def's (especially for images in css files...)
define ("WS_CACHE_PATH", 'cache/');
define ("WS_DATA_PATH", 'data/');
define ("WS_RAWDATA_PATH", 'data/rawdata/');
define ("WS_IMAGE_PATH", 'data/images/');
define ("WS_BACKGROUND_PATH", 'data/images/background/');
define ("WS_LOG_DIR", 'logs');

define ("WS_LIB_PATH", 'ws_lib/');
define ("WS_CORE_PATH", 'ws_lib/ws_core/');
define ("WS_WIPPETS_PATH", 'ws_addons/');

// Access modes
define ("WS_VISIT", 0);			// Actually unused, we just test 0, bestially 
define ("WS_EDIT", 1);			// Edition mode
define ("WS_PREVIEW", 2);		// Preview mode
define ("WS_EXPLORE", 3);		// Exploration mode (edit but don't save)
define ("WS_DEBUG", 4);			// Debug mode (don't execute raw text etc..)
define ("WS_TRIAL", 5);			// Demo in a single page, without toolbars
define ("WS_MORE_TRIAL", 6);	// Demo in a single page, with toolbars

// Some other def's
define ("WS_UPLOAD_MAX_FILESIZE", 1000);		// In megabytes
define ("WS_SITE_NAME", basename(getcwd()));
define ("WS_HELP_SERVER", 'https://help.websico.net');
?>
