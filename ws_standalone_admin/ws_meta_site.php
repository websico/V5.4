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
 *  GLOBAL SITE OPERATIONS
 *  --------------------------------------------------------------------------
 */

define("WINDOWS", stripos(php_uname('s'), 'Windows') === 0);
if (WINDOWS){
	if (!defined("WS_7za_PATH")) define ("WS_7za_PATH", '');
}
define("DB_DUMP_FILE",'_mysql_dump');
define("BACKUP_ERROR", 'logs/backup_errors');

define('ZIP_COMMAND', (WINDOWS ? WS_7za_PATH.'7za a -r0 -tzip >logs/zip_log ' : 'zip -rq '));
define('ZIP_ERROR', 'logs/zip_errors');
// WARNING WITH WINDOWS
// FILE NAMES OVERLOADING DUE TO CASE INSENSITIVITY: TiTo.JPG overloads tito.JPG !!
define('UNZIP_COMMAND', WINDOWS ? WS_7za_PATH.'7za x -y >logs/zip_log ' : 'unzip -oq ');

class WsMetaSite {

    //	BACKUP DATA
    //	-----------------------------------------------
    static function BackupData($site, $backup_file = 0) {
        if ((ini_get('max_execution_time') < 600 && @ini_set('max_execution_time', 600) === false))
        	die("<h1>Insufficient system resources</h1>");

        //  Purge site data
        //  ---------------
		$site->lockData("WRITE");   // Must get write privilege
		$site->purgeDataFiles(1);   // To save only necessary data

        //  Lock site data
        //  --------------
        $site->lockData("READ");	// Unlock and relock just in read mode

        //  Check backup dir, set current dir to site dir
        //  ---------------------------------------------
        if (!$backup_file)
			$backup_file = $site->name.'.ws_data';
		else
			@mkdir(dirname($backup_file), 0777, true);	// Should have been made by the caller...
        $saved_dir = getcwd();
        chdir($site->path);

        //	Dump database
        //	-------------
        @unlink(DB_DUMP_FILE);		// It could have been yet created under root ws_admin
		self::DbDump($site);

        //  Build zip archive
        //  -----------------
        @unlink($backup_file);      // To be sure to re-create archive...
        exec(ZIP_COMMAND.$backup_file.' '.WS_DATA_PATH.'* icon.ico '.DB_DUMP_FILE.' 2>'.ZIP_ERROR);
        if (@filesize(ZIP_ERROR))
            die('<h1>ZIP<BR>'.nl2br(file_get_contents(ZIP_ERROR)).'</h1>');

        //  The end
        //  -------
		@unlink(DB_DUMP_FILE);
        chdir($saved_dir);
        $site->unlockData();
    }

    //	RESTORE DATA
    //	-----------------------------------------------
    static function RestoreData($site, $backup_file = 0, $purge = 1) {
        if ((ini_get('max_execution_time') < 600 && @ini_set('max_execution_time', 600) === false))
        	die("<h1>Insufficient system resources</h1>");
        if (!$backup_file)
			$backup_file = $site.'.ws_data';

        //  Set current dir as site dir
        //  ---------------------------
        $saved_dir = getcwd();
        chdir($site->path);

        //  Clean up cache, some data may be fresher than the backup
        //  --------------------------------------------------------
        if (is_dir(WS_CACHE_PATH))
            rm_recur(WS_CACHE_PATH);

        //  Can't lock site data, because of mysql restore,
        //  which would wait indefinitely...
        //  ----------------------------------------------

		//  Unzip archive
		//  -------------
        exec(UNZIP_COMMAND.$backup_file.' 2>'.ZIP_ERROR);
        if (@filesize(ZIP_ERROR))
            die('<h1>UNZIP<BR>'.nl2br(file_get_contents(ZIP_ERROR)).'</h1>');

		//	Restore database
        //	----------------
        self::DbRestore($site);

        //  Proceed language integration
        //  ----------------------------
        if (method_exists('WsTopLevelContainer','GetLangs')){
            global $ws_langs_array;

            $srcLangs = WsTopLevelContainer::GetLangs();
            if (count($ws_langs_array) == 1 && count($srcLangs) == 1) {
                // Monolang, we keep the lang of the current site
                $oldLang = reset($ws_langs_array);
                $srcLang = reset($srcLangs);
                if ($srcLang != $oldLang)
                    WsTopLevelContainer::ChangeLang($oldLang, $srcLang);
            } else {
                // Multilang, we import langs of imported site
                $langs = implode(', ', array_unique(array_merge(array_values($ws_langs_array), array_values($srcLangs))));
                @copy("ws_preferences.php", "ws_preferences.back");
                $preferences = file_get_contents("ws_preferences.php");
                if (empty($preferences))
                	$preferences = "<?php\n";
                $preferences = preg_replace("/\$ws_langs.*;/m", '', $preferences).'$ws_langs = "'.$langs.'";';
                file_put_contents("ws_preferences.php", $preferences, LOCK_EX);
            }
        }

        //  The end
        //  -------
        @unlink(DB_DUMP_FILE);
        chdir($saved_dir);
        if ($purge)
        	$site->purgeDataFiles(2);
    }
    
    //	MISC PRIVATES
    //	---------------------------------------------------

    //  Minimal database dump
    //	In place of mysqldump, we NEED to keep same connection to avoid random deadlocks
    //	with SHOW CREATE TABLE in some versions of mysql
    //  --------------------------------------------------------------------------------
	private static function DbDump($site) {     
		@unlink(BACKUP_ERROR);
        $f = fopen(DB_DUMP_FILE, 'w');
		$error = 0;

		foreach (WsSite::$tables as $table) {
            $sql = PHP_EOL.'-- TABLE: '.$table.PHP_EOL;
            $sql .= 'DROP TABLE IF EXISTS `'.$table.'`;'.PHP_EOL;
	    	if (!($create = WsSite::execQueryFetch('SHOW CREATE TABLE `'.$table.'`', 1))) {
	            $error = 1;
	            break;
			}
            $sql .= $create['Create Table'].';'.PHP_EOL;
            if (!($error |= (fwrite($f, $sql) === false))){
		    	if (!($res = WsSite::execQuery('SELECT * FROM `'.$table.'`', 1))) {
		            $error = 1;
				}
	            while ($row = $res->fetch()) {
		            $sql = 'INSERT INTO `'.$table.'` VALUES (';
		            $count = count($row) / 2;				// $row is double-indexed by PDO !!
					for ($i = 0; $i < $count; $i++)			// Any not null value can be quoted
						$sql .= (is_null($row[$i]) ? 'NULL' : WsSite::quoteString($row[$i])).',';
					$sql = substr($sql, 0, strlen($sql) - 1).');'.PHP_EOL;
	                if ($error |= (fwrite($f, $sql) === false))
						break;
	            }
			}
        }
        if ($error || !fclose($f)){
        	file_put_contents(BACKUP_ERROR, 'DbDump error');
		    die('<h1>DbDump error</h1>');
		}
		return true;
    }
     
    //  Minimal database restore
    //	We can use a new connection, so we can use PDO
    //  ------------------------------------------------------------------------
	private static function DbRestore($site) {     
		@unlink(BACKUP_ERROR);				// It could belong to root, resulting in an error
        $db = new PDO('mysql:host='.$site->db_server.';dbname='.$site->db_name, $site->db_user, $site->db_pwd, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
        if (!($f = fopen(DB_DUMP_FILE, 'r'))) {
        	file_put_contents(BACKUP_ERROR, 'DbRestore error: could not open '.DB_DUMP_FILE);
		    die('<h1>DbRestore error</h1>');
		}
        $sql = '';
		while (($s = fgets($f)) !== false) {
			$sql .= $s;
			$s = rtrim($s);
			if (strlen($s) && $s[strlen($s) - 1] == ';') {
				if (!$db->query($sql)){
					$err = $db->errorInfo();
		        	file_put_contents(BACKUP_ERROR, 'DbRestore error: '.$err[2]."\n\r".$sql);
				    die('<h1>DbRestore error</h1>');
				}
				$sql = '';
			}
		}
		return true;
	}
}