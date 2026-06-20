import fs from 'fs';

const DB_PATH = './src/data/artifacts.json';
const TARGET_COUNT = 300;
const DELAY_MS = 1000;

async function fetchWithDelay(url) {
    await new Promise(r => setTimeout(r, DELAY_MS));
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
        medium: item.medium || '',
        isNew: true,
        isHighlight: item.isHighlight || false
    };
}

async function run() {
    let rawDb = [];
    if (fs.existsSync(DB_PATH)) {
        rawDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }

    // Pass 1: Normalize all existing data and evaluate quality
    let goodCards = [];
    const usedIds = new Set();
    
    for (const card of rawDb) {
        // Fix old schema issues
        const idStr = card.id.toString().startsWith('met-') ? card.id.toString() : `met-${card.id}`;
        
        let date = card.date || card.year || 'Unknown Date';
        if (date === 'Unknown Date' || date === '') date = null;
        
        let maker = card.maker || 'Unknown Artisan';
        
        let medium = card.medium || '';
        if (medium === '') medium = null;

        // Criteria for a "good" card
        const hasDate = !!date;
        const hasMedium = !!medium;
        const isHighlight = card.isHighlight || false;
        
        // We keep the card if it's a Highlight OR it has both date and medium
        if (isHighlight || (hasDate && hasMedium)) {
            if (!usedIds.has(idStr)) {
                goodCards.push({
                    id: idStr,
                    title: card.title,
                    imageUrl: card.imageUrl,
                    role: card.role || 'relic',
                    element: card.element || 'Physical',
                    level: card.level || 1,
                    rarity: card.rarity || 'Common',
                    copies: card.copies || 0,
                    stats: card.stats || {},
                    classification: card.classification || 'Unknown',
                    department: card.department || '',
                    culture: card.culture || 'Indonesian',
                    date: date || 'Unknown Date',
                    medium: medium || 'Unknown Material',
                    isNew: card.isNew !== undefined ? card.isNew : true,
                    isHighlight: isHighlight
                });
                usedIds.add(idStr);
            }
        }
    }

    console.log(`Initial DB size: ${rawDb.length}`);
    console.log(`Good cards retained: ${goodCards.length}`);
    const deficit = TARGET_COUNT - goodCards.length;
    
    if (deficit <= 0) {
        console.log("Database is already full of high-quality cards!");
        // We trim to TARGET_COUNT just in case
        goodCards = goodCards.slice(0, TARGET_COUNT);
        fs.writeFileSync(DB_PATH, JSON.stringify(goodCards, null, 2));
        return;
    }

    console.log(`Need to fetch ${deficit} more high-quality cards...`);

    // Fetch Highlights first
    console.log("Searching for Indonesian Highlights...");
    const hlRes = await fetchWithDelay('https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&isHighlight=true&geoLocation=Indonesia&q=*');
    let candidateIds = hlRes.objectIDs || [];
    
    // Fallback: Indonesian paintings/drawings
    console.log("Searching for Indonesian Paintings...");
    const ptRes = await fetchWithDelay('https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&geoLocation=Indonesia&q=painting');
    candidateIds = [...candidateIds, ...(ptRes.objectIDs || [])];

    // Fallback: All Indonesian items
    console.log("Searching for all Indonesian items...");
    const allRes = await fetchWithDelay('https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&geoLocation=Indonesia&q=*');
    candidateIds = [...candidateIds, ...(allRes.objectIDs || [])];

    // Deduplicate candidate IDs
    candidateIds = [...new Set(candidateIds)];
    
    // Filter out IDs we already have in goodCards
    candidateIds = candidateIds.filter(id => !usedIds.has(`met-${id}`));
    console.log(`Found ${candidateIds.length} candidate IDs to evaluate.`);

    let added = 0;
    
    for (const id of candidateIds) {
        if (goodCards.length >= TARGET_COUNT) break;
        
        try {
            console.log(`[${goodCards.length}/${TARGET_COUNT}] Evaluating ID ${id}...`);
            const item = await fetchWithDelay(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
            
            if (!item.primaryImageSmall) continue;
            
            // Apply strict criteria
            const date = item.objectDate;
            const medium = item.medium;
            const isHighlight = item.isHighlight;
            
            if (isHighlight || (date && medium)) {
                goodCards.push(normalizeItem(item));
                usedIds.add(`met-${item.objectID}`);
                added++;
                fs.writeFileSync(DB_PATH, JSON.stringify(goodCards, null, 2));
                console.log(` => Added! (Date: ${date || 'No'}, Medium: ${medium ? 'Yes' : 'No'}, Highlight: ${isHighlight ? 'Yes' : 'No'})`);
            } else {
                console.log(` => Rejected. Did not meet quality criteria.`);
            }
        } catch (err) {
            console.log(`Failed to fetch ${id}:`, err.message);
        }
    }
    
    console.log(`Finished! Replaced/Added ${added} items. Total pristine DB size: ${goodCards.length}`);
}

run();
