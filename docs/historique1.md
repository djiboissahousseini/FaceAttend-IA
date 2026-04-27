# Historique des Changements - Projet FaceAttend

## [26/04/2026] - Initialisation du plan "Interconnexion et Alertes Temps Réel"

### État du Système (Avant modifications)
- **Backend** : Déjà fonctionnel avec la fonction `sync_student_alerts`. Il gère le calcul des absences et l'enregistrement des alertes dans la table `absence_alerts`.
- **Seuil** : Dynamique (basé sur la table `courses`), par défaut à 3 ou 5 selon la configuration du cours.
- **Frontend Admin** : Possède un mode "Tunnel IA" (Simulation) pour voir le dashboard enseignant.
- **Frontend Enseignant** : Affiche déjà une liste d'alertes basique, mais manque de visibilité en temps réel et d'indicateurs de risque colorés.

### Objectif du Plan
1. Rendre le système de suivi des absences et alertes totalement interconnecté.
2. Améliorer l'interface Enseignant (Frontend uniquement) pour un suivi en temps réel.
3. Ajouter des indicateurs de risque (Vert/Orange/Rouge) basés sur le seuil d'absences.

### Modifications effectuées
- **Frontend (TeacherDashboard)** : Ajout d'un système de badges de risque dynamiques dans la modal de liste des étudiants.
    - Badge **CRITICAL** (Rouge pulse) pour les absences >= seuil.
    - Badge **WARNING** (Orange) pour les absences proches du seuil (seuil - 1).
    - Badge **SAFE** (Vert) pour les situations normales.
    - Utilisation d'un seuil par défaut de 5 absences si non spécifié par le backend.
- **Frontend (TeacherDashboard)** : Amélioration de l'onglet "Alertes IA".
    - Ajout d'une bannière de rappel du seuil de surveillance.
    - Ajout d'un badge "Risque Exclusion" clignotant pour les étudiants critiques.
    - Affichage du ratio d'absences par rapport au seuil pour chaque alerte.
- **Frontend (Admin Dashboard)** : Intégration d'une vue globale des alertes.
    - Ajout d'une carte statistique "Alertes IA" sur le tableau de bord principal de l'Administrateur pour un suivi macroscopique des risques d'exclusion.
- **Frontend (Student Dashboard)** : Automatisation et Synchronisation Totale.
    - Accélération de la synchronisation (polling réduit à 15s).
    - Implémentation d'un moteur de risque global (Matrix Sync) qui change la couleur de l'interface selon l'état de l'étudiant.
    - Ajout d'une bannière d'alerte critique sur l'écran d'accueil en cas de seuil atteint.
    - Harmonisation visuelle des badges (CRITICAL/WARNING/SAFE) pour une cohérence totale avec les vues Professeur et Admin.

## [27/04/2026] - Rebrandisation Universitaire et Optimisation des Rapports

### Modifications effectuées
- **Identité Visuelle (Branding)** : Intégration complète du nom et du logo de l'**Université Belhadj Bouchaïb (Aïn Témouchent)** sur tous les tableaux de bord (Admin et Enseignant).
- **Rapports d'Assiduité (Reports)** :
    - Ajout d'une section **"Liste Rouge"** dynamique affichant les étudiants en situation critique directement dans l'interface.
    - Synchronisation de la liste des groupes : tous les groupes d'étudiants (01, 02, 03, 04, etc.) sont désormais visibles dans les filtres, même sans enregistrements préalables.
    - Correction du compteur global d'enregistrements pour refléter l'activité réelle du système.
- **Gestion des Alertes (Alerts)** :
    - Implémentation d'une **Modal d'Inspection de Cours** permettant de voir la liste complète des étudiants inscrits à un cours et leur état d'absence en temps réel.
- **Backend (API & Logic)** :
    - **Matching Intelligent** : Optimisation des jointures SQL pour faire correspondre les sessions et les cours même en cas de différences de casse ou de préfixes (ex: "se" match avec "Cours SE").
    - **Réveil Automatique de la Caméra** : Ajout d'une détection des sessions `scheduled` dans `get_current_session`, permettant à la caméra de salle de démarrer automatiquement selon l'emploi du temps.
- **DevOps & Mobilité** :
    - **Unification du Script Mobile** : Mise à jour de `connect_phones.sh` pour gérer à la fois le reverse proxy web/API et le tunnel DroidCam (port 4747) en un seul passage.
    - Nettoyage des scripts de démarrage et organisation des outils de diagnostic.
