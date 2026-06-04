# ElSpa 개발 가이드 & 워크플로우

> ElSpa 프로젝트의 개발 표준, 히스토리 관리, 프롬프트 템플릿을 정의합니다.
> 이 문서를 따르면 일관된 품질의 코드와 상세한 기록을 유지할 수 있습니다.

---

## 📚 히스토리 관리 (history-workflow-book.md)

### 📋 기본 규칙

1. **절대 삭제하지 않음** — 모든 기록은 `>>` (append)만 사용
2. **Order 기반 관리** — 순차적 작업 번호로 추적
3. **상세한 기록** — 나중에 책 출판 가능한 수준의 documentation

### 📝 기록 형식

```markdown
## [YYYY-MM-DD HH:MM] Order: 000 - 작업 제목

**주제:** 한 줄 요약

### Plan
✅ 할 계획 항목 1
✅ 할 계획 항목 2
✅ 할 계획 항목 3

### Task 수행 내용

#### 섹션 1: 백엔드 구현
1. 파일명 (경로)
2. 파일명 (경로)

#### 섹션 2: 프론트엔드 구현
1. 파일명 (경로)
2. 파일명 (경로)

### Result
✅ **N개 파일 생성/수정 완료**
- 기능1 ✓
- 기능2 ✓
- 기능3 ✓

---
```

### 📊 항상 포함해야 할 항목

| 항목 | 설명 | 예시 |
|------|------|------|
| **주제** | 이번 작업의 핵심 | "드라이버 실시간 위치 추적" |
| **Plan** | 할 계획 (체크리스트) | "✅ WebSocket 구현, ✅ Leaflet 지도" |
| **Task** | 실제 수행 (상세 내용) | "백엔드 8개 파일 + 프론트엔드 5개 파일" |
| **Result** | 결과 요약 | "✅ 8개 파일 생성 완료" |
| **주요 파일** | 생성/수정된 파일 목록 | "location.py, RealtimeMap.tsx" |

### 🛠️ 기록 추가 방법

```bash
# 현재 작업을 히스토리에 추가
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
cat >> history-workflow-book.md << 'EOF'

## [$TIMESTAMP] Order: 000 - 작업 제목

**주제:** ...

### Plan
...

EOF
```

---

## 🎯 개발 워크플로우

### Phase 1: 요구사항 분석
```
사용자 요청 
  ↓
내용 정리 (한국어)
  ↓
파일 목록 식별
```

### Phase 2: 코드 구현
```
백엔드 코드 작성 (FastAPI)
  ↓
프론트엔드 코드 작성 (React/Next.js)
  ↓
통합 테스트
```

### Phase 3: 기록 & 배포
```
Git 커밋 (의미 있는 메시지)
  ↓
history-workflow-book.md 기록
  ↓
배포 (npm run build && npm run deploy)
```

---

## 💻 기술 스택

### 백엔드
- **프레임워크**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **데이터베이스**: PostgreSQL (Supabase)
- **실시간**: WebSocket
- **인증**: JWT

### 프론트엔드
- **프레임워크**: Next.js 16.2.4
- **UI 라이브러리**: React 19
- **상태 관리**: Zustand 5
- **스타일**: Tailwind CSS 4
- **언어**: TypeScript
- **지도**: Leaflet.js

### DevOps
- **빌드**: Turbopack (next build)
- **배포**: Cloudflare Pages / Vercel
- **버전 관리**: Git + GitHub

---

## 📁 파일 구조 (기본)

```
elspa/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              (홈 / 랜딩)
│   │   │   ├── admin/                (관리자 페이지)
│   │   │   ├── customer/             (고객 페이지)
│   │   │   ├── driver/               (드라이버 페이지)
│   │   │   ├── therapist/            (테라피스트 페이지)
│   │   │   └── layout.tsx
│   │   ├── components/               (재사용 컴포넌트)
│   │   ├── lib/                      (유틸리티)
│   │   └── hooks/                    (커스텀 훅)
│   ├── public/
│   │   ├── plaza-logo.svg            (로고)
│   │   ├── icon-*.png                (웹앱 아이콘)
│   │   └── manifest.json             (PWA 설정)
│   ├── package.json
│   └── next.config.js
│
├── app/                              (백엔드)
│   ├── models/                       (SQLAlchemy ORM)
│   ├── routers/                      (API 엔드포인트)
│   ├── schemas/                      (Pydantic)
│   └── services/                     (비즈니스 로직)
│
├── main.py                           (FastAPI 시작점)
├── history-workflow-book.md          (개발 히스토리) ⭐
├── CLAUDE.md                         (이 파일)
└── README.md

```

---

## 🎨 코드 작성 규칙

### 1️⃣ 파일명 (날짜 포함)
```
형식: YYYYMMDD-HHMM-<설명>.<확장자>
예시:
  - 20250518-1430-user-auth-api.ts
  - 20250518-1530-location-model.py
  - 20250518-1600-realtime-map.tsx
```

### 2️⃣ 주석 (요약 포함)
```typescript
// ============================================================
// 📌 함수명: getTherapistById
// 📋 목적: 테라피스트 ID로 상세 정보 조회
// 🔧 매개변수: therapistId (number)
// 📤 반환값: Therapist 객체
// 📅 작성일: 2025-05-18
// ============================================================
export async function getTherapistById(id: number) {
  // 구현...
}
```

### 3️⃣ 커밋 메시지
```
형식: <이모지> <작업명>: <설명>

예시:
  ✨ Feat: RealtimeMap 컴포넌트 추가
  🐛 Fix: leaflet SSR 이슈 해결
  📚 Docs: 히스토리 기록 업데이트
  🎨 Style: 색상 테마 통일
  ♻️  Refactor: 상태 관리 구조 개선
  ⚡ Perf: 번들 크기 최적화
```

### 4️⃣ 한국어 설명 (학생 관점)
```markdown
## 📚 코드 설명

이 코드는 **실시간 위치 공유** 기능을 구현합니다.

**1단계: WebSocket 연결**
- 클라이언트가 서버에 WebSocket 연결
- 드라이버의 위치 업데이트를 실시간으로 수신

**2단계: 위치 데이터 저장**
- Location 모델에 위도, 경도 저장
- 타임스탬프 기록

**3단계: 지도에 마커 표시**
- Leaflet으로 현재 위치 마커 표시
- 실시간 업데이트로 마커 이동
```

---

## 🚀 배포 가이드

### 개발 서버 시작
```bash
cd e:/elspa/frontend
npm run dev
# http://localhost:3000 에서 확인
```

### 프로덕션 빌드
```bash
npm run build
# .next/ 폴더에 최적화된 코드 생성
# 35/35 페이지 정적 생성 (약 30초)
```

### 배포
```bash
# 로컬에서 프로덕션 실행
npm run start

# 또는 Vercel/Cloudflare Pages에 자동 배포
git push origin main
# GitHub Action으로 자동 빌드 & 배포
```

---

## ✅ 체크리스트

### 새 기능 추가 시
- [ ] 요구사항 분석 완료
- [ ] 프론트엔드 & 백엔드 코드 작성
- [ ] TypeScript 타입 검사 통과 (`npm run build`)
- [ ] Git 커밋 (의미 있는 메시지)
- [ ] history-workflow-book.md 기록 추가
- [ ] 배포 완료

### 버그 수정 시
- [ ] 근본 원인 파악
- [ ] 수정 코드 작성 & 테스트
- [ ] Git 커밋 (`🐛 Fix: ...`)
- [ ] 히스토리 기록

### 코드 리뷰
- [ ] 주석이 명확한가?
- [ ] 변수명이 의미 있는가?
- [ ] 에러 처리가 있는가?
- [ ] 성능 최적화가 되었는가?

---

## 📞 문제 해결

### 빌드 에러
```bash
# 캐시 삭제
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### SSR 이슈
```typescript
// ❌ 안됨 (window is not defined)
import Leaflet from 'leaflet';

// ✅ 됨 (동적 임포트 + ssr: false)
const Map = dynamic(() => import('@/components/Map'), { ssr: false });
```

### TypeScript 에러
```bash
# @types 패키지 설치
npm install --save-dev @types/leaflet
```

---

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)

---

**최종 업데이트:** 2026-05-18  
**문서 버전:** 1.0  
**담당자:** jitnet57 (kang jichul)
