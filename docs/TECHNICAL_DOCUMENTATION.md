# Documentation Technique - FaceAttend

Ce document regroupe l'ensemble des modélisations UML du système FaceAttend.

## I. Diagrammes de Cas d'Utilisation

### 1. Administration des Utilisateurs
![Admin Utilisateurs](/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_admin_utilisateurs.png)
*Description : Gère l'authentification des administrateurs et le cycle de vie (CRUD) des professeurs et étudiants.*

### 2. Opérations Critiques du Système
![Admin Opérations](/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_admin_entites_operations.png)
*Description : Couvre la gestion des séances, l'IA, les alertes d'absences et les rapports.*

### 3. Espace Enseignant
![Enseignant](/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_enseignant_final.png)
*Description : Distinction entre le login web (Mot de passe) et le terminal caméra (Code PIN).*

### 4. Espace Étudiant
![Étudiant](/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_etudiant_final.png)
*Description : Accès au portail de suivi et à l'application mobile.*

### 5. Système de Reconnaissance Faciale (Cœur IA)
![Caméra IA](/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_camera_ia.png)
*Description : Pipeline détaillé en 5 étapes, incluant l'Anti-Spoofing (Liveness) et FaceNet.*

---

## II. Diagrammes de Séquence Détaillés

### 1. Ajout d'un Utilisateur
![Séquence Ajouter](/home/usain/Bureau/FaceAttend/docs/diagrams/sequences_detaillees/seq_ajouter.png)

### 2. Modification
![Séquence Modifier](/home/usain/Bureau/FaceAttend/docs/diagrams/sequences_detaillees/seq_modifier.png)

### 3. Recherche
![Séquence Rechercher](/home/usain/Bureau/FaceAttend/docs/diagrams/sequences_detaillees/seq_rechercher.png)

### 4. Suppression
![Séquence Supprimer](/home/usain/Bureau/FaceAttend/docs/diagrams/sequences_detaillees/seq_supprimer.png)

### 5. Création de Séance
![Séquence Séance](/home/usain/Bureau/FaceAttend/docs/diagrams/sequences_detaillees/seq_creer_seance.png)
