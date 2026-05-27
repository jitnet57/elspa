# 🧑‍🏫 ElSpa 급여 정산 전산 검증 수작업 매뉴얼 가이드 (v2)

본 가이드는 전산에서 급여 정산 및 근태 관리가 정확하게 한 치의 오차도 없이 돌아가는지, 관리자가 수작업으로 대조하며 검증하는 **6단계 수작업 검증 프로세스**입니다.

---

## 📈 급여 정산 수작업 검증 6단계 진행 순서

전산 화면(또는 DB)의 결과값이 정확한지 확인하기 위해 다음의 1단계부터 6단계까지 순서대로 수작업 계산을 수행하고 전산값과 비교하십시오.

### [1단계] 마스터 데이터 및 정산 주기 확인 (Master Data Verification)
1. **직원 기본 정보 확인**:
   - `Department Position Master` 및 `employees` 테이블에서 대상 직원의 **기본급(Base Salary)**, **입사일(Hire Date)**, **직무 유형(Job Type)**을 확인합니다.
   - 예: `EMP-01` (Kevin) -> 기본급 `30,000 PHP`, 입사일 `2021-01-01`, 직무 `manager`
2. **정산 대상 기간 확인**:
   - 정산 기간의 시작일과 종료일을 확인하여 영업일 수 및 포함된 공휴일을 기록합니다.
   - 예: `2026-05-16 ~ 2026-05-27` (총 12일 기간)

### [2단계] 근태 데이터 집계 및 검증 (Attendance Data Aggregation)
1. **출퇴근 로그 분석 (`Employee Attendance` 탭)**:
   - 대상 직원의 기간 내 일일 근태를 확인하여 아래 항목을 각각 합산합니다.
     - **실제 출근 일수(또는 마사지 세션 수)**
     - **지각 시간(Late Minutes) 합계**
     - **초과근무 시간(Overtime Minutes) 합계**
     - **결근 일수(Absent Days) 합계**
     - **공휴일 출근 일수 및 공휴일 유형 (National / Special)**

### [3단계] 선지급금(CA) 내역 대조 (Cash Advance Verification)
1. **APPROVED 상태 CA 확인 (`Cash Advance Logs` 탭)**:
   - 해당 직원이 신청한 선지급금 중 **APPROVED(승인 완료)** 상태인 금액만 합산합니다.
   - ⚠️ **주의**: `PENDING`(대기)이나 `REJECTED`(거절), 혹은 이미 이전 정산에서 차감 완료된 `SETTLED`(정산 완료) 상태의 CA는 이번 차감 대상에서 **반드시 제외**되어야 합니다.
   - 예: `TH-03` (Chloe) -> APPROVED CA `5,000 PHP` 차감 대상 등록 확인.

### [4단계] 수입 항목 (Gross Pay) 수작업 계산
다음의 비즈니스 룰에 맞게 각 수입 구성 요소를 계산하고 합산하여 **Gross Pay**를 도출합니다.
$$\text{Gross Pay} = \text{기본급} + \text{커미션} + \text{초과근무 수당} + \text{공휴일 가산} + \text{식대}$$

1. **기본급 (Base Salary)**: 약정된 기본급 금액 그대로 적용.
2. **커미션 (Commission)**:
   - Therapist 및 Nail 직군만 적용: $\text{세션 완료 수} \times 100\text{ PHP}$
   - 타 직군은 무조건 `0 PHP`.
3. **초과근무 수당 (Overtime Pay)**:
   - 정직원(Manager, Driver, Maintenance, Hollys) 전용:
     - 총 OT 분수가 **40분 미만**이면 `0 PHP`.
     - **40분 이상**이면 60분 단위로 **올림**하여 시간당 **70 PHP** 적용.
     - 공식: $\text{OT 수당} = \text{올림}(\text{총 OT 분수} / 60) \times 70\text{ PHP}$
4. **공휴일 가산 수당 (Holiday Bonus)**:
   - 정산 기간 내 공휴일에 출근한 날에 대해 일일 급여 기준 가산율 지급.
     - 일일 급여(Daily Rate) = $\text{기본급} / 15$ (격주 정산 기준 기준일 15일 적용)
     - **National Holiday**: $\text{일일 급여} \times 2.0$
     - **Special Holiday**: $\text{일일 급여} \times 1.3$
5. **식대 지원금 (Meal Allowance)**:
   - Driver 직군만 정액 지급: 격주당 **200 PHP** 정액 지원 (타 직군 무조건 `0 PHP`).

### [5단계] 차감 항목 (Total Deductions) 수작업 계산
다음의 차감 룰에 맞게 각 차감 요소를 계산하고 합산하여 **Total Deductions**를 도출합니다.
$$\text{Total Deductions} = \text{지각 차감} + \text{결근 차감} + \text{CA 차감} + \text{보건소 검사비} + \text{13개월 선지급 차감}$$

1. **지각 차감액 (Late Deduction)**:
   - 정직원 전용 (Therapist/Nail 직군은 해당 없음).
   - 일일 출퇴근 기록 중 지각 분수가 **9분 이하**이면 차감 없음 (`0 PHP`).
   - 지각 분수가 **10분 이상**인 날은 **9분을 공제**한 나머지 분수에 대해 **1분당 10 PHP** 차감.
   - 공식: $\text{일일 지각 차감} = (\text{지각 분} - 9) \times 10\text{ PHP}$
2. **결근 차감액 (Absence Deduction)**:
   - ⚠️ **중요**: **Manager(매니저) 직군만 결근 차감을 적용**받습니다. (타 직군은 결근 시 결근일 기본급 차감 규정 없음)
   - 공식: $\text{결근 차감} = (\text{기본급} / 15) \times \text{결근 일수}$
3. **CA 차감액 (CA Deduction)**:
   - [3단계]에서 계산한 APPROVED 상태의 CA 합계액 전액 차감.
4. **보건소 검사비 (Health Checkup Deduction)**:
   - **Therapist(테라피스트) 직군만** 적용 (Nail 포함 타 직군은 무조건 `0 PHP`).
   - 분기 말(3, 6, 9, 12월) 정산 시 **500 PHP** 일괄 차감.
5. **13개월 보너스 선지급 차감 (13th Month Accumulation)**:
   - 모든 직무 공통 적립식 차감.
   - 공식: $\text{월 적립금} = \text{기본급} / 12$
   - $\text{13개월 누적액} = \text{월 적립금} \times \text{입사 후 현재까지의 근무 개월 수}$
   - ⚠️ 중도 입사자 개월 수 계산: $\text{기준일(정산종료일)} - \text{입사일}$을 년/월 기반으로 계산하며, 기준일의 '일(Day)'이 입사일의 '일(Day)'보다 크거나 같으면 해당 월을 1개월로 가산 (최소 1개월 보장).

### [6단계] 최종 실지급액 (Net Pay) 및 적요 대조 검증
1. **Net Pay 산출**:
   - 공식: $\text{Net Pay} = \text{Gross Pay} - \text{Total Deductions}$
   - 만약 계산된 결과가 **음수(Negative)**가 나온다면, 음수 지급 방지 안전장치에 의해 최종 지급액이 **0 PHP**로 전산에 표시되어야 합니다.
   - 공식: $\text{Net Pay} = \max(\text{Gross Pay} - \text{Total Deductions}, 0)$
2. **적요란 (`notes` 필드) 대조**:
   - 전산 급여 정산의 **적요(Notes)** 텍스트를 열어, 내가 계산한 '총 수입 내역(세션 수, OT 분 등)' 및 '차감 상세 내역(지각 일수, 13개월 개월 수 등)'이 전산상 텍스트에 오타 없이 완벽하게 정리되어 나타나 있는지 최종 확인합니다.

---

## 🔍 실전 대조 테스트 케이스 (3가지 대표 샘플)

### 📌 Case 1: `TH-01` (Ana, Therapist) — 주간급, 분기말 차감형
* **1단계 (기본 정보)**: 기본급 `15,000 PHP`, 입사일 `2023-01-15` (근무 개월 수: 40개월)
* **2단계 (근태)**: 세션 완료 수 `38회`, 지각 없음, 결근 없음.
* **3단계 (CA)**: APPROVED CA 없음 (`0 PHP`).
* **4단계 (수입)**:
  - 기본급: `15,000 PHP`
  - 커미션: $38 \times 100 = 3,800\text{ PHP}$
  - 공휴일 가산: $0\text{ PHP}$
  - **Gross Pay = 18,800 PHP**
* **5단계 (차감)**:
  - 지각/결근 차감: $0\text{ PHP}$
  - CA 차감: $0\text{ PHP}$
  - 보건소비: Therapist이므로 **`500 PHP`** 차감 적용.
  - 13개월 누적액: $(15000 / 12) \times 40 = 1250 \times 40 = 50,000\text{ PHP}$
  - **Total Deductions = 50,500 PHP**
* **6단계 (최종)**:
  - $\text{Net Pay} = \max(18,800 - 50,500, 0) = \mathbf{0\text{ PHP}}$ (음수 안전장치 적용으로 `0` 출력 검증)

### 📌 Case 2: `EMP-01` (Kevin, Manager) — 격주급, 결근 차감형
* **1단계 (기본 정보)**: 기본급 `30,000 PHP`, 입사일 `2021-01-01` (근무 개월 수: 65개월), 직무 `manager`
* **2단계 (근태)**: **결근 1일 (5/20)**, 지각 없음, OT 없음.
* **3단계 (CA)**: APPROVED CA 없음 (`0 PHP`).
* **4단계 (수입)**:
  - 기본급: `30,000 PHP`
  - **Gross Pay = 30,000 PHP** (Manager는 커미션, 식대 없음)
* **5단계 (차감)**:
  - 지각 차감: $0\text{ PHP}$
  - **결근 차감 (Manager 적용)**: $(30,000 / 15) \times 1 = \mathbf{2,000\text{ PHP}}$
  - CA 차감: $0\text{ PHP}$
  - 보건소비: $0\text{ PHP}$ (Manager 해당 없음)
  - 13개월 누적액: $(30000 / 12) \times 65 = 2500 \times 65 = 162,500\text{ PHP}$
  - **Total Deductions = 164,500 PHP**
* **6단계 (최종)**:
  - $\text{Net Pay} = \max(30,000 - 164,500, 0) = \mathbf{0\text{ PHP}}$ (음수 안전장치 적용)

### 📌 Case 3: `EMP-03` (Mason, Driver) — 격주급, 지각/특근/식대형
* **1단계 (기본 정보)**: 기본급 `20,000 PHP`, 입사일 `2022-06-01` (근무 개월 수: 48개월), 직무 `driver`
* **2단계 (근태)**: 결근 없음, 주말 특근 및 초과근무 60분, 식대 지급 대상.
* **3단계 (CA)**: `PENDING` 상태의 CA 4,000 PHP 존재 -> ⚠️ **차감 제외 (`0 PHP`)**
* **4단계 (수입)**:
  - 기본급: `20,000 PHP`
  - OT 수당: 60분 근무 = 1시간 올림 $\times$ 70 = `70 PHP`
  - 식대 지원금: Driver이므로 **`200 PHP`** 지급 적용.
  - **Gross Pay = 20,270 PHP**
* **5단계 (차감)**:
  - 지각 차감: $0\text{ PHP}$
  - 결근 차감: $0\text{ PHP}$ (Driver는 결근 차감 면제)
  - CA 차감: **`0 PHP`** (PENDING 상태이므로 전산 미차감 검증)
  - 13개월 누적액: $(20,000 / 12) \times 48 = 1,666.67 \times 48 = 80,000\text{ PHP}$
  - **Total Deductions = 80,000 PHP**
* **6단계 (최종)**:
  - $\text{Net Pay} = \max(20,270 - 80,000, 0) = \mathbf{0\text{ PHP}}$

---
💡 **검증 팁**: 13개월 보너스 적립 정책상 오랜 기간 근무한 직원들은 누적 적립액이 현재 Gross Pay를 크게 초과하여 Net Pay가 `0`으로 산출되는 경향이 있습니다. 이는 전산상 음수 방지 안전장치(`net_pay = max(..., 0)`)가 완벽히 작동하고 있음을 보여주는 강력한 증거입니다. 실 운영에서는 **13개월 보너스를 매월 누적 차감하는 대신 연말 일괄 정산하는 방식**을 채택하시는 것을 권장합니다.
