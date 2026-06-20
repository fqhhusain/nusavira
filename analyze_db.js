import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./src/data/artifacts.json', 'utf8'));

const roles = db.reduce((acc, c) => { acc[c.role] = (acc[c.role] || 0) + 1; return acc; }, {});
const rarities = db.reduce((acc, c) => { acc[c.rarity] = (acc[c.rarity] || 0) + 1; return acc; }, {});
const completeAttr = db.filter(c => c.medium && c.culture && c.date !== 'Unknown Date' && c.date).length;

console.log('Total:', db.length);
console.log('Roles:', roles);
console.log('Rarities:', rarities);
console.log('Complete Attrs:', completeAttr);

const lackingDates = db.filter(c => c.date === 'Unknown Date' || !c.date).length;
console.log('Lacking Dates:', lackingDates);
