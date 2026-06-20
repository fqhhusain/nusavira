const https = require('https');

const fetchJson = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(JSON.parse(data)));
  }).on('error', reject);
});

async function run() {
  const categories = ['sword', 'shield', 'amulet'];
  const results = {};
  for (const cat of categories) {
    const search = await fetchJson('https://collectionapi.metmuseum.org/public/collection/v1/search?q=' + cat + '&hasImages=true');
    const id = search.objectIDs[Math.floor(Math.random() * 5)]; // Take from top 5
    const obj = await fetchJson('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + id);
    results[cat] = { title: obj.title, image: obj.primaryImageSmall, dept: obj.department };
  }
  console.log(JSON.stringify(results, null, 2));
}
run();
