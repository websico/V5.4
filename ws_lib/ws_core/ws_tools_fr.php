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
 *  LANGUAGE DEPENDANT DATA
 *  ---------------------------------------
 *	Language is defined in config file.
 */

$ws_tools_title = 'Administration du site';
$ws_preferences_title = 'Préférences';
$ws_editor_language_text = 'Langue du webmestre :';
$ws_editor_password_text = 'Mot de passe du webmestre :';
$ws_pwd_error = " Le mot de passe doit comporter de 6 à 32 caractères, avec au moins un caractère spécial ('-', '+', '$', ...)";
$ws_timeout_text = 'Expiration du mot de passe (sec) :';
$ws_title_prefix_text = 'Préfixe du titre de fenêtre du navigateur :';
$ws_no_name_in_title_text = 'Ne pas inclure le nom de la page dans le titre :';
$ws_icon_text = 'Icone du site (xxx.ico 16x16 recommandé) :';
$ws_robots_text = "Interdire l'exploration par les moteurs de recherche :";
$ws_explore_text = 'Interdire le mode exploration :';
$ws_site_languages_text = 'Langues du site, la première sera celle par défaut<br />(IANA registry language codes), Ex: "en, zh, fr, fr-CA" :';
$ws_responsive_title = "Comportement adaptatif";
$ws_fleximage_text = "Désactiver les images flexibles :";
$ws_column_text = "Désactiver le réarrangement automatique des colonnes pour petits écrans :";
$ws_XS_Width_text = "Taille XS = largeur maximale très petit écran (téléphone, en pixels) :";
$ws_S_Width_text = "Taille S = largeur maximale petit écran (tablette, en pixels) :";
$ws_M_Width_text = "Taille M = largeur maximale écran moyen (bureau, en pixels) :";
$ws_model_ix_title = "Import/export de modèles";
$ws_default_model_shop_text = "Serveur de modèles :";
$ws_model_export_authorized_text = "Export de modèles autorisé :";

$ws_update_software_title = 'Mise à jour du logiciel';
$ws_actual_install_text = 'Version installée : ';
$ws_ref_install_text = 'Version de référence : ';
$ws_uptodate_text = 'Votre logiciel est à jour.';
$ws_outofdate_text = 'Une version officielle plus récente que la vôtre est disponible. En cliquant ci-après vous déclencherez la mise à jour. Une sauvegarde préalable du site sera effectuée, vous permettant de revenir ultérieurement à l\'état actuel en appliquant une restauration.';
$ws_update_software = 'Mise à jour immédiate';
$ws_update_later = 'Plus tard';
$ws_confirm_update = "Le logiciel du site va être remplacé par une nouvelle version. Ne pas oublier d'actualiser les pages dans le navigateur, l'affichage pouvant être perturbé après retour au site.";

$ws_hosts_title = 'Domaines rattachés';
$ws_detach_host = 'Détacher';
$ws_attach_host = 'Rattacher';
$ws_hosts_text = 'Pour rattacher des noms de domaine à ce site (votrenom.com par exemple), vous devez les réserver auprès d\'un bureau d\'enregistrement, paramétrer leur zone DNS (enregistrement de type A) pour indiquer l\'adresse d\'hébergement <b>'.@$_SERVER['SERVER_ADDR'].'</b>, et les rajouter ci-dessous.';

$ws_backup_title = 'Sauvegardes du site';
$ws_backup = 'Sauvegarder le site complet';
$ws_download_data = 'Sauvegarder les données du site sur votre poste...';
$ws_upload_data = 'Récupérer les données du site sauvegardées sur votre poste: ';
$ws_restore = 'Récupérer la sauvegarde complète du ';
$ws_windows_alert = WINDOWS ? 'ATTENTION aux écrasements de fichiers dûs à la gestion majuscule/minuscule des noms de fichier sous Windows !\n\n' : '';
$ws_confirm_restore = "Le site actuel va être remplacé par la sauvegarde. Ne pas oublier d'actualiser les pages dans le navigateur, l'affichage pouvant être perturbé après retour au site.";
$ws_ok_caption = "Ok";

$ws_record_caption = 'Enregistrer';
$ws_exit_caption = 'Retour';

$ws_corrupted_pwd = 'Mot de passe invalide, reste inchangé !!';
$ws_cant_edit = 'Les données de contact et/ou bancaires doivent être renseignées pour poursuivre.';
$ws_nosite = ' n\'existe pas !!';
?>
