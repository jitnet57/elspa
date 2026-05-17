import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');

// ElSpa 로고 색상: 주황색 그라디언트
async function generateIcon(size, maskable = false) {
  // SVG 기반 아이콘 생성
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      ${maskable ? '' : ''}
      <!-- 로고 텍스트 -->
      <text x="50%" y="50%" font-size="${size * 0.4}" font-weight="bold"
            fill="white" text-anchor="middle" dominant-baseline="central"
            font-family="Arial, sans-serif">✨</text>
    </svg>
  `;

  const filename = maskable
    ? `icon-maskable-${size}x${size}.png`
    : `icon-${size}x${size}.png`;

  const filepath = path.join(publicDir, filename);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(filepath);

  console.log(`✅ Created ${filename} (${size}x${size}px)`);
}

async function main() {
  try {
    // 아이콘 생성
    await generateIcon(192, false);
    await generateIcon(512, false);
    await generateIcon(192, true);

    console.log('\n✨ PWA 아이콘 생성 완료!');
    console.log('📁 위치: public/icon-*.png');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
