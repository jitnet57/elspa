// Convert SVG to PNG icons
const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise provide instructions
try {
  const sharp = require('sharp');

  const sizes = [192, 512];
  const logoPath = path.join(__dirname, 'public', 'plaza-logo.svg');

  sizes.forEach(size => {
    sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'public', `icon-${size}x${size}.png`))
      .then(info => console.log(`✅ Created icon-${size}x${size}.png`))
      .catch(err => console.error(`Error creating ${size}x${size}:`, err));

    // Maskable variant
    sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'public', `icon-maskable-${size}x${size}.png`))
      .then(info => console.log(`✅ Created icon-maskable-${size}x${size}.png`))
      .catch(err => console.error(`Error creating maskable ${size}x${size}:`, err));
  });
} catch (error) {
  console.error('sharp not installed. Installing...');
  console.log('Run: npm install sharp');
}