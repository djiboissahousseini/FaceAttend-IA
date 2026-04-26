# Guide Caméra FaceAttend (v2.2)

## 🎯 Aperçu
Ce guide détaille les fonctionnalités de surveillance et de contrôle du terminal caméra via le Dashboard Admin.

---

## 🛠️ Gestion des Sessions (Nouveau v2.2)

Le tableau de bord dispose désormais d'un système à deux onglets pour une gestion précise du planning :

### 1. Sessions Live
Cet onglet affiche les sessions **réellement programmées** pour la journée dans la salle sélectionnée.
- **Démarrage automatique** : Si le Scheduler IA est activé, ces sessions se lancent toutes seules.
- **Contrôle Manuel** :
    - **Annuler (Icône Rouge)** : Interrompt immédiatement une session. Le terminal repasse en veille.
    - **Rétablir (Icône Bleue)** : Réactive une session annulée.
- **Suivi** : Cliquez sur une session pour voir la liste des étudiants en temps réel.

### 2. Agenda Master
Cet onglet affiche l'**emploi du temps théorique** rattaché à la salle.
- Il sert de point de référence pour vérifier les cours prévus par défaut dans la base de données.
- Permet de comparer rapidement le "théorique" avec le "réel" du jour.

## 🧠 Suivi Temps Réel IA (Tracker Automatique)

Cette fonctionnalité agit comme le "pilote automatique" du système FaceAttend.

- **Fonctionnement** : Le système interroge la base de données toutes les minutes pour détecter si un cours est prévu dans la salle active à l'instant T.
- **Auto-Lancement** : Si une correspondance est trouvée dans l'Agenda Master, le terminal sort automatiquement de veille et active le HUD de scan.
- **Gestion de l'Énergie** : Dès qu'une session se termine selon l'emploi du temps, le terminal repasse de lui-même en mode STANDBY.
- **Avantage** : Permet un déploiement "Zero-Click" où le personnel n'a plus besoin d'intervenir manuellement pour lancer les séances.

---

## 🛡️ Fonctionnalités de Sécurité

### Anti-Spoofing (Sécurité)
- **Mode Sécurisé** : La caméra vérifie la bio-activité (profondeur, micro-mouvements).
- **Mode Direct (Démo)** : Désactive les contrôles de sécurité pour une reconnaissance instantanée lors des présentations.

### Déblocage Terminal (Override)
- Permet aux étudiants de scanner sans attendre l'authentification du professeur.
- Utile en cas d'absence imprévue de l'enseignant pour ne pas bloquer le cours.

---

## 🧪 Scénarios de Test

### Test d'annulation d'urgence
1. Sélectionnez une salle (ex: A1).
2. Repérez un cours dans **Sessions Live**.
3. Cliquez sur le bouton rouge **X**.
4. **Résultat attendu** : Le nom du cours se barre, le statut devient "ANNULÉ", et l'écran de la caméra A1 doit repasser en veille (`STANDBY`).

### Test de synchronisation Agenda
1. Allez dans l'onglet **Agenda Master**.
2. Vérifiez que les cours affichés correspondent bien au planning hebdomadaire de la salle.
3. Repassez en **Sessions Live** pour créer une séance réelle basée sur ce planning.

---

## 🚀 Commandes de Maintenance
- **Redémarrer l'Écran** : Force un rafraîchissement complet du terminal caméra.
- **Fermer Session** : Termine proprement la session en cours et enregistre les présences finales.
