import sys
from PIL import Image

def remove_magenta(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for item in data:
        # Check if color is close to magenta (high red, high blue, low green)
        # We allow a small tolerance because of PNG/JPEG compression artifacts
        if item[0] > 220 and item[1] < 50 and item[2] > 220:
            new_data.append((255, 255, 255, 0)) # Transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop empty space
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Saved {output_path} without magenta bg.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scripts/remove-magenta.py <input> <output>")
    else:
        remove_magenta(sys.argv[1], sys.argv[2])
