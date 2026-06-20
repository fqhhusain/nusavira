import fs from 'fs';

const DELAY_MS = 1000;
const DB_PATH = './src/data/artifacts.json';
const TARGET_COUNT = 300;

let database = [];
if (fs.existsSync(DB_PATH)) {
    database = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
const existingIds = new Set(database.map(d => d.id));

async function fetchWithDelay(url) {
    await new Promise(r => setTimeout(r, DELAY_MS));
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (GachaProject/1.0)' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function run() {
    console.log(`Current DB size: ${database.length}. Target: ${TARGET_COUNT}`);
    
    // Step 1: Fetch IDs for Indonesian Paintings/Drawings
    console.log("Fetching Arena IDs (Paintings/Drawings)...");
    const paintingRes = await fetchWithDelay('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&q=painting');
    const drawingRes = await fetchWithDelay('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&q=drawing');
    
    let priorityIds = [...(paintingRes.objectIDs || []), ...(drawingRes.objectIDs || [])];
    
    // Step 2: Fetch general Indonesian IDs to fill the rest
    console.log("Fetching General Indonesian IDs...");
    const generalRes = await fetchWithDelay('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&q=*');
    let generalIds = generalRes.objectIDs || [];
    
    // Combine, prioritizing paintings
    let allIds = [...priorityIds, ...generalIds.filter(id => !priorityIds.includes(id))];
    
    // Filter out ones we already have
    let newIds = allIds.filter(id => !existingIds.has(`met-${id}`));
    console.log(`Found ${newIds.length} new IDs to process. Priority IDs count: ${priorityIds.length}`);
    
    let added = 0;
    
    for (let i = 0; i < newIds.length; i++) {
        if (database.length >= TARGET_COUNT) break;
        
        const id = newIds[i];
        try {
            console.log(`[${database.length}/${TARGET_COUNT}] Fetching ID ${id}...`);
            const item = await fetchWithDelay(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
            
            if (item.primaryImageSmall) {
                database.push({
                    id: `met-${item.objectID}`,
                    title: item.title || item.objectName || 'Unknown Artifact',
                    imageUrl: item.primaryImageSmall,
                    role: 'relic', // Will be recalculated at runtime
                    element: 'Physical',
                    level: 1,
                    rarity: 'Common', // Will be overwritten by EDA script
                    copies: 0,
                    stats: {},
                    classification: item.classification || 'Unknown',
                    department: item.department || '',
                    culture: item.culture || 'Indonesian',
                    date: item.objectDate || 'Unknown Date',
                    medium: item.medium || '',
                    isNew: true
                });
                added++;
                fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
            } else {
                console.log(`Skipping ID ${id} - No image`);
            }
        } catch (err) {
            console.log(`Failed to fetch ${id}:`, err.message);
        }
    }
    
    console.log(`Finished! Added ${added} items. Total DB size: ${database.length}`);
}

run();
