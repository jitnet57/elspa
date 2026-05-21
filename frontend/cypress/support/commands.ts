/**
 * ============================================================
 * 📌 Cypress 커스텀 명령어
 * 📋 목적: 반복적인 테스트 작업을 간소화하는 커스텀 명령어 정의
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 커스텀 명령어 예시:
 * cy.login('admin@elspa.test', 'password123')
 * cy.navigate('/admin/payroll')
 * cy.fillForm({ email: 'test@test.com', password: 'pass' })
 */

// ============================================================
// 인증 관련 명령어
// ============================================================

/**
 * 📌 로그인 커스텀 명령어
 * 📋 목적: 로그인 페이지에서 자격증명으로 로그인
 * 🔧 매개변수: email, password
 * 📤 반환값: void
 * 📅 작성일: 2026-05-22
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email, { force: true })
  cy.get('input[type="password"]').type(password, { force: true })
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})

/**
 * 📌 토큰 기반 로그인 (백엔드 토큰 직접 설정)
 * 📋 목적: 빠른 인증을 위해 localStorage에 토큰 직접 저장
 * 🔧 매개변수: token
 */
Cypress.Commands.add('loginWithToken', (token: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('access_token', token)
    win.localStorage.setItem('token_type', 'bearer')
    win.localStorage.setItem('user_id', '1')
    win.localStorage.setItem('email', 'admin@elspa.test')
    win.localStorage.setItem('role', 'admin')
  })
})

/**
 * 📌 로그아웃 커스텀 명령어
 * 📋 목적: 로그아웃 버튼 클릭 및 로그인 페이지로 리디렉트 확인
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click({ force: true })
  cy.url().should('include', '/login')
  cy.window().then((win) => {
    expect(win.localStorage.getItem('access_token')).to.be.null
  })
})

// ============================================================
// 네비게이션 관련 명령어
// ============================================================

/**
 * 📌 페이지 네비게이션
 * 📋 목적: URL로 페이지 이동 및 로딩 완료 대기
 * 🔧 매개변수: path (예: '/admin/payroll')
 */
Cypress.Commands.add('navigateTo', (path: string) => {
  cy.visit(path)
  cy.get('body').should('be.visible')
  cy.wait(1000) // 페이지 로딩 완료 대기
})

// ============================================================
// 폼 입력 관련 명령어
// ============================================================

/**
 * 📌 폼 필드 입력 (다중 필드)
 * 📋 목적: 여러 폼 필드에 한번에 데이터 입력
 * 🔧 매개변수: formData (객체형식)
 * 📋 예시: cy.fillForm({ email: 'test@test.com', password: 'pass123' })
 */
Cypress.Commands.add('fillForm', (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([fieldName, value]) => {
    cy.get(`input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`)
      .type(value, { force: true })
  })
})

/**
 * 📌 선택 드롭다운 선택
 * 📋 목적: 드롭다운에서 옵션 선택
 * 🔧 매개변수: selector (CSS 선택자), value (선택할 값)
 */
Cypress.Commands.add('selectDropdown', (selector: string, value: string) => {
  cy.get(selector).click({ force: true })
  cy.get(`[data-value="${value}"]`).click({ force: true })
})

/**
 * 📌 테이블 행 찾기
 * 📋 목적: 테이블에서 특정 텍스트가 포함된 행 찾기
 * 🔧 매개변수: text
 */
Cypress.Commands.add('findTableRow', (text: string) => {
  cy.get('table tbody tr').contains(text).parent('tr')
})

// ============================================================
// 대기 및 확인 명령어
// ============================================================

/**
 * 📌 특정 요소가 로딩 완료될 때까지 대기
 * 📋 목적: 동적 콘텐츠 로딩 완료 대기
 * 🔧 매개변수: selector (CSS 선택자)
 */
Cypress.Commands.add('waitForElement', (selector: string) => {
  cy.get(selector, { timeout: 10000 }).should('be.visible')
})

/**
 * 📌 API 응답 대기
 * 📋 목적: 특정 API 호출이 완료될 때까지 대기
 * 🔧 매개변수: alias (인터셉트 alias)
 */
Cypress.Commands.add('waitForAPI', (alias: string) => {
  cy.wait(`@${alias}`)
})

/**
 * 📌 상태 메시지 확인 (성공/에러)
 * 📋 목적: 토스트 또는 알림 메시지 확인
 * 🔧 매개변수: message, type ('success' | 'error')
 */
Cypress.Commands.add('checkNotification', (message: string, type: 'success' | 'error' = 'success') => {
  const selector = type === 'success' ? '.toast-success' : '.toast-error'
  cy.get(selector).should('contain', message)
})

// ============================================================
// 테이블 및 리스트 관련 명령어
// ============================================================

/**
 * 📌 테이블 데이터 추출
 * 📋 목적: 테이블의 모든 데이터를 배열로 추출
 * 📤 반환값: 테이블 데이터 배열
 */
Cypress.Commands.add('getTableData', () => {
  const data: string[][] = []
  cy.get('table tbody tr').each(($row) => {
    const rowData: string[] = []
    cy.wrap($row).find('td').each(($cell) => {
      rowData.push($cell.text())
    })
    data.push(rowData)
  })
  return cy.wrap(data)
})

// ============================================================
// 파일 업로드 관련 명령어
// ============================================================

/**
 * 📌 파일 업로드
 * 📋 목적: 파일 입력 필드에 파일 업로드
 * 🔧 매개변수: filename (파일명), fileType, selector
 */
Cypress.Commands.add('uploadFile', (selector: string, filename: string, fileType = 'text/plain') => {
  cy.get(selector).selectFile(`cypress/fixtures/${filename}`)
})

// ============================================================
// TypeScript 타입 정의
// ============================================================

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginWithToken(token: string): Chainable<void>
      logout(): Chainable<void>
      navigateTo(path: string): Chainable<void>
      fillForm(formData: Record<string, string>): Chainable<void>
      selectDropdown(selector: string, value: string): Chainable<void>
      findTableRow(text: string): Chainable<JQuery<HTMLElement>>
      waitForElement(selector: string): Chainable<void>
      waitForAPI(alias: string): Chainable<void>
      checkNotification(message: string, type?: 'success' | 'error'): Chainable<void>
      getTableData(): Chainable<string[][]>
      uploadFile(selector: string, filename: string, fileType?: string): Chainable<void>
    }
  }
}

export {}
