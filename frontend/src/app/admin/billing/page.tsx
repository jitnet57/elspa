'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store/store';
import { PDFGenerator } from '@/lib/services/pdf-generator';
import { MessagingService } from '@/lib/services/messaging';

export default function BillingPage() {
  const { invoices, receipts, messages, addMessage, updateMessageStatus, addNotification } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const statusMatch = filterStatus === 'all' || inv.status === filterStatus;
      const monthMatch = inv.settlement_month === filterMonth;
      return statusMatch && monthMatch;
    });
  }, [invoices, filterStatus, filterMonth]);

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) return;

      const blob = await PDFGenerator.generateInvoicePDF(invoice, {
        name: '엘스파',
        businessNumber: '123-45-67890',
        address: '서울시 강남구',
        phone: '02-0000-0000',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();

      addNotification({
        type: 'success',
        message: '인보이스 다운로드 완료',
        severity: 'success',
        isRead: false,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: '인보이스 다운로드 중 오류 발생',
        severity: 'error',
        isRead: false,
      });
    }
  };

  const handleSendInvoice = async (invoiceId: string, channel: 'kakao' | 'sms' | 'email') => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) return;

      const result = await MessagingService.sendInvoiceNotification(
        channel,
        {
          phone: '010-0000-0000', // 실제로는 가이드 정보에서 로드
          email: 'guide@example.com',
        },
        {
          invoiceNumber: invoice.invoice_number,
          amount: invoice.net_amount,
          dueDate: new Date(invoice.due_date).toLocaleDateString('ko-KR'),
          downloadUrl: `${window.location.origin}/invoices/${invoiceId}`,
        }
      );

      if (result.success) {
        await addMessage({
          invoice_id: invoiceId,
          recipient_phone: '010-0000-0000',
          recipient_email: 'guide@example.com',
          channel,
          content: `인보이스 ${invoice.invoice_number} 발송`,
          status: 'sent',
          sent_at: new Date().toISOString(),
          retry_count: 0,
        });

        addNotification({
          type: 'success',
          message: `${channel === 'kakao' ? '카카오톡' : channel === 'sms' ? 'SMS' : '이메일'}로 발송 완료`,
          severity: 'success',
          isRead: false,
        });
      } else {
        addNotification({
          type: 'error',
          message: `${channel} 발송 실패: ${result.error}`,
          severity: 'error',
          isRead: false,
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: '발송 중 오류 발생',
        severity: 'error',
        isRead: false,
      });
    }
  };

  const statusLabels = {
    draft: '작성중',
    issued: '발급됨',
    sent: '발송됨',
    paid: '지급됨',
    overdue: '기한초과',
    cancelled: '취소됨',
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    issued: 'bg-blue-100 text-blue-700',
    sent: 'bg-purple-100 text-purple-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">💳 정산 & 영수증</h1>
        <p className="text-lg text-gray-600 font-light">인보이스 발급, 영수증 관리 및 자동 발송</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">월</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">상태</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="all">전체</option>
            <option value="draft">작성중</option>
            <option value="issued">발급됨</option>
            <option value="sent">발송됨</option>
            <option value="paid">지급됨</option>
            <option value="overdue">기한초과</option>
          </select>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-stone-200">
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">인보이스</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">금액</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">지급기한</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">상태</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-stone-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{invoice.invoice_number}</div>
                  <div className="text-sm text-gray-600 font-light">{invoice.settlement_month}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">
                  ₩{invoice.net_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {new Date(invoice.due_date).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                    {statusLabels[invoice.status as keyof typeof statusLabels]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                      title="PDF 다운로드"
                    >
                      📥
                    </button>
                    <button
                      onClick={() => handleSendInvoice(invoice.id, 'kakao')}
                      className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                      title="카카오톡 발송"
                    >
                      💬
                    </button>
                    <button
                      onClick={() => handleSendInvoice(invoice.id, 'sms')}
                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition"
                      title="SMS 발송"
                    >
                      📱
                    </button>
                    <button
                      onClick={() => handleSendInvoice(invoice.id, 'email')}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                      title="이메일 발송"
                    >
                      ✉️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInvoices.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-600 font-light">
            인보이스가 없습니다.
          </div>
        )}
      </div>

      {/* Messages Log */}
      {messages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📬 발송 기록</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {messages.slice(-10).reverse().map((msg) => (
              <div key={msg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-semibold text-gray-900">
                    {msg.channel === 'kakao' ? '💬' : msg.channel === 'sms' ? '📱' : '✉️'} {msg.recipient_phone || msg.recipient_email}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${msg.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.status === 'sent' ? '전송됨' : '실패'}
                  </span>
                </div>
                <span className="text-gray-600 font-light">
                  {new Date(msg.sent_at || Date.now()).toLocaleTimeString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
