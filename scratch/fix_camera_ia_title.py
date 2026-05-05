from PIL import Image, ImageDraw, ImageFont

# Ancien artifact (version complexe avec les Use Cases colorés)
OLD_PATH = "/home/usain/.gemini/antigravity/brain/08b975b5-ef16-4026-9c73-9faa201faddb/media__1777843613480.png"
OUTPUT_PATH = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation/uc_camera_ia.png"

img = Image.open(OLD_PATH).convert("RGB")
W, H = img.size
print(f"Image source : {W}x{H} px")

draw = ImageDraw.Draw(img)

# Peindre par-dessus l'ancien titre (bande du haut ~40px)
TITLE_BG = (230, 230, 245)
BORDER = (50, 50, 50)
draw.rectangle([3, 3, W-4, 45], fill=TITLE_BG)

# Nouveau titre propre
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
except:
    font = ImageFont.load_default()

new_title = "Caméra IA — Reconnaissance Faciale & Émargement"
bbox = draw.textbbox((0, 0), new_title, font=font)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, 12), new_title, fill=(30, 30, 100), font=font)

img.save(OUTPUT_PATH, "PNG", dpi=(150, 150))
print(f"Diagramme mis à jour (titre uniquement) : {OUTPUT_PATH}")
