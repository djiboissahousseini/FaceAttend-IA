#!/bin/bash

# ==============================================================================
# 📷 FaceAttend Camera Tool (Unified)
# ==============================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
DROID_PORT=4747


function show_help() {
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}    🚀 GESTIONNAIRE DE CAMÉRA FACEATTEND           ${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo "Usage: ./camera.sh [COMMANDE]"
    echo ""
    echo "Commandes disponibles :"
    echo -e "  ${GREEN}install${NC}   : Installe DroidCam et les dépendances (Sudo requis)"
    echo -e "  ${GREEN}connect${NC}   : Établit la connexion USB avec le téléphone (CLI)"
    echo -e "  ${GREEN}fix${NC}       : Réinitialise le serveur ADB et les modules vidéo"
    echo -e "  ${GREEN}help${NC}      : Affiche ce message"
    echo ""
    echo "Exemple: ./camera.sh connect"
    echo -e "${BLUE}==================================================${NC}"
}

function install_droidcam() {
    echo -e "${BLUE}[1/3] Installation des dépendances (Sudo)...${NC}"
    sudo apt update
    sudo apt install -y linux-headers-`uname -r` gcc make v4l2loopback-dkms v4l2loopback-utils adb unzip wget
    
    echo -e "${BLUE}[2/3] Téléchargement de DroidCam...${NC}"
    cd /tmp/
    wget -O droidcam_latest.zip https://files.dev47apps.net/linux/droidcam_2.1.3.zip
    unzip -o droidcam_latest.zip -d droidcam_unified
    cd droidcam_unified
    
    echo -e "${BLUE}[3/3] Installation système...${NC}"
    sudo ./install-client
    sudo ./install-video
    
    echo -e "${GREEN}✅ Installation terminée ! Veuillez redémarrer votre PC si c'est la première fois.${NC}"
}

function fix_system() {
    echo -e "${YELLOW}🛠 Réinitialisation du système caméra...${NC}"
    adb kill-server
    adb start-server
    sudo modprobe -r v4l2loopback 2>/dev/null
    sudo modprobe v4l2loopback exclusive_caps=1 card_label="FaceAttend Camera"
    echo -e "${GREEN}✅ Système réinitialisé (v4l2loopback exclusif activé).${NC}"
}

function connect_usb() {
    echo -e "${BLUE}🔌 Établissement de la connexion USB...${NC}"
    
    # Vérification ADB
    adb start-server > /dev/null 2>&1
    DEVICE_COUNT=$(adb devices | grep -v "List" | grep -w "device" | wc -l)
    
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        echo -e "${RED}❌ Aucun téléphone détecté en USB.${NC}"
        echo "👉 Assurez-vous que le 'Débogage USB' est actif dans les options développeurs."
        return
    fi

    # Libération du périphérique vidéo si déjà utilisé
    VIDEO_DEV=$(v4l2-ctl --list-devices 2>/dev/null | grep -A 1 "FaceAttend Camera" | grep "/dev/video" | head -n 1 | awk '{print $1}')
    if [ -z "$VIDEO_DEV" ]; then
        VIDEO_DEV=$(v4l2-ctl --list-devices 2>/dev/null | grep -A 1 "v4l2loopback" | grep "/dev/video" | head -n 1 | awk '{print $1}')
    fi
    if [ -z "$VIDEO_DEV" ]; then
        VIDEO_DEV="/dev/video0"
    fi

    OLD_PID=$(fuser "$VIDEO_DEV" 2>/dev/null | awk '{print $1}')
    if [ -n "$OLD_PID" ]; then
        echo -e "${YELLOW}⚠️ Périphérique $VIDEO_DEV occupé (PID: $OLD_PID). Libération en cours...${NC}"
        kill "$OLD_PID" 2>/dev/null
        sleep 1
        echo -e "${GREEN}✅ Périphérique libéré.${NC}"
    fi

    # Tunnel USB
    adb forward tcp:"$DROID_PORT" tcp:"$DROID_PORT"
    echo -e "${GREEN}✅ Tunnel USB prêt.${NC}"

    echo "🎯 Capture via $VIDEO_DEV... (Ctrl+C pour arrêter)"
    droidcam-cli -dev="$VIDEO_DEV" adb "$DROID_PORT"
}

# Logique principale
case "$1" in
    install)
        install_droidcam
        ;;
    connect)
        connect_usb
        ;;
    fix)
        fix_system
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            echo -e "${RED}Commande inconnue : $1${NC}"
            show_help
        fi
        ;;
esac
