import os
from PIL import Image, ImageOps, ImageEnhance, ImageDraw

INPUT_FILE = "public/artifacts_images_hd/met-37747.jpg"
OUTPUT_DIR = "public/filter_samples"
os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    img = Image.open(INPUT_FILE).convert("RGB")
except Exception as e:
    print(f"Error opening image: {e}")
    exit(1)

# Base Image
img = img.resize((256, 256), resample=Image.LANCZOS)

# Style A: The Archivist Blueprint (Cyan Hologram)
def make_hologram(img):
    gray = ImageOps.grayscale(img)
    # Invert so background is dark, object is bright (assuming object has contrast)
    # Wait, MET images usually have white/light backgrounds. So inverting makes background black!
    inverted = ImageOps.invert(gray)
    # Colorize to cyan/blue
    holo = ImageOps.colorize(inverted, black="#001a33", white="#00ffff", mid="#0066cc")
    return holo

holo_img = make_hologram(img)
holo_img = ImageOps.posterize(holo_img, 4) # slight pixelation banding
holo_img.save(os.path.join(OUTPUT_DIR, "5_hologram.jpg"))

# Style B: Syndicate Terminal (Green CRT Scanlines)
def make_crt(img):
    gray = ImageOps.grayscale(img)
    # Colorize to retro terminal green
    terminal = ImageOps.colorize(gray, black="#001100", white="#33ff33", mid="#118811")
    terminal = terminal.convert("RGB")
    # Draw scanlines
    draw = ImageDraw.Draw(terminal)
    for y in range(0, 256, 4):
        draw.line([(0, y), (256, y)], fill=(0,0,0), width=1)
    return terminal

crt_img = make_crt(img)
crt_img.save(os.path.join(OUTPUT_DIR, "6_crt_terminal.jpg"))

# Style C: The Golden Vault (Amber / Gold Monochromatic Pixel Art)
def make_gold(img):
    # Downscale and upscale for pixel effect
    small = img.resize((80, 80), resample=Image.LANCZOS)
    gray = ImageOps.grayscale(small)
    # Contrast boost
    enhancer = ImageEnhance.Contrast(gray)
    gray = enhancer.enhance(1.8)
    # Colorize to black and gold
    gold = ImageOps.colorize(gray, black="#1a1a1a", white="#ffd700", mid="#b8860b")
    # Back to 256
    pixel_gold = gold.resize((256, 256), resample=Image.NEAREST)
    return pixel_gold

gold_img = make_gold(img)
gold_img.save(os.path.join(OUTPUT_DIR, "7_golden_vault.jpg"))

print(f"Generated 3 themed sample filters in {OUTPUT_DIR}/")
