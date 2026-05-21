# ElSpa E2E 테스트 가이드 (Cypress)

> ElSpa 급여 정산 시스템의 엔드-투-엔드(E2E) 테스트 설정 및 실행 가이드입니다.

## 📋 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [테스트 실행](#테스트-실행)
4. [테스트 작성](#테스트-작성)
5. [테스트 케이스](#테스트-케이스)
6. [Best Practices](#best-practices)
7. [CI/CD 통합](#cicd-통합)
8. [문제 해결](#문제-해결)

---

## 개요

### Cypress란?

Cypress는 JavaScript 기반의 현대적인 E2E 테스트 프레임워크입니다.

**특징:**
- 🚀 빠른 테스트 실행
- 🎥 비디오/스크린샷 자동 저장
- 🔄 실시간 리로딩
- 🐛 상세한 디버깅 정보
- 📱 반응형 테스트 지원
- 🌐 크로스 브라우저 지원

### 테스트 범위

```
ElSpa E2E Tests (6개 파일)
├── 인증 (auth.cy.ts)
│   ├── 로그인/로그아웃
│   ├── 토큰 관리
│   └── 페이지 보호
├── 급여 대시보드 (payroll-dashboard.cy.ts)
│   ├── 대시보드 조회
│   ├── 정산 기간 관리
│   └── 급여 계산
├── 급여 CRUD (payroll-crud.cy.ts)
│   ├── 직원 관리
│   ├── CA 관리
│   └── 출퇴근 관리
├── 급여 결과 (payroll-results.cy.ts)
│   ├── 결과 조회
│   ├── PDF 다운로드
│   └── 인쇄
├── 메시징 (messaging.cy.ts)
│   ├── SMS 발송
│   ├── 이메일 발송
│   └── 메시지 이력
└── 감사 로그 (audit-logs.cy.ts)
    ├── 로그 조회
    ├── 필터링
    └── 내보내기
```

**총 테스트 케이스: 40+개**

---

## 설치 및 설정

### 1. 의존성 설치

```bash
cd frontend
npm install --save-dev cypress @cypress/webpack-dev-server cypress-file-upload @types/cypress
```

### 2. 파일 구조

```
frontend/
├── cypress/
│   ├── e2e/                          # E2E 테스트 파일
│   │   ├── auth.cy.ts
│   │   ├── payroll-dashboard.cy.ts
│   │   ├── payroll-crud.cy.ts
│   │   ├── payroll-results.cy.ts
│   │   ├── messaging.cy.ts
│   │   └── audit-logs.cy.ts
│   ├── support/                      # 지원 파일
│   │   ├── e2e.ts                    # 전역 설정
│   │   ├── commands.ts               # 커스텀 명령어
│   │   └── component.ts              # 컴포넌트 테스트 설정
│   ├── fixtures/                     # 테스트 데이터
│   │   └── payroll.json
│   ├── screenshots/                  # 실패 시 스크린샷
│   ├── videos/                       # 테스트 비디오
│   └── results/                      # 테스트 결과 (JSON)
├── cypress.config.ts                 # Cypress 설정
├── scripts/
│   └── generate-report.js            # 리포트 생성 스크립트
└── package.json                      # npm 스크립트

```

### 3. 환경 설정

`.env.local` 또는 `.env.test`에 다음을 추가:

```env
# API 설정
NEXT_PUBLIC_API_URL=http://localhost:8000

# 테스트 사용자 (mock)
TEST_USER_EMAIL=admin@elspa.test
TEST_USER_PASSWORD=password123
```

---

## 테스트 실행

### 기본 명령어

```bash
# Cypress UI 열기 (대화형 모드)
npm run cypress:open

# 모든 E2E 테스트 실행 (헤드리스)
npm run cypress:run

# 특정 테스트 파일 실행
npm run cypress:run -- --spec "cypress/e2e/auth.cy.ts"

# 특정 브라우저로 실행
npm run cypress:run:chrome    # Chrome
npm run cypress:run:firefox   # Firefox
npm run cypress:run:edge      # Edge

# 헤드 모드로 실행 (브라우저 보기)
npm run cypress:run:headed

# 디버그 모드
npm run cypress:debug
```

### 테스트 환경 시작

**1단계: 백엔드 시작**
```bash
# 프로젝트 루트에서
python main.py
```

**2단계: 프론트엔드 개발 서버 시작**
```bash
cd frontend
npm run dev
```

**3단계: 테스트 실행**
```bash
# 새 터미널에서
cd frontend
npm run cypress:open
```

---

## 테스트 작성

### 기본 구조

```typescript
/**
 * ============================================================
 * 📌 테스트 설명
 * 📋 목적: 무엇을 테스트하는가
 * 🔧 테스트 케이스: N개
 * 📅 작성일: YYYY-MM-DD
 * ============================================================
 */

describe('Feature - 기능명', () => {
  beforeEach(() => {
    // 각 테스트 전에 실행
    cy.visit('/page-url')
  })

  describe('Sub Feature - 세부 기능', () => {
    it('should do something', () => {
      // 테스트 코드
      cy.get('[data-testid="selector"]').click()
      cy.contains('expected text').should('be.visible')
    })
  })
})
```

### 커스텀 명령어 사용

```typescript
// 로그인
cy.login('admin@elspa.test', 'password123')

// 토큰으로 로그인
cy.loginWithToken('test-token-xxx')

// 로그아웃
cy.logout()

// 페이지 이동
cy.navigateTo('/admin/payroll')

// 폼 작성
cy.fillForm({ email: 'test@test.com', password: 'pass' })

// 드롭다운 선택
cy.selectDropdown('[data-testid="select-role"]', 'admin')

// 테이블 행 찾기
cy.findTableRow('김철수')

// 요소 대기
cy.waitForElement('[data-testid="loading-complete"]')

// API 대기
cy.waitForAPI('loginRequest')

// 알림 확인
cy.checkNotification('저장되었습니다', 'success')
```

### Mock API 설정

```typescript
// 단일 요청 Mock
cy.intercept('GET', '/api/users', {
  statusCode: 200,
  body: { data: [{ id: 1, name: 'John' }] }
}).as('getUsers')

// 지연이 있는 Mock
cy.intercept('POST', '/api/auth/login', {
  statusCode: 200,
  delay: 1000,
  body: { token: 'test-token' }
}).as('login')

// 에러 Mock
cy.intercept('DELETE', '/api/users/**', {
  statusCode: 400,
  body: { error: 'Cannot delete user' }
}).as('deleteError')
```

### 어설션(검증) 예제

```typescript
// URL 확인
cy.url().should('include', '/admin')

// 요소 존재 확인
cy.get('[data-testid="button"]').should('exist')

// 텍스트 확인
cy.contains('Success').should('be.visible')

// 속성 확인
cy.get('input').should('have.attr', 'type', 'email')

// 클래스 확인
cy.get('.button').should('have.class', 'disabled')

// 값 확인
cy.get('input').should('have.value', 'test@test.com')

// 개수 확인
cy.get('table tr').should('have.length', 10)

// 상태 확인
cy.get('button').should('be.disabled')
cy.get('input').should('be.enabled')
```

---

## 테스트 케이스

### 1. auth.cy.ts - 인증 테스트

```typescript
// 테스트 케이스
✅ 유효한 자격증명으로 로그인 성공
✅ 로그인 후 localStorage에 토큰 저장
✅ 잘못된 이메일로 로그인 시도
✅ 잘못된 비밀번호로 로그인 시도
✅ 필수 필드 미입력 경고
✅ 성공적인 로그아웃
✅ 미인증 사용자가 대시보드 접근 시 로그인 페이지로 리디렉트
✅ 토큰 만료 시 로그인 페이지로 리디렉트
✅ Admin 역할로 로그인하면 관리자 페이지 접근 가능
✅ Manager 역할로 로그인하면 매니저 페이지만 접근 가능
✅ 페이지 새로고침 후에도 로그인 상태 유지
```

**실행:**
```bash
npm run cypress:run -- --spec "cypress/e2e/auth.cy.ts"
```

### 2. payroll-dashboard.cy.ts - 급여 대시보드

```typescript
// 테스트 케이스
✅ 급여 대시보드 페이지가 정상 로드되어야 함
✅ 대시보드 통계 카드 표시
✅ 정산 기간 목록이 테이블로 표시되어야 함
✅ 정산 기간 필터링 기능
✅ 새로운 정산 기간 생성
✅ 정산 기간 생성 시 필수 필드 검증
✅ 정산 기간에서 급여 계산 버튼 클릭
✅ 급여 계산 결과 상세 조회
✅ 월별 급여 통계 차트 표시
✅ 상단 요약 통계 표시
✅ 정산 기간 수정
✅ 정산 기간 삭제
```

### 3. payroll-crud.cy.ts - 급여 CRUD

```typescript
// 테스트 케이스
✅ 새로운 직원 추가
✅ 직원 추가 시 필수 필드 검증
✅ 중복 이메일 검증
✅ 직원 기본 정보 수정
✅ 직원 급여 수정
✅ 직원 삭제
✅ 현금선금 신청
✅ 현금선금 승인
✅ 현금선금 거절
✅ 출퇴근 시간 입력
✅ 지각 자동 감지
✅ 초과근무 자동 계산
✅ 휴일 추가
```

### 4. payroll-results.cy.ts - 급여 정산 결과

```typescript
// 테스트 케이스
✅ 정산 결과 목록이 표시되어야 함
✅ 정산 결과 필터링
✅ 정산 결과 검색
✅ 정산 결과 정렬
✅ 정산 결과 상세 페이지 로드
✅ 수당 내역 상세 표시
✅ 공제 내역 상세 표시
✅ 근무 현황 표시
✅ 개별 급여명세서 PDF 다운로드
✅ 일괄 PDF 다운로드
✅ 급여명세서 인쇄 미리보기
✅ 정산 결과 확정
✅ 정산 결과 이의신청
```

### 5. messaging.cy.ts - 메시징

```typescript
// 테스트 케이스
✅ 직원에게 SMS 발송
✅ 다중 직원에게 일괄 SMS 발송
✅ SMS 발송 실패 처리
✅ 직원에게 이메일 발송
✅ 첨부 파일 포함하여 이메일 발송
✅ 메시지 템플릿 목록 조회
✅ 템플릿으로 메시지 작성
✅ 메시지 발송 이력 조회
✅ 메시지 이력 필터링
✅ 메시지 상태별 통계
✅ 실패한 메시지 재발송
```

### 6. audit-logs.cy.ts - 감사 로그

```typescript
// 테스트 케이스
✅ 감사 로그 목록이 표시되어야 함
✅ 로그 페이지네이션
✅ 작업 유형별 필터링
✅ 사용자별 필터링
✅ 리소스 유형별 필터링
✅ 날짜 범위로 필터링
✅ 다중 필터 조합
✅ 로그 상세 정보 표시
✅ 변경 사항 상세 비교
✅ 로그 전체 JSON 뷰
✅ 텍스트 검색
✅ 리소스 ID로 검색
✅ CSV로 내보내기
✅ Excel로 내보내기
✅ 필터된 로그만 내보내기
✅ 급여 변경 로그
✅ 직원 삭제 로그
✅ 관리자 작업 감시
```

---

## Best Practices

### 1. Selector 선택

**✅ 좋은 예:**
```typescript
// data-testid 사용 (추천)
cy.get('[data-testid="submit-button"]').click()

// aria-label 사용
cy.get('[aria-label="Close"]').click()

// 역할 기반
cy.get('button[role="submit"]').click()
```

**❌ 나쁜 예:**
```typescript
// 클래스/ID에 의존 (brittleness)
cy.get('.btn.btn-primary').click()
cy.get('#the-button').click()

// 복잡한 CSS selector
cy.get('div > div > button:nth-child(3)').click()
```

### 2. 대기 및 동기화

```typescript
// ❌ 나쁜: 고정 대기
cy.wait(2000)

// ✅ 좋은: 요소 대기
cy.get('[data-testid="modal"]', { timeout: 5000 }).should('be.visible')

// ✅ 좋은: API 대기
cy.intercept('GET', '/api/data').as('fetchData')
cy.visit('/page')
cy.wait('@fetchData')

// ✅ 좋은: 조건 대기
cy.get('button').should('not.be.disabled')
```

### 3. 테스트 격리

```typescript
// 각 테스트는 독립적이어야 함
beforeEach(() => {
  cy.clearLocalStorage()
  cy.clearCookies()
  cy.login('admin@test.com', 'password')
  cy.visit('/admin/dashboard')
})
```

### 4. 데이터 정리

```typescript
afterEach(() => {
  // 생성된 테스트 데이터 정리
  cy.task('db:cleanup')
})
```

### 5. 에러 처리

```typescript
// Cypress 예외 무시
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('Cannot read property')) {
    return false
  }
  return true
})
```

---

## CI/CD 통합

### GitHub Actions

테스트는 자동으로 다음 상황에서 실행됩니다:

1. **PR 생성/업데이트**
   ```
   main 또는 develop 브랜치로의 모든 PR
   ```

2. **main 브랜치 push**
   ```
   git push origin main
   ```

3. **develop 브랜치 push**
   ```
   git push origin develop
   ```

### 워크플로우 파일

`.github/workflows/e2e-tests.yml`

**주요 단계:**
```yaml
1. 코드 체크아웃
2. Node.js 설정
3. 의존성 설치
4. 프론트엔드 빌드
5. Python 설정
6. 백엔드 의존성 설치
7. 백엔드 서버 시작
8. 프론트엔드 개발 서버 시작
9. 서버 상태 확인
10. Cypress 테스트 실행
11. 스크린샷/비디오 업로드
12. 리포트 생성
13. 슬랙 알림
```

### 로컬에서 테스트

```bash
# 1. 요구사항
- Node.js 20+
- Python 3.11+
- PostgreSQL (또는 Docker)

# 2. 환경 설정
cp .env.example .env.local
# .env.local 수정

# 3. 의존성 설치
npm install
pip install -r requirements.txt

# 4. 데이터베이스 초기화
python scripts/init_db.py

# 5. 서버 시작
# 터미널 1: 백엔드
python main.py

# 터미널 2: 프론트엔드
cd frontend && npm run dev

# 터미널 3: 테스트
cd frontend && npm run cypress:run
```

---

## 문제 해결

### 1. Cypress가 요소를 찾을 수 없음

```typescript
// ❌ 원인: 요소가 DOM에 없음
cy.get('[data-testid="button"]').click()

// ✅ 해결: 부모 요소가 로드될 때까지 대기
cy.get('[data-testid="modal"]').should('exist')
cy.get('[data-testid="button"]', { within: '[data-testid="modal"]' }).click()

// ✅ 해결: force 옵션 (마지막 수단)
cy.get('[data-testid="button"]').click({ force: true })
```

### 2. 시간초과 오류

```typescript
// ❌ 기본 타임아웃: 4000ms (너무 짧음)
cy.get('[data-testid="slow-element"]')

// ✅ 해결: 타임아웃 증가
cy.get('[data-testid="slow-element"]', { timeout: 10000 })

// ✅ 해결: API 완료 대기
cy.intercept('GET', '/api/data').as('fetchData')
cy.wait('@fetchData')
```

### 3. 비디오/스크린샷 저장 안됨

```typescript
// cypress.config.ts에서 확인
video: true                          // 비디오 활성화
screenshotOnRunFailure: true         // 실패 시 스크린샷
videoCompression: 32                 // 압축 비율
```

### 4. 크로스 오리진 오류

```typescript
// cypress.config.ts
chromeWebSecurity: false             // 개발 중에만 사용

// 또는 API 호출 시 CORS 설정
cy.intercept('GET', '/api/**', (req) => {
  req.reply((res) => {
    res.headers['Access-Control-Allow-Origin'] = '*'
  })
})
```

### 5. Mock API 응답 안됨

```typescript
// ✅ 올바른 순서
cy.intercept('GET', '/api/data', { body: { data: [] } }).as('getData')
cy.visit('/page')  // 요청이 여기서 발생
cy.wait('@getData')

// ❌ 잘못된 순서
cy.visit('/page')  // 요청이 이미 발생했음
cy.intercept('GET', '/api/data', { body: { data: [] } })
```

### 6. 디버깅

```bash
# 디버그 모드로 실행
npm run cypress:debug

# 또는 코드에서
cy.debug()  // 현재 Subject 로그
cy.pause()  // 실행 일시 중지

// 콘솔 로그
cy.get('[data-testid="element"]').then(($el) => {
  console.log('Element found:', $el)
})

// 스크린샷
cy.screenshot('debug-screenshot')
```

---

## 참고 자료

- [Cypress 공식 문서](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Test Isolation](https://docs.cypress.io/guides/guides/test-isolation)
- [Network Requests](https://docs.cypress.io/guides/guides/network-requests)

---

**최종 업데이트:** 2026-05-22  
**문서 버전:** 1.0  
**작성자:** ElSpa 개발팀
