<?PHP
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
 *  ADMIN MAIL TEXTS
 *  --------------------------------------------------------------------------
*/
define ("FORMAT_HEADERS", "\nContent-Type: text/plain; charset=UTF-8"
                        ."\nContent-Transfer-Encoding: 8bit");
define ("SUBSCRIPTION_SIGNATURE", "\nWebsico management.");

$u_client_site = strtoupper($client_site);
$all_headers = "Hosting reference: ".$reference."\nSite: ".$client_site."\n\nHello,\n";

//  PASSWORD CHANGE MESSAGE
//  -----------------------
$pwd_subject = $u_client_site.': Password change';
$pwd_message = $all_headers."
We have received a password change request for your site.
Please confirm the request by clicking the link hereafter, you will receive a message containing a regenerated password to access administrative mode.
The confirmation link must be clicked within 1 hour, the reply message contains only the new password.
If you do not confirm, the password will remain unchanged.

".@$confirm_link."
".SUBSCRIPTION_SIGNATURE;
?>