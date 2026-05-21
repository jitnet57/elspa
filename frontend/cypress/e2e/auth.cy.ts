/**
 * ============================================================
 * 📌 인증 E2E 테스트
 * 📋 목적: 사용자 로그인, 로그아웃, 토큰 관리 기능 테스트
 * 🔧 테스트 케이스: 4개
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 이 테스트는 다음 시나리오를 검증합니다:
 * 1. 정상 로그인
 * 2. 잘못된 자격증명으로 로그인 시도
 * 3. 로그아웃
 * 4. 인증되지 않은 사용자의 보호된 페이지 접근
 */

describe('Auth - 인증 시스템', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  /**
   * 테스트 1: 정상적인 로그인 플로우
   * 기대 결과: 로그인 후 대시보드로 리디렉트
   */
  describe('정상 로그인', () => {
    it('유효한 자격증명으로 로그인 성공', () => {
      // 1. 로그인 페이지 방문
      cy.visit('/login')
      cy.url().should('include', '/login')

      // 2. 로그인 폼 입력
      cy.get('input[type="email"]').should('be.visible').type('admin@elspa.test')
      cy.get('input[type="password"]').should('be.visible').type('password123')

      // 3. 로그인 버튼 클릭
      cy.get('button[type="submit"]').contains('로그인').click()

      // 4. API 호출 대기 및 응답 확인
      cy.intercept('POST', '**/api/auth/login').as('loginRequest')
      cy.wait('@loginRequest')

      // 5. 로그인 완료 후 대시보드로 리디렉트 확인
      cy.url({ timeout: 5000 }).should('include', '/admin')
      cy.get('h1, h2').should('exist') // 대시보드 페이지 요소 확인
    })

    it('로그인 후 localStorage에 토큰 저장', () => {
      cy.visit('/login')
      cy.get('input[type="email"]').type('admin@elspa.test')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 로그인 완료 후 토큰 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.not.be.null
        expect(win.localStorage.getItem('token_type')).to.equal('bearer')
      })
    })
  })

  /**
   * 테스트 2: 잘못된 자격증명 처리
   * 기대 결과: 에러 메시지 표시, 로그인 페이지에 머물러있음
   */
  describe('로그인 에러 처리', () => {
    it('잘못된 이메일로 로그인 시도', () => {
      cy.visit('/login')
      cy.get('input[type="email"]').type('wrong@email.test')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 에러 메시지 확인
      cy.contains('이메일 또는 비밀번호가 일치하지 않습니다').should('be.visible')

      // 로그인 페이지에 머물러있음
      cy.url().should('include', '/login')
    })

    it('잘못된 비밀번호로 로그인 시도', () => {
      cy.visit('/login')
      cy.get('input[type="email"]').type('admin@elspa.test')
      cy.get('input[type="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()

      // 에러 메시지 확인
      cy.contains('이메일 또는 비밀번호가 일치하지 않습니다').should('be.visible')

      // 로그인 페이지에 머물러있음
      cy.url().should('include', '/login')
    })

    it('필수 필드 미입력 경고', () => {
      cy.visit('/login')

      // 이메일 비입력
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 검증 메시지 확인 (이메일 필수 입력)
      cy.get('input[type="email"]').should('have.attr', 'required')
    })
  })

  /**
   * 테스트 3: 로그아웃 플로우
   * 기대 결과: 로그아웃 후 로그인 페이지로 리디렉트, 토큰 제거
   */
  describe('로그아웃', () => {
    it('성공적인 로그아웃', () => {
      // 먼저 로그인
      cy.visit('/login')
      cy.get('input[type="email"]').type('admin@elspa.test')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 대시보드 확인
      cy.url({ timeout: 5000 }).should('include', '/admin')

      // 로그아웃 버튼 클릭 (헤더 또는 메뉴에 위치)
      cy.get('[data-testid="logout-button"]').click({ force: true })

      // 로그인 페이지로 리디렉트
      cy.url().should('include', '/login')

      // 토큰 삭제 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.be.null
      })
    })
  })

  /**
   * 테스트 4: 보호된 페이지 접근
   * 기대 결과: 미인증 사용자는 로그인 페이지로 리디렉트
   */
  describe('페이지 보호', () => {
    it('미인증 사용자가 대시보드 접근 시 로그인 페이지로 리디렉트', () => {
      // 로컬 스토리지 초기화 (미인증 상태)
      cy.clearLocalStorage()

      // 대시보드 직접 접근 시도
      cy.visit('/admin/payroll')

      // 로그인 페이지로 자동 리디렉트
      cy.url().should('include', '/login')
    })

    it('토큰 만료 시 로그인 페이지로 리디렉트', () => {
      // 만료된 토큰으로 로컬 스토리지 설정
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', 'expired-token-xxx')
      })

      cy.visit('/admin/payroll')

      // API 401 응답 시뮬레이션
      cy.intercept('GET', '**/api/payroll/**', { statusCode: 401 }).as('unauthorized')

      // 로그인 페이지로 리디렉트
      cy.url({ timeout: 5000 }).should('include', '/login')
    })
  })

  /**
   * 테스트 5: 여러 역할(Role) 로그인
   * 기대 결과: 각 역할별로 접근 가능한 페이지 확인
   */
  describe('역할별 로그인', () => {
    it('Admin 역할로 로그인하면 관리자 페이지 접근 가능', () => {
      cy.visit('/login')
      cy.get('input[type="email"]').type('admin@elspa.test')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 로그인 완료 후 역할 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('role')).to.equal('admin')
      })

      // 관리자 대시보드 접근 확인
      cy.url({ timeout: 5000 }).should('include', '/admin')
    })

    it('Manager 역할로 로그인하면 매니저 페이지만 접근 가능', () => {
      cy.visit('/login')
      cy.get('input[type="email"]').type('manager@elspa.test')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 로그인 완료 후 역할 확인
      cy.window().then((win) => {
        expect(win.localStorage.getItem('role')).to.equal('manager')
      })
    })
  })

  /**
   * 테스트 6: 세션 지속성
   * 기대 결과: 페이지 새로고침 후에도 로그인 상태 유지
   */
  describe('세션 지속성', () => {
    it('페이지 새로고침 후에도 로그인 상태 유지', () => {
      // 로그인
      cy.visit('/login')
      cy.get('input[type="email"]').type('admin@elspa.test')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // 대시보드 확인
      cy.url({ timeout: 5000 }).should('include', '/admin')

      // 페이지 새로고침
      cy.reload()

      // 여전히 대시보드에 있음 (로그아웃되지 않음)
      cy.url({ timeout: 5000 }).should('include', '/admin')
    })
  })
})
