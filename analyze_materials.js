import fs from 'fs';

const DB_PATH = './src/data/artifacts.json';
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

const mediums = {};
db.forEach(card => {
  const m = (card.medium || 'Unknown').toLowerCase();
  mediums[m] = (mediums[m] || 0) + 1;
});

// Sort by frequency
const sorted = Object.entries(mediums).sort((a,b) => b[1] - a[1]);
console.log(sorted.slice(0, 30));
