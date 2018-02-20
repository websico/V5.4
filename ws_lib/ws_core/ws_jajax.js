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
 *  JAVASCRIPT LIB
 *  ---------------------------------------
 */

//  Ask for an asynchronous processing, with html response
//  Slightly modified from mozilla doc
//  ------------------------------------------------------
function ws_request(url, callBack) {
    var httpRequest;

    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        httpRequest = new XMLHttpRequest();
        if (httpRequest.overrideMimeType) {
            httpRequest.overrideMimeType('text/html');
        }
    }
    else if (window.ActiveXObject) { // IE
        try {
            httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (e) {
            try {
                httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch (e) {}
        }
    }

    if (!httpRequest) {
        alert('Giving up :( Cannot create an XMLHTTP instance');
        return false;
    }
    httpRequest.onreadystatechange = function() {
                if (httpRequest.readyState == 4) {
                    if (httpRequest.status == 200) {
                        callBack(httpRequest.responseText);
                    } else {
                        callBack('Error ' + httpRequest.status);
                    }
                }
    };
    httpRequest.open('POST', url, true);    // Method POST is necessary for IE (old), to disallow caching
    httpRequest.send('');
}

//	Get some HTML from an url
//	put it in innerHTML of a DOM element then callback(response)
//	-----------------------------------------------------------
function ws_htmlRequest(url, domRecipient, callback){
	if (typeof domRecipient == "string")
	    domRecipient = document.getElementById(domRecipient);
	if (domRecipient.nodeType == 1) {
	    domRecipient.innerHTML = '<img alt="loading..." src="' + WS_CORE_PATH + 'ws_images/loading.gif" style="display: block; margin: 0 auto">';
		ws_request(url, function(response){
                            domRecipient.innerHTML = response;
                            if (callback)
                                callback(response);
                        });
		return true;
	} else {
		return false;
	}
}

//  Get an element by its id (<page>/<id>)
//	put it in innerHTML of a DOM element then callback(response)
//  ------------------------------------------------------------
function ws_getElementById(id, domRecipient, callback){
    return ws_htmlRequest('ws_service.html?WS_CMD=get_element_by_id&WS_ID=' + id + '&WS_LANG=' + ws_user_lang, domRecipient, callback || 0);
}
