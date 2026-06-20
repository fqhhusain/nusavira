import fs from 'fs';

const DB_PATH = './src/data/artifacts.json';
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

export const determineElement = (medium, classification, title) => {
  const combinedStr = `${medium || ''} ${classification || ''} ${title || ''}`.toLowerCase();
  
  if (['gold', 'silver', 'diamond', 'wayang', 'mask', 'deity'].some(k => combinedStr.includes(k))) {
    return 'Aura'; // ✨
  }
  if (['bronze', 'copper', 'brass', 'iron', 'steel', 'metal'].some(k => combinedStr.includes(k))) {
    return 'Metallum'; // ⚔️
  }
  // Default to Natura for wood, stone, horn, cotton, terracotta, etc.
  return 'Natura'; // 🌿
};

const elements = { Aura: 0, Metallum: 0, Natura: 0 };

db.forEach(card => {
  elements[determineElement(card.medium, card.classification, card.title)]++;
});

console.log("Proposed 3-Element Distribution in 292 Cards:");
console.log(elements);
