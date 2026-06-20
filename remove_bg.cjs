const Jimp = require('jimp');

async function removeWhite(filePath) {
  try {
    const image = await Jimp.read(filePath);
    console.log(`Processing ${filePath}...`);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // We will do a simple flood fill from (0,0) to find all background white pixels
    const queue = [[0, 0], [width-1, 0], [0, height-1], [width-1, height-1]];
    const visited = new Set();
    const isWhite = (r, g, b) => r > 230 && g > 230 && b > 230;

    const toKey = (x, y) => `${x},${y}`;

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = toKey(x, y);
      if (visited.has(key)) continue;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const idx = (width * y + x) << 2;
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];
      
      if (a === 0) {
        // Already transparent, just mark as visited and spread
        visited.add(key);
        queue.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
        continue;
      }

      if (isWhite(r, g, b)) {
        image.bitmap.data[idx + 3] = 0; // Make transparent
        visited.add(key);
        queue.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
      }
    }
    
    // As a fallback, since sometimes pixel art lines are imperfect or anti-aliased:
    // we also do a basic color replacement for any pure white pixel near the transparent ones?
    // Let's just rely on the flood fill first. It's safer.
    
    await image.writeAsync(filePath);
    console.log(`Successfully removed background for ${filePath}`);
  } catch (err) {
    console.error(`Failed to process ${filePath}:`, err.message);
  }
}

async function run() {
  await removeWhite('public/Nyai-Vex.png');
  // Might as well do Ravana if he has a white background
  await removeWhite('public/Overlord-Ravana.png');
}

run();
