from PIL import Image, ImageDraw, ImageFont
import math

# === Configuration ===
W, H = 1380, 880
BG = (255, 255, 255)
GRID = (240, 240, 240)
BORDER = (50, 50, 50)
TITLE_BG = (230, 230, 245)

# Couleurs des ellipses
UC_FILL = (198, 230, 200)
UC_BORDER = (80, 150, 80)
UC_TEXT = (30, 80, 30)

ACTOR_COLOR = (200, 160, 80)

ARROW_INCLUDE = (80, 80, 200)
ARROW_EXTEND = (180, 80, 80)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Grille de fond
for x in range(0, W, 20):
    draw.line([(x, 0), (x, H)], fill=GRID, width=1)
for y in range(0, H, 20):
    draw.line([(0, y), (W, y)], fill=GRID, width=1)

# Bordure du diagramme
draw.rectangle([2, 2, W-3, H-3], outline=BORDER, width=2)

# Bande titre
draw.rectangle([2, 2, W-3, 55], fill=TITLE_BG, outline=BORDER, width=2)

try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
    font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
    font_arrow = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 10)
except:
    font_title = font_label = font_bold = font_small = font_arrow = ImageFont.load_default()

# Titre
title = "Caméra IA — Reconnaissance Faciale & Émargement"
bbox = draw.textbbox((0, 0), title, font=font_title)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 16), title, fill=(30, 30, 100), font=font_title)

# === Acteur ===
def draw_actor(x, y, label):
    # Tête
    draw.ellipse([x-14, y-14, x+14, y+14], outline=(120, 80, 20), fill=(220, 180, 100), width=2)
    # Corps
    draw.line([(x, y+14), (x, y+50)], fill=(80, 60, 20), width=3)
    # Bras
    draw.line([(x-22, y+28), (x+22, y+28)], fill=(80, 60, 20), width=3)
    # Jambes
    draw.line([(x, y+50), (x-18, y+75)], fill=(80, 60, 20), width=3)
    draw.line([(x, y+50), (x+18, y+75)], fill=(80, 60, 20), width=3)
    # Label
    bbox = draw.textbbox((0,0), label, font=font_bold)
    lw = bbox[2]-bbox[0]
    draw.text((x - lw//2, y+78), label, fill=(30, 30, 30), font=font_bold)

# === Ellipse cas d'utilisation ===
def draw_usecase(cx, cy, text_lines, fill=UC_FILL, border=UC_BORDER, text_color=UC_TEXT, rx=90, ry=30):
    draw.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=fill, outline=border, width=2)
    total_h = len(text_lines) * 15
    start_y = cy - total_h // 2
    for i, line in enumerate(text_lines):
        bbox = draw.textbbox((0, 0), line, font=font_label)
        lw = bbox[2] - bbox[0]
        draw.text((cx - lw // 2, start_y + i * 16), line, fill=text_color, font=font_label)

# === Flèche droite avec label ===
def draw_arrow(x1, y1, x2, y2, label="", color=(80, 80, 200), dashed=True, side="top"):
    if dashed:
        # Calculer les points intermédiaires pour trait pointillé
        dx, dy = x2 - x1, y2 - y1
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0: return
        ux, uy = dx/length, dy/length
        dash_len, gap_len = 8, 5
        pos = 0
        drawing = True
        while pos < length:
            seg_end = min(pos + (dash_len if drawing else gap_len), length)
            if drawing:
                draw.line([(x1 + ux*pos, y1 + uy*pos), (x1 + ux*seg_end, y1 + uy*seg_end)], fill=color, width=2)
            pos = seg_end
            drawing = not drawing
    else:
        draw.line([(x1, y1), (x2, y2)], fill=color, width=2)

    # Flèche
    dx, dy = x2 - x1, y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    if length > 0:
        ux, uy = dx/length, dy/length
        arrow_size = 8
        draw.polygon([
            (x2, y2),
            (x2 - arrow_size*ux + arrow_size*0.4*uy, y2 - arrow_size*uy - arrow_size*0.4*ux),
            (x2 - arrow_size*ux - arrow_size*0.4*uy, y2 - arrow_size*uy + arrow_size*0.4*ux),
        ], fill=color)

    # Label
    if label:
        mx, my = (x1+x2)//2, (y1+y2)//2
        offset = -14 if side == "top" else 6
        bbox = draw.textbbox((0,0), label, font=font_arrow)
        lw = bbox[2]-bbox[0]
        draw.text((mx - lw//2, my + offset), label, fill=color, font=font_arrow)

# === Ligne simple acteur → cas principal ===
def draw_line_solid(x1, y1, x2, y2):
    draw.line([(x1,y1),(x2,y2)], fill=(60,60,60), width=2)

# ============================
# POSITIONNEMENT DES ÉLÉMENTS
# ============================

# Acteur principal
AX, AY = 120, 420
draw_actor(AX, AY, "Caméra IA\n(Terminal)")
# Ligne label sur 2 lignes
draw.text((AX - 35, AY + 78), "Caméra IA", fill=(30,30,30), font=font_bold)
draw.text((AX - 33, AY + 94), "(Terminal)", fill=(80,80,80), font=font_small)

# UC principales (colonne gauche-centre)
uc_main = [
    (370, 150, ["Vérification", "de Session"]),
    (370, 310, ["Scan", "Enseignant"]),
    (370, 470, ["Anti-Spoofing", "(Mode Sécurisé)"]),
    (370, 620, ["Scan", "Étudiants"]),
    (370, 770, ["Enregistrement", "Présence"]),
]

for cx, cy, lines in uc_main:
    draw_usecase(cx, cy, lines)
    # Ligne acteur -> UC
    draw_line_solid(AX + 15, AY + 20, cx - 90, cy)

# UC secondaires (colonne droite)
uc_sec = [
    (720, 100,  ["Vérifier session active"],        "<<include>>", ARROW_INCLUDE),
    (720, 185,  ["Vérifier enseignant assigné"],     "<<include>>", ARROW_INCLUDE),
    (720, 280,  ["Capturer visage enseignant"],      "<<include>>", ARROW_INCLUDE),
    (720, 355,  ["Vérifier vivacité (Liveness)"],   "<<include>>", ARROW_INCLUDE),
    (720, 430,  ["Identifier (FaceNet)"],            "<<include>>", ARROW_INCLUDE),
    (720, 505,  ["Laplacian / FFT / LBP"],           "<<include>>", ARROW_INCLUDE),
    (720, 580,  ["Rejeter si score < seuil"],        "<<extend>>",  ARROW_EXTEND),
    (720, 650,  ["Capturer visage étudiant"],        "<<include>>", ARROW_INCLUDE),
    (720, 720,  ["Matching vectoriel (FaceNet)"],   "<<include>>", ARROW_INCLUDE),
    (720, 790,  ["Upsert présence (BDD)"],           "<<include>>", ARROW_INCLUDE),
    (720, 855,  ["Calcul alertes absences"],         "<<include>>", ARROW_INCLUDE),
]

# Mapping UC principales vers secondaires
links = [
    (0, [0, 1]),     # Vérification session -> 2 UCs
    (1, [2, 3, 4]),  # Scan Enseignant -> 3 UCs
    (2, [5, 6]),     # Anti-Spoofing -> 2 UCs
    (3, [7, 8]),     # Scan Étudiants -> 2 UCs
    (4, [9, 10]),    # Enregistrement -> 2 UCs
]

for sec_idx, (cx, cy, lines, lbl, col) in enumerate(uc_sec):
    draw_usecase(cx, cy, lines, rx=100, ry=25)

for main_idx, sec_indices in links:
    mx, my, _ = uc_main[main_idx]
    for si in sec_indices:
        sx, sy, _, lbl, col = uc_sec[si]
        draw_arrow(mx + 90, my, sx - 100, sy, label=lbl, color=col, dashed=True)

# Légende
legend_x, legend_y = 900, 110
draw.rectangle([legend_x, legend_y, legend_x+330, legend_y+80], fill=(250,250,250), outline=(150,150,150), width=1)
draw.text((legend_x+10, legend_y+8), "Légende :", fill=(30,30,30), font=font_bold)
# Include
draw_arrow(legend_x+10, legend_y+35, legend_x+70, legend_y+35, color=ARROW_INCLUDE, dashed=True)
draw.text((legend_x+80, legend_y+28), "<<include>>", fill=ARROW_INCLUDE, font=font_small)
# Extend
draw_arrow(legend_x+10, legend_y+58, legend_x+70, legend_y+58, color=ARROW_EXTEND, dashed=True)
draw.text((legend_x+80, legend_y+51), "<<extend>>", fill=ARROW_EXTEND, font=font_small)

# Sauvegarde
output_path = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_camera_ia.png"
img.save(output_path, "PNG", dpi=(150, 150))
print(f"Diagramme régénéré : {output_path}")
print(f"Taille : {W}x{H} px")
