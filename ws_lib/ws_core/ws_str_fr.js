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
 *  JAVASCRIPT LANGUAGE DEPENDENT DATA
 *  ---------------------------------------
 */

// GLOBAL MESSAGES OBJECT
// ======================
$Str = new function(){
    // To compose a value we have to use a variable because a member cannot refer to another member
    // in literal form of object definition (IMHO)
    var linkSubselector = [	// The starting space in value string is important
                    {value: " a", innerHTML: "Liens"},
                    {value: " a:hover", innerHTML: "Liens survolés"},
                    // Can't change anything but color in visited links
                    {value: " a:visited", innerHTML: "Liens visités",
                            mask: {ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_radius1: 0, ws_border_radius2: 0, ws_color_pane: 1}},
                    {value: " a:active", innerHTML: "Liens actifs (touche appuyée)"}];
    var that = {

	// Generic
	browse: "Parcourir...",
	invalidName: "Le nom ne peut être vide et ne doit comporter que des chiffres, des lettres sans accent ou les caractères '-' et '_' !",
	invalidHtmlName: "Le nom ne doit comporter que des chiffres, des lettres sans accent ou les caractères '-' et '_' et ne doit pas commencer par 'ws_' !",
	none: "Aucun",
	dft: "Défaut",
	newone: "Nouveau...",
	draft: "brouillon",
	public: "public",
	goOn: "Continuer",
	abandon: "Abandonner",
	finish: "Terminer",
	rename: "Renommer",
    deleteSelection: "Supprimer la sélection",
	newName: "Nouveau nom: ",
	notAllowed: '<div style="padding: 0.5em 0 0 3em">Action non autorisée.</div>',

	// Misc
	tinyMCE_cleanupPlugin: "Nettoyage fort du code HTML",
    checkUnused: "Cocher les éléments inutilisés",

	// Common buttons
	info: "Accéder à la documentation",
	forget: "Supprimer",
	toClipboard: "Copier dans le presse-papier",
	embed: "Encapsuler dans un nouveau bloc",
	unembed: "Décapsuler le contenu",
	freeContent: "Rendre le contenu indépendant du modèle",
	saveModel: "Enregistrer comme modèle",
	detachModel: "Détacher le bloc sélectionné de son modèle",
	record: "Enregistrer",
	cancel: "Annuler",

	// Common elements
	forgetElementText: "Vous êtes sur le point de supprimer l'élément sélectionné.<br /><b>ATTENTION</b>: La suppression est immédiate et irréversible.",
	unembedText: "Vous êtes sur le point de supprimer ce bloc en conservant son contenu.<br /><b>ATTENTION</b>: La suppression est immédiate et irréversible.",
	lastElt: "Cet élément est seul dans une région spéciale (modèle, bloc à contenu libre ou page),<br /><b>il est impossible de le déplacer&nbsp;!</b>",
	href: "Lien vers: ",
	hrefCaption: "Adresse url destination du lien",
	displayOn: "Visible sur",
	XS_device: "Très petit écran (taille XS)",
	S_device: "Petit écran (taille S)",
	M_device: "Ecran moyen (taille M)",
	L_device: "Autre (taille supérieure à M)",
	Sizes: "Les tailles sont définies dans la page d'administration.",

	// Container
	selectable: "Sélectionnable",
    dropDown: "Dépliable",
    dropDownCaption: "Le bloc doit contenir en premier un titre, suivi d'au moins un autre élément",
	stretchCaption: "Pleine hauteur (prend toute la hauteur disponible dans la cellule)",
	valignCaption: "Changer la position verticale du contenu",
	bubbleCaption: "Glisse verticalement dans sa cellule pour essayer de rester visible lors de défilement de page",
	blockLink: "Bloc lien",
	blockLinkText: "En renseignant ce champ les liens existants contenus dans le bloc seront désactivés.",

	// Title
	inputTextCaption: "Texte affiché",
	level: "Niveau",

	// Image
	imagefileCaption: "Nom du fichier image (.jpg, .gif, .png)",
	keepFormat: "Conserver le format original",
	keepFormatCaption: "Pour garder les attributs de transparence, animation ...",
	inGallery: "En galerie",
	inGalleryCaption: "Une image dans la galerie de la page peut être agrandie en cliquant dessus",
	caption: "Légende: ",
	captionCaption: "Texte affiché sous l'image",
	tooltip: "Titre (infobulle): ",
	tooltipCaption: "Texte qui sera affiché lorsque le pointeur sera sur l'image",
	imageWidth: "L max: ",
	imageHeight: "H max: ",
	notFlexible: "Dimensions fixes",
	notFlexibleCaption: "Pour bloquer les dimensions, même si la page est en mode auto-adaptatif.",

	// Language selector
	validLanguages: "Afficher uniquement les langues<br />dans lesquelles cette page est disponible",

	// RSS reader
	rssSource: "URL source:",
	rssMaxItems: "Nombre maximum d'articles:",
    rssShowDate: "Afficher la date",
    rssShowContent: "Afficher le contenu",
    rssShowChannel: "Afficher le titre du flux",

	// Contact form & hidden mail
	destination: "Destination (votre adresse courriel ou une URL):",
	subject: "Objet:",
    returnURL: "Page de retour",
    returnURLCaption: "Page du site vers laquelle sera redirigé le visiteur après l'envoi du formulaire, par défaut la page actuelle.",
	preambleCaption: "Editer le texte qui sera rajouté en début de compte-rendu pour le visiteur",
	preamble: "En-tête compte-rendu",
	postambleCaption: "Editer le texte qui sera rajouté en fin de compte-rendu pour le visiteur",
	postamble: "Pied compte-rendu",
	ccPromptCaption: "Editer le texte qui sera affiché dans la fenêtre de demande de copie (texte vide => pas de fenêtre)",
	ccPrompt: "Invite de copie",

    typeCaption: "Type de l'élément",
	requiredCaption: "Saisie obligatoire",
	linesCaption: "Nombre de lignes",
    htmlNameCaption: "Nom HTML",
    htmlNameTitle: "Attribut &quot;name&quot;. Un nom aléatoire est attribué par défaut.",
    htmlNameInUse: "Le nom de ce champ est déjà utilisé dans ce formulaire",
    emailField: "Email",
    textField: "Texte",
    urlField: "Adresse URL",
    numberField: "Nombre",
    passwordField: "Mot de passe",
    checkboxField: "Case à cocher",
    selectField: "Liste déroulante",
    optionsCaption: "Options",
    attachedFileField: "Pièce jointe",
	submitButton: "Bouton d'envoi",
	captchaField: "Contrôle Captcha",

	// Raw text and file download
	rawtext: "<b>ATTENTION</b>: le texte brut peut contenir du code <b>html ou javascript</b>."
		+ "<br />Une erreur de syntaxe peut produire des troubles d'affichage sévères,"
		+ "<br />dans ce cas vous devrez utiliser le  <a href='#' onclick=\"ws_openInfo('man_commands')\">mode debug</a>.",
	datafile: "Fichier associé: ",
	datafiles: "Fichiers associés: ",
	datafileCaption: "Choisir si nécessaire des fichiers liés au code html.",
	downloadCaption: "Choisir le document à mettre à disposition pour téléchargement (.doc, .xls, .pdf, ...).",

	// Menu
	layout: "Affichage",
	category: "Racine:",
	depth: "Profondeur:",
	hOption: "Horizontal",
	vOption: "Vertical",
	tOption: "Arborescence",

	// Styles
	saveStyleText: "&nbsp;&nbsp;Nom du style:",
	elementStyle: "Style",
	ownStyle: "Local",
	availableStyles: "Styles applicables",
	chooseStyle: "Sélectionner un style",
	editStyle: "Modifier le style sélectionné",
	saveStyle: "Enregistrer un style",
	replaceStyle: ": ce style existe déjà.<br />Voulez-vous le remplacer?",

	styleManagement: "Gestion des styles",
	delete_styles: "Suppression de styles",
	delete_stylesText: "Vous êtes sur le point de supprimer les styles suivants.<br /><b>ATTENTION</b>: La suppression est immédiate et irréversible.",

	// Style edition
    elementSubselector: {value: "", innerHTML: "Elément sélectionné"},
	subselectorList: linkSubselector,
	subselectorList_wscontainer: [ // Block link special values
                    {value: ":hover", innerHTML: "Survolé"},
                    {value: ":visited", innerHTML: "Visité",
                            mask: {ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_radius1: 0, ws_border_radius2: 0, ws_color_pane: 1}},
                    {value: ":active", innerHTML: "Actif (touche appuyée)"}],
	subselectorList_wssmenu: linkSubselector.concat([ // Menu special values
                    {value: " a.selected.menuitem", innerHTML: "Lien vers la page actuelle"},
                    {value: " .button", innerHTML: "Bouton menu réduit"},
                    {value: " .submenu", innerHTML: "Sous-menus"},
                    {value: " .submenu a", innerHTML: "&nbsp;&nbsp;&nbsp;Liens"},
                    {value: " .submenu a:hover", innerHTML: "&nbsp;&nbsp;&nbsp;Liens survolés"},
                    {value: " .submenu a:visited", innerHTML: "&nbsp;&nbsp;&nbsp;Liens visités",
                            mask: {ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_radius1: 0, ws_border_radius2: 0, ws_color_pane: 1}},
                    {value: " .submenu a:active", innerHTML: "&nbsp;&nbsp;&nbsp;Liens actifs (touche appuyée)"},
                    {value: " .submenu a.selected.menuitem", innerHTML: "&nbsp;&nbsp;&nbsp;Lien vers la page actuelle"}]),
	subselectorList_wsimage: linkSubselector.concat([ // Image special values
                    {value: " img", innerHTML: "Image", mask: {ws_shadow_pane: 1, ws_border_pane: 1, ws_border_width: 0, ws_border_style: 0, ws_border_color: 0}}]),
	subselectorList_wssrssreader: linkSubselector.concat([ // RSS image special values
                    {value: " .itemContent img", innerHTML: "Images des articles", mask: {allPanes: 1, ws_font_pane: 0, ws_contents_align: 0, ws_color_pane: 0}}]),
	subselectorList_wssinputfield: [ // Input field special values
                    {value: " .wsslabel", innerHTML: "Label", mask: {allPanes: 1, ws_layout_pane: 0}},
                    {value: " .wssinput", innerHTML: "Zone de saisie", mask: {allPanes: 1, ws_layout_pane: 0}},
                    {value: " .wssinput:hover", innerHTML: "Zone de saisie survolée", mask: {allPanes: 1, ws_layout_pane: 0}}],

	stylescope: "Appliquer sur:",
    subselectorTitle: "Choisir le type de contenu à altérer dans l'élément sélectionné",
	highlightText: "Rectangle de sélection",
	highlightCaption: "Allumer / éteindre le rectangle entourant l'élément sélectionné",
	fontPane: "Police",
	layoutPane: "Cadrage",
	borderPane: "Bordure",
	marginPane: "Marge",
	colorPane: "Couleur",
	shadowPane: "Ombrage",
	cssTextPane: "CSS",
	factoryReset: "Restaurer tous les réglages par défaut",

	topSide: "En haut",
	rightSide: "A droite",
	bottomSide: "En bas",
	leftSide: "A gauche",
	allSides: "Tous&nbsp;côtés",

	smallcaps: "Police en petites majuscules",
	capitalize: "Majuscule pour chaque mot",
	uppercase: "Texte en majuscules",
	lowercase: "Texte en minuscules",
	fontSize: "Taille",
	lineHeight: "Interligne",
	letterSpacing: "Inter-caractères",
	wordSpacing: "Inter-mots",
	bold: "Gras",
	italic: "Italique",
	underline: "Souligné",
	lineThrough: "Barré",
	overline: "Surligné",
	fontFamily: "Choix de police",

	contentsAlign: "Alignement du contenu",
	elementPosition: "Position de l'élément",
	widthTitle: "Largeur",
	width: "Absolue:",
	minWidth: "Mini:",
	maxWidth: "Maxi:",
	left: "A gauche",
	right: "A droite",
	center: "Centrer",
	justify: "Aligner à droite et à gauche",
	leftPosition: "A gauche",
	rightPosition: "A droite",
	centerPosition: "Centrer",
	floatLeft: "Incruster en-dessous à gauche",
	floatRight: "Incruster en-dessous à droite",
	clear: "Positionner sous tout ce qui est incrusté",
	wrapSpaces: "Pas de retour à la ligne automatique",

	borderWidth: "Epaisseur",
	borderStyle: "Type de trait",
	borderColor: "Couleur de bordure",
    borderRadius: "Arrondi",    
	sideChooser: "Choisir le côté à régler:",
	borderTopSide: "Bordure haute, coin haut gauche",
	borderRightSide: "Bordure droite, coin haut droit",
	borderBottomSide: "Bordure basse, coin bas droit",
	borderLeftSide: "Bordure gauche, coin bas gauche",

	margin: "Marge externe",
	padding: "Marge interne",

	backgroundColor: "Couleur du fond",
	color: "Couleur du texte",
	backgroundImage: "Image de fond",
	newImage: "Choisir une nouvelle image",
	backgroundImageCaption: "Choisir une image déjà utilisée ou supprimer",
	noImage: "Pas d'image",
	repeatX: "Répéter l'image en horizontal",
	repeatY: "Répéter l'image en vertical",
	repeat: "Répéter l'image en horizontal et vertical",
	cover: "Etendre l'image pour couvrir tout le fond",
	contain: "Etendre l'image pour couvrir la largeur ou la hauteur",
	bgPosition: "Réglage de la position de l'image",
	red: "Réglage du rouge",
	green: "Réglage du vert",
	blue: "Réglage du bleu",
	lightness: "Réglage de la luminosité",
	saturation: "Réglage de l'intensité des couleurs, saturation",
	colormap: "Carte des couleurs",
    opacity: "Opacité",
    
    textShadow: "Ombrage du texte",
    boxShadow: "Ombrage de l'élément",
    shadowOffset: "Position de l'ombre",
    shadowBlur: "Flou",
    shadowSpread: "Étendue",
    shadowInset: "Ombre à l'intérieur",

	cssWarning: "<b>ATTENTION</b><br />Vous devez savoir<br />ce que vous faites<br />en modifiant la css.<br />Utilisateurs avertis<br />seulement !!<br />",

	// Models
	saveModelText: "Nom du modèle:",
	replaceModel: ": ce modèle existe déjà.<br />Voulez-vous le remplacer?",
	alterModel: "Modification de modèle",
	alterModelText: "<b>ATTENTION:</b> Le modèle va être modifié&nbsp;!!",
	alterModelShiftText: "Vous tentez de modifier le modèle&nbsp;!!<br />Si c'est réellement ce que vous voulez faire, recommencez l'opération avec la touche Maj(uscule) enfoncée, sinon détachez le bloc de son modèle.",
	removeFromModel: "<b>ATTENTION:</b> L'élément sélectionné va être retiré de son modèle&nbsp;!!",
	removeFromModelShift: "Vous tentez de retirer l'élément de son modèle&nbsp;!!<br />Si c'est réellement ce que vous voulez faire, recommencez l'opération avec la touche Maj(uscule) enfoncée, sinon détachez au préalable le bloc de son modèle.",
	dontRemoveFromModel: "Vous tentez de retirer un élément à contenu libre de son modèle&nbsp;!!<br /> Si cet élément disparaît du modèle, tout son contenu disparaitra également de toutes les pages du site qui l'utilisent.<br />Si c'est réellement ce que vous voulez faire, il faut détacher le bloc du modèle, faire l'opération puis enregistrer de nouveau le modèle, sinon détachez au préalable le bloc de son modèle.",

	importModel: "Import de modèle",
	more: "Importer des modèles...",

	modelManagement: "Gestion des modèles",
	delete_models: "Suppression de modèles",
	delete_modelsText: "Vous êtes sur le point de supprimer les modèles suivants.<br /><b>ATTENTION</b>: La suppression est immédiate et irréversible.",

	// Main toolbar
	moreCaption: "Autres contrôles",
	addCaption: "Ajouter une page",
	deletePageTitle: "Suppression de la page",
	deletePageText: "Vous êtes sur le point de supprimer la page en cours.<br />ATTENTION: La suppression est immédiate et irréversible.",
	deletePageDraftTitle: "Suppression de la page brouillon",
	deletePageDraftText: "Cette page n'a pas été validée, les modifications en cours seront donc abandonnées.<br />ATTENTION: La suppression est immédiate et irréversible.",
	gridCaption: "Voir/cacher la grille",
	showBlocksCaption: "Voir/cacher les blocs",
	showModelsCaption: "Voir/cacher les modèles",
	toolsCaption: "Administration: paramètres et utilitaires",
	sitemapCaption: "Plan du site",
	nameText: "Nom:",
	nameCaption: "Nom de la page dans le menu et le titre de la fenêtre. Une page sans nom n'apparaît pas dans le menu mais pourra être accédée par un lien (texte ou image).",
	titleText: "Titre de la page dans le navigateur",
	titleCaption: "Suite du titre de la fenêtre, après le nom et le préfixe (optionnels), pertinent et pas plus de 100 caractères au total.",
	previewCaption: "Prévisualisation: voir les brouillons en mode visite simple",
	recordCaption: "Enregistrer les modifications (Ctrl + s)",
	publishCaption: "Valider les dernières modifications...",
	exitCaption: "Déconnexion",

	// Add element
	models: "Modèles",
	paste: "Presse-papier",
	addElement: "Faire glisser ce nouvel élément vers l'emplacement souhaité",

	// Sitemap
	sitemap: "Plan du site",
	smPublish: "Publication du plan de site",
	smPublishCaption: "Valider ce plan de site pour le rendre public",
	smPublishText: "Vous êtes sur le point de valider ce plan de site brouillon.<br />Il remplacera le plan actuel dans le site accessible au public.",
	smDeleteTitle: "Suppression du plan de site",
	smDeleteText: "Vous êtes sur le point de supprimer le plan du site,<br />les pages ne seront plus classées.<br />ATTENTION: La suppression est immédiate et irréversible.",
	smDeleteDraftTitle: "Suppression du plan de site brouillon",
	smDeleteDraftText: "Ce plan n'a pas été validé, les modifications en cours seront donc abandonnées.<br />ATTENTION: La suppression est immédiate et irréversible.",
	status_256: "Page brouillon, jamais publiée",
	status_512: "Page publiée à jour",
	status_768: "Page brouillon, page publiée plus ancienne",

	// Page
	publishTitle: "Publication",
	publishText: "Les éléments suivants sont en relation avec cette page.<br />Les éléments en brouillon peuvent être sélectionnés<br />puis rendus publics en cliquant sur Enregistrer.",
	publishPageText: "Cette page",
	publishCssText: "Tous les styles du site",
	publishSitemapText: "Plan du site",
	newPageTitle: "Création d'une page",
	newPageLang: "Langue de la nouvelle page: ",

    pageSettingsCaption: "Autres paramètres de page",
	metaDescription: "Description de la page",
	metaDescriptionCaption: "Affichée par certains moteurs de recherche, 100 à 255 caractères",
	noRobots: "Interdire l'exploration par les moteurs de recherche",
	notResponsive: "Désactiver la mise en page adaptative",
	pageUrl: "URL de la page",
	changeUrlText: "Vous êtes sur le point d'enregistrer la page courante avec le même identifiant URL qu'une autre page.<br />Si vous continuez, la page courante remplacera l'autre.",
	redirectTo: "Rediriger vers",
	redirectToCaption: "URL interne relative ou URL externe",
	hdrHtml: "HTML additionnel dans la section head",
	hdrHtmlCaption: "balises keywords, author etc.",

	// Cell
	cellWidth: "Largeur de la cellule"
	//cellHeight: "Hauteur de la cellule"
    };
    return that;
}();
