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
 *  JAVASCRIPT LANGUAGE DEPENDENT DATA
 *  ---------------------------------------
 */

// GLOBAL MESSAGES OBJECT
// ======================
$Str = new function(){
    // To compose a value we have to use a variable because a member cannot refer to another member
    // in literal form of object definition (IMHO)
    var linkSubselector = [	// The starting space in value string is important
					{value: " a", innerHTML: "Links"},
					{value: " a:hover", innerHTML: "Mouse over links"},
                    // Can't change anything but color in visited links
					{value: " a:visited", innerHTML: "Visited links",
                            mask: {ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_radius1: 0, ws_border_radius2: 0, ws_color_pane: 1}},
                    {value: " a:active", innerHTML: "Active links (key pressed)"}];
    var that = {

	// Generic
	browse: "Browse...",
	invalidName: "At least one valid character. Valid characters are only: digit, alphabet letter, '-' and '_' !",
	invalidHtmlName: "Valid characters for name are only: digit, alphabet letter, '-' and '_'. The name must not begin with 'ws_' !",
	none: "None",
	dft: "Default",
	newone: "New...",
	draft: "draft",
	public: "public",
	goOn: "Continue",
	abandon: "Cancel",
	finish: "End",
	rename: "Rename",
    deleteSelection: "Delete selection",
	newName: "New name: ",
	notAllowed: '<div style="padding: 0.5em 0 0 3em">Action not allowed.</div>',

	// Misc
	tinyMCE_cleanupPlugin: "Strong cleanup",
    checkUnused: "Check unused elements",

	// Common buttons
	info: "Show manual",
	forget: "Delete",
	toClipboard: "Copy to clipboard",
	embed: "Encapsulate in a new block",
	unembed: "Uncap contents",
	freeContent: "Set the content as model independant",
	saveModel: "Save as a model",
	detachModel: "Detach selected block from it's model",
	record: "Save",
	cancel: "Cancel",
	
	// Common elements
	forgetElementText: "You are about to delete the selected element.<br /><b>WARNING:</b> Deletion is immediate and irreversible.",
	unembedText: "You are about to delete this encapsulating block, preserving contents.<br /><b>WARNING:</b> Deletion is immediate and irreversible.",
	lastElt: "The selected element is alone in a special region (model, free contents block or page),<br /><b>you cannot move it outside&nbsp;!</b>",
	href: "Link url: ",
	hrefCaption: "Target url of the link (no url, no link)",
	displayOn: "Display on",
	XS_device: "Extra small screen (XS)",
	S_device: "Small screen (S)",
	M_device: "Medium screen (M)",
	L_device: "Other (size above M)",
	Sizes: "Sizes are defined in the administration page.",

	// Container
	selectable: "User selectable",
    dropDown: "Drop-down",
    dropDownCaption: "The block must contain a title in first, followed by at least one other element",
	stretchCaption: "Full height (takes the full available height in the cell)",
	valignCaption: "Change vertical alignment of the contents",
	bubbleCaption: "Slides vertically in its cell to try to stay visible when scrolling page",
	blockLink: "Block link",
	blockLinkText: "By filling this field existing links in the block will be disabled.",

	// Title
	inputTextCaption: "Displayed text",
	level: "Level",

	// Image
	imagefileCaption: "Image filename (.jpg, .gif, .png)",
	keepFormat: "Keep source format",
	keepFormatCaption: "To keep some attributes, as transparency or animation, ...",
	inGallery: "In gallery",
	inGalleryCaption: "An image in page gallery can be zoomed by clicking it",
	caption: "Caption: ",
	captionCaption: "Text displayed below the image",
	tooltip: "Title (tooltip): ",
	tooltipCaption: "Text displayed when mouse cursor is on the image",
	imageWidth: "Max width: ",
	imageHeight: "Max height: ",
	notFlexible: "Fixed width and height",
	notFlexibleCaption: "To disable resizing in responsive mode.",

	// Language selector
	validLanguages: "Show only languages available for this page",

	// RSS reader
	rssSource: "Source URL:",
	rssMaxItems: "Maximum number of articles:",
    rssShowDate: "Display date",
    rssShowContent: "Display content",
    rssShowChannel: "Display feed header",

	// Contact form & hidden mail
	destination: "Destination (your email address or an URL):",
	subject: "Subject:",
    returnURL: "Return page",
    returnURLCaption: "Page to which the visitor will be redirected after sending the form, the default is the actual page.",
	preambleCaption: "Edit header of report to visitor",
	preamble: "Report header",
	postambleCaption: "Edit footer of report to visitor",
	postamble: "Report footer",
	ccPromptCaption: "Edit prompt text for CC window (empty text => no CC window)",
	ccPrompt: "CC prompt",

    typeCaption: "Input type",
	requiredCaption: "Required input",
    htmlNameCaption: "HTML name",
    htmlNameTitle: "'name' attribute value. The default is a random value.",
    htmlNameInUse: "This name is yet in use in this form",
	linesCaption: "Number of lines",
    emailField: "Email",
    textField: "Text",
    urlField: "URL address",
    numberField: "Number",
    passwordField: "Password",
    checkboxField: "Checkbox",
    selectField: "Dropdown selector",
    optionsCaption: "Options",
    attachedFileField: "Attached file",
	submitButton: "Submit button",
	captchaField: "Captcha control",

	// Raw text and file download
	rawtext: "<b>WARNING</b>: the raw text can contain <b>html or javascript</b> code."
				+ "<br />Some syntax error can cause severe display errors, in such case"
				+ "<br />you should consider <a href='#' onclick=\"ws_openInfo('man_commands')\">debug mode</a>.",
	datafile: "Associated file: ",
	datafiles: "Associated files: ",
	datafileCaption: "If necessary, choose files associated with html code.",
	downloadCaption: "Choose document to show as dowloadable (.doc, .xls, .pdf, ...).",

	// Menu
	layout: "Layout:",
	category: "Root:",
	depth: "Depth:",
	hOption: "Horizontal",
	vOption: "Vertical",
	tOption: "Tree",

	// Styles
	saveStyleText: "&nbsp;&nbsp;Name of the style:",
	elementStyle: "Style",
	ownStyle: "Local",
	availableStyles: "Available styles",
	chooseStyle: "Select a style",
	editStyle: "Edit selected style",
	saveStyle: "Save a style",
	replaceStyle: ": this style exists.<br>Do you want to replace it?",

	styleManagement: "Style management",
	delete_styles: "Delete styles",
	delete_stylesText: "You are about to delete the selected styles.<br /><b>WARNING:</b> Destruction is immediate and irreversible.",

	// Style edition
    elementSubselector: {value: "", innerHTML: "Selected element"},
	subselectorList: linkSubselector,
	subselectorList_wscontainer: [ // Block link special values
                    {value: ":hover", innerHTML: "Mouse over"},
                    {value: ":visited", innerHTML: "Visited",
                            mask: {ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_radius1: 0, ws_border_radius2: 0, ws_color_pane: 1}},
                    {value: ":active", innerHTML: "Active (key pressed)"}],
	subselectorList_wssmenu: linkSubselector.concat([ // Menu special values
                    {value: " a.selected.menuitem", innerHTML: "Link to current page"},
                    {value: " .button", innerHTML: "Reduced menu button"},
                    {value: " .submenu", innerHTML: "Sub-menus"},
                    {value: " .submenu a", innerHTML: "&nbsp;&nbsp;&nbsp;Links"},
                    {value: " .submenu a:hover", innerHTML: "&nbsp;&nbsp;&nbsp;Mouse over links"},
                    {value: " .submenu a:visited", innerHTML: "&nbsp;&nbsp;&nbsp;Visited links",
                            mask: {ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_radius1: 0, ws_border_radius2: 0, ws_color_pane: 1}},
                    {value: " .submenu a:active", innerHTML: "&nbsp;&nbsp;&nbsp;Active links (key pressed)"},
                    {value: " a.selected.menuitem", innerHTML: "&nbsp;&nbsp;&nbsp;Link to current page"}]),
	subselectorList_wsimage: linkSubselector.concat([ // Image special values
                    {value: " img", innerHTML: "Image", mask: {ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_color: 0}}]),
	subselectorList_wssrssreader: linkSubselector.concat([ // RSS image special values
                    {value: " .itemContent img", innerHTML: "Images in articles", mask: {allPanes: 1, ws_font_pane: 0, ws_contents_align: 0, ws_color_pane: 0}}]),
	subselectorList_wssinputfield: [ // Input field special values
                    {value: " .wsslabel", innerHTML: "Label", mask: {allPanes: 1, ws_layout_pane: 0}},
                    {value: " .wssinput", innerHTML: "Input area", mask: {allPanes: 1, ws_layout_pane: 0}},
                    {value: " .wssinput:hover", innerHTML: "Mouse over input area", mask: {allPanes: 1, ws_layout_pane: 0}}],

	stylescope: "Apply to:",
    subselectorTitle: "Choose content type to alter in the selected element",
	highlightText: "Show selection",
	highlightCaption: "Show / hide the selected element outline",
	fontPane: "Font",
	layoutPane: "Alignment",
	borderPane: "Border",
	marginPane: "Margin",
	colorPane: "Color",
	shadowPane: "Shadow",
	cssTextPane: "CSS",
	factoryReset: "Restore all defaults",

	topSide: "Top",
	rightSide: "Right",
	bottomSide: "Bottom",
	leftSide: "Left",
	allSides: "All&nbsp;sides",

	smallcaps: "Small capitals",
	capitalize: "Capitalize first letter of each word",
	uppercase: "Capitalize all text",
	lowercase: "Lowercase for all text",
	fontSize: "Font size",
	lineHeight: "Line height",
	letterSpacing: "Letter spacing",
	wordSpacing: "Word spacing",
	bold: "Bold",
	italic: "Italic",
	underline: "Underline",
	lineThrough: "Line-through",
	overline: "Overline",
	fontFamily: "Font choice",

	contentsAlign: "Contents alignment",
	elementPosition: "Element position",
	widthTitle: "Width",
	width: "Fixed:",
	minWidth: "Mini:",
	maxWidth: "Maxi:",
	left: "Left",
	right: "Right",
	center: "Center",
	justify: "Justify",
	leftPosition: "Left",
	rightPosition: "Right",
	centerPosition: "Center",
	floatLeft: "Include below on the left",
	floatRight: "Include below on the right",
	clear: "Position below any included element",
	wrapSpaces: "No automatic wrap",

	borderWidth: "Thickness",
	borderStyle: "Style",
	borderColor: "Border color",
    borderRadius: "Radius",
	sideChooser: "Choose the side to be affected:",
	borderTopSide: "Top border, top left corner",
	borderRightSide: "Right border, top right corner",
	borderBottomSide: "Bottom border, bottom right corner",
	borderLeftSide: "Left border, bottom left corner",

	margin: "Margin",
	padding: "Padding",

	backgroundColor: "Background color",
	color: "Text color",
	backgroundImage: "Background image",
	newImage: "Choose a new image",
	backgroundImageCaption: "Choose an existing image or no image",
	noImage: "No image",
	repeatX: "Repeat image horizontally",
	repeatY: "Repeat image vertically",
	repeat: "Repeat image horizontally and vertically",
	cover: "Stretch the image to cover the full background",
	contain: "Stretch the image to cover width or height of the background",
	bgPosition: "Adjust image position",
	red: "Red setting",
	green: "Green setting",
	blue: "Blue setting",
	lightness: "Brightness setting",
	saturation: "Saturation setting",
	colormap: "Color map",
    opacity: "Opacity",
    
    textShadow: "Text shadow",
    boxShadow: "Box shadow",
    shadowOffset: "Shadow position",
    shadowBlur: "Blur",
    shadowSpread: "Spread",
    shadowInset: "Inset shadow",

	cssWarning: "<b>WARNING</b><br />You must know<br />what you do<br />when modifying css.<br />For advanced users<br />only !!<br />",

	// Models
	saveModelText: "Model name:",
	replaceModel: ": do you want to replace the existing model?",
	alterModel: "Model alteration",
	alterModelText: "<b>WARNING:</b> The model is to be altered&nbsp;!!",
	alterModelShiftText: "You tried to alter the model&nbsp;!!<br />If you really want to do that, redo the same operation with Shift key pressed, otherwise detach the block from its model before redoing.",
	removeFromModel: "<b>WARNING:</b> The selected element is to be removed from it's model&nbsp;!!",
	removeFromModelShift: "You tried to remove the selected element from it's model&nbsp;!!<br />If you really want to do that, redo same operation with Shift key pressed, otherwise detach the block from its model before redoing.",
	dontRemoveFromModel: "You tried to remove a free content element from it's model&nbsp;!!<br />If it's removed, all it's content will be removed from all pages that use the model.<br />If you really want to do that, you have to detach the block from it's model, do the operation then save again the model.",

	importModel: "Model import",
	more: "Click to import models...",

	modelManagement: "Model management",
	delete_models: "Delete models",
	delete_modelsText: "You are about to delete the selected models.<br /><b>WARNING:</b> Destruction is immediate and irreversible.",

	// Main toolbar
	moreCaption: "More controls",
	addCaption: "Add a page",
	deletePageTitle: "Delete page",
	deletePageText: "You are about to delete the current page.<br />WARNING: Deletion is immediate and irreversible.",
	deletePageDraftTitle: "Delete draft page",
	deletePageDraftText: "This page has not been published, so the current alterations will be lost.<br />WARNING: Deletion is immediate and irreversible.",
	gridCaption: "Show/hide grid",
	showBlocksCaption: "Show/hide blocks",
	showModelsCaption: "Show/hide models",
	toolsCaption: "Administration: parameters and utilities",
	sitemapCaption: "Site map",
	nameText: "Name:",
	nameCaption: "Name of the page in menu and window title. A page without name is not displayed in the menu (but stays reachable by a link).",
	titleText: "Page title in the browser",
	titleCaption: "Window title complement, after optional prefix and page name, pertinent and no more than 100 characters.",
	previewCaption: "Preview: see draft in simple visit mode",
	recordCaption: "Save modifications (Ctrl + s)",
	publishCaption: "Publish this page...",
	exitCaption: "Exit from maintenance and disconnect",

	// Add element
	models: "Models",
	paste: "Clipboard",
	addElement: "Drag this new element to the desired location",

	// Sitemap
	sitemap: "Site map",
	smPublish: "Sitemap publication",
	smPublishCaption: "Publish this map",
	smPublishText: "You are about to publish the current draft map.<br />It will replace the public map.",
	smDeleteTitle: "Delete site map",
	smDeleteText: "You are about to delete the site map,<br />pages will be no more ordered.<br />WARNING: Deletion is immediate and irreversible.",
	smDeleteDraftTitle: "Delete draft site map",
	smDeleteDraftText: "This map has not been published, so the current alterations will be lost.<br />WARNING: Deletion is immediate and irreversible.",
	status_256: "Draft page, never published",
	status_512: "No draft, published page up to date",
	status_768: "Draft page, published page out of date",

	// Page
	publishTitle: "Publication",
	publishText: "The following elements are linked to this page.<br />Draft elements can be selected then published<br />by clicking the Save button.",
	publishPageText: "This page",
	publishCssText: "All site styles",
	publishSitemapText: "Site map",
	newPageTitle: "New page creation",
	newPageLang: "New page language: ",

    pageSettingsCaption: "Other page settings",
	metaDescription: "Page description",
	metaDescriptionCaption: "Displayed by some search engines, 100 to 255 characters",
	noRobots: "Exclude robots exploration",
	notResponsive: "Disable responsive layout",
	pageUrl: "Page URL",
	changeUrlText: "You are about to save the current page with the same URL ident as another page.<br />If you continue, the current page will replace the other one.",
	redirectTo: "Redirect to",
	redirectToCaption: "Relative internal or full external URL",
	hdrHtml: "Additional HTML in head section",
	hdrHtmlCaption: "meta tags: keywords, author etc.",

	// Cell
	cellWidth: "Cell width"
	//cellHeight: "Cell height"
    };
    return that;
}();
