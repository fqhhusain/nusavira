const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const tolerance = parseInt(process.argv[4] || '20');

async function removeBg() {
  try {
    const image = await Jimp.read(inputPath);
    console.log(`Processing: ${inputPath}`);

    // Get the background color from the top-left pixel
    const bgRed = image.bitmap.data[0];
    const bgGreen = image.bitmap.data[1];
    const bgBlue = image.bitmap.data[2];

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      // Check if pixel matches background color within tolerance
      if (Math.abs(red - bgRed) <= tolerance && 
          Math.abs(green - bgGreen) <= tolerance && 
          Math.abs(blue - bgBlue) <= tolerance) {
        this.bitmap.data[idx + 3] = 0; // Make transparent
      }
    });

    await image.write(outputPath);
    console.log(`✅ Saved transparent image: ${outputPath}`);
  } catch (err) {
    console.error(`❌ Failed to process:`, err.message);
  }
}

removeBg();
