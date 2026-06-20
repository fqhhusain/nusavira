import os
import random
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

try:
    import rembg
    import cv2
except ImportError:
    os.system("pip install rembg opencv-python-headless --break-system-packages")
    import rembg
    import cv2

INPUT_FILES = [
    "public/artifacts_images_hd/met-37747.jpg",  # Guci emas
    "public/artifacts_images_hd/met-307891.jpg"  # Selendang
]
OUTPUT_DIR = "public/filter_samples"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_mimic(filepath, out_filename):
    print(f"Processing {filepath}...")
    try:
        # 1. Remove Background using rembg (AI-based background removal)
        with open(filepath, 'rb') as i:
            input_bytes = i.read()
            output_bytes = rembg.remove(input_bytes)
            
        # Load back to PIL
        import io
        img = Image.open(io.BytesIO(output_bytes)).convert("RGBA")
        
        # 2. Downscale to create pixel blocks (e.g. 80x80)
        pixel_size = (80, 80)
        img = img.resize(pixel_size, resample=Image.LANCZOS)
        
        # Split into RGB and Alpha
        r, g, b, a = img.split()
        rgb = Image.merge("RGB", (r, g, b))
        
        # 3. Enhance Colors (Vibrant, cartoonish JRPG look)
        enhancer = ImageEnhance.Color(rgb)
        rgb = enhancer.enhance(1.8) # Boost saturation
        enhancer = ImageEnhance.Contrast(rgb)
        rgb = enhancer.enhance(1.4) # Boost contrast
        
        # 4. Posterize to flatten colors (Clean shading like real pixel art)
        rgb = ImageOps.posterize(rgb, 3) # Reduce to 3 bits per channel
        
        # Convert to numpy for outline and sparkles
        rgb_np = np.array(rgb)
        alpha_np = np.array(a)
        
        # 5. Create White Outline
        # Dilate the alpha channel
        kernel = np.ones((3, 3), np.uint8)
        dilated_alpha = cv2.dilate(alpha_np, kernel, iterations=1)
        
        # Create a blank transparent image
        final_h, final_w = alpha_np.shape
        result_np = np.zeros((final_h, final_w, 4), dtype=np.uint8)
        
        # Fill the dilated area with white outline
        outline_mask = (dilated_alpha > 0) & (alpha_np == 0)
        result_np[outline_mask] = [255, 255, 255, 255] # White outline
        
        # Fill the object itself
        obj_mask = alpha_np > 0
        result_np[obj_mask, :3] = rgb_np[obj_mask]
        result_np[obj_mask, 3] = alpha_np[obj_mask]
        
        # 6. Add Random Sparkles (to mimic the magical sparkles in your AI sample)
        # Find the bounding box of the object
        y_indices, x_indices = np.where(dilated_alpha > 0)
        if len(y_indices) > 0:
            min_y, max_y = np.min(y_indices), np.max(y_indices)
            min_x, max_x = np.min(x_indices), np.max(x_indices)
            
            # Add 3-5 random sparkles around the bounding box
            num_sparkles = random.randint(3, 6)
            for _ in range(num_sparkles):
                sy = random.randint(max(0, min_y - 10), min(final_h - 2, max_y + 10))
                sx = random.randint(max(0, min_x - 10), min(final_w - 2, max_x + 10))
                
                # Only add sparkle if it's in empty space
                if result_np[sy, sx, 3] == 0:
                    # Draw a simple 2x2 or 1x1 yellow/gold sparkle
                    sparkle_color = [random.randint(200, 255), random.randint(200, 255), random.randint(100, 200), 255]
                    result_np[sy, sx] = sparkle_color
                    # Cross shape for sparkle
                    if sy > 0: result_np[sy-1, sx] = sparkle_color
                    if sy < final_h - 1: result_np[sy+1, sx] = sparkle_color
                    if sx > 0: result_np[sy, sx-1] = sparkle_color
                    if sx < final_w - 1: result_np[sy, sx+1] = sparkle_color
                    
        # 7. Upscale Nearest Neighbor to keep it sharp
        final_img = Image.fromarray(result_np, "RGBA")
        final_img = final_img.resize((512, 512), resample=Image.NEAREST)
        
        # Need a solid background or keep it transparent? Let's keep transparent for best UI fit!
        # But for viewing the sample clearly, I will paste it on a dark gray background.
        bg = Image.new("RGBA", (512, 512), (30, 30, 30, 255))
        bg.paste(final_img, (0, 0), final_img)
        
        out_path = os.path.join(OUTPUT_DIR, out_filename)
        bg.convert("RGB").save(out_path, quality=95)
        print(f"Saved mimicked image to {out_path}")
        
    except Exception as e:
        print(f"Failed processing {filepath}: {e}")

process_mimic(INPUT_FILES[0], "8_mimic_ai_gold.jpg")
process_mimic(INPUT_FILES[1], "9_mimic_ai_cloth.jpg")
print("Done!")
