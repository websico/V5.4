<?php
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
 *  LANGUAGE DEPENDENT DATA
 *  ---------------------------------------
 */

// Model and style management
// --------------------------
$ws_draft_text = "brouillon";
$ws_public_text = "public";
$ws_th_references = "Référencé dans les pages";
$ws_select_draft = "Supprimer le brouillon";
$ws_select_public = "Supprimer le public";
$ws_not_managed ="Non géré";

$ws_th_model = "Modèle";
$ws_mm_title = "Gestion des modèles";

$ws_th_component = "Type de composant";
$ws_th_style = "Style";
$ws_sm_title = "Gestion des styles";

$ws_rename_title = "Renommer";
$ws_new_name = "Nouveau nom: ";
$ws_name_exists = "ce nom est déjà utilisé.";

// Element messages
// ----------------
$ws_model_text = "Modèle: ";
$ws_free_content_title = "contenu libre ";
$ws_in_model_text = "dans modèle: ";

// Misc
// ----
$ws_cannot_connect = "<br /><br />Le serveur peut être hors service ou arrété, ou les paramètres de connexion erronés.<br />";
$ws_page_too_large = "La page que vous essayez d'enregistrer est trop longue.";
$ws_wrong_id = "Le nom choisi est déjà utilisé.";
$ws_forbidden_operation = "L'opération demandée est impossible à effectuer.";
$ws_not_supported_type = "Les fichiers de ce type ne sont pas supportés.";
$ws_missing_model = "Modèle manquant: ";
$ws_upload_error = "Le fichier n'a pas pu être téléchargé, vérifiez que sa taille est inférieure à ".WS_UPLOAD_MAX_FILESIZE."Mo";
$ws_space_full = "Désolé, votre espace de stockage est saturé.<br>Veuillez vérifier votre abonnement dans la page d'administration de votre site.";
$ws_obsolet_page = "L'opération n'a pu se faire car vous n'étiez<br>pas sur la dernière version de la page.<br>Veuillez recommencer.";
$ws_empty_clipboard = "Le contenu du presse-papier n'a pu être récupéré, probablement parce qu'il est vide.";
$ws_model_recursion = "L'opération n'a pu se faire car on ne peut inclure un modèle dans lui-même.";
$ws_form_nesting = "L'opération n'a pu se faire car on ne peut inclure un formulaire dans un formulaire.";
$ws_notAllowed = 'Action non autorisée.';
$ws_unknownError = "Une erreur non identifiée s'est produite, l'opération n'a pu être effectuée.";

// User classes
// ------------
$ws_component_class_list = array(
				"wsstitle"=>"Titre",
				"wsimage"=>"Image",
				"wstextarea"=>"Texte riche",
				"wsrawtext"=>"Texte brut (HTML)",
				"wssdownload"=>"Téléchargement (pdf, doc...)",
				"wssmenu"=>"Menu",
				"wsspagepath"=>"Chemin de page",
                "wslangselector"=>"Sélecteur de langue",
				"wssmailto"=>"Lien courriel anti-spam",
				"wssform"=>"Formulaire",
				"wssinputfield"=>"Elément de saisie",
				"wssbadge"=>"Lien administration",
				"wssrssreader"=>"Lecteur RSS",
                "wsshowselection"=>"Affichage sélection"
				);

$ws_class_list = array_merge(array("wsspage"=>"Page", "wscontainer"=>"Bloc"), $ws_component_class_list);

?>
