import os
import rembg
from PIL import Image
import io

icons = [
    'public/icons/insight.png', 
    'public/icons/map.png', 
    'public/icons/book.png', 
    'public/icons/profile.png', 
    'public/icons/sandbox.png'
]

for icon in icons:
    print(f'Removing BG for {icon}...')
    try:
        with open(icon, 'rb') as f:
            input_data = f.read()
        output_data = rembg.remove(input_data)
        img = Image.open(io.BytesIO(output_data)).convert('RGBA')
        
        # Crop the transparent bounding box
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(icon, 'PNG')
        print(f'Saved {icon}')
    except Exception as e:
        print(f"Failed to process {icon}: {e}")
