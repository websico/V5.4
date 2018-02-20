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
 *  SITE CLASS
 *  ---------------------------------------------
 */

define ("WS_VERSION", 5.4);						// PRODUCT VERSION NUMBER

require_once WS_ADMIN_PATH."ws_master_db.php";
require_once "ws_libp.php";

class WsSite {

    //  Variables
    var $master_db;     	// Master database object
    var $name;
    var $path;
    private static $pdo;				// Static to allow static db accesses (one site at a time)
	public static $protocol = 'http:';  // Fixed at construct

    //	Some constants
    const SIZE_FILE = 'logs/site_size';
    const TRAFFIC_FILE = 'logs/site_traffic';

    //  Database structure
    const MAP = 'ws_map';
    const MAP_DRAFT = 'ws_map_draft';
    const TLC = 'ws_tlc';
    const TLC_DRAFT = 'ws_tlc_draft';
    const USER_CSS = 'ws_user_css';
    const USER_CSS_DRAFT = 'ws_user_css_draft';
    const SYSTEM = 'ws_system';
    static $tables = array(
        self::MAP, self::MAP_DRAFT,
        self::TLC, self::TLC_DRAFT,
        self::USER_CSS, self::USER_CSS_DRAFT,
        self::SYSTEM
    );
    private static $create_table = array(
            'ws_map' => " (
                `lang` varchar(8) NOT NULL default '',
                `map_array` blob,
                PRIMARY KEY  (`lang`)
                ) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;",
            'ws_tlc' => " (
                `id` varchar(45) NOT NULL DEFAULT '',
                `lang` varchar(8) NOT NULL,
                `url_id` varchar(256) DEFAULT NULL,
                `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                `name` varchar(45) DEFAULT NULL,
                `properties` int(11) DEFAULT '0',
                `serialized_object` mediumblob,
                PRIMARY KEY (`id`,`lang`),
                KEY `url` (`lang`,`url_id`)
                ) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;",
            'ws_user_css' => " (
                `id` varchar(45) NOT NULL default '',
                `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                `csstext` text,
                PRIMARY KEY  (`id`)
                ) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;",
            'ws_system' => " (
                `data_version` float NOT NULL,
                `last_id` smallint(5) NOT NULL default 0,
                `purge_counter` smallint(3) NOT NULL default 0,
                `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;");

    //  CONSTRUCTOR
    //	-----------------------------------------------
    function __construct($site_name, $site_path = false) {

		// Fix actual access protocol for anybody
		self::$protocol = (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] == 'off') ? 'http:' : 'https:';

        // Get site params from master db
        if (!($this->master_db = new WsMasterDB()))
            WsUtils::Error('', true);
        $params = $this->master_db->getSiteParams($site_name);
        foreach ($params as $key => $value)
        	$this->{$key} = $value;

        // Setup some other variables
        $this->name = $site_name;
        $this->path = $site_path ? $site_path : $params['relative_path'];

        // Setup data and other useful folders
        $fowner = fileowner($this->path);
        $fgroup = filegroup($this->path);
        foreach(array($this->path.WS_CACHE_PATH,
                        $this->path.WS_BACKGROUND_PATH,
                        $this->path.WS_RAWDATA_PATH,
                        $this->path.WS_LOG_DIR,
                        $this->path.'24h') as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);	// Site directories, from site name to bg images
                chown($dir, $fowner);       // In case we are running under root (admin)
                chgrp($dir, $fgroup);
            }
        }

        // Setup database, version control
		self::$pdo = new PDO('mysql:host='.$this->db_server, $this->db_user, $this->db_pwd);
		self::execQuery('SET NAMES utf8', 3);
		self::execQuery('CREATE DATABASE IF NOT EXISTS `'.$this->db_name.'`', 3);
		self::execQuery('use `'.$this->db_name.'`', 3);
        
		if ($res = self::execQuery("SELECT * FROM ".self::SYSTEM))	        	
			$system_record = $res->fetch();

        // We MUST NOT update if we are running under an other site
        // than the one which is being opened (cf ws_default_config.php, $ws_site_name set up).
        // This is the case when running from admin pgms (daily_admin.php or ws_admin.php..)
        global $ws_site_name;
		if ($ws_site_name == $this->name && @$system_record['data_version'] < WS_VERSION)
            include "ws_version_control.php";	// Update (or create) database for that site
    }

	//	Db access
	//	---------
	static function execQueryFetch($query, $errorLevel = 0){
		if ($res = self::execQuery($query, $errorLevel))
			return $res->fetch(PDO::FETCH_ASSOC);
		else
			return false;
	}
	static function execQuery($query, $errorLevel = 0){
		if (!($res = self::$pdo->query($query))) {
			if ($errorLevel > 0){
				$err = self::$pdo->errorInfo();	// For php < 5.4 compatibility
				trigger_error($err[2]);
				trigger_error($query);
			}
			if ($errorLevel > 1)
        		WsUtils::WsError('', $errorLevel > 2);	// Display an error, exit according errorLevel
		}
		return $res;
	}
	static function quoteString($str){
		return self::$pdo->quote($str);
	}

    //  LOCK/UNLOCK DATA
    //	-----------------------------------------------
    function lockData($readOrWrite = "WRITE") {
        $query = "LOCK TABLES";
        $prefix = " ";
        foreach (self::$tables as $table) {
            $query .= $prefix.$table.' '.$readOrWrite;
            $prefix = ", ";
        }
        self::execQuery($query);
    }

    function unlockData() {
        self::execQuery("UNLOCK TABLES");
    }

    //  PURGE
    //	Delete unused data files, such as images, in whole site
    //	-------------------------------------------------------
    function purgeDataFiles($force = 0) {
        //  Clean up temporary files
        if (is_dir('tmp'))
            rm_recur('tmp/');

        //  Delete files older than 24 hours
        $d24h = $this->path.'24h/';
        $handle = @opendir($d24h);
		while (($file = readdir($handle)) !== false) {
		  	$file = $d24h.$file;
			if (is_file($file) && (filemtime($file) + 24*3600) < time())
				unlink($file);
		}

		//  Purge clipboards and trial pages older than 2 hours
	    $query = "DELETE from ".self::TLC_DRAFT." WHERE `properties`&".(WS_CLIPBOARD | WS_TRIAL_PAGE)." AND `date` < DATE_SUB(NOW(), INTERVAL 2 HOUR)";
    	self::execQuery($query, 1);

		//  Purge trial css older than 2 hours
	    $query = "DELETE from ".self::USER_CSS_DRAFT." WHERE `id` LIKE 'ws_trial%' AND `date` < DATE_SUB(NOW(), INTERVAL 2 HOUR)";
    	self::execQuery($query, 1);

    	//  We don't want to delete files in case of error, it might be catastrophic
    	set_error_handler("WsSite::abortPurge");

        //  Fix an old bug
//        $query = "ALTER TABLE ".@self::SYSTEM." CHANGE `purge_counter` `purge_counter` SMALLINT(3) NOT NULL DEFAULT '0'";
//    	self::execQuery($query, 1);

    	// Long operation, we don't do it everytime (1/5 or when forced):
    	// force 0 => 1/5, force 1 => if not yet forced, force 2 => everytime
		if (!($count = self::execQueryFetch("SELECT `purge_counter` FROM ".WsSite::SYSTEM)))
            $count = 0;
        else
            $count = $count['purge_counter'];
        $time_to_purge = $force ? ($force > 1 || $count != 1) : !$count;
        $cnt = $force ? 1 : '(`purge_counter`+1)%5';
    	$query = "UPDATE ".@self::SYSTEM." SET `purge_counter`=".$cnt;
    	self::execQuery($query, 1);

        if ($time_to_purge) {
    		ini_set('memory_limit', '128M');      // Hope it's enough
    		//	Initialize an array which keys are background image filenames from CSS
            $bg_images = '';
        	if ($row = self::execQueryFetch("SELECT `csstext` from ".WsSite::USER_CSS_DRAFT." where id='default'"))
				$bg_images .= $row['csstext'];
        	if ($row = self::execQueryFetch("SELECT `csstext` from ".WsSite::USER_CSS." where id='default'"))
				$bg_images .= $row['csstext'];
    		$data_files = array();
            preg_match_all("<background-image.*url\(\"?(\./)*([^\")]+)>", $bg_images, $result);
    		foreach ($result[2] as $path)
    			$data_files[$path] = 1;

    		//	Continue with image and data filenames of each element
    		foreach (array(WsSite::TLC, WsSite::TLC_DRAFT) as $tbl_name) {
    			$query = "SELECT `serialized_object` from ".$tbl_name;
    			$res = self::execQuery($query, 3);
				while ($row = $res->fetch()) {
  				  	$tlc = unserialize($row['serialized_object']);
				  	$data_files = array_merge($data_files, $tlc->GetDataFiles());
				}
    		}

    		//	Delete dangerous files and files not in data files array
    		foreach (array(WS_IMAGE_PATH, WS_BACKGROUND_PATH, WS_RAWDATA_PATH) as $subDir) {
                $dir = $this->path.$subDir;
    			$dh = opendir($dir);
    	        while (($file = readdir($dh)) !== false) {
    	        	if (!is_dir($dir.$file) && $file[0] != '.') {
        	            $sfx = strtolower(substr($file, strrpos($file, ".") + 1));
    					if (empty($data_files[$subDir.$file]) || $sfx == 'php' || $sfx == 'cgi')
                            @unlink ($dir.$file);
    		        }
                }
    	        closedir($dh);
    	    }
    	    // Site size may have changed
            $this->alterSize();
        }
        //	Done
        restore_error_handler();
        return $time_to_purge;
    }

    static function abortPurge($errno, $errstr, $errfile, $errline) {
    	if (error_reporting() && $errno != E_STRICT)	// Bypass errors obfuscated by @ error-control operator + E_STRICT for php5
    		WsUtils::WsError($errno.'......'.$errstr.' ('.$errline.')', true);
    }

    //  SIZE MANAGEMENT
    //  To optimize we keep known size in a cache file
    //	-----------------------------------------------
    function alterSize() {
        @unlink($this->path.self::SIZE_FILE);
    }

    function getSize() {
        if (!($size = @file_get_contents($this->path.self::SIZE_FILE))) {
            $size = 0;
            $res = self::execQuery('show table status', 3);
            while($row = $res->fetch())
                $size += $row['Data_length'] + $row['Index_length'];
            $size += filesize_recur($this->path);
            file_put_contents($this->path.self::SIZE_FILE, $size);
        }
        return $size;
    }
    
    function availableSpace() {
        $max = $this->space_quota * 1000000 * WS_QUOTA_EXCESS;
        $available = $max - $this->getSize();
        if ($available <= 0) {
            $this->purgeDataFiles(1);
            $available = max($max - $this->getSize(), 0);
		}
		return $available;
	}

    //  TRAFFIC MANAGEMENT
    //  To optimize we keep known traffic in a cache file
    //	-------------------------------------------------
    function alterTraffic() {
        @unlink($this->path.self::TRAFFIC_FILE);
    }

    //  Returns a 2 x 3 elements array:
    //  bytes, pages: last 24h, last week, last month traffic
    //  -----------------------------------------------------
    function getTraffic() {
        if (!($traffic = @unserialize(@file_get_contents($this->path.self::TRAFFIC_FILE)))) {
            $traffic = array('bytes' => array(0, 0, 0), 'pages' => array(0, 0, 0));
            $start = array(time() - 3600*24, time() - 3600*24*7, time() - 3600*24*30);
            // Explore logrotated apache logfiles
            if ($logs = scandir($this->path.WS_LOG_DIR)) {
                foreach($logs as $logname) {
                    if (($logname == 'access_log' || strpos($logname, 'access_log-') === 0)
                        && ($log = @fopen($this->path.WS_LOG_DIR.'/'.$logname, 'r'))) {
                        while ($access = fgets($log)) {
                            $time = strtotime(preg_replace("|.* \[(.*)\].*|", '$1', $access));
                            $bytes = substr($access, strrpos($access, ' '));
                            if ($bytes == '-')
                                $bytes = 0;
                            // Pages are urls with .html suffix or without '.' (like '/' for home)
                            $url = preg_replace('&.* "GET (/[^\s]*) .*&', '$1', $access);
                            for ($i = 2; $i >= 0; $i--)
                                if ($time >= $start[$i]) {
                                    $traffic['bytes'][$i] += $bytes;
                                    if ($url[0] == '/' && (strrpos($url, '.html') || !strrpos($url, '.')))
                                        $traffic['pages'][$i]++;
                                }
                        }
                        fclose($log);
                    }
                }
            }
            file_put_contents($this->path.self::TRAFFIC_FILE, serialize($traffic));
        }
        return $traffic;
    }

    //  GET MODIFICATION TIMES
    //  ----------------------
    function updateTime() {
        $updateTime = 0;
        if ($res = self::execQuery('show table status', 1)) {
            $user_tables = array(
                self::MAP, self::MAP_DRAFT,
                self::TLC, self::TLC_DRAFT,
                self::USER_CSS, self::USER_CSS_DRAFT
            );
            while($row = $res->fetch()) {
                if (in_array($row['Name'], $user_tables))
                    $updateTime = max(strtotime($row['Update_time']), $updateTime);
            }
		}
		return $updateTime;
    }
}
?>
