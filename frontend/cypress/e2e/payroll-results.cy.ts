/**
 * ============================================================
 * 📌 급여 정산 결과 E2E 테스트
 * 📋 목적: 정산 결과 조회, PDF 다운로드, 상세보기 테스트
 * 🔧 테스트 케이스: 5개
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 이 테스트는 다음 시나리오를 검증합니다:
 * 1. 정산 결과 조회
 * 2. 결과 상세보기
 * 3. PDF 다운로드
 * 4. 결과 인쇄
 * 5. 결과 아카이빙
 */

describe('Payroll Results - 급여 정산 결과', () => {
  beforeEach(() => {
    cy.visit('/admin/payroll/records')
    cy.url().should('include', '/admin/payroll/records')
  })

  /**
   * 테스트 1: 정산 결과 목록 조회
   * 기대 결과: 정산 결과 테이블 표시
   */
  describe('정산 결과 조회', () => {
    it('정산 결과 목록이 표시되어야 함', () => {
      // Mock API
      cy.intercept('GET', '**/api/payroll/records**', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              period_id: 1,
              employee_id: 1,
              employee_name: '김철수',
              base_salary: 2500000,
              allowance: 300000,
              deduction: 250000,
              net_amount: 2550000,
              status: 'completed',
              created_at: '2026-05-22',
            },
            {
              id: 2,
              period_id: 1,
              employee_id: 2,
              employee_name: '이영희',
              base_salary: 3000000,
              allowance: 400000,
              deduction: 300000,
              net_amount: 3100000,
              status: 'completed',
              created_at: '2026-05-22',
            },
          ],
          total: 10,
          page: 1,
          page_size: 20,
        },
      }).as('fetchRecords')

      cy.reload()
      cy.wait('@fetchRecords')

      // 테이블 확인
      cy.get('[data-testid="records-table"]').should('be.visible')
      cy.get('[data-testid="records-table"] tbody tr').should('have.length.at.least', 1)

      // 데이터 확인
      cy.get('[data-testid="records-table"]').should('contain', '김철수')
      cy.get('[data-testid="records-table"]').should('contain', '2,550,000')
    })

    it('정산 결과 필터링', () => {
      // 상태 필터
      cy.get('[data-testid="filter-status"]').click()
      cy.get('[data-testid="filter-status-completed"]').click()

      cy.intercept('GET', '**/api/payroll/records?status=completed', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              employee_name: '김철수',
              status: 'completed',
            },
          ],
          total: 1,
        },
      }).as('filteredRecords')

      cy.wait('@filteredRecords')

      // 필터된 결과 확인
      cy.get('[data-testid="records-table"] tbody tr').should('have.length', 1)
    })

    it('정산 결과 검색', () => {
      // 검색 필드
      cy.get('[data-testid="input-search"]').type('김철수')

      cy.intercept('GET', '**/api/payroll/records?search=김철수', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              employee_name: '김철수',
              net_amount: 2550000,
            },
          ],
          total: 1,
        },
      }).as('searchRecords')

      cy.wait('@searchRecords')

      // 검색 결과
      cy.get('[data-testid="records-table"]').should('contain', '김철수')
    })

    it('정산 결과 정렬', () => {
      // 순지급액 컬럼 정렬 버튼 클릭
      cy.get('[data-testid="header-net-amount"]').click()

      cy.intercept('GET', '**/api/payroll/records?sort=net_amount&order=desc', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 2,
              employee_name: '이영희',
              net_amount: 3100000,
            },
            {
              id: 1,
              employee_name: '김철수',
              net_amount: 2550000,
            },
          ],
        },
      }).as('sortedRecords')

      cy.wait('@sortedRecords')

      // 정렬 결과 확인
      cy.get('[data-testid="records-table"] tbody tr:first').should('contain', '이영희')
    })
  })

  /**
   * 테스트 2: 정산 결과 상세보기
   * 기대 결과: 개별 정산 결과 상세 정보 표시
   */
  describe('정산 결과 상세보기', () => {
    it('정산 결과 상세 페이지 로드', () => {
      // 상세보기 클릭
      cy.get('[data-testid="records-table"] tbody tr:first')
        .get('[data-testid="btn-view-details"]')
        .click()

      // 상세 페이지로 이동
      cy.url().should('include', '/admin/payroll/records/')

      // Mock API
      cy.intercept('GET', '**/api/payroll/records/**', {
        statusCode: 200,
        body: {
          id: 1,
          period_id: 1,
          employee_id: 1,
          employee_name: '김철수',
          employee_email: 'kim@elspa.test',
          position: 'Therapist',
          base_salary: 2500000,
          allowance: [
            { type: '야간수당', amount: 150000 },
            { type: '주말수당', amount: 150000 },
          ],
          deduction: [
            { type: '국민연금', amount: 125000 },
            { type: '건강보험', amount: 125000 },
          ],
          net_amount: 2550000,
          work_days: 20,
          late_count: 1,
          overtime_hours: 5,
          cash_advance: 500000,
          status: 'completed',
          created_at: '2026-05-22T10:00:00',
        },
      }).as('recordDetails')

      cy.wait('@recordDetails')

      // 상세 정보 확인
      cy.contains('김철수').should('be.visible')
      cy.contains('2,500,000').should('be.visible') // 기본급
      cy.contains('2,550,000').should('be.visible') // 순지급액
    })

    it('수당 내역 상세 표시', () => {
      // 상세 페이지
      cy.visit('/admin/payroll/records/1')

      // 수당 섹션
      cy.get('[data-testid="allowance-section"]').should('be.visible')
      cy.get('[data-testid="allowance-section"]').should('contain', '야간수당')
      cy.get('[data-testid="allowance-section"]').should('contain', '주말수당')

      // 각 수당 금액
      cy.contains('150,000').should('have.length.at.least', 2)
    })

    it('공제 내역 상세 표시', () => {
      cy.visit('/admin/payroll/records/1')

      // 공제 섹션
      cy.get('[data-testid="deduction-section"]').should('be.visible')
      cy.get('[data-testid="deduction-section"]').should('contain', '국민연금')
      cy.get('[data-testid="deduction-section"]').should('contain', '건강보험')

      // 각 공제 금액
      cy.contains('125,000').should('have.length.at.least', 2)
    })

    it('근무 현황 표시', () => {
      cy.visit('/admin/payroll/records/1')

      // 근무 정보 섹션
      cy.get('[data-testid="work-info"]').should('contain', '근무일')
      cy.get('[data-testid="work-info"]').should('contain', '20일')

      cy.get('[data-testid="work-info"]').should('contain', '지각')
      cy.get('[data-testid="work-info"]').should('contain', '1회')

      cy.get('[data-testid="work-info"]').should('contain', '초과근무')
      cy.get('[data-testid="work-info"]').should('contain', '5시간')
    })
  })

  /**
   * 테스트 3: PDF 다운로드
   * 기대 결과: PDF 파일이 정상 다운로드됨
   */
  describe('PDF 다운로드', () => {
    it('개별 급여명세서 PDF 다운로드', () => {
      cy.visit('/admin/payroll/records/1')

      // PDF 다운로드 버튼
      cy.get('[data-testid="btn-download-pdf"]').click()

      // Mock API - PDF 생성
      cy.intercept('GET', '**/api/payroll/records/**/pdf', {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="payroll_001.pdf"',
        },
      }).as('downloadPDF')

      cy.wait('@downloadPDF')

      // 다운로드 확인 (파일 시스템에 저장)
      cy.readFile('cypress/downloads/payroll_001.pdf').should('exist')
    })

    it('일괄 PDF 다운로드', () => {
      // 목록 페이지
      cy.visit('/admin/payroll/records')

      // 체크박스로 여러 항목 선택
      cy.get('[data-testid="records-table"] tbody tr:first')
        .find('input[type="checkbox"]')
        .click()

      cy.get('[data-testid="records-table"] tbody tr:eq(1)')
        .find('input[type="checkbox"]')
        .click()

      // 일괄 다운로드 버튼
      cy.get('[data-testid="btn-bulk-download-pdf"]').click()

      // 확인 다이얼로그
      cy.contains('2개 항목의 명세서를 다운로드하시겠습니까?').should('be.visible')

      cy.intercept('POST', '**/api/payroll/records/bulk-pdf', {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="payroll_records.zip"',
        },
      }).as('bulkDownloadPDF')

      cy.get('[data-testid="btn-confirm-download"]').click()

      cy.wait('@bulkDownloadPDF')

      // 다운로드 확인
      cy.readFile('cypress/downloads/payroll_records.zip').should('exist')
    })
  })

  /**
   * 테스트 4: 결과 인쇄
   * 기대 결과: 인쇄 레이아웃이 정상 로드됨
   */
  describe('결과 인쇄', () => {
    it('급여명세서 인쇄 미리보기', () => {
      cy.visit('/admin/payroll/records/1')

      // 인쇄 버튼
      cy.get('[data-testid="btn-print"]').click()

      // 인쇄 미리보기 표시
      cy.get('[data-testid="print-preview"]').should('be.visible')

      // 급여명세서 정보 확인
      cy.contains('급여명세서').should('be.visible')
      cy.contains('김철수').should('be.visible')
    })
  })

  /**
   * 테스트 5: 결과 아카이빙
   * 기대 결과: 정산 결과를 아카이빙/확정 처리
   */
  describe('결과 아카이빙', () => {
    it('정산 결과 확정', () => {
      cy.visit('/admin/payroll/records/1')

      // 확정 버튼
      cy.get('[data-testid="btn-finalize"]').click()

      // 확인 다이얼로그
      cy.contains('정산 결과를 확정하시겠습니까?').should('be.visible')

      cy.intercept('PUT', '**/api/payroll/records/**', {
        statusCode: 200,
        body: { id: 1, status: 'finalized' },
      }).as('finalizeRecord')

      cy.get('[data-testid="btn-confirm-finalize"]').click()

      cy.wait('@finalizeRecord')

      // 상태 변경 확인
      cy.contains('확정됨').should('be.visible')
    })

    it('정산 결과 이의신청', () => {
      cy.visit('/admin/payroll/records/1')

      // 이의신청 버튼
      cy.get('[data-testid="btn-dispute"]').click()

      // 이의신청 폼
      cy.get('[data-testid="dispute-form"]').should('be.visible')

      cy.get('[data-testid="textarea-dispute-reason"]').type('기본급 계산 오류')

      cy.intercept('POST', '**/api/payroll/records/**/dispute', {
        statusCode: 201,
        body: { id: 1, status: 'under_dispute' },
      }).as('submitDispute')

      cy.get('[data-testid="btn-submit-dispute"]').click()

      cy.wait('@submitDispute')

      // 상태 변경
      cy.contains('이의신청됨').should('be.visible')
    })
  })
})
