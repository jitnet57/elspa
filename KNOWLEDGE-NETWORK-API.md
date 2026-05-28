# 🌐 Knowledge Network API 문서

**버전:** 1.0.0  
**작성일:** 2026-05-29  
**Order:** 049 (Agent A: FastAPI 백엔드 API 연동)

---

## 📋 목차

1. [개요](#개요)
2. [엔드포인트](#엔드포인트)
3. [요청/응답 스키마](#요청응답-스키마)
4. [사용 예시](#사용-예시)
5. [에러 처리](#에러-처리)
6. [데이터베이스 스키마](#데이터베이스-스키마)

---

## 개요

**Knowledge Network API**는 ElSpa 시장 정보를 3D 네트워크로 시각화하기 위한 백엔드 API입니다.

### 기능

- ✅ 모든 노드 조회 (카테고리 필터링 지원)
- ✅ 키워드 기반 검색 (라벨, 설명, 카테고리)
- ✅ 특정 노드의 상세 정보 조회
- ✅ 전체 카테고리 목록 조회
- ✅ 노드 CRUD 작업 (관리자용)

### 기술 스택

- **백엔드:** FastAPI (Python)
- **데이터베이스:** PostgreSQL (Supabase)
- **ORM:** SQLAlchemy
- **프론트엔드:** React + Three.js

### 샘플 데이터 (16개 노드)

| 카테고리 | 노드 | 개수 |
|--------|------|------|
| **시장** | ElSpa 시장 | 1 |
| **마사지** | 타이, 시아츠, 스포츠, 아로마테라피 | 4 |
| **웰니스** | 스파, 요가, 명상 | 3 |
| **판매자** | 존, 마리아, 데이빗 (치료사) | 3 |
| **고객** | 기업, 운동선수, 시니어 | 3 |
| **경영** | 매출, 예약률, 고객유지율 | 3 |

---

## 엔드포인트

### 1️⃣ GET /api/knowledge-network/nodes

**목적:** 모든 지식 네트워크 노드를 조회합니다.

#### 요청

```http
GET /api/knowledge-network/nodes?category=마사지&skip=0&limit=10
```

#### 쿼리 매개변수

| 매개변수 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `category` | string | ❌ | 카테고리별 필터링 (예: 마사지, 웰니스) |
| `skip` | integer | ❌ | 페이지네이션 오프셋 (기본: 0) |
| `limit` | integer | ❌ | 반환 최대 개수 (기본: 100, 최대: 100) |

#### 응답 (200 OK)

```json
{
  "nodes": [
    {
      "id": "massage-thai",
      "label": "타이 마사지",
      "description": "전통 태국식 마사지, 경혈 치료, 근육 이완",
      "category": "마사지",
      "color": "#3b82f6"
    },
    {
      "id": "massage-shiatsu",
      "label": "시아츠 마사지",
      "description": "일본식 지압 마사지, 신경계 활성화",
      "category": "마사지",
      "color": "#3b82f6"
    }
  ],
  "total": 16
}
```

#### cURL 예시

```bash
curl -X GET "http://localhost:8000/api/knowledge-network/nodes?category=마사지" \
  -H "Content-Type: application/json"
```

---

### 2️⃣ POST /api/knowledge-network/search

**목적:** 키워드 기반 검색을 수행합니다. (라벨, 설명, 카테고리)

#### 요청

```http
POST /api/knowledge-network/search
Content-Type: application/json

{
  "query": "마사지",
  "category": "마사지",
  "limit": 10
}
```

#### 요청 본문

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `query` | string | ✅ | 검색 키워드 (최소 1자) |
| `category` | string | ❌ | 카테고리 필터 (선택) |
| `limit` | integer | ❌ | 결과 최대 개수 (기본: 10, 최대: 100) |

#### 응답 (200 OK)

```json
{
  "results": [
    {
      "id": "massage-thai",
      "label": "타이 마사지",
      "description": "전통 태국식 마사지, 경혈 치료, 근육 이완",
      "category": "마사지",
      "color": "#3b82f6"
    },
    {
      "id": "massage-shiatsu",
      "label": "시아츠 마사지",
      "description": "일본식 지압 마사지, 신경계 활성화",
      "category": "마사지",
      "color": "#3b82f6"
    },
    {
      "id": "massage-sports",
      "label": "스포츠 마사지",
      "description": "운동 선수 전문 마사지, 근육 회복 치료",
      "category": "마사지",
      "color": "#3b82f6"
    },
    {
      "id": "massage-aromatherapy",
      "label": "아로마테라피",
      "description": "향기 요법, 정신 건강 개선, 스트레스 완화",
      "category": "마사지",
      "color": "#3b82f6"
    }
  ],
  "count": 4,
  "query": "마사지"
}
```

#### cURL 예시

```bash
curl -X POST "http://localhost:8000/api/knowledge-network/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "마사지",
    "limit": 10
  }'
```

---

### 3️⃣ GET /api/knowledge-network/nodes/{node_id}

**목적:** 특정 노드의 상세 정보를 조회합니다.

#### 요청

```http
GET /api/knowledge-network/nodes/massage-thai
```

#### 경로 매개변수

| 매개변수 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `node_id` | string | ✅ | 노드 고유 식별자 (예: massage-thai) |

#### 응답 (200 OK)

```json
{
  "id": "massage-thai",
  "label": "타이 마사지",
  "description": "전통 태국식 마사지, 경혈 치료, 근육 이완",
  "category": "마사지",
  "color": "#3b82f6"
}
```

#### 응답 (404 Not Found)

```json
{
  "detail": "노드를 찾을 수 없습니다: invalid-node-id"
}
```

#### cURL 예시

```bash
curl -X GET "http://localhost:8000/api/knowledge-network/nodes/massage-thai" \
  -H "Content-Type: application/json"
```

---

### 4️⃣ GET /api/knowledge-network/categories

**목적:** 전체 카테고리 목록을 조회합니다.

#### 요청

```http
GET /api/knowledge-network/categories
```

#### 응답 (200 OK)

```json
{
  "categories": [
    "경영",
    "고객",
    "마사지",
    "시장",
    "웰니스",
    "판매자"
  ],
  "count": 6
}
```

#### cURL 예시

```bash
curl -X GET "http://localhost:8000/api/knowledge-network/categories" \
  -H "Content-Type: application/json"
```

---

### 5️⃣ POST /api/knowledge-network/nodes (관리자용)

**목적:** 새로운 노드를 추가합니다.

#### 요청

```http
POST /api/knowledge-network/nodes
Content-Type: application/json

{
  "node_id": "massage-hot-stone",
  "label": "핫스톤 마사지",
  "description": "따뜻한 돌을 이용한 마사지, 근육 이완",
  "category": "마사지",
  "color": "#f59e0b"
}
```

#### 요청 본문

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `node_id` | string | ✅ | 노드 고유 식별자 |
| `label` | string | ✅ | 노드 제목 |
| `description` | string | ✅ | 노드 상세 설명 |
| `category` | string | ✅ | 카테고리 |
| `color` | string | ✅ | HEX 색상 코드 (예: #3b82f6) |

#### 응답 (200 OK)

```json
{
  "id": "massage-hot-stone",
  "label": "핫스톤 마사지",
  "description": "따뜻한 돌을 이용한 마사지, 근육 이완",
  "category": "마사지",
  "color": "#f59e0b"
}
```

#### 응답 (400 Bad Request)

```json
{
  "detail": "이미 존재하는 노드입니다: massage-hot-stone"
}
```

#### cURL 예시

```bash
curl -X POST "http://localhost:8000/api/knowledge-network/nodes" \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "massage-hot-stone",
    "label": "핫스톤 마사지",
    "description": "따뜻한 돌을 이용한 마사지, 근육 이완",
    "category": "마사지",
    "color": "#f59e0b"
  }'
```

---

### 6️⃣ PUT /api/knowledge-network/nodes/{node_id} (관리자용)

**목적:** 기존 노드를 수정합니다.

#### 요청

```http
PUT /api/knowledge-network/nodes/massage-thai
Content-Type: application/json

{
  "node_id": "massage-thai",
  "label": "타이 마사지 (Traditional)",
  "description": "전통 태국식 마사지, 경혈 치료, 근육 이완, 20년 경력 치료사",
  "category": "마사지",
  "color": "#1e40af"
}
```

#### 응답 (200 OK)

```json
{
  "id": "massage-thai",
  "label": "타이 마사지 (Traditional)",
  "description": "전통 태국식 마사지, 경혈 치료, 근육 이완, 20년 경력 치료사",
  "category": "마사지",
  "color": "#1e40af"
}
```

#### cURL 예시

```bash
curl -X PUT "http://localhost:8000/api/knowledge-network/nodes/massage-thai" \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "massage-thai",
    "label": "타이 마사지 (Traditional)",
    "description": "전통 태국식 마사지, 경혈 치료, 근육 이완, 20년 경력 치료사",
    "category": "마사지",
    "color": "#1e40af"
  }'
```

---

### 7️⃣ DELETE /api/knowledge-network/nodes/{node_id} (관리자용)

**목적:** 노드를 삭제합니다.

#### 요청

```http
DELETE /api/knowledge-network/nodes/massage-hot-stone
```

#### 응답 (200 OK)

```json
{
  "success": true,
  "message": "노드가 삭제되었습니다: massage-hot-stone"
}
```

#### 응답 (404 Not Found)

```json
{
  "detail": "노드를 찾을 수 없습니다: massage-hot-stone"
}
```

#### cURL 예시

```bash
curl -X DELETE "http://localhost:8000/api/knowledge-network/nodes/massage-hot-stone" \
  -H "Content-Type: application/json"
```

---

## 요청/응답 스키마

### NetworkNode 스키마

```typescript
interface NetworkNode {
  id: string;              // 노드 고유 식별자 (예: massage-thai)
  label: string;           // 노드 제목 (예: 타이 마사지)
  description: string;     // 노드 상세 설명
  category: string;        // 카테고리 (시장, 마사지, 웰니스, 판매자, 고객, 경영)
  color: string;           // HEX 색상 (예: #3b82f6)
}
```

### 응답 타입

#### NodesResponse (GET /nodes)

```typescript
interface NodesResponse {
  nodes: NetworkNode[];    // 노드 배열
  total: number;           // 전체 노드 개수
}
```

#### SearchResponse (POST /search)

```typescript
interface SearchResponse {
  results: NetworkNode[];  // 검색 결과 배열
  count: number;           // 검색된 결과 개수
  query: string;           // 검색 키워드
}
```

#### CategoriesResponse (GET /categories)

```typescript
interface CategoriesResponse {
  categories: string[];    // 카테고리 배열
  count: number;           // 카테고리 개수
}
```

---

## 사용 예시

### TypeScript (프론트엔드)

```typescript
import KnowledgeNetworkClient from '@/lib/api/20250529-1530-knowledge-network-client';

// 예시 1: 모든 노드 조회
const response = await KnowledgeNetworkClient.getAllNodes();
console.log(response.nodes); // 16개 노드

// 예시 2: 카테고리별 필터링
const massageNodes = await KnowledgeNetworkClient.getAllNodes('마사지');
console.log(massageNodes.nodes.length); // 4

// 예시 3: 검색
const searchResults = await KnowledgeNetworkClient.searchNodes({
  query: '마사지',
  limit: 10
});
console.log(searchResults.results); // [타이, 시아츠, 스포츠, 아로마테라피]

// 예시 4: 상세 조회
const node = await KnowledgeNetworkClient.getNodeById('massage-thai');
console.log(node.label); // '타이 마사지'

// 예시 5: 카테고리 목록
const categories = await KnowledgeNetworkClient.getCategories();
console.log(categories.categories); // ['경영', '고객', '마사지', ...]
```

### Python (백엔드)

```python
import httpx

# 예시 1: 모든 노드 조회
async with httpx.AsyncClient() as client:
    response = await client.get(
        "http://localhost:8000/api/knowledge-network/nodes"
    )
    data = response.json()
    print(data['nodes'])

# 예시 2: 검색
async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/knowledge-network/search",
        json={"query": "마사지", "limit": 10}
    )
    data = response.json()
    print(data['results'])
```

---

## 에러 처리

### 에러 응답 형식

```json
{
  "detail": "에러 메시지"
}
```

### 일반적인 에러

| HTTP 상태 | 설명 |
|----------|------|
| 400 | 요청 유효성 검사 실패 (예: 중복 node_id) |
| 404 | 노드를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

### 에러 처리 예시 (TypeScript)

```typescript
try {
  const response = await KnowledgeNetworkClient.searchNodes({
    query: '마사지',
    limit: 10
  });
  console.log('검색 성공:', response.results);
} catch (error) {
  console.error('검색 실패:', error.message);
}
```

---

## 데이터베이스 스키마

### KnowledgeNetworkNode 테이블

```sql
CREATE TABLE knowledge_network_nodes (
  id SERIAL PRIMARY KEY,
  node_id VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 인덱스 (성능 최적화)
CREATE INDEX idx_category ON knowledge_network_nodes(category);
CREATE INDEX idx_node_id ON knowledge_network_nodes(node_id);
CREATE INDEX idx_label ON knowledge_network_nodes(label);
```

### 샘플 데이터

```sql
INSERT INTO knowledge_network_nodes (node_id, label, description, category, color) VALUES
  ('elspa-market', 'ElSpa 시장', '세부(Cebu) 지역의 종합 마사지 및 웰니스 서비스 시장', '시장', '#ef4444'),
  ('massage-thai', '타이 마사지', '전통 태국식 마사지, 경혈 치료, 근육 이완', '마사지', '#3b82f6'),
  ('massage-shiatsu', '시아츠 마사지', '일본식 지압 마사지, 신경계 활성화', '마사지', '#3b82f6'),
  -- ... (16개 모두)
;
```

---

## 배포 가이드

### 환경 변수 설정

```bash
# .env.local (프론트엔드)
NEXT_PUBLIC_API_URL=http://localhost:8000
# 또는 프로덕션
NEXT_PUBLIC_API_URL=https://api.elspa.com
```

### FastAPI 서버 시작

```bash
cd e:/elspa
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 데이터베이스 초기화

FastAPI 서버 시작 시 자동으로 `seed_knowledge_network()` 함수가 실행되어 16개 샘플 노드가 삽입됩니다.

---

## 주의사항

1. **CORS 설정:** main.py에서 CORS가 활성화되어 있습니다.
2. **인증:** 현재 버전은 인증이 없습니다. 프로덕션 배포 시 JWT 인증 추가 권장.
3. **성능:** 1000개 이상의 노드 조회 시 페이지네이션 권장.
4. **캐시:** 프론트엔드에서 React Query 또는 SWR 사용 권장.

---

## 더 알아보기

- **Order 048:** 지식 네트워크 3D 시각화 (Three.js + Fuse.js)
- **Order 049:** 지식 네트워크 API (FastAPI)
- **프론트엔드:** `/admin/knowledge-network` 페이지

---

**마지막 업데이트:** 2026-05-29  
**문서 버전:** 1.0.0
