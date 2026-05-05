from PIL import Image, ImageDraw, ImageFont

SRC = "/home/usain/.gemini/antigravity/brain/08b975b5-ef16-4026-9c73-9faa201faddb/media__1777849174287.png"
OUTPUT = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_camera_ia.png"

img = Image.open(SRC).convert("RGB")
W, H = img.size
draw = ImageDraw.Draw(img)

# Couvrir les 2 premières lignes (titre + légende tronquée)
TITLE_BG = (230, 230, 245)
draw.rectangle([3, 3, W-4, 55], fill=TITLE_BG)
# Remettre la bordure du bas de la zone titre
draw.line([(3, 55), (W-4, 55)], fill=(50, 50, 50), width=1)

try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
    font_leg   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
except:
    font_title = font_leg = ImageFont.load_default()

# Nouveau titre centré
title = "Caméra IA — Reconnaissance Faciale & Émargement"
bb = draw.textbbox((0, 0), title, font=font_title)
draw.text(((W - (bb[2]-bb[0])) // 2, 10), title, fill=(30, 30, 100), font=font_title)

# Nouvelle légende propre sur la 2ème ligne
legend_items = [
    ("● Étape Enseignant", (180, 140, 220)),
    ("● Anti-Spoofing", (220, 100, 100)),
    ("● Algo IA / FaceNet", (100, 160, 220)),
    ("● Mode Rapide", (200, 180, 40)),
    ("● Gestion BDD", (80, 180, 100)),
]

x_cursor = 18
y_leg = 37
for text, color in legend_items:
    bb = draw.textbbox((0, 0), text, font=font_leg)
    draw.text((x_cursor, y_leg), text, fill=color, font=font_leg)
    x_cursor += (bb[2]-bb[0]) + 20

img.save(OUTPUT, "PNG", dpi=(150, 150))
print(f"✅ Titre + légende nettoyés : {OUTPUT}")
