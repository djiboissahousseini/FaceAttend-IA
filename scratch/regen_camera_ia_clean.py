from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1500, 1000
BG = (255, 255, 255)
GRID = (242, 242, 242)
BORDER = (50, 50, 50)
TITLE_BG = (224, 224, 240)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Grille
for x in range(0, W, 20): draw.line([(x,0),(x,H)], fill=GRID)
for y in range(0, H, 20): draw.line([(0,y),(W,y)], fill=GRID)

draw.rectangle([2, 2, W-3, H-3], outline=BORDER, width=2)
draw.rectangle([2, 2, W-3, 54], fill=TITLE_BG, outline=BORDER, width=2)

try:
    F_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 19)
    F_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    F_bold  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
    F_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
    F_ital  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 10)
    F_note  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 9)
except:
    F_title = F_label = F_bold = F_small = F_ital = F_note = ImageFont.load_default()

# Titre
T = "Caméra IA — Reconnaissance Faciale & Émargement"
bb = draw.textbbox((0,0), T, font=F_title)
draw.text(((W-(bb[2]-bb[0]))//2, 16), T, fill=(20,20,100), font=F_title)

# Légende
LEG = [
    ("● Étape Enseignant",(170,120,210)),
    ("● Anti-Spoofing",(210,80,80)),
    ("● IA / FaceNet",(80,140,210)),
    ("● Mode Rapide",(190,170,30)),
    ("● Gestion BDD",(60,170,90)),
]
lx = 18
for txt, col in LEG:
    bb = draw.textbbox((0,0), txt, font=F_small)
    draw.text((lx, 36), txt, fill=col, font=F_small)
    lx += bb[2]-bb[0] + 22

# ─── Helpers ───────────────────────────────────────────
def ellipse(cx, cy, lines, fill, border, rx=88, ry=28, tf=None):
    draw.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill, outline=border, width=2)
    f = tf or F_label
    th = len(lines) * 15
    sy = cy - th//2 + 2
    for i, l in enumerate(lines):
        bb = draw.textbbox((0,0), l, font=f)
        draw.text((cx-(bb[2]-bb[0])//2, sy+i*15), l, fill=(20,20,20), font=f)

def dashed(x1,y1,x2,y2, col, lbl="", lbl_side="top"):
    dx,dy = x2-x1,y2-y1
    L = math.hypot(dx,dy)
    if L==0: return
    ux,uy = dx/L,dy/L
    pos,on = 0, True
    while pos<L:
        end = min(pos+(8 if on else 5),L)
        if on: draw.line([(x1+ux*pos,y1+uy*pos),(x1+ux*end,y1+uy*end)], fill=col, width=2)
        pos,on = end, not on
    s = 8
    draw.polygon([(x2,y2),(x2-s*ux+s*.4*uy,y2-s*uy-s*.4*ux),(x2-s*ux-s*.4*uy,y2-s*uy+s*.4*ux)], fill=col)
    if lbl:
        mx,my = (x1+x2)//2,(y1+y2)//2
        bb = draw.textbbox((0,0),lbl,font=F_ital)
        offset = -13 if lbl_side=="top" else 4
        draw.text((mx-(bb[2]-bb[0])//2, my+offset), lbl, fill=col, font=F_ital)

def solid(x1,y1,x2,y2):
    draw.line([(x1,y1),(x2,y2)], fill=(60,60,60), width=2)

def badge(cx,cy,txt,col):
    draw.ellipse([cx-13,cy-13,cx+13,cy+13], fill=col, outline=(80,80,80), width=1)
    bb = draw.textbbox((0,0),txt,font=F_bold)
    draw.text((cx-(bb[2]-bb[0])//2,cy-(bb[3]-bb[1])//2-1), txt, fill="white", font=F_bold)

def note(x,y,lines,fill=(255,255,200),border=(160,140,0)):
    mw = max(draw.textbbox((0,0),l,font=F_note)[2] for l in lines)+14
    h = len(lines)*13+8
    draw.rectangle([x,y,x+mw,y+h], fill=fill, outline=border, width=1)
    for i,l in enumerate(lines): draw.text((x+7,y+5+i*13), l, fill=(50,40,0), font=F_note)

# ─── Acteur ────────────────────────────────────────────
AX, AY = 90, 520
draw.ellipse([AX-14,AY-80,AX+14,AY-52], outline=(110,75,15), fill=(210,170,90), width=2)
draw.line([(AX,AY-52),(AX,AY-18)], fill=(70,55,15), width=3)
draw.line([(AX-22,AY-40),(AX+22,AY-40)], fill=(70,55,15), width=3)
draw.line([(AX,AY-18),(AX-18,AY+10)], fill=(70,55,15), width=3)
draw.line([(AX,AY-18),(AX+18,AY+10)], fill=(70,55,15), width=3)
bb = draw.textbbox((0,0),"Caméra IA",font=F_bold)
draw.text((AX-(bb[2]-bb[0])//2, AY+14), "Caméra IA", fill=(30,30,30), font=F_bold)
bb = draw.textbbox((0,0),"(Terminal)",font=F_small)
draw.text((AX-(bb[2]-bb[0])//2, AY+29), "(Terminal)", fill=(80,80,80), font=F_small)

# ─── Positionnement ────────────────────────────────────
# Colonne principale (UCs centraux)
MC = 310   # x centre colonne principale
# Colonne UCs secondaires gauche
SC = 700   # x centre colonne secondaire
# Colonne UCs secondaires droite (débordement)
SC2 = 1050 # x centre colonne secondaire 2

# Positions Y des UCs principaux (6 groupes bien espacés)
YS = [95, 225, 370, 510, 650, 830]

# Couleurs par groupe
COLS = [
    ((200,185,230),(130,90,185)),  # 0 Vérif session — violet clair
    ((210,185,235),(140,100,205)), # 1 Scan Enseignant — violet
    ((240,185,185),(185,75,75)),   # 2 Anti-Spoofing — rouge
    ((250,245,185),(185,165,35)),  # 3 Mode Rapide — jaune
    ((185,220,240),(55,135,200)),  # 4 Scan Étudiants — bleu
    ((180,230,195),(55,155,95)),   # 5 Enreg. Alertes — vert
]

LABELS = [
    ["Vérification", "de Session"],
    ["ÉTAPE 1 — Scan", "Enseignant (oblig.)"],
    ["Mode Sécurisé", "(Anti-Spoofing)"],
    ["Mode Rapide", "(Sans Anti-Spoof.)"],
    ["ÉTAPE 2 — Scan", "Étudiants (débloqué)"],
    ["Enregistrement", "& Alertes"],
]

BADGE_COLS = [
    (130,90,185),(140,100,205),(185,75,75),(185,165,35),(55,135,200),(55,155,95)
]
BADGES = ["①","②","③a","③b","④","⑤"]

# Dessin UCs principaux + lignes acteur
for i, (y, (f,b), lbl, bc, bv) in enumerate(zip(YS, COLS, LABELS, BADGE_COLS, BADGES)):
    ellipse(MC, y, lbl, f, b)
    badge(MC-78, y, bv, bc)
    # Ligne acteur → UC
    solid(AX+16, AY-70+i*18, MC-88, y)

# ─── UCs Secondaires ───────────────────────────────────
# Groupe 0 — Vérif Session
SEC0 = [(SC, 65, ["Vérifier session active"],       (225,220,240),(120,85,175),"<<include>>"),
        (SC, 125,["Vérifier enseignant assigné"],    (225,220,240),(120,85,175),"<<include>>")]
# Groupe 1 — Scan Enseignant
SEC1 = [(SC, 210,["Capturer visage enseignant"],     (215,200,235),(138,100,200),"<<include>>"),
        (SC, 270,["Vérifier vivacité (Liveness)"],   (215,200,235),(138,100,200),"<<include>>"),
        (SC, 330,["Extraire embedding FaceNet"],      (215,200,235),(138,100,200),"<<include>>"),
        (SC, 390,["Matcher avec BDD enseignant"],     (215,200,235),(138,100,200),"<<include>>"),
        (SC, 450,["Déverrouiller session"],           (215,200,235),(138,100,200),"<<include>>")]
# Groupe 2 — Anti-Spoofing
SEC2 = [(SC, 520,["Laplacian — Netteté (35pts)"],    (248,210,210),(180,75,75),"<<include>>"),
        (SC, 575,["FFT — Détect. écran (25pts)"],    (248,210,210),(180,75,75),"<<include>>"),
        (SC, 630,["LBP — Texture (20pts)"],           (248,210,210),(180,75,75),"<<include>>"),
        (SC, 685,["Skin Check — Colorimétrie (20pts)",(248,210,210),(180,75,75),"<<include>>"])]
# Groupe 3 — Mode Rapide
SEC3 = [(SC, 755,["Bypasser l'Anti-Spoofing"],       (250,248,195),(180,160,35),"<<extend>>"),
        (SC, 810,["liveness_enabled = False"],         (250,248,195),(180,160,35),"<<extend>>")]
# Groupe 4 — Scan Étudiants
SEC4 = [(SC2, 620,["Capturer visage étudiant"],      (195,220,245),(50,130,200),"<<include>>"),
        (SC2, 680,["Anti-Spoofing (si activé)"],      (195,220,245),(50,130,200),"<<include>>"),
        (SC2, 740,["Extraction FaceNet (512D)"],       (195,220,245),(50,130,200),"<<include>>"),
        (SC2, 800,["Matching vectoriel (Cosine)"],     (195,220,245),(50,130,200),"<<include>>"),
        (SC2, 860,["Vérifier groupe / cours"],         (195,220,245),(50,130,200),"<<include>>")]
# Groupe 5 — Enregistrement
SEC5 = [(SC2, 920,["Upsert présence (BDD)"],         (185,230,200),(50,150,90),"<<include>>"),
        (SC2, 970,["Calcul alertes absences auto"],   (185,230,200),(50,150,90),"<<include>>")]

# Fix SEC2 — le dernier était mal formé (tuple imbriqué)
SEC2 = [(SC, 520,["Laplacian — Netteté (35pts)"],    (248,210,210),(180,75,75),"<<include>>"),
        (SC, 575,["FFT — Détect. écran (25pts)"],    (248,210,210),(180,75,75),"<<include>>"),
        (SC, 630,["LBP — Texture (20pts)"],           (248,210,210),(180,75,75),"<<include>>"),
        (SC, 685,["Skin Check (20pts)"],              (248,210,210),(180,75,75),"<<include>>")]

GROUPS = [(SEC0,0),(SEC1,1),(SEC2,2),(SEC3,3),(SEC4,4),(SEC5,5)]

# Couleurs des flèches par groupe
ACOLS = [(130,90,185),(138,100,200),(180,75,75),(180,160,35),(50,130,200),(50,150,90)]

for sec_list, g_idx in GROUPS:
    main_x, main_y = MC, YS[g_idx]
    acol = ACOLS[g_idx]
    for (sx, sy, slbl, sf, sb, arrow_lbl) in sec_list:
        ellipse(sx, sy, slbl, sf, sb, rx=105, ry=24)
        dashed(main_x+88, main_y, sx-105, sy, acol, lbl=arrow_lbl)

# Notes collantes (déplacées à gauche des flèches pour ne pas chevaucher)
note(155, 200, ["△ Session verrouillée","jusqu'à ce scan réussi"])
note(155, 350, ["[liveness_enabled=True","si score<65 → REJET]"], fill=(255,220,220), border=(185,75,75))
note(155, 490, ["[choix opérateur au terminal]"], fill=(255,255,200), border=(180,160,35))
note(155, 625, ["△ Bloqué si ens. non","vérifié (VERIFIED_SESSIONS)"])

OUT = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_camera_ia.png"
img.save(OUT, "PNG", dpi=(150,150))
print(f"✅ Diagramme propre sauvegardé : {OUT} ({W}x{H} px)")
