LOCAL_IP=$(hostname -I | awk '{print $1}')
FRONTEND_PORT=${FRONTEND_PORT:-5173}
BACKEND_PORT=${BACKEND_PORT:-8000}

echo "----------------------------------------------------"
echo "   FACEATTEND CONNECT - CONFIGURATION MOBILE"
echo "----------------------------------------------------"
echo "🌐 ADRESSE IP DU PC : $LOCAL_IP"
echo "🔌 PORTS CONFIGURÉS : Web:$FRONTEND_PORT, API:$BACKEND_PORT"
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
    
    # Reverse pour l'accès mobile -> PC (Dashboard & Backend)
    adb -s $dev reverse tcp:$FRONTEND_PORT tcp:$FRONTEND_PORT
    adb -s $dev reverse tcp:$BACKEND_PORT tcp:$BACKEND_PORT
    
    echo "   -> Port $FRONTEND_PORT (Web Dashboard) : OK (Reverse)"
    echo "   -> Port $BACKEND_PORT (API Data)        : OK (Reverse)"
done

echo "----------------------------------------------------"
echo "🚀 CONFIGURATION TERMINÉE !"
echo "----------------------------------------------------"
echo "📷 CAMÉRA : Utilisez le mode 'Webcam' natif de votre Pixel 8a."
echo "   (Plus besoin de scripts de connexion pour la vidéo)"
echo ""
echo "📱 DASHBOARD MOBILE : Ouvrez Chrome sur votre second téléphone."
echo "   👉 URL: http://localhost:$FRONTEND_PORT/admin"
echo "----------------------------------------------------"
