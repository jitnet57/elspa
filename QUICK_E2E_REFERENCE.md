# ElSpa E2E 테스트 - 빠른 참조

## 🚀 빠른 시작

```bash
# 1. Cypress UI 모드 열기 (권장)
cd frontend
npm run cypress:open

# 2. 모든 테스트 자동 실행 (헤드리스)
npm run cypress:run

# 3. 특정 브라우저로 테스트
npm run cypress:run:chrome    # Chrome
npm run cypress:run:firefox   # Firefox
npm run cypress:run:edge      # Edge
```

## 📁 테스트 파일 위치

```
frontend/cypress/e2e/
├── auth.cy.ts                    ← 인증 (11 테스트)
├── payroll-dashboard.cy.ts       ← 대시보드 (12 테스트)
├── payroll-crud.cy.ts            ← CRUD (13 테스트)
├── payroll-results.cy.ts         ← 결과 (13 테스트)
├── messaging.cy.ts               ← 메시징 (11 테스트)
└── audit-logs.cy.ts              ← 감사로그 (18 테스트)
```

## 💻 주요 npm 명령어

| 명령어 | 목적 |
|--------|------|
| `cypress:open` | UI 모드 (대화형) |
| `cypress:run` | 자동 실행 (헤드리스) |
| `cypress:run:headed` | 브라우저 표시하며 실행 |
| `cypress:run:chrome` | Chrome에서 실행 |
| `cypress:run:firefox` | Firefox에서 실행 |
| `cypress:run:edge` | Edge에서 실행 |
| `cypress:debug` | 디버그 모드 |
| `cypress:report` | HTML 리포트 생성 |

## 🎯 테스트 케이스 개요

### 인증 (auth.cy.ts)
- 로그인/로그아웃
- 토큰 관리
- 역할 기반 접근

### 급여 대시보드 (payroll-dashboard.cy.ts)
- 대시보드 조회
- 정산 기간 CRUD
- 급여 계산

### 급여 CRUD (payroll-crud.cy.ts)
- 직원 관리
- 현금선금(CA) 신청/승인
- 출퇴근 관리

### 정산 결과 (payroll-results.cy.ts)
- 결과 조회
- PDF 다운로드
- 인쇄 기능

### 메시징 (messaging.cy.ts)
- SMS 발송
- 이메일 발송
- 템플릿 사용

### 감사 로그 (audit-logs.cy.ts)
- 로그 조회
- 다중 필터
- 데이터 내보내기

## 🔧 커스텀 명령어

```typescript
// 인증
cy.login('admin@elspa.test', 'password123')
cy.logout()

// 네비게이션
cy.navigateTo('/admin/payroll')

// 폼
cy.fillForm({ email: 'test@test.com', name: '이름' })
cy.selectDropdown('[data-testid="select"]', 'value')

// 테이블
cy.findTableRow('검색텍스트')
cy.getTableData()

// 대기 및 확인
cy.waitForElement('[data-testid="modal"]')
cy.waitForAPI('loginRequest')
cy.checkNotification('저장되었습니다', 'success')

// 파일
cy.uploadFile('[data-testid="file-input"]', 'payroll.pdf')
```

## 🛠️ 일반적인 테스트 패턴

### 1. API Mock 설정
```typescript
cy.intercept('GET', '/api/data', {
  statusCode: 200,
  body: { data: [] }
}).as('fetchData')
```

### 2. 요소 선택
```typescript
cy.get('[data-testid="button"]')        // data-testid 권장
cy.contains('Click me')                 // 텍스트로 선택
cy.get('button').first()                // 첫 번째 요소
```

### 3. 어설션(검증)
```typescript
cy.url().should('include', '/admin')
cy.get('button').should('be.visible')
cy.contains('Success').should('exist')
cy.get('input').should('have.value', 'text')
cy.get('button').should('be.disabled')
```

### 4. 대기
```typescript
cy.get('[data-testid="loader"]', { timeout: 5000 })
cy.wait('@apiCall')
cy.visit('/page')
cy.wait(2000)  // 마지막 수단만 사용
```

## 📊 테스트 실행 결과

테스트 완료 후 자동으로:
- ✅ `cypress/screenshots/` - 실패 시 스크린샷
- ✅ `cypress/videos/` - 테스트 비디오
- ✅ `cypress-report.html` - HTML 리포트

## 🔍 디버깅

```bash
# 디버그 모드
npm run cypress:debug

# 코드에서
cy.debug()          # Subject 로그
cy.pause()          # 일시 중지
cy.screenshot()     # 스크린샷 캡처
```

## ⚡ 일반적인 오류 해결

| 오류 | 해결책 |
|------|--------|
| 요소를 찾을 수 없음 | `timeout` 증가, `force: true` 사용 |
| 시간 초과 | API 완료 대기, 타임아웃 증가 |
| Mock API 안됨 | `intercept` 순서 확인 (before `visit`) |
| 크로스 오리진 에러 | `chromeWebSecurity: false` (설정에서) |

## 📚 추가 리소스

- **상세 가이드:** `frontend/CYPRESS_E2E_GUIDE.md`
- **설정 파일:** `frontend/cypress.config.ts`
- **커스텀 명령:** `frontend/cypress/support/commands.ts`

## 🎓 예제: 완전한 테스트

```typescript
describe('User Login', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should login successfully', () => {
    // 1. 폼 입력
    cy.get('[data-testid="email"]').type('admin@test.com')
    cy.get('[data-testid="password"]').type('password123')

    // 2. Mock API
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'abc123' }
    }).as('login')

    // 3. 제출
    cy.get('[data-testid="submit"]').click()

    // 4. 대기 및 검증
    cy.wait('@login')
    cy.url().should('include', '/admin')
    cy.contains('Welcome').should('be.visible')
  })
})
```

## ✅ 체크리스트

테스트 작성 시 확인하세요:
- [ ] `data-testid` 사용 (클래스/ID 대신)
- [ ] Mock API 설정 (요청 전)
- [ ] `timeout` 명시 (필요시)
- [ ] 어설션 포함 (검증)
- [ ] `beforeEach` 정리 작업
- [ ] 주석 및 설명 추가
- [ ] 테스트 격리 (독립적 실행)

---

**문서 버전:** 1.0  
**최종 업데이트:** 2026-05-22  
**상태:** ✅ 완료
