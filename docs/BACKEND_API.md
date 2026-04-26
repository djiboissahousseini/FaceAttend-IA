# Documentation API Backend FaceAttend (v1.0)

Cette documentation détaille les points de terminaison (endpoints) de l'API et le comportement logique du backend FaceAttend.

---

## 🏗️ Architecture
- **Framework** : FastAPI (Python)
- **Base de données** : SQLite / PostgreSQL (via SQLAlchemy)
- **Identification** : Basée sur les IDs (UUID pour les étudiants/cours, Integer pour les sessions/professeurs).

---

## 🧠 Logique de l'IA Scheduler (Point Critique)

### `GET /api/sessions/active?room={room_name}`
C'est le point de terminaison le plus important pour l'autonomie des caméras.

**Comportement :**
1. **Priorité Session Manuelle** : Le système vérifie d'abord s'il existe une session forcée (`is_active = true`) dans la base pour cette salle. Cela permet de lancer un cours hors planning via le dashboard admin.
2. **Consultation de l'Emploi du Temps (Agenda Master)** : Si aucune session manuelle n'est active, le serveur consulte la table `courses` pour le jour actuel et la salle donnée.
3. **Anticipation (15 min)** : Le serveur autorise le lancement d'un cours jusqu'à 15 minutes avant son heure de début officielle.
4. **Auto-Création** : Si un cours est trouvé dans le planning mais qu'aucune session n'a été créée pour aujourd'hui, le backend **crée automatiquement** la session et la marque comme active.
5. **Auto-Fermeture** : Si l'heure actuelle dépasse l'heure de fin prévue, la session n'est plus retournée comme active (ce qui remet la caméra en veille).

---

## 📋 Points de Terminaison (Endpoints)

### 1. Sessions (`/api/sessions`)
- `GET /api/sessions` : Liste toutes les sessions programmées ou passées.
- `POST /api/sessions` : Création manuelle d'une session (via le dashboard).
- `PATCH /api/sessions/{id}` : Mise à jour du statut (`active`, `closed`, `cancelled`) et de l'heure de fin.
- `GET /api/sessions/{id}/attendance` : Récupère la liste des étudiants attendus et leurs présences pour une session donnée.

### 2. Cours / Emploi du temps (`/api/courses`)
- `GET /api/courses` : Liste tous les modules et leurs horaires théoriques.
- `POST /api/courses` : Ajout d'un nouveau module au planning.
- `PATCH /api/courses/{id}` : Modification des horaires ou de la salle d'un cours.

### 3. Étudiants (`/api/students`)
- `GET /api/students` : Liste complète des étudiants.
- `POST /api/students` : Inscription d'un étudiant (avec calcul automatique de l'encodage facial).
- `GET /api/students/{id}/full-stats` : Calcul complet des statistiques d'assiduité (taux de présence, absences par module).
- `POST /api/students/{id}/photo` : Mise à jour de la photo de profil et réinitialisation de l'encodage.

### 4. Présences (`/api/attendance`)
- `POST /api/attendance/mark` : Enregistre un émargement (automatique via caméra ou manuel via admin).
- `GET /api/records` : Historique complet de tous les émargements.

---

## 🛡️ Sécurité & Authentification
- **Vérification PIN** : Le endpoint `/api/sessions/{id}/verify-pin` permet de valider l'identité du professeur via son mot de passe stocké en base.
- **Blocage Compte** : Après 3 tentatives infructueuses, le compte d'un professeur est marqué `is_blocked = true`.

---

## 📝 Règles métier spécifiques
- **Filtrage des Groupes** : Lors du chargement d'une session, le backend filtre les étudiants pour n'inclure que ceux du groupe spécifié (ou tous si `group_name = 'ALL'`).
- **Détection de Doublons** : Lors de l'inscription, le backend compare l'encodage facial avec les étudiants existants pour éviter les doubles inscriptions.
