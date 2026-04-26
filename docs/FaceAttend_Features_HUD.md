# 🛡️ FaceAttend Pro : Guide des Fonctionnalités HUD

Ce guide récapitule les fonctionnalités avancées du système de surveillance IA et la manière de les manipuler pour une efficacité maximale.

---

## 🏢 1. Gestion des Salles (Nouveauté)
La gestion des salles est devenue le socle de l'organisation. Elle permet de définir les lieux physiques de manière structurée.

### 💡 Signification
Une salle n'est plus un simple texte, c'est une entité avec une **capacité** et un **bâtiment**. 

### 🛠️ Manipulation
1. Allez dans l'onglet **"Gestion des Salles"**.
2. **Consulter** : Visualisez les salles existantes, leurs capacités et leurs bâtiments.
3. **Ajouter** : Utilisez le bouton `+ Ajouter` pour enregistrer un nouveau local.
4. **Impact** : Une salle créée ici apparaît instantanément dans les menus déroulants des cours et du centre de commande.

---

## ⚡ 2. Lancement Anticipé (Focus)
C'est la fonctionnalité qui permet de "forcer" le démarrage d'un cours prévu aujourd'hui.

### 🔍 Ce qu'elle fait réellement
* **Filtrage Intelligent** : Elle ne vous propose que les cours prévus pour la **date du jour**.
* **Flexibilité de Salle** : Elle affiche tous les cours de la journée, peu importe la salle initialement prévue.
* **Redirection Dynamique** : Si vous lancez un cours (ex: prévu en B1) alors que vous surveillez la salle **B2**, le système :
    1. Met à jour la séance en base de données pour la fixer sur **B2**.
    2. Envoie l'ordre de démarrage immédiat au terminal de la salle **B2**.
* **Synchronisation** : La caméra de la salle sélectionnée s'active instantanément et commence la détection.

---

## 📅 3. Programmation des Séances
La planification a été simplifiée pour éviter toute saisie manuelle.

### 🚀 Planifier vs Lancer Directement
* **Planifier** : Enregistre le cours dans l'agenda sans l'activer sur le terminal. Idéal pour préparer sa journée à l'avance.
* **Lancer Directement** : Enregistre le cours ET déploie immédiatement l'IA sur le terminal de la salle. Le cours devient "Live" instantanément.
* **Auto-Complétion** : Lorsque vous choisissez un module, l'enseignant et le groupe par défaut sont sélectionnés automatiquement.

---

## 🤖 4. Commandes Tactiques IA
Dans le panneau **Centre de Commande**, vous disposez de boutons de contrôle directs sur le terminal distant :

* **Anti-Spoofing** : Active/Désactive la détection de vivacité (Liveness). Indispensable pour bloquer les tentatives de fraude par photo/écran.
* **Suivi IA** : Active l'auto-tracking pour que la caméra suive les visages détectés.
* **Mettre en Pause** : Suspend temporairement la détection sans fermer la séance.
* **Redémarrer Écran** : Rafraîchit le terminal distant en cas de bug d'affichage.

---

## 🏷️ 5. Nomenclature des Groupes
Pour une clarté optimale, nous avons harmonisé les intitulés :
* **"ALL"** -> Devient **"TOUS LES GROUPES"** dans l'interface (signifie que le cours concerne l'ensemble des étudiants d'un module).

---

> [!TIP]
> Utilisez toujours le menu déroulant de sélection de salle en haut du Centre de Commande pour choisir quel terminal vous souhaitez piloter. Chaque salle est un univers autonome !
