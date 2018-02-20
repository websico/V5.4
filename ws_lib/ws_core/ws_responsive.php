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
 *  CONDITIONNALLY INCLUDED, RESPONSIVENESS
 *  ---------------------------------------------------
 */

$mediaQueries = "
	.dontDisplayOn {
		display: none;
	}
	.dontDisplayOn.wssmenu,
	.dontDisplayOn.wssmenu .button {
		display: block;
	}
	.dontDisplayOn.wssmenu .submenu {
		display: block;
		position: static;
		float: none;
	}
	.dontDisplayOn.wssmenu>nav {
		position: absolute;
		top: -1000%;
		left: 0;
		right: 0;
		z-index: 11;
		opacity: 0;
	}
	.dontDisplayOn.wssmenu.wssmenu a {
		margin: 2px;
		padding: 2px;
		background-image: none;
	}
	.dontDisplayOn.wssmenu li {
		float: none;
	}";

$responsiveCss = "
	@viewport {
		width: device-width;
		initial-scale: 1;
	}
	
	/* Column reduction by media query,
	 * widths are dynamically set up
	 * -------------------------------*/
	@media only screen and (max-width:".$ws_S_Width."px) {
		.wssystemcontainer.H.hDepth1>div {
			display: table-row;
		}
	} 
	@media only screen and (max-width:".$ws_XS_Width."px) {
		.wssystemcontainer.H>div {
			display: table-row;
		}
	}
	
	/* Column reduction by js dynamic classNaming,
	 * the algorithm is to reduce columns as long as the document is wider than the viewport,
	 * a long operation on smartphones, so for efficiency we output also the media queries before.
	 * It can be be still useful for pages wider than the first max-width media query. 
	 * ------------------------------------------------------------------------------------------*/
	.squeeze1 .wssystemcontainer.H.hDepth1>div,
	.squeeze2 .wssystemcontainer.H.hDepth2>div,
	.squeeze3 .wssystemcontainer.H.hDepth3>div,
	.squeeze4 .wssystemcontainer.H.hDepth4>div,
	.squeeze5 .wssystemcontainer.H>div {
		display: table-row;
	}
	
	/* Do not display some element,
	 * display standard or reduced menu,
	 * by media query
	 * ------------------------------------------*/
	@media only screen and (max-width:".$ws_XS_Width."px) {
	".str_replace('dontDisplayOn', 'dontDisplayOnXS', $mediaQueries)."
	}
	@media only screen and (min-width:".($ws_XS_Width + 1)."px) and (max-width:".$ws_S_Width."px) {
	".str_replace('dontDisplayOn', 'dontDisplayOnS', $mediaQueries)."
	} 
	@media only screen and (min-width:".($ws_S_Width + 1)."px) and (max-width:".$ws_M_Width."px) {
	".str_replace('dontDisplayOn', 'dontDisplayOnM', $mediaQueries)."
	} 
	@media only screen and (min-width:".($ws_M_Width + 1)."px) {
	".str_replace('dontDisplayOn', 'dontDisplayOnL', $mediaQueries)."
	}";

// Strip comments
$responsiveCss = (preg_replace('<(/\*.*?\*/)|(//.*?[\n\r])>s', '', $responsiveCss));
// Strip newlines
$responsiveCss = (preg_replace('<\n\s*>', '', $responsiveCss));

if (@$ws_noColumnReduction)
	$responsiveCss = preg_replace('/table-row/', 'table-cell', $responsiveCss);
file_put_contents(WS_CACHE_PATH.'responsive.css', $responsiveCss);		
?>