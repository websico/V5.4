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
 *  PERMISSIONS MANAGEMENT
 *  ---------------------------------------
 */


//	Security flags according mode
define ('P_EDIT', 1);						// Edition interface
define ('P_WRITE', 1 << 1);					// Write permission
define ('P_TOOLBARS', 1 << 2);				// Show toolbars
define ('P_DRAFT', 1 << 3);					// Use draft zone
define ('P_SOURCE', 1 << 4);				// Display raw text source (for debug)
define ('P_ADMIN', 1 << 5);					// Administration
define ('P_TRIAL_PAGES', 0);
$ws_permissions = array(WS_VISIT => 0,
					WS_EDIT => P_EDIT | P_WRITE | P_DRAFT | P_TOOLBARS | P_ADMIN,
					WS_PREVIEW => P_DRAFT,
					WS_EXPLORE => P_EDIT | P_TOOLBARS,
					WS_DEBUG => P_EDIT | P_WRITE | P_DRAFT | P_TOOLBARS | P_SOURCE | P_ADMIN
					);
$ws_permissions = @ $ws_permissions[$ws_mode];  // Two times for php <= 4 compatibility
