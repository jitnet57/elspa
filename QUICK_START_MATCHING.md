# 매칭 엔진 빠른 시작 가이드

**대상**: 개발자, PM, 운영자  
**읽는 시간**: 5분  

---

## 🚀 30초 요약

4가지 매칭 모드로 테라피스트를 자동 추천:

| 모드 | 특징 | 사용 시점 |
|------|------|---------|
| **Balanced** | 품질 최우선 | 기본 설정 |
| **Fairness** | 공정성 최우선 | 신입 보호 필요 |
| **New Boost** | 신입 육성 | 저녁 시간대 |
| **Hybrid** | 자동 전환 | 자동 운영 |

```
POST /api/matching/propose
{
    "service_id": 1,
    "mode": "balanced",
    "limit": 3
}

Response: [
    { "staff_id": 1, "name": "Alice", "score": 96.5 },
    { "staff_id": 2, "name": "Bob", "score": 92.3 },
    { "staff_id": 3, "name": "Carol", "score": 89.5 }
]
```

---

## 📖 전체 흐름

### 1단계: 매칭 후보 조회

```python
POST /api/matching/propose
{
    "service_id": 1,        # 필수: 어떤 서비스?
    "mode": "balanced"      # 선택: balanced|fairness|new_boost|hybrid
}

응답: 3명의 후보 (점수순)
- staff_id, name, rating, score, breakdown
```

### 2단계: 고객 선택

고객이 후보 중 선택 (또는 플랫폼이 자동 선택)

### 3단계: 매칭 확정

```python
POST /api/matching/confirm
{
    "booking_id": 42,       # 예약 ID
    "staff_id": 1           # 선택한 테라피스트
}

응답: { "success": true, "confirmed_at": "2026-05-13T14:30:45" }
```

---

## 🎯 각 모드 선택 기준

### Balanced (기본값)

```
언제: 일상적인 예약
왜: 최고 품질의 테라피스트 추천
장점: 고객 만족도 4.67/5 (최고)
단점: 신입 테라피스트 5% (기회 적음)

추천 신입 비중: 0~20%
```

**코드 예제:**
```python
response = await client.post(
    "/api/matching/propose",
    json={
        "service_id": 1,
        "mode": "balanced",
        "limit": 3
    }
)
```

### Fairness

```
언제: 신입이 많을 때, 공정성 중시
왜: 모든 테라피스트에 동등한 기회 제공
장점: 공정성 점수 88/100 (최고), 신입 35% 기회
단점: 고객 만족도 4.40/5 (약간 낮음)

추천 신입 비중: 20~40%
```

**코드 예제:**
```python
response = await client.post(
    "/api/matching/propose",
    json={
        "service_id": 1,
        "mode": "fairness",
        "limit": 3
    }
)
```

### New Boost

```
언제: 저녁/야간, 신입 육성 집중
왜: 신입에게 최대 기회 제공
장점: 신입 60% 기회 (매우 높음), 경험 빠른 축적
단점: 고객 만족도 4.18/5 (낮음)

주의: 고객 만족도가 낮으니 수요 낮은 시간대에만 사용
추천 신입 비중: 40~70%
```

**코드 예제:**
```python
# 저녁 18:00~22:00 시간대만 사용
if 18 <= datetime.now().hour < 22:
    mode = "new_boost"
else:
    mode = "balanced"

response = await client.post(
    "/api/matching/propose",
    json={
        "service_id": 1,
        "mode": mode,
        "limit": 3
    }
)
```

### Hybrid

```
언제: 자동 운영할 때
왜: 시간대별 최적 모드 자동 선택
장점: 공정성 82/100 + 고객 만족도 4.43/5 (균형)
단점: 시간대별 로직 설정 필요

시간대별 모드:
- 09:00~12:00: Fairness (신입 기회)
- 12:00~14:00: Balanced (점심, 품질)
- 14:00~18:00: Balanced (오후, 품질)
- 18:00~22:00: New Boost (저녁, 신입)
```

**코드 예제:**
```python
response = await client.post(
    "/api/matching/propose",
    json={
        "service_id": 1,
        "mode": "hybrid",  # 자동으로 현재 시간대 모드 선택
        "limit": 3
    }
)
```

---

## 📊 점수 계산 (핵심만)

### Balanced 모드 점수

```
총점 = 전문성(0~70) + 가용시간(0~20) + 평점(0~10)
범위: 0~100점

예제:
- 전문성: 70점 (정확히 일치)
- 가용시간: 20점 (즉시 가용)
- 평점: 8점 (4.5~4.7)
= 98점 (우수)
```

### Fairness 모드 추가 항목

```
공정성 점수 (0~30):
- 월 5회 이하: 30점 (신입 부스트) ✓
- 월 15회: 20점
- 월 25회: 10점
- 월 35회 이상: 0점

신입이 높은 점수를 받음!
```

### New Boost 모드 추가 항목

```
신인 보너스 (0~20):
- 총 50회 이하: +20점 (완전 신입) ✓
- 총 100회 이하: +15점
- 총 200회 이하: +5점
- 200회 이상: 0점

신입이 20점 추가 보너스!
```

---

## 🔍 응답 분석

### 후보 점수 Breakdown

```json
{
    "staff_id": 1,
    "name": "Alice",
    "score": 96.5,
    "breakdown": {
        "expertise": 70,        // 전문성 (0~70)
        "availability": 20,     // 가용시간 (0~20)
        "rating": 8,           // 평점 (0~10)
        "fairness": null,      // Fairness 모드만
        "new_boost": null      // New Boost 모드만
    }
}
```

**점수 해석:**
- 90점 이상: 매우 우수한 매칭
- 80~89점: 우수한 매칭
- 70~79점: 좋은 매칭
- 60~69점: 보통 매칭
- 60점 이하: 낮은 매칭

---

## ⚙️ 운영자용 설정

### 프로덕션 권장 설정

```python
# settings.py

# 신입 비중에 따른 모드 자동 선택
NEW_THERAPIST_RATIO = 0.15  # 신입 비중 (%)

def choose_mode():
    new_ratio = get_new_therapist_ratio()
    
    if new_ratio < 0.10:
        return "balanced"      # 신입이 매우 적음
    elif new_ratio < 0.25:
        return "fairness"      # 신입 보호 필요
    elif new_ratio > 0.40:
        return "hybrid"        # 자동 균형
    else:
        return "balanced"      # 일반적 상황
```

### 모니터링 지표

```python
# 매일 자동 리포트

1. 신입 이탈률 < 20% (목표)
   - 이탈률 높으면 → Fairness 또는 New Boost 사용

2. 고객 평균 평점 > 4.4점
   - 평점 낮으면 → Balanced 모드 사용

3. 테라피스트 만족도
   - 불만 많으면 → Fairness 모드 사용

4. 신입 월 세션수 > 10회
   - 세션 부족하면 → New Boost 모드 사용
```

---

## 🧪 테스트

### 매칭 시뮬레이션 (DB 미반영)

```python
POST /api/matching/simulate
{
    "service_id": 1,
    "mode": "fairness",
    "num_simulations": 1000
}

응답:
{
    "mode": "fairness",
    "fairness_score": 88.2,        // 공정성 (0~100)
    "average_score": 85.4,
    "staff_matching_percentage": {
        "1": 35.0,  // 신입 35% 선택
        "2": 20.0,
        "3": 20.0,
        "4": 15.0,
        "5": 10.0
    }
}
```

**활용:**
- 모드별 공정성 비교
- 신입 기회 분배 분석
- 모드 선택 전 검증

```python
# 예제: Fairness 모드 검증
response = await client.post(
    "/api/matching/simulate",
    json={
        "service_id": 1,
        "mode": "fairness",
        "num_simulations": 1000
    }
)

fairness_score = response["fairness_score"]
new_therapist_ratio = response["staff_matching_percentage"]["1"]

if fairness_score > 80 and new_therapist_ratio > 30:
    print("✓ Fairness 모드 적합")
else:
    print("✗ 다른 모드 검토 필요")
```

---

## 🐛 일반적 문제 및 해결

### Q: 신입이 선택되지 않아요

**A: Balanced 사용 중**
```
해결책:
1. Fairness 모드로 변경 (신입 35% 선택)
2. 또는 New Boost 사용 (신입 60% 선택)

이유: Balanced는 경력자 우대 (신입 5% only)
```

### Q: 고객 만족도가 떨어졌어요

**A: Fairness 또는 New Boost 사용 중**
```
해결책:
1. Balanced 모드로 변경
2. Hybrid 모드 사용 (시간대별 최적화)

이유: 경력자 우대가 고객 만족도 높음 (4.67/5)
```

### Q: 신입이 자주 이탈해요

**A: Balanced만 사용 중**
```
해결책:
1. Fairness 추가 (주 2회 정도)
2. 또는 Hybrid 사용

효과: 신입 월 1.5회 → 10.5회 (7배 증가)
```

### Q: 어떤 모드를 써야 해요?

**A: 상황별 선택 가이드**
```
신입 비중 < 10%
→ Balanced (품질 최우선)

신입 비중 10~25%
→ Fairness 또는 Hybrid (공정성)

신입 비중 > 25%
→ Hybrid (자동 조절)

저녁/야간 예약
→ New Boost (신입 육성)
```

---

## 📚 상세 문서

더 자세한 정보는 다음 문서 참고:

1. **MATCHING_ALGORITHM_GUIDE.md**
   - 각 모드의 수학식
   - 점수 계산 상세
   - 사용 시나리오

2. **FAIRNESS_ANALYSIS.md**
   - 1000회 시뮬레이션 결과
   - 공정성 지표 분석
   - 운영 권장사항

3. **MATCHING_API_SPEC.md**
   - 전체 API 명세
   - 요청/응답 형식
   - 에러 처리

4. **test_matching_engine.py**
   - 40가지 테스트 케이스
   - 각 모드별 검증
   - 성능 벤치마크

---

## 💻 개발자 정보

### 파일 위치

```
app/
├── services/
│   └── matching_engine.py       # 핵심 엔진
├── routers/
│   └── matching.py              # API 엔드포인트
├── schemas/
│   └── matching.py              # 요청/응답 스키마
└── models/
    └── staff.py                 # 데이터베이스 모델

test_matching_engine.py           # 40가지 테스트
```

### 핵심 메서드

```python
# 매칭 후보 조회
await engine.get_candidates(booking_request, mode, limit)

# 점수 계산
await engine.calculate_score(staff, booking_request, mode)

# 매칭 확정
await engine.confirm_matching(booking_id, staff_id)

# 시뮬레이션
await engine.simulate_matching(service_id, mode, num_sims)
```

---

## 🎓 학습 순서

1. **이 문서** (지금 읽는 것)
2. **MATCHING_ALGORITHM_GUIDE.md** (개념 이해)
3. **FAIRNESS_ANALYSIS.md** (데이터 기반 이해)
4. **test_matching_engine.py** (코드 레벨)
5. **matching_engine.py** (구현 상세)

---

**마지막 업데이트**: 2026-05-13  
**담당팀**: Team F (매칭 알고리즘)
