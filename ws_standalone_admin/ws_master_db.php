<?PHP
/*
 *  This file is part of Websico: online Web Site Composer, http://websico.net
 *  Copyright (c) 2009-2017 Websico SAS, http://websico.com
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
 */

//  COMPATIBILITY WITH WEBSICO SAAS MASTER DATABASE CLASS
//  -----------------------------------------------------
define("WS_QUOTA_EXCESS", 1.25);		// Sanction when 1.25 * space quota

class WsMasterDB {

    // Subscription status
    const SB_CONFIRMED = 1;     // Confirmed by customer through email link
    const SB_DEAD = 2;          // The site has been destroyed
    const SB_ZOMBIE = 4;        // The site smells death, can be destroyed by hand
    const SB_SIZE_LIMIT = 8;    // Size of the site is around quota
    const SB_SIZE_EXCESS = 16;  // Size of the site is really above quota
    const SB_TRIAL = 32;        // In trial period (=> limited space)
    const SB_SUSPECT = 64;      // A suspect site, could be malicious    

    // Alert levels
    const SB_EXPIRY = 0;        // Expiration date of card is before next payment
    const SB_FREE_ENDING = 5;   // Expiration of free period
    const SB_CANCEL = 10;       // User asked for subscription cancellation
    const SB_UNPAID = 20;       // Unpaid debit
    const SB_NO_EDIT = 30;      // Forbidden edit mode
    const SB_NO_VISIT = 40;     // Forbidden visits
    const SB_DESTROYED = 50;    // Zombified

    //  Check the db user, if that fails we try to create it
    //  ----------------------------------------------------
    function WsMasterDB() {
    	global $ws_site_name;

		if (!($params = $this->getSiteParams($ws_site_name)))
		    return false;

		$db_server = $params['db_server'];
        $db_name = $params['db_name'];
        $db_user = $params['db_user'];
        $db_pwd = $params['db_pwd'];

		try {
			$pdo = new PDO('mysql:host='.$db_server, $db_user, $db_pwd);
		} catch (PDOException $e) {
			$pdo = new PDO('mysql:host='.WS_DB_SERVER, WS_ROOT_USER, WS_ROOT_PWD);
            $pdo->query("CREATE USER '".$db_user."'@'localhost' IDENTIFIED BY '".$db_pwd."'");
	        return ($pdo->query("GRANT ALL ON `".$db_name."`.* TO '".$db_user."'@'localhost'"));
        }
        return true;
    }

    //  Get options and parameters of a site in an array
    //  ------------------------------------------------
    function getSiteParams($site_name) {
        return array(
			'reference' => 'WS-standalone',
        	'contact_mail' => WS_CONTACT_MAIL,
        	'admin_pwd' => 0,
        	'admin_lang' => 0,
        	'offer' => 'Standalone',
			'status' => self::SB_CONFIRMED,
			'alert_level' => 0,
			'space_quota' => 1000000,	// 1TB
            'db_server' => WS_DB_SERVER,
            'db_name' => WS_DB_NAME,
			'db_user' => WS_DB_USER,
            'db_pwd' => WS_DB_PWD,
            'relative_path' => "./"
			);
    }

//  SUBSCRIPTIONS
//  -----------------------------------

    //  Update a subscription
    //  ---------------------
    function updateSubscription($reference, $fields) {
        return true;
    }

    //  Get last subscription by site name
    //  ----------------------------------
    function getSubscriptionBySite($site_name) {
    	global $ws_pwd, $ws_lang;

    	return array(
			'reference' => WS_HOSTING_REFERENCE,
        	'contact_mail' => WS_CONTACT_MAIL,
        	'admin_pwd' => empty($ws_pwd) ? md5(WS_INITIAL_PWD) : $ws_pwd,
        	'admin_lang' => empty($ws_lang) ? WS_INITIAL_LANG : $ws_lang,
        	'offer' => 'Standalone',
			'status' => self::SB_CONFIRMED,
			'alert_level' => 0,
            'client_site' => WS_SITE_NAME
			);
    }

    //  Test if site is authorized to be edited
    //  ---------------------------------------
    function canEdit($subscription) {
        return true;
    }

    // Factory compatibility
    // ---------------------
    function isFactory($offer) {
        return false;
    }
    function isChildOf($subName, $parentName) {
        return false;
    }
    function makeChildOf($subName, $parentName) {
        return false;
    }
    function extractChildName($subName, $parentName) {
        return false;
    }
}
?>
