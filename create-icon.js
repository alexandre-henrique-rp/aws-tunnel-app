const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public/assets/touch-icon-iphone-114-smile.png');
const outputPath = path.join(__dirname, 'public/assets/icon-256x256.png');

// Redimensionar para 256x256
sharp(inputPath)
  .resize(256, 256, {
    fit: 'contain',
    background: { r: 255, g: 153, b: 0, alpha: 1 } // AWS Orange background
  })
  .toFile(outputPath)
  .then(() => {
    console.log('Created icon-256x256.png');
  })
  .catch(err => {
    console.error('Error creating icon:', err);
    process.exit(1);
  });
