import json
import os
import requests
from io import BytesIO
try:
    from PIL import Image
    import requests
except ImportError:
    os.system('pip install Pillow requests --break-system-packages')
    from PIL import Image
    import requests
import concurrent.futures

JSON_PATH = 'src/data/artifacts.json'
OUTPUT_DIR = 'public/artifacts_images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    artifacts = json.load(f)

def process_image(artifact):
    img_id = artifact['id']
    url = artifact['imageUrl']
    
    # If already a local path, skip
    if url.startswith('/artifacts_images/'):
        return None

    save_path = os.path.join(OUTPUT_DIR, f"{img_id}.webp")
    if os.path.exists(save_path):
        return (img_id, f"/artifacts_images/{img_id}.webp")

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content)).convert('RGB')
        
        # Pixelation effect
        # 1. Resize down
        small_size = (64, 64)
        img_small = img.resize(small_size, resample=Image.BILINEAR)
        # 2. Resize up using Nearest Neighbor to keep blocky pixels
        img_pixelated = img_small.resize((256, 256), resample=Image.NEAREST)
        
        img_pixelated.save(save_path, 'WEBP', quality=85)
        print(f"Downloaded and pixelated: {img_id}")
        
        return (img_id, f"/artifacts_images/{img_id}.webp")
    except Exception as e:
        print(f"Failed to process {img_id}: {e}")
        return None

print(f"Starting download for {len(artifacts)} images...")
updates = 0

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(process_image, artifacts))

for result in results:
    if result:
        img_id, local_url = result
        for a in artifacts:
            if a['id'] == img_id:
                a['imageUrl'] = local_url
                updates += 1
                break

if updates > 0:
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(artifacts, f, indent=2)
    print(f"Successfully updated {updates} image URLs in artifacts.json.")
else:
    print("No URLs were updated. They might already be local or downloads failed.")

print("Finished!")
