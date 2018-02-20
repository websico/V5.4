<?php
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
 *  BUILD IMAGE AT REQUESTED SIZE
 *  ---------------------------------------
 */
// Try to use a relative path because of some obscure issues
// with some providers and url fopen
// Warning: images are supposed to be in same domain as this script

$url = preg_replace('%http://+'.$_SERVER['SERVER_NAME'].'(/)%i', '$1', $_REQUEST['url'], 1);
$script_url = substr($_SERVER['REQUEST_URI'], 0, strpos($_SERVER['REQUEST_URI'], '?'));

if (($l = min(strlen($url), strlen($script_url))) > 0) {
    for ($i = 0; $i < $l && $url[$i] == $script_url[$i]; $i++) ;
    $url = substr($url, $i);
    $script_url = substr($script_url, $i);
    $i = preg_match_all('%[^/]+/%', $script_url, $matches);
    while ($i--)
        $url = '../'.$url;

    list($oldwidth, $oldheight, $type, $attr) = @getimagesize($url);
    ini_set('memory_limit', '128M'); // Sometimes we need more than 16M to create images
    switch ($type) {
        case IMAGETYPE_JPEG:    $im = imagecreatefromjpeg($url); break;
        case IMAGETYPE_GIF:    $im = imagecreatefromgif($url); break;
        case IMAGETYPE_PNG:    $im = imagecreatefrompng($url); break;
    }
    if (@$im) {
    	header("Content-type: image/jpg");

     	if (!empty($_REQUEST['width']) || !empty($_REQUEST['height'])) {
    		$rq_width = empty($_REQUEST['width']) ? 1000000 : $_REQUEST['width'];
    		$rq_height = empty($_REQUEST['height']) ? 1000000 : $_REQUEST['height'];
    		$ratio = min($rq_width / $oldwidth, $rq_height / $oldheight);
    		$newwidth = round($oldwidth * $ratio);
    		$newheight = round($oldheight * $ratio);
    		$newImage = imagecreatetruecolor($newwidth, $newheight);
    		imagecopyresampled($newImage, $im, 0, 0, 0, 0, $newwidth, $newheight, $oldwidth, $oldheight);
    		imagejpeg($newImage, "", 85);
    	} else {
    		imagejpeg($im, "", 100);
    	}
    }
}
?>
