# ElSpa PWA 아이콘 가이드

## 필요한 아이콘 파일

다음 파일들을 `public/` 디렉토리에 추가하세요:

### 필수 파일

1. **icon-192x192.png** (192x192px)
   - 모바일 홈 화면 아이콘
   - 정사각형 PNG 포맷
   - 배경색: 흰색 또는 투명
   - 로고: ElSpa 브랜드 로고

2. **icon-512x512.png** (512x512px)
   - 스플래시 스크린 아이콘
   - 정사각형 PNG 포맷
   - 배경색: 흰색 또는 투명

3. **icon-maskable-192x192.png** (192x192px)
   - Maskable 아이콘 (iOS/Android 지원)
   - 정사각형 PNG 포맷
   - 안전 영역: 내부 20% 마진

4. **icon-maskable-512x512.png** (512x512px)
   - Maskable 아이콘 (대형)
   - 정사각형 PNG 포맷
   - 안전 영역: 내부 20% 마진

### 선택 사항

5. **screenshots/mobile-1.png** (540x720px)
   - 모바일 스크린샷 (세로 방향)
   - 앱 스토어 같은 화면

6. **screenshots/desktop-1.png** (1280x720px)
   - 데스크톱 스크린샷 (가로 방향)
   - 앱 스토어 같은 화면

## 브랜드 컬러

- **Primary**: #f97316 (오렌지)
- **Secondary**: #ea580c (진한 오렌지)
- **Background**: #ffffff (흰색)

## 생성 도구 권장사항

- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [Favicon Generator](https://favicon.io/)
- Adobe Illustrator / Figma

## 유의사항

- 모든 이미지는 PNG 포맷이어야 합니다
- 아이콘은 정사각형이어야 합니다
- 투명 배경을 사용할 경우 Maskable 버전 필수
- 로고는 명확하고 간단해야 합니다 (작은 크기에서도 인식 가능)

## 관련 파일

- `public/manifest.json` - PWA 설정 파일
- `public/service-worker.js` - 오프라인 지원 스크립트
- `src/app/pwa-init.tsx` - PWA 초기화 컴포넌트

## 추가 정보

PWA가 완전히 작동하려면:
1. ✅ manifest.json 존재 (완료)
2. ✅ Service Worker 등록 (완료)
3. ✅ HTTPS 사용 (프로덕션)
4. ❌ 아이콘 파일 추가 (이 가이드 참고)

모든 파일이 준비되면, 모바일/데스크톱에서 "홈 화면에 추가" 옵션이 나타납니다.
