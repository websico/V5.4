<?php
/*
 *  This file is part of Websico: online Web Site Composer, http://websico.net
 *  Copyright (c) 2009-2016 Websico SAS, http://websico.com
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
 */

// THIS FILE MUST BE LOCATED IN THE ROOT DIRECTORY OF THE SITE, WITH INDEX.PHP //
// --------------------------------------------------------------------------- //

//** MORE CUSTOMIZABLE CONSTANTS ***************************************

// Webmaster contact mail address
// Will be used as "From:" for all forms; some SMTP relays want a valid address
define ("WS_CONTACT_MAIL", 'contact@example.com');

// Timezone
date_default_timezone_set('Europe/Paris');	// Useful if not setup in php.ini

// Site identity
define ("WS_HOSTING_REFERENCE", 'Websico');
define ("WS_SITE_NAME", basename(getcwd()));

// MySQL params, MUST be setup
define ("WS_DB_SERVER", '');
define ("WS_DB_USER", '');		// Lambda user and database are created on the fly
define ("WS_DB_PWD", '');		// if they don't yet exist, this is why we need a user
define ("WS_DB_NAME", '');		// with privileges in that case (and only that case).
define ("WS_ROOT_USER", '');	// Db server user with all privileges
define ("WS_ROOT_PWD", '');

// Utility paths 
// WINDOWS ONLY (uncomment and setup if necessary, useful for uploading and downloading site data)
//define ("WS_7za_PATH", '');
//define ("WS_Mysql_PATH", '');

// Super user password, not user modifiable in the admin page, to allow you to access
// in edit mode without knowing the user's password, also reserved for some future use
//define("WS_SU_PWD", md5('su_pwd'));

// Default starting password and language, modifiable in the admin page of the site
define ("WS_INITIAL_PWD", 'admin');
define ("WS_INITIAL_LANG", 'fr');

//** IN CASE OF RELAY SMTP SERVER **************************************
//define ("WS_SMTP_HOST", '');
//define ("WS_SMTP_PORT", 587);
//define ("WS_SMTP_USER_NAME", '');
//define ("WS_SMTP_USER_PWD", '');

//** LESS CUSTOMIZABLE CONSTANTS ***************************************

// The following main paths are absolute
define ("WS_SITE_PATH", realpath(pathinfo(__FILE__, PATHINFO_DIRNAME)).'/');
define ("WS_ADMIN_PATH", WS_SITE_PATH.'ws_standalone_admin/');

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

// Some other def's
define ("WS_UPLOAD_MAX_FILESIZE", 1000);		// In megabytes
define ("WS_HELP_SERVER", 'https://help.websico.net');
?>
