# ✅ Excel Import 배포 체크리스트

> **ElSpa Excel Import 기능**의 배포 전 완벽한 검증을 위한 체크리스트입니다.
> 모든 항목을 ✅ 체크하고 배포하세요.

---

## 📅 배포 날짜: __________ | 담당자: __________

---

## 🔴 Phase 1: 코드 검증 (Code Review)

### 백엔드 코드 리뷰

- [ ] **app/models/excel_import_models.py**
  - [ ] ColumnMapping 모델 검토
  - [ ] ImportLog, ImportErrorDetail, ImportWarningDetail 관계 확인
  - [ ] Enum 타입 검증

- [ ] **app/services/excel_parser.py**
  - [ ] XLSX/XLS 파일 파싱 로직 검토
  - [ ] 에러 처리 확인
  - [ ] 메모리 누수 가능성 체크

- [ ] **app/services/excel_validator.py**
  - [ ] ValidationRule 클래스 검토
  - [ ] 타입 변환 로직 검증
  - [ ] 범위 검증 로직 확인
  - [ ] 중복 검증 로직 검증

- [ ] **app/services/excel_import_service.py**
  - [ ] 트랜잭션 관리 확인
  - [ ] 에러 롤백 처리 검증
  - [ ] 감시 추적 로깅 확인
  - [ ] SQL 인젝션 방지 검증

- [ ] **app/routers/excel_import_router.py**
  - [ ] API 엔드포인트 설계 검토
  - [ ] 요청/응답 스키마 검증
  - [ ] 인증/권한 체크 확인
  - [ ] 입력 검증 확인

- [ ] **main.py**
  - [ ] 라우터 import 확인
  - [ ] app.include_router() 등록 확인

### 프론트엔드 코드 리뷰

- [ ] **frontend/src/lib/api/excel-import-client.ts**
  - [ ] API 클라이언트 메서드 검토
  - [ ] 에러 처리 확인
  - [ ] 토큰 관리 확인

- [ ] **frontend/src/app/admin/excel-import/ExcelUploader.tsx**
  - [ ] 드래그&드롭 UI 검토
  - [ ] 파일 검증 로직 확인
  - [ ] 에러 메시지 확인
  - [ ] 로딩 상태 관리 검증

- [ ] **frontend/src/app/admin/excel-import/ImportResults.tsx**
  - [ ] 결과 표시 UI 검토
  - [ ] 페이지네이션 로직 검증
  - [ ] 에러/경고 표시 확인

- [ ] **frontend/src/lib/config/excel-import.config.ts**
  - [ ] 설정값 검토
  - [ ] 환경변수 연동 확인

### 보안 코드 리뷰

- [ ] **파일 업로드 보안**
  - [ ] 파일 크기 제한 확인 (10MB)
  - [ ] 파일 타입 검증 (XLSX, XLS만)
  - [ ] 악성 파일 검사 가능성 검토
  - [ ] 임시 파일 정리 확인

- [ ] **데이터베이스 보안**
  - [ ] SQL Injection 방지 확인
  - [ ] Prepared statement 사용 확인
  - [ ] ORM 사용 확인 (raw SQL 최소화)

- [ ] **인증/권한 보안**
  - [ ] 관리자만 접근 가능한지 확인
  - [ ] user_id 검증 확인
  - [ ] JWT 토큰 유효성 검증

- [ ] **데이터 검증**
  - [ ] 입력 sanitization 확인
  - [ ] XSS 방지 확인
  - [ ] CSRF 토큰 확인

---

## 🟠 Phase 2: 단위 & 통합 테스트

### 단위 테스트 (Unit Tests)

```bash
pytest tests/test_excel_import.py -v
```

- [ ] **ExcelParser 테스트**
  - [ ] XLSX 파일 읽기 테스트
  - [ ] XLS 파일 읽기 테스트
  - [ ] 빈 파일 처리 테스트
  - [ ] 큰 파일 처리 테스트
  - [ ] 잘못된 형식 처리 테스트

- [ ] **ValidationRule 테스트**
  - [ ] String 타입 검증 테스트
  - [ ] Integer 타입 검증 테스트
  - [ ] Float 타입 검증 테스트
  - [ ] DateTime 타입 검증 테스트
  - [ ] Boolean 타입 검증 테스트
  - [ ] Enum 타입 검증 테스트
  - [ ] 필수 필드 검증 테스트
  - [ ] 범위 검증 테스트
  - [ ] 길이 검증 테스트

- [ ] **ExcelValidator 테스트**
  - [ ] 행 검증 테스트
  - [ ] 중복 감지 테스트
  - [ ] 에러 수집 테스트
  - [ ] 경고 수집 테스트

- [ ] **ExcelImportService 테스트**
  - [ ] 임포트 시작 테스트
  - [ ] 임포트 성공 테스트
  - [ ] 임포트 실패 처리 테스트
  - [ ] 로그 생성 테스트

### 통합 테스트 (Integration Tests)

```bash
pytest tests/test_excel_import_integration.py -v
```

- [ ] **API 엔드포인트 테스트**
  - [ ] POST /api/excel/import 테스트
  - [ ] GET /api/excel/import/{id} 테스트
  - [ ] GET /api/excel/import/{id}/errors 테스트
  - [ ] GET /api/excel/import/{id}/warnings 테스트
  - [ ] GET /api/excel/mappings 테스트
  - [ ] POST /api/excel/mappings 테스트

- [ ] **데이터베이스 통합 테스트**
  - [ ] ImportLog 테이블 삽입 테스트
  - [ ] ImportErrorDetail 테이블 삽입 테스트
  - [ ] ImportWarningDetail 테이블 삽입 테스트
  - [ ] 트랜잭션 롤백 테스트

### E2E 테스트 (End-to-End Tests)

```bash
pytest tests/test_excel_import_e2e.py -v
```

- [ ] **전체 흐름 테스트**
  - [ ] 파일 업로드 → 파싱 → 검증 → 저장 전체 흐름
  - [ ] 성공 케이스 (100% 성공)
  - [ ] 부분 성공 케이스 (일부 실패)
  - [ ] 완전 실패 케이스 (모두 실패)

### 성능 테스트

- [ ] **처리 시간 테스트**
  - [ ] 작은 파일 (100행): < 1초
  - [ ] 중간 파일 (1000행): < 5초
  - [ ] 큰 파일 (10000행): < 30초

- [ ] **메모리 테스트**
  - [ ] 메모리 누수 확인
  - [ ] 최대 메모리 사용량 확인 (< 500MB)

---

## 🟡 Phase 3: 로컬 환경 검증

### 백엔드 환경 설정

```bash
pip list | grep -E "openpyxl|pandas|xlrd|fastapi|sqlalchemy"
```

- [ ] **openpyxl** (>= 3.10.0)
- [ ] **pandas** (>= 2.1.0)
- [ ] **xlrd** (>= 2.0.0)

### 프론트엔드 환경 설정

```bash
npm list react-dropzone xlsx
```

- [ ] **react-dropzone** (>= 14.2.0)
- [ ] **xlsx** (>= 0.18.0)

### 환경 변수 설정

- [ ] **REACT_APP_API_BASE_URL** 설정
- [ ] **REACT_APP_UPLOAD_TIMEOUT** 설정

### 마이그레이션 검증

```bash
alembic upgrade head
alembic current
```

- [ ] **마이그레이션 파일 생성**
- [ ] **마이그레이션 적용**
- [ ] **테이블 생성 확인**
  - [ ] import_logs
  - [ ] excel_column_mappings
  - [ ] import_error_details
  - [ ] import_warning_details

---

## 🔵 Phase 4: 로컬 앱 실행 및 테스트

### 백엔드 실행

```bash
python main.py
# http://localhost:8000/health
# http://localhost:8000/docs
```

- [ ] **서버 실행 확인**
- [ ] **Swagger UI 확인**
- [ ] **API 엔드포인트 표시 확인**

### 프론트엔드 실행

```bash
npm run dev
# http://localhost:3000/admin/excel-import
```

- [ ] **프론트엔드 실행 확인**
- [ ] **페이지 접속 확인**

### 기능 테스트 (수동)

- [ ] **정상 파일 업로드**
- [ ] **파일 검증**
  - [ ] XLSX 업로드 ✅
  - [ ] XLS 업로드 ✅
  - [ ] CSV 업로드 ❌
  - [ ] 큰 파일 테스트
  
- [ ] **결과 확인**
  - [ ] 성공 케이스
  - [ ] 부분 성공 케이스
  - [ ] 에러/경고 목록

---

## 🟢 Phase 5: 프로덕션 배포 전 최종 점검

### 코드 정리

```bash
flake8 app/services/excel_*.py
black app/services/excel_*.py
npm run lint && npm run format
```

- [ ] **Linting 통과**
- [ ] **포맷팅 적용**

### 프로덕션 빌드

```bash
npm run build
```

- [ ] **프론트엔드 빌드 성공**
- [ ] **번들 크기 확인**
- [ ] **성능 검증**

### 데이터베이스 준비

- [ ] **프로덕션 마이그레이션 검토**
- [ ] **데이터 백업**

---

## 🚀 Phase 6: 프로덕션 배포

### 배포 준비

```bash
git add .
git commit -m "✨ Feat: Excel Import 기능 추가"
git push origin main
```

- [ ] **Git 커밋**
- [ ] **원격 푸시**

### 백엔드 배포

- [ ] **마이그레이션 적용**
- [ ] **환경 변수 설정**
- [ ] **서버 재시작**

### 프론트엔드 배포

```bash
npm run deploy
```

- [ ] **배포 성공**
- [ ] **프로덕션 접속 확인**

---

## 🔍 Phase 7: 배포 후 검증 (Post-Deployment)

### API 헬스 체크

```bash
curl https://api.your-domain.com/health
```

- [ ] **Health Check 통과**
- [ ] **API 응답 확인**

### 프로덕션 UI 테스트

- [ ] **페이지 접속**
- [ ] **파일 업로드 테스트**
- [ ] **결과 확인**

### 에러 모니터링

- [ ] **에러 로그 확인**
- [ ] **성능 모니터링**

### 데이터 검증

```bash
SELECT * FROM import_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

- [ ] **임포트 로그 확인**
- [ ] **에러 기록 확인**

---

## 🎯 배포 승인

- [ ] **개발 팀 승인** - 담당자: __________ | 날짜: __________
- [ ] **QA 팀 승인** - 담당자: __________ | 날짜: __________
- [ ] **운영 팀 승인** - 담당자: __________ | 날짜: __________

---

## 🔄 롤백 계획

```bash
# 1. 프론트엔드 롤백
git revert <commit_hash>
git push origin main

# 2. 백엔드 롤백
alembic downgrade -1
```

- [ ] **롤백 계획 수립**
- [ ] **담당자 지정**
- [ ] **롤백 테스트 완료**

---

**최종 업데이트:** 2025-06-02 | **버전:** 1.0.0

✅ 모든 항목을 체크했다면 배포 준비 완료입니다!
