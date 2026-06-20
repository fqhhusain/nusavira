import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'artifacts.json');

async function buildDatabase() {
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const searchRes = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&hasImages=true&q=*');
  const searchData = await searchRes.json();
  let ids = (searchData.objectIDs || []).sort(() => 0.5 - Math.random());
  
  const validArtifacts = [];
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < ids.length && validArtifacts.length < 150; i += BATCH_SIZE) {
    const batchIds = ids.slice(i, i + BATCH_SIZE);
    
    const promises = batchIds.map(async (id) => {
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, { signal: controller.signal });
        clearTimeout(tId);
        const obj = await res.json();
        
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
        }
      } catch(e) {}
    });

    await Promise.all(promises);
    process.stdout.write(`\rCollected: ${validArtifacts.length} / 150`);
  }

  // Ensure we don't save more than 150
  const finalSet = validArtifacts.slice(0, 150);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalSet, null, 2));
  console.log(`\nSaved ${finalSet.length} artifacts to ${OUTPUT_FILE}`);
}
buildDatabase();
