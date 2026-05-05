from PIL import Image, ImageDraw, ImageFont
import math

# === Configuration identique à l'original ===
W, H = 1380, 980
BG = (255, 255, 255)
GRID = (240, 240, 240)
BORDER = (50, 50, 50)
TITLE_BG = (230, 230, 245)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Grille de fond
for x in range(0, W, 20):
    draw.line([(x, 0), (x, H)], fill=GRID, width=1)
for y in range(0, H, 20):
    draw.line([(0, y), (W, y)], fill=GRID, width=1)

draw.rectangle([2, 2, W-3, H-3], outline=BORDER, width=2)
draw.rectangle([2, 2, W-3, 50], fill=TITLE_BG, outline=BORDER, width=2)

try:
    font_title  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 19)
    font_label  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    font_bold   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
    font_small  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
    font_italic = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 10)
    font_note   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 9)
except:
    font_title = font_label = font_bold = font_small = font_italic = font_note = ImageFont.load_default()

# ── TITRE (changement uniquement ici) ──
title = "Caméra IA — Reconnaissance Faciale & Émargement"
bb = draw.textbbox((0, 0), title, font=font_title)
draw.text(((W - (bb[2]-bb[0])) // 2, 14), title, fill=(30, 30, 100), font=font_title)

# ── LÉGENDE ──
legend_x, legend_y = 980, 65
draw.rectangle([legend_x, legend_y, legend_x+340, legend_y+95], fill=(250,250,250), outline=(180,180,180), width=1)
draw.text((legend_x+10, legend_y+6), "Légende :", fill=(30,30,30), font=font_bold)

colors_legend = [
    ("Étape 1 : Enseignant (Obligatoire)", (180, 140, 220)),
    ("Anti-Spoofing", (220, 100, 100)),
    ("Algo IA / FaceNet", (100, 160, 220)),
    ("Mode Rapide", (220, 200, 80)),
    ("Gestion BDD", (100, 200, 120)),
]
for i, (lbl, col) in enumerate(colors_legend):
    y = legend_y + 22 + i * 14
    draw.ellipse([legend_x+10, y, legend_x+22, y+10], fill=col, outline=(80,80,80), width=1)
    draw.text((legend_x+28, y-1), lbl, fill=(40,40,40), font=font_small)

# ── ACTEUR ──
AX, AY = 100, 500
draw.ellipse([AX-15, AY-75, AX+15, AY-45], outline=(120,80,20), fill=(220,180,100), width=2)
draw.line([(AX, AY-45), (AX, AY-10)], fill=(80,60,20), width=3)
draw.line([(AX-22, AY-35), (AX+22, AY-35)], fill=(80,60,20), width=3)
draw.line([(AX, AY-10), (AX-18, AY+18)], fill=(80,60,20), width=3)
draw.line([(AX, AY-10), (AX+18, AY+18)], fill=(80,60,20), width=3)
draw.text((AX-32, AY+22), "Caméra IA", fill=(30,30,30), font=font_bold)
draw.text((AX-28, AY+36), "(Terminal)", fill=(80,80,80), font=font_small)

# ── HELPER : ellipse + texte multi-lignes ──
def uc(cx, cy, lines, fill, border, text_color=(30,30,30), rx=85, ry=26):
    draw.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill, outline=border, width=2)
    th = len(lines) * 14
    sy = cy - th//2 + 2
    for i, l in enumerate(lines):
        bb = draw.textbbox((0,0), l, font=font_label)
        draw.text((cx-(bb[2]-bb[0])//2, sy+i*14), l, fill=text_color, font=font_label)

# ── HELPER : flèche pointillée ──
def arrow(x1, y1, x2, y2, lbl="", col=(80,80,200), size=7):
    dx, dy = x2-x1, y2-y1
    L = math.hypot(dx, dy)
    if L == 0: return
    ux, uy = dx/L, dy/L
    pos, drawing = 0, True
    while pos < L:
        end = min(pos + (8 if drawing else 5), L)
        if drawing:
            draw.line([(x1+ux*pos, y1+uy*pos),(x1+ux*end, y1+uy*end)], fill=col, width=2)
        pos, drawing = end, not drawing
    # Tête
    draw.polygon([(x2,y2),(x2-size*ux+size*.4*uy,y2-size*uy-size*.4*ux),(x2-size*ux-size*.4*uy,y2-size*uy+size*.4*ux)], fill=col)
    if lbl:
        mx, my = (x1+x2)//2, (y1+y2)//2
        bb = draw.textbbox((0,0), lbl, font=font_italic)
        draw.text((mx-(bb[2]-bb[0])//2, my-13), lbl, fill=col, font=font_italic)

# ── HELPER : ligne solide ──
def line(x1,y1,x2,y2): draw.line([(x1,y1),(x2,y2)], fill=(60,60,60), width=2)

# ── HELPER : note collante ──
def note(x, y, lines, fill=(255,255,200), border=(180,150,0)):
    max_w = max(draw.textbbox((0,0),l,font=font_note)[2] for l in lines) + 14
    h = len(lines)*13 + 8
    draw.rectangle([x, y, x+max_w, y+h], fill=fill, outline=border, width=1)
    for i, l in enumerate(lines):
        draw.text((x+7, y+5+i*13), l, fill=(60,50,0), font=font_note)

# ── HELPER : badge numéroté ──
def badge(cx, cy, num, col):
    draw.ellipse([cx-11,cy-11,cx+11,cy+11], fill=col, outline=(80,80,80), width=1)
    bb = draw.textbbox((0,0),str(num),font=font_bold)
    draw.text((cx-(bb[2]-bb[0])//2, cy-(bb[3]-bb[1])//2-1), str(num), fill="white", font=font_bold)

# ════════════════════════════════════════
# CAS D'UTILISATION PRINCIPAUX (centre)
# ════════════════════════════════════════
COL_MAIN = 310

uc_mains = [
    (COL_MAIN, 130, ["Vérification","de Session"],           (200,190,230),(120,90,180)),   # 0
    (COL_MAIN, 280, ["ÉTAPE 1 — Scan","Enseignant (oblig.)"],(210,185,235),(140,100,200)),  # 1  violet
    (COL_MAIN, 450, ["Mode Sécurisé","(Anti-Spoofing actif)"],(235,180,180),(180,80,80)),   # 2  rouge
    (COL_MAIN, 610, ["Mode Rapide","(Sans Anti-Spoofing)"],  (235,230,160),(180,160,40)),   # 3  jaune
    (COL_MAIN, 760, ["ÉTAPE 2 — Scan","Étudiants (débloqué)]",(170,215,235),(60,140,200)), # 4  bleu
    (COL_MAIN, 900, ["Enregistrement","& Alertes"],          (160,220,180),(60,160,100)),   # 5  vert
]
# Correction typo dans tuple
uc_mains[4] = (COL_MAIN, 760, ["ÉTAPE 2 — Scan","Étudiants (débloqué)"], (170,215,235),(60,140,200))

for i,(cx,cy,lines,fill,border) in enumerate(uc_mains):
    uc(cx, cy, lines, fill, border)
    line(AX+20, AY-60+i*30, cx-85, cy)   # ligne acteur→UC (approximatif)

# Badges numérotés
badge(COL_MAIN-75, 130, "①", (120,90,180))
badge(COL_MAIN-75, 280, "②", (140,100,200))
badge(COL_MAIN-75, 450, "③a"[0], (180,80,80))   # 3a
badge(COL_MAIN-75, 610, "③"[0], (180,160,40))   # 3b  
badge(COL_MAIN-75, 760, "④"[0], (60,140,200))
badge(COL_MAIN-75, 900, "⑤"[0], (60,160,100))

# Rebrancher acteur correctement (lignes droites)
for _,(cx,cy,*_rest) in enumerate(uc_mains):
    line(AX+20, AY-60, cx-85, cy)

# ════════════════════════════════════════
# CAS D'UTILISATION SECONDAIRES (droite)
# ════════════════════════════════════════
COL_SEC = 700
FILL_SEC_BASE = (255,255,255)

sec = [
    # (cy, text, fill_col, border_col, <<label>>, from_main_idx, arrow_color)
    ( 95,  ["Vérifier session active"],       (230,230,240),(120,90,180),  "<<include>>", 0, (120,90,180)),
    ( 175, ["Vérifier enseignant assigné"],   (230,230,240),(120,90,180),  "<<include>>", 0, (120,90,180)),
    ( 260, ["Capturer visage enseignant"],    (220,200,235),(140,100,200), "<<include>>", 1, (140,100,200)),
    ( 330, ["Vérifier vivacité (Liveness)"],  (220,200,235),(140,100,200), "<<include>>", 1, (140,100,200)),
    ( 400, ["Extraire embedding FaceNet"],    (220,200,235),(140,100,200), "<<include>>", 1, (140,100,200)),
    ( 470, ["Matcher avec BDD enseignant"],   (220,200,235),(140,100,200), "<<include>>", 1, (140,100,200)),
    ( 540, ["Déverrouiller session active"],  (220,200,235),(140,100,200), "<<include>>", 1, (140,100,200)),
    ( 615, ["Laplacian — Netteté (35pts)"],   (245,210,210),(180,80,80),   "<<include>>", 2, (180,80,80)),
    ( 680, ["FFT — Détection écran (25pts)"], (245,210,210),(180,80,80),   "<<include>>", 2, (180,80,80)),
    ( 745, ["LBP — Texture (20pts)"],         (245,210,210),(180,80,80),   "<<include>>", 2, (180,80,80)),
    ( 810, ["Skin Check (20pts)"],            (245,210,210),(180,80,80),   "<<include>>", 2, (180,80,80)),
    ( 875, ["Bypasser l'Anti-Spoofing"],      (250,245,200),(180,160,40),  "<<extend>>",  3, (180,160,40)),
    ( 940, ["Capturer visage étudiant"],      (200,225,245),(60,140,200),  "<<include>>", 4, (60,140,200)),
    
    # Colonne encore plus à droite pour débordement
]

# Colonnes supplémentaires à droite pour ne pas surcharger
COL_SEC2 = 950
sec2 = [
    ( 760, ["Anti-Spoofing (si activé)"],    (200,225,245),(60,140,200),  "<<include>>", 4, (60,140,200)),
    ( 830, ["Extraction FaceNet (512D)"],     (200,225,245),(60,140,200),  "<<include>>", 4, (60,140,200)),
    ( 900, ["Matching (Cosine Dist.)"],       (200,225,245),(60,140,200),  "<<include>>", 4, (60,140,200)),
    ( 870, ["Upsert présence (BDD)"],         (185,230,200),(60,160,100),  "<<include>>", 5, (60,160,100)),
    ( 940, ["Calcul alertes absences auto"],  (185,230,200),(60,160,100),  "<<include>>", 5, (60,160,100)),
]

for (cy, lines, fill, border, lbl, from_idx, acol) in sec:
    uc(COL_SEC, cy, lines, fill, border, rx=100, ry=22)
    mx, my, *_ = uc_mains[from_idx]
    arrow(mx+85, my, COL_SEC-100, cy, lbl=lbl, col=acol)

for (cy, lines, fill, border, lbl, from_idx, acol) in sec2:
    uc(COL_SEC2, cy, lines, fill, border, rx=105, ry=22)
    arrow(COL_SEC+100, cy, COL_SEC2-105, cy, lbl="", col=acol)

# Notes collantes
note(COL_MAIN+95, 258, ["△ Session verrouillée","jusqu'à ce scan réussi"])
note(COL_MAIN+95, 430, ["[liveness_enabled=True","si score<65 → REJET]"], fill=(255,220,220), border=(180,80,80))
note(COL_MAIN+95, 590, ["[choix opérateur","au terminal]"], fill=(255,255,200), border=(180,160,40))
note(COL_MAIN+95, 738, ["△ Bloqué si enseignant","non vérifié (VERIFIED_SESSIONS)"])

# Sauvegarde
out = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_camera_ia.png"
img.save(out, "PNG", dpi=(150,150))
print(f"✅ Diagramme régénéré : {out}  ({W}x{H} px)")
