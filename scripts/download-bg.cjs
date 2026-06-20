const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, '../public/background');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  console.log("Downloading Shiva...");
  await download('https://images.metmuseum.org/CRDImages/as/original/DP131419.jpg', path.join(dir, 'DP131419.jpg'));
  console.log("Downloading Warrior...");
  await download('https://images.metmuseum.org/CRDImages/as/original/DP158751.jpg', path.join(dir, 'DP158751.jpg'));
  console.log("Done!");
}

main();
