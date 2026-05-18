'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store';

interface CompanyCommission {
  id: number;
  name: string;
  commission_rate: number;
  settlement_day: number;
}

interface GuideCommission {
  id: number;
  name: string;
  company_id: number;
  commission_rate?: number;
}

export default function CommissionSettingsPage() {
  const { commissionRates, updateCommissionRates, resetCommissionRates, companies, guides } = useStore();
  const [globalRates, setGlobalRates] = useState(commissionRates);
  const [companyRates, setCompanyRates] = useState<CompanyCommission[]>([]);
  const [guideRates, setGuideRates] = useState<GuideCommission[]>([]);
  const [activeTab, setActiveTab] = useState<'global' | 'company' | 'guide'>('global');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setGlobalRates(commissionRates);
  }, [commissionRates]);

  useEffect(() => {
    if (companies && companies.length > 0) {
      setCompanyRates(companies.map(c => ({
        id: c.id,
        name: c.name,
        commission_rate: c.commission_rate || commissionRates.platformFee,
        settlement_day: c.settlement_day || 5,
      })));
    }
  }, [companies, commissionRates]);

  useEffect(() => {
    if (guides && guides.length > 0) {
      setGuideRates(guides.map(g => ({
        id: g.id,
        name: g.name,
        company_id: g.company_id,
        commission_rate: g.commission_rate,
      })));
    }
  }, [guides]);

  const handleGlobalRateChange = (field: string, value: number) => {
    setGlobalRates(prev => ({
      ...prev,
      [field]: value,
    }));
    setIsSaved(false);
  };

  const handleCompanyRateChange = (companyId: number, rate: number) => {
    setCompanyRates(prev => prev.map(c => c.id === companyId ? { ...c, commission_rate: rate } : c));
    setIsSaved(false);
  };

  const handleGuideRateChange = (guideId: number, rate: number) => {
    setGuideRates(prev => prev.map(g => g.id === guideId ? { ...g, commission_rate: rate } : g));
    setIsSaved(false);
  };

  const saveGlobalRates = () => {
    updateCommissionRates(globalRates);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const saveAllRates = () => {
    updateCommissionRates(globalRates);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const resetRates = () => {
    if (confirm('Reset all commission rates to default?')) {
      resetCommissionRates();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 Commission Settings</h1>
              <p className="text-gray-600 mt-2">Manage global, company, and guide-level commission rates</p>
            </div>
            {isSaved && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ Settings saved successfully!
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-3 font-bold border-b-2 transition ${
              activeTab === 'global'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🌍 Global Rates
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-3 font-bold border-b-2 transition ${
              activeTab === 'company'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🏢 Company Rates
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-3 font-bold border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            👤 Guide Rates
          </button>
        </div>

        {/* Global Rates Tab */}
        {activeTab === 'global' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform-Wide Commission Rates</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Platform Fee */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Platform Fee (ELSPA Cut)
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalRates.platformFee}
                    onChange={e => handleGlobalRateChange('platformFee', parseFloat(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900"
                  />
                  <span className="text-xl font-bold text-gray-900">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Amount deducted from company revenue per session</p>
              </div>

              {/* Therapist Commission */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Therapist Base Commission
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalRates.therapistCommission}
                    onChange={e => handleGlobalRateChange('therapistCommission', parseFloat(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900"
                  />
                  <span className="text-xl font-bold text-gray-900">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Default therapist commission rate</p>
              </div>

              {/* Performance Bonus */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Performance Bonus (20+ sessions)
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalRates.performanceBonus}
                    onChange={e => handleGlobalRateChange('performanceBonus', parseFloat(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900"
                  />
                  <span className="text-xl font-bold text-gray-900">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Bonus for achieving 20+ sessions per month</p>
              </div>

              {/* Loyalty Bonus */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Loyalty Bonus
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalRates.loyaltyBonus}
                    onChange={e => handleGlobalRateChange('loyaltyBonus', parseFloat(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900"
                  />
                  <span className="text-xl font-bold text-gray-900">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Loyalty bonus for long-term therapists</p>
              </div>

              {/* Peak Season Bonus */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Peak Season Bonus
                </label>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalRates.peakSeasonBonus}
                    onChange={e => handleGlobalRateChange('peakSeasonBonus', parseFloat(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900"
                  />
                  <span className="text-xl font-bold text-gray-900">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Bonus during peak season (holidays, events)</p>
              </div>

              {/* Last Updated */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Last Updated
                </label>
                <p className="text-gray-900 font-mono text-sm">
                  {new Date(globalRates.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-indigo-900 mb-2">Settlement Formula</h3>
              <p className="text-sm text-indigo-800">
                Each therapist receives: <strong>Platform Fee</strong> (₱) removed, then <strong>Base Commission</strong> + bonuses applied
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={saveGlobalRates}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
              >
                💾 Save Global Rates
              </button>
              <button
                onClick={resetRates}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition"
              >
                🔄 Reset to Default
              </button>
            </div>
          </div>
        )}

        {/* Company Rates Tab */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Company-Level Rates</h2>
              <p className="text-gray-600 text-sm mt-1">Override global rates for specific companies</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Company Name</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Settlement Day</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Commission Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companyRates.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{company.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Day {company.settlement_day}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={company.commission_rate}
                          onChange={e => handleCompanyRateChange(company.id, parseFloat(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900 text-center"
                        />
                        <span className="ml-2 text-gray-600">%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={saveAllRates}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
              >
                💾 Save Company Rates
              </button>
            </div>
          </div>
        )}

        {/* Guide Rates Tab */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Guide-Level Rates</h2>
              <p className="text-gray-600 text-sm mt-1">Override company rates for specific guides (leave blank to use company default)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Guide Name</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Company</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Commission Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {guideRates.map((guide) => {
                    const company = companies?.find(c => c.id === guide.company_id);
                    return (
                      <tr key={guide.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{guide.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{company?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder={company?.commission_rate?.toString() || globalRates.platformFee.toString()}
                            value={guide.commission_rate || ''}
                            onChange={e => handleGuideRateChange(guide.id, e.target.value ? parseFloat(e.target.value) : 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900 text-center"
                          />
                          <span className="ml-2 text-gray-600">%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={saveAllRates}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
              >
                💾 Save Guide Rates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
