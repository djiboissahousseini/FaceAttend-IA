# 🎓 FaceAttend : Système de Gestion de Présence par IA

Bienvenue dans le dépôt officiel de **FaceAttend**, une solution de pointe pour l'automatisation de l'émargement universitaire utilisant la reconnaissance faciale.

---

## 🌟 Points Forts du Projet
- 🤖 **Reconnaissance Faciale Temps Réel** : Utilisation de DeepFace et Facenet pour une identification précise.
- 📱 **PWA (Progressive Web App)** : Installable sur mobile et fonctionne partiellement hors-ligne.
- 📊 **Tableau de Bord "Nerve Center"** : Interface d'administration ultra-moderne pour le suivi global.
- 🛡️ **Sécurité Renforcée** : Détection de vivacité et routage intelligent selon l'appareil (Local vs Réseau).
- 📄 **Rapports Automatisés** : Génération de feuilles de présence en PDF.

---

## 🛠️ Stack Technologique

### **Frontend**
- **React 18** & **TypeScript**
- **Tailwind CSS** (Design moderne & responsive)
- **Vite** (Build ultra-rapide)
- **Face-api.js** (IA côté client)

### **Backend**
- **FastAPI** (Python 3.10+)
- **PostgreSQL** & **SQLAlchemy** (Base de données relationnelle)
- **DeepFace** & **OpenCV** (IA & Traitement d'images)
- **Pydantic** (Validation de données)

---

## 📁 Structure du Projet

```text
FaceAttend/
├── backend/            # Serveur FastAPI & API IA
├── src/                # Code Source Frontend (React + TS)
├── scripts/            # Scripts opérationnels (Bash) pour le déploiement
├── docs/               # Documentation détaillée et guides
├── public/             # Assets statiques (Images, Logos)
└── requirements.txt    # Dépendances Python
```

---

## 🚀 Installation et Lancement

### 1. Prérequis
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL

### 2. Configuration du Backend
```bash
# Accéder au dossier backend
cd backend
# Créer et activer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
# Installer les dépendances
pip install -r ../requirements.txt
# Lancer le serveur
uvicorn main:app --reload
```

### 3. Configuration du Frontend
```bash
# À la racine du projet
npm install
# Lancer l'application en mode développement
npm run dev
```

> [!TIP]
> **Lancement rapide :** Vous pouvez utiliser `npm start` pour lancer les scripts de démarrage automatisés situés dans le dossier `./scripts/`.

---

## 👥 Guide pour les Contributeurs
Pour nos camarades souhaitant contribuer au projet :
1. **Lisez la doc** : Consultez le dossier `docs/` pour comprendre les algorithmes et la structure.
2. **Linting** : Utilisez `npm run lint` pour garder un code propre.
3. **Tests** : Des scripts de simulation sont disponibles dans `tools/`.

---
*Développé avec ❤️ par l'équipe FaceAttend - 2026*
