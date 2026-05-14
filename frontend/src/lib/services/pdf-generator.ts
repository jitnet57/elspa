/**
 * PDF 생성 서비스
 * 인보이스, 영수증 PDF 생성
 * 의존성: pdfkit 또는 jsPDF
 */

import { Invoice, Receipt } from '@/lib/store/types';

// 향후 pdfkit 또는 jsPDF 설치 필요
// npm install pdfkit

export class PDFGenerator {
  // 인보이스 PDF 생성
  static async generateInvoicePDF(invoice: Invoice, companyInfo: any): Promise<Blob> {
    // 임시 구현 - 실제로는 pdfkit 사용
    const html = this.renderInvoiceHTML(invoice, companyInfo);
    return this.htmlToPdf(html);
  }

  // 영수증 PDF 생성
  static async generateReceiptPDF(receipt: Receipt, invoiceInfo: Invoice): Promise<Blob> {
    const html = this.renderReceiptHTML(receipt, invoiceInfo);
    return this.htmlToPdf(html);
  }

  private static renderInvoiceHTML(invoice: Invoice, companyInfo: any): string {
    const issueDate = new Date(invoice.issued_at).toLocaleDateString('ko-KR');
    const dueDate = new Date(invoice.due_date).toLocaleDateString('ko-KR');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Noto Sans KR', sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .info-section { margin-bottom: 20px; display: flex; justify-content: space-between; }
          .company-info { flex: 1; }
          .bill-info { flex: 1; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">인보이스</div>
        </div>

        <div class="info-section">
          <div class="company-info">
            <strong>${companyInfo.name}</strong><br>
            사업자등록번호: ${companyInfo.businessNumber}<br>
            주소: ${companyInfo.address}<br>
            전화: ${companyInfo.phone}
          </div>
          <div class="bill-info">
            <strong>인보이스 번호:</strong> ${invoice.invoice_number}<br>
            <strong>발급일:</strong> ${issueDate}<br>
            <strong>지급기한:</strong> ${dueDate}
          </div>
        </div>

        <table>
          <tr>
            <th>항목</th>
            <th>수량</th>
            <th>단가</th>
            <th>금액</th>
          </tr>
          <tr>
            <td>정산 수수료</td>
            <td>1</td>
            <td>${invoice.total_amount.toLocaleString()}</td>
            <td>${invoice.total_amount.toLocaleString()}원</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">소계</td>
            <td>${invoice.total_amount.toLocaleString()}원</td>
          </tr>
          <tr>
            <td colspan="3">수수료율 (${invoice.commission_rate}%)</td>
            <td>${invoice.commission_amount.toLocaleString()}원</td>
          </tr>
          <tr>
            <td colspan="3">부가세 (10%)</td>
            <td>${invoice.tax_amount.toLocaleString()}원</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">합계</td>
            <td>${invoice.net_amount.toLocaleString()}원</td>
          </tr>
        </table>

        <div class="footer">
          <p>이 인보이스는 전자세금계산서입니다.</p>
          <p>질문이 있으신 경우 위의 연락처로 문의해주시기 바랍니다.</p>
        </div>
      </body>
      </html>
    `;
  }

  private static renderReceiptHTML(receipt: Receipt, invoice: Invoice): string {
    const paidDate = new Date(receipt.paid_at).toLocaleDateString('ko-KR');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Noto Sans KR', sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">영수증</div>
        </div>

        <div class="details">
          <div class="detail-row">
            <span>영수증 번호:</span>
            <span>${receipt.receipt_number}</span>
          </div>
          <div class="detail-row">
            <span>인보이스 번호:</span>
            <span>${invoice.invoice_number}</span>
          </div>
          <div class="detail-row">
            <span>지급일:</span>
            <span>${paidDate}</span>
          </div>
          <div class="detail-row">
            <span>지급방법:</span>
            <span>${receipt.payment_method === 'card' ? '카드' : receipt.payment_method === 'bank_transfer' ? '계좌이체' : '현금'}</span>
          </div>
          <div class="detail-row" style="border-top: 2px solid #333; margin-top: 20px; padding-top: 20px;">
            <span>지급 금액:</span>
            <span class="amount">${receipt.amount.toLocaleString()}원</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // HTML을 PDF Blob으로 변환 (향후 pdfkit 또는 jsPDF 사용)
  private static async htmlToPdf(html: string): Promise<Blob> {
    // 임시 구현 - 실제로는 pdfkit 또는 jsPDF 라이브러리 사용
    // 예: const doc = new jsPDF(); doc.html(html); return doc.output('blob');
    return new Blob([html], { type: 'application/pdf' });
  }

  // 대량 인보이스 생성
  static async generateBulkInvoices(invoices: Invoice[], companyInfo: any): Promise<Map<string, Blob>> {
    const results = new Map<string, Blob>();
    for (const invoice of invoices) {
      const pdf = await this.generateInvoicePDF(invoice, companyInfo);
      results.set(invoice.id, pdf);
    }
    return results;
  }
}
