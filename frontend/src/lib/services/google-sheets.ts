/**
 * Google Sheets API 통합 서비스
 * 양방향 동기화 (자동 업로드 / 실시간 갱신)
 */

import { Invoice, Receipt, ExpenseRecord, BudgetAnalysis } from '@/lib/store/types';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  clientSecret?: string;
}

export class GoogleSheetsService {
  private static config: GoogleSheetsConfig = {
    spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  };

  // 인보이스 데이터를 구글 시트에 업로드
  static async uploadInvoices(invoices: Invoice[]): Promise<boolean> {
    try {
      const response = await fetch('/api/google-sheets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: 'invoices',
          data: invoices.map(inv => ({
            '인보이스번호': inv.invoice_number,
            '정산월': inv.settlement_month,
            '금액': inv.net_amount,
            '상태': inv.status,
            '발급일': new Date(inv.issued_at).toLocaleDateString('ko-KR'),
            '지급기한': new Date(inv.due_date).toLocaleDateString('ko-KR'),
          })),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('구글 시트 업로드 실패:', error);
      return false;
    }
  }

  // 영수증 데이터를 구글 시트에 업로드
  static async uploadReceipts(receipts: Receipt[]): Promise<boolean> {
    try {
      const response = await fetch('/api/google-sheets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: 'receipts',
          data: receipts.map(rec => ({
            '영수증번호': rec.receipt_number,
            '금액': rec.amount,
            '결제방법': rec.payment_method === 'card' ? '카드' : rec.payment_method === 'bank_transfer' ? '계좌이체' : '현금',
            '지급일': new Date(rec.paid_at).toLocaleDateString('ko-KR'),
            '상태': rec.status,
          })),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('구글 시트 업로드 실패:', error);
      return false;
    }
  }

  // 비용 기록을 구글 시트에 업로드
  static async uploadExpenses(expenses: ExpenseRecord[]): Promise<boolean> {
    try {
      const response = await fetch('/api/google-sheets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: 'expenses',
          data: expenses.map(exp => ({
            '날짜': exp.date,
            '카테고리': exp.category,
            '금액': exp.amount,
            '설명': exp.description,
            'AI분류': exp.ai_category || '미분류',
            '검증': exp.verified ? '✓' : '✗',
          })),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('구글 시트 업로드 실패:', error);
      return false;
    }
  }

  // 월별 비용 분석 업로드
  static async uploadBudgetAnalysis(analysis: BudgetAnalysis[]): Promise<boolean> {
    try {
      const response = await fetch('/api/google-sheets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: 'budget_analysis',
          data: analysis.map(a => ({
            '월': a.month,
            '카테고리': a.category,
            '예산': a.budgeted,
            '실제': a.actual,
            '차이': a.variance,
            '달성율%': a.percentage.toFixed(1),
          })),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('구글 시트 업로드 실패:', error);
      return false;
    }
  }

  // 구글 시트에서 데이터 읽기
  static async readData(sheetName: string): Promise<any[]> {
    try {
      const response = await fetch(
        `/api/google-sheets/read?sheetName=${sheetName}&spreadsheetId=${this.config.spreadsheetId}`
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('구글 시트 읽기 실패:', error);
      return [];
    }
  }

  // 자동 동기화 스케줄러
  static async autoSync(invoices: Invoice[], receipts: Receipt[], expenses: ExpenseRecord[]): Promise<void> {
    try {
      await Promise.all([
        this.uploadInvoices(invoices),
        this.uploadReceipts(receipts),
        this.uploadExpenses(expenses),
      ]);
      console.log('✅ 구글 시트 자동 동기화 완료');
    } catch (error) {
      console.error('자동 동기화 실패:', error);
    }
  }

  // 일일 자동 백업 및 리포트 생성
  static async generateDailyReport(
    invoices: Invoice[],
    receipts: Receipt[],
    expenses: ExpenseRecord[]
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const totalInvoices = invoices.filter(i => i.settlement_month === today.slice(0, 7)).length;
    const totalRevenue = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);

    const reportData = {
      date: today,
      invoices_count: totalInvoices,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
    };

    try {
      await fetch('/api/google-sheets/add-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
    } catch (error) {
      console.error('일일 리포트 생성 실패:', error);
    }
  }
}
