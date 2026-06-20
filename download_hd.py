import json
import os
import requests
import concurrent.futures

JSON_PATH = 'src/data/artifacts.json'
OUTPUT_DIR = 'public/artifacts_images_hd'
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    artifacts = json.load(f)

def process_artifact(artifact):
    img_id = artifact['id']
    # e.g. met-307891 -> 307891
    numeric_id = img_id.replace('met-', '')
    
    save_path = os.path.join(OUTPUT_DIR, f"{img_id}.jpg")
    if os.path.exists(save_path):
        return (img_id, f"/artifacts_images_hd/{img_id}.jpg")
    
    try:
        # 1. Fetch metadata from MET API to get the original HD image URL
        api_url = f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{numeric_id}"
        resp = requests.get(api_url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        primary_image_url = data.get('primaryImage')
        if not primary_image_url:
            print(f"No primary image found for {img_id}")
            return None
            
        # 2. Download the actual image
        img_resp = requests.get(primary_image_url, timeout=20)
        img_resp.raise_for_status()
        
        with open(save_path, 'wb') as f:
            f.write(img_resp.content)
            
        print(f"Downloaded HD image for: {img_id}")
        return (img_id, f"/artifacts_images_hd/{img_id}.jpg")
    except Exception as e:
        print(f"Failed to process {img_id}: {e}")
        return None

print(f"Starting HD download for {len(artifacts)} artifacts...")
updates = 0

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(process_artifact, artifacts))

for result in results:
    if result:
        img_id, local_url = result
        for a in artifacts:
            if a['id'] == img_id:
                if a['imageUrl'] != local_url:
                    a['imageUrl'] = local_url
                    updates += 1
                break

if updates > 0:
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(artifacts, f, indent=2)
    print(f"Successfully updated {updates} image URLs in artifacts.json to point to HD images.")
else:
    print("No URLs were updated.")

print("Finished!")
