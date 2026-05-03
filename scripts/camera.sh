#!/bin/bash

# ==============================================================================
# 📷 FaceAttend Camera Tool (Unified)
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
DROID_PORT=4747
MAX_RETRIES=10
RETRY_DELAY=3

function show_help() {
    echo -e "${BLUE}==================================================${NC}"
    echo -e "${BLUE}    🚀 GESTIONNAIRE DE CAMÉRA FACEATTEND           ${NC}"
    echo -e "${BLUE}==================================================${NC}"
    echo "Usage: ./camera.sh [COMMANDE]"
    echo ""
    echo "Commandes disponibles :"
    echo -e "  ${GREEN}install${NC}   : Installe DroidCam et les dépendances (Sudo requis)"
    echo -e "  ${GREEN}connect${NC}   : Connexion USB (auto-reconnexion x${MAX_RETRIES})"
    echo -e "  ${GREEN}watch${NC}     : RECOMMANDÉ - Connexion permanente (boucle infinie)"
    echo -e "  ${GREEN}fix${NC}       : Réinitialise le serveur ADB et les modules vidéo"
    echo -e "  ${GREEN}help${NC}      : Affiche ce message"
    echo ""
    echo -e "Exemple recommandé: ${YELLOW}./camera.sh watch${NC}"
    echo -e "${BLUE}==================================================${NC}"
}

function install_droidcam() {
    echo -e "${BLUE}[1/3] Installation des dépendances (Sudo)...${NC}"
    sudo apt update
    sudo apt install -y linux-headers-$(uname -r) gcc make v4l2loopback-dkms v4l2loopback-utils adb unzip wget
    sudo ./install-client
    sudo ./install-video
    echo -e "${GREEN}✅ Installation terminée !${NC}"
}

function fix_system() {
    echo -e "${YELLOW}🛠 Réinitialisation du système caméra...${NC}"
    adb kill-server
    adb start-server
    sudo modprobe -r v4l2loopback 2>/dev/null
    sudo modprobe v4l2loopback exclusive_caps=1 card_label="FaceAttend Camera"
    echo -e "${GREEN}✅ Système réinitialisé.${NC}"
}

function get_video_device() {
    local dev
    dev=$(v4l2-ctl --list-devices 2>/dev/null | grep -A 1 "FaceAttend Camera" | grep "/dev/video" | head -n 1 | awk '{print $1}')
    [ -z "$dev" ] && dev=$(v4l2-ctl --list-devices 2>/dev/null | grep -A 1 "v4l2loopback" | grep "/dev/video" | head -n 1 | awk '{print $1}')
    [ -z "$dev" ] && dev="/dev/video0"
    echo "$dev"
}

function check_phone() {
    adb start-server > /dev/null 2>&1
    adb devices | grep -v "List" | grep -w "device" | wc -l
}

function connect_usb() {
    local retries=${1:-1}
    local attempt=0
    echo -e "${BLUE}🔌 Établissement de la connexion USB...${NC}"

    DEVICE_COUNT=$(check_phone)
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        echo -e "${RED}❌ Aucun téléphone détecté en USB.${NC}"
        return 1
    fi

    adb forward tcp:"$DROID_PORT" tcp:"$DROID_PORT"
    echo -e "${GREEN}✅ Tunnel USB prêt.${NC}"

    while [ $attempt -lt $retries ]; do
        attempt=$((attempt + 1))
        VIDEO_DEV=$(get_video_device)
        echo -e "${BLUE}🎯 [$attempt/$retries] Streaming sur $VIDEO_DEV...${NC}"
        droidcam-cli -dev="$VIDEO_DEV" adb "$DROID_PORT"
        
        if [ $attempt -lt $retries ]; then
            echo -e "${YELLOW}⚠️ Connexion perdue. Reconnexion dans ${RETRY_DELAY}s...${NC}"
            sleep $RETRY_DELAY
            adb forward tcp:"$DROID_PORT" tcp:"$DROID_PORT" > /dev/null 2>&1
        fi
    done
}

function watch_usb() {
    echo -e "${CYAN}👁  MODE SURVEILLANCE ACTIVÉ (Ctrl+C pour arrêter)${NC}"
    while true; do
        DEVICE_COUNT=$(check_phone)
        if [ "$DEVICE_COUNT" -gt 0 ]; then
            connect_usb 1
        else
            echo -e "${YELLOW}⏳ Attente du téléphone...${NC}"
        fi
        sleep 3
    done
}

case "$1" in
    install) install_droidcam ;;
    connect) connect_usb $MAX_RETRIES ;;
    watch) watch_usb ;;
    fix) fix_system ;;
    *) show_help ;;
esac
