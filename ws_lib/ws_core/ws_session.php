<?PHP
/*
 *  This file is part of Websico: online Web Site Composer, http://websico.net
 *  Copyright (c) 2009-2017 Websico SAS, http://websico.com
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
 *  LOGIN MANAGEMENT
 *  ---------------------------------------
 */

//  -------------
//  SESSION CLASS
//  -------------
//  Home made session management
//  Standard doesn't work in multilingual configuration
//  Cleaner in some situation (no session initialization a priori, so no cookie nor file)
//  Automatic PHPSESSID propagation in links is damageable (ini_set() not authorized by any ISP..)

class ws_Session {
	protected $s_params;    // Internal data, other attributes are user's ones,
                            // 'protected' and not 'private' to be accessible by
                            // get_object_vars() etc., depending on php versions...
	function __construct($name) {
		$s_params_default = array("ID" => 0, "yet_saved" => 0, "cookie_name" => $name, "user_agent" => "");
		$this->s_params = $s_params_default;
      	if (!is_dir(WS_SESSION_PATH))
            mkdir(WS_SESSION_PATH);
		// dots are replaced by underscore when receiving the cookies array
		if (($s = @unserialize(@file_get_contents(@WS_SESSION_PATH.$_COOKIE[str_replace('.', '_', $name)]))) !== false) {
            foreach (get_object_vars($s) as $var => $value)
                $this->$var = $value;
			// A browser change is highly suspect, session may have been stolen
			if (@$_SERVER['HTTP_USER_AGENT'] != $this->s_params['user_agent']) {
				$this->destroy();
				$this->s_params = $s_params_default;
			}
        }
	}
	public function save($keep_file = false) {
	  	if (!$this->s_params['yet_saved']) {
			if ($handle = @opendir(WS_SESSION_PATH)) {	// Purge old sessions
				while (($file = readdir($handle)) !== false) {
				  	$file = WS_SESSION_PATH.$file;
					if (is_file($file) && (filemtime($file) + WS_SESSION_TIMEOUT) < time())
						@unlink($file);
				}
				closedir($handle);
			} else {
                mkdir(WS_SESSION_PATH, 0777, true);
			}
			// One shot session ID except contrary request
			if (!$keep_file && $this->s_params['ID'])
				@unlink(WS_SESSION_PATH.$this->s_params['ID']);
			if (!$keep_file || !$this->s_params['ID'])
				$this->s_params['ID'] = uniqid('');
    		// Save session id in a cookie,
            // it must be accessible for all languages from xxx/en/ or xxx/
            $domain = $_SERVER['SERVER_NAME'] == '127.0.0.1' ? '' : $_SERVER['SERVER_NAME'];
    		setcookie($this->s_params['cookie_name'], $this->s_params['ID'], 0, '/', $domain);
			$_COOKIE[$this->s_params['cookie_name']] = $this->s_params['ID'];   // Sometime useful to know the actual session id
    	}
		$this->s_params['yet_saved'] = 0;			// Save current session
		$this->s_params['user_agent'] = @$_SERVER['HTTP_USER_AGENT'];
		fwrite(fopen(WS_SESSION_PATH.$this->s_params['ID'], 'w'), serialize($this));
		$this->s_params['yet_saved'] = true;
	}
	public function destroy() {							// Destroy current session file and cookie
		@unlink(WS_SESSION_PATH.$this->s_params['ID']);
      	// Set an invalid session id in the cookie, better than set an expiration time
      	// which is client dependent.
        // Obscure problems with Opera(11) in multilingual configuration
    	setcookie($this->s_params['cookie_name'], 'destroyed', 0, '/', $_SERVER['SERVER_NAME'], false /* <php 5.2>, true*/);
	}
	public function getID(){
		return $this->s_params['ID'];
	}
}

//  ------------------
//  USER SESSION CLASS
//  ------------------

class ws_UserSession extends ws_Session {
	public $user = 0;					// logged in user name
	public $permissions = 0;			// future use
	public $freshly_logged = 0;         // useful for version check
	protected $last_access_time = 0;	// time of last successful access
	protected $last_challenge = 0;		// a random number used for password encoding

    //  Login with password control
    //  Check the login/password then loop for password request
    //  in a standard form if requested.
    //  If no loop requested, the caller must use a specific form,
    //  with the same input fields.
    //  ----------------------------------------------------------
    function login($valid_users, $timeout, $message='', $loop=1) {
      	global $ws_lang;

        // In case of large uploaded file we don't check timeout
        foreach ($_FILES as $uploaded_file)
            if ($uploaded_file['size'] > 1000000) {
                $large_upload = 1;
                break;
            }
        // Not logged in or timeout
    	if (!isset($this->last_access_time) || !$this->user
    		|| (!@$large_upload && ((time()-$this->last_access_time) > $timeout))) {

            // Following code has to be revisited when implementing real multi-user
            // For now we check only password, and user is deducted from the password

/*			&& (!array_key_exists(@$_POST['ws_v51'], $valid_users)	// Login is missing or not correct
				|| (strlen($pass = @$valid_users[@$_POST['ws_v51']])
					&& strcmp(@$_POST['ws_turlut12'], md5($pass.$this->last_challenge))))) {
*/
            // Check if password is missing or incorrect
    		if (!(isset($_POST['ws_turlut12']))) {		// First time form submission
                $asking_delay = 0;
            } else {									// Search user from password
                foreach ($valid_users as $user => $pass)
                    if ($_POST['ws_turlut12'] == md5($pass.$this->last_challenge)) {
                        $found = true;
                        break;
                    }
                if (!@$found)
                    $asking_delay = 5;
            }
            // Delay in case of bad password
			if (isset($asking_delay)) {
				// flock for protection against distributed brut force attack
				// any bad attempt from any computer will wait other ones
				if ($asking_delay) {
					$fp = fopen("login-lock", "w");
					flock($fp, LOCK_EX);
	                sleep($asking_delay);
	            }
                // Password request
                $this->user = 0;                        // No more logged in
    			$this->last_challenge = md5(uniqid(''));
    			$this->save();
    			if ($ws_lang == 'fr') {
                    $js_necessary = "Javascript et cookies doivent être activés dans votre navigateur !";
                    $prompt = "Votre mot de passe";
                    $ok = "Entrer";
                    $cancel ="Annuler";
                    $forgotten_pwd = "Mot de passe perdu";
                    $forgotten_msg = "Un message de confirmation pour régénérer le mot de passe va vous être envoyé.";
                } else {
                    $js_necessary = "Javascript and cookies must be enabled in your browser !";
                    $prompt = "Your password";
                    $ok = "Enter";
                    $cancel ="Cancel";
                    $forgotten_pwd = "Lost password";
                    $forgotten_msg = "A confirmation email to generate a new password will be sent to your subscription contact address.";
                }
    			echo '<!doctype html>
                    <html>
    				<head>
    				<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    				<meta name="viewport" content="width=device-width, height=device-height">
    				<title>'."Login".'</title>';
    			echo '
                    <link rel="StyleSheet" href="'.WS_CORE_PATH.'/ws_tools.css" type="text/css">
    				<script type="text/javascript" src="'.WS_LIB_PATH.'third_party_includes/jap.js"></script>
    				</head>
    				<body class="login"
                            onload="var f = document.getElementById(\'login_form\');
                                f.reset();
                                f.ws_turlut12.focus();">';
    			echo '<div class="login">
					<img src="'.WS_CORE_PATH.'ws_images/logo_350.png" alt="Websico logo">
					<noscript><h2><br>'.$js_necessary.'</h2></noscript>
					<h4>'.$message.'</h4><h1>'.$prompt.'</h1>';
    			// Strip logout command from query, otherwise it can loop
				$action_uri = preg_replace('/([?&])\s*ws_operation=logout\s*&/', '$1', $_SERVER['REQUEST_URI']);
				$action_uri = preg_replace('/[?&]\s*ws_operation=logout\s*$/', '', $action_uri);
                echo '
					<form method="post" action="'.$action_uri.'" id="login_form"
    					onsubmit="ws_turlut12.value=hex_md5(hex_md5(ws_turlut12.value) + \''.$this->last_challenge.'\');">';
  		        // Repost hypothetical previously posted values
                foreach($_POST as $name => $value)
    			    if (!in_array($name, array("ws_turlut12", "forgotten_pwd")))
    			    	print '<input type="hidden" name="'.$name.'" value="'.htmlspecialchars($value).'">';
    			echo '
					<input type="password" size ="32" name="ws_turlut12" id="ws_turlut12"><br><br>
    				<button type="submit" name="enter">'.$ok.'</button>
    				<button type="submit" name="abort">'.$cancel.'</button>';
                if (count($valid_users) == 1)       // admin forgotten pwd recovery
                    echo '
					<button type="submit" name="forgotten_pwd" onclick="return confirm(\''.$forgotten_msg.'\');" value="'.$forgotten_pwd.'">'.$forgotten_pwd.'</button>';
                echo '</form></div></body></html>';
    			exit();
    		}
    	}
		// Valid logged access
	    $this->freshly_logged = isset($_POST['ws_turlut12']);
		if (isset($_POST['ws_v51'])) {
			$this->user = $_POST['ws_v51'];
        } else if (isset($user)) {
            $this->user = $user;
		}
        $this->last_access_time = time();
    	return true;
    }

    //  Logout, destroy session file and cookie
    //  ---------------------------------------
    function logout() {
        $this->destroy();
        $this->user = 0;
        $_POST = array();    // To prevent from loops in successive calls to login in same process
    }
}
?>
