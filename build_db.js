import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'artifacts.json');
const TARGET_COUNT = 100;

async function fetchWithTimeout(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(id);
  return response;
}

async function buildDatabase() {
  console.log("Starting Database Builder...");
  
  // Ensure data directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    console.log("Fetching Indonesian artifact IDs...");
    const searchRes = await fetchWithTimeout('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&hasImages=true&q=*');
    const searchData = await searchRes.json();
    let ids = searchData.objectIDs || [];
    
    // Shuffle the IDs so we get a random set each time we run this
    ids = ids.sort(() => 0.5 - Math.random());
    
    console.log(`Found ${ids.length} potential artifacts. Searching for ${TARGET_COUNT} perfect ones...`);
    
    const validArtifacts = [];
    let checked = 0;
    
    for (const id of ids) {
      if (validArtifacts.length >= TARGET_COUNT) break;
      
      try {
        checked++;
        const detailRes = await fetchWithTimeout(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
        const obj = await detailRes.json();
        
        // Validation: Must have a small image, title, and medium
        if (obj && obj.primaryImageSmall && obj.title) {
          validArtifacts.push({
            id: obj.objectID,
            title: obj.title,
            imageUrl: obj.primaryImageSmall,
            maker: obj.artistDisplayName || 'Unknown Artisan',
            year: obj.objectDate || obj.objectEndDate || 'Unknown Era',
            medium: obj.medium || 'Unknown Material',
            classification: obj.classification || 'Unknown',
            department: obj.department || 'Unknown',
            culture: obj.culture || 'Indonesia',
            isHighlight: obj.isHighlight || false
          });
          
          process.stdout.write(`\rCollected: ${validArtifacts.length} / ${TARGET_COUNT} (Checked: ${checked})`);
        }
      } catch (e) {
        // Skip on fetch error/timeout
      }
    }
    
    console.log("\n\nFinished collecting artifacts!");
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validArtifacts, null, 2));
    console.log(`Saved ${validArtifacts.length} artifacts to ${OUTPUT_FILE}`);
    
  } catch (e) {
    console.error("Failed to build database:", e);
  }
}

buildDatabase();
