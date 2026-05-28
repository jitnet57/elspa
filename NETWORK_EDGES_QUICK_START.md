# Network Edges 빠른 시작 가이드 (Order 051)

## 🚀 초기 설정

### 1단계: 테이블 생성
```bash
python app/migrations/20250529_create_network_edges_table.py
```

**결과:**
```
✅ knowledge_network_edges 테이블이 생성되었습니다.
```

### 2단계: 샘플 데이터 마이그레이션
```bash
python -m app.scripts.seed_network_edges
```

**결과:**
```
============================================================
📊 네트워크 엣지 데이터 마이그레이션 시작
============================================================
✅ 성공: 12/12
❌ 실패: 0/12
📊 DB 현재 엣지 개수: 24 (양방향 포함)
↔️ 양방향 엣지 개수: 2
============================================================
```

### 3단계: 테스트 실행
```bash
pytest tests/test_network_edges.py -v
```

**결과:**
```
test_create_edge_simple PASSED
test_create_edge_bidirectional PASSED
test_create_edge_duplicate PASSED
test_get_edge_by_id PASSED
test_get_edges_by_source PASSED
test_get_edges_by_target PASSED
test_update_edge PASSED
test_delete_edge PASSED
test_search_edges PASSED
test_create_edges_batch PASSED
test_node_importance PASSED
test_edge_count_validation PASSED

============= 12 passed in 1.23s =============
```

---

## 📡 API 사용법

### 1. 엣지 추가 (단방향)

```bash
curl -X POST http://localhost:8000/api/network-edges \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": 1,
    "target_id": 2,
    "relationship_type": "제공",
    "strength": 5,
    "label": "제공",
    "description": "존이 타이 마사지를 제공합니다",
    "color": "#3b82f6",
    "is_bidirectional": false
  }'
```

**응답:**
```json
{
  "id": 1,
  "source_id": 1,
  "target_id": 2,
  "relationship_type": "제공",
  "strength": 5,
  "label": "제공",
  "is_bidirectional": false,
  "created_at": "2026-05-29T12:00:00.000Z"
}
```

### 2. 엣지 추가 (양방향)

```bash
curl -X POST http://localhost:8000/api/network-edges \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": 1,
    "target_id": 4,
    "relationship_type": "제휴",
    "strength": 4,
    "is_bidirectional": true
  }'
```

**결과:**
- ✅ 정방향 엣지 생성: 1 → 4 (id: 10, reverse_edge_id: 11)
- ✅ 역방향 엣지 자동 생성: 4 → 1 (id: 11, reverse_edge_id: 10)

### 3. 모든 엣지 조회

```bash
curl "http://localhost:8000/api/network-edges"
```

**응답:**
```json
{
  "edges": [
    {
      "id": 1,
      "source_id": 1,
      "target_id": 2,
      "relationship_type": "제공",
      "strength": 5,
      ...
    },
    ...
  ],
  "total": 24
}
```

### 4. 필터링 조회

```bash
# 출발 노드 기준
curl "http://localhost:8000/api/network-edges?source_id=1"

# 관계 유형 기준
curl "http://localhost:8000/api/network-edges?relationship_type=제공"

# 강도 범위 (4-5)
curl "http://localhost:8000/api/network-edges?min_strength=4&max_strength=5"

# 복합 필터
curl "http://localhost:8000/api/network-edges?source_id=1&relationship_type=제공&min_strength=4"
```

### 5. 출발 노드 기준 조회

```bash
curl "http://localhost:8000/api/network-edges/source/1"
```

**응답:**
```json
{
  "edges": [
    {"id": 1, "source_id": 1, "target_id": 2, "relationship_type": "제공", "strength": 5},
    {"id": 2, "source_id": 1, "target_id": 3, "relationship_type": "타겟", "strength": 4}
  ],
  "total": 2
}
```

### 6. 도착 노드 기준 조회

```bash
curl "http://localhost:8000/api/network-edges/target/2"
```

### 7. 엣지 상세 조회

```bash
curl "http://localhost:8000/api/network-edges/1"
```

### 8. 엣지 수정

```bash
curl -X PUT http://localhost:8000/api/network-edges/1 \
  -H "Content-Type: application/json" \
  -d '{
    "strength": 4,
    "label": "수정됨",
    "description": "수정된 설명"
  }'
```

**결과:**
- ✅ 정방향 엣지 업데이트
- ✅ 양방향이면 역방향도 자동 업데이트

### 9. 엣지 삭제

```bash
curl -X DELETE http://localhost:8000/api/network-edges/1
```

**결과:**
- ✅ 정방향 엣지 삭제
- ✅ 양방향이면 역방향도 함께 삭제

### 10. 일괄 추가

```bash
curl -X POST http://localhost:8000/api/network-edges/batch \
  -H "Content-Type: application/json" \
  -d '{
    "edges": [
      {
        "source_id": 1,
        "target_id": 2,
        "relationship_type": "제공",
        "strength": 5,
        "is_bidirectional": false
      },
      {
        "source_id": 2,
        "target_id": 3,
        "relationship_type": "영향",
        "strength": 4,
        "is_bidirectional": false
      }
    ]
  }'
```

**응답:**
```json
{
  "edges": [
    {"id": 20, ...},
    {"id": 21, ...}
  ],
  "total": 2
}
```

### 11. 노드 중요도 계산

```bash
curl "http://localhost:8000/api/nodes/1/importance"
```

**응답:**
```json
{
  "node_id": 1,
  "in_degree": 3,
  "out_degree": 2,
  "total_degree": 5,
  "total_strength": 18,
  "avg_strength": 3.6
}
```

---

## 🔑 주요 개념

### 양방향 관계 (Bidirectional)
```
입력:
{
  "source_id": 1,
  "target_id": 4,
  "relationship_type": "제휴",
  "strength": 4,
  "is_bidirectional": true
}

결과:
- Edge A: 1 → 4 (제휴, 강도: 4, reverse_edge_id: B.id)
- Edge B: 4 → 1 (제휴, 강도: 4, reverse_edge_id: A.id)
```

### 강도 (Strength)
- **범위:** 1 (약함) ~ 5 (매우 강함)
- **기본값:** 3 (중간)
- **양방향:** 동일한 강도 유지

### 관계 유형 (Relationship Type)
```
제공 (Provides)    - A가 B를 제공
타겟 (Target)      - A가 B를 타겟
영향 (Influences)  - A가 B에 영향을 미침
제휴 (Partnership) - A와 B가 제휴
전문 (Expertise)   - A가 B 분야의 전문가
기여 (Contributes) - A가 B에 기여
통합 (Integrates)  - A가 B와 통합
```

---

## 📊 데이터 모델

```
KnowledgeNetworkNode (노드)
├─ id: INTEGER (PK)
├─ node_id: STRING (unique)
├─ label: STRING
├─ category: STRING
└─ ...

KnowledgeNetworkEdge (엣지)
├─ id: INTEGER (PK)
├─ source_id: INTEGER (FK → Node)
├─ target_id: INTEGER (FK → Node)
├─ relationship_type: STRING
├─ strength: INTEGER (1-5)
├─ label: STRING
├─ description: TEXT
├─ is_bidirectional: BOOLEAN
├─ reverse_edge_id: INTEGER (FK → Edge)
├─ color: STRING (HEX)
├─ created_at: DATETIME
└─ updated_at: DATETIME
```

---

## 🐛 트러블슈팅

### 문제 1: "출발 노드를 찾을 수 없습니다"
```
원인: source_id가 존재하지 않는 노드를 가리킴
해결: 먼저 노드가 존재하는지 확인
  GET /api/knowledge-network/nodes
```

### 문제 2: "이미 존재하는 엣지입니다"
```
원인: 동일한 source_id → target_id 쌍이 이미 존재
해결: 
  1. 기존 엣지 삭제 후 다시 생성
  2. 또는 엣지 수정 (PUT)
```

### 문제 3: 양방향 엣지가 생성되지 않음
```
원인: is_bidirectional 파라미터가 false 또는 누락됨
해결: 요청에 "is_bidirectional": true 추가
```

### 문제 4: 역방향 엣지 업데이트 안 됨
```
원인: 역방향 엣지의 reverse_edge_id가 NULL
해결: 엣지를 다시 생성하거나 서비스 로직 확인
```

---

## 📈 성능 최적화

### 인덱스 (자동 적용)
```sql
-- 복합 인덱스: source + target으로 빠른 조회
CREATE INDEX idx_source_target 
  ON knowledge_network_edges(source_id, target_id);

-- 단일 인덱스: 타입별, 강도별 조회
CREATE INDEX idx_relationship_type ON knowledge_network_edges(relationship_type);
CREATE INDEX idx_strength ON knowledge_network_edges(strength);
```

### 페이지네이션
```bash
# skip=0, limit=10 (첫 페이지)
curl "http://localhost:8000/api/network-edges?skip=0&limit=10"

# skip=10, limit=10 (두 번째 페이지)
curl "http://localhost:8000/api/network-edges?skip=10&limit=10"
```

---

## 📚 참고 자료

| 파일 | 목적 |
|------|------|
| `app/models/network_edge.py` | SQLAlchemy 모델 |
| `app/services/network_edge_service.py` | 비즈니스 로직 |
| `app/routers/20250529-2000-network-edges-db-router.py` | REST API |
| `tests/test_network_edges.py` | 단위 테스트 |
| `NETWORK_EDGES_IMPLEMENTATION.md` | 상세 가이드 |

---

**버전:** 1.0.0
**작성일:** 2026-05-29
**담당자:** jitnet57
