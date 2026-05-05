from PIL import Image, ImageDraw, ImageFont

SRC = "/home/usain/.gemini/antigravity/brain/08b975b5-ef16-4026-9c73-9faa201faddb/media__1777849174287.png"
DIR = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/"

img = Image.open(SRC).convert("RGB")
W, H = img.size
print(f"Image originale : {W}x{H} px")

try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
    font_leg   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
except:
    font_title = font_leg = ImageFont.load_default()

TITLE_BG = (230, 230, 245)
BORDER = (50, 50, 50)

legend_items = [
    ("● Étape Enseignant", (180, 140, 220)),
    ("● Anti-Spoofing",    (220, 100, 100)),
    ("● Algo IA / FaceNet",(100, 160, 220)),
    ("● Mode Rapide",      (200, 180, 40)),
    ("● Gestion BDD",      (80,  180, 100)),
]

def add_header(part_img, title_text, show_legend=True):
    d = ImageDraw.Draw(part_img)
    pw, ph = part_img.size
    # Bande titre
    d.rectangle([2, 2, pw-3, 55], fill=TITLE_BG)
    d.line([(2, 55), (pw-3, 55)], fill=BORDER, width=1)
    d.rectangle([2, 2, pw-3, ph-3], outline=BORDER, width=2)
    # Titre
    bb = d.textbbox((0,0), title_text, font=font_title)
    d.text(((pw-(bb[2]-bb[0]))//2, 10), title_text, fill=(30,30,100), font=font_title)
    # Légende
    if show_legend:
        x = 18
        for text, color in legend_items:
            bb = d.textbbox((0,0), text, font=font_leg)
            d.text((x, 38), text, fill=color, font=font_leg)
            x += (bb[2]-bb[0]) + 18
    return part_img

# ── SPLIT : couper à peu près au milieu (entre Scan Enseignant et Mode Sécurisé)
# L'acteur occupe toute la hauteur à gauche (~130px de large)
# On garde une zone de 60px d'overlap pour que l'acteur reste visible dans la partie 2
ACTOR_W = 150     # largeur de la zone acteur à dupliquer
SPLIT_Y = 330     # ligne de coupure dans l'image originale (sans header = ~55px)

# Créer des images avec espace pour un header de 58px
HEADER_H = 58

# ── PARTIE 1 : lignes 55 → (55 + SPLIT_Y) de l'original
body1 = img.crop((0, 55, W, 55 + SPLIT_Y))
part1 = Image.new("RGB", (W, HEADER_H + SPLIT_Y), (255, 255, 255))
part1.paste(body1, (0, HEADER_H))
part1 = add_header(part1, "Caméra IA — Partie 1 : Identification de l'Enseignant")
part1.save(DIR + "uc_camera_ia_part1.png", "PNG", dpi=(150,150))
print("✅ Part1 sauvegardée")

# ── PARTIE 2 : lignes (55 + SPLIT_Y - ACTOR_OVERLAP) → fin de l'original
ACTOR_OVERLAP = 80  # on remonte un peu pour garder l'acteur visible
body2 = img.crop((0, 55 + SPLIT_Y - ACTOR_OVERLAP, W, H))
h2 = body2.height
part2 = Image.new("RGB", (W, HEADER_H + h2), (255, 255, 255))
part2.paste(body2, (0, HEADER_H))
part2 = add_header(part2, "Caméra IA — Partie 2 : Émargement des Étudiants", show_legend=True)
part2.save(DIR + "uc_camera_ia_part2.png", "PNG", dpi=(150,150))
print("✅ Part2 sauvegardée")
print(f"Tailles : Part1={part1.size}, Part2={part2.size}")
