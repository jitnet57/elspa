# ElSpa 급여 정산 시스템 — BMAD 검토 체크리스트

**생성 일시**: 2026-05-21 15:19  
**검토 담당**: 사용자  
**목표**: Phase 6 (Dev) 진행 전 BMAD 산출물 검증

---

## 📋 Phase 1: Analyst — 비즈니스 로직 명세서

### ✅ 검토 내용

#### 1. 직원 분류
- [  ] **White (정직원)**: Manager — 2주급, 기본급 고정 ✓
- [  ] **Blue (유지보수직)**: Maintenance, Driver, Hollys Coffee — 2주급 ✓
- [  ] **Commission (커미션직)**: Therapist, Nail Shop — 1주급(일요일) ✓

**질문**: 직원 유형 분류가 맞습니까?

#### 2. 차감 항목 7개 검증
```
1. SSS 회사 선지급           ✓
2. CA (Cash Advance)         ✓
3. 13개월 보너스 선지급      ✓
4. 보건소 검사비 (Therapist) ✓
5. 지각 패널티               ✓ (10분 초과, 1분당 10Peso)
6. 결근 (Manager만)          ✓ (급여/15 = 1일 단가)
7. [추가 차감 항목?]         ❓
```

**질문**: 빠진 차감 항목이 있습니까?

#### 3. 추가 지급 항목 4개 검증
```
1. 드라이버 식대              ✓ (2주당 200 Peso)
2. 초과근무 (OT)             ✓ (40분 이상, 1시간당 70 Peso)
3. 국가 공휴일 가산          ✓ (200%)
4. 특정 공휴일 가산          ✓ (130%)
5. [추가 지급 항목?]         ❓
```

**질문**: 빠진 지급 항목이 있습니까?

#### 4. 엣지케이스 정의
- [  ] OT 39분 vs 40분 경계: **올바른가?** (40분 이상만 1시간 OT)
- [  ] 지각 9분 vs 11분 경계: **올바른가?** (10분 초과부터 차감)
- [  ] 공휴일 + OT 중복: **계산 순서가 맞는가?**
- [  ] 음수 급여: **0으로 처리 후 이월하는 게 맞는가?**

**질문**: 엣지케이스 처리 방식이 필리핀 법규에 맞습니까?

---

## 🎯 Phase 2: PM — PRD & 기능 명세서

### ✅ 검토 내용

#### 1. 관리자 화면 6개 (MVP)
```
✓ /admin/payroll/                    — 메인 대시보드
✓ /admin/payroll/employees/          — 직원 마스터
✓ /admin/payroll/cash-advance/       — CA 관리
✓ /admin/payroll/attendance/         — 출퇴근 입력
✓ /admin/payroll/holidays/           — 공휴일 관리
✓ /admin/payroll/records/            — 정산 결과 조회
```

**질문**: 관리자 화면 6개가 충분합니까? 추가/제거할 화면이 있습니까?

#### 2. API 엔드포인트 (MVP)
```
POST /api/payroll/periods              ✓
GET /api/payroll/periods               ✓
POST /api/payroll/periods/{id}/calculate ✓
GET /api/payroll/records               ✓
...
```

**질문**: 필요한 API가 모두 정의되었습니까?

#### 3. MUST/SHOULD/COULD 우선순위

**MUST (MVP, 1주차)**:
- Employee CRUD
- CashAdvance 입력/승인
- AttendanceLog 입력
- 급여 계산 엔진
- PayrollRecord 조회

**SHOULD (Phase 2, 2주차)**:
- PDF 정산서 생성
- 13개월 보너스 모듈
- WhatsApp/카카오 발송

**질문**: 우선순위가 적절합니까?

---

## 🎨 Phase 3: UX — 화면 설계

### ✅ 검토 내용

#### 1. 각 화면의 레이아웃 (Wireframe)
- [  ] 메인 대시보드: 정산 기간 선택, 출퇴근 진행률, 최근 정산 기록
- [  ] 직원 관리: 직원 목록 테이블, 추가/수정/삭제 폼
- [  ] CA 관리: CA 신청 목록, 승인/거절 버튼
- [  ] 출퇴근: 일일 입력 테이블, 시간 자동 계산
- [  ] 공휴일: 캘린더 뷰, 국가/특정 구분
- [  ] 정산 결과: 개인별 상세 정산서, PDF 버튼

**질문**: 화면 구성이 직관적입니까? 수정할 부분이 있습니까?

#### 2. 입력 필드 검증
- [  ] 필수 필드 명확한가?
- [  ] 필드 순서가 논리적인가?
- [  ] 초기값/기본값이 적절한가?

**질문**: 입력 폼이 사용하기 쉬운가?

---

## 🏗️ Phase 4: Architect — 기술 설계

### ✅ 검토 내용

#### 1. SQLAlchemy 모델 6개
```
1. Employee            — 직원 마스터 (id, name, phone, employee_type, base_salary, ...)
2. CashAdvance         — CA 선지급 (employee_id, amount, status, ...)
3. AttendanceLog       — 출퇴근 기록 (employee_id, work_date, clock_in, clock_out, ...)
4. PayrollPeriod       — 정산 기간 (period_start, period_end, pay_group, ...)
5. PayrollRecord       — 정산 결과 (payroll_period_id, employee_id, base_amount, ...)
6. PhilippineHoliday   — 공휴일 (holiday_date, holiday_name, rate_multiplier, ...)
```

**질문**: 모델 구조와 필드가 충분합니까? 빠진 필드가 있습니까?

#### 2. 급여 계산 엔진
```python
async def calculate_payroll(payroll_period_id):
    # 1. 기본급
    # 2. 커미션 (therapist/nail)
    # 3. OT 계산
    # 4. 공휴일 가산
    # 5. 식대 (driver)
    # 6. 모든 차감 항목
    # → PayrollRecord 생성
```

**질문**: 계산 로직이 모두 정의되었습니까?

#### 3. 기존 모델과의 연동
```
Staff → Employee FK 연결
Therapist → Employee로 통합
Attendance → AttendanceLog 확장
```

**질문**: 기존 데이터 마이그레이션 방식이 안전합니까?

---

## 📅 Phase 5: Scrum Master — 스프린트 계획

### ✅ 검토 내용

#### 1. 태스크 분해 (15개)
```
Backend (7개):
  BE-001: Employee 모델 (4h)
  BE-002: CashAdvance 모델 (3h)
  BE-003: AttendanceLog 모델 (4h)
  BE-004: PayrollPeriod/Record 모델 (3h)
  BE-005: PhilippineHoliday 모델 (2h)
  BE-006: 계산 엔진 (8h) ⭐ 가장 복잡
  BE-007: API 라우터 (6h)

Frontend (6개):
  FE-001~006: 각 페이지 (4~6h)

QA (2개):
  QA-001: 계산 정확도 (4h)
  QA-002: 엣지케이스 (3h)
```

**질문**: 태스크 분해가 현실적입니까? 시간 예상이 맞습니까?

#### 2. 의존성 & 병렬 처리
```
BE-001 (Employee) → BE-002, BE-003, BE-004 병렬 가능
BE-006 (계산엔진) → BE-007 (라우터) 필수
BE-007 완료 → FE-001~006 병렬 가능
```

**질문**: 병렬 처리 계획이 최적입니까?

#### 3. 예상 소요시간
- Backend: 30시간
- Frontend: 29시간
- QA: 7시간
- **총 66시간 (약 1.5주 = 8 working days)**

**질문**: 1주 내 MVP 완성이 현실적입니까?

---

## 🎯 검토 체크리스트 (최종)

### 비즈니스 로직 승인
- [ ] 직원 분류 (White/Blue/Commission) 확인
- [ ] 차감 항목 7개 모두 포함
- [ ] 추가 지급 항목 4개 모두 포함
- [ ] 엣지케이스 처리 방식 확인
- [ ] 필리핀 노동법 준수 확인

### PRD & 기능 명세 승인
- [ ] 관리자 화면 6개 확인
- [ ] API 엔드포인트 모두 정의됨
- [ ] MUST/SHOULD/COULD 우선순위 적절
- [ ] 사용 시나리오 3개 검증

### UX 화면 설계 승인
- [ ] 각 화면 구성 직관적
- [ ] 입력 필드 명확
- [ ] 모바일 반응형 고려

### 기술 설계 승인
- [ ] 6개 모델 구조 적절
- [ ] 계산 엔진 로직 완전
- [ ] 기존 모델 연동 안전

### 스프린트 계획 승인
- [ ] 15개 태스크 현실적
- [ ] 시간 예상 타당
- [ ] 의존성 명확

---

## 📝 피드백 입력 템플릿

```markdown
### [Phase 번호] — [검토 항목]

**현재**: [기획안에 있는 내용]

**피드백**: [수정/추가 사항]

**이유**: [변경 이유]
```

---

## 다음 단계

1. ✅ 위 체크리스트 검토
2. 📝 피드백 입력 (필요 시)
3. ✔️ 최종 승인
4. 🚀 **Phase 6 (Dev): 코드 구현 시작**

---

**검토 완료 후 다음 명령 입력**:
```
"BMAD 검토 완료. [피드백 내용] 포함해서 코드 생성하자"
```
