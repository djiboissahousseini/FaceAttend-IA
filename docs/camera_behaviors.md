# Comportements & Logique de la Caméra FaceAttend

Ce document détaille l'identité visuelle, sonore et logicielle du terminal de détection faciale (`ClassroomCamera.tsx`).

## 1. Identité Visuelle (HUD Cyberpunk)

La caméra utilise une interface immersive inspirée des affichages tête haute (HUD) modernes :

- **Scan Laser Holographique** : Une ligne horizontale lumineuse parcourt le visage pendant la phase d'analyse.
  - **Bleu Cyan (#00f0ff)** : Mode Étudiant standard.
  - **Rouge Crimson (#ff003c)** : Mode Professeur ou Alerte Critique.
- **Mise au Point IA** : Lors du scan, l'image subit un zoom automatique (105%) et une augmentation de la luminosité (110%) pour simuler une focalisation technologique.
- **Traitement d'Image** : Le flux vidéo est traité en temps réel avec une désaturation (grayscale 20%) et un contraste élevé pour un rendu "Caméra de Sécurité".
- **Réticule Dynamique** : Un cadre de visée pulse au centre de l'écran pendant la capture.
- **Effets de Flou (Glassmorphism)** : Les résultats et messages d'alerte s'affichent sur des panneaux en verre givré (`backdrop-blur`).

## 2. Identité Sonore & Vocale

Le système communique par des signaux audio distincts pour éviter de regarder l'écran :

- **Succès (Validation)** : Une double note montante cristalline ("La-Mi" - 880Hz vers 1320Hz).
- **Erreur (Refus)** : Un double "Bip" grave et sec (220Hz, onde carrée).
- **Avertissement (Warning)** : Une note médium unique (440Hz, triangle).
- **Synthèse Vocale (Text-to-Speech)** :
    - Annonce : "Bienvenue, Monsieur [Nom]" pour le déverrouillage professeur.
    - Statut : "Anti-Spoofing activé/désactivé" lors du basculement à distance.
    - Statut : "Suivi I A activé/désactivé" lors du changement de mode de détection.

## 3. Logique de Détection & Sécurité

### Anti-Spoofing (Liveness Detection)
Analyse la texture et la profondeur pour bloquer les tentatives de fraude par photo ou écran.
- **Réaction** : Alerte rouge, message "ÉCHEC LIVENESS", son d'erreur.

### Vérification de Groupe (Wrong Group)
Vérifie en temps réel si l'étudiant appartient au groupe assigné à la séance en cours.
- **Réaction** : Alerte ambre, message "GROUPE INVALIDE", son de warning.

### Prévention des Doublons (Duplicate)
Empêche de pointer plusieurs fois pour la même séance.
- **Réaction** : Message "DÉJÀ ENREGISTRÉ", son de warning.

### Suivi IA (Auto-Tracking)
Mode de veille active qui surveille l'agenda universitaire pour démarrer automatiquement les sessions à l'heure prévue.

---
*Documentation générée pour le système FaceAttend - 2026*
