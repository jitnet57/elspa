/**
 * Cloudflare Worker: 정산 보고서 자동 생성 및 발송
 * 매일 00:00 (아침) / 12:00 (저녁) 실행
 */

import { Env, ScheduledEvent, ExecutionContext } from './types';

interface SettlementReport {
  period: 'morning' | 'evening';
  date: string;
  totalSettlements: number;
  totalAmount: number;
  totalCommission: number;
  totalTax: number;
  guidesCount: number;
  companiesCount: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  summary: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 시간에 따라 morning/evening 결정
    const now = new Date();
    const hours = now.getHours();
    const period: 'morning' | 'evening' = hours === 0 ? 'morning' : 'evening';

    console.log(`[${now.toISOString()}] 정산 보고서 생성: ${period}`);

    // 1. 보고서 생성
    const report = generateSettlementReport(period);

    // 2. Google Sheets 업로드
    await uploadToGoogleSheets(report, env);

    // 3. 이메일 발송
    await sendViaEmail(report, env);

    // 4. 카카오톡 발송
    await sendViaKakaoTalk(report, env);

    console.log(`✅ 정산 보고서 발송 완료 (${period})`);
  },
};

function generateSettlementReport(period: 'morning' | 'evening'): SettlementReport {
  const today = new Date();
  const reportDate = period === 'morning'
    ? new Date(today.getTime() - 24 * 60 * 60 * 1000)
    : today;

  // TODO: D1 Database 또는 KV에서 실제 데이터 조회
  return {
    period,
    date: reportDate.toISOString().split('T')[0],
    totalSettlements: 15,
    totalAmount: 2500000,
    totalCommission: 250000,
    totalTax: 25000,
    guidesCount: 8,
    companiesCount: 2,
    pendingInvoices: 3,
    paidInvoices: 12,
    overdueInvoices: 0,
    summary: `${reportDate.toLocaleDateString('ko-KR')} ${period === 'morning' ? '전일' : '당일'} 정산 완료`,
  };
}

async function uploadToGoogleSheets(report: SettlementReport, env: Env): Promise<void> {
  try {
    const sheetId = env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
    const apiToken = env.GOOGLE_API_TOKEN;

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'정산보고서'!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            report.date,
            report.period === 'morning' ? '아침' : '저녁',
            report.totalSettlements,
            report.totalAmount,
            report.totalCommission,
            report.totalTax,
            report.paidInvoices,
            report.pendingInvoices,
            report.summary,
          ]],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    console.log('✅ Google Sheets 업로드 완료');
  } catch (error) {
    console.error('❌ Google Sheets 업로드 실패:', error);
  }
}

async function sendViaEmail(report: SettlementReport, env: Env): Promise<void> {
  try {
    const adminEmails = (env.ADMIN_EMAILS || '').split(',').filter(Boolean);
    if (adminEmails.length === 0) return;

    const htmlContent = `
      <h2 style="color: #1e40af;">📊 ${report.period === 'morning' ? '일일 정산 보고서 (전일)' : '정산 진행 현황 (당일)'}</h2>
      <p style="color: #666; font-size: 14px;">${report.date}</p>

      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;"><strong>총 정산 건수</strong></td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">${report.totalSettlements}건</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;"><strong>정산 금액</strong></td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; color: #059669; font-weight: bold;">₩${report.totalAmount.toLocaleString()}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;"><strong>수수료</strong></td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">₩${report.totalCommission.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;"><strong>부가세</strong></td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">₩${report.totalTax.toLocaleString()}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;"><strong>지급 완료</strong></td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">${report.paidInvoices}건</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;"><strong>대기 중</strong></td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">${report.pendingInvoices}건</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;"><strong>연체</strong></td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">${report.overdueInvoices}건</td>
        </tr>
      </table>

      <p style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #059669;">
        <strong>상세 보기:</strong> <a href="https://elspa.pages.dev/admin/billing" style="color: #1e40af;">ElSpa 어드민 대시보드</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">
        이 보고서는 자동으로 생성됩니다. 질문이 있으시면 관리자에게 문의하세요.
      </p>
    `;

    // SendGrid 또는 Mailgun API 호출
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: adminEmails.map(email => ({
          to: [{ email: email.trim() }],
        })),
        from: { email: 'noreply@elspa.com', name: 'ElSpa 정산 시스템' },
        subject: `[ElSpa] ${report.date} 정산 보고서 (${report.period === 'morning' ? '전일' : '당일'})`,
        html: htmlContent,
      }),
    });

    if (response.ok) {
      console.log('✅ 이메일 발송 완료');
    } else {
      console.error(`❌ 이메일 발송 실패: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ 이메일 발송 에러:', error);
  }
}

async function sendViaKakaoTalk(report: SettlementReport, env: Env): Promise<void> {
  try {
    const adminPhones = (env.ADMIN_PHONES || '').split(',').filter(Boolean);
    if (adminPhones.length === 0) return;

    const message = `
[ElSpa 정산 보고서]

📅 ${report.date}
⏰ ${report.period === 'morning' ? '(전일 정산)' : '(당일 진행상황)'}

📊 정산 현황
━━━━━━━━━━━━━━━
• 정산 건수: ${report.totalSettlements}건
• 정산 금액: ₩${report.totalAmount.toLocaleString()}
• 수수료: ₩${report.totalCommission.toLocaleString()}
• 부가세: ₩${report.totalTax.toLocaleString()}

✅ 지급완료: ${report.paidInvoices}건
⏳ 대기중: ${report.pendingInvoices}건
❌ 연체: ${report.overdueInvoices}건

🔗 상세보기
https://elspa.pages.dev/admin/billing
    `;

    for (const phone of adminPhones) {
      try {
        const response = await fetch('https://elspa.pages.dev/api/messaging/kakao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone.trim(),
            content: message,
            templateId: 'daily_report',
          }),
        });

        if (response.ok) {
          console.log(`✅ 카카오톡 발송 완료: ${phone}`);
        } else {
          console.error(`❌ 카카오톡 발송 실패: ${phone}`);
        }
      } catch (error) {
        console.error(`❌ 카카오톡 발송 에러 (${phone}):`, error);
      }
    }
  } catch (error) {
    console.error('❌ 카카오톡 발송 에러:', error);
  }
}
