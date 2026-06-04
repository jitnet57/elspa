'use client';

import { useState } from 'react';

export default function SettlementInitPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [initData, setInitData] = useState<any>(null);

  // ⚠️ 백엔드 제거 — 정산 데이터는 Supabase에서 관리합니다.
  // 초기화/시드는 supabase/*.sql (schema/payroll_companies/settlement_mock_data) 실행으로 처리.
  const handleInitialize = async () => {
    setStatus('success');
    setMessage('ℹ️ 정산 데이터는 Supabase에서 관리됩니다. 시드는 supabase/settlement_mock_data.sql 을 SQL Editor에서 실행하세요. (백엔드 불필요)');
    setInitData(null);
  };

  const handleReset = async () => {
    if (!confirm('⚠️ 정산 데이터 초기화는 Supabase SQL Editor에서 직접 수행합니다. 안내를 표시할까요?')) return;
    setStatus('success');
    setMessage('ℹ️ 초기화: Supabase에서 해당 테이블을 truncate 하거나 시드 SQL을 재실행하세요. (이 화면은 백엔드 없이 동작)');
    setInitData(null);
  };

  const handleCheckStatus = async () => {
    setMessage('ℹ️ 현재 정산 현황은 /admin/monthly-settlement · /admin/settlement-report 에서 Supabase 실데이터로 확인하세요.');
    setInitData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">⚙️ Settlement Data Initialization</h1>
          <p className="text-red-100">Manage mock data for development & testing. Will be reset before app store launch.</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Warning Banner */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
          <p className="text-red-900 font-bold mb-2">⚠️ Development Only</p>
          <p className="text-red-800 text-sm">
            This interface is for development & testing purposes. All mock data will be replaced with real data before launching on the app store.
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Initialize Button */}
          <button
            onClick={handleInitialize}
            disabled={status === 'loading'}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <div className="text-3xl mb-2">🔄</div>
            <div>Initialize Data</div>
            <div className="text-xs mt-1 opacity-90">Load mock settlement data</div>
          </button>

          {/* Check Status Button */}
          <button
            onClick={handleCheckStatus}
            disabled={status === 'loading'}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <div className="text-3xl mb-2">📊</div>
            <div>Check Status</div>
            <div className="text-xs mt-1 opacity-90">View current data status</div>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={status === 'loading'}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <div className="text-3xl mb-2">🗑️</div>
            <div>Reset Data</div>
            <div className="text-xs mt-1 opacity-90">Clear all settlement data</div>
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`rounded-lg p-6 mb-8 ${
            status === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
            status === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
            'bg-blue-50 border-l-4 border-blue-500'
          }`}>
            <p className={`text-lg font-bold ${
              status === 'success' ? 'text-green-900' :
              status === 'error' ? 'text-red-900' :
              'text-blue-900'
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Data Display */}
        {initData && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Settlement Data Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Therapist Data */}
              <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-gray-900 mb-3">👥 Therapists</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {initData.therapist_count || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {initData.therapists_loaded ? '✅ Loaded' : '❌ Not Loaded'}
                </p>
              </div>

              {/* Company Data */}
              <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
                <h3 className="font-bold text-gray-900 mb-3">🏢 Companies</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {initData.company_count || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {initData.companies_loaded ? '✅ Loaded' : '❌ Not Loaded'}
                </p>
              </div>

              {/* Guide Data */}
              <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
                <h3 className="font-bold text-gray-900 mb-3">📖 Guides</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">
                  {initData.guide_count || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {initData.guides_loaded ? '✅ Loaded' : '❌ Not Loaded'}
                </p>
              </div>

              {/* Timestamp */}
              <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-500">
                <h3 className="font-bold text-gray-900 mb-3">⏰ Last Initialized</h3>
                <p className="text-sm text-gray-700 break-all">
                  {initData.last_initialized || 'N/A'}
                </p>
              </div>
            </div>

            {/* Raw JSON Display */}
            <div className="mt-6 bg-gray-100 rounded-lg p-4 overflow-auto max-h-96">
              <p className="text-xs font-bold text-gray-700 mb-2">JSON Response:</p>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                {JSON.stringify(initData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📚 How This Works</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">🔄 Initialize Data</h3>
              <p className="text-gray-700 text-sm">
                Loads mock settlement data from the backend API. This includes therapist settlements, company settlements, and settlement guides. Used for development and testing.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">📊 Check Status</h3>
              <p className="text-gray-700 text-sm">
                Shows the current state of settlement data (whether it's loaded and how many records exist). Helps verify data initialization status without making changes.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">🗑️ Reset Data</h3>
              <p className="text-gray-700 text-sm">
                Completely clears all settlement data from memory. This is useful for testing data initialization or cleaning up for a fresh start.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-900 text-sm">
                <span className="font-bold">Before App Store Launch:</span> All mock data will be replaced with real data from your database, and this initialization screen will be removed or restricted to authorized administrators only.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
