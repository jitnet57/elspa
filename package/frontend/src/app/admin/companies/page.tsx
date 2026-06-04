'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Company,
  Guide,
  getCompanies,
  createCompany,
  updateCompany as apiUpdateCompany,
  deleteCompany as apiDeleteCompany,
  getGuides,
} from '@/lib/api/companies-client';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({});

  // ============================================================
  // 📌 loadData: Supabase에서 업체/가이드 목록 로드
  // ============================================================
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [companyRows, guideRows] = await Promise.all([
        getCompanies(),
        // 가이드 조회 실패해도 업체 목록은 표시되도록 (가이드 수는 부가정보)
        getGuides().catch(() => [] as Guide[]),
      ]);
      setCompanies(companyRows);
      setGuides(guideRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading companies');
      console.error('Company data query error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setSelectedCompany(company);
      setFormData(company);
    } else {
      setSelectedCompany(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
    setFormData({});
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.representative || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    const payload: Partial<Company> = {
      name: formData.name,
      representative: formData.representative,
      phone: formData.phone,
      address: formData.address || '',
      settlement_day: formData.settlement_day ?? 20,
      commission_rate: formData.commission_rate ?? 30,
      status: formData.status ?? 'active',
      gcash_number: formData.gcash_number,
      bank_name: formData.bank_name,
      bank_account: formData.bank_account,
      bank_holder: formData.bank_holder,
    };

    try {
      setSaving(true);
      if (selectedCompany) {
        await apiUpdateCompany(selectedCompany.id, payload);
        alert('Company information has been updated');
      } else {
        await createCompany(payload);
        alert('New company has been registered');
      }
      handleCloseModal();
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save company');
      console.error('Company save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await apiDeleteCompany(id);
      alert('Company has been deleted');
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete company');
      console.error('Company delete error:', err);
    }
  };

  const guideCountByCompany = (companyId: number) => {
    return guides.filter(g => g.company_id === companyId).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            🏢 Company Management
          </h1>
          <p className="text-base md:text-lg text-gray-600 font-light">
            Travel agency/massage shop information and settlement settings
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="mb-8">
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all"
          >
            + Register New Company
          </button>
        </div>

        {/* Company list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Loading data...
            </div>
          ) : companies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No registered companies
            </div>
          ) : (
            companies.map(company => (
              <div
                key={company.id}
                className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Representative: {company.representative}</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Settlement Day</span>
                    <span className="font-semibold">Every {company.settlement_day}th</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission Rate</span>
                    <span className="font-semibold">{company.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Affiliated Guides</span>
                    <span className="font-semibold">{guideCountByCompany(company.id)} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-semibold ${company.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {company.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {(company.gcash_number || company.bank_account) && (
                  <div className="bg-blue-50 rounded p-3 mb-4 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2">💳 Payment Info</p>
                    <div className="space-y-1 text-xs text-blue-800">
                      {company.gcash_number && <div>Gcash: {company.gcash_number}</div>}
                      {company.bank_name && (
                        <div>
                          {company.bank_name} {company.bank_account && `(${company.bank_account})`}
                        </div>
                      )}
                      {company.bank_holder && <div className="text-gray-700">Account Holder: {company.bank_holder}</div>}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(company)}
                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-sm rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-4 md:p-8 w-full max-w-md max-h-[80vh] overflow-y-auto border-2 border-blue-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCompany ? 'Edit Company' : 'Register New Company'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Representative Name"
                  value={formData.representative || ''}
                  onChange={e => setFormData({ ...formData, representative: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Settlement Day (Day)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.settlement_day || 20}
                      onChange={e => setFormData({ ...formData, settlement_day: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Commission Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.commission_rate || 30}
                      onChange={e => setFormData({ ...formData, commission_rate: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-3">💳 Payment Info</p>
                  <input
                    type="text"
                    placeholder="Gcash Account Number"
                    value={formData.gcash_number || ''}
                    onChange={e => setFormData({ ...formData, gcash_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={formData.bank_name || ''}
                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={formData.bank_account || ''}
                    onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={formData.bank_holder || ''}
                    onChange={e => setFormData({ ...formData, bank_holder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                  >
                    {saving ? 'Saving...' : selectedCompany ? 'Update' : 'Register'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
