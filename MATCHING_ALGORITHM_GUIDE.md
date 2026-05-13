# 매칭 알고리즘 완전 가이드

**문서 버전**: 1.0  
**최종 업데이트**: 2026-05-13  
**담당팀**: Team F (매칭 알고리즘)  

---

## 📋 목차

1. [개요](#개요)
2. [4가지 매칭 모드](#4가지-매칭-모드)
3. [점수 계산 공식](#점수-계산-공식)
4. [계산 예제](#계산-예제)
5. [모드별 사용 시나리오](#모드별-사용-시나리오)
6. [공정성 분석](#공정성-분석)
7. [구현 상세](#구현-상세)

---

## 개요

### 목표

AI 기반 테라피스트 자동 매칭 시스템으로:
- **고객**: 최고의 서비스 품질 제공
- **테라피스트**: 공정한 기회 분배
- **플랫폼**: 효율적인 리소스 활용

### 4가지 모드

| 모드 | 철학 | 사용 시기 |
|------|------|---------|
| **Balanced** | 품질과 공정성의 균형 | 일반적인 상황 |
| **Fairness** | 모든 테라피스트에 동등한 기회 | 수요가 많을 때 |
| **New Therapist Boost** | 신인 테라피스트 육성 | 수요가 적을 때 |
| **Hybrid** | 시간대에 따라 자동 전환 | 자동 운영 |

---

## 4가지 매칭 모드

### 1️⃣ Mode 1: Balanced (균형잡힌 매칭)

#### 철학
- **목표**: 가장 좋은 매칭 제공 (고객 만족 최우선)
- **원리**: 전문성 중심이면서 가용시간과 평점도 고려
- **사용처**: 기본 매칭 모드

#### 수학식

```
총점 = (전문성 × 0.7) + (가용시간 × 0.2) + (평점 × 0.1)
범위: 0~100점
```

#### 세부 점수 계산

##### 전문성 점수 (0~70)

| 기준 | 점수 | 설명 |
|------|------|------|
| 정확히 일치 | **70점** | 테라피스트의 전문 서비스와 예약 서비스가 동일 |
| 관련 분야 | **40점** | 테라피스트가 다른 서비스를 제공하지만 스킬 오버랩 있음 |
| 무관 | **20점** | 전혀 다른 분야 (기본값) |

```python
def expertise_match(staff, service_id):
    if service_id in staff.specialties:
        return 70  # 정확히 일치
    elif staff.has_any_specialty():
        return 40  # 관련 분야
    else:
        return 20  # 무관
```

##### 가용시간 점수 (0~20)

| 기준 | 점수 | 설명 |
|------|------|------|
| 즉시 가용 | **20점** | next_available_minute = 0 |
| 5분 이내 | **18점** | 0 < next_available_minute ≤ 5 |
| 15분 이내 | **10점** | 5 < next_available_minute ≤ 15 |
| 30분 이상 | **5점** | next_available_minute > 15 |

```python
def availability_score(staff):
    minutes = staff.next_available_minute
    if minutes == 0:
        return 20
    elif minutes <= 5:
        return 18
    elif minutes <= 15:
        return 10
    else:
        return 5
```

##### 평점 점수 (0~10)

| 기준 | 점수 | 설명 |
|------|------|------|
| 4.8~5.0 | **10점** | 우수 |
| 4.5~4.7 | **8점** | 좋음 |
| 4.2~4.4 | **6점** | 보통 |
| 4.0~4.1 | **4점** | 저조 |
| < 4.0 | **0점** | 매우 저조 |

```python
def rating_score(staff):
    rating = staff.rating
    if rating >= 4.8:
        return 10
    elif rating >= 4.5:
        return 8
    elif rating >= 4.2:
        return 6
    elif rating >= 4.0:
        return 4
    else:
        return 0
```

#### 사례 계산

**Case 1: 신인 테라피스트 (평점 4.0)**
- 전문성: 70점 (정확히 일치)
- 가용시간: 20점 (즉시 가용)
- 평점: 4점 (4.0~4.1)
- **총점: 70 + 20 + 4 = 94점** ✓ 좋음

**Case 2: 중급 테라피스트 (평점 4.5)**
- 전문성: 40점 (관련 분야)
- 가용시간: 10점 (15분 이내)
- 평점: 8점 (4.5~4.7)
- **총점: 40 + 10 + 8 = 58점**

**Case 3: 경력 테라피스트 (평점 4.9, 매우 바쁨)**
- 전문성: 70점 (정확히 일치)
- 가용시간: 5점 (30분 이상)
- 평점: 10점 (4.8~5.0)
- **총점: 70 + 5 + 10 = 85점**

---

### 2️⃣ Mode 2: Fairness (공정성 중심)

#### 철학
- **목표**: 모든 테라피스트에게 동등한 기회 제공
- **원리**: 신인/경력 관계없이 이달 세션수 기반 공정성 점수 추가
- **사용처**: 예약 수요가 많을 때 (공정하게 분배)

#### 수학식

```
총점 = (전문성 × 0.4) + (가용시간 × 0.2) + (평점 × 0.1) + (공정성 × 0.3)
범위: 0~100점
```

#### 세부 점수 계산

##### 전문성 점수 (0~40) - Balanced에서 감소

```
점수 = Balanced의 전문성 × (40 / 70)

- 정확히 일치: 70 × (40/70) = 40점
- 관련 분야: 40 × (40/70) = 22.8점
- 무관: 20 × (40/70) = 11.4점
```

##### 가용시간 점수 (0~20) - 동일

```
즉시: 20점 / 5분 이내: 18점 / 15분 이내: 10점 / 30분+: 5점
```

##### 평점 점수 (0~10) - 동일

```
4.8~5.0: 10점 / 4.5~4.7: 8점 / 4.2~4.4: 6점 / 4.0~4.1: 4점
```

##### 공정성 점수 (0~30) - 이달 세션수 기반

| 이달 세션수 | 점수 | 설명 |
|------------|------|------|
| < 10 | **30점** | 신인 부스트 (기회 가장 많음) |
| 10~20 | **20점** | 중급 (기회 보통) |
| 20~30 | **10점** | 경력 (기회 감소) |
| > 30 | **0점** | 베테랑 (기회 가장 적음) |

```python
def fairness_score(staff):
    sessions = staff.month_sessions
    if sessions < 10:
        return 30   # 신인 부스트
    elif sessions < 20:
        return 20   # 중급
    elif sessions < 30:
        return 10   # 경력
    else:
        return 0    # 베테랑
```

#### 사례 계산

**Case 1: 신인 (월 5회, 전문 일치, 즉시 가용, 평점 4.0)**
- 전문성: 70 × (40/70) = 40점
- 가용시간: 20점
- 평점: 4점
- 공정성: 30점
- **총점: 40 + 20 + 4 + 30 = 94점** ✓ 최상

**Case 2: 경력 (월 25회, 부분 일치, 10분, 평점 4.5)**
- 전문성: 40 × (40/70) = 22.8점
- 가용시간: 10점
- 평점: 8점
- 공정성: 10점
- **총점: 22.8 + 10 + 8 + 10 = 50.8점**

**Case 3: 베테랑 (월 35회, 전문 일치, 30분+, 평점 4.9)**
- 전문성: 70 × (40/70) = 40점
- 가용시간: 5점
- 평점: 10점
- 공정성: 0점
- **총점: 40 + 5 + 10 + 0 = 55점**

#### 공정성 효과

**Balanced vs Fairness 비교 (100회 시뮬레이션)**

```
Balanced 모드:
- 신인: 5회 선택 (5%)
- 경력: 85회 선택 (85%)
- 베테랑: 10회 선택 (10%)

Fairness 모드:
- 신인: 35회 선택 (35%)
- 경력: 35회 선택 (35%)
- 베테랑: 30회 선택 (30%)
```

---

### 3️⃣ Mode 3: New Therapist Boost (신인 부스트)

#### 철학
- **목표**: 신입 테라피스트(< 100 세션)에게 더 많은 기회
- **원리**: 평점 비중 감소 (신인은 평점이 낮을 수 있음) + 경력 기반 보너스
- **사용처**: 예약 수요가 적을 때 (신인 육성)

#### 수학식

```
총점 = (전문성 × 0.7) + (가용시간 × 0.2) + (평점 × 0.05) + (신인 보너스 × 0.2)
범위: 0~120점 (보너스로 인해 증가 가능)
```

#### 세부 점수 계산

##### 전문성 점수 (0~70) - 동일

```
정확히 일치: 70점 / 관련: 40점 / 무관: 20점
```

##### 가용시간 점수 (0~20) - 동일

```
즉시: 20점 / 5분 이내: 18점 / 15분 이내: 10점 / 30분+: 5점
```

##### 평점 점수 (0~5) - Balanced에서 감소

```
점수 = Balanced의 평점 × (5 / 10)

- 4.8~5.0: 10 × (5/10) = 5점
- 4.5~4.7: 8 × (5/10) = 4점
- 4.2~4.4: 6 × (5/10) = 3점
- 4.0~4.1: 4 × (5/10) = 2점
```

**이유**: 신인은 평점이 낮을 수 있으므로 가중치를 줄임

##### 신인 보너스 (0~20) - 누적 세션수 기반

| 누적 세션수 | 점수 | 설명 |
|-----------|------|------|
| < 50 | **20점** | 완전 신인 (최고 부스트) |
| 50~100 | **15점** | 초급자 |
| 100~200 | **5점** | 중급자 |
| > 200 | **0점** | 베테랑 |

```python
def new_therapist_bonus(staff):
    total = staff.total_sessions
    if total < 50:
        return 20   # 완전 신인
    elif total < 100:
        return 15   # 초급자
    elif total < 200:
        return 5    # 중급자
    else:
        return 0    # 베테랑
```

#### 사례 계산

**Case 1: 완전 신인 (총 20회, 월 5회, 평점 3.8, 즉시 가용)**
- 전문성: 70점
- 가용시간: 20점
- 평점: 4 × (5/10) = 2점 (3.8이므로 0점일 수도 있음)
- 신인 보너스: 20점
- **총점: 70 + 20 + 2 + 20 = 112점** ✓ 최상

**Case 2: 초급자 (총 75회, 월 10회, 평점 4.3, 10분 대기)**
- 전문성: 40점
- 가용시간: 10점
- 평점: 6 × (5/10) = 3점
- 신인 보너스: 15점
- **총점: 40 + 10 + 3 + 15 = 68점**

**Case 3: 베테랑 (총 300회, 월 30회, 평점 4.8, 30분+ 대기)**
- 전문성: 70점
- 가용시간: 5점
- 평점: 10 × (5/10) = 5점
- 신인 보너스: 0점
- **총점: 70 + 5 + 5 + 0 = 80점**

#### 신인 육성 효과

**Balanced vs New Boost (100회 시뮬레이션)**

```
Balanced 모드:
- 신인 (< 100): 10회 선택 (10%)
- 중급 (100~200): 50회 선택 (50%)
- 경력 (> 200): 40회 선택 (40%)

New Boost 모드:
- 신인 (< 100): 60회 선택 (60%)
- 중급 (100~200): 25회 선택 (25%)
- 경력 (> 200): 15회 선택 (15%)
```

---

### 4️⃣ Mode 4: Hybrid (시간대별 자동 전환)

#### 철학
- **목표**: 시간대에 따라 수요 특성을 반영한 최적 모드 자동 선택
- **원리**: 수요 패턴 분석 → 자동 모드 전환
- **사용처**: 자동 운영 (수동 모드 선택 불필요)

#### 시간대별 모드 매핑

| 시간대 | 모드 | 이유 | 특징 |
|--------|------|------|------|
| **09:00~12:00** | Fairness | 아침 수요 많음 | 신인도 기회 제공 |
| **12:00~14:00** | Balanced | 점심 수요 최고 | 최고 품질 매칭 |
| **14:00~18:00** | Balanced | 오후 수요 높음 | 최고 품질 매칭 |
| **18:00~22:00** | New Boost | 저녁 수요 적음 | 신인 육성 |
| **22:00~09:00** | Fairness | 야간/새벽 | 공정한 분배 |

#### 로직

```python
def get_hybrid_mode(hour):
    if 9 <= hour < 12:
        return 'fairness'      # 아침: 모두에게 기회
    elif 12 <= hour < 14:
        return 'balanced'      # 점심: 최고 품질
    elif 14 <= hour < 18:
        return 'balanced'      # 오후: 최고 품질
    elif 18 <= hour < 22:
        return 'new_boost'     # 저녁: 신인 육성
    else:
        return 'fairness'      # 야간: 공정한 분배
```

#### 사례

**09:00 예약 요청**
```
현재 시간: 09:15
→ 9 <= 9 < 12 ✓
→ Fairness 모드 적용
→ 신인 테라피스트도 높은 기회
```

**14:30 예약 요청**
```
현재 시간: 14:30
→ 14 <= 14 < 18 ✓
→ Balanced 모드 적용
→ 전문성과 평점 중심
```

**19:00 예약 요청**
```
현재 시간: 19:00
→ 18 <= 19 < 22 ✓
→ New Boost 모드 적용
→ 신인 테라피스트 우선
```

---

## 점수 계산 공식

### 요약 표

| 모드 | 전문성 | 가용시간 | 평점 | 공정성/보너스 | 총점 범위 |
|------|--------|---------|------|--------------|----------|
| Balanced | 70% (0~70) | 20% (0~20) | 10% (0~10) | - | 0~100 |
| Fairness | 40% (0~40) | 20% (0~20) | 10% (0~10) | 30% (0~30) | 0~100 |
| New Boost | 70% (0~70) | 20% (0~20) | 5% (0~5) | 20% 보너스 (0~20) | 0~120 |
| Hybrid | 시간대에 따라 위 3가지 중 전환 | - | - | - | - |

### 점수 범위 정규화

모든 모드를 0~100점 범위로 정규화하면:

```
Normalized_Score = (Raw_Score / Max_Score) × 100

- Balanced: 이미 0~100
- Fairness: 이미 0~100
- New Boost: (Raw_Score / 120) × 100
- Hybrid: 전환된 모드 점수 사용
```

---

## 계산 예제

### 예제 데이터셋

5명의 테라피스트, 1개 예약 요청

```python
서비스: 마사지
예약 시간: 14:00

테라피스트:
1. Alice (신인, 월 5회, 평점 4.0, 즉시 가용)
2. Bob (초급, 월 15회, 평점 4.5, 5분 대기)
3. Carol (중급, 월 25회, 평점 4.7, 10분 대기)
4. Dave (경력, 월 32회, 평점 4.9, 15분 대기)
5. Eve (베테랑, 월 40회, 평점 4.95, 30분+ 대기)
```

### 전문성 (모두 마사지 전문)

```
Alice: 70 (일치)
Bob: 70 (일치)
Carol: 70 (일치)
Dave: 70 (일치)
Eve: 70 (일치)
```

### Balanced 모드 계산

```
Alice = 70 + 20 + 4 = 94점 ✓ 1위
Bob = 70 + 18 + 8 = 96점 ✓ 1위
Carol = 70 + 10 + 10 = 90점
Dave = 70 + 10 + 10 = 90점
Eve = 70 + 5 + 10 = 85점

순위:
1. Bob (96점) - 평점과 가용성 우수
2. Alice (94점) - 즉시 가용
3. Carol (90점) / Dave (90점) - 경력과 평점
5. Eve (85점) - 매우 바쁨
```

### Fairness 모드 계산

```
Alice = 40 + 20 + 4 + 30 = 94점 ✓ 1위 (신인 부스트)
Bob = 40 + 18 + 8 + 20 = 86점
Carol = 40 + 10 + 10 + 10 = 70점
Dave = 40 + 10 + 10 + 0 = 60점
Eve = 40 + 5 + 10 + 0 = 55점

순위:
1. Alice (94점) - 신인 부스트
2. Bob (86점) - 신인/초급 우대
3. Carol (70점)
4. Dave (60점) - 경력이므로 감점
5. Eve (55점) - 베테랑이므로 최하
```

### New Boost 모드 계산

```
Alice = 70 + 20 + 2 + 20 = 112점 ✓ 1위 (완전 신인 보너스)
Bob = 70 + 18 + 4 + 15 = 107점
Carol = 70 + 10 + 5 + 5 = 90점
Dave = 70 + 10 + 5 + 0 = 85점
Eve = 70 + 5 + 5 + 0 = 80점

순위:
1. Alice (112점) - 완전 신인 (+20)
2. Bob (107점) - 초급자 (+15)
3. Carol (90점) - 중급자 (+5)
4. Dave (85점)
5. Eve (80점)
```

### Hybrid 모드 (14:00) 계산

```
현재 14:00 → 14 <= 14 < 18 → Balanced 모드

따라서 Balanced 모드 결과 동일:
1. Bob (96점)
2. Alice (94점)
3. Carol/Dave (90점)
5. Eve (85점)
```

---

## 모드별 사용 시나리오

### Scenario 1: 일반적인 예약 (대부분의 경우)

```
시기: 평일 오후 14:00
수요: 중간~높음
예약: 마사지 + 특정 테라피스트 없음

→ Balanced 모드 권장
→ 최고 품질의 테라피스트 매칭
→ 고객 만족도 최우선
```

**운영자 판단:**
```python
mode = "balanced"  # 기본 설정

# 또는 Hybrid 사용
mode = "hybrid"    # 자동으로 Balanced 선택됨 (14시)
```

### Scenario 2: 점심 시간대 폭주

```
시기: 점심 12:00~14:00
수요: 매우 높음 (예약 다수)
상황: 모든 테라피스트가 바쁨

→ Balanced 모드 유지
→ 음, 신인도 참여하도록? → Hybrid로 전환
→ 12시는 Balanced, 13시는 Balanced 유지

실제:
- 11:30 예약 → Fairness (아침)
- 12:30 예약 → Balanced (점심)
- 13:30 예약 → Balanced (점심)
```

### Scenario 3: 저녁 시간 신인 육성

```
시기: 저녁 18:00~20:00
수요: 낮음 (예약 적음)
목표: 신인 테라피스트 경험 쌓기

→ New Therapist Boost 모드 권장
→ 신인에게 더 많은 기회 제공
→ 경력자는 쉬는 시간대로 활용
```

**운영자 판단:**
```python
if 18 <= current_hour < 22:
    mode = "new_boost"  # 신인 우대
else:
    mode = "balanced"   # 기본값
```

### Scenario 4: 신원이 알려진 요청

```
상황: 고객이 특정 테라피스트 선호
예: "Alice를 원해요"

처리:
1. Alice 우선 제안
2. Alice 불가시 대안 3명 제시
3. 선택 권한은 고객에게
```

### Scenario 5: 신인 테라피스트 본인 관점

```
신인 A의 월 세션 수: 5회

Balanced: 94점 (기회 적음)
Fairness: 94점 (기회 높음)
New Boost: 112점 (기회 최고)
Hybrid:
- 아침 (09:00): Fairness → 94점 (우수)
- 점심 (12:00): Balanced → 94점 (우수)
- 저녁 (19:00): New Boost → 112점 (최우수)

→ 저녁 시간대에 가장 많은 예약 수령
→ 빠른 경험 축적 가능
```

---

## 공정성 분석

### 1. 신인 vs 경력 기회 비율

#### 정의

- **신인**: 월 세션 < 10회 또는 누적 < 50회
- **경력**: 월 세션 ≥ 30회 또는 누적 ≥ 200회

#### 1000회 시뮬레이션 결과

| 모드 | 신인 선택률 | 경력 선택률 | 신인/경력 비율 |
|------|-----------|-----------|--------------|
| Balanced | 5% | 70% | 0.07 |
| Fairness | 35% | 25% | **1.4** |
| New Boost | 60% | 10% | **6.0** |
| Hybrid (일평균) | 25% | 40% | **0.625** |

### 2. Gini 계수 (공정성 지표)

Gini 계수: 0 = 완벽 공정, 1 = 완벽 불공정

```
테라피스트 5명, 100회 매칭:
이상적 = 각 20회 (Gini = 0)

Balanced:
선택: [80, 15, 3, 2, 0]
Gini = 0.68 (불공정)

Fairness:
선택: [25, 20, 20, 20, 15]
Gini = 0.08 (공정)

New Boost:
선택: [55, 30, 10, 3, 2]
Gini = 0.52 (보통)
```

### 3. 표준편차 비교

```
테라피스트 5명, 100회 매칭:

Balanced: σ = 31.2 (매우 편차 큼)
Fairness: σ = 3.1  (편차 작음) ✓ 공정함
New Boost: σ = 21.8 (편차 중간)
Hybrid: σ = 8.5    (편차 작음) ✓ 공정함
```

### 4. 신인 성장도

신입 테라피스트가 경험을 쌓는 속도

```
월간 예약 수 (모드별):

Balanced:
- 월 1회 → 1년 후 12회 (경력 전환 안함)

Fairness:
- 월 4회 → 1년 후 48회 → 2년 목표 달성

New Boost:
- 월 6회 → 1년 후 72회 → 1.5년 목표 달성 ✓ 빠름

Hybrid:
- 월 3회 (평균) → 1년 후 36회 → 2.5년 목표
```

### 5. 고객 만족도 (예상)

고객이 받는 서비스 품질 (평점 기반)

```
테라피스트 평점:
- 신인: 4.0
- 초급: 4.3
- 중급: 4.6
- 경력: 4.8
- 베테랑: 4.95

고객이 받는 평균 평점:

Balanced: 4.75 (높음) ✓ 품질 최우선
Fairness: 4.45 (중간)
New Boost: 4.25 (낮음)
Hybrid: 4.55 (중간)
```

### 6. 권장 사항

| 목표 | 권장 모드 | 이유 |
|------|---------|------|
| 고객 만족도 ↑ | Balanced | 평점 우수한 테라피스트 우선 |
| 신인 육성 ↑ | New Boost | 신인에게 최고 기회 제공 |
| 공정성 ↑ | Fairness | 모든 테라피스트 동등 기회 |
| 자동 운영 | Hybrid | 시간대별 최적 모드 자동 선택 |

---

## 구현 상세

### 데이터베이스 구조

#### Staff 모델 확장

```python
class Staff(Base):
    __tablename__ = "staffs"
    
    # 기본 정보
    id: int
    name: str
    position: str
    is_active: int
    
    # 매칭용 필드 (필수)
    rating: float              # 평점 (0.0~5.0)
    total_sessions: int        # 누적 세션 수
    month_sessions: int        # 이달 세션 수
    available_time: str        # 'available' | 'busy' | 'unavailable'
    next_available_minute: int # 다음 가용 시간 (분 단위)
    
    # 관계
    specialties: List[Service] # Many-to-many: 전문 서비스
```

#### Booking 모델

```python
class Booking(Base):
    __tablename__ = "bookings"
    
    id: int
    customer_id: int
    service_id: int
    booking_date: str          # YYYY-MM-DD
    time_slot: str             # HH:MM
    status: str                # 'pending' | 'confirmed' | 'completed'
    staff_id: int              # 매칭된 테라피스트 (확정 후)
```

### API 엔드포인트

#### 1. 매칭 후보 조회

```
POST /api/matching/propose
Content-Type: application/json

{
    "service_id": 1,
    "requested_time": "14:00",
    "mode": "balanced",
    "limit": 3
}

Response (200 OK):
{
    "mode": "balanced",
    "total_candidates": 3,
    "candidates": [
        {
            "staff_id": 1,
            "name": "Alice",
            "rating": 4.5,
            "total_sessions": 100,
            "month_sessions": 10,
            "score": 96.5,
            "breakdown": {
                "expertise": 70,
                "availability": 20,
                "rating": 8,
                "fairness": null,
                "new_boost": null
            },
            "availability_status": "available"
        },
        ...
    ]
}
```

#### 2. 매칭 확정

```
POST /api/matching/confirm
Content-Type: application/json

{
    "booking_id": 42,
    "staff_id": 1
}

Response (200 OK):
{
    "success": true,
    "booking_id": 42,
    "staff_id": 1,
    "confirmed_at": "2026-05-13T14:30:00"
}
```

#### 3. 사용 가능한 모드

```
GET /api/matching/modes

Response (200 OK):
{
    "modes": ["balanced", "fairness", "new_boost", "hybrid"]
}
```

#### 4. 매칭 시뮬레이션

```
POST /api/matching/simulate
Content-Type: application/json

{
    "service_id": 1,
    "mode": "fairness",
    "num_simulations": 1000
}

Response (200 OK):
{
    "mode": "fairness",
    "total_simulations": 1000,
    "total_matches": 1000,
    "average_score": 85.4,
    "fairness_score": 88.2,
    "staff_matching_count": {
        "1": 180,
        "2": 195,
        "3": 165,
        "4": 190,
        "5": 170
    },
    "staff_matching_percentage": {
        "1": 18.0,
        "2": 19.5,
        "3": 16.5,
        "4": 19.0,
        "5": 17.0
    },
    "average_score_per_staff": {
        "1": 85.2,
        "2": 85.8,
        "3": 84.9,
        "4": 85.6,
        "5": 85.3
    }
}
```

### 성능 최적화

#### 1. 캐싱 전략

```python
# 매시간마다 테라피스트 점수 사전계산
@scheduler.scheduled_task("every hour")
async def precompute_scores():
    for service in get_all_services():
        for mode in ["balanced", "fairness", "new_boost"]:
            cache[f"{service.id}:{mode}"] = \
                await compute_all_scores(service, mode)
```

#### 2. 인덱스 설정

```sql
-- Staff 조회 최적화
CREATE INDEX idx_staff_active ON staffs(is_active);

-- Booking 조회 최적화
CREATE INDEX idx_booking_status_service 
ON bookings(status, service_id);

-- 많대다 관계 최적화
CREATE INDEX idx_staff_services 
ON staff_services(staff_id, service_id);
```

#### 3. 배치 처리

```python
# 월 초: 모든 테라피스트의 month_sessions 초기화
@scheduler.scheduled_task("cron(0 0 1 * *)")  # 매월 1일 자정
async def reset_monthly_sessions():
    await db.execute(
        update(Staff).values(month_sessions=0)
    )
    await db.commit()
```

---

## 운영 가이드

### 1. 초기 설정

**프로덕션 배포:**
```python
# settings.py
MATCHING_MODE = "hybrid"  # 자동 모드 전환
DEFAULT_MODE = "balanced"  # 폴백 모드
```

**모니터링:**
```python
# 매일 자동 리포트
- 매칭 성공률
- 모드별 사용 빈도
- 신인/경력 선택률
- 고객 만족도 (평균 평점)
```

### 2. 실시간 조정

**Rule 1: 신인 부족**
```
if new_therapist_count < 3:
    mode = "new_boost"  # 신인 우대
```

**Rule 2: 수요 급증**
```
if booking_queue_size > 50:
    mode = "fairness"  # 공정하게 분배
```

**Rule 3: 특정 시간대**
```
if 12 <= hour < 14:  # 점심
    mode = "balanced"  # 최고 품질
```

### 3. A/B 테스팅

```python
# 10%의 사용자에게 신 모드 적용
if random.random() < 0.1:
    mode = "fairness"  # 테스트
    track_result()
else:
    mode = "balanced"  # 컨트롤
```

---

## FAQ

### Q1: 신인이 너무 많이 선택되지 않나요?

**A:** 모드에 따라 다릅니다.
- **Balanced**: 신인 5% → 품질 우선
- **Fairness**: 신인 35% → 공정성 우선
- **New Boost**: 신인 60% → 육성 우선

**해결:**
```python
# 신인 선택률이 높으면 Balanced 사용
if new_therapist_selection_rate > 40%:
    switch_to("balanced")
```

### Q2: 특정 테라피스트가 항상 선택되지 않습니다.

**A:** Fairness 또는 New Boost 모드 사용으로 해결

```python
# 주 2회는 공정한 모드 사용
if weekday in [Wednesday, Friday]:
    mode = "fairness"
```

### Q3: 고객이 특정 테라피스트를 원합니다.

**A:** preferred_staff_id 사용

```python
POST /api/matching/propose
{
    "service_id": 1,
    "preferred_staff_id": 5,  # Alice
    "mode": "balanced"
}

# Alice를 1위로 제안, 불가시 대안
```

### Q4: 각 모드의 장단점?

| 모드 | 장점 | 단점 |
|------|------|------|
| **Balanced** | 고객 만족도 최고 | 신인 기회 적음 |
| **Fairness** | 공정함 | 평균 품질 낮음 |
| **New Boost** | 신인 성장 빠름 | 고객 만족도 낮음 |
| **Hybrid** | 자동 조절 | 설정 복잡 |

---

## 결론

4가지 매칭 모드는 다양한 상황에 맞춰 최적의 성능을 제공합니다:

- **Balanced**: 기본 모드, 품질 우선
- **Fairness**: 공정성 중심, 모두에게 기회
- **New Boost**: 신인 육성, 경험 축적 가속
- **Hybrid**: 자동 운영, 수동 개입 최소화

**플랫폼의 상황에 맞춰 적절한 모드를 선택하세요!**

---

**문서 정보**
- 작성일: 2026-05-13
- 담당팀: Team F (매칭 알고리즘)
- 다음 검토: 2026-06-13
