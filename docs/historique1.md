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
