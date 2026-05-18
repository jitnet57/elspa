'use client';

import { useState } from 'react';

export default function GuideSettlementPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('settlement-rules');

  const sections = [
    {
      id: 'settlement-rules',
      title: '📋 Settlement Rules',
      content: [
        {
          subtitle: 'Monthly Settlement Cycle',
          details: [
            'Settlement period: 1st to last day of each month',
            'Settlement date: 5th business day of the following month',
            'All transactions are finalized by midnight on the last day',
            'Late submissions are processed in the next cycle'
          ]
        },
        {
          subtitle: 'Eligible Services',
          details: [
            'Massage therapy services (₱500 - ₱5,000)',
            'Spa treatments (₱1,000 - ₱8,000)',
            'Skin care services (₱800 - ₱4,000)',
            'Nail care services (₱300 - ₱2,000)',
            'Specialized treatments (₱1,500 - ₱10,000)'
          ]
        }
      ]
    },
    {
      id: 'commission-structure',
      title: '💰 Commission Structure',
      content: [
        {
          subtitle: 'Therapist Commission',
          details: [
            'Base rate: 60% of service revenue',
            'Performance bonus: +2% for 20+ sessions/month',
            'Loyalty bonus: +3% after 6 months of service',
            'Peak season bonus: +5% during holidays',
            'Minimum commission: ₱5,000/month'
          ]
        },
        {
          subtitle: 'Company Commission',
          details: [
            'Platform fee: 25% of service revenue',
            'Marketing share: 5% for promotional activities',
            'System maintenance: 2% for platform support',
            'Staff allocation: 8% for manager/staff costs',
            'Net profit after commissions: 10-20%'
          ]
        }
      ]
    },
    {
      id: 'payment-methods',
      title: '🏦 Payment Methods',
      content: [
        {
          subtitle: 'Bank Transfer',
          details: [
            'Direct deposit to registered bank account',
            'Processing time: 1-2 business days',
            'Minimum transfer: ₱1,000',
            'No additional fees for therapists',
            'Monthly statement provided'
          ]
        },
        {
          subtitle: 'Accepted Banks',
          details: [
            'BDO (Banco de Oro)',
            'BPI (Bank of the Philippine Islands)',
            'Metrobank (Metropolitan Bank)',
            'Unionbank',
            'PNB (Philippine National Bank)',
            'GCash (Digital wallet)'
          ]
        }
      ]
    },
    {
      id: 'deductions',
      title: '📉 Deductions & Fees',
      content: [
        {
          subtitle: 'Standard Deductions',
          details: [
            'Cancellation fee: 10% of session value (if cancelled by customer)',
            'No-show penalty: 15% of session value',
            'Refund processing: 5% transaction fee',
            'Late payment fee: ₱500 after 7 days',
            'Admin fee: ₱100 per adjustment'
          ]
        },
        {
          subtitle: 'Benefits Included',
          details: [
            'Health insurance premium: ₱500/month (optional)',
            'Professional development: ₱1,000/quarter',
            'Uniform allowance: ₱2,000/month',
            'Transportation allowance: ₱500/month (for field services)'
          ]
        }
      ]
    },
    {
      id: 'tax-compliance',
      title: '📄 Tax & Compliance',
      content: [
        {
          subtitle: 'Tax Obligations',
          details: [
            'BIR registration required for all therapists',
            'Monthly tax withholding: 5-12% (based on income)',
            'Annual tax return: Filed by El Plaza on behalf of therapists',
            'SSS/Medicare contributions: Automatically deducted',
            'Tax receipts provided quarterly'
          ]
        },
        {
          subtitle: 'Required Documents',
          details: [
            'BIR Form 2316 (Certificate of Compensation)',
            'Bank statements for verification',
            'Monthly settlement reports',
            'Service delivery confirmations',
            'Customer feedback & ratings'
          ]
        }
      ]
    },
    {
      id: 'disputes',
      title: '⚖️ Dispute Resolution',
      content: [
        {
          subtitle: 'Settlement Disputes',
          details: [
            'File within 30 days of settlement date',
            'Provide transaction evidence (screenshots, records)',
            'Investigation period: 5-10 business days',
            'Resolution via credit note or refund',
            'Escalation to management if unresolved'
          ]
        },
        {
          subtitle: 'Appeal Process',
          details: [
            'Level 1: Direct manager review',
            'Level 2: Finance department audit',
            'Level 3: Senior management decision',
            'Level 4: Arbitration (if needed)',
            'Contact: support@elplaza.com'
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">📚 Guide Settlement</h1>
          <p className="text-purple-100 text-lg">Complete guide to settlement rules, commission structure, and payment methods</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-lg p-6 shadow border-l-4 border-blue-500">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold text-gray-900 mb-1">Settlement Cycle</h3>
            <p className="text-sm text-gray-600">Monthly: 1st - Last day</p>
            <p className="text-sm text-gray-600">Payout: 5th business day</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow border-l-4 border-green-500">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-bold text-gray-900 mb-1">Therapist Rate</h3>
            <p className="text-sm text-gray-600">Base: 60%</p>
            <p className="text-sm text-gray-600">Bonus: +2% ~ +5%</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow border-l-4 border-purple-500">
            <div className="text-3xl mb-2">🏦</div>
            <h3 className="font-bold text-gray-900 mb-1">Payment Methods</h3>
            <p className="text-sm text-gray-600">Bank Transfer</p>
            <p className="text-sm text-gray-600">GCash Wallet</p>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 px-6 py-4 flex items-center justify-between transition-colors"
              >
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                <span className={	ext-2xl transition-transform \}>
                  ▼
                </span>
              </button>

              {/* Section Content */}
              {expandedSection === section.id && (
                <div className="px-6 py-6 border-t border-gray-200 bg-white space-y-6">
                  {section.content.map((item, idx) => (
                    <div key={idx}>
                      <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                        {item.subtitle}
                      </h3>
                      <ul className="space-y-2 ml-4">
                        {item.details.map((detail, detailIdx) => (
                          <li key={detailIdx} className="text-gray-700 text-sm flex gap-3">
                            <span className="text-purple-500 font-bold">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-8 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">❓ Frequently Asked Questions</h2>

          <div className="space-y-4">
            <div className="bg-white rounded p-4">
              <p className="font-bold text-gray-900 mb-2">When do I receive my settlement?</p>
              <p className="text-gray-700 text-sm">Settlements are processed on the 5th business day of the following month. Bank transfers typically arrive within 1-2 business days.</p>
            </div>

            <div className="bg-white rounded p-4">
              <p className="font-bold text-gray-900 mb-2">What happens if I cancel a session?</p>
              <p className="text-gray-700 text-sm">If a customer cancels, you'll receive 90% of the service fee. No-shows result in 85% of the service fee.</p>
            </div>

            <div className="bg-white rounded p-4">
              <p className="font-bold text-gray-900 mb-2">How are commissions calculated?</p>
              <p className="text-gray-700 text-sm">Base commission is 60% of service revenue. Additional bonuses apply for performance, loyalty, and peak seasons.</p>
            </div>

            <div className="bg-white rounded p-4">
              <p className="font-bold text-gray-900 mb-2">Can I dispute a settlement?</p>
              <p className="text-gray-700 text-sm">Yes, file a dispute within 30 days of settlement. Contact support with transaction evidence for investigation.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-white rounded-lg p-8 shadow-lg border-l-4 border-purple-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📞 Need Help?</h2>
          <p className="text-gray-700 mb-4">If you have questions about settlements or need clarification on policies:</p>

          <div className="space-y-2">
            <p className="text-gray-700"><span className="font-bold">Email:</span> support@elplaza.com</p>
            <p className="text-gray-700"><span className="font-bold">Phone:</span> +63 (0)2 1234-5678</p>
            <p className="text-gray-700"><span className="font-bold">Hours:</span> Monday - Friday, 9:00 AM - 6:00 PM (PH Time)</p>
            <p className="text-gray-700"><span className="font-bold">Support Portal:</span> help.elplaza.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}
