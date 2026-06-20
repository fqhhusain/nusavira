import sys
import rembg
from PIL import Image
import io

if len(sys.argv) != 3:
    print("Usage: python3 remove-bg-custom.py <input_file> <output_file>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

print(f'Removing BG for {input_file} -> {output_file}...')
try:
    with open(input_file, 'rb') as f:
        input_data = f.read()
    output_data = rembg.remove(input_data)
    img = Image.open(io.BytesIO(output_data)).convert('RGBA')
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_file, 'PNG')
    print(f'Saved {output_file}')
except Exception as e:
    print(f"Failed to process {input_file}: {e}")
