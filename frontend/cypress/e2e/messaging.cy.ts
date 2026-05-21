/**
 * ============================================================
 * 📌 메시징 E2E 테스트
 * 📋 목적: 메시지 발송, 수신, 이력 관리 기능 테스트
 * 🔧 테스트 케이스: 5개
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 이 테스트는 다음 시나리오를 검증합니다:
 * 1. SMS 메시지 발송
 * 2. 이메일 메시지 발송
 * 3. 메시지 수신 확인
 * 4. 메시지 템플릿 사용
 * 5. 메시지 이력 조회
 */

describe('Messaging - 메시징 시스템', () => {
  beforeEach(() => {
    cy.visit('/admin/messaging')
    cy.url().should('include', '/admin/messaging')
  })

  /**
   * 테스트 1: SMS 메시지 발송
   * 기대 결과: SMS가 정상 발송됨
   */
  describe('SMS 발송', () => {
    it('직원에게 SMS 발송', () => {
      // SMS 탭 선택
      cy.get('[data-testid="tab-sms"]').click()

      // SMS 작성 버튼
      cy.get('[data-testid="btn-compose-sms"]').click()

      // SMS 작성 폼
      cy.get('[data-testid="sms-form"]').should('be.visible')

      // 수신자 선택
      cy.selectDropdown('[data-testid="select-recipient"]', '1')

      // 메시지 입력
      cy.get('[data-testid="textarea-message"]').type('다음 달 급여 명세서를 발송했습니다.')

      // 문자 길이 표시 확인 (SMS는 80자 단위)
      cy.contains('30 / 80').should('be.visible')

      // Mock API
      cy.intercept('POST', '**/api/messaging/sms', {
        statusCode: 200,
        body: {
          id: 1,
          recipient_id: 1,
          message: '다음 달 급여 명세서를 발송했습니다.',
          status: 'sent',
          sent_at: '2026-05-22T10:00:00',
        },
      }).as('sendSMS')

      // 발송 버튼
      cy.get('[data-testid="btn-send-sms"]').click()

      cy.wait('@sendSMS')

      // 성공 메시지
      cy.contains('SMS가 발송되었습니다').should('be.visible')
    })

    it('다중 직원에게 일괄 SMS 발송', () => {
      cy.get('[data-testid="tab-sms"]').click()
      cy.get('[data-testid="btn-compose-sms"]').click()

      // 다중 수신자 선택
      cy.get('[data-testid="select-recipients"]').click()
      cy.get('[data-testid="recipient-option-1"]').click()
      cy.get('[data-testid="recipient-option-2"]').click()
      cy.get('[data-testid="recipient-option-3"]').click()

      cy.get('[data-testid="textarea-message"]').type('정산 완료 안내')

      cy.intercept('POST', '**/api/messaging/sms/bulk', {
        statusCode: 200,
        body: {
          bulk_id: 'bulk-001',
          total_recipients: 3,
          status: 'sent',
        },
      }).as('bulkSendSMS')

      cy.get('[data-testid="btn-send-sms"]').click()

      cy.wait('@bulkSendSMS')

      cy.contains('3명에게 SMS가 발송되었습니다').should('be.visible')
    })

    it('SMS 발송 실패 처리', () => {
      cy.get('[data-testid="tab-sms"]').click()
      cy.get('[data-testid="btn-compose-sms"]').click()

      cy.selectDropdown('[data-testid="select-recipient"]', '1')
      cy.get('[data-testid="textarea-message"]').type('테스트 메시지')

      cy.intercept('POST', '**/api/messaging/sms', {
        statusCode: 400,
        body: { error: '잘못된 전화번호 형식입니다' },
      }).as('failSendSMS')

      cy.get('[data-testid="btn-send-sms"]').click()

      cy.wait('@failSendSMS')

      // 에러 메시지
      cy.contains('잘못된 전화번호 형식입니다').should('be.visible')
    })
  })

  /**
   * 테스트 2: 이메일 메시지 발송
   * 기대 결과: 이메일이 정상 발송됨
   */
  describe('이메일 발송', () => {
    it('직원에게 이메일 발송', () => {
      // 이메일 탭
      cy.get('[data-testid="tab-email"]').click()

      // 이메일 작성
      cy.get('[data-testid="btn-compose-email"]').click()

      cy.get('[data-testid="email-form"]').should('be.visible')

      // 수신자
      cy.selectDropdown('[data-testid="select-recipient"]', '1')

      // 제목
      cy.get('[data-testid="input-subject"]').type('5월 급여 명세서')

      // 본문
      cy.get('[data-testid="textarea-body"]').type('첨부된 파일을 확인하세요.')

      cy.intercept('POST', '**/api/messaging/email', {
        statusCode: 200,
        body: {
          id: 1,
          recipient_id: 1,
          subject: '5월 급여 명세서',
          status: 'sent',
          sent_at: '2026-05-22T10:00:00',
        },
      }).as('sendEmail')

      cy.get('[data-testid="btn-send-email"]').click()

      cy.wait('@sendEmail')

      cy.contains('이메일이 발송되었습니다').should('be.visible')
    })

    it('첨부 파일 포함하여 이메일 발송', () => {
      cy.get('[data-testid="tab-email"]').click()
      cy.get('[data-testid="btn-compose-email"]').click()

      cy.selectDropdown('[data-testid="select-recipient"]', '1')
      cy.get('[data-testid="input-subject"]').type('급여명세서')

      // 파일 첨부
      cy.get('[data-testid="input-attachment"]').selectFile('cypress/fixtures/payroll.pdf')

      // 첨부 파일 확인
      cy.contains('payroll.pdf').should('be.visible')

      cy.intercept('POST', '**/api/messaging/email', {
        statusCode: 200,
        body: { id: 1, status: 'sent' },
      }).as('sendEmailWithAttachment')

      cy.get('[data-testid="btn-send-email"]').click()

      cy.wait('@sendEmailWithAttachment')

      cy.contains('첨부 파일과 함께 이메일이 발송되었습니다').should('be.visible')
    })
  })

  /**
   * 테스트 3: 메시지 템플릿 사용
   * 기대 결과: 템플릿으로 빠른 메시지 작성
   */
  describe('메시지 템플릿', () => {
    it('메시지 템플릿 목록 조회', () => {
      cy.get('[data-testid="btn-templates"]').click()

      cy.intercept('GET', '**/api/messaging/templates', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              name: '급여 명세서 발송',
              type: 'sms',
              content: '다음 달 급여 명세서를 발송했습니다. 홈페이지에서 확인하세요.',
            },
            {
              id: 2,
              name: '정산 완료 안내',
              type: 'sms',
              content: '정산이 완료되었습니다.',
            },
          ],
        },
      }).as('fetchTemplates')

      cy.wait('@fetchTemplates')

      cy.get('[data-testid="templates-list"]').should('contain', '급여 명세서 발송')
      cy.get('[data-testid="templates-list"]').should('contain', '정산 완료 안내')
    })

    it('템플릿으로 메시지 작성', () => {
      cy.get('[data-testid="btn-templates"]').click()

      // 템플릿 선택
      cy.get('[data-testid="template-1"]').click()

      // 템플릿 내용이 메시지에 입력됨
      cy.get('[data-testid="textarea-message"]').should('contain', '다음 달 급여 명세서를 발송했습니다')
    })
  })

  /**
   * 테스트 4: 메시지 이력 조회
   * 기대 결과: 발송 이력이 정상 표시됨
   */
  describe('메시지 이력', () => {
    it('메시지 발송 이력 조회', () => {
      // 이력 탭
      cy.get('[data-testid="tab-history"]').click()

      cy.intercept('GET', '**/api/messaging/history**', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              recipient_name: '김철수',
              message_type: 'sms',
              status: 'sent',
              sent_at: '2026-05-22T10:00:00',
              content: '테스트 메시지',
            },
            {
              id: 2,
              recipient_name: '이영희',
              message_type: 'email',
              status: 'sent',
              sent_at: '2026-05-22T09:30:00',
              content: '급여 명세서',
            },
          ],
          total: 50,
        },
      }).as('fetchHistory')

      cy.wait('@fetchHistory')

      cy.get('[data-testid="history-table"]').should('contain', '김철수')
      cy.get('[data-testid="history-table"]').should('contain', '이영희')
    })

    it('메시지 이력 필터링', () => {
      cy.get('[data-testid="tab-history"]').click()

      // 타입 필터
      cy.get('[data-testid="filter-type"]').click()
      cy.get('[data-testid="filter-type-sms"]').click()

      cy.intercept('GET', '**/api/messaging/history?type=sms', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              recipient_name: '김철수',
              message_type: 'sms',
              status: 'sent',
            },
          ],
          total: 1,
        },
      }).as('filteredHistory')

      cy.wait('@filteredHistory')

      // SMS만 표시됨
      cy.get('[data-testid="history-table"] tbody tr').should('have.length', 1)
    })

    it('메시지 상태별 통계', () => {
      cy.get('[data-testid="tab-history"]').click()

      // 통계 카드
      cy.get('[data-testid="stat-total-sent"]').should('contain', '발송됨')
      cy.get('[data-testid="stat-total-failed"]').should('contain', '실패')
      cy.get('[data-testid="stat-total-pending"]').should('contain', '대기중')
    })
  })

  /**
   * 테스트 5: 메시지 재발송
   * 기대 결과: 실패한 메시지 재발송
   */
  describe('메시지 재발송', () => {
    it('실패한 메시지 재발송', () => {
      cy.get('[data-testid="tab-history"]').click()

      // 상태 필터: 실패
      cy.get('[data-testid="filter-status"]').click()
      cy.get('[data-testid="filter-status-failed"]').click()

      // 실패 메시지 선택
      cy.get('[data-testid="history-table"] tbody tr:first')
        .get('[data-testid="btn-resend"]')
        .click()

      // 확인 다이얼로그
      cy.contains('메시지를 재발송하시겠습니까?').should('be.visible')

      cy.intercept('POST', '**/api/messaging/resend/**', {
        statusCode: 200,
        body: { id: 1, status: 'sent' },
      }).as('resendMessage')

      cy.get('[data-testid="btn-confirm-resend"]').click()

      cy.wait('@resendMessage')

      cy.contains('메시지가 재발송되었습니다').should('be.visible')
    })
  })
})
