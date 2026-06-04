# ============================================================
# 📌 스키마명: Network Admin Schemas
# 📋 목적: 노드/엣지 관리자 API 요청/응답 스키마
# 🔧 기능: CRUD, 벌크 작업, 임포트/내보내기 데이터 모델
# 📅 작성일: 2026-05-29
# ============================================================

"""
📝 설명:
이 스키마는 네트워크 관리자 기능(create_node, update_node, bulk_update, import, export 등)
에서 사용되는 요청/응답 데이터 모델을 정의합니다.

**포함 스키마:**
1. NodeCreateRequest - 노드 생성 요청
2. NodeUpdateRequest - 노드 수정 요청
3. NodeBulkUpdateRequest - 벌크 업데이트 요청
4. BulkUpdateResponse - 벌크 업데이트 응답
5. EdgeCreateRequest - 엣지 생성 요청
6. EdgeUpdateRequest - 엣지 수정 요청
7. EdgeDeleteRequest - 엣지 삭제 요청
8. NetworkAnalysisResponse - 네트워크 분석 결과
9. ImportResult - CSV 임포트 결과
10. ExportData - CSV 내보내기 데이터

총 200+ 줄의 상세한 스키마 정의
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================
# Enum: 관계 유형 및 카테고리
# ============================================================

class RelationshipTypeEnum(str, Enum):
    """관계 유형 열거형"""
    PROVIDES = "제공"  # 제공
    TARGETS = "타겟"  # 타겟 고객
    INFLUENCES = "영향"  # 영향
    USES = "사용"  # 사용/이용
    COMPETES_WITH = "경쟁"  # 경쟁
    PARTNERS_WITH = "파트너"  # 파트너십
    RELATED_TO = "관련"  # 관련


class CategoryEnum(str, Enum):
    """노드 카테고리 열거형"""
    MARKET = "시장"  # 시장
    MASSAGE = "마사지"  # 마사지 서비스
    WELLNESS = "웰니스"  # 웰니스/건강
    SELLER = "판매자"  # 테라피스트/판매자
    CUSTOMER = "고객"  # 고객 세그먼트
    MANAGEMENT = "경영"  # 경영 지표
    OTHER = "기타"  # 기타


# ============================================================
# 노드 관련 스키마
# ============================================================

class NodeCreateRequest(BaseModel):
    """
    📝 설명:
    새로운 노드를 생성할 때 사용되는 요청 스키마입니다.

    필수 필드: node_id, label, description, category, color
    """

    node_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        example="massage-thai",
        description="노드 고유 식별자 (snake_case 권장)"
    )
    label: str = Field(
        ...,
        min_length=1,
        max_length=255,
        example="타이 마사지",
        description="노드 제목 (사용자 친화적 표현)"
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        example="전통 태국식 마사지 기법을 활용한 치료 서비스",
        description="노드 상세 설명"
    )
    category: str = Field(
        ...,
        example="마사지",
        description="노드 카테고리 (시장/마사지/웰니스/판매자/고객/경영)"
    )
    color: str = Field(
        ...,
        regex="^#[0-9A-Fa-f]{6}$",
        example="#3b82f6",
        description="노드 색상 (HEX 형식)"
    )
    tags: Optional[List[str]] = Field(
        None,
        example=["전통", "치료", "인기"],
        description="노드 태그 (검색 최적화)"
    )

    @validator("node_id")
    def validate_node_id(cls, v):
        """노드 ID는 알파벳, 숫자, 하이픈만 허용"""
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError("node_id는 영문자, 숫자, 하이픈(-), 언더스코어(_)만 포함 가능")
        return v


class NodeUpdateRequest(BaseModel):
    """
    📝 설명:
    기존 노드를 수정할 때 사용되는 요청 스키마입니다.
    모든 필드가 선택사항입니다.
    """

    label: Optional[str] = Field(
        None,
        max_length=255,
        example="타이 마사지 (개선됨)",
        description="노드 제목 (선택)"
    )
    description: Optional[str] = Field(
        None,
        max_length=2000,
        description="노드 설명 (선택)"
    )
    category: Optional[str] = Field(
        None,
        example="마사지",
        description="노드 카테고리 (선택)"
    )
    color: Optional[str] = Field(
        None,
        regex="^#[0-9A-Fa-f]{6}$",
        example="#ef4444",
        description="노드 색상 (선택)"
    )
    tags: Optional[List[str]] = Field(
        None,
        description="노드 태그 (선택)"
    )

    class Config:
        from_attributes = True


class NodeResponse(BaseModel):
    """
    📝 설명:
    노드 조회 응답 스키마입니다.
    """

    id: int = Field(..., example=1, description="내부 ID")
    node_id: str = Field(..., example="massage-thai")
    label: str = Field(..., example="타이 마사지")
    description: str
    category: str
    color: str
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NodeBulkUpdateRequest(BaseModel):
    """
    📝 설명:
    여러 노드를 한 번에 수정할 때 사용되는 요청 스키마입니다.

    전략:
    1. node_ids로 대상 노드 지정
    2. updates로 공통 업데이트 항목 지정

    예시:
    {
        "node_ids": ["massage-thai", "massage-swedish"],
        "updates": {
            "category": "마사지",
            "color": "#3b82f6"
        }
    }
    """

    node_ids: List[str] = Field(
        ...,
        min_items=1,
        max_items=1000,
        example=["massage-thai", "massage-swedish"],
        description="업데이트할 노드 ID 목록"
    )
    updates: Dict[str, Any] = Field(
        ...,
        example={
            "category": "마사지",
            "color": "#3b82f6"
        },
        description="공통으로 적용할 업데이트 항목"
    )

    class Config:
        from_attributes = True


class BulkUpdateResponse(BaseModel):
    """
    📝 설명:
    벌크 업데이트 결과 응답 스키마입니다.
    """

    success: bool = Field(..., example=True)
    total_count: int = Field(..., example=50, description="시도한 총 개수")
    updated_count: int = Field(..., example=48, description="성공한 개수")
    failed_count: int = Field(..., example=2, description="실패한 개수")
    failed_nodes: List[Dict[str, Any]] = Field(
        ...,
        example=[
            {"node_id": "invalid-node", "error": "노드를 찾을 수 없습니다"}
        ],
        description="실패한 노드 목록"
    )
    message: str = Field(..., example="48개 노드가 성공적으로 업데이트되었습니다.")

    class Config:
        from_attributes = True


# ============================================================
# 엣지(관계선) 관련 스키마
# ============================================================

class EdgeCreateRequest(BaseModel):
    """
    📝 설명:
    새로운 엣지(관계선)를 생성할 때 사용되는 요청 스키마입니다.
    """

    source_node_id: str = Field(
        ...,
        example="therapist-john",
        description="출발 노드 ID"
    )
    target_node_id: str = Field(
        ...,
        example="massage-thai",
        description="도착 노드 ID"
    )
    relationship_type: str = Field(
        ...,
        example="제공",
        description="관계 유형 (제공/타겟/영향/사용/경쟁/파트너/관련)"
    )
    label: Optional[str] = Field(
        None,
        max_length=255,
        example="기본 마사지사",
        description="엣지 라벨"
    )
    description: Optional[str] = Field(
        None,
        max_length=2000,
        description="관계 설명"
    )
    strength: int = Field(
        default=3,
        ge=1,
        le=5,
        example=4,
        description="관계 강도 (1-5)"
    )
    is_bidirectional: bool = Field(
        default=False,
        example=False,
        description="양방향 관계 여부"
    )
    color: Optional[str] = Field(
        default="#3b82f6",
        regex="^#[0-9A-Fa-f]{6}$",
        description="엣지 색상"
    )

    class Config:
        from_attributes = True


class EdgeUpdateRequest(BaseModel):
    """
    📝 설명:
    기존 엣지를 수정할 때 사용되는 요청 스키마입니다.
    """

    relationship_type: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    strength: Optional[int] = Field(None, ge=1, le=5)
    color: Optional[str] = Field(None, regex="^#[0-9A-Fa-f]{6}$")

    class Config:
        from_attributes = True


class EdgeResponse(BaseModel):
    """
    📝 설명:
    엣지 조회 응답 스키마입니다.
    """

    id: int
    source_id: int
    target_id: int
    relationship_type: str
    label: Optional[str] = None
    description: Optional[str] = None
    strength: int
    is_bidirectional: bool
    reverse_edge_id: Optional[int] = None
    color: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# 분석 및 보고서 스키마
# ============================================================

class NetworkAnalysisResponse(BaseModel):
    """
    📝 설명:
    네트워크 분석 결과 응답 스키마입니다.
    그래프 이론 기반의 다양한 메트릭을 제공합니다.
    """

    total_nodes: int = Field(..., example=50, description="전체 노드 개수")
    total_edges: int = Field(..., example=120, description="전체 엣지 개수")

    # 밀도 지표
    network_density: float = Field(
        ...,
        example=0.25,
        description="네트워크 밀도 (0-1)"
    )

    # 카테고리별 분석
    nodes_by_category: Dict[str, int] = Field(
        ...,
        example={"마사지": 10, "판매자": 15, "고객": 25},
        description="카테고리별 노드 개수"
    )

    # 강도별 엣지 분포
    edges_by_strength: Dict[int, int] = Field(
        ...,
        example={"1": 20, "2": 30, "3": 40, "4": 20, "5": 10},
        description="강도별 엣지 개수"
    )

    # 관계 유형별 분포
    edges_by_type: Dict[str, int] = Field(
        ...,
        example={"제공": 50, "타겟": 30, "영향": 25, "경쟁": 15},
        description="관계 유형별 엣지 개수"
    )

    # 중심성 지표
    most_connected_nodes: List[Dict[str, Any]] = Field(
        ...,
        example=[
            {"node_id": "market-leader", "degree": 25},
            {"node_id": "popular-massage", "degree": 20}
        ],
        description="연결이 가장 많은 노드"
    )

    # 고립 노드
    isolated_nodes: List[str] = Field(
        ...,
        example=["obsolete-service"],
        description="연결이 없는 노드 목록"
    )

    # 양방향 관계 개수
    bidirectional_edges: int = Field(..., example=35, description="양방향 엣지 개수")

    # 분석 타임스탬프
    analyzed_at: datetime = Field(..., description="분석 실행 시간")

    class Config:
        from_attributes = True


# ============================================================
# 임포트/내보내기 스키마
# ============================================================

class ImportNodeData(BaseModel):
    """
    📝 설명:
    CSV 임포트용 노드 데이터 모델입니다.

    CSV 형식:
    node_id,label,description,category,color,tags
    massage-thai,타이 마사지,전통 태국식 마사지,마사지,#3b82f6,전통|치료|인기
    """

    node_id: str
    label: str
    description: str
    category: str
    color: str
    tags: Optional[str] = None  # CSV에서는 문자열로 전달


class ImportEdgeData(BaseModel):
    """
    📝 설명:
    CSV 임포트용 엣지 데이터 모델입니다.

    CSV 형식:
    source_id,target_id,relationship_type,label,strength,is_bidirectional
    """

    source_node_id: str
    target_node_id: str
    relationship_type: str
    label: Optional[str] = None
    strength: int = 3
    is_bidirectional: bool = False


class ImportResult(BaseModel):
    """
    📝 설명:
    CSV 임포트 결과 응답 스키마입니다.
    """

    success: bool = Field(..., example=True)

    # 노드 임포트 결과
    nodes_processed: int = Field(..., example=50, description="처리된 노드 개수")
    nodes_created: int = Field(..., example=48, description="생성된 노드 개수")
    nodes_updated: int = Field(..., example=2, description="업데이트된 노드 개수")
    nodes_failed: int = Field(..., example=0, description="실패한 노드 개수")

    # 엣지 임포트 결과
    edges_processed: int = Field(..., example=100, description="처리된 엣지 개수")
    edges_created: int = Field(..., example=98, description="생성된 엣지 개수")
    edges_failed: int = Field(..., example=2, description="실패한 엣지 개수")

    # 에러 목록
    errors: List[Dict[str, str]] = Field(
        ...,
        example=[
            {"row": 50, "type": "node", "error": "node_id는 필수 필드입니다"}
        ],
        description="발생한 에러 목록"
    )

    message: str = Field(
        ...,
        example="50개 노드, 100개 엣지가 임포트되었습니다. (2개 실패)"
    )

    class Config:
        from_attributes = True


class ExportDataResponse(BaseModel):
    """
    📝 설명:
    CSV 내보내기 데이터 응답 스키마입니다.
    프론트엔드에서 다운로드할 수 있도록 CSV 텍스트를 반환합니다.
    """

    filename: str = Field(
        ...,
        example="network-nodes-20260529-210000.csv",
        description="내보낼 파일명"
    )
    csv_content: str = Field(
        ...,
        description="CSV 형식의 텍스트 내용"
    )
    total_records: int = Field(
        ...,
        example=50,
        description="내보낸 레코드 개수"
    )
    generated_at: datetime = Field(..., description="생성 시간")

    class Config:
        from_attributes = True


# ============================================================
# 권한 및 감사 스키마
# ============================================================

class AdminActionLog(BaseModel):
    """
    📝 설명:
    관리자 작업 로그 스키마입니다.
    모든 관리자 작업을 감시하기 위해 사용됩니다.
    """

    action: str = Field(
        ...,
        example="create_node",
        description="작업 유형"
    )
    target_type: str = Field(
        ...,
        example="node",
        description="대상 유형 (node/edge)"
    )
    target_id: str = Field(..., example="massage-thai")
    changes: Dict[str, Any] = Field(
        ...,
        description="변경된 필드 (이전값 → 새값)"
    )
    timestamp: datetime = Field(...)
    admin_id: Optional[int] = Field(None, description="작업한 관리자 ID")


# ============================================================
# 에러 응답 스키마
# ============================================================

class ErrorResponse(BaseModel):
    """
    📝 설명:
    API 에러 응답 스키마입니다.
    """

    error: str = Field(..., example="Unauthorized")
    detail: str = Field(
        ...,
        example="관리자 권한이 필요합니다"
    )
    status_code: int = Field(..., example=403)
    timestamp: datetime = Field(...)


class ValidationError(BaseModel):
    """
    📝 설명:
    유효성 검사 에러 응답 스키마입니다.
    """

    error: str = Field(..., example="ValidationError")
    details: List[Dict[str, Any]] = Field(
        ...,
        example=[
            {
                "field": "color",
                "error": "유효한 HEX 색상 형식이 아닙니다"
            }
        ]
    )
    timestamp: datetime = Field(...)
