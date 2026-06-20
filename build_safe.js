import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'artifacts.json');
const TARGET_COUNT = 150;

// Read existing data if any, so we don't start from zero
let validArtifacts = [];
if (fs.existsSync(OUTPUT_FILE)) {
  validArtifacts = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  console.log(`Starting with ${validArtifacts.length} existing artifacts.`);
}

async function fetchSafely(url) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // Generous 10s timeout
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(id);
    
    // Check if we hit a WAF/HTML page
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Non-JSON response, likely blocked by WAF');
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function buildDatabase() {
  console.log("Starting Safe Database Builder...");

  try {
    console.log("Fetching Indonesian artifact IDs...");
    const searchData = await fetchSafely('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&hasImages=true&q=*');
    let ids = searchData.objectIDs || [];
    
    // Filter out IDs we already have
    const existingIds = new Set(validArtifacts.map(a => a.id));
    ids = ids.filter(id => !existingIds.has(id)).sort(() => 0.5 - Math.random());
    
    console.log(`Found ${ids.length} new potential artifacts. Searching until we have ${TARGET_COUNT}...`);
    
    let checked = 0;
    
    for (const id of ids) {
      if (validArtifacts.length >= TARGET_COUNT) break;
      
      try {
        checked++;
        const obj = await fetchSafely(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
        
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
          
          // Save incrementally just in case!
          fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validArtifacts, null, 2));
        }
      } catch (e) {
        // Silently skip failed fetches
      }
      
      // EXTREMELY SAFE DELAY: Wait 1 full second between requests to guarantee we don't trigger the WAF again
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log("\n\nFinished collecting artifacts!");
    console.log(`Final count: ${validArtifacts.length} artifacts saved to ${OUTPUT_FILE}`);
    
  } catch (e) {
    console.error("Failed to build database. We might still be temporarily blocked:", e.message);
  }
}

buildDatabase();
