from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, field_validator
from typing import Optional
import traceback
import os
import shutil
import uuid
import numpy as np
import cv2
from deepface import DeepFace
import json
import base64
from datetime import datetime

# Configuration IA (Profil: ÉQUILIBRÉ - Facenet/opencv)
# ⚠️ IMPORTANT : Le modèle DOIT correspondre aux embeddings stockés en base.
# Les photos ont été encodées avec Facenet → on garde Facenet.
# Changer le modèle nécessite de re-encoder TOUTES les photos existantes.
MODEL_NAME = "Facenet"
DETECTOR_BACKEND = "opencv"
DISTANCE_METRIC = "cosine"
THRESHOLD = 0.38           # Seuil calibré pour Facenet (cosine)
DUPLICATE_THRESHOLD = 0.35
MIN_FACE_SIZE = 60


app = FastAPI(title="FaceAttend AI Backend")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Générer une clé de session unique à chaque démarrage du serveur
SESSION_ID = str(uuid.uuid4())

# ─── IA Utils ────────────────────────────────────────────────────────────────

def cosine_distance(a, b):
    """Distance cosinus entre deux vecteurs (pour comparaison 1-1)."""
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 1.0
    return float(1.0 - np.dot(a, b) / (norm_a * norm_b))

def batch_cosine_distances(target: list, encodings_matrix: np.ndarray) -> np.ndarray:
    """Distance cosinus vectorisée : compare target contre TOUS les encodings en une seule opération NumPy (10x plus rapide)."""
    target_vec = np.array(target, dtype=np.float32)
    target_norm = target_vec / (np.linalg.norm(target_vec) + 1e-10)
    norms = np.linalg.norm(encodings_matrix, axis=1, keepdims=True) + 1e-10
    normed_matrix = encodings_matrix / norms
    similarities = normed_matrix @ target_norm
    return 1.0 - similarities

def get_file_path_from_url(url: str):
    if not url: return None
    filename = url.split("/")[-1]
    return os.path.join(UPLOAD_DIR, filename)

def apply_clahe(img: np.ndarray) -> np.ndarray:
    """Applique CLAHE + correction gamma pour récupérer les détails en basse lumière."""
    try:
        # Étape 1 : Correction gamma pour débloquer l'obscurité extrême
        mean_brightness = np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
        if mean_brightness < 80:  # Image sombre
            gamma = 1.8
            lut = np.array([min(255, int((i / 255.0) ** (1.0 / gamma) * 255)) for i in range(256)], dtype=np.uint8)
            img = cv2.LUT(img, lut)
        # Étape 2 : CLAHE sur la luminance YUV
        yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        yuv[:, :, 0] = clahe.apply(yuv[:, :, 0])
        return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
    except Exception:
        return img  # En cas d'erreur, retourne l'image originale sans planter

def compute_face_encoding(image_path: str, apply_enhancement: bool = False):
    """
    Calcule l'embedding facial d'une image.
    - apply_enhancement=True  : pour les scans live (webcam, basse lumière)
    - apply_enhancement=False : pour les photos d'enregistrement (on conserve la source)
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            print(f"Image illisible: {image_path}")
            return None

        if apply_enhancement:
            img = apply_clahe(img)

        results = DeepFace.represent(
            img_path=img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False
        )
        if results:
            result = results[0]
            if result["facial_area"]["w"] < MIN_FACE_SIZE:
                print(f"Visage trop petit: {result['facial_area']['w']}px")
                return None
            return result["embedding"]
    except Exception as e:
        print(f"Erreur extraction IA ({MODEL_NAME}/{DETECTOR_BACKEND}) : {e}")
    return None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ─────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    student_code: str
    full_name: str
    email: str
    department_id: Optional[str] = None
    group_name: Optional[str] = None
    photo_url: Optional[str] = ""
    enrolled_at: str

    @field_validator("department_id", mode="before")
    @classmethod
    def empty_dept_to_none(cls, v):
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        return v

class StudentUpdate(BaseModel):
    is_active: Optional[bool] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    student_code: Optional[str] = None
    department_id: Optional[str] = None
    group_name: Optional[str] = None

class CourseCreate(BaseModel):
    course_code: str
    name: str
    teacher_name: str
    department_id: Optional[str] = None
    semester: Optional[str] = "S1"
    schedule_day: Optional[str] = ""
    schedule_time: Optional[str] = ""
    room: Optional[str] = ""
    group_name: Optional[str] = "ALL"
    course_type: Optional[str] = "Cours"
    absence_threshold: Optional[int] = 5

    @field_validator("department_id", mode="before")
    @classmethod
    def empty_dept_to_none(cls, v):
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        return v

class TeacherCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = "password123"
    photo_url: Optional[str] = ""

class SessionCreate(BaseModel):
    teacher_id: int
    course_name: str
    group_name: str
    classroom: Optional[str] = None
    session_date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class SessionUpdate(BaseModel):
    status: str
    end_time: Optional[str] = None

class AttendanceUpsert(BaseModel):
    session_id: int
    student_id: str
    status: str
    method: str
    confidence_score: Optional[float] = None

class AlertUpsert(BaseModel):
    student_id: str
    course_id: str
    absence_count: int
    threshold: int
    status: Optional[str] = "active"
    notes: Optional[str] = None

class AlertUpdate(BaseModel):
    status: str
    resolved_at: Optional[str] = None

class RecognizeRequest(BaseModel):
    image: str
    target_type: Optional[str] = "student" # "student" or "teacher"
    liveness_enabled: bool = True

# ─── File Upload ─────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        url = f"http://localhost:8000/uploads/{unique_filename}"
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Échec de l'upload: {str(e)}")

# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/classrooms")
def get_classrooms(db: Session = Depends(get_db)):
    try:
        # On utilise maintenant la table dédiée 'classrooms' pour une structure parfaite
        query = text("SELECT name FROM classrooms ORDER BY name")
        rows = db.execute(query).fetchall()
        return [r[0] for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/logs")
def get_system_logs():
    try:
        logs = ""
        errors = ""
        
        # Les logs sont dans le dossier logs/ à la racine du projet
        log_path = os.path.join(BASE_DIR, "..", "logs", "backend.log")
        err_path = os.path.join(BASE_DIR, "..", "logs", "backend.error")

        if os.path.exists(log_path):
            with open(log_path, "r") as f:
                lines = f.readlines()
                logs = "".join(lines[-50:])
        
        if os.path.exists(err_path):
            with open(err_path, "r") as f:
                lines = f.readlines()
                errors = "".join(lines[-50:])
                
        return {"logs": logs, "errors": errors}
    except Exception as e:
        return {"logs": f"Error reading logs: {e}", "errors": ""}

# ─── Departments ─────────────────────────────────────────────────────────────

@app.get("/api/departments")
def get_departments(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT id, name, code FROM departments ORDER BY name"))
        return [{"id": str(r[0]), "name": r[1], "code": r[2]} for r in result]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Teachers ────────────────────────────────────────────────────────────────

@app.get("/api/teachers")
def get_teachers(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT id, name, email, photo_url FROM teachers ORDER BY name"))
        return [{"id": r[0], "name": r[1], "email": r[2], "photo_url": r[3]} for r in result]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/api/teachers")
def create_teacher(t: TeacherCreate, db: Session = Depends(get_db)):
    try:
        encoding_json = None
        encoding = None
        if t.photo_url:
            path = get_file_path_from_url(t.photo_url)
            if path and os.path.exists(path):
                encoding = compute_face_encoding(path)
                if encoding:
                    encoding_json = json.dumps(encoding)

        final_password = t.password if t.password and t.password.strip() else "password123"

        query = text("""
            INSERT INTO teachers (name, email, password, photo_url, face_encoding, face_embedding)
            VALUES (:name, :email, :password, :photo_url, CAST(:face_encoding AS jsonb), CAST(:face_embedding AS float[]))
        """)
        db.execute(query, {
            "name": t.name, 
            "email": t.email, 
            "password": final_password,
            "photo_url": t.photo_url,
            "face_encoding": encoding_json,
            "face_embedding": encoding
        })
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.patch("/api/teachers/{teacher_id}")
def update_teacher(teacher_id: int, t: TeacherCreate, db: Session = Depends(get_db)):
    try:
        encoding_json = None
        encoding = None
        
        # Si une nouvelle photo est fournie, recalculer l'encodage
        if t.photo_url:
            path = get_file_path_from_url(t.photo_url)
            if path and os.path.exists(path):
                encoding = compute_face_encoding(path)
                if encoding:
                    encoding_json = json.dumps(encoding)

        query = """
            UPDATE teachers 
            SET name = :name, 
                email = :email, 
                password = CASE WHEN :password <> '' THEN :password ELSE password END,
                photo_url = COALESCE(:photo_url, photo_url),
                face_encoding = COALESCE(CAST(:face_encoding AS jsonb), face_encoding),
                face_embedding = COALESCE(CAST(:face_embedding AS float[]), face_embedding)
            WHERE id = :id
        """
        db.execute(text(query), {
            "name": t.name,
            "email": t.email,
            "password": t.password if t.password else '',
            "photo_url": t.photo_url,
            "face_encoding": encoding_json,
            "face_embedding": encoding,
            "id": teacher_id
        })
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print(f"Error updating teacher: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/api/teachers/{teacher_id}/photo")
async def update_teacher_photo(teacher_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # 1. Sauvegarder le fichier
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"teacher_{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        url = f"http://localhost:8000/uploads/{unique_filename}"
        
        # 2. Recalculer l'embedding
        encoding = compute_face_encoding(file_path)
        encoding_json = json.dumps(encoding) if encoding else None
        
        # 3. Mettre à jour la base
        query = text("""
            UPDATE teachers 
            SET photo_url = :photo_url, 
                face_encoding = CAST(:face_encoding AS jsonb),
                face_embedding = CAST(:face_embedding AS float[])
            WHERE id = :id
        """)
        db.execute(query, {
            "photo_url": url,
            "face_encoding": encoding_json,
            "face_embedding": encoding,
            "id": teacher_id
        })
        db.commit()
        
        return {"url": url, "status": "success"}
    except Exception as e:
        db.rollback()
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/teachers/login")
def login_teacher(req: LoginRequest, db: Session = Depends(get_db)):
    print(f"\n[LOGIN DEBUG] Reçu: Email='{req.email}'")
    try:
        clean_email = req.email.strip().lower()
        print(f"[LOGIN DEBUG] Nettoyé: Email='{clean_email}'")
        
        query = text("SELECT id, name, email, photo_url, is_blocked, failed_attempts, password FROM teachers WHERE LOWER(email) = :email")
        teacher = db.execute(query, {"email": clean_email}).fetchone()

        if not teacher:
            print(f"[LOGIN DEBUG] ÉCHEC: Compte '{clean_email}' non trouvé")
            raise HTTPException(status_code=401, detail="Compte non trouvé")
            
        print(f"[LOGIN DEBUG] Trouvé: ID={teacher[0]}, Nom={teacher[1]}, Bloqué={teacher[4]}")

        if teacher[4]: # is_blocked
            print(f"[LOGIN DEBUG] ÉCHEC: Compte {teacher[1]} est bloqué")
            raise HTTPException(status_code=403, detail="Votre compte est bloqué. Contactez l'administrateur.")

        # Comparaison stricte du mot de passe
        if teacher[6] == req.password:
            print(f"[LOGIN DEBUG] SUCCÈS: Mot de passe correct pour {teacher[1]}")
            if teacher[5] > 0:
                db.execute(text("UPDATE teachers SET failed_attempts = 0 WHERE id = :id"), {"id": teacher[0]})
                db.commit()
            return {
                "id": teacher[0], "name": teacher[1], "email": teacher[2], "photo_url": teacher[3], "role": "teacher"
            }
        else:
            new_attempts = (teacher[5] or 0) + 1
            print(f"[LOGIN DEBUG] ÉCHEC: Mot de passe incorrect pour {teacher[1]} ({new_attempts}/3)")
            is_blocked = new_attempts >= 3
            db.execute(text("UPDATE teachers SET failed_attempts = :attempts, is_blocked = :blocked WHERE id = :id"), 
                       {"attempts": new_attempts, "blocked": is_blocked, "id": teacher[0]})
            db.commit()
            
            msg = f"Mot de passe incorrect ({new_attempts}/3)"
            if is_blocked: msg = "Compte bloqué après 3 tentatives infructueuses."
            raise HTTPException(status_code=401, detail=msg)
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[LOGIN CRITICAL ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teachers/{teacher_id}/security")
def get_teacher_security(teacher_id: int, db: Session = Depends(get_db)):
    try:
        query = text("SELECT id, name, email, is_blocked, failed_attempts, password FROM teachers WHERE id = :id")
        r = db.execute(query, {"id": teacher_id}).fetchone()
        if r:
            return {
                "id": r[0],
                "name": r[1],
                "email": r[2],
                "is_blocked": r[3],
                "failed_attempts": r[4],
                "password": r[5]
            }
        raise HTTPException(status_code=404, detail="Teacher not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/teachers/{teacher_id}/toggle-block")
def toggle_teacher_block(teacher_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("UPDATE teachers SET is_blocked = NOT is_blocked, failed_attempts = 0 WHERE id = :id"), {"id": teacher_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/teachers/{teacher_id}/reset-password")
def reset_teacher_password(teacher_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("UPDATE teachers SET password = 'password123', failed_attempts = 0, is_blocked = FALSE WHERE id = :id"), {"id": teacher_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ─── Students ────────────────────────────────────────────────────────────────

@app.get("/api/students")
def get_students(db: Session = Depends(get_db)):
    try:
        query = """
    SELECT s.id, s.student_code, s.full_name, s.email, s.department_id, s.photo_url,
           s.face_encoding, s.enrolled_at::text, s.is_active,
           d.name as dept_name, d.code as dept_code,
           s.name, s.matricule, s.group_name
    FROM students s
    LEFT JOIN departments d ON s.department_id = d.id
    ORDER BY s.full_name
    """
        result = db.execute(text(query))
        students = []
        for r in result:
            students.append({
                "id": str(r[0]),
                "student_code": r[1],
                "full_name": r[2],
                "email": r[3],
                "department_id": str(r[4]) if r[4] else None,
                "photo_url": r[5],
                "face_encoding": r[6],
                "enrolled_at": r[7],
                "is_active": r[8],
                "departments": {"name": r[9], "code": r[10]} if r[9] else None,
                "name": r[11],
                "matricule": r[12],
                "group_name": r[13]
            })
        return students
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/api/students")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    try:
        encoding_json = None
        encoding = None
        if student.photo_url:
            path = get_file_path_from_url(student.photo_url)
            if path and os.path.exists(path):
                encoding = compute_face_encoding(path)
                if encoding:
                    all_students = db.execute(text("SELECT full_name, face_encoding FROM students WHERE face_encoding IS NOT NULL")).fetchall()
                    for s_name, s_encoding in all_students:
                        dist = cosine_distance(encoding, s_encoding)
                        if dist < DUPLICATE_THRESHOLD:
                            raise HTTPException(status_code=400, detail=f"Cet étudiant semble déjà inscrit sous le nom: {s_name}")
                    encoding_json = json.dumps(encoding)

        query = text("""
            INSERT INTO students (
                student_code, full_name, email, department_id,
                photo_url, enrolled_at, is_active, face_encoding,
                name, matricule, group_name, face_embedding
            )
            VALUES (
                :student_code, :full_name, :email, CAST(:department_id AS uuid),
                :photo_url, CAST(:enrolled_at AS date), true, CAST(:face_encoding AS jsonb),
                :name, :matricule, :group_name, CAST(:face_embedding AS float[])
            )
            RETURNING id
        """)

        result = db.execute(query, {
            "student_code": student.student_code,
            "full_name": student.full_name,
            "email": student.email,
            "department_id": student.department_id,
            "photo_url": student.photo_url or "",
            "enrolled_at": student.enrolled_at,
            "face_encoding": encoding_json,
            "name": student.full_name,
            "matricule": student.student_code,
            "group_name": student.group_name,
            "face_embedding": encoding
        })
        db.commit()
        return {"message": "Success"}
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.patch("/api/students/{student_id}")
def update_student(student_id: str, student: StudentUpdate, db: Session = Depends(get_db)):
    try:
        update_data = student.model_dump(exclude_unset=True)
        if not update_data:
            return {"message": "No changes"}
            
        set_clauses = []
        params = {"student_id": student_id}
        
        for key, value in update_data.items():
            if key == "department_id":
                set_clauses.append(f"{key} = CAST(:{key} AS uuid)")
            else:
                set_clauses.append(f"{key} = :{key}")
            params[key] = value
            
        query = text(f"UPDATE students SET {', '.join(set_clauses)} WHERE id = CAST(:student_id AS uuid)")
        db.execute(query, params)
        db.commit()
        return {"message": "Success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/api/students/{student_id}/photo")
async def update_student_photo(student_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # 1. Sauvegarder le fichier
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        url = f"http://localhost:8000/uploads/{unique_filename}"
        
        # 2. Recalculer l'embedding
        encoding = compute_face_encoding(file_path)
        encoding_json = json.dumps(encoding) if encoding else None
        
        # 3. Mettre à jour la base
        query = text("""
            UPDATE students 
            SET photo_url = :photo_url, 
                face_encoding = CAST(:face_encoding AS jsonb),
                face_embedding = CAST(:face_embedding AS float[])
            WHERE id = CAST(:id AS uuid)
        """)
        db.execute(query, {
            "photo_url": url,
            "face_encoding": encoding_json,
            "face_embedding": encoding,
            "id": student_id
        })
        db.commit()
        
        return {"url": url, "status": "success"}
    except Exception as e:
        db.rollback()
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db)):
    try:
        db.execute(text("DELETE FROM attendance_records WHERE student_id = CAST(:id AS uuid)"), {"id": student_id})
        db.execute(text("DELETE FROM course_enrollments WHERE student_id = CAST(:id AS uuid)"), {"id": student_id})
        db.execute(text("DELETE FROM absence_alerts WHERE student_id = CAST(:id AS uuid)"), {"id": student_id})
        db.execute(text("DELETE FROM students WHERE id = CAST(:id AS uuid)"), {"id": student_id})
        db.commit()
        return {"message": "Student deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Courses ─────────────────────────────────────────────────────────────────

@app.get("/api/courses")
def get_courses(db: Session = Depends(get_db)):
    try:
        query = """
    SELECT c.id, c.course_code, c.name, c.teacher_name, c.department_id,
           c.semester, c.schedule_day, c.schedule_time, c.room,
           c.group_name, c.absence_threshold, c.created_at::text,
           d.name as dept_name, d.code as dept_code, c.course_type
    FROM courses c
    LEFT JOIN departments d ON c.department_id = d.id
    ORDER BY c.name
    """
        result = db.execute(text(query))
        courses = []
        for r in result:
            courses.append({
                "id": str(r[0]),
                "course_code": r[1],
                "name": r[2],
                "teacher_name": r[3],
                "department_id": str(r[4]) if r[4] else None,
                "semester": r[5],
                "schedule_day": r[6],
                "schedule_time": r[7],
                "room": r[8],
                "group_name": r[9],
                "absence_threshold": r[10],
                "created_at": r[11],
                "departments": {"name": r[12], "code": r[13]} if r[12] else None,
                "course_type": r[14] or "Cours"
            })
        return courses
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/api/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO courses (course_code, name, teacher_name, department_id,
                                 semester, schedule_day, schedule_time, room, group_name, course_type, absence_threshold)
            VALUES (:course_code, :name, :teacher_name, CAST(:department_id AS uuid),
                    :semester, :schedule_day, :schedule_time, :room, :group_name, :course_type, :absence_threshold)
        """)
        db.execute(query, {
            "course_code": course.course_code,
            "name": course.name,
            "teacher_name": course.teacher_name,
            "department_id": course.department_id,
            "semester": course.semester,
            "schedule_day": course.schedule_day,
            "schedule_time": course.schedule_time,
            "room": course.room,
            "group_name": course.group_name,
            "course_type": course.course_type or "Cours",
            "absence_threshold": course.absence_threshold,
        })
        db.commit()
        return {"message": "Success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.patch("/api/courses/{course_id}")
def update_course(course_id: str, course: CourseCreate, db: Session = Depends(get_db)):
    try:
        query = text("""
            UPDATE courses 
            SET course_code = :course_code,
                name = :name,
                teacher_name = :teacher_name,
                department_id = CAST(:department_id AS uuid),
                semester = :semester,
                schedule_day = :schedule_day,
                schedule_time = :schedule_time,
                room = :room,
                group_name = :group_name,
                course_type = :course_type,
                absence_threshold = :absence_threshold
            WHERE id = CAST(:id AS uuid)
        """)
        db.execute(query, {
            "course_code": course.course_code,
            "name": course.name,
            "teacher_name": course.teacher_name,
            "department_id": course.department_id,
            "semester": course.semester,
            "schedule_day": course.schedule_day,
            "schedule_time": course.schedule_time,
            "room": course.room,
            "group_name": course.group_name,
            "course_type": course.course_type or "Cours",
            "absence_threshold": course.absence_threshold,
            "id": course_id
        })
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print(f"Error updating course: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Course Enrollments ───────────────────────────────────────────────────────

@app.get("/api/courses/{course_id}/enrollments")
def get_enrollments(course_id: str, db: Session = Depends(get_db)):
    try:
        query = """
    SELECT s.id, s.student_code, s.full_name, s.email, s.photo_url,
           s.face_encoding, s.is_active
    FROM course_enrollments ce
    JOIN students s ON ce.student_id = s.id
    WHERE ce.course_id = CAST(:course_id AS uuid)
    ORDER BY s.full_name
    """
        result = db.execute(text(query), {"course_id": course_id})
        students = []
        for r in result:
            students.append({
                "id": str(r[0]),
                "student_code": r[1],
                "full_name": r[2],
                "email": r[3],
                "photo_url": r[4],
                "face_encoding": r[5],
                "is_active": r[6],
            })
        return students
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/api/enrollments/counts")
def get_enrollment_counts(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT course_id::text, COUNT(*) as cnt
            FROM course_enrollments
            GROUP BY course_id
        """))
        return {str(r[0]): r[1] for r in result}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Attendance Sessions ──────────────────────────────────────────────────────

@app.get("/api/sessions/active")
def get_active_session(room: str, db: Session = Depends(get_db)):
    try:
        now = datetime.now()
        
        # 1. Vérifier en PRIORITÉ s'il y a une session forcée (is_active = true) en base
        # Cela permet le "Lancement Anticipé" même hors horaires.
        active_query = text("""
            SELECT id, course_name, group_name, classroom, session_date, is_active, start_time, end_time, teacher_id
            FROM sessions 
            WHERE classroom = :room AND is_active = true
            ORDER BY id DESC LIMIT 1
        """)
        forced_session = db.execute(active_query, {"room": room}).fetchone()
        
        if forced_session:
            # Récupérer le nom du prof pour l'affichage
            t_name = "Professeur"
            if forced_session[8]:
                t_q = text("SELECT name FROM teachers WHERE id = :id")
                t_res = db.execute(t_q, {"id": forced_session[8]}).fetchone()
                if t_res: t_name = t_res[0]

            return {
                "id": forced_session[0],
                "course_name": forced_session[1],
                "group_name": forced_session[2],
                "classroom": forced_session[3],
                "session_date": str(forced_session[4]),
                "is_active": forced_session[5],
                "start_time": str(forced_session[6]) if forced_session[6] else None,
                "end_time": str(forced_session[7]) if forced_session[7] else None,
                "teacher_name": t_name
            }

        # 1b. Vérifier s'il y a une session PLANIFIÉE (scheduled) pour aujourd'hui et maintenant
        # Cela permet le réveil automatique de la caméra selon l'agenda.
        scheduled_query = text("""
            SELECT id, course_name, group_name, classroom, session_date, is_active, start_time, end_time, teacher_id
            FROM sessions
            WHERE classroom = :room 
              AND session_date = CAST(:today AS date) 
              AND status = 'scheduled'
              AND CAST(:now_time AS time) BETWEEN start_time AND end_time
            ORDER BY start_time ASC LIMIT 1
        """)
        sched_res = db.execute(scheduled_query, {
            "room": room,
            "today": now.date(),
            "now_time": now.strftime("%H:%M:%S")
        }).fetchone()

        if sched_res:
            t_name = "Professeur"
            if sched_res[8]:
                t_q = text("SELECT name FROM teachers WHERE id = :id")
                t_res = db.execute(t_q, {"id": sched_res[8]}).fetchone()
                if t_res: t_name = t_res[0]

            return {
                "id": sched_res[0],
                "course_name": sched_res[1],
                "group_name": sched_res[2],
                "classroom": sched_res[3],
                "session_date": str(sched_res[4]),
                "is_active": sched_res[5],
                "start_time": str(sched_res[6]) if sched_res[6] else None,
                "end_time": str(sched_res[7]) if sched_res[7] else None,
                "teacher_name": t_name
            }

        # 2. Si rien n'est forcé, vérifier le planning habituel
        days_map = {0: "Lundi", 1: "Mardi", 2: "Mercredi", 3: "Jeudi", 4: "Vendredi", 5: "Samedi", 6: "Dimanche"}
        today_fr = days_map[now.weekday()]
        time_str = now.strftime("%H:%M")
        
        query = text("""
            SELECT id, name, group_name, teacher_name, schedule_time, room 
            FROM courses 
            WHERE schedule_day = :day AND room = :room
        """)
        courses_found = db.execute(query, {"day": today_fr, "room": room}).fetchall()
        
        match = None
        for c in courses_found:
            sched_time = c[4]
            if '-' in sched_time:
                st, et = sched_time.split('-')
                if time_str >= st.strip() and time_str <= et.strip():
                    match = c
                    break
        
        if not match:
            return None
            
        # 2. Vérifier si une session existe déjà aujourd'hui
        session_query = text("""
            SELECT id, course_name, group_name, classroom, session_date, is_active, start_time, end_time, is_paused
            FROM sessions 
            WHERE course_name = :name AND group_name = :group AND session_date = :date AND classroom = :room
        """)
        existing = db.execute(session_query, {
            "name": match[1], 
            "group": match[2], 
            "date": now.date(),
            "room": room
        }).fetchone()
        
        if existing:
            return {
                "id": existing[0],
                "course_name": existing[1],
                "group_name": existing[2],
                "classroom": existing[3],
                "session_date": str(existing[4]),
                "is_active": existing[5],
                "start_time": str(existing[6]) if existing[6] else None,
                "end_time": str(existing[7]) if existing[7] else None,
                "is_paused": existing[8],
                "status": "active", # Si elle est trouvée par get_active_session, elle est active
                "teacher_name": match[3]
            }
            
        # 3. Créer la session si elle n'existe pas
        st_time, et_time = match[4].split('-')
        
        # Find teacher_id from teacher_name
        teacher_q = text("SELECT id FROM teachers WHERE name = :name")
        t_res = db.execute(teacher_q, {"name": match[3]}).fetchone()
        t_id = t_res[0] if t_res else None

        insert_query = text("""
            INSERT INTO sessions (teacher_id, course_name, group_name, classroom, session_date, is_active, start_time, end_time, status)
            VALUES (:t_id, :name, :group, :room, :date, true, :start, :end, 'active')
            RETURNING id
        """)
        new_id = db.execute(insert_query, {
            "t_id": t_id,
            "name": match[1],
            "group": match[2],
            "room": room,
            "date": now.date(),
            "start": st_time.strip(),
            "end": et_time.strip()
        }).fetchone()[0]
        db.commit()
        
        return {
            "id": new_id,
            "course_name": match[1],
            "group_name": match[2],
            "classroom": room,
            "session_date": str(now.date()),
            "is_active": True,
            "start_time": st_time.strip(),
            "end_time": et_time.strip(),
            "status": "active",
            "teacher_name": match[3]
        }
    except Exception as e:
        db.rollback()
        print(f"Error in get_active_session: {e}")
        return None

# --- Models for Mobile App ---
class StudentLogin(BaseModel):
    student_code: str
    email: str

@app.post("/api/student/login")
def student_login(credentials: StudentLogin, db: Session = Depends(get_db)):
    query = text("SELECT id, full_name, email, student_code FROM students WHERE student_code = :code AND email = :email")
    student = db.execute(query, {"code": credentials.student_code, "email": credentials.email}).fetchone()
    
    if not student:
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    return {
        "id": str(student[0]),
        "full_name": student[1],
        "email": student[2],
        "student_code": student[3]
    }

@app.get("/api/students/{student_id}/full-stats")
def get_student_full_stats(student_id: str, db: Session = Depends(get_db)):
    # 1. Infos étudiant
    query_student = text("""
        SELECT s.id, s.full_name, s.email, s.student_code, d.name as filiere, s.group_name, s.photo_url, s.department_id
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE s.id = CAST(:id AS uuid)
    """)
    student_row = db.execute(query_student, {"id": student_id}).fetchone()
    
    if not student_row:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    
    row_dict = student_row._mapping
    
    student_data = {
        "id": str(row_dict["id"]),
        "name": row_dict["full_name"],
        "email": row_dict["email"],
        "code": row_dict["student_code"],
        "filiere": row_dict["filiere"],
        "group": row_dict["group_name"],
        "photo_url": row_dict["photo_url"]
    }
    
    dept_id = str(row_dict["department_id"]) if row_dict["department_id"] else None
    group_name = row_dict["group_name"] or ''

    # 1.5 Fetch all modules/courses assigned to this student
    # Si l'étudiant n'a pas de département (:dept_id IS NULL), on lui assigne tous les cours par défaut (Informatique)
    query_courses = text("""
        SELECT name, absence_threshold, schedule_day, schedule_time, room, group_name, teacher_name, course_type
        FROM courses
        WHERE (department_id = :dept_id OR department_id IS NULL OR :dept_id IS NULL)
          AND (group_name = :group_name OR group_name = 'ALL' OR group_name = '')
    """)
    assigned_courses = db.execute(query_courses, {"dept_id": dept_id, "group_name": group_name}).fetchall()
    
    modules_stats = {}
    # Détecter les noms de cours présents à la fois en Amphi (ALL) ET en groupe spécifique
    all_names = [c[0] for c in assigned_courses if (c[5] or 'ALL') == 'ALL']
    grp_names = [c[0] for c in assigned_courses if (c[5] or 'ALL') != 'ALL']
    ambiguous_names = set(all_names) & set(grp_names)

    for c in assigned_courses:
        c_map = c._mapping
        course_name = c_map["name"]
        grp = c_map["group_name"] or 'ALL'
        teacher = c_map["teacher_name"] or ''
        course_type = c_map["course_type"] or 'Cours'

        # Utiliser le type officiel du cours pour le libellé
        # N'ajouter le suffixe que s'il y a ambiguïté avec un même nom en plusieurs types
        if course_name in ambiguous_names:
            display_name = f"{course_name} ({course_type})"
        else:
            display_name = course_name

        key = f"{course_name}_{grp}"
        
        modules_stats[key] = {
            "name": display_name, 
            "presences": 0, 
            "absences": 0, 
            "threshold": c_map["absence_threshold"] or 5,
            "schedule_day": c_map["schedule_day"] or "",
            "schedule_time": c_map["schedule_time"] or "",
            "room": c_map["room"] or "",
            "teacher": teacher,
            "course_type": course_type
        }

    # 2. Historique et calcul des stats
    query_history = text("""
        SELECT a.status, s.course_name, s.session_date, s.start_time, s.end_time, s.group_name, s.id, c.absence_threshold
        FROM attendance_records a
        JOIN sessions s ON a.session_id = s.id
        LEFT JOIN courses c ON s.course_name = c.name AND s.group_name = c.group_name
        WHERE a.student_id = CAST(:id AS uuid)
        ORDER BY s.session_date DESC, s.start_time DESC
    """)
    records = db.execute(query_history, {"id": student_id}).fetchall()
    
    present_count = 0
    absent_count = 0
    late_count = 0
    excused_count = 0
    history_data = []

    for r in records:
        status, course_name, date, st, et, grp, s_id, threshold = r
        
        if status == 'present': present_count += 1
        elif status == 'absent': absent_count += 1
        elif status == 'late': late_count += 1
        elif status == 'excused': excused_count += 1
        
        grp_normalized = grp or 'ALL'
        key = f"{course_name}_{grp_normalized}"
        
        if key not in modules_stats:
            # Fallback if the course in history is not in the assigned courses list
            if course_name in ambiguous_names:
                display_name = f"{course_name} (Hist.)"
            else:
                display_name = course_name
            
            modules_stats[key] = {
                "name": display_name, 
                "presences": 0, 
                "absences": 0, 
                "threshold": threshold or 5,
                "schedule_day": "",
                "schedule_time": "",
                "room": "",
                "teacher": "",
                "course_type": "Cours"
            }
            
        if status in ['present', 'late']:
            modules_stats[key]["presences"] += 1
        elif status == 'absent':
            modules_stats[key]["absences"] += 1
            
        history_data.append({
            "id": s_id,
            "session_date": str(date) if date else None,
            "start_time": str(st) if st else None,
            "end_time": str(et) if et else None,
            "course_name": course_name,
            "group_name": grp,
            "status": status,
            "date": f"{date}T{st}" if date and st else str(date)
        })
        
    total_sessions = len(records)
    total_attended = present_count + late_count
    attendance_rate = round((total_attended / total_sessions * 100)) if total_sessions > 0 else 100
    
    stats_data = {
        "attendance_rate": attendance_rate,
        "total_presences": present_count,
        "total_absences": absent_count,
        "total_late": late_count,
        "total_excused": excused_count,
        "total_sessions": total_sessions,
        "total_courses": len(modules_stats),
        "modules": list(modules_stats.values()),
        "history": history_data
    }
    
    return {
        "student": student_data,
        "stats": stats_data
    }

@app.get("/api/students/{student_id}/stats")
def get_student_stats_alias(student_id: str, db: Session = Depends(get_db)):
    return get_student_full_stats(student_id, db)

@app.get("/api/sessions")
def get_sessions(db: Session = Depends(get_db)):
    try:
        # On joint sessions avec courses pour récupérer le course_id que le frontend attend
        query = """
        SELECT s.id, s.teacher_id, s.course_name, s.group_name, s.classroom, s.session_date::text,
               t.name as teacher_name, s.start_time::text, s.end_time::text,
               c.id as course_id, s.is_active, s.status
        FROM sessions s
        LEFT JOIN teachers t ON s.teacher_id = t.id
        LEFT JOIN courses c ON (
            LOWER(s.course_name) = LOWER(c.name) OR 
            LOWER('Cours ' || s.course_name) = LOWER(c.name) OR
            LOWER(s.course_name) = LOWER('Cours ' || c.name) OR
            LOWER(s.course_name) = LOWER(c.course_code)
        ) AND s.group_name = c.group_name
        ORDER BY s.session_date DESC, s.start_time DESC
        """
        result = db.execute(text(query))
        return [
            {
                "id": str(r[0]), "teacher_id": r[1], "course_name": r[2], 
                "group_name": r[3], "classroom": r[4], "session_date": r[5],
                "teacher_name": r[6] or "Inconnu", "start_time": r[7], "end_time": r[8],
                "course_id": str(r[9]) if r[9] else None,
                "is_active": r[10],
                "status": r[11]
            } for r in result
        ]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/api/sessions")
def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO sessions (teacher_id, course_name, group_name, classroom, session_date, start_time, end_time)
            VALUES (:teacher_id, :course_name, :group_name, :classroom, CAST(:session_date AS date), CAST(:start_time AS time), CAST(:end_time AS time))
            RETURNING id
        """)
        result = db.execute(query, {
            "teacher_id": session.teacher_id,
            "course_name": session.course_name,
            "group_name": session.group_name,
            "classroom": session.classroom,
            "session_date": session.session_date,
            "start_time": session.start_time,
            "end_time": session.end_time,
        })
        row = result.fetchone()
        db.commit()
        return {"id": row[0]}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

class PinVerifyRequest(BaseModel):
    pin_code: str

@app.post("/api/sessions/{session_id}/verify-pin")
def verify_session_pin(session_id: int, req: PinVerifyRequest, db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT t.password 
            FROM sessions s
            LEFT JOIN teachers t ON s.teacher_id = t.id
            WHERE s.id = :session_id
        """)
        result = db.execute(query, {"session_id": session_id}).fetchone()
        
        stored_password = None
        if result and result[0]:
            stored_password = result[0]
        else:
            # Fallback if teacher_id is null: match via course_name -> teacher_name
            fallback = text("""
                SELECT t.password
                FROM sessions s
                JOIN courses c ON s.course_name = c.name AND s.group_name = c.group_name
                JOIN teachers t ON c.teacher_name = t.name
                WHERE s.id = :session_id
                LIMIT 1
            """)
            res2 = db.execute(fallback, {"session_id": session_id}).fetchone()
            if res2 and res2[0]:
                stored_password = res2[0]

        if not stored_password:
            raise HTTPException(status_code=404, detail="Teacher not found for this session")
            
        if stored_password == req.pin_code:
            return {"status": "success", "message": "PIN correct"}
        else:
            raise HTTPException(status_code=401, detail="PIN incorrect")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/api/sessions/{session_id}/attendance")
def get_session_attendance(session_id: str, db: Session = Depends(get_db)):
    try:
        # Get session details
        session_query = text("""
            SELECT s.id, s.course_name, s.group_name, s.session_date::text, t.name as teacher_name, s.classroom, s.start_time::text, s.status
            FROM sessions s JOIN teachers t ON s.teacher_id = t.id
            WHERE s.id = :sid
        """)
        session_row = db.execute(session_query, {"sid": int(session_id)}).fetchone()
        
        if not session_row:
            raise HTTPException(status_code=404, detail="Session not found")
            
        course_name = session_row[1]
        group_name = session_row[2]
        
        # Normalize group name (Remove G/GRP and leading zeros)
        def normalize_group(g):
            if not g: return ""
            # Remove G/GRP, uppercase, trim, and then strip leading zeros
            g = g.upper().replace("GRP", "").replace("G", "").strip()
            return g.lstrip('0') or "0" # "0" as fallback for pure zero groups

        norm_group = normalize_group(group_name)
        
        # 1. Get course_id for enrollment check - Use ILIKE for fuzzy matching and match the group
        course_id_query = text("""
            SELECT id FROM courses 
            WHERE (:cname ILIKE '%' || name || '%' OR name ILIKE '%' || :cname || '%')
            AND (LTRIM(TRIM(UPPER(REPLACE(REPLACE(group_name, 'GRP', ''), 'G', ''))), '0') = :norm_group OR :norm_group = '')
            LIMIT 1
        """)
        course_id_row = db.execute(course_id_query, {"cname": course_name, "norm_group": norm_group}).fetchone()
        cid = course_id_row[0] if course_id_row else None
        
        # 2. Robust combined query
        if group_name == 'ALL':
            students_query = text("""
                SELECT id, student_code, full_name, photo_url, matricule, group_name 
                FROM students 
                ORDER BY full_name
            """)
            students_result = db.execute(students_query).fetchall()
        else:
            # SQL normalization: remove non-digits or just G/GRP and leading zeros
            # To be simple and robust, we match students where their normalized group name matches
            students_query = text("""
                SELECT DISTINCT s.id, s.student_code, s.full_name, s.photo_url, s.matricule, s.group_name 
                FROM students s
                LEFT JOIN course_enrollments ce ON s.id = ce.student_id AND ce.course_id = :cid
                WHERE ce.course_id IS NOT NULL 
                   OR LTRIM(TRIM(UPPER(REPLACE(REPLACE(s.group_name, 'GRP', ''), 'G', ''))), '0') = :norm_group
                   OR (s.group_name IS NULL AND :norm_group = '')
                ORDER BY s.full_name
            """)
            students_result = db.execute(students_query, {
                "cid": cid, 
                "norm_group": norm_group
            }).fetchall()
        
        # Fallback to ALL students if still empty (just to be safe)
        if not students_result:
            students_result = db.execute(text("SELECT id, student_code, full_name, photo_url, matricule, group_name FROM students ORDER BY full_name LIMIT 100")).fetchall()
        
        # Get attendance records for this session
        records_query = text("""
            SELECT student_id, status, marked_at::text FROM attendance_records WHERE session_id = :sid
        """)
        records_result = db.execute(records_query, {"sid": int(session_id)}).fetchall()
        attendance_map = {str(r[0]): {"status": r[1], "marked_at": r[2]} for r in records_result}
        
        student_list = []
        for s in students_result:
            s_id = str(s[0])
            att = attendance_map.get(s_id, {"status": None, "marked_at": None})
            student_list.append({
                "id": s_id,
                "student_code": s[1],
                "full_name": s[2],
                "name": s[2],
                "photo_url": s[3],
                "matricule": s[4],
                "group_name": s[5],
                "status": att["status"],
                "marked_at": att["marked_at"]
            })
            
        return {
            "session": {
                "id": str(session_row[0]),
                "course_name": session_row[1],
                "group_name": session_row[2],
                "session_date": session_row[3],
                "teacher_name": session_row[4],
                "classroom": session_row[5],
                "start_time": session_row[6],
                "status": session_row[7]
            },
            "students": student_list
        }
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/api/courses/{course_id}/students")
def get_course_students(course_id: str, db: Session = Depends(get_db)):
    try:
        # 1. Get course details
        course_query = text("SELECT id, name, group_name FROM courses WHERE id = CAST(:cid AS uuid)")
        course_row = db.execute(course_query, {"cid": course_id}).fetchone()
        
        if not course_row:
            raise HTTPException(status_code=404, detail="Course not found")
            
        group_name = course_row[2]
        
        # Normalize group name (Remove G/GRP and leading zeros)
        def normalize_group(g):
            if not g: return ""
            g = g.upper().replace("GRP", "").replace("G", "").strip()
            return g.lstrip('0') or "0"

        norm_group = normalize_group(group_name)
        
        # 2. Try Enrollment first
        students_query = text("""
            SELECT s.id, s.student_code, s.full_name, s.photo_url, s.matricule, s.group_name 
            FROM students s
            JOIN course_enrollments ce ON s.id = ce.student_id
            WHERE ce.course_id = CAST(:cid AS uuid)
            ORDER BY s.full_name
        """)
        students_result = db.execute(students_query, {"cid": course_id}).fetchall()
        
        # 3. Fallback to group if no enrollments
        if not students_result:
            if norm_group == 'ALL' or norm_group == '':
                fallback_query = text("SELECT id, student_code, full_name, photo_url, matricule, group_name FROM students")
                students_result = db.execute(fallback_query).fetchall()
            else:
                fallback_query = text("""
                    SELECT id, student_code, full_name, photo_url, matricule, group_name 
                    FROM students 
                    WHERE LTRIM(TRIM(UPPER(REPLACE(REPLACE(group_name, 'GRP', ''), 'G', ''))), '0') = :norm_group
                """)
                students_result = db.execute(fallback_query, {"norm_group": norm_group}).fetchall()

        # 4. Final Query with Stats
        student_ids = [r[0] for r in students_result]
        if not student_ids:
            return []
            
        sids_str = ",".join([f"'{str(sid)}'" for sid in student_ids])
        
        final_query = text(f"""
            SELECT 
                s.id, s.student_code, s.full_name, s.photo_url, s.matricule, s.group_name,
                COUNT(ar.id) FILTER (WHERE ar.status = 'Absent') as absence_count,
                COUNT(ar.id) FILTER (WHERE ar.status IN ('Present', 'Late')) as presence_count,
                MAX(aa.threshold) as absence_threshold,
                MAX(aa.status) as alert_status
            FROM students s
            LEFT JOIN attendance_records ar ON s.id = ar.student_id 
                AND ar.session_id IN (SELECT id FROM sessions WHERE course_name = :cname AND group_name = :gname)
            LEFT JOIN absence_alerts aa ON s.id = aa.student_id AND aa.course_id = :cid
            WHERE s.id IN ({sids_str})
            GROUP BY s.id
            ORDER BY absence_count DESC, s.full_name
        """)
            
        stats_result = db.execute(final_query, {
            "cname": course_row[1],
            "gname": course_row[2],
            "cid": course_id
        }).fetchall()

        return [
            {
                "id": str(r[0]),
                "student_code": r[1],
                "full_name": r[2],
                "photo_url": r[3],
                "matricule": r[4],
                "group_name": r[5],
                "absence_count": r[6] or 0,
                "presence_count": r[7] or 0,
                "absence_threshold": r[8] or 5,
                "alert_status": r[9] or "Normal",
                "risk_level": "CRITICAL" if (r[6] or 0) >= (r[8] or 5) else "WARNING" if (r[6] or 0) >= (r[8] or 5) - 1 else "SAFE"
            } for r in stats_result
        ]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/api/teachers/{teacher_id}/alerts")
def get_teacher_alerts(teacher_id: int, db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT aa.id, aa.absence_count, aa.threshold, aa.status, aa.generated_at,
                   s.full_name as student_name, s.photo_url as student_photo,
                   c.name as course_name
            FROM absence_alerts aa
            JOIN students s ON aa.student_id = s.id
            JOIN courses c ON aa.course_id = c.id
            WHERE c.teacher_name = (SELECT name FROM teachers WHERE id = :tid)
            AND aa.status = 'active'
            ORDER BY aa.generated_at DESC
        """)
        result = db.execute(query, {"tid": teacher_id}).fetchall()
        return [
            {
                "id": str(r[0]),
                "absence_count": r[1],
                "threshold": r[2],
                "status": r[3],
                "generated_at": r[4].isoformat() if r[4] else None,
                "student_name": r[5],
                "student_photo": r[6],
                "course_name": r[7]
            } for r in result
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def auto_mark_absents(session_id: int, db: Session):
    try:
        session_row = db.execute(text("SELECT course_name, group_name FROM sessions WHERE id = :sid"), {"sid": session_id}).fetchone()
        if not session_row: return
        course_name, group_name = session_row
        
        def normalize_group(g):
            if not g: return ""
            g = g.upper().replace("GRP", "").replace("G", "").strip()
            return g.lstrip('0') or "0"

        norm_group = normalize_group(group_name)
        
        course_id_query = text("""
            SELECT id FROM courses 
            WHERE (:cname ILIKE '%' || name || '%' OR name ILIKE '%' || :cname || '%')
            AND (LTRIM(TRIM(UPPER(REPLACE(REPLACE(group_name, 'GRP', ''), 'G', ''))), '0') = :norm_group OR :norm_group = '')
            LIMIT 1
        """)
        course_id_row = db.execute(course_id_query, {"cname": course_name, "norm_group": norm_group}).fetchone()
        cid = course_id_row[0] if course_id_row else None
        
        if group_name == 'ALL':
            students_query = text("SELECT id FROM students")
            students_result = db.execute(students_query).fetchall()
        else:
            students_query = text("""
                SELECT DISTINCT s.id 
                FROM students s
                LEFT JOIN course_enrollments ce ON s.id = ce.student_id AND ce.course_id = :cid
                WHERE ce.course_id IS NOT NULL 
                   OR LTRIM(TRIM(UPPER(REPLACE(REPLACE(s.group_name, 'GRP', ''), 'G', ''))), '0') = :norm_group
                   OR (s.group_name IS NULL AND :norm_group = '')
            """)
            students_result = db.execute(students_query, {"cid": cid, "norm_group": norm_group}).fetchall()

        if not students_result: return

        # Obtenir les étudiants déjà marqués
        records_query = text("SELECT student_id FROM attendance_records WHERE session_id = :sid")
        records_result = db.execute(records_query, {"sid": session_id}).fetchall()
        marked_students = {str(r[0]) for r in records_result}

        absents_to_mark = []
        for s in students_result:
            s_id = str(s[0])
            if s_id not in marked_students:
                absents_to_mark.append(s_id)
                
        if absents_to_mark:
            insert_query = text("""
                INSERT INTO attendance_records (session_id, student_id, status, method)
                VALUES (:sid, CAST(:stid AS uuid), 'absent', 'auto')
                ON CONFLICT (session_id, student_id) DO NOTHING
            """)
            for s_id in absents_to_mark:
                db.execute(insert_query, {"sid": session_id, "stid": s_id})
            db.commit()
            
            # Synchroniser les alertes d'absence
            for s_id in absents_to_mark:
                try:
                    sync_student_alerts(s_id, session_id, db)
                except Exception as e:
                    print(f"Error syncing alert for {s_id}: {e}")
                    
    except Exception as e:
        print(f"Auto-mark absents error: {e}")

@app.patch("/api/sessions/{session_id}")
def update_session(session_id: int, session: SessionUpdate, db: Session = Depends(get_db)):
    try:
        # is_active=False pour fermer la session (status 'closed')
        is_active = session.status not in ('closed', 'cancelled', 'inactive')
        
        # Check if we are closing an active session
        if session.status == 'closed':
            # Call our AI algorithm to mark all unscanned students as absent
            auto_mark_absents(session_id, db)
            
        query = text("""
            UPDATE sessions
            SET is_active = :is_active,
                status = :status,
                end_time = COALESCE(CAST(:end_time AS time), end_time)
            WHERE id = :session_id
        """)
        db.execute(query, {
            "is_active": is_active,
            "status": session.status,
            "end_time": session.end_time,
            "session_id": session_id,
        })
        db.commit()
        return {"message": "Success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/records")
def get_all_records(db: Session = Depends(get_db)):
    try:
        query = """
    SELECT ar.id, ar.session_id, ar.student_id, ar.status, ar.marked_at::text,
           s.full_name, s.photo_url, s.student_code, s.group_name,
           sess.course_name, c.id as course_id
    FROM attendance_records ar
    JOIN students s ON ar.student_id = s.id
    JOIN sessions sess ON ar.session_id = sess.id
    LEFT JOIN courses c ON (
        LOWER(sess.course_name) = LOWER(c.name) OR 
        LOWER('Cours ' || sess.course_name) = LOWER(c.name) OR
        LOWER(sess.course_name) = LOWER('Cours ' || c.name) OR
        LOWER(sess.course_name) = LOWER(c.course_code)
    ) AND sess.group_name = c.group_name
    """
        result = db.execute(text(query))
        return [
            {
                "id": str(r[0]),
                "session_id": str(r[1]),
                "student_id": str(r[2]),
                "status": r[3],
                "marked_at": r[4],
                "students": {"full_name": r[5], "photo_url": r[6], "student_code": r[7], "group_name": r[8]},
                "attendance_sessions": {"course_name": r[9], "course_id": str(r[10]) if r[10] else None}
            } for r in result
        ]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/api/enrollments")
def get_enrollments(db: Session = Depends(get_db)):
    try:
        query = "SELECT course_id, student_id FROM course_enrollments"
        result = db.execute(text(query)).fetchall()
        return [{"course_id": r[0], "student_id": r[1]} for r in result]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Attendance Records Per Session ───────────────────────────────────────────

@app.get("/api/sessions/{session_id}/records")
def get_records(session_id: str, db: Session = Depends(get_db)):
    try:
        query = """
    SELECT ar.id, ar.session_id, ar.student_id, ar.status, ar.marked_at::text,
           ar.method, ar.confidence_score,
           s.full_name, s.photo_url, s.student_code
    FROM attendance_records ar
    JOIN students s ON ar.student_id = s.id
    WHERE ar.session_id = :session_id
    """
        result = db.execute(text(query), {"session_id": int(session_id)})
        records = []
        for r in result:
            records.append({
                "id": str(r[0]),
                "session_id": str(r[1]),
                "student_id": str(r[2]),
                "status": r[3],
                "marked_at": r[4],
                "method": r[5],
                "confidence_score": float(r[6]) if r[6] is not None else None,
                "students": {"full_name": r[7], "photo_url": r[8], "student_code": r[9]},
            })
        return records
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

def sync_student_alerts(student_id: str, session_id: int, db: Session):
    try:
        # 1. Get course details from session
        session_query = text("SELECT course_name, group_name FROM sessions WHERE id = :sid")
        s_row = db.execute(session_query, {"sid": int(session_id)}).fetchone()
        if not s_row: return
        
        c_name, g_name = s_row
        # Find matching course to get its ID and threshold
        course_query = text("""
            SELECT id, absence_threshold FROM courses 
            WHERE name = :name AND (group_name = :group OR group_name = 'ALL' OR group_name = '')
            LIMIT 1
        """)
        c_row = db.execute(course_query, {"name": c_name, "group": g_name}).fetchone()
        if not c_row: return
        
        course_id, threshold = c_row
        threshold = threshold or 5
        
        # 2. Count total absences for this student in this course
        abs_query = text("""
            SELECT COUNT(*) 
            FROM attendance_records ar
            JOIN sessions s ON ar.session_id = s.id
            WHERE ar.student_id = CAST(:sid AS uuid) 
              AND s.course_name = :cname 
              AND ar.status IN ('Absent', 'absent')
        """)
        abs_count = db.execute(abs_query, {"sid": student_id, "cname": c_name}).scalar()
        
        # 3. Update alert table
        if abs_count >= threshold:
            upsert_query = text("""
                INSERT INTO absence_alerts (student_id, course_id, absence_count, threshold, status, generated_at)
                VALUES (CAST(:sid AS uuid), CAST(:cid AS uuid), :count, :th, 'active', NOW())
                ON CONFLICT (student_id, course_id)
                DO UPDATE SET absence_count = EXCLUDED.absence_count, 
                              status = 'active',
                              generated_at = NOW()
            """)
            db.execute(upsert_query, {
                "sid": student_id, 
                "cid": str(course_id), 
                "count": abs_count, 
                "th": threshold
            })
        else:
            # Below threshold: remove alert if exists
            del_query = text("DELETE FROM absence_alerts WHERE student_id = CAST(:sid AS uuid) AND course_id = CAST(:cid AS uuid)")
            db.execute(del_query, {"sid": student_id, "cid": str(course_id)})
            
        db.commit()
    except Exception as e:
        print(f"Alert Sync Error: {e}")
        db.rollback()

@app.post("/api/records/upsert")
def upsert_record(record: AttendanceUpsert, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO attendance_records (session_id, student_id, status, method, confidence_score)
            VALUES (:session_id, CAST(:student_id AS uuid), :status, :method, :confidence_score)
            ON CONFLICT (session_id, student_id)
            DO UPDATE SET status = EXCLUDED.status, method = EXCLUDED.method,
                          confidence_score = EXCLUDED.confidence_score
        """)
        db.execute(query, {
            "session_id": record.session_id,
            "student_id": record.student_id,
            "status": record.status,
            "method": record.method,
            "confidence_score": record.confidence_score,
        })
        db.commit()
        
        # Sync alerts
        sync_student_alerts(record.student_id, int(record.session_id), db)
        
        return {"message": "Success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Recognize ───────────────────────────────────────────────────────────────

def check_liveness(image_path: str) -> bool:
    import cv2
    img = cv2.imread(image_path)
    if img is None:
        return False
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Variance of the Laplacian: measures the focus/sharpness
    # A blurry image (often a photo of a screen or paper) has low variance
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance > 15.0

@app.post("/api/sessions/{session_id}/recognize")
async def recognize_face(session_id: str, request: RecognizeRequest, db: Session = Depends(get_db)):
    try:
        header, encoded = request.image.split(",", 1)
        data = base64.b64decode(encoded)
        temp_filename = f"temp_{uuid.uuid4()}.jpg"
        temp_path = os.path.join(UPLOAD_DIR, temp_filename)
        with open(temp_path, "wb") as f:
            f.write(data)

        # Liveness Detection Check
        if request.liveness_enabled and not check_liveness(temp_path):
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {"match": False, "message": "Échec Liveness (Image floue/suspecte)", "status": "liveness_failed"}

        # apply_enhancement=True : active CLAHE pour compenser la basse lumière en salle
        target_encoding = compute_face_encoding(temp_path, apply_enhancement=True)
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if not target_encoding:
            return {"match": False, "message": f"Visage non détecté ({DETECTOR_BACKEND})", "status": "error"}

        session_query = text("SELECT teacher_id, group_name FROM sessions WHERE id = :sid")
        session_row = db.execute(session_query, {"sid": session_id}).fetchone()
        if not session_row:
            return {"status": "no_session", "message": "Session inconnue"}

        session_teacher_id = session_row[0]
        session_group = session_row[1]

        best_match = None
        min_dist = THRESHOLD

        if request.target_type == "teacher":
            all_teachers_query = text("SELECT id, name, face_encoding FROM teachers WHERE face_encoding IS NOT NULL")
            all_teachers = db.execute(all_teachers_query).fetchall()

            if not all_teachers:
                return {"status": "unknown", "message": "Aucun enseignant enregistré"}

            t_ids = [r[0] for r in all_teachers]
            t_names = [r[1] for r in all_teachers]
            t_encodings = np.array([r[2] if isinstance(r[2], list) else json.loads(r[2]) for r in all_teachers], dtype=np.float32)

            distances = batch_cosine_distances(target_encoding, t_encodings)
            best_idx = int(np.argmin(distances))
            best_dist = float(distances[best_idx])

            if best_dist >= THRESHOLD:
                return {"status": "unknown", "message": "Enseignant non reconnu"}

            best_match = {"id": str(t_ids[best_idx]), "name": t_names[best_idx], "distance": best_dist}

            if best_match["id"] != str(session_teacher_id):
                return {"status": "wrong_teacher", "student": best_match, "message": "Contactez l'administration, vous n'êtes pas assigné à ce cours"}

            return {"status": "teacher_success", "student": best_match, "message": "Authentification professeur réussie"}

        # DEFAULT: STUDENT SCANNING (vectorisé)
        all_students_query = text("SELECT id, full_name, face_encoding, group_name FROM students WHERE face_encoding IS NOT NULL")
        all_students = db.execute(all_students_query).fetchall()

        if not all_students:
            return {"status": "unknown", "message": "Aucun étudiant enregistré"}

        s_ids = [r[0] for r in all_students]
        s_names = [r[1] for r in all_students]
        s_encodings = np.array([r[2] if isinstance(r[2], list) else json.loads(r[2]) for r in all_students], dtype=np.float32)
        s_groups = [r[3] for r in all_students]

        distances = batch_cosine_distances(target_encoding, s_encodings)
        best_idx = int(np.argmin(distances))
        best_dist = float(distances[best_idx])

        if best_dist >= THRESHOLD:
            return {"status": "unknown", "message": "Visage non reconnu"}

        best_match = {"id": str(s_ids[best_idx]), "name": s_names[best_idx], "distance": best_dist, "group": s_groups[best_idx]}

        if best_match["group"] != session_group:
            return {"status": "wrong_group", "student": best_match, "message": "Étudiant reconnu mais non inscrit à ce cours"}

        return {"status": "success", "student": best_match, "message": "Présence confirmée"}

    except Exception as e:
        print(traceback.format_exc())
        return {"match": False, "error": str(e), "status": "error"}

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    try:
        # 1. Supprimer les records de présence liés pour éviter les erreurs de clé étrangère
        db.execute(text("DELETE FROM attendance_records WHERE session_id = :sid"), {"sid": session_id})
        
        # 2. Supprimer la session proprement
        query = text("DELETE FROM sessions WHERE id = :sid")
        result = db.execute(query, {"sid": session_id})
        
        db.commit()
        return {"status": "success", "message": "Session supprimée catégoriquement de la base de données"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Absence Alerts ───────────────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    try:
        query = """
    SELECT aa.id, aa.student_id, aa.course_id, aa.absence_count, aa.threshold,
           aa.status, aa.generated_at::text, aa.resolved_at::text, aa.notes,
           s.full_name, s.photo_url, s.student_code, s.email,
           d.name as dept_name,
           c.name as course_name, c.course_code, c.teacher_name
    FROM absence_alerts aa
    JOIN students s ON aa.student_id = s.id
    JOIN courses c ON aa.course_id = c.id
    LEFT JOIN departments d ON s.department_id = d.id
    ORDER BY aa.generated_at DESC
    """
        result = db.execute(text(query))
        alerts = []
        for r in result:
            alerts.append({
                "id": str(r[0]),
                "student_id": str(r[1]),
                "course_id": str(r[2]),
                "absence_count": r[3],
                "threshold": r[4],
                "status": r[5],
                "generated_at": r[6],
                "resolved_at": r[7],
                "notes": r[8],
                "students": {
                    "full_name": r[9],
                    "photo_url": r[10],
                    "student_code": r[11],
                    "email": r[12],
                    "departments": {"name": r[13]} if r[13] else None,
                },
                "courses": {
                    "name": r[14],
                    "course_code": r[15],
                    "teacher_name": r[16],
                },
            })
        return alerts
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/api/alerts/upsert")
def upsert_alert(alert: AlertUpsert, db: Session = Depends(get_db)):
    try:
        query = text("""
            INSERT INTO absence_alerts (student_id, course_id, absence_count, threshold, status, notes)
            VALUES (CAST(:student_id AS uuid), CAST(:course_id AS uuid),
                    :absence_count, :threshold, :status, :notes)
            ON CONFLICT (student_id, course_id)
            DO UPDATE SET absence_count = EXCLUDED.absence_count,
                          threshold = EXCLUDED.threshold,
                          status = EXCLUDED.status
        """)
        db.execute(query, {
            "student_id": alert.student_id,
            "course_id": alert.course_id,
            "absence_count": alert.absence_count,
            "threshold": alert.threshold,
            "status": alert.status,
            "notes": alert.notes,
        })
        db.commit()
        return {"message": "Success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.patch("/api/alerts/{alert_id}")
def update_alert(alert_id: str, alert: AlertUpdate, db: Session = Depends(get_db)):
    try:
        query = text("""
            UPDATE absence_alerts
            SET status = :status, resolved_at = :resolved_at
            WHERE id = CAST(:alert_id AS uuid)
        """)
        db.execute(query, {
            "status": alert.status,
            "resolved_at": alert.resolved_at,
            "alert_id": alert_id,
        })
        db.commit()
        return {"message": "Success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    try:
        import datetime
        today = datetime.date.today().isoformat()
        stats = {}

        r = db.execute(text("SELECT COUNT(*) FROM students WHERE is_active = true")).fetchone()
        stats["totalStudents"] = r[0]

        r = db.execute(text("SELECT COUNT(*) FROM teachers")).fetchone()
        stats["totalTeachers"] = r[0]

        r = db.execute(text("SELECT COUNT(*) FROM courses")).fetchone()
        stats["totalCourses"] = r[0]

        r = db.execute(text(
            "SELECT COUNT(*) FROM sessions WHERE session_date = CAST(:d AS date)"
        ), {"d": today}).fetchone()
        stats["todaySessions"] = r[0]

        r = db.execute(text(
            "SELECT COUNT(*) FROM absence_alerts WHERE status = 'active'"
        )).fetchone()
        stats["activeAlerts"] = r[0]

        r = db.execute(text("""
            SELECT COUNT(*) FROM attendance_records ar
            JOIN sessions s ON ar.session_id = s.id
            WHERE ar.status = 'present' AND s.session_date = CAST(:d AS date)
        """), {"d": today}).fetchone()
        stats["presentToday"] = r[0]

        r = db.execute(text("""
            SELECT COUNT(*) FROM attendance_records ar
            JOIN sessions s ON ar.session_id = s.id
            WHERE ar.status = 'absent' AND s.session_date = CAST(:d AS date)
        """), {"d": today}).fetchone()
        stats["absentToday"] = r[0]

        r = db.execute(text("""
            SELECT COUNT(*) FROM attendance_records ar
            JOIN sessions s ON ar.session_id = s.id
            WHERE s.session_date = CAST(:d AS date)
        """), {"d": today}).fetchone()
        total = r[0] or 1
        rate = round((stats["presentToday"] / total) * 100)
        stats["attendanceRate"] = rate

        recs = db.execute(text("""
            SELECT ar.id, ar.student_id, ar.status, ar.method, ar.marked_at::text,
                   ar.confidence_score, s.full_name, s.photo_url,
                   sess.course_name
            FROM attendance_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN sessions sess ON ar.session_id = sess.id
            ORDER BY ar.marked_at DESC LIMIT 8
        """))
        recent_records = []
        for r in recs:
            recent_records.append({
                "id": str(r[0]),
                "student_id": str(r[1]),
                "status": r[2],
                "method": r[3],
                "marked_at": r[4],
                "confidence_score": float(r[5]) if r[5] is not None else None,
                "students": {"full_name": r[6], "photo_url": r[7]},
                "attendance_sessions": {"courses": {"name": r[8]}},
            })

        alts = db.execute(text("""
            SELECT aa.id, aa.absence_count, aa.threshold,
                   s.full_name, s.photo_url, s.student_code,
                   c.name
            FROM absence_alerts aa
            JOIN students s ON aa.student_id = s.id
            JOIN courses c ON aa.course_id = c.id
            WHERE aa.status = 'active'
            ORDER BY aa.generated_at DESC LIMIT 5
        """))
        recent_alerts = []
        for r in alts:
            recent_alerts.append({
                "id": str(r[0]),
                "absence_count": r[1],
                "threshold": r[2],
                "students": {"full_name": r[3], "photo_url": r[4], "student_code": r[5]},
                "courses": {"name": r[6]},
            })

        return {
            "stats": stats,
            "recentRecords": recent_records,
            "recentAlerts": recent_alerts,
        }
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e

# ─── Reports ─────────────────────────────────────────────────────────────────

@app.get("/api/reports")
def get_reports(db: Session = Depends(get_db)):
    try:
        courses_raw = db.execute(text("""
            SELECT c.id, c.name, c.course_code, c.teacher_name,
                   d.name as dept_name, d.code as dept_code
            FROM courses c LEFT JOIN departments d ON c.department_id = d.id
            ORDER BY c.name
        """))
        course_list = [
            {"id": str(r[0]), "name": r[1], "course_code": r[2], "teacher_name": r[3],
             "departments": {"name": r[4], "code": r[5]} if r[4] else None}
            for r in courses_raw
        ]

        report_data = []
        for course in course_list:
            sessions_raw = db.execute(text("""
                SELECT id, session_date::text, start_time::text, end_time::text, status
                FROM attendance_sessions
                WHERE course_id = CAST(:cid AS uuid)
                ORDER BY session_date DESC
            """), {"cid": course["id"]})
            sessions = []
            for s in sessions_raw:
                records_raw = db.execute(text("""
                    SELECT ar.status, COUNT(*) as cnt
                    FROM attendance_records ar
                    WHERE ar.session_id = CAST(:sid AS uuid)
                    GROUP BY ar.status
                """), {"sid": str(s[0])})
                counts = {r[0]: r[1] for r in records_raw}
                sessions.append({
                    "id": str(s[0]),
                    "session_date": s[1],
                    "start_time": s[2],
                    "end_time": s[3],
                    "status": s[4],
                    "present_count": counts.get("present", 0),
                    "absent_count": counts.get("absent", 0),
                })
            report_data.append({**course, "sessions": sessions})

        return report_data
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.get("/api/teachers/{teacher_id}/dashboard")
def get_teacher_dashboard_stats(teacher_id: int, db: Session = Depends(get_db)):
    try:
        import datetime
        today = datetime.date.today().isoformat()
        stats = {}
        
        # 1. Nom de l'enseignant
        t = db.execute(text("SELECT name FROM teachers WHERE id = :id"), {"id": teacher_id}).fetchone()
        t_name = t[0] if t else "Unknown"

        # 2. Stats
        r = db.execute(text("SELECT COUNT(*) FROM courses WHERE teacher_name = :n"), {"n": t_name}).fetchone()
        stats["totalCourses"] = r[0]

        r = db.execute(text("SELECT COUNT(*) FROM sessions WHERE teacher_id = :id AND session_date = :d"), {"id": teacher_id, "d": today}).fetchone()
        stats["todaySessions"] = r[0]

        r = db.execute(text("""
            SELECT COUNT(*) FROM attendance_records ar 
            JOIN sessions s ON ar.session_id = s.id 
            WHERE s.teacher_id = :id AND ar.status = 'present'
        """), {"id": teacher_id}).fetchone()
        present = r[0]

        r = db.execute(text("""
            SELECT COUNT(*) FROM attendance_records ar 
            JOIN sessions s ON ar.session_id = s.id 
            WHERE s.teacher_id = :id
        """), {"id": teacher_id}).fetchone()
        total = r[0] or 1
        stats["attendanceRate"] = round((present / total) * 100)

        # 3. Activité récente
        recs = db.execute(text("""
            SELECT ar.id, s.full_name, s.photo_url, sess.course_name, ar.marked_at::text
            FROM attendance_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN sessions sess ON ar.session_id = sess.id
            WHERE sess.teacher_id = :id
            ORDER BY ar.marked_at DESC LIMIT 10
        """), {"id": teacher_id})
        
        recent_records = []
        for row in recs:
            recent_records.append({
                "id": str(row[0]),
                "student": {"name": row[1], "photo_url": row[2]},
                "session": {"course_name": row[3]},
                "marked_at": row[4]
            })

        return {"stats": stats, "recentRecords": recent_records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
