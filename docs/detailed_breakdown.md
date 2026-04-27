# Spécifications Détailées des Modules FaceAttend

Ce document offre une vue granulaire sur les responsabilités de chaque composant du système.

---

## 1. Backend (Le Cerveau IA)
Le backend est construit avec **FastAPI** et **DeepFace**. Il gère la logique de sécurité et la base de données.

- **`main.py`** : Point d'entrée unique. Gère les routes API, l'authentification des professeurs (via PIN ou Visage) et l'enregistrement des présences.
- **`database.py`** : Configuration SQLAlchemy pour la persistance des données.
- **`models.py`** : Schémas des tables (Students, Teachers, Sessions, AttendanceRecords).
- **`uploads/`** : Répertoire critique stockant les photos sources utilisées pour les comparaisons faciales.
- **`norm_group` (Logic)** : Algorithme interne pour faire correspondre les noms de groupes saisis manuellement avec les données structurées.

## 2. Frontend (L'Interface Utilisateur)
Une application **React + TypeScript** moderne, typée et sécurisée.

- **`App.tsx`** : Gestionnaire de routes avec protection par redirection automatique pour les appareils mobiles.
- **`src/pages/Attendance.tsx`** : Le centre de commandement pour l'administrateur (gestion des séances live et planification).
- **`src/pages/ClassroomCamera.tsx`** : Interface HUD "Cyberpunk" destinée au terminal de la salle. Gère le scan temps réel et la synthèse vocale.
- **`src/pages/StudentPortal.tsx`** : Vue simplifiée et progressive (PWA) pour les étudiants sur mobile.
- **`src/pages/Reports.tsx`** : Générateur de statistiques et exportateur PDF.

## 3. Scripts (L'Opérationnel)
Fichiers d'automatisation pour le déploiement et la maintenance.

- **`start_all.sh`** : Automatise tout le workflow (nettoyage des ports, lancement backend, lancement frontend, ouverture des navigateurs).
- **`connect_phones.sh`** : Utilise ADB pour configurer les tunnels `reverse` et `forward`, permettant à un smartphone d'accéder au serveur local comme s'il était sur `localhost`.
- **`camera.sh`** : Utilitaire pour relier les flux IP (DroidCam) au système de reconnaissance.

## 4. Tools (Développement & Audit)
Outils annexes pour garantir la qualité du code.

- **`test_alert.py`** : Script Python pour valider manuellement le déclenchement des alertes d'absence.
- **`generate_fake_alerts.py`** : Outil de remplissage de base de données pour les démonstrations.
- **`lint_report.txt`** : Historique des audits de qualité (Prettier/ESLint).

## 5. Docs (Documentation)
- **`m2.md`** : Spécifications techniques du "Bus de Commande" (LocalStorage vs Polling).
- **`camera_behaviors.md`** : Guide des interactions visuelles et sonores.

---
*FaceAttend - Architecture Modulaire - 2026*
