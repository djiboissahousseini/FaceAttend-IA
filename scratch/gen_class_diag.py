from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs("docs/diagrams/conception", exist_ok=True)

try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
    font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
except:
    font = font_bold = font_title = ImageFont.load_default()

W, H = 1400, 950
img = Image.new("RGB", (W, H), "white")
draw = ImageDraw.Draw(img)

for x in range(0,W,20): draw.line([(x,0),(x,H)], fill="#f0f0f0")
for y in range(0,H,20): draw.line([(0,y),(W,y)], fill="#f0f0f0")
draw.rectangle([(0,0),(W-1,H-1)], outline="black", width=2)

title = "Diagramme de Classe - Système FaceAttend"
bb = draw.textbbox((0,0), title, font=font_title)
draw.text(((W-(bb[2]-bb[0]))//2, 25), title, fill="black", font=font_title)

def class_box(x, y, name, attrs, methods=None):
    w = 260
    header_h = 30
    attr_h = len(attrs) * 16 + 10
    meth_h = (len(methods) * 16 + 10) if methods else 5
    total_h = header_h + attr_h + meth_h
    
    draw.rectangle([(x,y),(x+w,y+total_h)], fill="#F5F5F5", outline="black", width=1)
    draw.rectangle([(x,y),(x+w,y+header_h)], fill="#E1D5E7", outline="black", width=1)
    nb = draw.textbbox((0,0), name, font=font_bold)
    draw.text((x+(w-(nb[2]-nb[0]))//2, y+8), name, fill="black", font=font_bold)
    
    curr_y = y + header_h + 5
    for a in attrs:
        draw.text((x+8, curr_y), f"- {a}", fill="black", font=font)
        curr_y += 16
        
    draw.line([(x, y+header_h+attr_h), (x+w, y+header_h+attr_h)], fill="black", width=1)
    
    if methods:
        curr_y = y + header_h + attr_h + 5
        for m in methods:
            draw.text((x+8, curr_y), f"+ {m}", fill="black", font=font)
            curr_y += 16
            
    return x, y, w, total_h

t_x, t_y, t_w, t_h = class_box(50, 100, "Teacher (Enseignant)", [
    "id: Integer {PK}",
    "name: String",
    "email: String {Unique}",
    "password: String",
    "pin_code: String",
    "photo_url: String",
    "face_encoding: JSON",
    "face_embedding: Vector"
], ["login()", "verify_pin()"])

c_x, c_y, c_w, c_h = class_box(450, 100, "Course (Cours)", [
    "id: UUID {PK}",
    "name: String",
    "course_code: String",
    "teacher_name: String",
    "group_name: String",
    "absence_threshold: Int"
])

s_x, s_y, s_w, s_h = class_box(850, 100, "Student (Étudiant)", [
    "id: UUID {PK}",
    "full_name: String",
    "student_code: String",
    "email: String",
    "group_name: String",
    "photo_url: String",
    "face_encoding: JSON",
    "face_embedding: Vector"
], ["recognize()", "get_stats()"])

sess_x, sess_y, sess_w, sess_h = class_box(150, 450, "AttendanceSession (Séance)", [
    "id: Integer {PK}",
    "teacher_id: Integer {FK}",
    "course_name: String",
    "group_name: String",
    "classroom: String",
    "session_date: Date",
    "is_active: Boolean"
], ["open()", "close()"])

rec_x, rec_y, rec_w, rec_h = class_box(550, 450, "AttendanceRecord (Présence)", [
    "id: UUID {PK}",
    "session_id: Integer {FK}",
    "student_id: UUID {FK}",
    "status: String",
    "marked_at: DateTime",
    "method: String",
    "confidence_score: Float"
])

al_x, al_y, al_w, al_h = class_box(950, 450, "AbsenceAlert (Absence/Alerte)", [
    "id: UUID {PK}",
    "student_id: UUID {FK}",
    "course_id: UUID {FK}",
    "absence_count: Integer",
    "threshold: Integer",
    "status: String"
])

u_x, u_y, u_w, u_h = class_box(450, 750, "User (Utilisateur/Admin)", [
    "id: Integer {PK}",
    "username: String",
    "role: String",
    "password_hash: String"
], ["authenticate()", "manage_system()"])

ai_x, ai_y, ai_w, ai_h = class_box(850, 750, "FacialRecognition (IA)", [
    "model_name: String",
    "liveness_enabled: Boolean",
    "threshold: Float"
], ["extract_features()", "check_liveness()", "match_face()"])

def link(x1, y1, x2, y2, label="", mult1="", mult2=""):
    draw.line([(x1,y1),(x2,y2)], fill="black", width=1)
    if label:
        mx, my = (x1+x2)//2, (y1+y2)//2
        draw.text((mx+5, my-15), label, fill="blue", font=font)
    if mult1:
        draw.text((x1+5, y1+5), mult1, fill="black", font=font)
    if mult2:
        draw.text((x2-15, y2-15), mult2, fill="black", font=font)

link(t_x+t_w, t_y+30, c_x, c_y+30, "enseigne", "1", "0..*")
link(c_x+c_w, c_y+30, s_x, s_y+30, "inscrit", "1..*", "1..*")
link(c_x+50, c_y+c_h, sess_x+sess_w-50, sess_y, "planifie", "1", "0..*")
link(sess_x+sess_w, sess_y+sess_h//2, rec_x, rec_y+rec_h//2, "contient", "1", "0..*")
link(s_x+50, s_y+s_h, rec_x+rec_w-50, rec_y, "a", "1", "0..*")
link(s_x+150, s_y+s_h, al_x+al_w//2, al_y, "déclenche", "1", "0..*")
link(c_x+150, c_y+c_h, al_x+50, al_y, "concerne", "1", "0..*")
link(rec_x+rec_w//2, rec_y+rec_h, ai_x, ai_y+20, "alimenté par", "1", "1")

img.save("docs/diagrams/conception/diagramme_classe.png")
