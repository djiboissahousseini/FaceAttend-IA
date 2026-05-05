"""
Génère les diagrammes CORRIGÉS dans /docs/diagrams/corriges/
Sans toucher aux originaux.

Corrections apportées :
  seq_ajouter.png   → Ajout étape FaceNet encoding
  seq_modifier.png  → Ajout recalcul conditionnel embedding
  seq_supprimer.png → Distinction Enseignant (toggle-block) / Étudiant (delete)
  diagramme_classe.png → Ajout Enrollment, VERIFIED_SESSIONS
"""
from PIL import Image, ImageDraw, ImageFont
import os, shutil

OUT_DIR = "/home/usain/Bureau/FaceAttend/docs/diagrams/corriges/"
os.makedirs(OUT_DIR, exist_ok=True)

try:
    Fb = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
    Fr = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    Fs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
    Fi = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 10)
    Ft = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
    Fxs = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 9)
except:
    Fb = Fr = Fs = Fi = Ft = Fxs = ImageFont.load_default()

BG   = (255,255,255)
GRID = (240,240,240)
BDR  = (60,60,60)
BLK  = (20,20,20)
BLUE = (50,100,200)
RED  = (200,50,50)
GRN  = (50,160,80)
YEL  = (255,255,200)
PREC = (255,255,200)
POST = (220,245,220)
ALT_BG=(235,245,255)
ALT_ERR=(255,235,235)

# ─── Helpers génériques ────────────────────────────────────────────────────────

def new_canvas(w, h):
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    for x in range(0, w, 20): d.line([(x,0),(x,h)], fill=GRID)
    for y in range(0, h, 20): d.line([(0,y),(w,y)], fill=GRID)
    d.rectangle([2,2,w-3,h-3], outline=BDR, width=2)
    return img, d

def title_bar(d, w, title):
    d.rectangle([3,3,w-4,28], fill=(240,240,252), outline=BDR, width=1)
    bb = d.textbbox((0,0), title, font=Ft)
    d.text(((w-(bb[2]-bb[0]))//2, 7), title, fill=(20,20,100), font=Ft)

def precond(d, text, y=32):
    d.rectangle([18, y, 340, y+18], fill=PREC, outline=(180,160,0), width=1)
    d.text((22, y+3), text, fill=(80,60,0), font=Fs)

def postcond(d, w, text, y):
    bb = d.textbbox((0,0), text, font=Fs)
    tw = bb[2]-bb[0]
    d.rectangle([18, y, 18+tw+20, y+18], fill=POST, outline=(60,130,60), width=1)
    d.text((28, y+3), text, fill=(30,80,30), font=Fs)

def lifeline(d, x, y_top, y_bot, label):
    # En-tête
    bb = d.textbbox((0,0), label, font=Fb)
    lw = bb[2]-bb[0]
    d.rectangle([x-lw//2-10, y_top, x+lw//2+10, y_top+28], fill=(220,220,235), outline=BDR, width=2)
    d.text((x-lw//2, y_top+7), label, fill=BLK, font=Fb)
    # Ligne pointillée
    y = y_top+28
    while y < y_bot:
        d.line([(x,y),(x,min(y+6,y_bot))], fill=(150,150,150), width=1)
        y += 10

def activation(d, x, y1, y2, w=10):
    d.rectangle([x-w//2, y1, x+w//2, y2], fill=(140,170,230), outline=(60,100,180), width=1)

def arrow_solid(d, x1, y, x2, label, col=BLK, above=True):
    d.line([(x1,y),(x2,y)], fill=col, width=2)
    # Tête de flèche
    if x2 > x1:
        d.polygon([(x2,y),(x2-8,y-5),(x2-8,y+5)], fill=col)
    else:
        d.polygon([(x2,y),(x2+8,y-5),(x2+8,y+5)], fill=col)
    if label:
        bb = d.textbbox((0,0), label, font=Fr)
        lw = bb[2]-bb[0]
        mx = (x1+x2)//2
        dy = -14 if above else 4
        d.text((mx-lw//2, y+dy), label, fill=col, font=Fr)

def arrow_dashed(d, x1, y, x2, label, col=BLUE, above=True):
    dx = 1 if x2>x1 else -1
    cx = x1
    while (dx==1 and cx<x2-8) or (dx==-1 and cx>x2+8):
        end = min(cx+6, x2-8) if dx==1 else max(cx-6, x2+8)
        d.line([(cx,y),(end,y)], fill=col, width=2)
        cx = end+4 if dx==1 else end-4
    if x2>x1:
        d.polygon([(x2,y),(x2-8,y-4),(x2-8,y+4)], fill=col)
    else:
        d.polygon([(x2,y),(x2+8,y-4),(x2+8,y+4)], fill=col)
    if label:
        bb = d.textbbox((0,0), label, font=Fr)
        lw = bb[2]-bb[0]
        mx = (x1+x2)//2
        dy = -14 if above else 3
        d.text((mx-lw//2, y+dy), label, fill=col, font=Fr)

def alt_frame(d, x1, y1, x2, y2, label_ok, label_err=None):
    d.rectangle([x1,y1,x2,y2], outline=BLUE, width=2, fill=None)
    d.rectangle([x1,y1,x1+28,y1+16], fill=BLUE)
    d.text((x1+3, y1+2), "alt", fill="white", font=Fb)
    d.text((x1+35, y1+2), label_ok, fill=BLUE, font=Fi)
    if label_err:
        mid = (y1+y2)//2
        d.line([(x1,mid),(x2,mid)], fill=BLUE, width=1)
        # Pointillé
        cx = x1
        while cx < x2:
            d.line([(cx,mid),(min(cx+5,x2),mid)], fill=BLUE, width=1)
            cx += 9
        d.text((x1+35, mid+2), label_err, fill=RED, font=Fi)

# ═══════════════════════════════════════════════════════════════════════════════
# 1. seq_ajouter_corrige.png   (CORRIGÉ : ajout étape FaceNet encoding)
# ═══════════════════════════════════════════════════════════════════════════════
W, H = 900, 820
img, d = new_canvas(W, H)
title_bar(d, W, "Séquence : Ajouter un Utilisateur (Corrigé)")
precond(d, "Précondition : Admin authentifié", 32)

# Lifelines
LX = [160, 450, 740]
LNAMES = ["Administrateur :", "Système :", "BDD :"]
LL_TOP = 55
LL_BOT = H - 30
for lx, ln in zip(LX, LNAMES):
    lifeline(d, lx, LL_TOP, LL_BOT, ln)

activation(d, LX[1], 140, 750)
activation(d, LX[2], 240, 330)
activation(d, LX[2], 390, 440)  # FaceNet (BDD stockage)

Y = 165
arrow_solid(d, LX[0], Y, LX[1], "Cliquer sur 'Ajouter'")
Y+=40; arrow_dashed(d, LX[1], Y, LX[0], "Afficher formulaire vide", col=BLUE)
Y+=40; arrow_solid(d, LX[0], Y, LX[1], "Saisir nom, email, photo, PIN/mdp")
Y+=40; arrow_solid(d, LX[0], Y, LX[1], "Soumettre le formulaire")
Y+=40; arrow_solid(d, LX[1], Y, LX[2], "POST /api/teachers ou /api/students", col=BLK)

# ✅ CORRECTION : Étape FaceNet manquante dans l'original
Y+=45
d.rectangle([LX[1]-120, Y-5, LX[2]+80, Y+30], fill=(230,245,230), outline=(80,160,80), width=1)
d.text((LX[1]-115, Y), "✅ [CORRIGÉ] Encoder photo → embedding FaceNet (DeepFace/Facenet)", fill=(30,100,30), font=Fs)
Y+=35
arrow_dashed(d, LX[2], Y, LX[1], "Embedding 512D stocké en BDD", col=GRN)

# Alt frame
Y+=30
alt_frame(d, 40, Y, W-30, Y+280, "[si données valides]", "[si erreur (doublon, champ manquant)]")
Y+=25
arrow_dashed(d, LX[2], Y, LX[1], '{"status": "success"}', col=BLUE)
Y+=35; arrow_dashed(d, LX[1], Y, LX[0], "Message : Utilisateur ajouté ✓", col=BLUE)
Y+=30; arrow_dashed(d, LX[1], Y, LX[0], "Rafraîchir la liste", col=BLUE)
Y+=80
arrow_dashed(d, LX[2], Y, LX[1], '{"detail": "Erreur BDD / email existant"}', col=RED)
Y+=35; arrow_dashed(d, LX[1], Y, LX[0], "Message d'erreur : Vérifier les champs", col=RED)

Y = H - 40
postcond(d, W, "Postcondition : Utilisateur enregistré en BDD + embedding facial stocké", Y)

img.save(OUT_DIR + "seq_ajouter.png", "PNG", dpi=(150,150))
print("✅ seq_ajouter.png corrigé")

# ═══════════════════════════════════════════════════════════════════════════════
# 2. seq_modifier_corrige.png  (CORRIGÉ : recalcul FaceNet si nouvelle photo)
# ═══════════════════════════════════════════════════════════════════════════════
W, H = 900, 760
img, d = new_canvas(W, H)
title_bar(d, W, "Séquence : Modifier un Utilisateur (Corrigé)")
precond(d, "Précondition : Admin authentifié, utilisateur existant", 32)

for lx, ln in zip(LX, LNAMES):
    lifeline(d, lx, 55, H-30, ln)

activation(d, LX[1], 140, H-70)
activation(d, LX[2], 230, H-70)

Y = 165
arrow_solid(d, LX[0], Y, LX[1], "Sélectionner un utilisateur dans la liste")
Y+=40; arrow_dashed(d, LX[1], Y, LX[0], "Afficher formulaire pré-rempli", col=BLUE)
Y+=40; arrow_solid(d, LX[0], Y, LX[1], "Modifier les champs souhaités")
Y+=35; arrow_solid(d, LX[0], Y, LX[1], "Cliquer sur 'Modifier'")
Y+=40; arrow_solid(d, LX[1], Y, LX[2], "PATCH /api/teachers/{id} ou /api/students/{id}")

# ✅ CORRECTION : Recalcul conditionnel FaceNet
Y+=45
d.rectangle([LX[1]-120, Y-5, LX[2]+80, Y+42], fill=(230,245,230), outline=(80,160,80), width=1)
d.text((LX[1]-115, Y),    "✅ [CORRIGÉ] Si nouvelle photo fournie :", fill=(30,100,30), font=Fs)
d.text((LX[1]-115, Y+14), "   → Recalcul embedding FaceNet (DeepFace)", fill=(30,100,30), font=Fs)
d.text((LX[1]-115, Y+28), "   → Mise à jour face_encoding en BDD", fill=(30,100,30), font=Fs)
Y+=50
arrow_dashed(d, LX[2], Y, LX[1], "Embedding recalculé + stocké", col=GRN)

alt_frame(d, 40, Y+20, W-30, Y+200, "[si modification valide]", "[si erreur (données invalides)]")
Y+=45
arrow_dashed(d, LX[2], Y, LX[1], '{"status": "success"}', col=BLUE)
Y+=35; arrow_dashed(d, LX[1], Y, LX[0], "Message : Modification enregistrée ✓", col=BLUE)
Y+=30; arrow_dashed(d, LX[1], Y, LX[0], "Rafraîchir la liste", col=BLUE)
Y+=60
arrow_dashed(d, LX[2], Y, LX[1], '{"detail": "Erreur de mise à jour"}', col=RED)
Y+=30; arrow_dashed(d, LX[1], Y, LX[0], "Message d'erreur : Modification échouée", col=RED)

postcond(d, W, "Postcondition : Données mises à jour en BDD", H-40)
img.save(OUT_DIR + "seq_modifier.png", "PNG", dpi=(150,150))
print("✅ seq_modifier.png corrigé")

# ═══════════════════════════════════════════════════════════════════════════════
# 3. seq_supprimer_corrige.png (CORRIGÉ : enseignant = toggle-block, étudiant = delete)
# ═══════════════════════════════════════════════════════════════════════════════
W, H = 900, 780
img, d = new_canvas(W, H)
title_bar(d, W, "Séquence : Supprimer / Désactiver un Utilisateur (Corrigé)")
precond(d, "Précondition : Admin authentifié, utilisateur sélectionné", 32)

for lx, ln in zip(LX, LNAMES):
    lifeline(d, lx, 55, H-30, ln)

activation(d, LX[1], 140, H-70)
activation(d, LX[2], 230, H-70)

Y = 165
arrow_solid(d, LX[0], Y, LX[1], "Sélectionner utilisateur → Cliquer 'Supprimer'")
Y+=40; arrow_dashed(d, LX[1], Y, LX[0], "Demande de confirmation", col=BLUE)
Y+=35; arrow_solid(d, LX[0], Y, LX[1], "Confirmer la suppression")

# ✅ CORRECTION : comportement différent selon le type
Y+=45
d.rectangle([LX[0]-130, Y-5, LX[2]+80, Y+58], fill=(255,245,215), outline=(180,140,0), width=1)
d.text((LX[0]-125, Y),    "✅ [CORRIGÉ] Comportement selon le type d'utilisateur :", fill=(100,70,0), font=Fs)
d.text((LX[0]-125, Y+14), "   ● Étudiant  → DELETE /api/students/{id}  (suppression réelle)", fill=(30,80,30), font=Fs)
d.text((LX[0]-125, Y+28), "   ● Enseignant → POST /api/teachers/{id}/toggle-block", fill=(150,60,0), font=Fs)
d.text((LX[0]-125, Y+42), "     (pas de suppression réelle — accès bloqué uniquement)", fill=(150,60,0), font=Fs)
Y+=65

arrow_solid(d, LX[1], Y, LX[2], "DELETE /api/students/{id} [ou] toggle-block [enseignant]")
Y+=40; arrow_dashed(d, LX[2], Y, LX[1], "Supprimer records liés (cascade) / Bloquer accès", col=BLUE)

alt_frame(d, 40, Y+20, W-30, Y+200, "[si succès]", "[si erreur (clé étrangère, id introuvable)]")
Y+=45
arrow_dashed(d, LX[2], Y, LX[1], '{"status": "success", "message": "Supprimé/Bloqué"}', col=BLUE)
Y+=35; arrow_dashed(d, LX[1], Y, LX[0], "Message : Utilisateur supprimé / bloqué ✓", col=BLUE)
Y+=30; arrow_dashed(d, LX[1], Y, LX[0], "Retirer de la liste", col=BLUE)
Y+=60
arrow_dashed(d, LX[2], Y, LX[1], '{"detail": "Erreur de suppression"}', col=RED)
Y+=30; arrow_dashed(d, LX[1], Y, LX[0], "Message d'erreur : Suppression impossible", col=RED)

postcond(d, W, "Postcondition : Étudiant supprimé (cascade) / Enseignant bloqué (is_blocked=True)", H-40)
img.save(OUT_DIR + "seq_supprimer.png", "PNG", dpi=(150,150))
print("✅ seq_supprimer.png corrigé")

# ═══════════════════════════════════════════════════════════════════════════════
# 4. diagramme_classe_corrige.png  (CORRIGÉ : Enrollment + VERIFIED_SESSIONS)
# ═══════════════════════════════════════════════════════════════════════════════
shutil.copy(
    "/home/usain/Bureau/FaceAttend/docs/diagrams/conception/diagramme_classe.png",
    OUT_DIR + "diagramme_classe_base.png"
)
img = Image.open(OUT_DIR + "diagramme_classe_base.png").convert("RGB")
W, H = img.size
# On agrandit le canvas pour ajouter les entités manquantes en bas
NEW_H = H + 200
new_img = Image.new("RGB", (W, NEW_H), BG)
new_img.paste(img, (0,0))
d = ImageDraw.Draw(new_img)

# Grille sur la zone ajoutée
for x in range(0, W, 20): d.line([(x,H),(x,NEW_H)], fill=GRID)
for y in range(H, NEW_H, 20): d.line([(0,y),(W,y)], fill=GRID)
d.line([(2,H),(W-3,H)], fill=(200,200,200), width=1)

# Titre de la zone ajoutée
d.text((20, H+8), "✅ Entités CORRIGÉES / MANQUANTES détectées lors de l'audit :", fill=(30,100,30), font=Fb)

# Boîte Enrollment
EX, EY = 80, H+35
d.rectangle([EX, EY, EX+260, EY+100], fill=(245,235,255), outline=(100,70,160), width=2)
d.rectangle([EX, EY, EX+260, EY+22], fill=(180,150,220), outline=(100,70,160), width=2)
d.text((EX+6, EY+5), "Enrollment (Inscription)", fill="white", font=Fb)
for i, txt in enumerate(["- id: UUID {PK}","- student_id: UUID {FK}","- course_id: UUID {FK}","- enrolled_at: DateTime"]):
    d.text((EX+6, EY+26+i*16), txt, fill=(40,20,80), font=Fs)
# Relation
d.line([(EX+130, EY),(EX+130, EY-15)], fill=(100,70,160), width=1)
d.text((EX+135, EY-12), "→ lie Course ↔ Student", fill=(100,70,160), font=Fxs)

# Boîte VERIFIED_SESSIONS
VX, VY = 420, H+35
d.rectangle([VX, VY, VX+300, VY+100], fill=(255,245,230), outline=(180,120,30), width=2)
d.rectangle([VX, VY, VX+300, VY+22], fill=(220,160,60), outline=(180,120,30), width=2)
d.text((VX+6, VY+5), "VERIFIED_SESSIONS (RAM)", fill="white", font=Fb)
for i, txt in enumerate(["- Dictionnaire Python en mémoire","{session_id: teacher_id}","Remis à zéro au redémarrage","Contrôle : enseignant doit scanner"]):
    d.text((VX+6, VY+26+i*16), txt, fill=(80,50,10), font=Fxs)
d.text((VX+6, VY+86), "⚠️  Non persisté en BDD — volatil", fill=RED, font=Fxs)

# Note audit
d.rectangle([740, H+35, W-10, H+175], fill=(240,255,240), outline=(80,160,80), width=1)
d.text((748, H+40), "✅ Audit de conformité :", fill=(30,100,30), font=Fb)
checks = [
    "Teacher ✓ (conforme)",
    "Student ✓ (conforme)",
    "Course ✓ (conforme)",
    "AttendanceSession ✓",
    "AttendanceRecord ✓",
    "AbsenceAlert ✓",
    "FacialRecognition ✓",
    "Enrollment ➕ AJOUTÉ",
    "VERIFIED_SESSIONS ➕ AJOUTÉ",
    "DELETE teacher ⚠️ inexistant",
    "  → seulement toggle-block",
]
for i, c in enumerate(checks):
    col = (30,100,30) if "✓" in c else ((200,80,0) if "⚠️" in c else (0,100,180))
    d.text((748, H+58+i*11), c, fill=col, font=Fxs)

# Bordure finale
d.rectangle([2,2,W-3,NEW_H-3], outline=BDR, width=2)

new_img.save(OUT_DIR + "diagramme_classe.png", "PNG", dpi=(150,150))
os.remove(OUT_DIR + "diagramme_classe_base.png")
print("✅ diagramme_classe.png corrigé")
print(f"\n📁 Tous les fichiers dans : {OUT_DIR}")
print("   Les ORIGINAUX dans docs/diagrams/sequences_detaillees/ et /conception/ sont INTACTS.")
