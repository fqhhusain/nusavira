import fs from 'fs';

const DB_PATH = './src/data/artifacts.json';
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

export const determineElement = (medium, classification) => {
  const combinedStr = `${medium || ''} ${classification || ''}`.toLowerCase();
  
  if (['gold', 'silver', 'bone', 'ivory', 'wayang', 'puppet', 'mask', 'deity'].some(k => combinedStr.includes(k))) {
    return 'Mystical'; // ✨
  }
  if (['ceramic', 'clay', 'terracotta', 'glass', 'copper', 'brass'].some(k => combinedStr.includes(k))) {
    return 'Thermal'; // 🔥
  }
  if (['silk', 'cotton', 'textile', 'batik', 'paper', 'leather'].some(k => combinedStr.includes(k))) {
    return 'Ethereal'; // 💨
  }
  return 'Physical'; // ⚔️ (Iron, Steel, Bronze, Wood, Stone, etc)
};

const elements = {
  Mystical: 0,
  Thermal: 0,
  Ethereal: 0,
  Physical: 0
};

db.forEach(card => {
  const el = determineElement(card.medium, card.classification);
  elements[el]++;
});

console.log("Element Distribution in 292 Cards:");
console.log(elements);
