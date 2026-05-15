'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/store';

interface Company {
  id: number;
  name: string;
  representative: string;
  phone: string;
  address: string;
  settlement_day: number;
  commission_rate: number;
  status: 'active' | 'inactive';
  created_at: string;
  gcash_number?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
}

const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'ABC여행사',
    representative: '김철수',
    phone: '02-1234-5678',
    address: '서울시 강남구 테헤란로 123',
    settlement_day: 20,
    commission_rate: 30,
    status: 'active',
    created_at: '2026-01-01',
    gcash_number: '09123456789',
    bank_name: '신한은행',
    bank_account: '110-123-456789',
    bank_holder: '김철수',
  },
  {
    id: 2,
    name: 'XYZ여행사',
    representative: '이영희',
    phone: '02-9876-5432',
    address: '서울시 서초구 서초대로 456',
    settlement_day: 5,
    commission_rate: 25,
    status: 'active',
    created_at: '2026-01-15',
    gcash_number: '09987654321',
    bank_name: '우리은행',
    bank_account: '220-456-789012',
    bank_holder: '이영희',
  },
  {
    id: 3,
    name: '글로벌투어',
    representative: '박민수',
    phone: '02-5555-6666',
    address: '서울시 마포구 중앙로 789',
    settlement_day: 15,
    commission_rate: 28,
    status: 'active',
    created_at: '2026-02-01',
    gcash_number: '09555666777',
    bank_name: '국민은행',
    bank_account: '330-789-012345',
    bank_holder: '박민수',
  },
];

export default function CompaniesPage() {
  const { companies, setCompanies, addCompany, updateCompany, deleteCompany } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({});

  // Mock 데이터 초기화
  if (companies.length === 0) {
    setCompanies(mockCompanies);
  }

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

  const handleSubmit = () => {
    if (!formData.name || !formData.representative || !formData.phone) {
      alert('필수 항목을 입력해주세요');
      return;
    }

    if (selectedCompany) {
      updateCompany(selectedCompany.id, formData);
      alert('업체 정보가 수정되었습니다');
    } else {
      const newCompany: Company = {
        id: Math.max(...companies.map(c => c.id), 0) + 1,
        name: formData.name!,
        representative: formData.representative!,
        phone: formData.phone!,
        address: formData.address || '',
        settlement_day: formData.settlement_day || 20,
        commission_rate: formData.commission_rate || 30,
        status: 'active',
        created_at: new Date().toISOString().split('T')[0],
        gcash_number: formData.gcash_number,
        bank_name: formData.bank_name,
        bank_account: formData.bank_account,
        bank_holder: formData.bank_holder,
      };
      addCompany(newCompany);
      alert('새로운 업체가 등록되었습니다');
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (confirm('이 업체를 삭제하시겠습니까?')) {
      deleteCompany(id);
      alert('업체가 삭제되었습니다');
    }
  };

  const guideCountByCompany = (companyId: number) => {
    // 현재는 0으로 표시, 나중에 가이드 데이터 통합 시 수정
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            🏢 업체 관리
          </h1>
          <p className="text-lg text-gray-600 font-light">
            여행사/마사지샵 정보 및 정산 설정
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="mb-8">
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all"
          >
            + 새 업체 등록
          </button>
        </div>

        {/* 업체 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              등록된 업체가 없습니다
            </div>
          ) : (
            companies.map(company => (
              <div
                key={company.id}
                className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{company.representative} 대표</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">정산일</span>
                    <span className="font-semibold">매월 {company.settlement_day}일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">기본 수수료</span>
                    <span className="font-semibold">{company.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">소속 가이드</span>
                    <span className="font-semibold">{guideCountByCompany(company.id)}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태</span>
                    <span className={`font-semibold ${company.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {company.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>

                {(company.gcash_number || company.bank_account) && (
                  <div className="bg-blue-50 rounded p-3 mb-4 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2">💳 결제 정보</p>
                    <div className="space-y-1 text-xs text-blue-800">
                      {company.gcash_number && <div>Gcash: {company.gcash_number}</div>}
                      {company.bank_name && (
                        <div>
                          {company.bank_name} {company.bank_account && `(${company.bank_account})`}
                        </div>
                      )}
                      {company.bank_holder && <div className="text-gray-700">예금주: {company.bank_holder}</div>}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(company)}
                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded transition-colors"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-sm rounded transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-8 w-full max-w-md max-h-96 overflow-y-auto border-2 border-blue-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCompany ? '업체 수정' : '새 업체 등록'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="업체명"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="대표명"
                  value={formData.representative || ''}
                  onChange={e => setFormData({ ...formData, representative: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="전화번호"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="주소"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">정산일 (일)</label>
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
                    <label className="block text-sm text-gray-600 mb-1">수수료율 (%)</label>
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
                  <p className="text-sm font-semibold text-gray-700 mb-3">💳 결제 정보</p>
                  <input
                    type="text"
                    placeholder="Gcash 계정번호"
                    value={formData.gcash_number || ''}
                    onChange={e => setFormData({ ...formData, gcash_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2"
                  />
                  <input
                    type="text"
                    placeholder="은행명"
                    value={formData.bank_name || ''}
                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2"
                  />
                  <input
                    type="text"
                    placeholder="계좌번호"
                    value={formData.bank_account || ''}
                    onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-2"
                  />
                  <input
                    type="text"
                    placeholder="예금주명"
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
                    취소
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
                  >
                    {selectedCompany ? '수정' : '등록'}
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
