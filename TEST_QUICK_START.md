# 테스트 빠른 시작 가이드

## 1단계: 설치 (1분)

```bash
cd /e/elspa
pip install -r requirements-test.txt
```

## 2단계: 테스트 실행 (1분)

### 모든 테스트 실행
```bash
pytest app/tests -v
```

### 결과 예상
```
collected 67 items

test_payroll_calculator.py::TestLateDeduction::test_no_late_zero_minutes PASSED
test_payroll_calculator.py::TestLateDeduction::test_late_ten_minutes PASSED
...
======================== 67 passed in 3.42s ================================
```

## 3단계: 커버리지 확인 (1분)

```bash
pytest app/tests --cov=app --cov-report=html
# 그 후 htmlcov/index.html 열기
```

## 자주 사용하는 명령어

### 빠른 테스트
```bash
# 계산 로직만 테스트 (가장 빠름)
pytest app/tests/test_payroll_calculator.py -v

# 통합 테스트 (DB 포함)
pytest app/tests/test_payroll_integration.py -v

# 엣지 케이스 (경계값)
pytest app/tests/test_payroll_edge_cases.py -v

# API 테스트
pytest app/tests/test_payroll_api.py -v
```

### 특정 기능 테스트
```bash
# 지각 차감만
pytest app/tests/test_payroll_calculator.py::TestLateDeduction -v

# 초과근무만
pytest app/tests/test_payroll_calculator.py::TestOvertimeCalculation -v

# 공휴일만
pytest app/tests/test_payroll_calculator.py::TestHolidayBonus -v

# CA 정산만
pytest app/tests/test_payroll_integration.py::TestCACashAdvanceSettlement -v
```

### 상세 정보
```bash
# 실패한 테스트 자세히 보기
pytest app/tests -v --tb=long

# 출력 캡처 보기
pytest app/tests -v --show-capture=all

# 느린 테스트 찾기
pytest app/tests --durations=5

# 병렬 실행 (빠름)
pytest app/tests -n auto
```

## 주요 테스트 케이스 빠른 보기

### 1. 지각 차감
```
9분: 0 Peso ✓
10분: 10 Peso ✓
30분: 210 Peso ✓
```

### 2. 초과근무
```
39분: 0 Peso ✓
40분: 70 Peso ✓
61분: 140 Peso ✓
```

### 3. 공휴일
```
국가(national): daily_rate * 2.0 ✓
특정(special): daily_rate * 1.3 ✓
```

### 4. CA 정산
```
승인됨: 차감 ✓
대기중: 제외 ✓
거부됨: 제외 ✓
```

## 테스트 구조

```
67 total tests
├── 25 Unit Tests (계산)
├── 15 Integration Tests (플로우)
├── 15 Edge Cases (경계값)
└── 12 API Tests (엔드포인트)
```

## 파일 위치

| 파일 | 위치 |
|------|------|
| 테스트 코드 | `/e/elspa/app/tests/` |
| 설정 파일 | `/e/elspa/app/tests/pytest.ini` |
| Fixture | `/e/elspa/app/tests/conftest.py` |
| 문서 | `/e/elspa/PAYROLL_TEST_SUITE_GUIDE.md` |
| 의존성 | `/e/elspa/requirements-test.txt` |

## 테스트 데이터

### 직원 샘플
- Therapist: 5000 Peso
- Driver: 6000 Peso
- Manager: 8000 Peso
- Nail Tech: 4500 Peso

### 정산 기간
- 주간 (weekly): 월-일
- 격주 (biweekly): 2주

## 문제 해결

### "No module named 'app'"
```bash
# 프로젝트 루트에서 실행
cd /e/elspa
pytest app/tests
```

### 느린 실행
```bash
# 병렬 실행
pytest app/tests -n auto
```

### 특정 테스트만 실패
```bash
# 실패한 테스트만 재실행
pytest app/tests --lf
```

## 추가 기능

### 테스트 결과 저장
```bash
pytest app/tests -v --html=report.html
```

### 커버리지 XML (CI/CD)
```bash
pytest app/tests --cov=app --cov-report=xml
```

### 특정 마커 실행
```bash
pytest app/tests -m asyncio    # 비동기만
pytest app/tests -m "not slow" # 느린 거 제외
```

## 예상 실행 시간

- 모든 테스트: ~3-5초
- 단위 테스트만: ~1-2초
- 커버리지 포함: ~5-10초
- 병렬 실행: ~2-3초

## 다음 단계

1. **실행**: `pytest app/tests -v`
2. **확인**: 67 passed
3. **커버리지**: `--cov=app` 옵션 추가
4. **CI/CD**: GitHub Actions 통합

---

**준비 완료! `pytest app/tests -v`로 시작하세요.**
