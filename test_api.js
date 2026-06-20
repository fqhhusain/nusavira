async function testApi() {
    try {
        const res = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/objects/31347', { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (res.ok) {
            console.log("SUCCESS: API is open!");
        } else {
            console.log(`BLOCKED: HTTP ${res.status}`);
        }
    } catch(e) {
        console.log(`ERROR: ${e.message}`);
    }
}
testApi();
