-- ============================================================
-- 📌 마이그레이션: Network Admin Fields
-- 📋 목적: knowledge_network_nodes 테이블에 관리자 필드 추가
-- 🔧 기능: 타임스탬프, 활성화 상태, 관리자 메모, 생성자 추적
-- 📅 작성일: 2026-05-30
-- ============================================================

/*
📝 설명:
이 마이그레이션은 지식 네트워크 관리를 위한 새로운 필드를 추가합니다.

**추가 필드:**
1. is_active (BOOLEAN) - 노드 활성화 상태
2. admin_notes (TEXT) - 관리자 메모
3. created_by_id (INTEGER FK) - 생성자 ID (therapist_id)
4. updated_by_id (INTEGER FK) - 수정자 ID (therapist_id)

**인덱스:**
- idx_is_active: 활성화된 노드 조회 최적화
- idx_created_by_id: 생성자별 노드 조회

**데이터 무결성:**
- created_by_id는 therapist 테이블의 id를 참조
- updated_by_id도 therapist 테이블의 id를 참조
- NULL 허용 (자동 생성 노드의 경우)
*/

-- 1. is_active 필드 추가 (기본값: true)
ALTER TABLE knowledge_network_nodes
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- 2. admin_notes 필드 추가
ALTER TABLE knowledge_network_nodes
ADD COLUMN admin_notes TEXT NULL;

-- 3. created_by_id 필드 추가 (선택사항)
ALTER TABLE knowledge_network_nodes
ADD COLUMN created_by_id INTEGER NULL;

-- 4. updated_by_id 필드 추가 (선택사항)
ALTER TABLE knowledge_network_nodes
ADD COLUMN updated_by_id INTEGER NULL;

-- ============================================================
-- 인덱스 생성
-- ============================================================

-- is_active 인덱스 (활성화된 노드 빠른 조회)
CREATE INDEX idx_knowledge_network_is_active
ON knowledge_network_nodes(is_active);

-- created_by_id 인덱스
CREATE INDEX idx_knowledge_network_created_by
ON knowledge_network_nodes(created_by_id);

-- updated_by_id 인덱스
CREATE INDEX idx_knowledge_network_updated_by
ON knowledge_network_nodes(updated_by_id);

-- 복합 인덱스 (카테고리 + is_active)
CREATE INDEX idx_knowledge_network_category_active
ON knowledge_network_nodes(category, is_active);

-- ============================================================
-- 엣지 테이블 추가 필드
-- ============================================================

-- knowledge_network_edges 테이블에 is_active 필드 추가
ALTER TABLE knowledge_network_edges
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- knowledge_network_edges 테이블에 created_by_id 필드 추가
ALTER TABLE knowledge_network_edges
ADD COLUMN created_by_id INTEGER NULL;

-- knowledge_network_edges 테이블에 admin_notes 필드 추가
ALTER TABLE knowledge_network_edges
ADD COLUMN admin_notes TEXT NULL;

-- 엣지 테이블 인덱스
CREATE INDEX idx_knowledge_network_edges_is_active
ON knowledge_network_edges(is_active);

CREATE INDEX idx_knowledge_network_edges_created_by
ON knowledge_network_edges(created_by_id);

-- ============================================================
-- 데이터 검증 쿼리
-- ============================================================

/*
-- 노드 통계 확인
SELECT
    category,
    COUNT(*) as total_nodes,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_nodes,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_nodes
FROM knowledge_network_nodes
GROUP BY category
ORDER BY category;

-- 엣지 통계 확인
SELECT
    relationship_type,
    COUNT(*) as total_edges,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_edges
FROM knowledge_network_edges
GROUP BY relationship_type
ORDER BY relationship_type;

-- 활성화된 전체 네트워크 조회
SELECT
    n.node_id,
    n.label,
    n.category,
    COUNT(e.id) as connection_count
FROM knowledge_network_nodes n
LEFT JOIN knowledge_network_edges e
    ON (n.id = e.source_id OR n.id = e.target_id)
    AND e.is_active = true
WHERE n.is_active = true
GROUP BY n.id, n.node_id, n.label, n.category
ORDER BY connection_count DESC;
*/
