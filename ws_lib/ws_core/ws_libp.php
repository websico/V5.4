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
 *	UTILITIES
 *	---------------------------------------------------------
 */

//  Recursive file copy
//  -------------------	
function copy_recur($src, $dst) {
    if (is_file($src))
		if (copy($src, $dst)) {
	    	touch($dst, filemtime($src));
	    	return true;
	    } else {
			return false;
		}
	if (!is_dir($dst))
		mkdir($dst, 0777, true);
    $dir = dir($src);
    while (($entry = $dir->read()) !== false) {
        if ($entry != '.' && $entry != '..')
	        copy_recur($src.'/'.$entry, $dst.'/'.$entry);
    }
    $dir->close();
    return true;
}

//  Recursive file remove
//  ---------------------
function rm_recur($path) {
	if ($path == '.' || $path == '/.' || $path == '..' || $path == '/..')
		return false;
	if (!is_dir($path) || is_link($path))
	    return unlink($path);
    $dir = dir($path);
	while (($entry = $dir->read()) !== false) {
		if ($entry != '.' && $entry != '..')
			if (!rm_recur($path.'/'.$entry))
				return false;
    }
    $dir->close();
	return rmdir($path);
}

//  Recursive filesize
//  ------------------
function filesize_recur($path) {
    $size = 0;
    if ($dir = @dir($path)) {
        while (($entry = $dir->read()) !== false)
            if ($entry != '.' && $entry != '..')
    	        $size += filesize_recur($path.'/'.$entry);
        $dir->close();
    }
    return $size + @filesize($path);
}

//  Files concatenation and basic cleanup
//  Used in various contexts, maybe should have a
//  callback parameter, better than type tests.. 
//  ---------------------------------------------
function ws_concat($path, $fileArray, $outFile){
	$modification_time = 0;
	foreach($fileArray as $value)
		$modification_time = max(filemtime($path.$value), $modification_time);
	$compress_time = @filemtime($outFile);
	if (!$compress_time || $compress_time < $modification_time || $compress_time < filemtime(__FILE__)) {
		if (!strcasecmp(substr($outFile, -4), '.svg')) {
			$svg = 1;
			$buf = '<svg style="display: none" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
		} else {
	    	$buf = '';
	    }
	    foreach ($fileArray as $fn){
	    	if (is_file($path.$fn)){
	    		if (@$svg){
	    			$s = file_get_contents($path.$fn);
	    			$s = preg_replace('/(^.*<svg[^>]*>)|(<\s*\/svg>\s*$)/is', '', $s);
	    			$buf .= '<symbol id="'.substr($fn, 0, strrpos($fn, '.')).'">'.$s.'</symbol>';
				} else {
	        		$buf .= file_get_contents($path.$fn);
	        	}
			}
	    }
	    if (@$svg)
	    	$buf .= '</svg>';
		// Strip comments: bug with url (http://...), break this kind of line :(
		if (!@$svg)
	    	$buf = preg_replace('<(/\*.*?\*/)|(//.*?[\n\r]\s*)>s', '', $buf);
		// Strip newlines
		$buf = preg_replace('<;\s*[\n\r]\s*>', ';', $buf);
		$buf = preg_replace('<\s*[\n\r]\s*>', ' ', $buf);

		// More JS compression
		if (!strcasecmp(substr($outFile, -3), '.js')) {
			// Rename some global objects
			$buf = (preg_replace('<\$Forms>', '\$1', $buf));
			$buf = (preg_replace('<\$Str>', '\$2', $buf));
			$buf = (preg_replace('<\$Drag>', '\$3', $buf));
		}
		fwrite(fopen($outFile, "w"), $buf);
		return true;
	}
	return false;
}

//  Return a string with value converted in
//  human units K, M or G
//  ---------------------------------------
function human_unit($value) {
	if (($value = (int)($value/1000)) < 5000)
		return $value.'K';
	if (($value = (int)($value/1000)) < 5000)
		return $value.'M';
	return (int)($value/1000).'G';
}

//  Convert local time to client time
//  Client timezone offset must have been set in a cookie,
//  in minutes and signed client-utc :
//  document.cookie = "timezoneOffset=" + (-((new Date()).getTimezoneOffset())) + ";path=/";
//  ------------------------------------------------------
function localToClientTime($time) {
    if ($cTzo = @$_COOKIE["timezoneOffset"]) {
        $lTzo = sscanf(date("P", $time), "%d:%d");
        $lTzo = $lTzo[0] * 60 + $lTzo[1];
        $time += ($cTzo - $lTzo) * 60;
    }
    return $time;
}

//  Full email address verification.
//  Syntax and existence of destination are checked.
//  Inspired from some Google code.
//  $source must be a valid mail address, different from $destination,
//  because checked by some mail servers.
//  VERY BAD IDEA, SOME MAIL SERVER DON'T LIKE THAT AND BLACKLIST YOUR HOST !!!
//  ------------------------------------------------------------------
/*function isInvalidMail($destination, $source) {
    $HTTP_HOST = isset($_SERVER["SERVER_NAME"]) ? $_SERVER['SERVER_NAME']: $_SERVER["HTTP_HOST"];
    $error = 0;

    // First we check syntax
    if (preg_match('/^([_a-z0-9\.\-]+)@([_a-z0-9\.\-]+\.[a-z]{2,4})$/', $destination, $test_mail)) {
        $user = $test_mail[1];
        $domain = $test_mail[2];

        // Local test
        if (!function_exists('checkdnsrr'))
            return $error;
        if ($_SERVER['SERVER_NAME'] == 'websico.home')
            return !checkdnsrr($domain);

        // If there is no MX record simply @ to next time address socket connection do.
        $connectAddress = getmxrr($domain, $MXHost) ? $MXHost[0] : $domain;

        if(($connect = @fsockopen($connectAddress, 25))) {
            // Success in socket connection
            // Judgment is that service is preparing though begin by 220 getting string after connection.
            if (ereg("^220", $out = fgets($connect, 1024))) {

                // Inform client's reaching to server who connect.
                fputs($connect, "HELO $HTTP_HOST\r\n" );
                $out = fgets($connect, 1024);

                // Inform sender's address to server (sender = destination..)
                fputs ($connect, "MAIL FROM: <{$source}>\r\n" );
                $from = fgets($connect, 1024);

                // Inform listener's address to server.
                fputs($connect, "RCPT TO: <{$destination}>\r\n");
                $to = fgets($connect, 1024);

                // Finish connection.
                fputs($connect, "QUIT\r\n");
                fclose($connect);

                // Server's answering cord about MAIL and TO command checks.
                // Server about listener's address reacts to 550 codes if there does not exist
                // checking that mailbox is in own E-Mail account.
                if (!ereg("^250", $from) || !ereg("^250", $to))
                    $error = 4;     // Recipient not found
            } else
                $error = 3;         // Bad answer from mail server
        } else
            $error = 2;             // Can't connect to mail server
    } else
        $error = 1;                 // Bad syntax
    return $error;
}*/

//	Send a mail with the help of PHPMailer
//	It is supposed to be HTML if and only if text begins with '<html'
//	-----------------------------------------------------------------
function ws_mail($to, $from, $replyTo, $subject, $msg, $files = 0) {
	require_once WS_SITE_PATH.WS_LIB_PATH.'third_party_includes/PHPMailer/PHPMailerAutoload.php';
	
	$mail = new PHPMailer;

	if (defined('WS_SMTP_HOST')){
		$mail->isSMTP();
		$mail->Host = WS_SMTP_HOST;
		if (defined('WS_SMTP_PORT'))
			$mail->Port = WS_SMTP_PORT;
		if (defined('WS_SMTP_USER_NAME')){
			$mail->SMTPAuth = true;
			$mail->Username = WS_SMTP_USER_NAME;
			$mail->Password = @WS_SMTP_USER_PWD;
		}
	}

	$mail->CharSet = 'utf-8';
	
	$addr = explode(',',$to);	// Allow multiple mail addresses
	foreach ($addr as $ad) {
	    $mail->AddAddress(trim($ad));       
	}
	$mail->setFrom($from);
	if (!empty($replyTo)) {
		$addr = explode(',',$replyTo);	// Allow multiple mail addresses
		foreach ($addr as $ad)
		    $mail->addReplyTo(trim($ad));       
	}
	$mail->Subject = $subject;
	if (stripos(trim($msg), '<html') === 0)
		$mail->msgHTML($msg);
	else
		$mail->Body = $msg;
		
	if ($files)
		foreach ($files as $file)
			$mail->addAttachment($file['path'], $file['name']);

	if (!$mail->send()) {
	    trigger_error("Mailer Error: ".$mail->ErrorInfo);
		return false;
	}
	return true;
}

//	Basic string crypting, mail address for example
//  a simple shift of char code, in interval [-2, 1] to avoid '\'
//	-------------------------------------------------------------
function stringEncode($str) {
/*  Javascript
	res = "";
	for(var i = 0; i < str.length; i++)
		res += String.fromCharCode(str.charCodeAt(i) - i%4 + 1);
*/
	$res = "";
	$l = strlen($str);
	for ($i = 0; $i < $l; $i++) {
		$c = ord($str[$i]);
	    $res .= chr($c - $i%4 + 1);
	}
	return $res;
}
function stringDecode($str) {
	$res = "";
	$l = strlen($str);
	for ($i = 0; $i < $l; $i++) {
		$c = ord($str[$i]);
	    $res .= chr($c + $i%4 - 1);
	}
	return $res;
}
?>
