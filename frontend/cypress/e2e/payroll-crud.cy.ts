/**
 * ============================================================
 * 📌 급여 CRUD 작업 E2E 테스트
 * 📋 목적: 직원 CRUD, 현금선금(CA) 신청/승인, 출퇴근 관리 테스트
 * 🔧 테스트 케이스: 9개
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 이 테스트는 다음 시나리오를 검증합니다:
 * 1. 직원 추가
 * 2. 직원 정보 수정
 * 3. 직원 삭제
 * 4. CA 신청 및 승인
 * 5. 출퇴근 입력 및 자동 계산
 * 6. 휴일 관리
 */

describe('Payroll CRUD - 급여 관리 작업', () => {
  beforeEach(() => {
    cy.visit('/admin/payroll/employees')
    cy.url().should('include', '/admin/payroll/employees')
  })

  /**
   * 테스트 1: 직원 추가
   * 기대 결과: 새 직원이 목록에 추가됨
   */
  describe('직원 추가', () => {
    it('새로운 직원 추가', () => {
      // 직원 추가 버튼 클릭
      cy.get('[data-testid="btn-add-employee"]').click()

      // 직원 추가 폼 표시
      cy.get('[data-testid="employee-form"]').should('be.visible')

      // 폼 필드 입력
      cy.fillForm({
        name: '박준호',
        email: 'park@elspa.test',
        phone: '010-1234-5678',
        position: 'Therapist',
      })

      // 기본급 입력
      cy.get('[data-testid="input-base-salary"]').type('2500000')

      // 직급 선택
      cy.selectDropdown('[data-testid="select-position"]', 'therapist')

      // Mock API
      cy.intercept('POST', '**/api/payroll/employees', {
        statusCode: 201,
        body: {
          id: 11,
          name: '박준호',
          email: 'park@elspa.test',
          position: 'Therapist',
          base_salary: 2500000,
          created_at: '2026-05-22',
        },
      }).as('createEmployee')

      // 저장 버튼 클릭
      cy.get('[data-testid="btn-save-employee"]').click()

      // API 호출 대기
      cy.wait('@createEmployee')

      // 성공 메시지 확인
      cy.contains('직원이 추가되었습니다').should('be.visible')

      // 목록에 추가됨 확인
      cy.get('[data-testid="employees-table"]').should('contain', '박준호')
    })

    it('직원 추가 시 필수 필드 검증', () => {
      cy.get('[data-testid="btn-add-employee"]').click()

      // 이름 비입력 상태로 저장 시도
      cy.get('[data-testid="input-email"]').type('test@elspa.test')
      cy.get('[data-testid="btn-save-employee"]').click()

      // 검증 에러 메시지
      cy.contains('이름을 입력해주세요').should('be.visible')
    })

    it('중복 이메일 검증', () => {
      cy.get('[data-testid="btn-add-employee"]').click()

      // 이미 존재하는 이메일 입력
      cy.fillForm({
        name: '김철수',
        email: 'kim@elspa.test', // 이미 존재
        phone: '010-9999-9999',
        position: 'Therapist',
      })

      cy.get('[data-testid="btn-save-employee"]').click()

      // 에러 메시지
      cy.contains('이미 존재하는 이메일입니다').should('be.visible')
    })
  })

  /**
   * 테스트 2: 직원 정보 수정
   * 기대 결과: 직원 정보가 업데이트됨
   */
  describe('직원 정보 수정', () => {
    it('직원 기본 정보 수정', () => {
      // 직원 행에서 수정 버튼 클릭
      cy.get('[data-testid="employees-table"] tbody tr:first')
        .get('[data-testid="btn-edit-employee"]')
        .click()

      // 수정 폼 표시
      cy.get('[data-testid="employee-form"]').should('be.visible')

      // 필드 수정
      cy.get('[data-testid="input-name"]').clear().type('김철수 (수정)')

      cy.get('[data-testid="input-phone"]').clear().type('010-0000-0000')

      // Mock API
      cy.intercept('PUT', '**/api/payroll/employees/**', {
        statusCode: 200,
        body: {
          id: 1,
          name: '김철수 (수정)',
          phone: '010-0000-0000',
        },
      }).as('updateEmployee')

      // 저장
      cy.get('[data-testid="btn-save-employee"]').click()

      cy.wait('@updateEmployee')

      // 성공 메시지
      cy.contains('직원 정보가 수정되었습니다').should('be.visible')

      // 목록에 수정됨 확인
      cy.get('[data-testid="employees-table"]').should('contain', '김철수 (수정)')
    })

    it('직원 급여 수정', () => {
      cy.get('[data-testid="employees-table"] tbody tr:first')
        .get('[data-testid="btn-edit-employee"]')
        .click()

      // 급여 필드 수정
      cy.get('[data-testid="input-base-salary"]').clear().type('2700000')

      // Mock API
      cy.intercept('PUT', '**/api/payroll/employees/**', {
        statusCode: 200,
        body: { id: 1, base_salary: 2700000 },
      }).as('updateSalary')

      cy.get('[data-testid="btn-save-employee"]').click()

      cy.wait('@updateSalary')

      // 성공 메시지
      cy.contains('직원 정보가 수정되었습니다').should('be.visible')
    })
  })

  /**
   * 테스트 3: 직원 삭제
   * 기대 결과: 직원이 삭제됨
   */
  describe('직원 삭제', () => {
    it('직원 삭제', () => {
      // 삭제 버튼 클릭
      cy.get('[data-testid="employees-table"] tbody tr:last')
        .get('[data-testid="btn-delete-employee"]')
        .click()

      // 확인 다이얼로그
      cy.contains('직원을 삭제하시겠습니까?').should('be.visible')

      // Mock API
      cy.intercept('DELETE', '**/api/payroll/employees/**', {
        statusCode: 200,
        body: { success: true },
      }).as('deleteEmployee')

      cy.get('[data-testid="btn-confirm-delete"]').click()

      cy.wait('@deleteEmployee')

      // 성공 메시지
      cy.contains('직원이 삭제되었습니다').should('be.visible')
    })
  })

  /**
   * 테스트 4: 현금선금(CA) 신청
   * 기대 결과: CA 신청이 생성되고 현황에 반영됨
   */
  describe('현금선금(CA) 관리', () => {
    beforeEach(() => {
      cy.visit('/admin/payroll/cash-advance')
      cy.url().should('include', '/admin/payroll/cash-advance')
    })

    it('현금선금 신청', () => {
      // CA 신청 버튼 클릭
      cy.get('[data-testid="btn-request-ca"]').click()

      // CA 신청 폼
      cy.get('[data-testid="ca-request-form"]').should('be.visible')

      // 직원 선택
      cy.selectDropdown('[data-testid="select-employee"]', '1')

      // 신청 금액 입력
      cy.get('[data-testid="input-amount"]').type('500000')

      // 신청 사유 입력
      cy.get('[data-testid="textarea-reason"]').type('의료비')

      // Mock API
      cy.intercept('POST', '**/api/payroll/cash-advance', {
        statusCode: 201,
        body: {
          id: 1,
          employee_id: 1,
          amount: 500000,
          status: 'pending',
          created_at: '2026-05-22',
        },
      }).as('requestCA')

      // 신청 버튼
      cy.get('[data-testid="btn-submit-ca"]').click()

      cy.wait('@requestCA')

      // 성공 메시지
      cy.contains('현금선금이 신청되었습니다').should('be.visible')

      // CA 목록에 추가됨
      cy.get('[data-testid="ca-list"]').should('contain', '500000')
    })

    it('현금선금 승인', () => {
      // 대기 중인 CA 신청 찾기
      cy.get('[data-testid="ca-list"] tr')
        .contains('pending')
        .parent('tr')
        .get('[data-testid="btn-approve-ca"]')
        .click()

      // 확인 다이얼로그
      cy.contains('현금선금을 승인하시겠습니까?').should('be.visible')

      // Mock API
      cy.intercept('PUT', '**/api/payroll/cash-advance/**', {
        statusCode: 200,
        body: { id: 1, status: 'approved' },
      }).as('approveCA')

      cy.get('[data-testid="btn-confirm-approve"]').click()

      cy.wait('@approveCA')

      // 상태 변경 확인
      cy.contains('approved').should('be.visible')
    })

    it('현금선금 거절', () => {
      // 거절 버튼 클릭
      cy.get('[data-testid="ca-list"] tr')
        .contains('pending')
        .parent('tr')
        .get('[data-testid="btn-reject-ca"]')
        .click()

      // 거절 사유 입력
      cy.get('[data-testid="textarea-rejection-reason"]').type('잔액 부족')

      // Mock API
      cy.intercept('PUT', '**/api/payroll/cash-advance/**', {
        statusCode: 200,
        body: { id: 1, status: 'rejected' },
      }).as('rejectCA')

      cy.get('[data-testid="btn-confirm-reject"]').click()

      cy.wait('@rejectCA')

      // 상태 변경
      cy.contains('rejected').should('be.visible')
    })
  })

  /**
   * 테스트 5: 출퇴근 입력
   * 기대 결과: 출퇴근 시간 기록 및 자동 계산
   */
  describe('출퇴근 관리', () => {
    beforeEach(() => {
      cy.visit('/admin/payroll/attendance')
      cy.url().should('include', '/admin/payroll/attendance')
    })

    it('출퇴근 시간 입력', () => {
      // 출퇴근 기록 추가 버튼
      cy.get('[data-testid="btn-add-attendance"]').click()

      // 출퇴근 폼
      cy.get('[data-testid="attendance-form"]').should('be.visible')

      // 직원 선택
      cy.selectDropdown('[data-testid="select-employee"]', '1')

      // 날짜 선택
      cy.get('[data-testid="input-date"]').type('2026-05-22')

      // 출근 시간
      cy.get('[data-testid="input-start-time"]').type('09:00')

      // 퇴근 시간
      cy.get('[data-testid="input-end-time"]').type('18:00')

      // Mock API
      cy.intercept('POST', '**/api/payroll/attendance', {
        statusCode: 201,
        body: {
          id: 1,
          employee_id: 1,
          date: '2026-05-22',
          start_time: '09:00',
          end_time: '18:00',
          work_hours: 9,
          status: 'recorded',
        },
      }).as('addAttendance')

      cy.get('[data-testid="btn-save-attendance"]').click()

      cy.wait('@addAttendance')

      // 성공 메시지
      cy.contains('출퇴근이 기록되었습니다').should('be.visible')

      // 근무시간 자동 계산 확인
      cy.contains('9시간').should('be.visible')
    })

    it('지각 자동 감지', () => {
      cy.get('[data-testid="btn-add-attendance"]').click()

      cy.selectDropdown('[data-testid="select-employee"]', '1')
      cy.get('[data-testid="input-date"]').type('2026-05-22')
      cy.get('[data-testid="input-start-time"]').type('09:30') // 30분 지각
      cy.get('[data-testid="input-end-time"]').type('18:00')

      cy.intercept('POST', '**/api/payroll/attendance', {
        statusCode: 201,
        body: {
          id: 2,
          employee_id: 1,
          date: '2026-05-22',
          start_time: '09:30',
          end_time: '18:00',
          late_minutes: 30,
          status: 'late',
        },
      }).as('addLateAttendance')

      cy.get('[data-testid="btn-save-attendance"]').click()

      cy.wait('@addLateAttendance')

      // 지각 표시
      cy.get('[data-testid="attendance-list"]').should('contain', '지각')
      cy.get('[data-testid="attendance-list"]').should('contain', '30분')
    })

    it('초과근무 자동 계산', () => {
      cy.get('[data-testid="btn-add-attendance"]').click()

      cy.selectDropdown('[data-testid="select-employee"]', '1')
      cy.get('[data-testid="input-date"]').type('2026-05-22')
      cy.get('[data-testid="input-start-time"]').type('09:00')
      cy.get('[data-testid="input-end-time"]').type('21:00') // 12시간 근무

      cy.intercept('POST', '**/api/payroll/attendance', {
        statusCode: 201,
        body: {
          id: 3,
          employee_id: 1,
          start_time: '09:00',
          end_time: '21:00',
          work_hours: 12,
          overtime_hours: 3,
          status: 'overtime',
        },
      }).as('addOvertime')

      cy.get('[data-testid="btn-save-attendance"]').click()

      cy.wait('@addOvertime')

      // 초과근무 표시
      cy.get('[data-testid="attendance-list"]').should('contain', '초과근무')
      cy.get('[data-testid="attendance-list"]').should('contain', '3시간')
    })
  })

  /**
   * 테스트 6: 휴일 관리
   * 기대 결과: 휴일 설정 및 조회
   */
  describe('휴일 관리', () => {
    beforeEach(() => {
      cy.visit('/admin/payroll/holidays')
      cy.url().should('include', '/admin/payroll/holidays')
    })

    it('휴일 추가', () => {
      cy.get('[data-testid="btn-add-holiday"]').click()

      cy.get('[data-testid="input-holiday-date"]').type('2026-06-06')
      cy.get('[data-testid="input-holiday-name"]').type('현충일')

      cy.intercept('POST', '**/api/payroll/holidays', {
        statusCode: 201,
        body: {
          id: 1,
          date: '2026-06-06',
          name: '현충일',
          created_at: '2026-05-22',
        },
      }).as('addHoliday')

      cy.get('[data-testid="btn-save-holiday"]').click()

      cy.wait('@addHoliday')

      cy.contains('휴일이 추가되었습니다').should('be.visible')
      cy.get('[data-testid="holidays-list"]').should('contain', '현충일')
    })
  })
})
