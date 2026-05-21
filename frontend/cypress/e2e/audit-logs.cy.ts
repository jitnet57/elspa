/**
 * ============================================================
 * 📌 감사 로그 E2E 테스트
 * 📋 목적: 감사 로그 조회, 필터링, 상세보기, 내보내기 테스트
 * 🔧 테스트 케이스: 6개
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 이 테스트는 다음 시나리오를 검증합니다:
 * 1. 감사 로그 목록 조회
 * 2. 로그 필터링
 * 3. 상세 로그 조회
 * 4. 로그 내보내기 (CSV/Excel)
 * 5. 로그 검색
 * 6. 주요 변경 사항 추적
 */

describe('Audit Logs - 감사 로그', () => {
  beforeEach(() => {
    cy.visit('/admin/audit-logs')
    cy.url().should('include', '/admin/audit-logs')
  })

  /**
   * 테스트 1: 감사 로그 목록 조회
   * 기대 결과: 감사 로그 테이블 표시
   */
  describe('감사 로그 조회', () => {
    it('감사 로그 목록이 표시되어야 함', () => {
      // Mock API
      cy.intercept('GET', '**/api/audit/logs**', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              user_id: 1,
              user_name: '관리자',
              action: 'CREATE',
              resource_type: 'employee',
              resource_id: 1,
              description: '직원 김철수 추가',
              changes: {
                old: null,
                new: { name: '김철수', salary: 2500000 },
              },
              ip_address: '192.168.1.1',
              timestamp: '2026-05-22T10:00:00',
              status: 'success',
            },
            {
              id: 2,
              user_id: 1,
              user_name: '관리자',
              action: 'UPDATE',
              resource_type: 'payroll_period',
              resource_id: 1,
              description: '급여 기간 2026-05 상태 변경',
              changes: {
                old: { status: 'draft' },
                new: { status: 'active' },
              },
              ip_address: '192.168.1.1',
              timestamp: '2026-05-22T09:30:00',
              status: 'success',
            },
          ],
          total: 100,
          page: 1,
          page_size: 20,
        },
      }).as('fetchAuditLogs')

      cy.reload()
      cy.wait('@fetchAuditLogs')

      // 테이블 확인
      cy.get('[data-testid="audit-logs-table"]').should('be.visible')
      cy.get('[data-testid="audit-logs-table"] tbody tr').should('have.length.at.least', 1)

      // 데이터 확인
      cy.get('[data-testid="audit-logs-table"]').should('contain', '관리자')
      cy.get('[data-testid="audit-logs-table"]').should('contain', 'CREATE')
      cy.get('[data-testid="audit-logs-table"]').should('contain', 'UPDATE')
    })

    it('로그 페이지네이션', () => {
      cy.intercept('GET', '**/api/audit/logs?page=2', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 21,
              user_name: '관리자',
              action: 'DELETE',
              timestamp: '2026-05-21T15:00:00',
            },
          ],
          total: 100,
          page: 2,
          page_size: 20,
        },
      }).as('fetchPage2')

      // 다음 페이지 버튼
      cy.get('[data-testid="btn-next-page"]').click()

      cy.wait('@fetchPage2')

      // 페이지 2 데이터 확인
      cy.contains('Page 2').should('be.visible')
    })
  })

  /**
   * 테스트 2: 감사 로그 필터링
   * 기대 결과: 필터 조건에 맞는 로그만 표시
   */
  describe('감사 로그 필터링', () => {
    it('작업 유형별 필터링', () => {
      // 작업 유형 필터
      cy.get('[data-testid="filter-action"]').click()
      cy.get('[data-testid="filter-action-create"]').click()

      cy.intercept('GET', '**/api/audit/logs?action=CREATE', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              action: 'CREATE',
              resource_type: 'employee',
              timestamp: '2026-05-22T10:00:00',
            },
          ],
          total: 25,
        },
      }).as('filteredByAction')

      cy.wait('@filteredByAction')

      // CREATE만 표시됨
      cy.get('[data-testid="audit-logs-table"]').should('contain', 'CREATE')
    })

    it('사용자별 필터링', () => {
      cy.get('[data-testid="filter-user"]').click()
      cy.get('[data-testid="filter-user-1"]').click()

      cy.intercept('GET', '**/api/audit/logs?user_id=1', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              user_name: '관리자',
              timestamp: '2026-05-22T10:00:00',
            },
          ],
          total: 50,
        },
      }).as('filteredByUser')

      cy.wait('@filteredByUser')

      // 해당 사용자의 로그만 표시
      cy.get('[data-testid="audit-logs-table"]').should('contain', '관리자')
    })

    it('리소스 유형별 필터링', () => {
      cy.get('[data-testid="filter-resource"]').click()
      cy.get('[data-testid="filter-resource-employee"]').click()

      cy.intercept('GET', '**/api/audit/logs?resource_type=employee', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              resource_type: 'employee',
              timestamp: '2026-05-22T10:00:00',
            },
          ],
          total: 30,
        },
      }).as('filteredByResource')

      cy.wait('@filteredByResource')

      // 직원 관련 로그만 표시
      cy.contains('30').should('be.visible')
    })

    it('날짜 범위로 필터링', () => {
      // 시작일
      cy.get('[data-testid="input-date-from"]').type('2026-05-01')

      // 종료일
      cy.get('[data-testid="input-date-to"]').type('2026-05-22')

      cy.intercept('GET', '**/api/audit/logs?date_from=2026-05-01&date_to=2026-05-22', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              timestamp: '2026-05-22T10:00:00',
            },
          ],
          total: 45,
        },
      }).as('filteredByDate')

      cy.wait('@filteredByDate')

      cy.contains('45').should('be.visible')
    })

    it('다중 필터 조합', () => {
      // 사용자 필터
      cy.get('[data-testid="filter-user"]').click()
      cy.get('[data-testid="filter-user-1"]').click()

      // 작업 유형 필터
      cy.get('[data-testid="filter-action"]').click()
      cy.get('[data-testid="filter-action-update"]').click()

      cy.intercept('GET', '**/api/audit/logs?user_id=1&action=UPDATE', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 2,
              user_name: '관리자',
              action: 'UPDATE',
              timestamp: '2026-05-22T09:30:00',
            },
          ],
          total: 15,
        },
      }).as('filteredByMultiple')

      cy.wait('@filteredByMultiple')

      // 조합된 필터 결과
      cy.get('[data-testid="audit-logs-table"]').should('contain', '관리자')
      cy.get('[data-testid="audit-logs-table"]').should('contain', 'UPDATE')
    })
  })

  /**
   * 테스트 3: 로그 상세보기
   * 기대 결과: 로그의 상세 정보 및 변경 사항 표시
   */
  describe('로그 상세보기', () => {
    it('로그 상세 정보 표시', () => {
      // 로그 행 클릭
      cy.get('[data-testid="audit-logs-table"] tbody tr:first').click()

      // 상세 패널 표시
      cy.get('[data-testid="log-detail-panel"]').should('be.visible')

      // 상세 정보 확인
      cy.contains('작업자').should('be.visible')
      cy.contains('작업 유형').should('be.visible')
      cy.contains('리소스').should('be.visible')
      cy.contains('타임스탬프').should('be.visible')
    })

    it('변경 사항 상세 비교', () => {
      cy.get('[data-testid="audit-logs-table"] tbody tr:first').click()

      // 변경 사항 섹션
      cy.get('[data-testid="log-changes"]').should('be.visible')

      // 이전 값
      cy.contains('변경 전').should('be.visible')

      // 변경 후 값
      cy.contains('변경 후').should('be.visible')

      // 필드별 변경사항 확인
      cy.get('[data-testid="change-field"]').should('contain', 'name')
      cy.get('[data-testid="change-field"]').should('contain', 'salary')
    })

    it('로그 전체 JSON 뷰', () => {
      cy.get('[data-testid="audit-logs-table"] tbody tr:first').click()

      // JSON 뷰 버튼
      cy.get('[data-testid="btn-view-json"]').click()

      // JSON 뷰 표시
      cy.get('[data-testid="log-json-view"]').should('be.visible')

      // JSON 구조 확인
      cy.get('[data-testid="log-json-view"]').should('contain', 'user_id')
      cy.get('[data-testid="log-json-view"]').should('contain', 'action')
    })
  })

  /**
   * 테스트 4: 로그 검색
   * 기대 결과: 검색어로 로그 필터링
   */
  describe('로그 검색', () => {
    it('텍스트 검색', () => {
      cy.get('[data-testid="input-search"]').type('김철수')

      cy.intercept('GET', '**/api/audit/logs?search=김철수', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              description: '직원 김철수 추가',
              timestamp: '2026-05-22T10:00:00',
            },
          ],
          total: 5,
        },
      }).as('searchLogs')

      cy.wait('@searchLogs')

      // 검색 결과
      cy.get('[data-testid="audit-logs-table"]').should('contain', '김철수')
    })

    it('리소스 ID로 검색', () => {
      cy.get('[data-testid="input-search"]').type('employee:1')

      cy.intercept('GET', '**/api/audit/logs?search=employee:1', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              resource_type: 'employee',
              resource_id: 1,
            },
          ],
          total: 10,
        },
      }).as('searchByResourceId')

      cy.wait('@searchByResourceId')

      cy.get('[data-testid="audit-logs-table"]').should('be.visible')
    })
  })

  /**
   * 테스트 5: 로그 내보내기
   * 기대 결과: CSV 또는 Excel 형식으로 내보내기
   */
  describe('로그 내보내기', () => {
    it('CSV로 내보내기', () => {
      cy.get('[data-testid="btn-export"]').click()

      // 내보내기 옵션
      cy.get('[data-testid="export-csv"]').click()

      cy.intercept('GET', '**/api/audit/logs/export?format=csv', {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit_logs.csv"',
        },
        body: 'id,user_name,action,timestamp\n1,관리자,CREATE,2026-05-22T10:00:00',
      }).as('exportCSV')

      cy.wait('@exportCSV')

      // CSV 파일 다운로드 확인
      cy.readFile('cypress/downloads/audit_logs.csv').should('exist')
    })

    it('Excel로 내보내기', () => {
      cy.get('[data-testid="btn-export"]').click()
      cy.get('[data-testid="export-excel"]').click()

      cy.intercept('GET', '**/api/audit/logs/export?format=excel', {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="audit_logs.xlsx"',
        },
      }).as('exportExcel')

      cy.wait('@exportExcel')

      // Excel 파일 다운로드 확인
      cy.readFile('cypress/downloads/audit_logs.xlsx').should('exist')
    })

    it('필터된 로그만 내보내기', () => {
      // 필터 적용
      cy.get('[data-testid="filter-action"]').click()
      cy.get('[data-testid="filter-action-update"]').click()

      // 내보내기
      cy.get('[data-testid="btn-export"]').click()
      cy.get('[data-testid="export-csv"]').click()

      cy.intercept('GET', '**/api/audit/logs/export?format=csv&action=UPDATE', {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit_logs_filtered.csv"',
        },
      }).as('exportFilteredCSV')

      cy.wait('@exportFilteredCSV')

      // 필터된 파일이 다운로드됨
      cy.readFile('cypress/downloads/audit_logs_filtered.csv').should('exist')
    })
  })

  /**
   * 테스트 6: 주요 변경 사항 추적
   * 기대 결과: 급여, 직원 상태 변경 등 주요 이벤트 기록
   */
  describe('주요 변경 사항 추적', () => {
    it('급여 변경 로그', () => {
      cy.get('[data-testid="filter-resource"]').click()
      cy.get('[data-testid="filter-resource-payroll"]').click()

      cy.intercept('GET', '**/api/audit/logs?resource_type=payroll', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              action: 'UPDATE',
              resource_type: 'payroll_record',
              description: '김철수의 5월 급여 수정',
              changes: {
                old: { net_amount: 2500000 },
                new: { net_amount: 2550000 },
              },
              timestamp: '2026-05-22T10:00:00',
            },
          ],
          total: 15,
        },
      }).as('payrollLogs')

      cy.wait('@payrollLogs')

      // 급여 변경 기록 확인
      cy.contains('급여').should('be.visible')
    })

    it('직원 삭제 로그', () => {
      cy.get('[data-testid="filter-action"]').click()
      cy.get('[data-testid="filter-action-delete"]').click()

      cy.intercept('GET', '**/api/audit/logs?action=DELETE', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              action: 'DELETE',
              resource_type: 'employee',
              description: '직원 박철수 삭제',
              timestamp: '2026-05-22T11:00:00',
            },
          ],
          total: 5,
        },
      }).as('deletionLogs')

      cy.wait('@deletionLogs')

      // 삭제 기록 확인
      cy.contains('삭제').should('be.visible')
    })

    it('관리자 작업 감시', () => {
      cy.get('[data-testid="filter-user"]').click()
      cy.get('[data-testid="filter-user-admin"]').click()

      cy.intercept('GET', '**/api/audit/logs?user_id=admin', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              user_name: '관리자',
              action: 'CREATE',
              timestamp: '2026-05-22T10:00:00',
            },
          ],
          total: 80,
        },
      }).as('adminLogs')

      cy.wait('@adminLogs')

      // 관리자 작업만 표시
      cy.contains('80').should('be.visible')
    })
  })
})
