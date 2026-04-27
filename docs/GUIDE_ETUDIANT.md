# 🎓 Guide de Contribution & Technologies - FaceAttend

Ce document est destiné aux étudiants et contributeurs du projet FaceAttend pour comprendre l'architecture et les outils nécessaires.

---

## 🛠️ Technologies Utilisées

### **1. Interface (Frontend)**
- **React 18** : Framework UI.
- **TypeScript** : Typage statique pour la robustesse.
- **Tailwind CSS** : Framework CSS utilitaire pour un design premium.
- **Vite** : Serveur de développement et outil de build.
- **Face-api.js** : Bibliothèque de détection faciale côté client.

### **2. Serveur & IA (Backend)**
- **FastAPI** : Framework Web Python ultra-performant.
- **DeepFace** : Framework de reconnaissance faciale (Modèle : `Facenet`).
- **OpenCV** : Traitement d'images et flux vidéo.
- **PostgreSQL** : Base de données avec support `jsonb` pour les encodages faciaux.
- **SQLAlchemy** : ORM pour la gestion de la base de données.

---

## 📁 Organisation du Code

- `/src` : Contient l'application React (Pages, Composants, Types).
- `/backend` : Contient l'API Python et la logique de reconnaissance.
- `/scripts` : Scripts Bash pour automatiser le démarrage et la gestion des caméras.
- `/docs` : Documentation technique supplémentaire.

---

## 🚀 Installation pour les Nouveaux
Pour installer le projet sur votre machine :

### **Backend**
1. Installer Python 3.10+
2. Créer un venv : `python -m venv venv`
3. Installer les dépendances : `pip install -r requirements.txt`
4. Lancer : `uvicorn backend.main:app --reload`

### **Frontend**
1. Installer Node.js
2. Lancer : `npm install`
3. Lancer : `npm run dev`

---

## 💡 Conseils pour l'équipe
- Toujours vérifier que la **Webcam** est autorisée par le navigateur.
- Le backend doit être lancé sur le port **8000** par défaut.
- Consultez `docs/project_structure.md` pour plus de détails sur l'arborescence.

---
*FaceAttend - 2026 - Guide Officiel*
