#!/bin/bash
# Script de lancement automatique pour FaceAttend
# Usage: ./start_all.sh

echo "🚀 Lancement de FaceAttend..."

# Revenir à la racine du projet
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_ROOT"

# 1. Libérer les ports et fermer les navigateurs
echo "🧹 Nettoyage des ports et des navigateurs..."
fuser -k 8000/tcp 5173/tcp 2>/dev/null || true
pkill -9 -f "chrome" 2>/dev/null
pkill -9 -f "firefox" 2>/dev/null
pkill -9 -f "chromium" 2>/dev/null
pkill -9 -f "msedge" 2>/dev/null
sleep 2

# 2. Lancer le Backend en arrière-plan
echo "🚀 Démarrage du Backend (FastAPI)..."
cd "$PROJECT_ROOT/backend"
# Utilisation du chemin relatif pour le venv
source ../venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2> ../logs/backend.error &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Attendre que le backend soit prêt
sleep 3
echo "   Backend prêt ✅"

# 3. Lancer le Frontend
echo "💻 Démarrage du Frontend (Vite)..."
cd "$PROJECT_ROOT"

# Ouvrir automatiquement les portails de sécurité
(
  sleep 5
  echo "🛡️  Lancement des portails de sécurité..."
  # Priorité 1 : Admin Dashboard
  python3 -m webbrowser "http://localhost:5173/admin" 2>/dev/null
  sleep 1.5
  # Priorité 2 : La Caméra (Terminal de reconnaissance)
  python3 -m webbrowser "http://localhost:5173/camera" 2>/dev/null
  sleep 1
  # Priorité 3 : Le Portail Enseignant (Contrôle)
  python3 -m webbrowser "http://localhost:5173/teacher" 2>/dev/null
  sleep 1
  # Priorité 4 : Le Portail Étudiant (Portrait)
  python3 -m webbrowser "http://localhost:5173/portal" 2>/dev/null
) &

# --- GESTION DE L'ARRÊT (Ctrl+C) ---
cleanup() {
    echo ""
    echo "🛑 Signal d'arrêt détecté (Ctrl+C)..."
    echo "🧹 Fermeture automatique des onglets du navigateur..."
    pkill -9 -f "chrome" 2>/dev/null
    pkill -9 -f "firefox" 2>/dev/null
    pkill -9 -f "chromium" 2>/dev/null
    pkill -9 -f "msedge" 2>/dev/null
    
    echo "🔌 Arrêt du Backend (PID: $BACKEND_PID)..."
    kill -9 $BACKEND_PID 2>/dev/null
    
    echo "✅ Système FaceAttend arrêté avec succès."
    exit 0
}

# Capturer les signaux d'interruption
trap cleanup SIGINT SIGTERM

# npm run dev est bloquant
npm run dev
