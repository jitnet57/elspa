# 한국 30일 런칭 플레이북

> ElSpa Manager - Korea Launch Strategy (Jun 1-30, 2026)

---

## 📊 목표 (Goal)

- **Month 1 수익**: ₩8,000,000 (약 $6,000 USD)
- **고객 확보**: 3-5 명
- **시스템 안정성**: 99.5% uptime
- **고객 만족도**: NPS 50+

---

## 🎯 Week 1: Foundation (Jun 1-7)

### Day 1-2: Office & 법무 Setup

**할 작업 목록**
- [ ] 강남/서초 임차 사무실 확보 (최소 30평)
- [ ] 한국 법인 등록 (유한회사 "ElSpa Korea LLC")
- [ ] 사업자 등록번호 신청
- [ ] 계좌 개설 (기업은행/우리은행)
- [ ] 통신판매신고 완료

**세부 사항**
```
오피스 위치: 강남역 3번출구 (테라피스트/스파 밀집)
필수 설비: 데스크 5개, 회의실 1개, 서버실 1개
관리비: ₩2,500,000/월

법인등록:
- 지방세청 신청 (온라인 가능)
- 세무서 신고 (매출세 등록)
- 근로복지공단 가입 (직원 고용 시)
```

**담당**: 법무팀 (외부 변호사)  
**비용**: ₩5,000,000

---

### Day 3-4: Korean Payment Gateways 통합

**할 작업 목록**
- [ ] NICE Payments 계약 (신용카드 결제)
- [ ] 토스 비즈니스 계약 (송금/정산)
- [ ] 국민계좌이체 API 통합
- [ ] 폰페이 API 검토 (미사용 → 추후)

**기술 구현**
```python
# backend/payment_kr.py

from fastapi import APIRouter
from nicepay import NicePayClient

router = APIRouter(prefix="/api/payment-kr", tags=["payment-korea"])
nice_client = NicePayClient(
    merchant_id=os.getenv("NICE_MERCHANT_ID"),
    api_key=os.getenv("NICE_API_KEY")
)

@router.post("/charge")
async def charge_card(customer_id: int, amount_krw: int):
    """
    신용카드 결제 (NICE Payments)
    - 자동 정산 (매일 23:00)
    - 수수료: 2.9% (카드 결제)
    """
    payment = await nice_client.charge(
        merchant_id=customer_id,
        amount=amount_krw,
        description="ElSpa 월간 구독료"
    )
    return payment

@router.post("/bank-transfer")
async def request_bank_transfer(customer_id: int, amount_krw: int):
    """
    국민계좌이체 (은행 이체)
    - 수수료: 1,000원 (고정)
    - 정산: 익영업일
    """
    transfer = await toss_client.request_transfer(
        amount=amount_krw,
        description="ElSpa 정산금"
    )
    return transfer
```

**담당**: 기술팀  
**비용**: ₩2,000,000 (통합비용 + 월간 수수료)

---

### Day 5-7: Korean Localization & 스크립트 최종화

**할 작업 목록**
- [ ] UI 한국어 번역 100% (frontend)
- [ ] 은행 명칭 및 계좌이체 UI 수정
- [ ] 세금계산서 자동생성 모듈 추가
- [ ] 스파 산업 용어 확인 (매니저/테라피스트/예약관리)

**프론트엔드 수정** (e:/elspa/frontend)
```typescript
// src/locales/ko.json - 신규 파일

{
  "payment": {
    "creditCard": "신용카드 결제",
    "bankTransfer": "국민계좌이체",
    "toss": "토스",
    "naver": "네이버페이",
    "kakao": "카카오페이",
    "method": "결제 방식"
  },
  "invoice": {
    "taxInvoice": "세금계산서",
    "issueDate": "발급일",
    "businessNumber": "사업자등록번호",
    "serviceDescription": "용역비"
  },
  "role": {
    "therapist": "테라피스트",
    "manager": "매니저",
    "admin": "관리자",
    "owner": "원장"
  }
}
```

**세금계산서 모듈**
```python
# backend/invoice_kr.py

from datetime import datetime
from enum import Enum

class InvoiceType(str, Enum):
    MONTHLY_SERVICE = "월간 서비스료"
    CONSULTING = "컨설팅비"
    SUPPORT = "기술지원비"

class KoreanInvoice:
    def __init__(self, customer_name: str, business_num: str, amount: int):
        self.customer_name = customer_name
        self.business_num = business_num
        self.amount = amount
        self.issue_date = datetime.now()
    
    def generate_xml(self) -> str:
        """
        국세청 전자세금계산서 XML 형식
        """
        xml = f"""
        <Invoice>
            <Header>
                <Type>01</Type>  <!-- 세금계산서 -->
                <IssueDate>{self.issue_date.strftime('%Y%m%d')}</IssueDate>
            </Header>
            <Summary>
                <SupplierName>ElSpa Korea LLC</SupplierName>
                <SupplierNumber>123-45-67890</SupplierNumber>
                <CustomerName>{self.customer_name}</CustomerName>
                <CustomerNumber>{self.business_num}</CustomerNumber>
                <Amount>{self.amount}</Amount>
            </Summary>
        </Invoice>
        """
        return xml
```

**판매 스크립트 (한국 맥락)**
```markdown
## 전화 영업 스크립트

### Opening (3분)
"안녕하세요, ElSpa Manager의 김철수입니다.

저희는 **스파/마사지 매장의 예약/급여 관리를 자동화하는 솔루션**을 
제공하고 있습니다.

현재 예약 관리는 어떻게 하고 계신가요?"

### Pain Point 확인 (2분)
- 수기 예약 관리로 인한 실수
- 직원 급여 계산의 복잡성
- 월말 정산에 소요되는 시간
- 고객 정보 관리의 어려움

### Solution 제시 (3분)
"저희 시스템은:
1. **자동 예약 관리** - 중복예약 제로
2. **자동 급여 정산** - 한건씩 자동 계산 (테라피 시간당 기준)
3. **세금계산서 자동생성** - 회계 시간 50% 단축
4. **고객 이력 관리** - CRM 통합"

### 데모 요청 (1분)
"이번 주 목요일 오후 2시에 30분간 데모를 보여드릴 수 있습니다.
어떻게 될까요?"

### Closing
"감사합니다. 확인 후 연락드리겠습니다."
```

**담당**: 마케팅/세일스팀  
**비용**: ₩1,000,000

---

## 🎯 Week 2: First Sales (Jun 8-14)

### Day 8-9: Top 10 Target 고객 리스트 작성

**할 작업 목록**
- [ ] 강남/서초 고급 스파 20곳 리스트업
- [ ] 예약 시스템 없는 매장 10곳 선정
- [ ] CEO/원장 연락처 확보
- [ ] 경영 규모 분석 (직원 수, 월간 예약)

**Target 기준**
```
점수 = 직원수(높을수록 좋음) × 월간예약(높을수록) × 시스템부재(1점)

예시:
1. 강남 럭셔리 스파A: 직원 25명, 월간 500예약 → 점수 12,500
2. 강남 뷰티 살롱B: 직원 15명, 월간 300예약 → 점수 4,500
3. 서초 마사지숍C: 직원 8명, 월간 150예약 → 점수 1,200
```

**Top 10 List**
```
순위 | 업소명 | 위치 | 직원수 | 월간예약 | 연락처 | 상태
-----|--------|------|--------|---------|--------|--------
1    | 럭셔리스파A | 강남 | 25 | 500 | 010-1234-5678 | 콜드 아웃리치
2    | 프리미엄뷰티B | 강남 | 18 | 380 | 010-2345-6789 | 콜드 아웃리치
3    | ...
```

**담당**: 세일스 개발 매니저  
**비용**: ₩500,000 (리스트 구축, 연락처 확보)

---

### Day 10-11: 콜드 아웃리치 & 미팅 스케줄링

**할 작업 목록**
- [ ] 10명 중 5명에게 최소 3회 콜 시도
- [ ] 2명 이상 데모 미팅 확보
- [ ] Follow-up email 발송 (한국어)
- [ ] LinkedIn 인증 (한국 바이어)

**콜드 콜 전략**
```
Day 10 오전: 10곳 이메일 발송 (한국어 자료 첨부)
Day 10 오후: 10곳 전화 콜 시도 1차
Day 11 오전: 응답 없는 곳 재콜 2차
Day 11 오후: 데모 미팅 확정

성공 가정: 10 calls → 50% 응답 → 30% 데모 약속 = 2명
```

**Email Template (한국어)**
```markdown
제목: [새로운 솔루션] 스파/마사지 예약 관리 자동화

안녕하세요, [원장명]님,

저희는 **스파/마사지 매장의 예약 및 급여 관리를 100% 자동화**하는 
솔루션을 제공하고 있습니다.

현재 다음과 같은 고민이 있으신가요?
✓ 예약을 수기로 관리 중 (중복예약 발생)
✓ 직원 급여를 엑셀로 계산 (시간 소요)
✓ 월말 정산이 복잡 (회계 부담)

**저희 솔루션은:**
- 24/7 예약 관리 (고객 앱 + 웹)
- 자동 급여 정산 (시간당 기준)
- 세금계산서 자동 생성
- CRM 고객 이력 관리

이번 주 목요일 오후 2시에 30분간 데모를 보여드릴 수 있습니다.
어떻게 될까요?

감사합니다.
[이름] / ElSpa Manager Korea
전화: 02-1234-5678
```

**담당**: 세일스팀  
**기대 성과**: 2-3명 데모 약속

---

### Day 12-14: 데모 & 상담 (3+ 건)

**할 작업 목록**
- [ ] 3명 이상 데모 진행
- [ ] 각 고객별 Pain Point 기록
- [ ] 커스터마이징 필요사항 파악
- [ ] Pricing 협상 준비

**데모 Flow (30분)**
```
0-5분: 인사 & 니즈 파악
"현재 예약 시스템은 어떻게 운영하세요?"

5-15분: 라이브 데모
- 웹 대시보드 (관리자 뷰)
- 모바일 앱 (고객 예약)
- 직원 급여 계산 (자동)
- 세금계산서 생성

15-25분: Q&A & 커스터마이징
"특별히 필요한 기능이 있으신가요?"

25-30분: Next Step
"다음 주 계약서를 준비하겠습니다."
```

**데모 자료 준비**
```
1. PDF 프레젠테이션 (한국어)
   - 문제 정의 (3/4 슬라이드)
   - 솔루션 설명 (5/6 슬라이드)
   - 가격 & ROI (2 슬라이드)

2. Live Demo Environment
   - 테스트 데이터 (50명 고객, 200개 예약)
   - Therapist 급여 계산 예시

3. Case Study
   - 필리핀 Customer A: 40% 시간 절감
   - 태국 Customer B: ₩5,000,000 월간 절감
```

**담당**: 세일스 & 기술지원팀  
**기대 성과**: 1-2명 계약 준비

---

## 🎯 Week 3: Onboarding (Jun 15-21)

### Day 15-16: 첫 계약 체결 (Customer 1)

**할 작업 목록**
- [ ] 계약서 작성 (한국어 법률 검토)
- [ ] 가격 최종 결정
- [ ] Payment method 확정
- [ ] 30일 Free Trial 약정 OR 월간 ₩2,000,000 계약

**계약 조건 (Korean 스파 Customer)**
```
가격안 1 (Free Trial):
- 기간: 30일 (Jun 15 - Jul 15)
- 기능: Full access
- 조건: "이 기간 동안 최소 3회 데모/지원"
- 목표: 계약 전환율 70%

가격안 2 (Paid):
- 월간: ₩2,000,000
- 설정비: ₩1,000,000 (1회)
- 포함: 30시간 온보딩 + 3개월 지원
- 약정: 1년 계약
```

**Contract Template**
```markdown
## ElSpa Manager 서비스 계약서

### 당사자
- 공급자: ElSpa Korea LLC (사업자 123-45-67890)
- 고객: [스파명] (대표 [이름])

### 서비스 내용
1. 예약 관리 시스템 (웹 + 모바일)
2. 직원 급여 자동 정산
3. 세금계산서 자동 생성
4. CRM 고객 이력 관리

### 가격
- 월간 구독료: ₩2,000,000
- 설정비: ₩1,000,000 (1회, 면제 불가)
- 결제: 매월 1일 (신용카드 자동결제)

### 지원
- 온보딩: 30시간 (3주)
- 기술지원: 24/7 (이메일/폰)
- 교육: 직원 5명 대상 (온라인)

### 기간
- 계약기간: 1년 (자동갱신)
- 해지: 30일 사전공지 필요

### 서명
- 공급자: _______________
- 고객: _______________
```

**담당**: 법무 & 세일스  
**예상 가격**: ₩2,000,000/월

---

### Day 17-19: 데이터 마이그레이션 & 시스템 테스트

**할 작업 목록**
- [ ] 기존 고객 데이터 이관 (500-1000명)
- [ ] 직원 정보 입력 (이름, 직급, 급여)
- [ ] 예약 히스토리 마이그레이션
- [ ] UAT (사용자 승인 테스트) 3회

**데이터 마이그레이션 Flow**
```
Day 17 오전: 고객 데이터 추출 (기존 시스템/엑셀)
Day 17 오후: 데이터 정제 (중복제거, 형식통일)
Day 18 오전: 시스템 Import (배치 프로세스)
Day 18 오후: 데이터 검증 (행 수, 날짜, 금액)
Day 19: UAT 진행 (매니저/테라피스트 테스트)
```

**Migration Script** (Python)
```python
# backend/migration_kr.py

import pandas as pd
from sqlalchemy import insert
from app.models import Customer, Therapist, Reservation

async def migrate_customer_data(excel_file: str):
    """
    기존 고객 데이터 (엑셀) → 시스템 마이그레이션
    """
    df = pd.read_excel(excel_file, sheet_name="고객")
    
    # 데이터 정제
    df['phone'] = df['phone'].str.replace('-', '')
    df['created_at'] = pd.to_datetime(df['created_at'])
    df = df.drop_duplicates(subset=['phone'])
    
    # DB 삽입
    for _, row in df.iterrows():
        customer = Customer(
            name=row['name'],
            phone=row['phone'],
            email=row.get('email'),
            created_at=row['created_at']
        )
        await db.execute(insert(Customer).values(**customer.__dict__))
    
    return {"migrated": len(df), "status": "success"}

async def migrate_therapist_data(excel_file: str):
    """
    직원 정보 마이그레이션
    """
    df = pd.read_excel(excel_file, sheet_name="직원")
    
    for _, row in df.iterrows():
        therapist = Therapist(
            name=row['이름'],
            position=row['직급'],  # "테라피스트", "마사지사", "매니저"
            hourly_rate=int(row['시급']),
            status="active"
        )
        await db.execute(insert(Therapist).values(**therapist.__dict__))
    
    return {"migrated": len(df), "status": "success"}

async def validate_migration():
    """
    마이그레이션 검증
    """
    customer_count = await db.scalar(select(func.count(Customer.id)))
    therapist_count = await db.scalar(select(func.count(Therapist.id)))
    
    report = {
        "customers": customer_count,
        "therapists": therapist_count,
        "status": "OK" if customer_count > 0 else "FAILED"
    }
    return report
```

**UAT Checklist**
```
□ 고객 데이터 정확성 (5개 샘플 확인)
□ 직원 급여 계산 (3명 테스트)
□ 예약 시스템 정상 작동 (10개 예약 생성)
□ 세금계산서 생성 (1장 생성 후 검증)
□ 모바일 앱 예약 (고객 앱에서 예약 가능)
□ 대시보드 리포트 (주간/월간 통계 정확)
```

**담당**: 기술팀  
**기대 성과**: System ready for Day 20

---

### Day 20-21: 직원 교육 & 시스템 런칭

**할 작업 목록**
- [ ] 매니저/테라피스트 4시간 교육 (온라인)
- [ ] 운영 매뉴얼 배포 (한국어 PDF)
- [ ] Support Hotline 개설 (02-1234-5678)
- [ ] Go-Live Ceremony (고객과 함께)

**교육 과정 (4시간)**
```
1시간: 시스템 개요
- 시스템의 목적과 이점
- 각 역할별 권한 설명

1.5시간: 예약 관리 실습
- 예약 생성/수정/취소
- 고객 정보 관리
- 주간/월간 일정표 보기

1시간: 급여 정산 이해
- 시간당 급여 계산 원리
- 월말 자동 정산 프로세스
- 급여명세서 확인

0.5시간: FAQ & Support
- 자주 묻는 질문
- 기술지원 연락처
- 응급상황 대응
```

**운영 매뉴얼 (한국어 PDF)**
```
1. 시스템 접속
   - 웹: https://elspa.kr
   - ID/PW: [고객별 제공]

2. 일일 운영
   - 아침: 오늘 예약 확인 (10분)
   - 예약 관리 (예약 받을 때마다)
   - 저녁: 마무리 (확인)

3. 월말 작업
   - 26일: 급여 확인
   - 27일: 급여 확정
   - 28일: 세금계산서 발급

4. 문제 해결
   - 예약 오류: support@elspa.kr
   - 기술 문제: 02-1234-5678
   - 긴급: 카톡 @elspa
```

**Go-Live Event**
```
Jun 20 (목) 16:00 - 1시간 온라인 미팅

참석:
- 고객 대표/원장
- 우리 매니저 2명
- 기술팀 1명

스크립트:
"오늘부터 ElSpa Manager가 정식 운영됩니다!
저희가 함께하겠습니다. 화이팅!"

→ System go-live
→ 첫 예약 5개 테스트
→ 축하 이메일 발송
```

**담당**: 고객성공팀 (Customer Success Manager)  
**기대 성과**: Customer 1 successfully live

---

## 🎯 Week 4: Scaling (Jun 22-30)

### Day 22-24: 2번째 고객 Onboarding

**할 작업 목록**
- [ ] Customer 2 계약 체결 (Day 14 데모 고객)
- [ ] 데이터 마이그레이션 (Day 17-19 반복)
- [ ] 직원 교육 (Day 20)
- [ ] Go-Live (Day 24)

**예상 Timeline**
```
Day 22: 계약서 서명
Day 23: 데이터 마이그레이션 & UAT
Day 24: Go-Live & 교육
```

**담당**: Customer Success Manager  
**기대 성과**: Customer 2 live (누적 2명)

---

### Day 25-26: 3번째 고객 영업 & 계약

**할 작업 목록**
- [ ] 예비 고객 3-4명 접촉
- [ ] 1명 이상 데모 진행
- [ ] Contract 체결 또는 Trial 시작

**기대 성과**: Customer 3 Contract 또는 Trial

---

### Day 27-28: KPI Tracking & 분석

**할 작업 목록**
- [ ] 월별 수익 집계 (₩4,000,000 예상)
- [ ] 고객 만족도 조사 (NPS)
- [ ] 기술 안정성 리포트 (Uptime)
- [ ] 비용 분석 (COGS, 지출)

**KPI Dashboard**
```
┌─────────────────────────────────┐
│ June 2026 성과표                 │
├─────────────────────────────────┤
│ 고객 확보:        2-3 명         │
│ 월간 수익:        ₩4-6M (예상)  │
│ NPS 점수:         45+            │
│ System Uptime:    99.5%          │
│ 기술 인시던트:    0 (심각)       │
└─────────────────────────────────┘

수익 분석:
- Customer 1: ₩2,000,000/월
- Customer 2: ₩2,000,000/월
- Customer 3 (Trial): ₩0
= ₩4,000,000 월간 수익

비용 분석:
- 사무실: ₩2,500,000
- 급여 (팀 3명): ₩12,000,000
- Payment Processing: ₩100,000
- 기타: ₩1,000,000
= ₩15,600,000 월간 지출

손익분기점: 8 고객 (₩16,000,000/월)
```

**담당**: 재무/운영팀

---

### Day 29-30: 7월 계획 & 리뷰

**할 작업 목록**
- [ ] June 회고 미팅 (1시간)
- [ ] July 목표 설정 (5-8 고객)
- [ ] Marketing Plan 수립
- [ ] Team 이슈 정리

**June 회고 (회의록 예시)**
```markdown
## June 2026 성과 리뷰

### 성과 ✅
1. 법인 설립 완료
2. 첫 2-3 고객 확보 (목표 3-5명)
3. System 안정적 운영 (Uptime 99.5%)
4. 기술팀 온보딩 완료

### 학습 사항 💡
1. Korean payment gateway 통합 - 3일 소요 (예상 2일)
2. 데이터 마이그레이션 - 고객별 데이터 형식 상이 (표준화 필요)
3. 세금계산서 - 국세청 포맷 검증 복잡 (전문가 고용 필요)

### 7월 목표 🎯
1. 고객 5-8명 추가 (누적 8명)
2. 월간 수익 ₩16,000,000 달성
3. NPS 60 이상
4. Marketing 자동화 (Email campaigns)

### Action Items
- [ ] 홈페이지 한국어 버전 완성 (마케팅 팀)
- [ ] YouTube 케이스 스터디 영상 2개 (콘텐츠팀)
- [ ] 한국 회계법인과 파트너십 (비즈니스 개발팀)
```

**담당**: CEO/PMO

---

## 📊 Month 1 Success Metrics

| 지표 | 목표 | 실제 | 상태 |
|------|------|------|------|
| 고객 확보 | 3-5명 | ? | 🔄 |
| 월간 수익 | ₩8,000,000 | ? | 🔄 |
| NPS | 50+ | ? | 🔄 |
| System Uptime | 99.5% | ? | 🔄 |
| 첫 Churn | 0 (없음) | ? | 🔄 |

---

## 🔧 Technical Setup Checklist

### Infrastructure
- [ ] AWS Korea Region (ap-northeast-2) 선택
- [ ] RDS PostgreSQL 구성 (최소 db.t3.medium)
- [ ] S3 Bucket 생성 (고객 문서/이미지)
- [ ] CloudFront CDN (한국 스피드 최적화)
- [ ] VPN/보안 설정 (고객 데이터 보호)

### Monitoring
- [ ] Sentry (에러 추적)
- [ ] DataDog (성능 모니터링)
- [ ] Uptime Robot (가동시간 알림)
- [ ] Email Alerts (경고)

### Backup & Disaster Recovery
- [ ] Daily backup (자동)
- [ ] RTO: 4시간
- [ ] RPO: 1시간
- [ ] Disaster recovery drill (월 1회)

---

## 💰 June 예산 (Budget)

| 항목 | 예상비용 |
|------|---------|
| 오피스 임차 | ₩2,500,000 |
| 법인 등록/세무 | ₩5,000,000 |
| Payment Gateway | ₩2,000,000 |
| 인력 (3명) | ₩12,000,000 |
| 마케팅/여행 | ₩3,000,000 |
| 인프라/기술 | ₩2,000,000 |
| 기타 | ₩1,000,000 |
| **합계** | **₩27,500,000** |

---

## 👥 Team 구성

| 역할 | 이름 | 책임 |
|------|------|------|
| Country Manager | - | Sales, Partnerships |
| Technical Lead | - | System Setup, Integration |
| Customer Success | - | Onboarding, Support |
| Finance/Admin | - | Billing, Compliance |

---

## 📞 Critical Contacts (한국)

- **법무**: (외부 변호사)
- **Payment**: NICE Payments Support
- **세무**: (공인회계사)
- **Infrastructure**: AWS Korea 지원팀

---

## ✅ Signoff

- [ ] Country Manager 승인
- [ ] CEO 승인
- [ ] Finance 승인
- [ ] Legal 승인

**문서 버전**: 1.0  
**작성일**: 2026-05-29  
**최종 수정**: 2026-05-29
