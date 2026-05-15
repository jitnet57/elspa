# ElSpa Manager - Cloudflare Pages 배포 가이드

## 📋 최종 성공 설정

**배포 완료!** ✅ 다음은 성공하기까지의 시행착오와 최종 해결책입니다.

---

## 🚨 시행착오 분석

### 1차 실패: Cloudflare Workers 선택

**문제:**
```
❌ Workers는 serverless 함수용 플랫폼
❌ Next.js 정적 배포에 부적합
❌ @cloudflare/next-on-workers 패키지 부재
```

**원인:**
- Workers와 Pages는 완전히 다른 목적
- Pages: 정적 사이트/SSG 전용
- Workers: API 라우트/엣지 함수 전용

**해결:**
→ **Cloudflare Pages로 전환** (Next.js SSG 최적화)

---

### 2차 실패: .next 디렉토리 직접 배포

**로그:**
```
HTTP ERROR 404
페이지를 찾을 수 없음 (elspa.pages.dev)
```

**원인:**
```
.next/          ← Next.js 서버 구조 (Node.js 필요)
├── server/     ← 동적 렌더링 코드
├── static/     ← CSS, JS, images
└── ...
```

Pages는 `.next`를 인식할 수 없음 → 정적 HTML이 아니기 때문

**해결:**
→ **Next.js 정적 내보내기 활성화** (output: "export")

---

### 3차 실패: next.config.ts 설정 오류

**로그:**
```
Error: export const dynamic = "force-static"/export const revalidate 
not configured on route "/api/health" with "output: export"
```

**원인:**
```
API 라우트 (/api/health)는 동적 처리 필요
정적 내보내기 (output: export)와 호환 불가
```

**해결:**
→ **API 라우트 제거** (Cloudflare Pages는 순수 정적만 지원)
→ 백엔드 API는 별도 서버 필요

---

### 4차 실패: wrangler.toml 설정 오류

**로그:**
```
ERROR: Configuration file for Pages projects does not support "build"
- Unexpected fields found in build field: "watch_paths"
- The field "rules" should be an array...
```

**원인:**
```
Pages ≠ Workers
- Workers: wrangler.toml 사용 ([build] 섹션 지원)
- Pages: 대시보드 직접 설정 (wrangler.toml [build] 미지원)
```

**해결:**
→ **wrangler.toml 완전 제거**
→ **Pages 대시보드에서 직접 설정**

---

## ✅ 최종 성공 요소 (5가지 핵심)

### 1️⃣ Next.js 정적 내보내기 활성화

**파일:** `frontend/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ✅ 핵심: 정적 HTML로 내보내기
  output: "export",
  // ✅ 이미지 최적화 비활성화 (정적 배포용)
  images: {
    unoptimized: true,
  },
};
```

**효과:**
- `.next/` (서버 구조) → `out/` (정적 HTML 생성)
- 크기: 2.8MB (매우 작음)
- 24개 페이지 정적 생성

---

### 2️⃣ API 라우트 제거

**문제:**
```
src/app/api/health/route.ts         ← 동적 API
src/app/api/scheduler/.../route.ts  ← 동적 API
```

**해결:**
```bash
# API 라우트 디렉토리 완전 제거
rm -rf frontend/src/app/api/
```

**이유:**
- Cloudflare Pages = 순수 정적 파일만 서빙
- 동적 API는 별도 백엔드 필요 (Cloudflare Workers, Vercel Functions 등)

---

### 3️⃣ wrangler.toml 제거 & Pages 대시보드 설정

**실패했던 설정:**
```toml
# ❌ Pages가 [build] 섹션 미지원
[build]
command = "npm install..."
watch_paths = [...]  # ← 예상치 못한 필드
```

**성공한 설정:**
```
❌ wrangler.toml 제거 완료
✅ Cloudflare Pages 대시보드에서 직접 설정
```

**대시보드 설정값:**
| 항목 | 값 |
|------|-----|
| Build command | `npm install --prefix frontend && npm run build --prefix frontend` |
| Build output directory | `frontend/out` |
| Deploy command | **(비워두기 - 중요!)** |

---

### 4️⃣ 빌드 출력 디렉토리: `out/` 구조

**생성된 out/ 구조:**
```
frontend/out/           ← Cloudflare Pages 배포 소스
├── index.html          ← 루트 페이지
├── admin/
│   ├── billing.html
│   ├── companies.html
│   ├── matching.html
│   └── ...
├── customer/
│   ├── booking.html
│   └── ...
├── _next/              ← CSS, JS, images
│   ├── static/
│   └── ...
└── 404.html
```

**핵심:**
- 순수 HTML 파일 ✅
- JavaScript 정적 포함 ✅
- CSS 정적 포함 ✅
- 크기: 2.8MB (매우 효율적) ✅

---

### 5️⃣ 빌드 프로세스

```bash
# 1단계: 의존성 설치
npm install --prefix frontend

# 2단계: Next.js 빌드 + 정적 내보내기
npm run build --prefix frontend
# 결과: frontend/out/ 생성 (24개 정적 HTML)

# 3단계: Cloudflare Pages에 배포
# (대시보드에서 자동 배포 또는 수동 배포)
```

---

## 🎯 왜 이제 성공했나?

### 핵심 깨달음

```
❌ 처음: Cloudflare = 하나의 플랫폼으로 생각
         Workers와 Pages를 혼동

✅ 이제: Cloudflare = 여러 서비스의 조합
         - Pages: 정적 사이트/SSG (우리 선택)
         - Workers: API/엣지 함수 (별도 필요시)
```

### 최종 아키텍처

```
GitHub (소스코드)
    ↓
Cloudflare Pages (자동 배포)
    ↓
frontend/out/ (정적 HTML)
    ↓
CDN 배포 (전 세계 엣지)
    ↓
elspa.pages.dev ✅
```

---

## 📦 배포 결과

| 항목 | 결과 |
|------|------|
| **빌드 시간** | ~4-5초 |
| **생성 페이지** | 24개 정적 |
| **산출물 크기** | 2.8MB |
| **배포 시간** | 1-3분 |
| **배포 URL** | `https://elspa.pages.dev` |
| **성능** | ⚡ 매우 빠름 (CDN 캐싱) |
| **비용** | 💰 무료 (월 500배포) |

---

## 🚀 배포 후 설정

### Cloudflare Pages 대시보드

**프로젝트 settings → Build and deployments**

```
Build command:       npm install --prefix frontend && npm run build --prefix frontend
Build output dir:    frontend/out
Root directory:      /
Deploy command:      (비워두기)
```

**저장 후:**
- 자동 재배포 시작
- 1-3분 후 완료
- elspa.pages.dev 접속 가능

---

## 🔑 핵심 교훈 (최중요)

1. **Next.js SSG 배포는 정적 내보내기가 필수**
   ```typescript
   output: "export"  // ← 이 한 줄이 모든 것을 바꿈
   ```

2. **Cloudflare의 두 플랫폼 구분**
   - Pages: 정적/프론트엔드 (∴ 우리)
   - Workers: 동적/백엔드 (필요시 추가)

3. **API 라우트는 정적 배포 불가**
   - Cloudflare Pages로는 API 운영 불가
   - 백엔드는 별도 서버 필요

4. **wrangler.toml은 Workers용**
   - Pages는 대시보드 직접 설정
   - 설정 파일 불필요

5. **Deploy command는 비워두기**
   - Pages가 자동 배포 처리
   - 수동 deploy 명령 불필요

---

## 📞 다음 단계

### 프로덕션 최적화
- [ ] 커스텀 도메인 추가
- [ ] 캐싱 정책 설정
- [ ] 모니터링 활성화

### 백엔드 연결 (필요시)
- [ ] API 서버 별도 배포 (Cloudflare Workers / Vercel)
- [ ] 환경 변수 설정
- [ ] CORS 구성

### 모바일 최적화
- [ ] 실제 모바일에서 테스트
- [ ] InApp 브라우저 감지 확인
- [ ] 외부 링크 새 탭 열기 검증

---

## 참고 자료

- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/advanced-features/static-html-export)
- [Cloudflare Workers vs Pages](https://developers.cloudflare.com/workers/platform/limits/)
- [배포 로그](https://github.com/jitnet57/elspa)
