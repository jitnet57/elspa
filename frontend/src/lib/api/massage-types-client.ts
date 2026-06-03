/**
 * ============================================================
 * 📌 모듈: Massage Types API 클라이언트
 * 📋 목적: 마사지 종류 CRUD API 호출
 * 🔧 기술: TypeScript + fetch API
 * 📅 작성일: 2026-06-03
 * ============================================================
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 마사지 타입 인터페이스
 * 데이터베이스 응답과 매핑
 */
export interface MassageType {
  id: number;
  name: string;
  basePrice: number;
  baseDurationMinutes: number;
  description?: string;
  isActive: boolean;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 마사지 타입 생성 요청 인터페이스
 */
export interface CreateMassageTypeRequest {
  name: string;
  basePrice: number;
  baseDurationMinutes: number;
  description?: string;
  isActive?: boolean;
  icon?: string;
}

/**
 * 마사지 타입 업데이트 요청 인터페이스
 */
export interface UpdateMassageTypeRequest {
  name?: string;
  basePrice?: number;
  baseDurationMinutes?: number;
  description?: string;
  isActive?: boolean;
  icon?: string;
}

/**
 * 마사지 타입 목록 응답 인터페이스
 */
export interface MassageTypeListResponse {
  data: MassageType[];
  totalCount: number;
  activeCount: number;
}

/**
 * API 응답을 우리 인터페이스로 변환
 * 스네이크_케이스 → camelCase
 */
const transformResponse = (apiData: any): MassageType => ({
  id: apiData.id,
  name: apiData.name,
  basePrice: Number(apiData.base_price),
  baseDurationMinutes: apiData.base_duration_minutes,
  description: apiData.description,
  isActive: apiData.is_active,
  icon: apiData.icon,
  createdAt: apiData.created_at,
  updatedAt: apiData.updated_at,
});

/**
 * 요청 데이터를 API 포맷으로 변환
 * camelCase → 스네이크_케이스
 */
const transformRequest = (data: CreateMassageTypeRequest | UpdateMassageTypeRequest): any => {
  const transformed: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      // camelCase를 snake_case로 변환
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      transformed[snakeKey] = value;
    }
  }
  return transformed;
};

/**
 * 마사지 종류 API 클라이언트
 * 모든 메서드는 비동기이며, 에러 시 예외를 throw합니다
 */
export const massageTypesApi = {
  /**
   * 마사지 종류 목록 조회
   * @param activeOnly - True면 활성 서비스만 조회 (기본값: true)
   * @returns 마사지 종류 목록
   */
  async list(activeOnly: boolean = true): Promise<MassageType[]> {
    try {
      const params = new URLSearchParams({
        active_only: String(activeOnly),
      });
      const response = await fetch(
        `${API_BASE_URL}/admin/massage-types?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      return jsonData.data.map(transformResponse);
    } catch (error) {
      console.error('마사지 종류 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 마사지 종류 조회
   * @param id - 마사지 종류 ID
   * @returns 마사지 종류 정보
   */
  async get(id: number): Promise<MassageType> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/massage-types/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return transformResponse(data);
    } catch (error) {
      console.error(`마사지 종류 조회 실패 (ID=${id}):`, error);
      throw error;
    }
  },

  /**
   * 새로운 마사지 종류 생성
   * @param data - 마사지 종류 생성 요청
   * @returns 생성된 마사지 종류
   */
  async create(data: CreateMassageTypeRequest): Promise<MassageType> {
    try {
      const payload = transformRequest(data);
      const response = await fetch(`${API_BASE_URL}/admin/massage-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      return transformResponse(result);
    } catch (error) {
      console.error('마사지 종류 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 마사지 종류 업데이트
   * @param id - 마사지 종류 ID
   * @param data - 마사지 종류 업데이트 요청
   * @returns 업데이트된 마사지 종류
   */
  async update(id: number, data: UpdateMassageTypeRequest): Promise<MassageType> {
    try {
      const payload = transformRequest(data);
      const response = await fetch(`${API_BASE_URL}/admin/massage-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      return transformResponse(result);
    } catch (error) {
      console.error(`마사지 종류 업데이트 실패 (ID=${id}):`, error);
      throw error;
    }
  },

  /**
   * 마사지 종류 삭제
   * @param id - 마사지 종류 ID
   * @param hardDelete - True면 완전 삭제, False면 soft delete (기본값: false)
   */
  async delete(id: number, hardDelete: boolean = false): Promise<void> {
    try {
      const params = new URLSearchParams({
        hard_delete: String(hardDelete),
      });
      const response = await fetch(
        `${API_BASE_URL}/admin/massage-types/${id}?${params}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(`마사지 종류 삭제 실패 (ID=${id}):`, error);
      throw error;
    }
  },
};
