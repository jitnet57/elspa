# ELSPA Manager - 개발 히스토리 & 워크플로우

## 프로젝트 개요

**프로젝트명**: ElSpa Manager (스파/마사지 업체 관리 시스템)  
**목표**: 25개 페이지의 완전한 spa 관리 플랫폼 MVP 구축  
**기술스택**: 
- Frontend: React 19, TypeScript, Next.js 16.2.4, Zustand 5, Tailwind CSS 4
- Deployment: Cloudflare Pages (정적 export)
- Database: PostgreSQL + Supabase (준비 중)
- API: FastAPI, Claude API (매칭 엔진용)

---

## 작업 진행 요약

### Session 1: 테라피스트 일일 스케줄 페이지 구현
**요청**: 제공된 이미지 UI를 기반으로 일일 스케줄 페이지 구현

**완료 사항**:
- `/admin/therapist-schedule/page.tsx` 신규 생성
- 시간 그리드 (09:00~21:00, 100px/시간)
- 8명 테라피스트 Mock 데이터
- 세션 CRUD (추가/수정/삭제)
- 모달 기반 상세 정보 보기

### Session 2: 랜딩페이지 + 어드민 재구축
**요청**: "기본적 랜딩페이지는 카운터 모니터만 보이게" + "어드민 클릭시 어드민 로그인 업체관리 테라피스트 관리"

**완료 사항**:
- `/page.tsx` 새로 생성: Monitor/Admin 선택 카드
- `/admin/page.tsx`: 로그인 + 메뉴 대시보드 (Glassmorphism 디자인)
- 모바일 반응형 (sm: lg: 브레이크포인트)
- 스티키 헤더 + 바텀 탭 네비게이션

### Session 3: 모바일 최적화
**요청**: "모바일 화면에 최적화 되도록 화면 구성좀 해줘"

**완료 사항**:
- 반응형 텍스트 크기 (sm: lg: 수정자)
- 터치 최적화 (버튼 44px 최소)
- fixed 헤더/탭 + sticky 요소 활용
- 375px 모바일 프레임에 최적화

### Session 4: 모니터 듀얼 모드
**요청**: "모니터 사이트에 테라피스트 일일스케줄 모드와 베드실시간 모드 두가지 선택" + "스케줄 모드에는 새 테라피스트 등록 비활성화"

**완료 사항**:
- `/monitor/page.tsx` 수정: viewMode 상태 추가 (beds | schedule)
- 상단 탭 전환 UI
- 조건부 렌더링 (viewMode === 'schedule' && ...)
- 파란색 테마 일관성 유지 (bg-blue-900/30)

### Session 5: 실제 데이터 적용 (시뮬레이션 중단)
**요청**: "이제 시뮬레이션 하지마" + "테스트를 위해서 하지만 실시간 모니터에서는 시뮬레이션을 우리가 수동으로 직접 테스트할꺼야"

**완료 사항**:
- `/lib/data/beds.ts` 생성: 86개 하드코딩 침대
- `/lib/data/therapists.ts` 생성: 60명 가상 테라피스트
- `/seed.ts` 생성: Supabase 초기 데이터
- Mock API Adapter 업데이트: REAL_BEDS + REAL_THERAPISTS 사용

**결과**: npm run build 성공 → 27/27 페이지 정적 생성

### Session 6: 모바일 UI 미리보기 + 히스토리 문서화
**요청**: "모바일 화면 코드에 반영하지 말고 브라우져로 어져스트해서 보여줘" + "지금까지의 채팅 및 프롬프트를 history-workflow-book.md에 담아줘"

**현재 진행**:
- `mobile-preview.html` 생성: 375x812 프레임의 4페이지 미리보기
- `history-workflow-book.md` 작성: 전체 개발 히스토리

---

## 기술 아키텍처

### 상태 관리 (Zustand)
```typescript
const useStore = create((set) => ({
  beds: [],
  therapists: [],
  selectedBedId: null,
  openDetailModal: (id) => set({ selectedBedId: id }),
}));
```

### 데이터 폴링 (React Query - 5초)
```typescript
useQuery({
  queryKey: ['beds'],
  queryFn: async () => await apiClient.getBeds(),
  refetchInterval: 5000,
  staleTime: 3000,
});
```

### 조건부 렌더링 (모드 기반)
```tsx
{viewMode === 'beds' && <BedMonitorUI />}
{viewMode === 'schedule' && <ScheduleGridUI />}
```

### 시간 그리드 (절대 위치)
```typescript
const START_HOUR = 9, END_HOUR = 21, COLUMN_WIDTH = 100;
const left = (session.startHour - START_HOUR) * COLUMN_WIDTH;
const width = (session.endHour - session.startHour) * COLUMN_WIDTH;
```

---

## 파일 구조

```
elspa/
├── frontend/src/
│   ├── app/
│   │   ├── page.tsx                    (랜딩 - Monitor/Admin 카드)
│   │   ├── monitor/page.tsx            (모니터 - 듀얼 모드)
│   │   ├── admin/
│   │   │   ├── page.tsx                (어드민 대시보드)
│   │   │   ├── therapists/page.tsx     (테라피스트 관리)
│   │   │   └── therapist-schedule/page.tsx (일일 스케줄)
│   │   ├── customer/                   (고객 페이지 5개)
│   │   └── ... (기타 14개 페이지)
│   ├── lib/
│   │   ├── api/mock-adapter.ts         (API 시뮬레이션 - 실제 데이터 사용)
│   │   ├── data/
│   │   │   ├── beds.ts                 (86개 침대 하드코딩)
│   │   │   └── therapists.ts           (60명 테라피스트 생성)
│   │   └── store/store.ts              (Zustand)
│   ├── hooks/
│   │   ├── useMonitorPolling.ts
│   │   ├── useGetBeds.ts
│   │   └── useGetTherapists.ts
│   └── components/
│       ├── NotificationCenter.tsx
│       ├── WalkInBookingModal.tsx
│       └── MobileBottomTabBar.tsx
│
├── seed.ts                             (Supabase 초기 데이터)
├── mobile-preview.html                 (모바일 UI 미리보기)
└── history-workflow-book.md            (이 문서)
```

---

## Build 결과

```
✓ Compiled successfully in 45s
✓ Finished TypeScript in 31.5s
✓ Generating static pages using 7 workers (27/27) in 3.8s

생성 페이지:
- / (홈)
- /admin (어드민 - 로그인)
- /admin/therapist-schedule (일일 스케줄) ★
- /monitor (모니터 - 듀얼 모드) ★
- /customer/* (5개 고객 페이지)
- 및 기타 14개 페이지

모두 정적 export로 Cloudflare Pages 배포 준비 완료
```

---

## 주요 결정 사항

1. **모바일 우선 설계**: 스파 직원들은 태블릿/모바일로 접근
2. **시뮬레이션 제거**: 사용자 수동 테스트 원함 (자동화 불가)
3. **실제 데이터**: 86개 침대 + 60명 테라피스트 하드코딩
4. **8명 vs 60명**: 스케줄 표시는 8명 (성능) + API는 60명 (범용)
5. **타입 변환**: convertToTherapist() 헬퍼로 Frontend ↔ API 호환성 유지

---

**최종 상태**: Phase 5 완료 → 모바일 UI 검수 대기 중


---

## Session 7: El Plaza 전문가 브랜딩 & 프로덕션 빌드 완료

### 📋 요청사항
```
사용자: "위 이미지를 다 적용해 / 단지 사이즈와 그래픽 타입만 맞춰줘"
(El Plaza 우아한 로고 이미지 제시)
```

### ✅ 완료 사항

#### 1️⃣ El Plaza 로고 리디자인
**파일**: `frontend/public/plaza-logo.svg`
- **이전**: 단순한 "EL" 텍스트
- **이후**: 전문가 수준의 원형 로고
  - 외부 테두리: 검은색 얇은 선 (1px)
  - 내부 테두리: 황금색 (#c9a961) 장식 선
  - 중앙: 우아한 "EL" 텍스트 (Georgia serif, 황금색)
  - 상단: "RESTAURANT · SKIN · SPATEL · NAIL CARE COFFEE"
  - 하단: "PLAZA"
  - 서비스 아이콘: 좌우 구분선 ("|")

#### 2️⃣ PNG 아이콘 재생성 (4종류)
**도구**: `frontend/convert-svg.js` (sharp 라이브러리)

| 아이콘 | 크기 | 용도 |
|--------|------|------|
| `icon-192x192.png` | 192×192 | 홈 화면 + 브라우저 탭 |
| `icon-512x512.png` | 512×512 | 스플래시 화면 + 큰 디스플레이 |
| `icon-maskable-192x192.png` | 192×192 | 적응형 아이콘 (원형/동적) |
| `icon-maskable-512x512.png` | 512×512 | 적응형 아이콘 (PWA 설치) |

#### 3️⃣ PWA 매니페스트 업데이트
**파일**: `frontend/public/manifest.json`
- theme_color: #d4af37 (황금색)
- 모든 아이콘 설정 업데이트

#### 4️⃣ 메타데이터 동기화
**파일**: `frontend/src/app/layout.tsx`
- title, description, manifest 업데이트

### 🔧 빌드 문제 해결

#### 문제 1: Leaflet 타입 에러
**해결**: npm install --save-dev @types/leaflet

#### 문제 2: RealtimeMap SSR 이슈
**원인**: leaflet이 window 객체 접근 시도 (SSR 중엔 undefined)
**해결**: 동적 임포트 + ssr: false 적용

```typescript
const RealtimeMap = dynamic(
  () => import('@/components/RealtimeMap').then(m => ({ default: m.RealtimeMap })),
  { ssr: false }
);
```

**수정 파일**:
- frontend/src/app/admin/realtime-locations/page.tsx
- frontend/src/app/customer/driver-tracking/page.tsx
- frontend/src/app/driver/customer-locations/page.tsx
- frontend/src/app/therapist/customer-locations/page.tsx

### 📊 빌드 결과

```
✓ npm run build 성공
✓ Compiled successfully in 30.9s
✓ Generating static pages (35/35) ✓
```

### 📌 Git 커밋

```bash
commit 4c16de2
Message: 🎨 Update El Plaza logo with elegant professional design

commit [LATEST]
Message: 🔧 Fix: Dynamic import for RealtimeMap to resolve SSR window issue + @types/leaflet
```

### 🚀 배포 완료

**배포된 기능**:
- ✅ El Plaza 전문가 로고 (원형, 황금색, 우아한 디자인)
- ✅ 4가지 아이콘 (표준 + 적응형)
- ✅ PWA 설치 지원
- ✅ 모든 페이지 영어 표시
- ✅ 필리핀 로컬라이제이션

**최종 상태**: Phase 6 완료 → 프로덕션 배포 준비 완료 ✨

