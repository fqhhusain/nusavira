import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'src', 'data', 'artifacts.json');

const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

function extractYear(yearStr) {
  if (!yearStr) return 1900;
  const match = yearStr.toString().match(/\d{3,4}/);
  return match ? parseInt(match[0]) : 1900; // Default to modern if unknown
}

const scoredData = data.map(item => {
  let score = 0;
  
  // 1. Age Score (older = better)
  const year = extractYear(item.date || item.year);
  if (year < 1000) score += 50;
  else if (year < 1500) score += 30;
  else if (year < 1800) score += 15;
  else if (year < 1900) score += 5;
  
  // 2. Material Score
  const mat = (item.medium || '').toLowerCase();
  if (mat.includes('gold')) score += 40;
  if (mat.includes('silver')) score += 25;
  if (mat.includes('ivory')) score += 30;
  if (mat.includes('silk')) score += 20;
  if (mat.includes('bronze')) score += 15;
  
  // 3. Highlight
  if (item.isHighlight) score += 20;
  
  return { ...item, score, parsedYear: year };
});

// Sort by score descending
scoredData.sort((a, b) => b.score - a.score);

console.log("Top 10 Artifacts by Score:");
scoredData.slice(0, 10).forEach(a => console.log(`[${a.score}pts] ${a.title} (${a.date || a.year}) - ${a.medium}`));

console.log("\nBottom 5 Artifacts by Score:");
scoredData.slice(-5).forEach(a => console.log(`[${a.score}pts] ${a.title} (${a.date || a.year}) - ${a.medium}`));

// Assign rarities based on proportional distribution
const total = scoredData.length; // 150
const cutoffs = {
  legendary: Math.floor(total * 0.05), // 7
  epic: Math.floor(total * 0.15), // 22
  rare: Math.floor(total * 0.30) // 45
};

const finalizedData = scoredData.map((item, index) => {
  let rarity = 'Common';
  if (index < cutoffs.legendary) {
    rarity = 'Legendary';
  } else if (index < cutoffs.legendary + cutoffs.epic) {
    rarity = 'Epic';
  } else if (index < cutoffs.legendary + cutoffs.epic + cutoffs.rare) {
    rarity = 'Rare';
  }
  
  return { ...item, rarity }; // Assign baked rarity
});

fs.writeFileSync(DB_FILE, JSON.stringify(finalizedData, null, 2));

console.log(`\nSuccessfully scored and saved ${total} artifacts with Permanent Rarity.`);
console.log(`Legendary: ${finalizedData.filter(i => i.rarity === 'Legendary').length}`);
console.log(`Epic: ${finalizedData.filter(i => i.rarity === 'Epic').length}`);
console.log(`Rare: ${finalizedData.filter(i => i.rarity === 'Rare').length}`);
console.log(`Common: ${finalizedData.filter(i => i.rarity === 'Common').length}`);
