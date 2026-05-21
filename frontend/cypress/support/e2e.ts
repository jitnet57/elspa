/**
 * ============================================================
 * 📌 Cypress E2E Support Configuration
 * 📋 목적: 모든 E2E 테스트 전에 실행되는 전역 설정
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 이 파일은:
 * 1. 커스텀 명령어 등록 (commands.ts)
 * 2. 전역 예외 처리
 * 3. 테스트 전/후 설정
 * 4. Mock API 응답 설정
 * 을 담당합니다.
 */

import './commands'

// ============================================================
// 전역 예외 처리
// ============================================================

// 프로덕션 JavaScript 에러를 테스트 실패로 처리하지 않음
// (개발 환경에서의 경고성 에러 무시)
Cypress.on('uncaught:exception', (err) => {
  // TypeError, 네트워크 에러 등의 일부는 무시
  if (
    err.message.includes('Cannot read property') ||
    err.message.includes('Cannot read properties') ||
    err.message.includes('window.matchMedia is not a function')
  ) {
    return false
  }
  return true
})

// ============================================================
// 각 테스트 전 실행: 세션 초기화
// ============================================================

beforeEach(() => {
  // 로컬 스토리지 초기화 (각 테스트마다 깨끗한 상태 시작)
  cy.clearLocalStorage()

  // 쿠키 초기화
  cy.clearCookies()

  // 네트워크 요청 모니터링 초기화
  cy.intercept('/api/**', { log: true }).as('api')
})

// ============================================================
// 각 테스트 후 실행: 정리
// ============================================================

afterEach(() => {
  // 실패한 테스트의 경우 스크린샷 및 비디오가 자동으로 저장됨
  // (cypress.config.ts의 screenshotOnRunFailure, video 설정)
})

// ============================================================
// Mock API 응답 설정 (필요시)
// ============================================================

export const setupMockAuth = () => {
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 200,
    body: {
      access_token: 'test-token-12345',
      token_type: 'bearer',
      user_id: 1,
      email: 'admin@elspa.test',
      role: 'admin',
    },
  }).as('login')
}

export const setupMockPayroll = () => {
  cy.intercept('GET', '/api/payroll/periods', {
    statusCode: 200,
    body: {
      data: [
        {
          id: 1,
          month: '2026-05',
          status: 'active',
          created_at: '2026-05-01T00:00:00',
        },
      ],
    },
  }).as('payrollPeriods')

  cy.intercept('GET', '/api/payroll/employees', {
    statusCode: 200,
    body: {
      data: [
        {
          id: 1,
          name: '김철수',
          position: 'Therapist',
          salary: 2500000,
          status: 'active',
        },
        {
          id: 2,
          name: '이영희',
          position: 'Manager',
          salary: 3000000,
          status: 'active',
        },
      ],
    },
  }).as('employees')
}

export const setupMockAuditLogs = () => {
  cy.intercept('GET', '/api/audit/logs**', {
    statusCode: 200,
    body: {
      data: [
        {
          id: 1,
          user_id: 1,
          action: 'LOGIN',
          resource_type: 'auth',
          timestamp: new Date().toISOString(),
        },
      ],
      total: 100,
      page: 1,
      page_size: 20,
    },
  }).as('auditLogs')
}
