import fs from 'fs';

const DB_PATH = './src/data/artifacts.json';
const TARGET_COUNT = 300;

let database = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const usedIds = new Set(database.map(d => d.id.toString()));

async function fetchWithDelay(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function normalizeItem(item) {
    return {
        id: `met-${item.objectID}`,
        title: item.title || item.objectName || 'Unknown Artifact',
        imageUrl: item.primaryImageSmall || item.primaryImage,
        role: 'relic',
        element: 'Physical',
        level: 1,
        rarity: 'Common',
        copies: 0,
        stats: {},
        classification: item.classification || 'Unknown',
        department: item.department || '',
        culture: item.culture || 'Indonesian',
        date: item.objectDate || 'Unknown Date',
        medium: item.medium || 'Unknown Material',
        isNew: true,
        isHighlight: item.isHighlight || false
    };
}

async function run() {
    console.log(`Current DB size: ${database.length}. Need to reach ${TARGET_COUNT}.`);
    const deficit = TARGET_COUNT - database.length;
    if (deficit <= 0) return;

    console.log(`Fetching ${deficit} quick fallback items...`);
    const res = await fetchWithDelay('https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&geoLocation=Indonesia&q=*');
    
    let added = 0;
    for (const id of res.objectIDs || []) {
        if (database.length >= TARGET_COUNT) break;
        if (usedIds.has(`met-${id}`)) continue;
        
        try {
            const item = await fetchWithDelay(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
            if (item.primaryImageSmall) {
                database.push(normalizeItem(item));
                usedIds.add(`met-${item.objectID}`);
                added++;
                fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
                console.log(`Added quick fallback ID ${id}`);
            }
        } catch (err) {}
    }
    
    console.log(`Finished filling! Total DB size: ${database.length}`);
}

run();
