# ElSpa 급여 정산 시스템 테스트 스위트

## 개요

ElSpa 급여 정산 시스템의 포괄적인 테스트 스위트입니다. 단위 테스트부터 API 테스트까지 모든 계층을 다룹니다.

## 테스트 구조

```
app/tests/
├── __init__.py                    # 패키지 초기화
├── conftest.py                    # 공통 fixture 및 DB 설정
├── pytest.ini                     # Pytest 설정
├── test_payroll_calculator.py     # 단위 테스트 (25개)
├── test_payroll_integration.py    # 통합 테스트 (15개)
├── test_payroll_edge_cases.py     # 엣지 케이스 (15개)
├── test_payroll_api.py            # API 테스트 (12개)
└── README.md                      # 이 파일
```

## 테스트 커버리지

### 1. 계산 로직 (test_payroll_calculator.py) - 25개 테스트

#### 지각 차감 (Late Deduction)
- 0~9분: 0 Peso (임계값 이하)
- 10분: 10 Peso
- 30분: 210 Peso (21분 * 10)
- 60분: 510 Peso
- 120분: 1110 Peso

#### 초과근무 수당 (Overtime)
- 0~39분: 0 Peso
- 40분: 70 Peso (1시간)
- 45분: 70 Peso (올림)
- 61분: 140 Peso (2시간)
- 120분: 140 Peso (2시간)
- 150분: 210 Peso (3시간)

#### 공휴일 가산 (Holiday Bonus)
- 국가공휴일 (national): daily_rate * 2.0
- 특정공휴일 (special): daily_rate * 1.3
- daily_rate = base_salary / 15

#### 결근 차감 (Absence Deduction)
- 0일: 0 Peso
- 1일: daily_rate (약 333.33)
- 5일: daily_rate * 5

#### 커미션 (Commission)
- 테라피스트/네일: session_count * 100 Peso
- 기타 직종: 0 Peso

#### CA 조회 (Cash Advance)
- 승인됨(approved): 합계 계산
- 대기중/거부됨: 제외

### 2. 통합 테스트 (test_payroll_integration.py) - 15개 테스트

#### 엔드투엔드 정산
- 단순 직원 정산 (기본급)
- 테라피스트 + 커미션
- 드라이버 + OT + 식대
- 매니저 + 지각 + 결근
- 공휴일 가산 (국가/특정)

#### 다중 직원 정산
- 한 기간에 여러 직원
- 다른 급여 지급 주기

#### CA 정산 추적
- CA 자동 차감
- 여러 CA 합계
- settled 상태 표시

#### 상태 전환
- Draft → Approved → Paid

### 3. 엣지 케이스 (test_payroll_edge_cases.py) - 15개 테스트

#### 동시 발생
- OT + 공휴일 가산 동시
- 지각 + 결근 동시

#### 경계값
- 9분 vs 10분 (지각)
- 39분 vs 40분 (OT)
- 소수점 정밀도

#### 특수 상황
- 기본급 0 직원
- 큰 초과근무 (480분 = 8시간)
- 음수 지각/OT (안전 처리)
- 순지급액이 음수가 되지 않도록

#### 복잡한 정산
- 여러 조건 동시: Late + OT + CA

### 4. API 테스트 (test_payroll_api.py) - 12개 테스트

#### Employee API
- POST /api/payroll/employees
- 여러 직원 유형 생성
- 필드 검증

#### PayrollPeriod API
- POST /api/payroll/periods
- 주간/격주 생성
- 상태별 조회

#### AttendanceLog API
- POST /api/payroll/attendance
- 정상/지각/결근 기록

#### CashAdvance API
- POST /api/payroll/cash-advances
- 상태 전환 (pending→approved→rejected)
- 상태별 조회

#### PayrollRecord API
- 정산 결과 생성/조회
- 상태 워크플로우
- 기간/직원별 조회

## 설치 및 실행

### 설치

```bash
# 테스트 의존성 설치
pip install -r requirements-test.txt
```

### 실행

```bash
# 모든 테스트 실행
pytest app/tests

# 특정 테스트 파일 실행
pytest app/tests/test_payroll_calculator.py

# 특정 테스트 클래스 실행
pytest app/tests/test_payroll_calculator.py::TestLateDeduction

# 특정 테스트 함수 실행
pytest app/tests/test_payroll_calculator.py::TestLateDeduction::test_late_ten_minutes

# 상세 출력
pytest -v app/tests

# 커버리지 리포트 (설치 후)
pytest --cov=app/services --cov=app/models --cov-report=html app/tests

# 병렬 실행 (설치 후)
pytest -n auto app/tests

# 마커로 필터링
pytest -m asyncio app/tests  # 비동기 테스트만
pytest -m unit app/tests     # 단위 테스트만
```

## Fixture 설명

### 직원 Fixture
- `sample_therapist`: 테라피스트 (주간, 5000 Peso)
- `sample_nail_tech`: 네일 기술자 (격주, 4500 Peso)
- `sample_driver`: 드라이버 (주간, 6000 Peso)
- `sample_manager`: 매니저 (격주, 8000 Peso)
- `sample_maintenance`: 유지보수 (주간, 5500 Peso)
- `sample_hollys`: 할리스 직원 (주간, 4800 Peso)
- `sample_employee_with_zero_salary`: 기본급 0

### 정산 기간 Fixture
- `sample_weekly_period`: 주간 정산 (Mon-Sun)
- `sample_biweekly_period`: 격주 정산
- `sample_approved_period`: 승인된 정산

### 출퇴근 Fixture
- `sample_normal_attendance`: 정상 출근
- `sample_late_attendance`: 10분 지각
- `sample_overtime_attendance`: 50분 OT
- `sample_absent_attendance`: 결근
- `sample_holiday_attendance_national`: 국가공휴일 출근
- `sample_holiday_attendance_special`: 특정공휴일 출근
- `bulk_attendance_logs`: 한 주 기록 (7일)

### CA Fixture
- `sample_pending_ca`: 대기중인 CA (1000)
- `sample_approved_ca`: 승인된 CA (2000)
- `sample_multiple_approved_cas`: 여러 CA
- `sample_rejected_ca`: 거부된 CA

### 공휴일 Fixture
- `sample_national_holiday`: 국가공휴일 (200%)
- `sample_special_holiday`: 특정공휴일 (130%)
- `sample_multiple_holidays`: 여러 공휴일

## 테스트 데이터베이스

모든 테스트는 메모리 SQLite 데이터베이스를 사용합니다:
- `sqlite+aiosqlite:///:memory:`
- 각 테스트 후 자동 롤백
- 격리된 환경에서 병렬 실행 가능

## 주요 테스트 시나리오

### 1. 기본급 계산
```
직원: Therapist (5000 Peso 기본급)
정산 기간: 5/18 ~ 5/24 (주간)
결과: 5000 (기본) + 100 (커미션) = 5100
```

### 2. 지각 + 커미션
```
지각: 30분 → (30-9)*10 = 210 Peso 차감
커미션: 5 세션 → 500 Peso
총액: Base(5000) + Commission(500) - Late(210) = 5290
```

### 3. 드라이버 OT + 식대
```
기본급: 6000
OT: 50분 → 70 Peso
식대: 200 Peso (2주당)
총액: 6000 + 70 + 200 = 6270
```

### 4. 공휴일 보너스
```
기본급: 5000 (일당 = 5000/15 = 333.33)
국가공휴일: 333.33 * 2 = 666.66
총액: 5000 + 666.66 = 5666.66
```

### 5. CA 정산
```
기본급: 5000
CA: 2000 (승인됨)
총액: 5000 - 2000 = 3000
```

## 커버리지 목표

- 계산 로직: 100%
- 모델: 95%+
- 라우터: 90%+
- 전체: 90%+

## 실행 결과 예상

```
=========================== test session starts ============================
collected 67 items

test_payroll_calculator.py::TestLateDeduction::test_no_late_zero_minutes PASSED
test_payroll_calculator.py::TestLateDeduction::test_late_ten_minutes PASSED
test_payroll_calculator.py::TestOvertimeCalculation::test_overtime_forty_minutes PASSED
...

======================== 67 passed in 3.42s ================================
```

## 문제 해결

### ImportError: No module named 'app'

```bash
# 프로젝트 루트에서 실행
cd /e/elspa
pytest app/tests
```

### RuntimeError: Event loop is closed

```python
# conftest.py에서 자동으로 처리됨
# asyncio_mode = auto in pytest.ini
```

### 데이터베이스 잠금

```bash
# 각 테스트마다 새로운 세션 생성 (격리)
# 병렬 실행 시 자동 처리
```

## 추가 최적화

### CI/CD 통합

```yaml
# GitHub Actions 예시
- name: Run tests
  run: |
    pytest app/tests --cov=app --cov-report=xml
    codecov -f coverage.xml
```

### 성능 프로파일링

```bash
pytest app/tests --benchmark-only
```

### 코드 품질

```bash
# Type checking
mypy app/

# Linting
pylint app/

# Code coverage
coverage report --skip-covered
```

## 참고 자료

- [Pytest 문서](https://docs.pytest.org/)
- [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio)
- [SQLAlchemy 테스팅](https://docs.sqlalchemy.org/en/20/faq/testing.html)
- [FastAPI 테스팅](https://fastapi.tiangolo.com/advanced/testing-databases/)

## 작성자

ElSpa Payroll Testing Suite
작성일: 2026-05-21

## 라이센스

ElSpa 프로젝트와 동일
