/**
 * API: 정산 보고서 자동 생성 및 발송
 * 매일 아침 12시 / 저녁 12시 실행
 * Vercel Cron Jobs 또는 외부 스케줄러에서 호출
 */

import { NextRequest, NextResponse } from 'next/server';

interface SettlementReport {
  period: 'morning' | 'evening'; // 아침(전일) 또는 저녁(당일)
  date: string;
  totalSettlements: number;
  totalAmount: number;
  totalCommission: number;
  totalTax: number;
  guidesCount: number;
  companiesCount: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueinvoices: number;
  summary: string;
}

// 정산 보고서 생성
async function generateSettlementReport(period: 'morning' | 'evening'): Promise<SettlementReport> {
  const today = new Date();
  const reportDate = period === 'morning'
    ? new Date(today.getTime() - 24 * 60 * 60 * 1000) // 전일
    : today; // 당일

  // TODO: Store에서 실제 데이터 가져오기
  const report: SettlementReport = {
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
    overdueinvoices: 0,
    summary: `${reportDate.toLocaleDateString('ko-KR')} ${period === 'morning' ? '전일' : '당일'} 정산 완료`,
  };

  return report;
}

// Google Sheets에 보고서 업로드
async function uploadToGoogleSheets(report: SettlementReport): Promise<boolean> {
  try {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_API_TOKEN}`,
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
    });

    return response.ok;
  } catch (error) {
    console.error('Google Sheets 업로드 실패:', error);
    return false;
  }
}

// 이메일로 보고서 발송
async function sendViaEmail(report: SettlementReport, recipientEmails: string[]): Promise<boolean> {
  try {
    const htmlContent = `
      <h2>📊 ${report.period === 'morning' ? '일일 정산 보고서 (전일)' : '정산 진행 현황 (당일)'}</h2>
      <p>${report.date}</p>
      <table border="1" cellpadding="10" style="border-collapse: collapse;">
        <tr>
          <td><strong>총 정산 건수</strong></td>
          <td>${report.totalSettlements}건</td>
        </tr>
        <tr>
          <td><strong>정산 금액</strong></td>
          <td>₩${report.totalAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>수수료</strong></td>
          <td>₩${report.totalCommission.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>과세</strong></td>
          <td>₩${report.totalTax.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>지급완료</strong></td>
          <td>${report.paidInvoices}건</td>
        </tr>
        <tr>
          <td><strong>대기중</strong></td>
          <td>${report.pendingInvoices}건</td>
        </tr>
      </table>
      <p style="margin-top: 20px; color: #666;">
        이 보고서는 자동으로 생성된 정산 현황입니다.
        상세 내용은 <a href="https://elspa.pages.dev/admin/billing">ElSpa 어드민</a>에서 확인하세요.
      </p>
    `;

    const response = await fetch(process.env.EMAIL_API_ENDPOINT || 'https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: recipientEmails.map(email => ({
          to: [{ email }],
        })),
        from: { email: 'noreply@elspa.com' },
        subject: `[ElSpa] ${report.date} 정산 보고서 (${report.period === 'morning' ? '전일' : '당일'})`,
        html: htmlContent,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return false;
  }
}

// 카카오톡으로 보고서 발송
async function sendViaKakaoTalk(report: SettlementReport, recipientPhones: string[]): Promise<boolean> {
  try {
    const message = `
[ElSpa 정산 보고서]

📅 ${report.date} ${report.period === 'morning' ? '(전일)' : '(당일)'}

📊 정산 현황
총 건수: ${report.totalSettlements}건
정산 금액: ₩${report.totalAmount.toLocaleString()}
수수료: ₩${report.totalCommission.toLocaleString()}

✅ 지급완료: ${report.paidInvoices}건
⏳ 대기중: ${report.pendingInvoices}건
❌ 연체: ${report.overdueinvoices}건

🔗 상세보기: https://elspa.pages.dev/admin/billing
    `;

    for (const phone of recipientPhones) {
      const response = await fetch('/api/messaging/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          content: message,
          templateId: 'daily_report', // Kakao 템플릿 ID
        }),
      });

      if (!response.ok) {
        console.error(`카카오톡 발송 실패: ${phone}`);
      }
    }

    return true;
  } catch (error) {
    console.error('카카오톡 발송 실패:', error);
    return false;
  }
}

// 메인 핸들러
export async function POST(request: NextRequest) {
  try {
    // Vercel Cron 보안 확인
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 시간에 따라 morning/evening 결정
    const now = new Date();
    const hours = now.getHours();
    const period: 'morning' | 'evening' = (hours >= 0 && hours < 12) ? 'morning' : 'evening';

    // 1. 보고서 생성
    const report = await generateSettlementReport(period);

    // 2. Google Sheets 업로드
    const sheetsSuccess = await uploadToGoogleSheets(report);

    // 3. 이메일 발송 (관계자 목록)
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);
    const emailSuccess = adminEmails.length > 0 ? await sendViaEmail(report, adminEmails) : true;

    // 4. 카카오톡 발송
    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').filter(Boolean);
    const kakaoSuccess = adminPhones.length > 0 ? await sendViaKakaoTalk(report, adminPhones) : true;

    return NextResponse.json({
      success: sheetsSuccess && emailSuccess && kakaoSuccess,
      report,
      results: {
        sheets: sheetsSuccess,
        email: emailSuccess,
        kakao: kakaoSuccess,
      },
    });
  } catch (error) {
    console.error('정산 보고서 생성 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 수동 테스트용
export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get('period') || 'morning') as 'morning' | 'evening';
  const report = await generateSettlementReport(period);

  return NextResponse.json({
    message: '테스트 보고서 생성 (실제 발송 안됨)',
    report,
  });
}
