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
$all_headers = "Référence hébergement: ".$reference."\nSite: ".$client_site."\n\nBonjour,\n";

//  PASSWORD CHANGE MESSAGE
//  -----------------------
$pwd_subject = $u_client_site.': Changement de mot de passe';
$pwd_message = $all_headers."
Une demande de changement de mot de passe administrateur pour votre site nous est parvenue.
Si vous confirmez cette demande en cliquant sur le lien ci-dessous, un message contenant un nouveau mot de passe annulant et remplaçant l'ancien vous sera adressé.
Une fois que vous aurez accédé de nouveau à l’administration de votre site, nous vous conseillons de recréer un mot de passe plus familier dans la page d’administration.
Par mesure de sécurité le lien de confirmation est valide 1 heure et le message en retour ne contiendra que ce mot de passe.

".@$confirm_link."
".SUBSCRIPTION_SIGNATURE;
?>