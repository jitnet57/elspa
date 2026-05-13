# OTA 플랫폼 연동 분석
**Online Travel Agency (OTA) Integration Analysis | Date: 2026-05-06**

---

## 목차
1. [연동 가능성 평가](#1-연동-가능성-평가)
2. [각 플랫폼별 상세 분석](#2-각-플랫폼별-상세-분석)
3. [구체적 연동 방식](#3-구체적-연동-방식)
4. [3단계 실행 전략](#4-3단계-실행-전략)
5. [기술 요구사항](#5-기술-요구사항)
6. [비용 & 일정](#6-비용--일정)

---

## 1. 연동 가능성 평가

### 플랫폼별 평가 매트릭스

| 플랫폼 | 가능성 | 난이도 | 비용 | 우선순위 | 비고 |
|-------|--------|--------|------|---------|------|
| **Google Business Profile** | ⭐⭐⭐⭐⭐ | ⭐ | 무료 | P0 | 가장 쉽고 효과적 |
| **MyRealTrip** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 낮음 | P1 | 국내 최적, 마진율 20% |
| **TripAdvisor** | ⭐⭐⭐ | ⭐⭐⭐ | 중간 | P2 | 리뷰/평점 중심 |
| **Trip.com** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 높음 | P3 | 글로벌, 복잡한 승인 |
| **Viator/GetYourGuide** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 높음 | P3 | 투어 전문, 높은 마진율 |

**결론**: **Google → MyRealTrip → Trip.com** 순서로 진출 권장

---

## 2. 각 플랫폼별 상세 분석

### 2.1 Google Business Profile (즉시)

#### 개요
- **URL**: https://business.google.com
- **특징**: 무료, 검색/지도 노출, 리뷰 수집
- **마진율**: 0% (Google은 수수료 없음, 고객 유입만 역할)

#### 장점
- 구글 검색에서 "서울 여행 가이드" 검색 시 상단 노출
- 리뷰 신뢰도 극도로 높음
- 별도 앱 설치 불필요

#### 단점
- 직접 예약 처리 불가 (elspa 링크로 리다이렉트)
- 통합 예약 시스템 없음

#### 연동 범위
```
elspa 가이드 정보
  ├─ 이름, 가격, 운영시간, 언어
  ├─ 투어 루트 (지도)
  ├─ 사진/비디오
  └─ 연락처 & 예약 버튼 (elspa 웹사이트로 이동)
```

#### 작업 체크리스트
- [ ] Google Business Profile 등록
- [ ] 가이드 정보 업로드 (한국어 + 영어)
- [ ] 사진 최소 10장 (HD)
- [ ] 초기 리뷰 5개 수집
- [ ] 예약 링크 설정 (elspa 사용자 사이트)

**예상 소요시간**: 3-5일

---

### 2.2 MyRealTrip

#### 개요
- **URL**: https://www.myrealtrip.com (국내 최대 체험 플랫폼)
- **마진율**: 20-25% (기본)
- **수수료 모델**: 거래액의 20% (한국 가이드 표준)
- **월간 방문자**: 약 300만명

#### API 구조
```
MyRealTrip 플랫폼
├─ Product API
│  ├─ 상품 등록/수정
│  ├─ 가용성 관리
│  └─ 가격 설정
├─ Booking Webhook
│  └─ 예약 생성 → elspa 자동 전송
└─ Settlement API
   └─ 정산금액 조회 및 자동 이체
```

#### 연동 단계

**1단계: 파트너 신청** (1일)
```
요청 정보:
- 사업자등록증
- 대표자 정보
- 은행 계좌
- 예상 월 예약수
```

**2단계: API 통합** (7-10일)
```
개발 작업:
1. MyRealTrip API 토큰 발급
2. elspa 가이드 데이터 → MyRealTrip Product Feed 변환
3. 예약 Webhook 수신 → elspa DB 자동 저장
4. 정산 자동화 (수주 1회)
```

**3단계: 상품 등록** (3-5일)
```
등록 항목:
- 가이드 프로필 (사진, 언어, 경력)
- 투어 상세 (일정, 포함사항, 제외사항)
- 가격 및 일정
- 취소 정책
```

#### 예상 Feed 포맷

```json
{
  "products": [
    {
      "id": "guide_001",
      "name": "서울 강북투어 (한국말/영어)",
      "category": "local_experience",
      "duration_minutes": 180,
      "price_krw": 80000,
      "language": ["korean", "english"],
      "guide_name": "김철수",
      "guide_rating": 4.8,
      "thumbnail_url": "https://elspa.com/images/tour_001.jpg",
      "description": "...",
      "included": ["기념품", "음료"],
      "excluded": ["식사"],
      "max_participants": 8,
      "availability": "2026-05-06~2026-12-31"
    }
  ]
}
```

#### 성공 사례
- 한국 가이드 평균 월 30-50회 예약
- 평균 투어 가격: 80,000원
- 월 수익: 약 1.6-2.0M원 (수수료 후)

**예상 소요시간**: 2-3주

---

### 2.3 Trip.com (글로벌 진출)

#### 개요
- **URL**: https://www.trip.com
- **마진율**: 15-20%
- **월간 방문자**: 약 1억명
- **국가**: 190개국 지원

#### 특징
- 비자 신청부터 숙박, 투어까지 통합
- 중국 고객 접근 용이 (모회사: Trip.com Group)
- 높은 신뢰도 및 보험 지원

#### 단점
- 영업 심사가 까다로움
- 다국어 지원 필수 (최소 3개 언어)
- 환율/정산 복잡도 높음
- 영어 문서 및 계약서 필수

#### 연동 난이도

```
기술 난이도:   ⭐⭐⭐⭐ (높음)
영업 난이도:   ⭐⭐⭐⭐⭐ (매우 높음)
시간 소요:     4-6주
```

#### 사전 요구사항
- [ ] 영어 웹사이트 준비
- [ ] 투어 가이드 자격증 (국제 기준)
- [ ] 여행자 보험 (최소 USD 1M)
- [ ] 다국어 고객 지원 (이메일/채팅)
- [ ] 국제 결제 게이트웨이 (Stripe, PayPal)

**예상 소요시간**: 2-3개월

---

### 2.4 Viator / GetYourGuide

#### 특징
- **Viator** (TripAdvisor 자회사)
  - 마진율: 15-20%
  - 투어 전문 플랫폼
  - 광고 지원 있음

- **GetYourGuide**
  - 마진율: 20%
  - 유럽/아시아 강세
  - 한국 가이드 니즈 높음

#### 장점
- 글로벌 투어 커뮤니티 활동
- 마케팅 지원 (광고 예산 제공)
- 게스트 평점 높으면 추천 부스트

#### 단점
- 초기 검증 기간 길음 (2-3개월)
- 한국 가이드 공급 부족으로 높은 기대치
- 영어 고객 지원 필수

**예상 소요시간**: 2-3개월

---

## 3. 구체적 연동 방식

### 3.1 MyRealTrip 기술 스펙

#### API Endpoint

```
Base URL: https://api.myrealtrip.com/v1

# 상품 등록
POST /products
Content-Type: application/json
Authorization: Bearer {API_TOKEN}

{
  "title": "서울 강북투어",
  "category": "local_experience",
  "duration_minutes": 180,
  "price_krw": 80000,
  ...
}

# 예약 Webhook (MyRealTrip → elspa)
POST /webhooks/bookings
X-MRT-Signature: {HMAC_SHA256}

{
  "event": "booking.created",
  "booking_id": "booking_12345",
  "guide_id": "guide_001",
  "customer_name": "...",
  "booking_date": "2026-05-10",
  "participants": 2,
  "status": "confirmed"
}
```

#### elspa 통합 플로우

```
elspa 시스템
├─ 1. 가이드 데이터 → MyRealTrip Feed 생성
│  ├─ 일일 배치 (새벽 2시)
│  ├─ 실시간 업데이트 (가격/일정 변경 시)
│  └─ 포맷 변환 엔진
│
├─ 2. MyRealTrip 예약 수신
│  ├─ Webhook 리스너 (FastAPI)
│  ├─ 중복 체크
│  └─ elspa 예약 DB 자동 생성
│
├─ 3. 정산 자동화
│  ├─ 주간 정산 조회 API
│  ├─ 가이드별 수수료 계산
│  └─ 은행 계좌 자동 이체
│
└─ 4. 고객 피드백
   ├─ MyRealTrip 리뷰 → elspa 리뷰로 동기화
   └─ 평점 자동 반영
```

### 3.2 elspa 코드 구조 (FastAPI 기준)

#### 신규 모듈 추가

```
app/
├─ integrations/
│  ├─ __init__.py
│  ├─ myrealtrip/
│  │  ├─ api_client.py        # API 호출
│  │  ├─ webhook_handler.py    # 예약 수신
│  │  ├─ feed_generator.py     # 상품 피드 생성
│  │  └─ settlement.py         # 정산 자동화
│  ├─ trip_com/
│  │  └─ ...
│  └─ google_business/
│     └─ ...
│
├─ models/
│  └─ ota_booking.py          # OTA 예약 모델
│
├─ services/
│  └─ ota_integration_service.py
│
└─ api/
   └─ ota_webhooks.py         # POST /webhooks/myrealtrip
```

---

## 4. 3단계 실행 전략

### Phase 1: 기초 구축 (1주)

**목표**: Google 노출 + elspa 검증

```
Week 1
├─ Day 1-2: Google Business Profile 설정
│  └─ 가이드 프로필, 사진, 연락처 등록
├─ Day 3-4: 초기 리뷰 수집 (5개)
│  └─ 베타 테스터를 통한 리뷰 생성
└─ Day 5-7: elspa 사용자 사이트 최적화
   └─ 예약 페이지 다국어 지원

결과물: Google Maps에 elspa 가이드 등장
```

**담당자**: 마케팅 담당
**비용**: 0원
**위험**: 낮음

---

### Phase 2: MyRealTrip 진출 (2-3주)

**목표**: 국내 고객 확보 + 월 20회 이상 예약

```
Week 1
├─ Day 1-2: MyRealTrip 파트너 신청
│  └─ 비즈니스 정보 및 서류 제출
├─ Day 3-5: API 토큰 발급 및 문서 검토
└─ Day 6-7: 개발팀 온보딩

Week 2
├─ Day 1-3: Feed 생성 엔진 개발 (FastAPI)
│  ├─ 가이드 데이터 → JSON 변환
│  ├─ 테스트 상품 5개 등록
│  └─ 예약 Webhook 리스너 구현
├─ Day 4-5: 테스트 예약 수행
└─ Day 6-7: 정산 API 통합

Week 3
├─ Day 1-3: 상품 등록 및 마케팅
│  ├─ 가이드별 투어 10개 등록
│  ├─ 사진 및 설명 최적화
│  └─ 가격 및 일정 설정
├─ Day 4-5: 라이브 검증
└─ Day 6-7: 모니터링 및 최적화

결과물: MyRealTrip에 elspa 가이드 5명 등록, 주간 10회 예약
```

**담당자**: 개발팀 1명 + 마케팅 1명
**비용**: 0원 (수수료는 매출 기반)
**위험**: 중간 (API 연동 복잡도)

---

### Phase 3: Trip.com 진출 (3개월)

**목표**: 글로벌 고객 진입, 월 50회 예상

```
Month 1: 사전 준비
├─ 영어 웹사이트 구축
├─ 가이드 자격증 준비
├─ 여행자 보험 가입
└─ Trip.com 영업팀 접촉

Month 2: API 개발 및 테스트
├─ Trip.com API 분석
├─ 다국어 지원 (한국어/영어/중국어)
├─ 환율 및 정산 시스템 구축
└─ 테스트 예약 수행

Month 3: 운영 최적화
├─ 상품 공식 등록 (20개+)
├─ 고객 리뷰 모니터링
└─ 마케팅 캠페인 (유료 광고)

결과물: Trip.com에서 월 50회 예약, 글로벌 고객 진입
```

**담당자**: 개발팀 2명 + 마케팅 1명 + 영업 1명
**비용**: 10-20M원 (인력 + 광고)
**위험**: 높음 (글로벌 운영)

---

## 5. 기술 요구사항

### 5.1 현재 elspa 스택에서 추가할 모듈

| 항목 | 현재 상태 | 필요 사항 | 우선순위 |
|------|---------|---------|---------|
| **API Gateway** | FastAPI 기본 라우터 | OTA 전용 라우터 분리 | P1 |
| **Webhook Handler** | 없음 | 예약/정산 Webhook 수신 | P1 |
| **Feed 생성 엔진** | 없음 | XML/JSON 변환 (일일 배치) | P1 |
| **정산 자동화** | 구글시트 수동 | OTA별 정산 API 통합 | P2 |
| **다국어 지원** | 한국어만 | 영어, 중국어 추가 | P2 |
| **환율 시스템** | 없음 | 실시간 환율 연동 (OpenExchangeRates) | P3 |
| **결제 게이트웨이** | Stripe 기본 | 다중 결제수단 (PayPal, WeChat Pay) | P3 |

### 5.2 필요한 의존성 추가

```python
# requirements.txt에 추가

# OTA 통합
requests>=2.31.0          # HTTP 통신
httpx>=0.24.0            # Async HTTP
python-dateutil>=2.8.0   # 날짜 처리

# 웹훅 처리
pydantic>=2.0.0          # 데이터 검증
cryptography>=41.0.0     # HMAC 서명 검증

# 데이터 변환
xmltodict>=0.13.0        # XML ↔ JSON 변환
pandas>=2.0.0            # 데이터 처리

# 환율
requests-cache>=1.1.0    # API 응답 캐싱
```

### 5.3 Environment Variables

```bash
# .env.example에 추가

# MyRealTrip
MYREALTRIP_API_TOKEN=xxx
MYREALTRIP_API_SECRET=xxx
MYREALTRIP_WEBHOOK_SECRET=xxx

# Trip.com
TRIP_COM_API_KEY=xxx
TRIP_COM_API_SECRET=xxx
TRIP_COM_PARTNER_ID=xxx

# Google Business
GOOGLE_BUSINESS_API_KEY=xxx
GOOGLE_MAPS_API_KEY=xxx (기존)

# 환율
OPENEXCHANGERATES_API_KEY=xxx

# 메일 (정산 알림)
MAIL_FROM=settlement@elspa.com
SENDGRID_API_KEY=xxx (기존)
```

---

## 6. 비용 & 일정

### 6.1 개발 비용 (수수료 제외)

| Phase | 항목 | 비용 | 비고 |
|-------|------|------|------|
| **Phase 1** | Google Business (무료) | 0원 | 마케팅 담당 시간만 |
| **Phase 2** | MyRealTrip 개발 | 5-8M원 | 개발 1명 × 2주 |
| **Phase 2** | 마케팅 (초기) | 2-3M원 | 콘텐츠 작성, SNS |
| **Phase 3** | Trip.com 개발 | 15-20M원 | 개발 2명 × 3주 |
| **Phase 3** | 글로벌 마케팅 | 10-15M원 | 광고 예산 |
| **공통** | 여행자 보험 | 1-2M원/년 | 매년 갱신 |
| **공통** | 환율/결제 시스템 | 3-5M원 | 일회성 |
| **공통** | 고객 지원 인력 | 5M원/월 | 다국어 채팅 |
| | **총 개발 비용** | **약 41-58M원** | 1년 기준 |

### 6.2 예상 매출 (보수적 추정)

#### Phase 2: MyRealTrip

```
초기 (1-3개월): 주당 2-3회 예약
├─ 평균 투어 가격: 80,000원
├─ MyRealTrip 수수료: -20,000원
├─ 가이드 보수 (elspa): -30,000원
├─ elspa 수수료: +10,000원/건

월 예약: 30회
월 elspa 수익: 300,000원
연간 수익: 3.6M원
```

#### Phase 3: Trip.com + Viator

```
6개월 후: 주당 10-15회 예약
├─ MyRealTrip: 8회/주 → 월 32회
├─ Trip.com: 3회/주 → 월 12회
├─ Viator: 2회/주 → 월 8회

총 월 예약: 52회
elspa 월 수익: 5-6M원
연간 수익: 60-72M원
```

### 6.3 손익분기점

```
초기 투자:         ~50M원 (개발 + 마케팅 + 보험)
Phase 2 기여:     +3.6M원/년
Phase 3 기여:     +60M원/년 (6개월 후)

기대 ROI:
- 1년차: -46M원 (투자 회수 중)
- 2년차: +15M원 (손익분기점 통과)
- 3년차+: +60M원/년 (안정화)
```

---

## 7. 실행 체크리스트

### Phase 1: Google (1주, 담당자: 마케팅)
- [ ] Google Business Profile 등록
- [ ] 가이드 프로필 이미지 업로드 (10장)
- [ ] 한국어/영어 설명 작성
- [ ] 초기 5개 리뷰 수집
- [ ] 예약 버튼 설정 (elspa 링크)
- [ ] Google Analytics 연동

### Phase 2: MyRealTrip (2-3주, 담당자: 개발 1명)
- [ ] MyRealTrip 파트너 신청
- [ ] API 토큰 발급 및 문서 검토
- [ ] Feed 생성 엔진 개발 (FastAPI)
- [ ] Webhook 리스너 구현
- [ ] 정산 API 통합
- [ ] 테스트 상품 5개 등록 후 라이브
- [ ] 모니터링 대시보드 구축

### Phase 3: Trip.com (3개월, 담당자: 개발 2명 + 마케팅)
- [ ] 영어 웹사이트 구축
- [ ] 여행자 보험 가입 (USD 1M+)
- [ ] Trip.com API 분석 및 개발
- [ ] 다국어 지원 구현
- [ ] 환율/정산 시스템 구축
- [ ] 테스트 예약 및 정산 검증
- [ ] 공식 상품 20개+ 등록
- [ ] 유료 광고 캠페인 시작

---

## 8. 의사결정 가이드

### "언제 시작해야 하나?"

**즉시**: Google Business Profile
- 비용 0, 효과 높음, 위험 낮음

**다음 2-3주**: MyRealTrip
- 국내 고객 검증 필수
- elspa 플랫폼 안정성 확보 후

**3개월 후**: Trip.com
- MyRealTrip에서 월 30회 이상 검증 후
- 다국어/글로벌 운영 준비 완료 후

### "어느 플랫폼부터?"

| 시나리오 | 권장 순서 |
|---------|----------|
| **국내 시장 집중** | Google → MyRealTrip |
| **글로벌 전략** | Google → MyRealTrip → Trip.com |
| **빠른 성장** | Google + MyRealTrip (동시) → Trip.com |
| **리스크 최소화** | Google → MyRealTrip (6개월 안정) → Trip.com |

---

## 9. 다음 단계

### 즉시 추천

1. **Google Business 등록** (이번주)
   - 비용 0, 효과 높음
   - 마케팅 담당이 주도

2. **MyRealTrip API 분석** (2-3일)
   - 기술 타당성 검증
   - 개발 일정 확정

3. **의사결정 회의**
   - 투자 규모 결정
   - 인력 배치 결정

---

**작성자**: Claude Code AI  
**버전**: 1.0  
**최종 수정**: 2026-05-06  
**상태**: 준비완료 ✅
