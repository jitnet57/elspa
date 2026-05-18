const fs = require('fs');
const path = require('path');

// 간단한 PNG 생성 함수 (최소 PNG 파일)
// ElSpa 로고 색상: 주황색 (#FF6B35)
function createSimplePNG(size) {
  // PNG 헤더
  const width = size;
  const height = size;

  // 간단한 그라디언트 PNG 생성 (주황색 -> 노란색)
  // 실제 프로덕션에서는 디자인팀의 고해상도 이미지를 사용해야 함
  const canvas = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // 그라디언트: 좌상단(주황색) -> 우하단(노란색)
      const r = Math.min(255, 255 * (x / width) + 200);
      const g = Math.min(255, 150 + 100 * (y / height));
      const b = Math.min(255, 50 + 100 * ((x + y) / (width + height)));
      const a = 255;

      canvas[idx] = r;
      canvas[idx + 1] = g;
      canvas[idx + 2] = b;
      canvas[idx + 3] = a;
    }
  }

  // 더 간단한 방법: 단색 PNG 생성
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 실제로는 sharp 라이브러리나 다른 PNG 생성 라이브러리를 사용하는 것이 낫지만,
  // 기본 설치되어 있지 않을 수 있으므로, 미리 만들어진 바이너리 사용
  // 여기서는 간단한 placeholder PNG를 base64로 생성

  // 1x1 orange PNG in base64 (확장 가능)
  const placeholderBase64 = {
    192: 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAACE4AAAhOAF2aqrRAAAA0ElEQVRoge3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4NcrXAAGJN3LdAAAAAElFTkSuQmCC',
    512: 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT/AAAACXBIWXMAACHaAAAh2gHgYoqNAAABL0lEQVR4nO3BMQEAAADCoPVPbQjfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4NcrXAAGJN3LdAAAAAElFTkSuQmCC'
  };

  return Buffer.from(placeholderBase64[size] || placeholderBase64[192], 'base64');
}

try {
  const publicDir = path.join(__dirname, 'public');

  // PWA 아이콘 생성
  const sizes = [192, 512];

  sizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(publicDir, filename);

    // 실제 아이콘은 sharp 라이브러리나 디자인 도구로 생성 필요
    // 여기서는 placeholder 생성
    const pngData = createSimplePNG(size);
    fs.writeFileSync(filepath, pngData);
    console.log(`✅ Created ${filename} (${size}x${size}px)`);
  });

  // Maskable icon (투명 배경)
  const maskableFilename = 'icon-maskable-192x192.png';
  const maskableFilepath = path.join(publicDir, maskableFilename);
  const maskableData = createSimplePNG(192);
  fs.writeFileSync(maskableFilepath, maskableData);
  console.log(`✅ Created ${maskableFilename}`);

  console.log('\n📌 중요: 이 아이콘들은 placeholder입니다.');
  console.log('   프로덕션 배포 전에 디자인팀으로부터 고해상도 PNG 아이콘을 받아서 교체하세요.');
  console.log('   - icon-192x192.png (192x192 pixels)');
  console.log('   - icon-512x512.png (512x512 pixels)');
  console.log('   - icon-maskable-192x192.png (마스크 가능 버전)');

} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
}
