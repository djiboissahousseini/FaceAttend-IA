#!/bin/bash

# --- CONFIGURATION DES PORTS ---
FRONTEND_PORT=5173
BACKEND_PORT=8000
EXPO_PORT=8081

echo "----------------------------------------------------"
echo "   FACEATTEND CONNECT - CONFIGURATION USB STABLE"
echo "----------------------------------------------------"

# 1. Vérification de la présence d'ADB
if ! command -v adb &> /dev/null
then
    echo "❌ Erreur : ADB n'est pas installé. Veuillez l'installer avec 'sudo apt install adb'."
    exit 1
fi

# 2. Liste des appareils connectés
DEVICES=$(adb devices | grep -v "List" | grep "device" | awk '{print $1}')
COUNT=$(echo "$DEVICES" | wc -l)

if [ -z "$DEVICES" ]; then
    echo "❌ Aucun téléphone détecté en USB. Vérifiez le débogage USB sur vos appareils."
    exit 1
fi

echo "✅ $COUNT appareil(s) détecté(s)."

# 3. Application du 'Port Reverse' sur TOUS les téléphones connectés
for dev in $DEVICES
do
    echo "🔧 Configuration de l'appareil [$dev]..."
    
    adb -s $dev reverse tcp:$FRONTEND_PORT tcp:$FRONTEND_PORT
    adb -s $dev reverse tcp:$BACKEND_PORT tcp:$BACKEND_PORT
    adb -s $dev reverse tcp:$EXPO_PORT tcp:$EXPO_PORT
    
    echo "   -> Port $FRONTEND_PORT (Caméra) : OK"
    echo "   -> Port $BACKEND_PORT (Données) : OK"
    echo "   -> Port $EXPO_PORT (Mobile App) : OK"
done

echo "----------------------------------------------------"
echo "🚀 CONFIGURATION TERMINÉE !"
echo "----------------------------------------------------"
echo "📱 TÉLÉPHONE A (Scanner) : Ouvrez http://localhost:5173/camera"
echo "📱 TÉLÉPHONE B (App)     : Lancez l'application FaceAttend Connect"
echo "----------------------------------------------------"
