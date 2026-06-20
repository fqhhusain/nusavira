import fs from 'fs';

async function test() {
  const res = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?departmentId=6&q=painting');
  const data = await res.json();
  console.log(`Found ${data.total} Asian paintings.`);
  
  const res2 = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&q=painting');
  const data2 = await res2.json();
  console.log(`Found ${data2.total} Indonesian paintings.`);
  
  const res3 = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=Indonesia&q=drawing');
  const data3 = await res3.json();
  console.log(`Found ${data3.total} Indonesian drawings.`);
}
test();
