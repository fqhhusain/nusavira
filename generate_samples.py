import os
from PIL import Image, ImageOps, ImageEnhance

INPUT_FILE = "public/artifacts_images_hd/met-37747.jpg"
OUTPUT_DIR = "public/filter_samples"
os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    img = Image.open(INPUT_FILE).convert("RGB")
except Exception as e:
    print(f"Error opening image: {e}")
    exit(1)

# Base Image Resize for uniform samples
img = img.resize((256, 256), resample=Image.LANCZOS)
img.save(os.path.join(OUTPUT_DIR, "0_original.jpg"))

# Sample 1: Sepia + High Contrast (Like classic pre-rendered RPG items)
def make_sepia(img):
    # Convert to grayscale first
    gray = ImageOps.grayscale(img)
    # Colorize with sepia tone
    sepia = ImageOps.colorize(gray, "#4a3525", "#d6c19a")
    return sepia

sepia_img = make_sepia(img)
enhancer = ImageEnhance.Contrast(sepia_img)
sepia_img = enhancer.enhance(1.5)
enhancer = ImageEnhance.Color(sepia_img)
sepia_img = enhancer.enhance(1.3)
sepia_img.save(os.path.join(OUTPUT_DIR, "1_sepia_contrast.jpg"))

# Sample 2: Posterize (Reduces color depth to look like 16-bit console)
posterized_img = ImageOps.posterize(img, 3) # 3 bits per channel
enhancer = ImageEnhance.Color(posterized_img)
posterized_img = enhancer.enhance(1.5) # Boost saturation to make it pop
posterized_img.save(os.path.join(OUTPUT_DIR, "2_posterize.jpg"))

# Sample 3: Pixelate + Posterize (The classic GBA/SNES vibe)
# Resize down to 64x64, posterize, then nearest neighbor back to 256x256
small_img = img.resize((64, 64), resample=Image.LANCZOS)
small_img = ImageOps.posterize(small_img, 3)
enhancer = ImageEnhance.Contrast(small_img)
small_img = enhancer.enhance(1.2)
pixel_poster = small_img.resize((256, 256), resample=Image.NEAREST)
pixel_poster.save(os.path.join(OUTPUT_DIR, "3_pixelate_posterize.jpg"))

# Sample 4: Dithered Pixel Art
# Convert to a restricted palette with dithering
paletted_img = img.resize((64, 64), resample=Image.LANCZOS)
paletted_img = paletted_img.convert("P", palette=Image.ADAPTIVE, colors=16)
dithered_img = paletted_img.convert("RGB").resize((256, 256), resample=Image.NEAREST)
dithered_img.save(os.path.join(OUTPUT_DIR, "4_dithered.jpg"))

print(f"Generated 4 sample filters in {OUTPUT_DIR}/")
