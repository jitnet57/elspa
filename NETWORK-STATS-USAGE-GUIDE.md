# 네트워크 통계 위젯 & 차트 사용 가이드

> 관리자 대시보드용 네트워크 분석 시각화 컴포넌트 (1055줄, 12+ 차트)

---

## 📁 생성된 파일 (3개)

### 1. `frontend/src/components/20250529-2100-network-stats-widgets.tsx` (367줄)
**목적:** 통계 카드 4개 및 추가 지표 표시

**주요 컴포넌트:**
- `StatCard` — 단일 통계 카드 (아이콘 + 숫자 + 미니 차트 + 트렌드)
- `NetworkStatsWidgets` — 4개 카드 그룹

**카드 내용:**
1. **총 노드 수** — 200+ 개 (12.5% 증가, 면적 차트)
2. **총 연결선 수** — 350+ 개 (8.3% 증가, 선 차트)
3. **평균 중심성** — 0.65점 (5.2% 증가, 면적 차트)
4. **클러스터 수** — 5개 (3.1% 감소, 막대 차트)

**추가 섹션:**
- 네트워크 밀도 진행바 (0~1 범위)
- 중심 노드 순위 (상위 5개)
- 주요 지표 4개 (차수, 지름, 경로 길이, 집중화)

---

### 2. `frontend/src/components/20250529-2100-network-charts.tsx` (369줄)
**목적:** Recharts 기반 6개 시각화 차트

**차트 목록:**
1. **노드 카테고리 분포** (파이 차트)
   - 치료사 (22%), 고객 (38%), 드라이버 (15%), 관리자 (13%), 파트너 (12%)

2. **관계 타입별 강도** (수평 막대)
   - 직업, 거래, 협력, 추천, 기타 관계의 강도와 빈도

3. **시간별 네트워크 변화** (다중 선 그래프)
   - 5주간 노드 수, 연결선 수, 밀도 추이

4. **중심성 순위** (수평 막대)
   - 상위 6개 노드의 중심성 점수와 차수

5. **클러스터 분포** (막대 차트)
   - 5개 클러스터의 노드 수와 연결선 수

6. **모듈성 점수** (막대 차트)
   - 각 클러스터의 커뮤니티 검출 품질

**추가 섹션:**
- 네트워크 메트릭 요약 (4개 지표)
- 주요 발견사항 (4개 항목)

---

### 3. `frontend/src/hooks/20250529-2100-useNetworkStats.ts` (319줄)
**목적:** 통계 데이터 로드 및 상태 관리

**기능:**
- **Zustand 스토어** — 글로벌 상태 관리
  - `stats` — 현재 통계 데이터
  - `historicalData` — 30일 이력
  - `isLoading`, `error` — 로딩/에러 상태
  - `lastFetchTime` — 캐시 시간

- **자동 갱신** — 30초 TTL
  ```typescript
  const { stats, historicalData, isLoading, error, refetch } = useNetworkStats();
  // 자동으로 30초마다 갱신, refetch() 호출 시 즉시 갱신
  ```

- **API 통합 준비**
  ```typescript
  // 현재: 모의 데이터
  // TODO: 주석 처리된 부분 활성화
  const response = await fetch('/api/network/stats');
  const data = await response.json();
  ```

- **유틸리티 함수 5개**
  - `calculateNetworkDensity()` — 밀도 계산
  - `calculateAverageDegree()` — 평균 차수
  - `normalizeCentrality()` — 중심성 정규화
  - `calculateGrowthRate()` — 성장률
  - `generateMockStats()` — 모의 데이터

---

## 🚀 사용 방법

### 1️⃣ 관리자 대시보드에 임포트

```typescript
// app/admin/dashboard/page.tsx
import { NetworkStatsWidgets } from '@/components/20250529-2100-network-stats-widgets';
import { NetworkCharts } from '@/components/20250529-2100-network-charts';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <NetworkStatsWidgets />
      <NetworkCharts />
    </div>
  );
}
```

### 2️⃣ 커스텀 훅 사용

```typescript
'use client';

import { useNetworkStats } from '@/hooks/20250529-2100-useNetworkStats';

export function MyComponent() {
  const { stats, historicalData, isLoading, error, refetch } = useNetworkStats();

  return (
    <div>
      {isLoading && <p>로딩 중...</p>}
      {error && <p>에러: {error}</p>}
      {stats && (
        <>
          <h2>총 노드: {stats.totalNodes}</h2>
          <button onClick={() => refetch()}>새로고침</button>
        </>
      )}
    </div>
  );
}
```

### 3️⃣ 자동 갱신 비활성화

```typescript
// 자동 갱신 없이 수동 갱신만 사용
const { stats, refetch } = useNetworkStats(false);

// 필요할 때만 갱신
<button onClick={() => refetch()}>데이터 갱신</button>
```

---

## 📊 데이터 구조

### NetworkStats 타입
```typescript
interface NetworkStats {
  totalNodes: number;              // 총 노드 수
  totalEdges: number;              // 총 연결선 수
  networkDensity: number;          // 0~1
  averageCentrality: number;       // 평균 중심성
  averageDegree: number;           // 평균 차수
  diameter: number;                // 네트워크 지름
  averagePathLength: number;       // 평균 경로 길이
  clusteringCoefficient: number;   // 집중화 계수
  clusterCount: number;            // 클러스터 수
  topCentralityNodes: Array<{      // 상위 중심 노드
    id: string;
    centrality: number;
    degree: number;
  }>;
  modularity: number;              // 모듈성 점수
  connectedComponents: number;     // 연결 요소 수
  timestamp: number;               // 데이터 시간
}
```

### HistoricalDataPoint 타입
```typescript
interface HistoricalDataPoint {
  timestamp: number;        // Unix timestamp
  date: string;             // 포맷: "2025-05-29"
  nodes: number;            // 해당 일자의 노드 수
  edges: number;            // 해당 일자의 연결선 수
  density: number;          // 해당 일자의 밀도
  averageCentrality: number;// 해당 일자의 평균 중심성
}
```

---

## 🎨 스타일링 (Tailwind CSS 4)

모든 컴포넌트는 Tailwind를 사용합니다.

**색상 팔레트:**
- **파란색:** `#3b82f6` (주요)
- **초록색:** `#10b981` (성공)
- **주황색:** `#f59e0b` (경고)
- **빨강색:** `#ef4444` (위험)
- **보라색:** `#8b5cf6` (강조)
- **분홍색:** `#ec4899` (보조)

**반응형 레이아웃:**
```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-4  /* 모바일→태블릿→데스크톱 */
```

---

## 🔌 백엔드 API 연동

### 엔드포인트 (준비됨)
```
GET /api/network/stats

응답:
{
  "stats": { /* NetworkStats */ },
  "historicalData": [ /* HistoricalDataPoint[] */ ]
}
```

### 활성화 방법

`frontend/src/hooks/20250529-2100-useNetworkStats.ts` 파일에서:

```typescript
// 현재 (모의 데이터)
const mockStats = generateMockStats();
actions.setStats(mockStats);

// 변경할 부분 (실제 API)
const response = await fetch('/api/network/stats', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
});
if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
const data = await response.json();
actions.setStats(data.stats);
actions.setHistoricalData(data.historicalData);
```

---

## ⚡ 성능 최적화

1. **메모이제이션** — `useMemo` 사용
2. **동적 로딩** — Recharts 차트 자동 최적화
3. **캐싱** — 30초 TTL (설정 가능)
4. **Skeleton UI** — 로딩 중 `animate-pulse`

---

## 🐛 트러블슈팅

### 차트가 표시되지 않음
```typescript
// ResponsiveContainer 높이 확인
<div className="w-full h-80">  {/* 높이 필수 */}
  <ResponsiveContainer width="100%" height="100%">
    {/* ... */}
  </ResponsiveContainer>
</div>
```

### 타입 에러
```bash
npm install --save-dev @types/recharts
npm install zustand
```

### 데이터 업데이트 안 됨
```typescript
// 캐시 무효화 후 갱신
const { refetch } = useNetworkStats();
refetch();  // 강제 갱신
```

---

## 📝 다음 단계

1. **백엔드 구현**
   - `/api/network/stats` 엔드포인트
   - 실제 네트워크 통계 계산

2. **실시간 업데이트**
   - WebSocket 연동
   - 5초 단위 실시간 갱신 (옵션)

3. **다크 모드**
   - Tailwind dark: 클래스 추가
   - 차트 색상 조정

4. **대시보드 통합**
   - 레이아웃 구성
   - 필터 및 드릴다운 기능

5. **내보내기**
   - CSV/PDF 다운로드 기능
   - 이메일 리포트

---

## 📞 참고 자료

- **Recharts 문서:** https://recharts.org/
- **Zustand 문서:** https://github.com/pmndrs/zustand
- **Tailwind CSS:** https://tailwindcss.com/
- **Next.js 16:** https://nextjs.org/docs

---

**작성일:** 2025-05-29
**버전:** 1.0
**상태:** 모의 데이터 준비 완료, API 연동 대기
