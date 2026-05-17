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
}

interface Guide {
  id: number;
  company_id: number;
  name: string;
  specialty: string;
  phone: string;
  bank_name: string;
  bank_account: string;
  commission_rate?: number;
  status: 'active' | 'inactive';
  created_at: string;
}

const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'ABC여행사',
    representative: '김철수',
    phone: '02-1234-5678',
    address: '서울시 강남구',
    settlement_day: 20,
    commission_rate: 30,
    status: 'active',
    created_at: '2026-01-01',
  },
  {
    id: 2,
    name: 'XYZ여행사',
    representative: '이영희',
    phone: '02-9876-5432',
    address: '서울시 서초구',
    settlement_day: 5,
    commission_rate: 25,
    status: 'active',
    created_at: '2026-01-15',
  },
  {
    id: 3,
    name: '글로벌투어',
    representative: '박민수',
    phone: '02-5555-6666',
    address: '서울시 마포구',
    settlement_day: 15,
    commission_rate: 28,
    status: 'active',
    created_at: '2026-02-01',
  },
];

const mockGuides: Guide[] = [
  {
    id: 1,
    company_id: 1,
    name: 'Sarah',
    specialty: 'Swedish Massage',
    phone: '010-1111-1111',
    bank_name: '국민은행',
    bank_account: '123-456-789',
    commission_rate: 30,
    status: 'active',
    created_at: '2026-01-05',
  },
  {
    id: 2,
    company_id: 1,
    name: 'Emma',
    specialty: 'Thai Massage',
    phone: '010-2222-2222',
    bank_name: '우리은행',
    bank_account: '987-654-321',
    status: 'active',
    created_at: '2026-01-10',
  },
  {
    id: 3,
    company_id: 1,
    name: 'Jessica',
    specialty: 'Hot Stone',
    phone: '010-3333-3333',
    bank_name: '하나은행',
    bank_account: '111-222-333',
    commission_rate: 30,
    status: 'active',
    created_at: '2026-01-15',
  },
  {
    id: 4,
    company_id: 2,
    name: 'Amanda',
    specialty: 'Foot Massage',
    phone: '010-4444-4444',
    bank_name: '국민은행',
    bank_account: '444-555-666',
    commission_rate: 25,
    status: 'active',
    created_at: '2026-01-20',
  },
  {
    id: 5,
    company_id: 2,
    name: 'Catherine',
    specialty: 'Aromatherapy',
    phone: '010-5555-5555',
    bank_name: '신한은행',
    bank_account: '777-888-999',
    status: 'active',
    created_at: '2026-02-01',
  },
  {
    id: 6,
    company_id: 3,
    name: 'Rachel',
    specialty: 'General',
    phone: '010-6666-6666',
    bank_name: '국민은행',
    bank_account: '101-202-303',
    commission_rate: 28,
    status: 'active',
    created_at: '2026-02-05',
  },
];

export default function GuidesPage() {
  const { guides, setGuides, addGuide, updateGuide, deleteGuide, companies, setCompanies } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Guide>>({});

  // Mock 데이터 초기화
  if (guides.length === 0) {
    setGuides(mockGuides);
  }
  if (companies.length === 0) {
    setCompanies(mockCompanies);
  }

  const filteredGuides = filterCompanyId
    ? guides.filter(g => g.company_id === filterCompanyId)
    : guides;

  const handleOpenModal = (guide?: Guide) => {
    if (guide) {
      setSelectedGuide(guide);
      setFormData(guide);
    } else {
      setSelectedGuide(null);
      setFormData({ company_id: filterCompanyId || 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGuide(null);
    setFormData({});
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.company_id || !formData.specialty || !formData.phone || !formData.bank_account) {
      alert('필수 항목을 입력해주세요');
      return;
    }

    if (selectedGuide) {
      updateGuide(selectedGuide.id, formData);
      alert('가이드 정보가 수정되었습니다');
    } else {
      const newGuide: Guide = {
        id: Math.max(...guides.map(g => g.id), 0) + 1,
        company_id: formData.company_id!,
        name: formData.name!,
        specialty: formData.specialty!,
        phone: formData.phone!,
        bank_name: formData.bank_name || '국민은행',
        bank_account: formData.bank_account!,
        commission_rate: formData.commission_rate,
        status: 'active',
        created_at: new Date().toISOString().split('T')[0],
      };
      addGuide(newGuide);
      alert('새로운 가이드가 등록되었습니다');
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (confirm('이 가이드를 삭제하시겠습니까?')) {
      deleteGuide(id);
      alert('가이드가 삭제되었습니다');
    }
  };

  const getCompanyName = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.name || '알 수 없음';
  };

  const getCompanyCommissionRate = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.commission_rate || 30;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            👤 가이드 관리
          </h1>
          <p className="text-lg text-gray-600 font-light">
            여행사별 가이드 정보 및 정산 설정
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all"
          >
            + 새 가이드 등록
          </button>

          {/* 필터 */}
          <div>
            <select
              value={filterCompanyId || ''}
              onChange={e => setFilterCompanyId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
            >
              <option value="">모든 업체</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 가이드 목록 */}
        <div className="space-y-4">
          {filteredGuides.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500">
              등록된 가이드가 없습니다
            </div>
          ) : (
            filteredGuides.map(guide => (
              <div
                key={guide.id}
                className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{guide.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {getCompanyName(guide.company_id)} • {guide.specialty}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      guide.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {guide.status === 'active' ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-600">전화</div>
                    <div className="text-sm font-semibold text-gray-900">{guide.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">계좌</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {guide.bank_name} {guide.bank_account}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">수수료율</div>
                    <div className="text-sm font-semibold text-blue-600">
                      {guide.commission_rate || getCompanyCommissionRate(guide.company_id)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">등록일</div>
                    <div className="text-sm font-semibold text-gray-900">{guide.created_at}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(guide)}
                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded transition-colors"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDelete(guide.id)}
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
                  {selectedGuide ? '가이드 수정' : '새 가이드 등록'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">업체</label>
                  <select
                    value={formData.company_id || 1}
                    onChange={e => setFormData({ ...formData, company_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="가이드명"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="전문분야"
                  value={formData.specialty || ''}
                  onChange={e => setFormData({ ...formData, specialty: e.target.value })}
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
                  placeholder="은행명"
                  value={formData.bank_name || '국민은행'}
                  onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="계좌번호"
                  value={formData.bank_account || ''}
                  onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    수수료율 (%) - 비워두면 업체 기본값 사용
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commission_rate || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        commission_rate: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
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
                    {selectedGuide ? '수정' : '등록'}
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
