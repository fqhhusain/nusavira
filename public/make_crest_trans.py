import sys
from PIL import Image

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # The background is a solid dark color, roughly around (26, 26, 26).
        # We aggressively remove any pixel darker than (45, 45, 45).
        if item[0] < 45 and item[1] < 45 and item[2] < 45:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python make_crest_trans.py <input> <output>")
        sys.exit(1)
    make_transparent(sys.argv[1], sys.argv[2])
