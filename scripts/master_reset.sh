#!/bin/bash
echo "=================================================="
echo " 🔄 MASTER RESET — FACEATTEND SYSTÈME"
echo "=================================================="

echo "[1/6] Nettoyage des Logs de session..."
> backend.log
> backend.err
rm -rf node_modules/.vite/
rm -rf dist/
echo "[1.5/6] Nettoyage RADICAL des navigateurs (Chrome, Firefox, Edge)..."
pkill -9 -f "chrome" 2>/dev/null
pkill -9 -f "firefox" 2>/dev/null
pkill -9 -f "chromium" 2>/dev/null
pkill -9 -f "msedge" 2>/dev/null
sleep 2

echo "[2/6] Arrêt des processus Zombies (Node, Python, DroidCam, ADB)..."
pkill -9 node python python3 droidcam adb 2>/dev/null
fuser -k 8000/tcp 5173/tcp 2>/dev/null
sleep 1

echo "[3/6] Réparation du pilote Caméra (v4l2loopback)..."
sudo fuser -k /dev/video* 2>/dev/null
sudo modprobe -r v4l2loopback 2>/dev/null
sudo modprobe v4l2loopback exclusive_caps=1 card_label="FaceAttend Camera"

echo "[4/6] Vérification de l'environnement..."
if [ ! -d "node_modules" ]; then
    echo "⚠️ node_modules manquant. Réinstallation rapide..."
    npm install --quiet
fi

echo "[5/6] Relance des serveurs (Backend + Frontend)..."
# On utilise nohup pour que les serveurs survivent à la fermeture du terminal
nohup ./start_all.sh > all_system.log 2>&1 &
sleep 5

echo "[6/6] Relance de DroidCam..."
nohup droidcam > /dev/null 2>&1 &

echo ""
echo "=================================================="
echo " ✅ SYSTÈME RÉPARÉ ET RÉINITIALISÉ !"
echo "=================================================="
echo "1. DroidCam : Cliquez sur CONNECT."
echo "2. Browser : Allez sur http://localhost:5173/camera"
echo "=================================================="


echo ""
echo "=================================================="
echo " ✅ SYSTÈME RÉINITIALISÉ ET PROPRE !"
echo "=================================================="
echo "1. Cliquez sur CONNECT dans la fenêtre DroidCam."
echo "2. Ouvrez votre navigateur sur : http://localhost:5173/camera"
echo "=================================================="
echo "Les erreurs fantômes ont été éliminées."
