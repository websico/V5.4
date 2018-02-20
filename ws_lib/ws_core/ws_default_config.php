<?PHP
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
 *  CONFIGURATION
 *  ---------------------------------------
 */

//  DEFAULT PREFERENCES
//	-------------------

//  Maintenance mode management
$ws_protection_timeout = 30*60;                     // Unused password lifetime in seconds

$ws_XS_Width = 320;									// Maximum screen widths for responsive
$ws_S_Width = 640;
$ws_M_Width = 1280;

$ws_default_model_shop = 'https://modelshop.websico.net';

//  Miscellaneous
$ws_site_name = WS_SITE_NAME;
$ws_generic_title = ucfirst($ws_site_name).' - ';   // Window title preamble

//  DEFAULT CONFIG AND OPTIONS FOR ALL SITES
//  ----------------------------------------
//	URL rewriting: suffix will be added to page id by the standard class menu, so
//	.htaccess must be configured (by hand) according to these data.
$ws_url_suffix = ".html";					// Suffix for url rewriting

//	Maintenance mode parameters
$ws_image_default_width = 200;
$ws_image_default_height = 200;

$ws_he_thickness = 4;							// Highlight element thickness
$ws_se_thickness = 4;							// Select element thickness
?>
