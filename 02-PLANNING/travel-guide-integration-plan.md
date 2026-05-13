# ElSpa 여행 가이드 통합 계획 (기획만)
**Travel Guide Integration Planning Document | Date: 2026-05-05**

---

## 📋 목차
1. [개요](#1-개요)
2. [여행 가이드 기능 정의](#2-여행-가이드-기능-정의)
3. [가이드 예약 시스템](#3-가이드-예약-시스템)
4. [가이드 수수료 정산](#4-가이드-수수료-정산)
5. [통합 정산 사이트](#5-통합-정산-사이트)
6. [데이터 모델](#6-데이터-모델)
7. [프로세스 흐름도](#7-프로세스-흐름도)
8. [아키텍처 영향 분석](#8-아키텍처-영향-분석)
9. [Epic/Stories 추가 사항](#9-epicstories-추가-사항)

---

## 1. 개요

### 1.1 현재 상황 (마사지 스파만)
```
Staff 역할: 테라피스트 (Therapist) + 드라이버 (Driver)
정산 대상:
├─ 테라피스트: 서비스 수수료
└─ 드라이버: 픽드랍 수수료

Staff Site: staff.elspa.com (테라피스트 + 드라이버 통합)
Settlement: 각각 독립적 정산
```

### 1.2 새로운 요구사항 (마사지 스파 + 여행 가이드)
```
Staff 역할 확장: 가이드 (Guide) 추가
정산 대상:
├─ 테라피스트: 서비스 수수료 (기존)
├─ 드라이버: 픽드랍 수수료 (기존)
└─ 가이드: 투어/가이드 수수료 (신규)

Staff Site 확장:
├─ 마사지 테라피스트 대시보드 (기존)
├─ 드라이버 대시보드 (기존)
└─ 가이드 대시보드 (신규)

Settlement Site (신규):
└─ 통합 정산 시스템 (3개 역할 모두)
```

### 1.3 비즈니스 요구사항
```
목표:
- ElSpa: 마사지/스파 업무 자동화
- 확장: 여행 가이드 서비스 추가
- 통합: 1개 플랫폼에서 모든 정산 관리

대상:
- 고객: 마사지 예약 + 여행 패키지 예약 (User Site)
- 테라피스트: 마사지 서비스 (Staff Site)
- 드라이버: 픽드랍 서비스 (Staff Site)
- 가이드: 여행 가이드 서비스 (Staff Site)
- 오너: 통합 정산 관리 (Settlement Site)
```

---

## 2. 여행 가이드 기능 정의

### 2.1 가이드 역할 및 권한

```
가이드 (Guide) 정의:
├─ 설명: 서울/한국 여행 가이드, 현지 전문가
├─ 서비스: 투어 가이드, 한국말/영어/중국어 해설
├─ 수입원: 투어당 수수료 (일반 가이드)
│          또는 시급 (전속 가이드)
├─ 활동 시간: 투어 시작 ~ 종료 (변동)
└─ 기기: 모바일 (스마트폰, 태블릿)

가이드 유형:
1️⃣  프리랜서 가이드 (Freelance)
    ├─ 여러 투어 회사에서 일함
    ├─ 수수료: 50% (투어 가격의)
    └─ 독립적 일정 관리

2️⃣  전속 가이드 (Full-time)
    ├─ ElSpa 전속
    ├─ 급여: 고정 월급 + 성과급
    └─ 일정: ElSpa 관리
```

### 2.2 가이드 예약 타입

```
A. 개인 투어 (Private Tour)
   ├─ 고객: 1~4명
   ├─ 기간: 2~8시간
   ├─ 가격: 시간당 50,000₩ (기본)
   ├─ 커스터마이징: 가능
   └─ 가이드: 1명 전담

B. 그룹 투어 (Group Tour)
   ├─ 고객: 5~20명
   ├─ 기간: 반일/전일 (4~8시간)
   ├─ 가격: 일정 (예: 명동 투어 120,000₩/인)
   ├─ 일정: 고정
   └─ 가이드: 1~2명

C. 특화 투어 (Specialty Tour)
   ├─ 테마: 한식, K-POP, 역사, 자연
   ├─ 기간: 2~4시간
   ├─ 가격: 테마별 (예: K-POP 투어 150,000₩)
   └─ 가이드: 전문가 (영어/중국어 가능)

D. 공항 픽업 + 투어 (Airport + Tour)
   ├─ 드라이버 + 가이드 조합
   ├─ 픽업: 드라이버
   ├─ 투어: 가이드
   └─ 정산: 분리 (드라이버 + 가이드)
```

### 2.3 가이드 관리 기능

```
가이드 프로필:
├─ 이름, 나이, 소개
├─ 언어: 한국어 ✓, 영어 ◔ (중급), 중국어 ✗
├─ 전문분야: 한식, 강남, 한강
├─ 평점: 4.8/5.0 (50 리뷰)
├─ 가용성: 캘린더 (일정 표시)
├─ 유형: 프리랜서 / 전속
├─ 정산 방식: 수수료 / 시급
├─ 인증: 신분증, 가이드 자격증
└─ 상태: 활성 / 휴직 / 퇴직

가이드 활동 기록:
├─ 완료 투어: 50회
├─ 총 시간: 240시간
├─ 누적 수익: 12M₩
├─ 부동 정산금: 500,000₩
└─ 지난 주 근무: 24시간
```

---

## 3. 가이드 예약 시스템

### 3.1 예약 프로세스 (고객 관점)

```
사용자 사이트 (User PWA) - 여행 가이드 섹션:

Step 1: 투어 유형 선택
├─ 개인 투어
├─ 그룹 투어
├─ 특화 투어
└─ 공항 픽업 + 투어

Step 2: 투어 상세 정보 입력
├─ 날짜 & 시간 선택
├─ 참석 인원 (1~20명)
├─ 투어 지역 (명동, 강남, 한강)
├─ 선호 언어 (한국어, 영어, 중국어)
├─ 특별 요청 (음식 알러지 등)
└─ 가이드 선호 사항 (선택)

Step 3: 가용 가이드 조회
├─ 필터: 언어, 평점, 가용성
├─ 목록: [가이드 프로필 + 가용시간 + 가격]
└─ 선택: 가이드 지정 또는 자동 배정

Step 4: 결제
├─ 가격: 투어 가격 + 가이드 수수료
├─ 결제 방법: 신용카드, 계좌이체
└─ 할인: 프로모션 코드

Step 5: 예약 확인
├─ 예약번호
├─ 가이드 연락처
├─ 만남 장소 & 시간
└─ 취소 정책
```

### 3.2 가이드 일정 관리

```
가이드 대시보드 (Staff Site) - 가이드 탭:

오늘의 일정:
┌─────────────────────────────────────┐
│ 📅 2026-05-05 (월)                   │
├─────────────────────────────────────┤
│                                     │
│ 📍 09:00 ~ 12:00 (3시간)            │
│ 명동 개인투어 (2명)                 │
│ 고객: 김영희 + 친구 1명             │
│ 수수료: 150,000₩                   │
│ [시작] [연락처] [지도]              │
│                                     │
│ 📍 14:00 ~ 16:00 (2시간)            │
│ 한강 로맨틱 투어 (5명)              │
│ 그룹 투어 (기존 예약)               │
│ 수수료: 200,000₩                   │
│ [시작] [참석자] [지도]              │
│                                     │
│ 📍 18:00 이후: 휴식                 │
│                                     │
├─────────────────────────────────────┤
│ 오늘 수익: 350,000₩                 │
│ 이번 주: 1,750,000₩                │
│ 이번 달: 6,200,000₩                │
└─────────────────────────────────────┘
```

### 3.3 가이드 예약 상태 관리

```
예약 상태 머신:

pending (예약 신청)
  ↓ (가이드 수락)
confirmed (확정)
  ↓ (투어 시작)
in_progress (진행 중)
  ↓ (투어 종료)
completed (완료)
  ↓ (고객 리뷰)
reviewed (리뷰됨)
  ↓ (정산)
settled (정산됨)

또는:

cancelled (취소 - 고객)
  ↑ (가이드 거부)
pending → rejected (거부됨 - 가이드)

Timeline:
pending: 2026-05-05 10:00
confirmed: 2026-05-05 10:15 (가이드 수락)
in_progress: 2026-05-10 09:00 (투어 시작)
completed: 2026-05-10 12:30 (투어 종료)
reviewed: 2026-05-10 14:00 (고객 리뷰 작성)
settled: 2026-05-15 01:00 (자동 정산)
```

### 3.4 실시간 좌표 추적 (선택 기능)

```
투어 진행 중:
- 가이드: GPS 위치 자동 기록 (5분마다)
- 고객: 가이드 위치 실시간 추적 (투어 지도 보기)
- 앱: 투어 루트 기록 (사진과 함께 추후 추억)

Data:
├─ 위치 히스토리 (위도, 경도, 시간)
├─ 사진 (가이드가 촬영)
├─ 노트 (가이드가 추가)
└─ 음성 메모 (해설 자동 기록)

저장:
└─ 투어 후 고객이 "여행 회상록" 다운로드 가능
```

---

## 4. 가이드 수수료 정산

### 4.1 가이드 수수료 계산

```
정산 기준 (가이드별):

1️⃣  프리랜서 가이드 (Freelance)
    수수료율: 50% (고정)
    
    예시:
    투어 매출: 300,000₩ (고객 가격)
    가이드 수수료: 150,000₩ (50%)
    ElSpa 수수료: 150,000₩ (50%)
    
    → 자동 계산, 일일 정산

2️⃣  전속 가이드 (Full-time)
    구조: 기본급 + 성과급
    
    기본급: 월 2,500,000₩
    성과급: 투어당 50,000₩ + 평점 보너스
    
    예시:
    월 투어 20회 × 50,000₩ = 1,000,000₩
    평점 4.8/5.0 → +200,000₩ 보너스
    총액: 2,500,000₩ + 1,000,000₩ + 200,000₩ = 3,700,000₩
    
    → 월급으로 정산 (매월 말)

3️⃣  특별 투어 (Specialty)
    수수료율: 60% (한국 문화 전문가)
    
    예시:
    K-POP 투어: 180,000₩
    가이드 수수료: 108,000₩ (60%)
    ElSpa 수수료: 72,000₩ (40%)
```

### 4.2 가이드 정산 일정

```
정산 주기:

프리랜서:
├─ 일일 정산 (매일 01:00)
│  └─ 어제 완료 투어 → 가이드 계정에 입금 예정
├─ 주간 정산 (매주 월요일)
│  └─ 지난주 통합 리포트
└─ 월간 정산 (매월 1일)
   └─ 지난달 전체 통합

전속 가이드:
├─ 월급 정산 (매월 말)
│  └─ 월별 총액 + 성과 정산
└─ 급여 명세서 (자동 생성)
   └─ 투어별 수수료 상세 + 보너스

정산 기록:
├─ Settlement 테이블에 저장
├─ 감사 로그 (자동)
└─ 가이드가 조회 가능
```

### 4.3 수수료 공제

```
자동 공제 항목:

1. 세금 (근로소득세)
   ├─ 프리랜서: 3.3% (소득세)
   └─ 전속: 급여세 (기존 규정)

2. 정산 수수료
   ├─ 은행 이체: 1,000₩ (고정)
   └─ 수수료율: 0% (ElSpa 부담)

3. 페널티 (선택 / Admin 설정)
   ├─ 비상식적 취소: -50,000₩
   ├─ 고객 클레임: -10,000₩ (조사 후)
   └─ 지각/미출석: -50,000₩

계산식:
정산액 = (투어 수수료 × 수수료율) - 세금 - 수수료 ± 페널티
→ 예) (300,000₩ × 50%) - 4,950₩ - 1,000₩ = 144,050₩
```

---

## 5. 통합 정산 사이트

### 5.1 새로운 사이트 소개

```
Settlement Site (settlement.elspa.com):
├─ 대상: 테라피스트, 드라이버, 가이드 (3개 역할)
├─ 기능: 개별 정산 조회 + 통합 대시보드
├─ 로그인: 개별 계정으로 로그인 (또는 통합 로그인)
├─ 마이페이지: 역할별 정산 정보
└─ 기술: PWA (오프라인 지원)

기존 Staff Site (staff.elspa.com)와의 관계:
├─ Staff Site: 업무용 (일정, 서비스 타이머, 실시간)
└─ Settlement Site: 정산용 (히스토리, 매출, 인출)
   → 2개 사이트 분리 (관심사 분리)
```

### 5.2 정산 사이트 기능 (역할별)

```
A. 테라피스트 정산 페이지

┌────────────────────────────────────────┐
│ 💆 테라피스트 정산                      │
├────────────────────────────────────────┤
│                                        │
│ 📊 이번달 정산 현황                    │
│ ├─ 누적 수익: 8,500,000₩             │
│ ├─ 정산금: 4,250,000₩                │
│ │  (마사지 100회 × 평균 85k)         │
│ ├─ 공제: 140,750₩ (세금 3.3%)       │
│ ├─ 수수료: 0₩                        │
│ └─ 최종: 4,109,250₩                 │
│                                        │
│ 📅 정산 날짜                          │
│ ├─ 정산 기간: 2026-05-01 ~ 05-31    │
│ ├─ 정산 예정: 2026-06-05 (09:00)    │
│ ├─ 상태: ⏳ 대기중 (5일 후)          │
│ └─ 은행: 국민은행 ***-***-3456      │
│                                        │
│ 📋 상세 정산 기록                     │
│ ├─ [날짜] [서비스] [금액] [상태]     │
│ ├─ 05-25 스웨디시 60분 80,000 ✅    │
│ ├─ 05-24 핫스톤 90분 120,000 ✅     │
│ ├─ 05-23 아로마 60분 75,000 ✅      │
│ └─ [이전 월] [CSV 다운로드]          │
│                                        │
└────────────────────────────────────────┘


B. 드라이버 정산 페이지

┌────────────────────────────────────────┐
│ 🚗 드라이버 정산                        │
├────────────────────────────────────────┤
│                                        │
│ 📊 이번달 정산 현황                    │
│ ├─ 누적 수익: 6,200,000₩             │
│ ├─ 정산금: 3,100,000₩                │
│ │  (픽드랍 155회 × 평균 40k)        │
│ ├─ 공제: 102,300₩ (세금 3.3%)       │
│ ├─ 수수료: 0₩                        │
│ └─ 최종: 2,997,700₩                 │
│                                        │
│ 📅 정산 날짜                          │
│ ├─ 정산 기간: 2026-05-01 ~ 05-31    │
│ ├─ 정산 예정: 2026-06-05 (09:00)    │
│ ├─ 상태: ⏳ 대기중 (5일 후)          │
│ └─ 은행: 신한은행 ***-***-7890      │
│                                        │
│ 📋 픽드랍 기록                        │
│ ├─ [날짜] [출발지] [목적지] [금액]   │
│ ├─ 05-25 강남역 → 한강공원 45,000  │
│ ├─ 05-24 종로 → 남대문 40,000      │
│ ├─ 05-23 신사역 → 청담 50,000      │
│ └─ [이전 월] [상세 조회]             │
│                                        │
└────────────────────────────────────────┘


C. 가이드 정산 페이지

┌────────────────────────────────────────┐
│ 🗺️  가이드 정산                        │
├────────────────────────────────────────┤
│                                        │
│ 📊 이번달 정산 현황                    │
│ ├─ 누적 수익: 12,500,000₩            │
│ ├─ 정산금: 6,250,000₩               │
│ │  (투어 50회 × 평균 250k, 50%)     │
│ ├─ 공제: 206,250₩ (세금 3.3%)       │
│ ├─ 수수료: 0₩                        │
│ └─ 최종: 6,043,750₩                 │
│                                        │
│ 📅 정산 날짜                          │
│ ├─ 정산 기간: 2026-05-01 ~ 05-31    │
│ ├─ 정산 예정: 2026-06-05 (09:00)    │
│ ├─ 상태: ⏳ 대기중 (5일 후)          │
│ └─ 은행: 우리은행 ***-***-5678      │
│                                        │
│ 📋 투어 기록                          │
│ ├─ [날짜] [투어명] [금액] [평점]    │
│ ├─ 05-25 명동개인투어 150,000 ⭐4.9 │
│ ├─ 05-24 한강로맨틱 200,000 ⭐5.0  │
│ ├─ 05-23 K-POP투어 270,000 ⭐4.8   │
│ └─ [이전 월] [상세 조회]             │
│                                        │
└────────────────────────────────────────┘
```

### 5.3 통합 대시보드 (Admin용)

```
Admin 정산 관리 대시보드:

┌────────────────────────────────────────┐
│ 📊 ElSpa 통합 정산 현황                │
├────────────────────────────────────────┤
│                                        │
│ 💰 이번달 총 정산액 (예정)            │
│ ├─ 테라피스트: 4,109,250₩            │
│ ├─ 드라이버: 2,997,700₩              │
│ ├─ 가이드: 6,043,750₩                │
│ └─ 총계: 13,150,700₩ (2026-06-05)   │
│                                        │
│ 📈 정산액 추이 (최근 3개월)           │
│ ├─ 3월: 11,200,000₩                 │
│ ├─ 4월: 12,500,000₩ (+11%)          │
│ └─ 5월: 13,150,700₩ (+5% 예정)     │
│                                        │
│ 👥 정산 대상 (이번달)                 │
│ ├─ 테라피스트: 8명                   │
│ │  ├─ 활성: 6명                     │
│ │  └─ 휴직: 2명                     │
│ ├─ 드라이버: 5명                     │
│ │  ├─ 활성: 4명                     │
│ │  └─ 휴직: 1명                     │
│ └─ 가이드: 12명                      │
│    ├─ 프리랜서: 10명                │
│    └─ 전속: 2명                     │
│                                        │
│ 🔍 상세 검색                          │
│ ├─ [역할: 전체▼] [상태: 활성▼]      │
│ ├─ [기간: 2026-05▼] [은행: 전체▼]   │
│ └─ [검색] [내보내기]                 │
│                                        │
│ 📋 정산 목록 (정산 예정일 역순)       │
│ ├─ [이름] [역할] [정산액] [상태]    │
│ ├─ 박영희 테라피스트 4,109,250 ⏳   │
│ ├─ 김철수 드라이버 2,997,700 ⏳    │
│ ├─ 이민준 가이드 6,043,750 ⏳      │
│ └─ [더보기]                          │
│                                        │
├────────────────────────────────────────┤
│ [정산 실행] (2026-06-05 09:00)       │
│ [엑셀 다운로드] [감사로그]           │
│                                        │
└────────────────────────────────────────┘
```

### 5.4 정산 사이트 기술 스펙

```
Frontend:
├─ 프레임워크: Next.js 14 (Staff Site와 동일)
├─ 스타일: Tailwind CSS (반응형, Dark mode)
├─ PWA: Service Worker, IndexedDB (오프라인 정산 조회)
├─ 로그인: OAuth + JWT (기존과 동일)
└─ 기기: 모바일, 태블릿, 데스크톱

Backend:
├─ API Gateway: /api/settlement/*
├─ 서비스: Settlement Service (신규)
│  ├─ /api/settlement/my (개인 정산 조회)
│  ├─ /api/settlement/history (정산 이력)
│  ├─ /api/settlement/details (상세)
│  ├─ /api/settlement/download (PDF/Excel)
│  └─ /api/settlement/bank-update (은행 정보 변경)
├─ DB: settlements 테이블 (기존 finance와 통합)
└─ 정산 엔진: Bull Queue (기존과 동일)

배포:
└─ Vercel (Staff Site와 동일, 서브도메인)
```

---

## 6. 데이터 모델

### 6.1 DB 테이블 추가 (가이드 관련)

```
신규 테이블:

1. guides (가이드 프로필)
   ├─ id (PK)
   ├─ user_id (FK → users)
   ├─ name
   ├─ email
   ├─ phone
   ├─ bio (소개)
   ├─ languages (JSON: [{lang: 'korean', level: 'native'}, ...])
   ├─ specialties (JSON: ['korean_food', 'gangnam', 'hangang'])
   ├─ profile_photo_url
   ├─ guide_type ('freelance' | 'fulltime')
   ├─ commission_rate (수수료율: 50)
   ├─ base_salary (기본급: 전속 가이드)
   ├─ certification_id (자격증 번호)
   ├─ status ('active' | 'inactive' | 'suspended')
   ├─ rating (평점: 4.8)
   ├─ total_tours (총 투어)
   ├─ created_at
   └─ updated_at

2. guide_tours (가이드 예약)
   ├─ id (PK)
   ├─ guide_id (FK → guides)
   ├─ customer_id (FK → users)
   ├─ tour_type ('private' | 'group' | 'specialty' | 'airport+tour')
   ├─ tour_date
   ├─ start_time
   ├─ end_time
   ├─ duration_hours (소수점: 2.5)
   ├─ location
   ├─ language
   ├─ customer_count
   ├─ tour_price (고객이 지불하는 가격)
   ├─ guide_commission (가이드 수수료)
   ├─ status ('pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled')
   ├─ notes (특별 요청)
   ├─ gps_tracking_enabled (위치 추적)
   ├─ rating (고객 평점)
   ├─ review (고객 리뷰)
   ├─ created_at
   └─ updated_at

3. guide_availability (가이드 일정)
   ├─ id (PK)
   ├─ guide_id (FK → guides)
   ├─ date
   ├─ start_time
   ├─ end_time
   ├─ is_available (이용 가능 여부)
   ├─ reason (휴무 사유: 'vacation', 'sick', 'other')
   └─ created_at

4. guide_location_history (GPS 추적)
   ├─ id (PK)
   ├─ tour_id (FK → guide_tours)
   ├─ latitude
   ├─ longitude
   ├─ timestamp
   ├─ accuracy (정확도)
   └─ indexed_at (쿼리 성능용)

5. guide_settlements (정산 기록)
   ├─ id (PK)
   ├─ guide_id (FK → guides)
   ├─ settlement_date
   ├─ period_start
   ├─ period_end
   ├─ total_tours (투어 수)
   ├─ gross_amount (총액)
   ├─ tax_rate
   ├─ tax_amount
   ├─ fee_amount
   ├─ penalty (페널티)
   ├─ net_amount (최종 정산액)
   ├─ status ('pending' | 'processing' | 'completed' | 'failed')
   ├─ bank_account
   ├─ transaction_id (은행 이체)
   ├─ notes
   ├─ created_at
   └─ updated_at

기존 테이블 확장:

users 테이블:
├─ 추가: roles (JSON: ['therapist', 'guide']) // 다중 역할 가능
└─ 추가: guide_id (FK → guides, NULL이면 가이드 아님)

settlements 테이블:
├─ 추가: settlement_type ('therapist' | 'driver' | 'guide')
└─ 추가: guide_settlement_id (FK → guide_settlements)
```

### 6.2 권한 매트릭스 확장

```
새로운 권한 추가:

Guide 역할:
├─ guide:view_own_tours (자신의 투어 조회)
├─ guide:update_availability (일정 설정)
├─ guide:accept_reject_tour (투어 수락/거부)
├─ guide:mark_tour_complete (투어 완료 표시)
├─ guide:view_own_settlement (자신의 정산 조회)
├─ guide:update_profile (프로필 수정)
└─ guide:download_settlement (정산 다운로드)

Admin 권한 (기존 확장):
├─ guide:manage_all (모든 가이드 관리)
├─ guide:set_commission (수수료율 설정)
├─ guide:manual_settlement (수동 정산)
├─ guide:suspend (가이드 중단)
└─ guide:analytics (분석 리포트)
```

---

## 7. 프로세스 흐름도

### 7.1 가이드 예약 전체 흐름

```
[고객] ───────────────────────────────────────── [가이드]
  │
  │ 1. User Site에서 투어 검색/예약
  ├──→ [투어 타입 선택]
  │   [날짜/시간/인원]
  │   [가이드 선택]
  │   [결제]
  │
  │ 2. 예약 생성
  ├──→ guide_tours 테이블에 저장 (status: pending)
  │
  │ 3. 가이드에게 알림 (수락 필요)
  │   (Staff Site 알림)
  │                         ←─ 가이드 로그인
  │                            [대기 중인 투어 보기]
  │                            [수락/거부]
  │
  │ 4-a. 수락한 경우
  ├─────────────────────────→ guide_tours.status = 'confirmed'
  │     (고객과 가이드에게 확인)
  │
  │ 4-b. 거부한 경우
  │                         ←─ [거부] 클릭
  ├─────────────────────────→ guide_tours.status = 'rejected'
  │     (자동으로 다른 가이드에게 배정)
  │
  │ 5. 투어 당일
  ├──→ [투어 시작] (가이드)
  │                         ←─ GPS 활성화
  │                            [위치 공유]
  │                            [타이머 시작]
  │
  │ 6. 투어 진행
  │   (고객이 실시간 위치 추적)
  │                         ←─ 가이드 진행 중
  │                            [사진/메모 추가]
  │
  │ 7. 투어 종료
  ├──→ [완료] (가이드)      guide_tours.status = 'completed'
  │                         ←─ [투어 완료]
  │
  │ 8. 고객 리뷰
  ├──→ [평점/리뷰 작성]     guide_tours.status = 'reviewed'
  │     (가이드 평점 업데이트)
  │
  │ 9. 자동 정산 (매일 01:00)
  │   Bull Queue 실행
  ├──→ guide_settlements 생성
  │     (수수료 계산)
  │     (세금 공제)
  │     (최종 금액 계산)
  │                         ←─ [정산 조회]
  │                            Settlement Site
  │                            (확인/다운로드)
  │
  │ 10. 은행 이체 (매일 09:00)
  ├──→ 실제 계좌이체
  │                         ←─ [정산 완료]
  │     guide_settlements.status = 'completed'

Timeline:
Day 1: 예약 (pending)
Day 2: 수락 (confirmed)
Day 5: 투어 (in_progress → completed)
Day 5: 리뷰 (reviewed)
Day 6: 정산 (정산액 계산)
Day 6: 이체 (정산 완료)
```

### 7.2 정산 프로세스

```
Bull Queue (매일 01:00 실행):

1. 정산 대상 조회
   SELECT * FROM guide_tours
   WHERE status = 'reviewed'
   AND created_at BETWEEN YESTERDAY AND TODAY

2. 가이드별로 그룹화

3. 각 가이드의 정산액 계산
   FOR EACH guide:
     total_tours = COUNT(guide_tours)
     gross_amount = SUM(guide_commission)
     tax_amount = gross_amount × 0.033
     fee_amount = 1,000 (고정)
     net_amount = gross_amount - tax_amount - fee_amount
   
4. guide_settlements 레코드 생성
   INSERT INTO guide_settlements (...)
   
5. 정산 알림 (가이드에게)
   [정산 완료] 메일/푸시

6. Admin 대시보드 업데이트
   Settlement Site에서 확인 가능

7. 은행 이체 (별도 프로세스)
   시간: 매일 09:00
   → guide_settlement.transaction_id 저장
```

---

## 8. 아키텍처 영향 분석

### 8.1 기존 아키텍처 변경 사항

```
마이크로서비스 구조에 추가:

기존 (7개):
├─ Auth Service
├─ Chat Service
├─ Booking Service
├─ Schedule Service
├─ Finance Service
├─ Employee Service
└─ Driver Service

신규:
└─ Guide Service (또는 Booking Service 확장)
   ├─ /api/guides (가이드 관리)
   ├─ /api/guide-tours (투어 예약)
   ├─ /api/guide-availability (일정)
   ├─ /api/guide-settlements (정산)
   └─ /api/guide-location (GPS)

Finance Service 확장:
├─ therapist_settlements (기존)
├─ driver_settlements (기존)
└─ guide_settlements (신규)
```

### 8.2 데이터베이스 설계

```
기존 구조 (모놀리식 → 마이크로서비스):

Phase A (모놀리식):
└─ 1개 PostgreSQL
   ├─ users
   ├─ therapists
   ├─ drivers
   ├─ guide_tours (신규)
   ├─ guides (신규)
   └─ settlements (기존 + 신규)

Phase B (마이크로서비스):
├─ Auth Service DB
│  └─ users
├─ Guide Service DB (신규)
│  ├─ guides
│  ├─ guide_tours
│  ├─ guide_availability
│  └─ guide_location_history
├─ Finance Service DB (기존 + 확장)
│  ├─ guide_settlements (신규)
│  ├─ therapist_settlements (기존)
│  └─ driver_settlements (기존)
└─ 기타 (Chat, Booking, Schedule, Employee, Driver)
```

### 8.3 외부 통합

```
신규 외부 서비스:

1. Maps API (위치 추적용)
   └─ Google Maps (드라이버와 동일)
   
2. GPS 센서 (모바일)
   └─ Geolocation API (기존)
   
3. 정산 시스템 (기존 확장)
   └─ 은행 API (기존)
```

---

## 9. Epic/Stories 추가 사항

### 9.1 새로운 Epic (v4로 업그레이드 필요)

```
기존: 12개 Epic, 95개 Story, 825pt
신규: 13개 Epic, 120개 Story, 1,100pt+

신규 Epic:

Epic 13: Guide Service (가이드 서비스)
- Points: 150
- Duration: W5-W7 (Phase B 중간)
- Stories:
  S13.1: 가이드 프로필 & 역할 관리 (18pt)
  S13.2: 가이드 예약 시스템 (30pt)
  S13.3: 가이드 일정 & 가용성 (22pt)
  S13.4: 가이드 GPS 추적 (25pt)
  S13.5: 가이드 평점 & 리뷰 (16pt)
  S13.6: 가이드 정산 계산 (24pt)
  S13.7: Guide Service Microservice (15pt)

Epic 14: Settlement Site (통합 정산 사이트)
- Points: 80
- Duration: W6-W8 (Phase B 후반)
- Stories:
  S14.1: 정산 사이트 기초 (15pt)
  S14.2: 테라피스트 정산 대시보드 (15pt)
  S14.3: 드라이버 정산 대시보드 (15pt)
  S14.4: 가이드 정산 대시보드 (20pt)
  S14.5: Admin 통합 정산 (15pt)

Epic 15: User Site 확장 (여행 예약)
- Points: 60
- Duration: W5-W6
- Stories:
  S15.1: 투어 검색 & 필터 (18pt)
  S15.2: 투어 상세 & 가이드 프로필 (15pt)
  S15.3: 투어 예약 플로우 (18pt)
  S15.4: 예약 확인 & 추적 (9pt)

Epic 16: Staff Site 확장 (가이드 탭)
- Points: 40
- Duration: W4-W5
- Stories:
  S16.1: 가이드 대시보드 기초 (12pt)
  S16.2: 투어 수락/거부 (10pt)
  S16.3: GPS 위치 공유 (12pt)
  S16.4: 투어 성과 대시보드 (6pt)
```

### 9.2 기존 Epic 영향받는 부분

```
Epic 1 (Auth): +5pt
  └─ 가이드 로그인 (역할 추가)

Epic 2 (Chat): +10pt
  └─ 가이드 채팅 (별도 채널)

Epic 3 (Booking): +20pt
  └─ 투어 예약 (Booking Service 확장)

Epic 4 (Finance): +30pt
  └─ 가이드 정산 (settlements 테이블 확장)

Epic 5 (Employee): +10pt
  └─ 가이드 프로필 (Staff와 유사)

Epic 7 (Staff Site): +15pt
  └─ 가이드 탭 추가

총 추가: 90pt
```

---

## 요약 & 다음 단계

```
✅ 완료된 작업:
- 여행 가이드 기능 정의
- 가이드 예약 시스템 설계
- 가이드 정산 구조 정의
- 통합 정산 사이트 아키텍처
- 데이터 모델 설계
- 프로세스 흐름도
- 아키텍처 영향 분석

⏭️  다음 단계:
1. 최종 Epic/Stories v4 작성
   └─ 기존 v3 + 신규 4개 Epic + 기존 Epic 확장
   
2. 가이드 UX 디자인 (Tailwind)
   ├─ User Site: 투어 검색, 예약, 추적
   ├─ Staff Site: 가이드 탭, 일정, GPS
   └─ Settlement Site: 가이드 정산 페이지
   
3. API 명세서 추가
   ├─ Guide Service API
   ├─ Guide Tour API
   └─ Guide Settlement API
   
4. 데이터베이스 마이그레이션 계획
   └─ Phase A (모놀리식) → Phase B (마이크로)
   
5. 개발팀 규모 재산정
   └─ Phase B W5+: 가이드 서비스 개발 인력 추가
```

