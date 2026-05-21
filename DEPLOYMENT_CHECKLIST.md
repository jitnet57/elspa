# ✅ ElSpa 배포 체크리스트

> ElSpa 프로젝트 배포 전 반드시 확인해야 할 항목들을 정리합니다.
> 모든 체크 항목을 완료한 후에만 프로덕션 배포를 진행하세요.

---

## 📋 Pre-Deployment Checklist (배포 전 확인)

### 1️⃣ 코드 품질 & 테스트

- [ ] **모든 테스트 통과**
  - Backend: `pytest tests/ -v`
  - Frontend: `npm run lint` & `npm run build`

- [ ] **코드 리뷰 완료**
  - 최소 2명 이상 승인
  - Conversation summary 작성됨

- [ ] **보안 스캔 통과**
  - 취약점 없음
  - 의존성 업데이트 필요 없음

- [ ] **TypeScript 타입 체크 통과**
  - Frontend: `npx tsc --noEmit`
  - 에러 0개

### 2️⃣ 성능 & 최적화

- [ ] **Lighthouse 스코어 90+ 이상**
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 90+

- [ ] **번들 크기 최적화**
  - Frontend .next/ 크기: < 500MB
  - Backend Docker 이미지: < 500MB

- [ ] **데이터베이스 인덱스 확인**
  - 자주 쿼리되는 컬럼에 인덱스 있음
  - N+1 쿼리 문제 없음

### 3️⃣ 데이터베이스 & 마이그레이션

- [ ] **마이그레이션 테스트 완료**
  - Staging 환경에서 테스트됨
  - 롤백 계획 준비됨

- [ ] **백업 완료**
  - 프로덕션 데이터베이스 백업
  - Supabase 자동 백업 확인

- [ ] **데이터 무결성 확인**
  - 필수 컬럼 검증
  - 외래키 제약조건 확인

### 4️⃣ 환경 설정 & 보안

- [ ] **환경 변수 설정**
  - GitHub Secrets 모두 추가됨
  - .env.production 파일 없음 (버전 관리 제외)

- [ ] **JWT_SECRET_KEY 변경**
  - 강력한 256비트 값 생성
  - 개발/스테이징과 다른 값

- [ ] **CORS 설정 확인**
  - 정확한 프로덕션 도메인 설정
  - Wildcard (*) 사용 안 함

- [ ] **보안 헤더 추가**
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options

### 5️⃣ Docker & 컨테이너

- [ ] **Docker 이미지 빌드 성공**
  - Backend: `docker build -f Dockerfile.backend .`
  - Frontend: `docker build -f Dockerfile.frontend .`

- [ ] **이미지 보안 스캔**
  - 취약한 의존성 없음
  - Base image 최신 버전

- [ ] **Docker Compose 테스트**
  - `docker-compose up` 성공
  - 모든 서비스 시작됨
  - 헬스 체크 통과

### 6️⃣ CI/CD 파이프라인

- [ ] **GitHub Actions 워크플로우 확인**
  - PR Check: 모든 테스트 통과
  - Deploy: 자동 배포 설정 완료
  - Health Check: 매시간 실행 중

- [ ] **배포 로그 접근 가능**
  - GitHub Actions 탭에서 확인 가능
  - 배포 실패 시 알림 설정

---

## 🚀 Deployment Checklist (배포 중)

### 7️⃣ 배포 실행

- [ ] **Main 브랜치 최신 상태**
  - `git status` 확인
  - Pull request 머지 완료

- [ ] **배포 명령어 실행**
  ```bash
  git push origin main
  # GitHub Actions 자동 실행 확인
  ```

- [ ] **배포 진행상황 모니터링**
  - GitHub Actions 대시보드 확인
  - 배포 단계별 로그 확인
  - Docker 이미지 푸시 확인

### 8️⃣ 배포 후 확인

- [ ] **프로덕션 헬스 체크**
  ```bash
  curl https://api.elspa.com/health
  curl https://elspa.com/healthcheck
  ```

- [ ] **주요 기능 테스트**
  - 로그인/로그아웃
  - 예약 생성 & 조회
  - 결제 처리
  - 문서 생성 (PDF)

- [ ] **성능 모니터링**
  - 응답 시간 정상
  - 에러 로그 없음
  - CPU/메모리 사용량 정상

- [ ] **사용자 피드백 수집**
  - 알려진 문제 없음
  - UI/UX 이상 없음

---

## 🔄 Rollback Checklist (롤백 필요 시)

### 9️⃣ 긴급 롤백

- [ ] **이전 버전 정보 확인**
  - Git commit hash 기록
  - 이전 Docker 이미지 태그

- [ ] **데이터베이스 롤백**
  - Supabase 백업에서 복구
  - 혹은 마이그레이션 rolldown

- [ ] **배포 재실행**
  ```bash
  git checkout <이전_커밋>
  git push origin main --force  # ⚠️ 주의: 강제 푸시
  ```

- [ ] **헬스 체크 재확인**
  - 모든 서비스 정상 작동
  - 에러 로그 없음

---

## 📊 배포 후 모니터링 (1주일)

- [ ] **일일 헬스 체크** (자동화됨)
  - `Health Check` 워크플로우 매시간 실행
  - 실패 시 자동 알림

- [ ] **성능 지표 확인**
  - API 응답 시간: < 200ms
  - Frontend 로딩 시간: < 3s
  - 데이터베이스 쿼리 시간: < 100ms

- [ ] **사용자 피드백 모니터링**
  - Sentry 에러 추적
  - 사용자 보고 사항 없음

- [ ] **보안 감시**
  - Suspicious 요청 없음
  - Rate limit 위반 없음

---

## 📝 배포 기록

모든 배포를 기록하여 나중에 참고할 수 있도록 합니다.

### 배포 템플릿

```markdown
## [YYYY-MM-DD HH:MM] 배포 기록

**배포 버전:** v1.0.0  
**커밋 해시:** abc123def456  
**배포자:** jitnet57  

### 변경사항
- Feature 1: ...
- Bug Fix 1: ...
- Performance: ...

### 배포 결과
- ✅ Backend 배포 성공
- ✅ Frontend 배포 성공
- ✅ 헬스 체크 통과

### 문제점 & 해결
- 문제 없음

### 다음 단계
- 모니터링 진행 중
```

---

## 🎯 자동화된 확인사항

다음 항목들은 GitHub Actions으로 자동 확인됩니다:

| 항목 | 워크플로우 | 트리거 |
|------|-----------|--------|
| PR 테스트 | `pr-check.yml` | Pull Request 생성 |
| 자동 배포 | `deploy.yml` | Main 브랜치 푸시 |
| 헬스 체크 | `health-check.yml` | 매시간 (cron) |
| Docker 빌드 | `deploy.yml` | Main 브랜치 푸시 |

---

## 🆘 문제 발생 시

### Q: 배포 실패
**A:** GitHub Actions 로그 확인 → 에러 메시지 검색 → 로컬 재현 → 수정 후 재배포

### Q: 헬스 체크 실패
**A:** 1) 프로덕션 서버 상태 확인 2) 네트워크 연결 확인 3) 데이터베이스 상태 확인 4) 긴급 롤백

### Q: 데이터베이스 마이그레이션 실패
**A:** 1) 백업 확인 2) 오류 로그 확인 3) Staging에서 재테스트 4) 마이그레이션 스크립트 수정

---

**최종 업데이트:** 2026-05-22  
**담당자:** jitnet57  
**버전:** 1.0.0
