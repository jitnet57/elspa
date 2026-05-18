'use client';

import { useState } from 'react';

export default function GuideSettlementPage() {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50'>
      <div className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 shadow-lg'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl font-bold mb-2'>📚 Guide Settlement</h1>
          <p className='text-purple-100 text-lg'>Complete guide to settlement rules, commission structure, and payment methods</p>
        </div>
      </div>

      <main className='max-w-4xl mx-auto p-8'>
        {/* Overview Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-12'>
          <div className='bg-white rounded-lg p-6 shadow border-l-4 border-blue-500'>
            <div className='text-3xl mb-2'>📅</div>
            <h3 className='font-bold text-gray-900 mb-1'>Settlement Cycle</h3>
            <p className='text-sm text-gray-600'>Monthly: 1st - Last day</p>
            <p className='text-sm text-gray-600'>Payout: 5th business day</p>
          </div>

          <div className='bg-white rounded-lg p-6 shadow border-l-4 border-green-500'>
            <div className='text-3xl mb-2'>💰</div>
            <h3 className='font-bold text-gray-900 mb-1'>Therapist Rate</h3>
            <p className='text-sm text-gray-600'>Base: 60%</p>
            <p className='text-sm text-gray-600'>Bonus: +2% ~ +5%</p>
          </div>

          <div className='bg-white rounded-lg p-6 shadow border-l-4 border-purple-500'>
            <div className='text-3xl mb-2'>🏦</div>
            <h3 className='font-bold text-gray-900 mb-1'>Payment Methods</h3>
            <p className='text-sm text-gray-600'>Bank Transfer</p>
            <p className='text-sm text-gray-600'>GCash Wallet</p>
          </div>
        </div>

        {/* Settlement Rules */}
        <div className='bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-purple-500'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>📋 Settlement Rules</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-bold text-gray-900 mb-2'>Monthly Settlement Cycle</h3>
              <ul className='text-sm text-gray-700 space-y-1 ml-4'>
                <li>• Settlement period: 1st to last day of each month</li>
                <li>• Settlement date: 5th business day of next month</li>
                <li>• All transactions finalized by midnight on last day</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Commission Structure */}
        <div className='bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-green-500'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>💰 Commission Structure</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-bold text-gray-900 mb-2'>Therapist Commission</h3>
              <ul className='text-sm text-gray-700 space-y-1 ml-4'>
                <li>• Base rate: 60% of service revenue</li>
                <li>• Performance bonus: +2% for 20+ sessions/month</li>
                <li>• Loyalty bonus: +3% after 6 months</li>
                <li>• Peak season bonus: +5% during holidays</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className='bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-500'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>🏦 Payment Methods</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-bold text-gray-900 mb-2'>Bank Transfer</h3>
              <ul className='text-sm text-gray-700 space-y-1 ml-4'>
                <li>• Direct deposit to registered bank account</li>
                <li>• Processing time: 1-2 business days</li>
                <li>• Minimum transfer: ₱1,000</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className='bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-8 border border-purple-200'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>❓ FAQ</h2>
          <div className='space-y-4'>
            <div className='bg-white rounded p-4'>
              <p className='font-bold text-gray-900 mb-2'>When do I receive settlement?</p>
              <p className='text-gray-700 text-sm'>5th business day of next month. Bank arrives in 1-2 days.</p>
            </div>
            <div className='bg-white rounded p-4'>
              <p className='font-bold text-gray-900 mb-2'>Commission rates?</p>
              <p className='text-gray-700 text-sm'>Base 60% + bonuses (2-5%) for performance & loyalty.</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className='mt-12 bg-white rounded-lg p-8 shadow-lg border-l-4 border-purple-500'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>📞 Support</h2>
          <p className='text-gray-700 mb-2'><span className='font-bold'>Email:</span> support@elplaza.com</p>
          <p className='text-gray-700'><span className='font-bold'>Phone:</span> +63 (0)2 1234-5678</p>
        </div>
      </main>
    </div>
  );
}
