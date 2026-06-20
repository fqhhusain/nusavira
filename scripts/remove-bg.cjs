const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ambang batas (threshold) untuk mendeteksi warna "hitam".
// Semakin tinggi nilainya, semakin banyak abu-abu gelap yang ikut terhapus.
const BLACK_THRESHOLD = 60; // 0-255

async function removeBlackBackground() {
  if (!fs.existsSync(iconsDir)) {
    console.error(`Directory not found: ${iconsDir}`);
    return;
  }

  const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

  if (files.length === 0) {
    console.log('No image files found in /public/icons');
    return;
  }

  console.log(`Found ${files.length} images. Processing...`);

  for (const file of files) {
    const filePath = path.join(iconsDir, file);
    try {
      const image = await Jimp.read(filePath);
      console.log(`Processing: ${file}`);

      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        // Red, Green, Blue, Alpha
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];

        // Jika pixel ini mendekati warna hitam, buat transparan
        if (red < BLACK_THRESHOLD && green < BLACK_THRESHOLD && blue < BLACK_THRESHOLD) {
          this.bitmap.data[idx + 3] = 0; // Set Alpha ke 0 (transparan)
        }
      });

      // Simpan kembali sebagai PNG (karena JPG tidak mendukung transparan)
      const newFileName = file.replace(/\.(jpg|jpeg)$/i, '.png');
      const newFilePath = path.join(iconsDir, newFileName);
      
      await image.write(newFilePath);
      console.log(`✅ Saved transparent image: ${newFileName}`);
      
    } catch (err) {
      console.error(`❌ Failed to process ${file}:`, err.message);
    }
  }
  console.log('🎉 All done!');
}

removeBlackBackground();
