# 🗄️ ELSPA 데이터베이스 설정 가이드

## 📋 개요

이 문서는 ELSPA API의 데이터베이스를 Supabase에 설정하는 방법을 설명합니다.

---

## 🔧 필수 준비물

1. **Supabase 계정**: https://supabase.com에서 생성
2. **프로젝트**: Supabase 대시보드에서 새 프로젝트 생성
3. **.env 파일**: 다음 정보로 설정
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key
   SUPABASE_SECRET_KEY=your_service_role_key
   ```

---

## 🚀 데이터베이스 초기화 단계

### 1️⃣ Supabase SQL Editor에서 마이그레이션 실행

1. Supabase 대시보드 → **SQL Editor** 열기
2. **새 쿼리 생성** 클릭
3. 다음 파일의 내용을 복사하여 붙여넣기:
   ```
   e:\elspa\migrations\001_create_tables.sql
   ```
4. **실행** 버튼 클릭

### 2️⃣ 테이블 확인

**Table Editor**에서 다음 테이블이 생성되었는지 확인:

- ✅ `customers` - 고객 테이블
- ✅ `therapists` - 테라피스트 테이블
- ✅ `services` - 서비스 테이블
- ✅ `therapist_services` - 테라피스트-서비스 매핑
- ✅ `bookings` - 예약 테이블
- ✅ `reviews` - 리뷰 테이블
- ✅ `customer_points` - 포인트 테이블
- ✅ `point_transactions` - 포인트 거래 내역
- ✅ `locations` - 실시간 위치 테이블

### 3️⃣ 더미 데이터 추가 (선택사항)

```sql
-- 테라피스트 예시 데이터
INSERT INTO therapists (name, specialty, bio, experience_years, phone, email, location, available, rating, review_count)
VALUES 
  ('김현정', '스웨디시 & 타이', '6년 경력의 전문가', 6, '010-1234-5678', 'kim@elspa.com', '서울 강남구', true, 4.9, 247),
  ('이지은', '타이 마사지', '따뜻한 서비스 제공', 4, '010-2345-6789', 'lee@elspa.com', '서울 강남구', true, 4.8, 189),
  ('최수진', '발마사지', '발 건강 전문가', 3, '010-3456-7890', 'choi@elspa.com', '서울 강남구', true, 4.7, 156);

-- 서비스 예시 데이터
INSERT INTO services (name, description, base_price, duration_minutes, category, icon)
VALUES 
  ('스웨디시 마사지', '부드러운 압력의 유럽식 마사지', 2500, 30, 'massage', '💆'),
  ('타이 마사지', '깊은 압력의 전통 타이 마사지', 3000, 60, 'massage', '🧘'),
  ('발마사지', '발 반사 요법 마사지', 1800, 30, 'foot', '🦶'),
  ('핫스톤', '따뜻한 돌로 하는 마사지', 3500, 60, 'stone', '🔥');
```

---

## 🔌 FastAPI 연결 확인

### 1️⃣ 백엔드 시작

```bash
cd e:\elspa
python main.py
```

### 2️⃣ API 헬스 체크

```bash
curl http://localhost:8000/health
```

**응답:**
```json
{
  "status": "🟢 Healthy",
  "api_version": "0.1.0",
  "database": "✅ Connected",
  "supabase": "https://your-project.supabase.co"
}
```

---

## 📡 API 엔드포인트

### 🔍 테라피스트 API

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/therapists/` | 테라피스트 목록 |
| GET | `/api/therapists/{id}` | 테라피스트 상세 |
| GET | `/api/therapists/search/` | 테라피스트 검색 |
| POST | `/api/therapists/` | 테라피스트 생성 (Admin) |

**예시:**
```bash
# 테라피스트 목록 조회
curl "http://localhost:8000/api/therapists/?sort_by=rating&limit=10"

# 특정 테라피스트 조회
curl "http://localhost:8000/api/therapists/1"

# 검색
curl "http://localhost:8000/api/therapists/search/?specialty=스웨디시&min_rating=4.5"
```

### 📅 예약 API

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/bookings/` | 예약 목록 |
| POST | `/api/bookings/` | 예약 생성 |
| GET | `/api/bookings/{id}` | 예약 상세 |
| PUT | `/api/bookings/{id}` | 예약 수정 |
| DELETE | `/api/bookings/{id}` | 예약 취소 |

**예시:**
```bash
# 예약 생성
curl -X POST "http://localhost:8000/api/bookings/" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "therapist_id": 1,
    "service_id": 1,
    "booking_date": "2026-05-25",
    "booking_time": "14:00:00",
    "duration_minutes": 60,
    "location": "서울시 강남구 도곡동",
    "special_request": "약한 강도로 부탁합니다"
  }'
```

### ⭐ 리뷰 API

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/reviews/therapist/{id}` | 테라피스트 리뷰 |
| POST | `/api/reviews/` | 리뷰 작성 |
| GET | `/api/reviews/{id}` | 리뷰 상세 |

**예시:**
```bash
# 리뷰 작성
curl -X POST "http://localhost:8000/api/reviews/" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "customer_id": 1,
    "therapist_id": 1,
    "rating": 5,
    "comment": "정말 만족스러운 서비스였습니다!"
  }'
```

---

## 🔐 Row Level Security (RLS) 설정 (선택사항)

고급 보안을 위해 RLS를 설정할 수 있습니다:

```sql
-- RLS 활성화
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 정책 설정 (고객은 자신의 예약만 볼 수 있음)
CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  USING (customer_id = auth.uid());
```

---

## 📊 데이터베이스 구조

```
customers (고객)
  ├── id (PK)
  ├── name, phone, email
  └── created_at

therapists (테라피스트)
  ├── id (PK)
  ├── name, specialty, bio
  ├── rating, review_count
  └── location, available

services (서비스)
  ├── id (PK)
  ├── name, description
  ├── base_price, duration_minutes
  └── category

bookings (예약)
  ├── id (PK)
  ├── customer_id (FK)
  ├── therapist_id (FK)
  ├── service_id (FK)
  ├── booking_date, booking_time
  ├── status (pending/confirmed/completed/cancelled)
  ├── total_price, payment_method
  └── special_request

reviews (리뷰)
  ├── id (PK)
  ├── booking_id (FK)
  ├── customer_id (FK)
  ├── therapist_id (FK)
  ├── rating (1-5)
  └── comment

customer_points (포인트)
  ├── id (PK)
  ├── customer_id (FK, UNIQUE)
  ├── total_points, used_points
  └── available_points

point_transactions (거래 내역)
  ├── id (PK)
  ├── customer_id (FK)
  ├── booking_id (FK)
  ├── amount, transaction_type
  └── description
```

---

## ✅ 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] .env 파일에 DATABASE_URL 설정
- [ ] 마이그레이션 SQL 실행
- [ ] 더미 데이터 추가
- [ ] FastAPI 서버 실행
- [ ] /health 엔드포인트 확인
- [ ] API 테스트 (curl 또는 Postman)
- [ ] 프론트엔드 API 연결

---

## 📞 문제 해결

### 데이터베이스 연결 오류

```
Error: could not translate host name "your-project.supabase.co" to address
```

**해결:**
1. .env 파일에서 DATABASE_URL 확인
2. Supabase 대시보드에서 Connection String 다시 복사

### 테이블 없음 오류

```
Error: relation "therapists" does not exist
```

**해결:**
1. 마이그레이션 SQL이 정상 실행되었는지 확인
2. Supabase SQL Editor에서 테이블 생성 상태 확인

---

## 📚 참고자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [FastAPI 데이터베이스 가이드](https://fastapi.tiangolo.com/tutorial/sql-databases/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)

---

**최종 업데이트:** 2026-05-18  
**작성자:** Claude AI  
**상태:** ✅ 완료
