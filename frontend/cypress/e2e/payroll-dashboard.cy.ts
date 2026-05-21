/**
 * ============================================================
 * 📌 급여 대시보드 E2E 테스트
 * 📋 목적: 급여 대시보드 조회, 정산 기간 관리, 급여 계산 기능 테스트
 * 🔧 테스트 케이스: 6개
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 이 테스트는 다음 시나리오를 검증합니다:
 * 1. 급여 대시보드 페이지 로드
 * 2. 정산 기간 목록 조회
 * 3. 정산 기간 생성
 * 4. 급여 계산 실행
 * 5. 대시보드 통계 표시
 * 6. 필터 및 검색 기능
 */

describe('Payroll Dashboard - 급여 대시보드', () => {
  beforeEach(() => {
    // 로그인 후 대시보드로 이동
    cy.visit('/admin/payroll')
    cy.url().should('include', '/admin/payroll')
  })

  /**
   * 테스트 1: 급여 대시보드 페이지 로드
   * 기대 결과: 페이지 요소 정상 렌더링
   */
  describe('대시보드 기본 화면', () => {
    it('급여 대시보드 페이지가 정상 로드되어야 함', () => {
      cy.visit('/admin/payroll')

      // 페이지 제목 확인
      cy.contains('h1, h2', /급여|Payroll/).should('be.visible')

      // 주요 섹션 확인
      cy.get('[data-testid="payroll-dashboard"]').should('exist')

      // 네비게이션 메뉴 확인
      cy.get('[data-testid="payroll-nav"]').should('contain', '기간관리')
      cy.get('[data-testid="payroll-nav"]').should('contain', '직원관리')
    })

    it('대시보드 통계 카드 표시', () => {
      // 통계 카드들 확인
      cy.get('[data-testid="stat-card"]').should('have.length.greaterThan', 0)

      // 각 카드의 주요 정보 확인
      cy.get('[data-testid="stat-card-total-salary"]').should('contain', '총급여')
      cy.get('[data-testid="stat-card-total-employees"]').should('contain', '직원수')
    })
  })

  /**
   * 테스트 2: 정산 기간 목록 조회
   * 기대 결과: 정산 기간 테이블 표시
   */
  describe('정산 기간 조회', () => {
    it('정산 기간 목록이 테이블로 표시되어야 함', () => {
      // Mock API 설정
      cy.intercept('GET', '**/api/payroll/periods', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              month: '2026-05',
              status: 'active',
              total_salary: 2500000,
              employee_count: 10,
              created_at: '2026-05-01',
            },
            {
              id: 2,
              month: '2026-04',
              status: 'completed',
              total_salary: 2400000,
              employee_count: 9,
              created_at: '2026-04-01',
            },
          ],
          total: 2,
        },
      }).as('fetchPeriods')

      // 페이지 새로고침
      cy.reload()

      // API 호출 대기
      cy.wait('@fetchPeriods')

      // 테이블 확인
      cy.get('[data-testid="periods-table"]').should('be.visible')
      cy.get('[data-testid="periods-table"] tbody tr').should('have.length', 2)

      // 기간 데이터 확인
      cy.get('[data-testid="periods-table"]').should('contain', '2026-05')
      cy.get('[data-testid="periods-table"]').should('contain', '2026-04')
    })

    it('정산 기간 필터링 기능', () => {
      cy.intercept('GET', '**/api/payroll/periods**', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              month: '2026-05',
              status: 'active',
              created_at: '2026-05-01',
            },
          ],
          total: 1,
        },
      }).as('filteredPeriods')

      // 상태 필터 클릭
      cy.get('[data-testid="filter-status"]').click()
      cy.get('[data-testid="filter-status-active"]').click()

      // API 호출 대기
      cy.wait('@filteredPeriods')

      // 필터된 결과 확인
      cy.get('[data-testid="periods-table"] tbody tr').should('have.length', 1)
    })
  })

  /**
   * 테스트 3: 정산 기간 생성
   * 기대 결과: 새 정산 기간이 생성됨
   */
  describe('정산 기간 생성', () => {
    it('새로운 정산 기간 생성', () => {
      // 생성 버튼 클릭
      cy.get('[data-testid="btn-create-period"]').click()

      // 모달 또는 폼이 나타남
      cy.get('[data-testid="period-create-modal"]').should('be.visible')

      // 월 선택
      cy.get('[data-testid="input-period-month"]').click()
      cy.get('[data-testid="month-option-202606"]').click()

      // 기본급 설정
      cy.get('[data-testid="input-base-salary"]').type('2500000')

      // 저장 버튼 클릭
      cy.intercept('POST', '**/api/payroll/periods', {
        statusCode: 201,
        body: {
          id: 3,
          month: '2026-06',
          status: 'active',
          created_at: '2026-06-01',
        },
      }).as('createPeriod')

      cy.get('[data-testid="btn-save-period"]').click()

      // API 호출 대기
      cy.wait('@createPeriod')

      // 성공 메시지 확인
      cy.contains('정산 기간이 생성되었습니다').should('be.visible')

      // 테이블에 새로운 기간 추가 확인
      cy.get('[data-testid="periods-table"]').should('contain', '2026-06')
    })

    it('정산 기간 생성 시 필수 필드 검증', () => {
      cy.get('[data-testid="btn-create-period"]').click()

      // 월 미선택 상태로 저장 시도
      cy.get('[data-testid="btn-save-period"]').click()

      // 검증 에러 메시지 확인
      cy.contains('월을 선택해주세요').should('be.visible')
    })
  })

  /**
   * 테스트 4: 급여 계산 실행
   * 기대 결과: 급여 계산 완료, 결과 표시
   */
  describe('급여 계산', () => {
    it('정산 기간에서 급여 계산 버튼 클릭', () => {
      cy.get('[data-testid="periods-table"] tbody tr:first')
        .get('[data-testid="btn-calculate-payroll"]')
        .click()

      // 계산 중 로딩 표시
      cy.get('[data-testid="loading-indicator"]').should('be.visible')

      // Mock API 응답
      cy.intercept('POST', '**/api/payroll/calculate', {
        statusCode: 200,
        delay: 2000,
        body: {
          period_id: 1,
          total_salary: 2500000,
          total_allowance: 300000,
          total_deduction: 250000,
          net_amount: 2550000,
          employee_count: 10,
          completed_at: '2026-05-22T10:30:00',
        },
      }).as('calculatePayroll')

      cy.wait('@calculatePayroll')

      // 계산 결과 표시
      cy.get('[data-testid="payroll-result"]').should('be.visible')
      cy.contains('2,550,000').should('be.visible') // 순지급액
    })

    it('급여 계산 결과 상세 조회', () => {
      // 결과 상세보기 클릭
      cy.get('[data-testid="btn-view-details"]').click()

      // 상세 페이지로 이동
      cy.url().should('include', '/admin/payroll/records')

      // 계산 결과 표시
      cy.get('[data-testid="payroll-details"]').should('be.visible')
      cy.contains('기본급').should('be.visible')
      cy.contains('제수당').should('be.visible')
      cy.contains('공제').should('be.visible')
    })
  })

  /**
   * 테스트 5: 대시보드 통계 및 차트
   * 기대 결과: 통계 데이터와 차트 표시
   */
  describe('대시보드 통계', () => {
    it('월별 급여 통계 차트 표시', () => {
      // 차트 요소 확인
      cy.get('[data-testid="salary-chart"]').should('be.visible')

      // 차트 범례 확인
      cy.get('[data-testid="chart-legend"]').should('contain', '기본급')
      cy.get('[data-testid="chart-legend"]').should('contain', '제수당')
      cy.get('[data-testid="chart-legend"]').should('contain', '공제')
    })

    it('상단 요약 통계 표시', () => {
      // 현월 급여액
      cy.get('[data-testid="stat-current-month"]').should('be.visible')

      // 직원 수
      cy.get('[data-testid="stat-employee-count"]').should('be.visible')

      // 평균 급여
      cy.get('[data-testid="stat-average-salary"]').should('be.visible')
    })
  })

  /**
   * 테스트 6: 정산 기간 수정 및 삭제
   * 기대 결과: 기간 수정/삭제 기능 동작
   */
  describe('정산 기간 관리', () => {
    it('정산 기간 수정', () => {
      // 기간 행에서 수정 버튼 클릭
      cy.get('[data-testid="periods-table"] tbody tr:first')
        .get('[data-testid="btn-edit-period"]')
        .click()

      // 수정 폼 표시
      cy.get('[data-testid="period-edit-modal"]').should('be.visible')

      // 필드 수정
      cy.get('[data-testid="input-base-salary"]')
        .clear()
        .type('2600000')

      // 저장
      cy.intercept('PUT', '**/api/payroll/periods/**', {
        statusCode: 200,
        body: { id: 1, month: '2026-05', status: 'active' },
      }).as('updatePeriod')

      cy.get('[data-testid="btn-save-period"]').click()

      cy.wait('@updatePeriod')

      // 성공 메시지
      cy.contains('정산 기간이 수정되었습니다').should('be.visible')
    })

    it('정산 기간 삭제', () => {
      // 삭제 버튼 클릭
      cy.get('[data-testid="periods-table"] tbody tr:first')
        .get('[data-testid="btn-delete-period"]')
        .click()

      // 확인 다이얼로그
      cy.contains('정산 기간을 삭제하시겠습니까?').should('be.visible')

      // Mock API
      cy.intercept('DELETE', '**/api/payroll/periods/**', {
        statusCode: 200,
        body: { success: true },
      }).as('deletePeriod')

      cy.get('[data-testid="btn-confirm-delete"]').click()

      cy.wait('@deletePeriod')

      // 성공 메시지
      cy.contains('정산 기간이 삭제되었습니다').should('be.visible')
    })
  })
})
