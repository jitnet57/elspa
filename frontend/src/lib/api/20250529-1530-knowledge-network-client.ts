// ============================================================
// 📌 서비스명: Knowledge Network Client
// 📋 목적: FastAPI 지식 네트워크 API와 통신하는 클라이언트
// 🔧 기능: 노드 조회, 검색, 상세 조회
// 📅 작성일: 2026-05-29
// ============================================================

/**
 * 📝 설명:
 * FastAPI 백엔드의 지식 네트워크 API와 통신하기 위한 TypeScript 클라이언트입니다.
 * 다음 기능을 제공합니다:
 * 1. 모든 노드 조회 (카테고리 필터 선택)
 * 2. 키워드 기반 검색
 * 3. 특정 노드의 상세 정보 조회
 * 4. 전체 카테고리 목록 조회
 */

interface NetworkNode {
  id: string;
  label: string;
  description: string;
  category: string;
  color: string;
}

interface NodesResponse {
  nodes: NetworkNode[];
  total: number;
}

interface SearchResponse {
  results: NetworkNode[];
  count: number;
  query: string;
}

interface CategoriesResponse {
  categories: string[];
  count: number;
}

interface SearchRequest {
  query: string;
  category?: string;
  limit?: number;
}

// ============================================================
// 엣지(연결선) 관련 인터페이스
// ============================================================

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  type: string;
  strength: number;
  description: string;
  label?: string;
  color?: string;
}

interface EdgesResponse {
  edges: NetworkEdge[];
  total: number;
}

interface EdgeSearchResponse {
  results: NetworkEdge[];
  count: number;
  query: string;
}

interface EdgeSearchRequest {
  query: string;
  node_id?: string;
  relationship?: string;
  min_strength?: number;
  max_strength?: number;
  limit?: number;
}

// API 기본 URL (환경변수 또는 기본값)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const KNOWLEDGE_NETWORK_API = `${API_BASE_URL}/api/knowledge-network`;

/**
 * 📌 클래스: KnowledgeNetworkClient
 * 📋 목적: 지식 네트워크 API와의 모든 통신을 관리합니다.
 */
export class KnowledgeNetworkClient {
  /**
   * 📌 함수: getAllNodes
   * 📋 목적: 모든 지식 네트워크 노드를 조회합니다.
   * 🔧 매개변수:
   *    - category: 카테고리별 필터링 (선택)
   *    - skip: 페이지네이션 오프셋
   *    - limit: 페이지네이션 리미트
   * 📤 반환값: Promise<NodesResponse>
   *
   * 예시:
   * ```typescript
   * const response = await knowledgeNetworkClient.getAllNodes();
   * console.log(response.nodes); // [{ id: 'massage-thai', label: '타이 마사지', ... }]
   * console.log(response.total); // 16
   * ```
   */
  static async getAllNodes(
    category?: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<NodesResponse> {
    try {
      // 쿼리 매개변수 구성
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      if (category) {
        params.append('category', category);
      }

      const url = `${KNOWLEDGE_NETWORK_API}/nodes?${params.toString()}`;
      console.log(`🔗 API 요청: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as NodesResponse;
      console.log(`✅ 노드 조회 성공: ${data.total}개`);
      return data;
    } catch (error) {
      console.error('❌ 노드 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 📌 함수: searchNodes
   * 📋 목적: 키워드 기반 검색을 수행합니다.
   * 🔧 매개변수:
   *    - request: 검색 요청 ({query: string, category?: string, limit?: number})
   * 📤 반환값: Promise<SearchResponse>
   *
   * 예시:
   * ```typescript
   * const response = await knowledgeNetworkClient.searchNodes({
   *   query: '마사지',
   *   category: '마사지',
   *   limit: 10
   * });
   * console.log(response.results); // [타이 마사지, 시아츠, ...]
   * console.log(response.count); // 4
   * ```
   */
  static async searchNodes(request: SearchRequest): Promise<SearchResponse> {
    try {
      const url = `${KNOWLEDGE_NETWORK_API}/search`;
      const body = {
        query: request.query,
        category: request.category,
        limit: request.limit || 10,
      };

      console.log(`🔍 API 요청: POST ${url}`, body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as SearchResponse;
      console.log(`✅ 검색 성공: "${request.query}" → ${data.count}개 결과`);
      return data;
    } catch (error) {
      console.error('❌ 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 📌 함수: getNodeById
   * 📋 목적: 특정 노드의 상세 정보를 조회합니다.
   * 🔧 매개변수:
   *    - nodeId: 노드 고유 식별자 (예: massage-thai)
   * 📤 반환값: Promise<NetworkNode> 또는 404 에러
   *
   * 예시:
   * ```typescript
   * const node = await knowledgeNetworkClient.getNodeById('massage-thai');
   * console.log(node.label); // '타이 마사지'
   * console.log(node.description); // '전통 태국식 마사지, ...'
   * ```
   */
  static async getNodeById(nodeId: string): Promise<NetworkNode> {
    try {
      const url = `${KNOWLEDGE_NETWORK_API}/nodes/${nodeId}`;
      console.log(`🔗 API 요청: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`노드를 찾을 수 없습니다: ${nodeId}`);
        }
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as NetworkNode;
      console.log(`✅ 노드 상세 조회 성공: ${data.label}`);
      return data;
    } catch (error) {
      console.error('❌ 노드 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 📌 함수: getCategories
   * 📋 목적: 전체 카테고리 목록을 조회합니다.
   * 🔧 매개변수: (없음)
   * 📤 반환값: Promise<CategoriesResponse>
   *
   * 예시:
   * ```typescript
   * const response = await knowledgeNetworkClient.getCategories();
   * console.log(response.categories); // ['시장', '마사지', '웰니스', '판매자', '고객', '경영']
   * console.log(response.count); // 6
   * ```
   */
  static async getCategories(): Promise<CategoriesResponse> {
    try {
      const url = `${KNOWLEDGE_NETWORK_API}/categories`;
      console.log(`🔗 API 요청: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as CategoriesResponse;
      console.log(`✅ 카테고리 조회 성공: ${data.count}개`);
      return data;
    } catch (error) {
      console.error('❌ 카테고리 조회 실패:', error);
      throw error;
    }
  }

  // ============================================================
  // 엣지(연결선) 관련 메서드
  // ============================================================

  /**
   * 📌 함수: getAllEdges
   * 📋 목적: 모든 지식 네트워크 연결선을 조회합니다.
   * 🔧 매개변수:
   *    - source: 출발 노드 필터 (선택)
   *    - target: 도착 노드 필터 (선택)
   *    - relationship: 관계 유형 필터 (선택)
   *    - min_strength / max_strength: 강도 범위
   * 📤 반환값: Promise<EdgesResponse>
   */
  static async getAllEdges(
    source?: string,
    target?: string,
    relationship?: string,
    minStrength: number = 1,
    maxStrength: number = 5,
    skip: number = 0,
    limit: number = 100
  ): Promise<EdgesResponse> {
    try {
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      params.append('min_strength', minStrength.toString());
      params.append('max_strength', maxStrength.toString());
      if (source) params.append('source', source);
      if (target) params.append('target', target);
      if (relationship) params.append('relationship', relationship);

      const url = `${KNOWLEDGE_NETWORK_API}/edges?${params.toString()}`;
      console.log(`🔗 API 요청: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as EdgesResponse;
      console.log(`✅ 연결선 조회 성공: ${data.total}개`);
      return data;
    } catch (error) {
      console.error('❌ 연결선 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 📌 함수: getEdgesForNode
   * 📋 목적: 특정 노드와 연결된 모든 연결선을 조회합니다.
   * 🔧 매개변수:
   *    - nodeId: 노드 고유 식별자
   *    - direction: incoming/outgoing/both
   * 📤 반환값: Promise<EdgesResponse>
   */
  static async getEdgesForNode(
    nodeId: string,
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ): Promise<EdgesResponse> {
    try {
      const params = new URLSearchParams();
      params.append('direction', direction);

      const url = `${KNOWLEDGE_NETWORK_API}/nodes/${nodeId}/edges?${params.toString()}`;
      console.log(`🔗 API 요청: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as EdgesResponse;
      console.log(`✅ 노드 연결선 조회 성공: ${data.total}개`);
      return data;
    } catch (error) {
      console.error('❌ 노드 연결선 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 📌 함수: searchEdges
   * 📋 목적: 연결선을 검색합니다.
   * 🔧 매개변수:
   *    - request: 검색 요청
   * 📤 반환값: Promise<EdgeSearchResponse>
   */
  static async searchEdges(request: EdgeSearchRequest): Promise<EdgeSearchResponse> {
    try {
      const url = `${KNOWLEDGE_NETWORK_API}/edges/search`;
      const body = {
        query: request.query,
        node_id: request.node_id,
        relationship: request.relationship,
        min_strength: request.min_strength || 1,
        max_strength: request.max_strength || 5,
        limit: request.limit || 50,
      };

      console.log(`🔍 API 요청: POST ${url}`, body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as EdgeSearchResponse;
      console.log(`✅ 연결선 검색 성공: "${request.query}" → ${data.count}개 결과`);
      return data;
    } catch (error) {
      console.error('❌ 연결선 검색 실패:', error);
      throw error;
    }
  }

  /**
   * 📌 함수: getEdgeById
   * 📋 목적: 특정 연결선의 상세 정보를 조회합니다.
   * 🔧 매개변수:
   *    - edgeId: 연결선 고유 식별자
   * 📤 반환값: Promise<NetworkEdge> 또는 404 에러
   */
  static async getEdgeById(edgeId: string): Promise<NetworkEdge> {
    try {
      const url = `${KNOWLEDGE_NETWORK_API}/edges/${edgeId}`;
      console.log(`🔗 API 요청: GET ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`연결선을 찾을 수 없습니다: ${edgeId}`);
        }
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as NetworkEdge;
      console.log(`✅ 연결선 상세 조회 성공`);
      return data;
    } catch (error) {
      console.error('❌ 연결선 상세 조회 실패:', error);
      throw error;
    }
  }
}

// 기본 export
export default KnowledgeNetworkClient;
