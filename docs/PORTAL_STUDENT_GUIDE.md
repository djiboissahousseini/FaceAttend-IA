# 📱 Guide des Fonctionnalités - Portail Étudiant FaceAttend

Ce document sert de référence pour comprendre le fonctionnement et la logique métier du Portail Étudiant (Portail Mobile).

---

## 🔒 1. Accès et Sécurité
- **URL d'accès** : Détectée automatiquement au lancement via `./start_all.sh` (ex: `http://10.x.x.x:5173/portal`).
- **Authentification** : Se fait par le **Code Étudiant** (Matricule) et l'**Email**.
- **Isolation Réseau** : 
    - Le système détecte si l'appareil est un mobile ou un PC tiers.
    - Toute tentative d'accès aux pages `/admin` ou `/teacher` depuis un appareil autre que le serveur central redirige automatiquement vers le `/portal`.

---

## 📊 2. Tableau de Bord (Accueil)
Une vue d'ensemble de l'assiduité globale de l'étudiant sur le semestre.

- **Jauge d'Assiduité Circulaire** : 
    - Affiche le pourcentage global de présence.
    - **Logique Réaliste** : Affiche **0%** (et non 100%) si aucun cours n'a encore eu lieu, pour inciter à la première présence.
- **Compteur de Présences (Vert)** : Somme totale des séances marquées "Présent" ou "En retard".
- **Compteur d'Absences (Rouge)** : Somme totale des séances manquées.

---

## 📚 3. Mes Modules (Suivi Expert)
C'est le cœur de la gestion pédagogique. Chaque matière est affichée sous forme de carte dynamique.

- **Calcul du Taux par Module** : Ratio présences/absences spécifique à chaque matière.
- **Gestion des Quotas d'Absences** :
    - Le système récupère le `absence_threshold` configuré pour chaque cours (ex: 5 ou 8).
    - **Absences possibles** : Affiche en temps réel le nombre de jokers restants avant sanction (Seuil - Absences actuelles).
- **Indicateurs de Danger (Code Couleur)** :
    - **Vert** : Situation normale.
    - **Orange** : Seuil presque atteint (il ne reste qu'une absence possible).
    - **Rouge + Clignotement** : **"⚠️ Alerte Exclusion"** s'affiche dès que le seuil est atteint ou dépassé.

---

## 📅 4. Emploi du Temps
Synchronisation directe avec la planification de la base de données.

- **Tri Intelligent** : Organisé par jour de la semaine et par heure.
- **Distinction des Types** : Badges de couleur pour différencier **Cours**, **TD** et **TP**.
- **Filtrage de Groupe** : L'étudiant ne voit que les cours "ALL" et les séances de TD/TP spécifiques à son propre groupe (ex: Groupe 01).

---

## 🕒 5. Historique des Scans
Journal de bord personnel et sécurisé.

- **Traçabilité** : Date et heure précise de chaque scan facial réussi.
- **Statuts détaillés** : Présence validée, Absence marquée, ou Retard.

---

## 👤 7. Profil et Informations Personnelles
L'onglet **Profil** centralise les données académiques de l'étudiant.

- **Identité Visuelle** : Affiche la photo officielle utilisée pour la reconnaissance faciale.
- **Détails Académiques** :
    - Email académique.
    - Filière / Département.
    - Groupe d'étude actuel.
- **Déconnexion Sécurisée** : Permet de fermer la session pour protéger l'accès aux données de présence.

---

## ☰ 8. Navigation et Menu Latéral
En plus de la barre de navigation basse (Tab Bar), un menu latéral ("Drawer") offre des options supplémentaires.

- **Emploi du Temps** : Accès rapide au planning hebdomadaire détaillé.
- **Paramètres** : Configuration des préférences d'affichage (thème sombre par défaut).
- **Version du Système** : Affiche la version actuelle (ex: `FaceAttend Connect v2.4`).

---

## ⚡ 9. Temps Réel et Synchronisation
Le portail n'est pas statique ; il interagit constamment avec le serveur central.

- **Auto-Refresh** : Les statistiques (taux d'assiduité, absences) sont rafraîchies automatiquement toutes les **30 secondes**.
- **Re-Sync sur Navigation** : À chaque changement d'onglet, une requête de synchronisation forcée est envoyée pour garantir l'exactitude des données affichées.

---

## 🛠️ 10. Spécifications Techniques
- **Design Mobile-First** : Interface optimisée pour une utilisation sur smartphone (PWA ready).
- **UI/UX Moderne** : Utilisation d'un thème "Ultra-Neon" (Slate & Emerald) pour une lisibilité maximale en extérieur.
- **Framework** : Propulsé par React (Vite) et Tailwind CSS pour une fluidité optimale.
