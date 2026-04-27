# Documentation du Nerve Center (Interface Admin) - FaceAttend

Ce document détaille les composants et la logique du nouveau centre de commande stratégique introduit dans le dashboard administrateur.

---

## 🏗️ Architecture du Design
Le **Nerve Center** est conçu pour transformer la surveillance des présences en un pilotage systémique de haute précision. Il repose sur trois piliers : **Visibilité Macro**, **Audit d'Intégrité** et **Surveillance Temps Réel**.

---

## 🧩 Définition des Éléments Clés

### 1. Moniteur de Pulsation (Header Status)
*   **Backend Status** : Widget dynamique qui utilise une animation "Pulse". Il confirme que le lien entre l'interface et le serveur Python est actif.
*   **DB Sync** : Indicateur de synchronisation de la base de données PostgreSQL, garantissant que les chiffres affichés sont à jour.

### 2. Cartes Statistiques "Systémiques"
*   **Population IA** : Total des étudiants enregistrés dans le modèle de reconnaissance.
*   **Autorités** : Nombre d'enseignants habilités à superviser des sessions.
*   **Performance IA (Carte Zap)** : Affiche le statut opérationnel du moteur DeepFace. Un score de précision de 99.2% est affiché comme standard de référence pour la fiabilité du match facial.

### 3. Panneaux de Focus (Visualisation de Flux)
*   **Flux de Présence** : Visualisation segmentée de la réussite des identifications. Elle permet de voir le volume d'étudiants "en règle" circulant dans l'université.
*   **Détection d'Absences** : Zone de gestion des risques. Elle met en évidence le déficit d'assiduité et déclenche des alertes visuelles lorsque les anomalies augmentent.

### 4. Console d'Observation Kernel (Log Center)
Une console technique divisée en deux flux pour une clarté maximale :

#### A. Network Traffic (Flux de gauche)
*   **Rôle** : Monitoring des accès API en direct.
*   **Code Couleur** : 
    *   `GET` (Bleu) : Requêtes de lecture de données.
    *   `POST` (Émeraude) : Requêtes d'écriture, incluant les scans de reconnaissance faciale réussis.
    *   `DELETE` (Rouge) : Actions de suppression ou de nettoyage.
*   **Prompt interactif** : Utilisation du caractère `>` pour simuler une console système active.

#### B. Anomaly Detector (Flux de droite)
*   **Rôle** : Isolation des erreurs système pour un diagnostic rapide.
*   **Badges "Critical"** : Chaque erreur est datée et isolée dans un bloc rouge sombre pour ne jamais être manquée par l'administrateur.
*   **Integrity Mode** : Si aucune erreur n'est détectée, un badge "System Integrity: 100%" s'affiche.

### 5. Hardware Monitor (Footer Console)
*   **MEM / CPU Load** : Simulation des ressources serveur utilisées. Ces métriques permettent à l'administrateur de surveiller la charge matérielle imposée par les calculs d'inférence de l'IA.

---

## 🛠️ Maintenance & Intégrité
Chaque élément de l'interface est conçu pour être **autonome**. En cas de coupure réseau, les indicateurs passent en mode "Hors-ligne" et la console Kernel affiche un message d'attente, empêchant ainsi toute interprétation erronée des données par l'administrateur.
