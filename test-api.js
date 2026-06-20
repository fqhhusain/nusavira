const roles = ['weapon', 'textile', 'figure', 'jewelry'];

async function test() {
  for (const q of roles) {
    try {
      const res = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&hasImages=true&q=${q}`);
      const data = await res.json();
      console.log(`Query: ${q}, Count: ${data.total}, Sample: ${data.objectIDs ? data.objectIDs.slice(0,3) : 'null'}`);
    } catch (e) {
      console.error(`Error with ${q}:`, e);
    }
  }
}
test();
