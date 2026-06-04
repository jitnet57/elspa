/**
 * 메시징 서비스
 * KakaoTalk, SMS, Email 자동 발송
 * 설정: 환경변수에서 API 키 로드
 */

import { Message } from '@/lib/store/types';

interface MessagingConfig {
  kakao_api_key?: string;
  sms_api_key?: string;
  email_smtp_server?: string;
  email_username?: string;
}

export class MessagingService {
  private static config: MessagingConfig = {
    kakao_api_key: process.env.NEXT_PUBLIC_KAKAO_API_KEY,
    sms_api_key: process.env.NEXT_PUBLIC_SMS_API_KEY,
    email_smtp_server: process.env.EMAIL_SMTP_SERVER,
    email_username: process.env.EMAIL_USERNAME,
  };

  // KakaoTalk 메시지 발송
  static async sendKakaoTalk(
    recipientPhone: string,
    content: string,
    templateId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('/api/messaging/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: recipientPhone,
          content,
          templateId,
        }),
      });

      if (!response.ok) {
        return { success: false, error: '카카오톡 발송 실패' };
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // SMS 메시지 발송
  static async sendSMS(
    recipientPhone: string,
    content: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // SMS 길이 제한 (한글 90자, 영문 160자)
      const maxLength = this.isKorean(content) ? 90 : 160;
      if (content.length > maxLength) {
        content = content.substring(0, maxLength - 3) + '...';
      }

      const response = await fetch('/api/messaging/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: recipientPhone,
          content,
        }),
      });

      if (!response.ok) {
        return { success: false, error: 'SMS 발송 실패' };
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Email 발송
  static async sendEmail(
    recipientEmail: string,
    subject: string,
    htmlContent: string,
    attachmentPath?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('/api/messaging/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          html: htmlContent,
          attachmentPath,
        }),
      });

      if (!response.ok) {
        return { success: false, error: '이메일 발송 실패' };
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // 인보이스 발송 (자동 템플릿)
  static async sendInvoiceNotification(
    channel: 'kakao' | 'sms' | 'email',
    recipient: { phone?: string; email?: string },
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      downloadUrl: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templates = {
      kakao: `안녕하세요!\n\n인보이스 ${invoiceData.invoiceNumber}가 발급되었습니다.\n\n📄 금액: ${invoiceData.amount.toLocaleString()}원\n📅 지급기한: ${invoiceData.dueDate}\n\n✅ 아래 링크에서 영수증을 확인하세요:\n${invoiceData.downloadUrl}`,
      sms: `[ElSpa] 인보이스 ${invoiceData.invoiceNumber} 발급 완료. 금액: ${invoiceData.amount.toLocaleString()}원, 지급기한: ${invoiceData.dueDate}. 상세보기: ${invoiceData.downloadUrl}`,
      email: `<h2>인보이스 발급 안내</h2><p>안녕하세요!</p><p>귀사의 인보이스 <strong>${invoiceData.invoiceNumber}</strong>이 발급되었습니다.</p><ul><li><strong>금액:</strong> ${invoiceData.amount.toLocaleString()}원</li><li><strong>지급기한:</strong> ${invoiceData.dueDate}</li></ul><p><a href="${invoiceData.downloadUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">영수증 다운로드</a></p>`,
    };

    if (channel === 'kakao' && recipient.phone) {
      return this.sendKakaoTalk(recipient.phone, templates.kakao);
    } else if (channel === 'sms' && recipient.phone) {
      return this.sendSMS(recipient.phone, templates.sms);
    } else if (channel === 'email' && recipient.email) {
      return this.sendEmail(
        recipient.email,
        `[ElSpa] 인보이스 ${invoiceData.invoiceNumber} 발급 안내`,
        templates.email
      );
    }

    return { success: false, error: '유효하지 않은 채널 또는 수신자 정보' };
  }

  // 영수증 발송 (자동 템플릿)
  static async sendReceiptNotification(
    channel: 'kakao' | 'sms' | 'email',
    recipient: { phone?: string; email?: string },
    receiptData: {
      receiptNumber: string;
      amount: number;
      paymentMethod: string;
      downloadUrl: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templates = {
      kakao: `안녕하세요!\n\n영수증 ${receiptData.receiptNumber}가 발급되었습니다.\n\n💰 금액: ${receiptData.amount.toLocaleString()}원\n💳 결제방법: ${receiptData.paymentMethod}\n\n✅ 아래 링크에서 영수증을 확인하세요:\n${receiptData.downloadUrl}`,
      sms: `[ElSpa] 영수증 ${receiptData.receiptNumber} 발급 완료. 금액: ${receiptData.amount.toLocaleString()}원. 상세보기: ${receiptData.downloadUrl}`,
      email: `<h2>영수증 발급 완료</h2><p>안녕하세요!</p><p>지급이 완료되었습니다.</p><ul><li><strong>영수증 번호:</strong> ${receiptData.receiptNumber}</li><li><strong>금액:</strong> ${receiptData.amount.toLocaleString()}원</li><li><strong>결제 방법:</strong> ${receiptData.paymentMethod}</li></ul><p><a href="${receiptData.downloadUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">영수증 다운로드</a></p>`,
    };

    if (channel === 'kakao' && recipient.phone) {
      return this.sendKakaoTalk(recipient.phone, templates.kakao);
    } else if (channel === 'sms' && recipient.phone) {
      return this.sendSMS(recipient.phone, templates.sms);
    } else if (channel === 'email' && recipient.email) {
      return this.sendEmail(
        recipient.email,
        `[ElSpa] 영수증 ${receiptData.receiptNumber} 발급 안내`,
        templates.email
      );
    }

    return { success: false, error: '유효하지 않은 채널 또는 수신자 정보' };
  }

  // 재시도 로직 (실패한 메시지 재발송)
  static async retryMessage(message: Message, maxRetries: number = 3): Promise<boolean> {
    if (message.retry_count >= maxRetries) {
      return false; // 최대 재시도 횟수 초과
    }

    try {
      let result;
      if (message.channel === 'kakao') {
        result = await this.sendKakaoTalk(message.recipient_phone, message.content);
      } else if (message.channel === 'sms') {
        result = await this.sendSMS(message.recipient_phone, message.content);
      } else if (message.channel === 'email') {
        result = await this.sendEmail(
          message.recipient_email || '',
          '인보이스 안내',
          message.content
        );
      }

      return result?.success || false;
    } catch {
      return false;
    }
  }

  private static isKorean(text: string): boolean {
    return /[㄀-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  }
}
