# Structure du Projet FaceAttend

Ce document présente l'organisation professionnelle et modulaire du système FaceAttend.

## 📁 Arborescence Globale

```text
FaceAttend/
├── backend/            # Serveur FastAPI (Python)
│   ├── uploads/        # Stockage dynamique des photos de profil
│   └── main.py         # Cœur de l'application & API IA
├── data/               # Données statiques et de test
│   └── test_students_photos/  # Photos pour simulations
├── docs/               # Documentation technique & Guides
│   ├── camera_behaviors.md    # Identité visuelle/sonore de la caméra
│   ├── m2.md                  # Spécifications algorithmiques
│   └── project_structure.md   # [Ce document]
├── public/             # Assets statiques du Frontend
├── scripts/            # Outils opérationnels (Bash)
│   ├── start_all.sh    # Lanceur système complet
│   ├── connect_phones.sh # Configuration ADB & Mobile
│   ├── camera.sh       # Gestion des flux vidéo
│   └── master_reset.sh # Réinitialisation du système
├── src/                # Code Source Frontend (React + TS)
│   ├── components/     # Composants réutilisables (Layout, Cards, etc.)
│   ├── constants/      # Titres, seuils et configurations fixes
│   ├── pages/          # Vues principales (Dashboard, Camera, Portal)
│   ├── types/          # Définitions TypeScript
│   └── utils/          # Fonctions utilitaires (Logger, Image, etc.)
├── tools/              # Scripts de développement et rapports
│   ├── generate_fake_alerts.py # Simulation de données
│   ├── test_alert.py           # Test unitaire des alertes
│   └── lint_report.txt         # Rapports d'audit de code
└── package.json        # Gestionnaire de dépendances & Commandes NPM
```

## 🚀 Commandes de Référence

- **Lancement complet** : `npm start` (Recommandé)
- **Développement Frontend** : `npm run dev`
- **Linting & Audit** : `npm run lint`
- **Simulation Mobile** : `./scripts/connect_phones.sh`

## 🛡️ Sécurité & Routage

- **Machine Locale** (`localhost`) : Accès total aux interfaces Administrateur et Professeur.
- **Appareils Externes** (IP Réseau) : Redirection automatique et obligatoire vers le **Portail Étudiant** (`/portal`).

---
*Dernière mise à jour : 2026 - FaceAttend Corporate*
