from PIL import Image, ImageDraw, ImageFont

# Image originale envoyée par l'utilisateur (la bonne version)
SRC = "/home/usain/.gemini/antigravity/brain/08b975b5-ef16-4026-9c73-9faa201faddb/media__1777849174287.png"
OUTPUT = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_camera_ia.png"

img = Image.open(SRC).convert("RGB")
W, H = img.size
print(f"Image source : {W}x{H} px")

draw = ImageDraw.Draw(img)

# Déterminer la hauteur de la bande de titre (~ 40px)
# On peint un rectangle blanc sur le titre original, puis on redessine le nouveau titre
TITLE_BG = (230, 230, 245)

# Hauteur à couvrir (titre + légende petite sur la 2ème ligne)
draw.rectangle([3, 3, W-4, 38], fill=TITLE_BG)

try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
except:
    font = ImageFont.load_default()

new_title = "Caméra IA — Reconnaissance Faciale & Émargement"
bb = draw.textbbox((0, 0), new_title, font=font)
tw = bb[2] - bb[0]
draw.text(((W - tw) // 2, 11), new_title, fill=(30, 30, 100), font=font)

img.save(OUTPUT, "PNG", dpi=(150, 150))
print(f"✅ Titre mis à jour, use cases intacts : {OUTPUT}")
