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
 *  PASSWORD REPLACEMENT
 *  ---------------------------------------
 *  Included by preamble in case of pwd change requested
 */

if (!function_exists('hex2bin')){	// for php<5.4
	function hex2bin($str) {
	    $len = strlen($str);
	    $ret = '';
	    for($i = 0; $i < $len; $i += 2) {
	        $ret .= pack('C',hexdec(substr($str, $i, 2)));
	    }
	    return $ret;
	}
}

$contact_mail = $ws_subscription['contact_mail'];
require WS_ADMIN_PATH."ws_admin_".$ws_subscription['admin_lang'].".php";

if ($id = @$_REQUEST['forgotten_id']) {
    $id = base64_decode(hex2bin($id));
    $limit_time = (int) substr($id, strpos($id, 'Time=') + 5) + 3600;
    $id = substr($id, 0, strpos($id, 'Time='));
    if ($id == $ws_subscription['reference'] && time() < $limit_time) {
        // Confirmation
        $pwd_new = '';
        for ($i = 0; $i < 8; $i++)
            $pwd_new .= chr(rand(48, 122));
        if (mail($contact_mail, 'WEBSICO', $pwd_new, 'From: websico@'.$_SERVER['SERVER_NAME'])) {
            $ws_master_db->UpdateSubscription($ws_subscription['reference'], array('admin_pwd' => md5($pwd_new)));
            sleep(5);   // Anti-spam
            die($ws_new_pwd_sent);
        }
    }
} else {
    // Request
    $reference = $ws_subscription['reference'];
    $client_site = $ws_subscription['client_site'];
    // A bit complicated because of windows local test config
    $confirm_link = 'http://'.$_SERVER['SERVER_NAME'].dirname($_SERVER['SCRIPT_NAME']).'/?mode=1&forgotten_pwd=1&forgotten_id='.bin2hex(base64_encode($reference.'Time='.time()));
    require WS_ADMIN_PATH."ws_mails_".$ws_subscription['admin_lang'].".php";
    mail($contact_mail, $pwd_subject, $pwd_message, 'From: websico@'.$_SERVER['SERVER_NAME'].FORMAT_HEADERS);
    sleep(5);   // Anti-spam
    die($ws_pwd_confirm_sent);
}
?>
