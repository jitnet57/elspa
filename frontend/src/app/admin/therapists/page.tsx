'use client';

import { useState } from 'react';

interface Therapist {
  id: number;
  name: string;
  specialty: string;
  status: 'checked_in' | 'checked_out';
  rating: number;
  totalClients: number;
  totalRevenue: string;
  commissionRate: number;
  checkedInAt?: string;
  checkedOutAt?: string;
  phone: string;
  email: string;
}

const mockTherapists: Therapist[] = [
  {
    id: 1,
    name: 'Anna',
    specialty: 'Swedish Massage',
    status: 'checked_in',
    rating: 4.9,
    totalClients: 45,
    totalRevenue: '₩2,250,000',
    commissionRate: 40,
    checkedInAt: '09:00 AM',
    phone: '010-1234-5678',
    email: 'anna@elspa.com',
  },
  {
    id: 2,
    name: 'Bella',
    specialty: 'Thai Massage',
    status: 'checked_in',
    rating: 4.8,
    totalClients: 42,
    totalRevenue: '₩2,100,000',
    commissionRate: 40,
    checkedInAt: '09:15 AM',
    phone: '010-2345-6789',
    email: 'bella@elspa.com',
  },
  {
    id: 3,
    name: 'Cathy',
    specialty: 'Foot Massage',
    status: 'checked_in',
    rating: 4.7,
    totalClients: 38,
    totalRevenue: '₩1,900,000',
    commissionRate: 40,
    checkedInAt: '09:30 AM',
    phone: '010-3456-7890',
    email: 'cathy@elspa.com',
  },
  {
    id: 4,
    name: 'Daisy',
    specialty: 'Hot Stone',
    status: 'checked_out',
    rating: 4.6,
    totalClients: 35,
    totalRevenue: '₩1,750,000',
    commissionRate: 40,
    checkedOutAt: '17:00 PM',
    phone: '010-4567-8901',
    email: 'daisy@elspa.com',
  },
  {
    id: 5,
    name: 'Ella',
    specialty: 'Aromatherapy',
    status: 'checked_in',
    rating: 4.8,
    totalClients: 40,
    totalRevenue: '₩2,000,000',
    commissionRate: 40,
    checkedInAt: '09:45 AM',
    phone: '010-5678-9012',
    email: 'ella@elspa.com',
  },
  {
    id: 6,
    name: 'Fatima',
    specialty: 'Swedish Massage',
    status: 'checked_in',
    rating: 4.9,
    totalClients: 48,
    totalRevenue: '₩2,400,000',
    commissionRate: 40,
    checkedInAt: '08:45 AM',
    phone: '010-6789-0123',
    email: 'fatima@elspa.com',
  },
  {
    id: 7,
    name: 'Gina',
    specialty: 'General',
    status: 'checked_out',
    rating: 4.5,
    totalClients: 32,
    totalRevenue: '₩1,600,000',
    commissionRate: 40,
    checkedOutAt: '16:30 PM',
    phone: '010-7890-1234',
    email: 'gina@elspa.com',
  },
  {
    id: 8,
    name: 'Hana',
    specialty: 'Thai Massage',
    status: 'checked_in',
    rating: 4.9,
    totalClients: 46,
    totalRevenue: '₩2,300,000',
    commissionRate: 40,
    checkedInAt: '10:00 AM',
    phone: '010-8901-2345',
    email: 'hana@elspa.com',
  },
];

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>(mockTherapists);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTherapists = therapists.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckIn = (id: number) => {
    setTherapists(therapists.map(t =>
      t.id === id
        ? { ...t, status: 'checked_in', checkedInAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }
        : t
    ));
  };

  const handleCheckOut = (id: number) => {
    setTherapists(therapists.map(t =>
      t.id === id
        ? { ...t, status: 'checked_out', checkedOutAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) }
        : t
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 사이드바 */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-stone-100 to-stone-50 border-r border-stone-200 overflow-y-auto p-8 shadow-sm">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              💆
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">ELSPA</div>
          </div>
          <p className="text-xs text-gray-500 ml-10 font-light tracking-widest">MANAGEMENT SYSTEM</p>
        </div>

        <nav className="space-y-2 mb-8">
          <p className="text-xs font-bold text-gray-600 px-4 mb-3">👥 테라피스트</p>
          <a
            href="/admin/therapists"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-white text-gray-900 shadow-md border border-stone-200"
          >
            👨‍⚕️ 테라피스트 관리
          </a>
          <a
            href="/admin/matching"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-gray-600 hover:bg-white/50"
          >
            🎯 매칭 제어판
          </a>
          <a
            href="/monitor"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-gray-600 hover:bg-white/50"
          >
            📊 카운터 모니터
          </a>
        </nav>

        <div className="pt-8 border-t border-stone-200">
          <p className="text-xs text-gray-500 font-light">v 2.1.0</p>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="ml-72 p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
            👨‍⚕️ 테라피스트 관리
          </h1>
          <p className="text-sm text-gray-500 font-light">
            테라피스트의 출근/퇴근, 성과, 수익을 관리합니다
          </p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all">
            <div className="text-xs text-gray-500 mb-1 font-light">출근한 테라피스트</div>
            <div className="text-3xl font-bold text-gray-900">{therapists.filter(t => t.status === 'checked_in').length}</div>
            <div className="text-xs text-green-600 mt-2 font-light">✓ 활성 근무</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all">
            <div className="text-xs text-gray-500 mb-1 font-light">퇴근한 테라피스트</div>
            <div className="text-3xl font-bold text-gray-900">{therapists.filter(t => t.status === 'checked_out').length}</div>
            <div className="text-xs text-orange-600 mt-2 font-light">✓ 근무 완료</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all">
            <div className="text-xs text-gray-500 mb-1 font-light">평균 평점</div>
            <div className="text-3xl font-bold text-gray-900">
              {(therapists.reduce((sum, t) => sum + t.rating, 0) / therapists.length).toFixed(1)}★
            </div>
            <div className="text-xs text-blue-600 mt-2 font-light">✓ 우수 서비스</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all">
            <div className="text-xs text-gray-500 mb-1 font-light">총 매출</div>
            <div className="text-3xl font-bold text-gray-900">₩16.5M</div>
            <div className="text-xs text-purple-600 mt-2 font-light">✓ 월 집계</div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="테라피스트 이름 또는 전문분야 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            + 새 테라피스트
          </button>
        </div>

        {/* 테라피스트 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="grid grid-cols-7 gap-4 p-6 bg-gray-50 border-b border-stone-100 font-semibold text-sm text-gray-700">
            <div>이름</div>
            <div>전문분야</div>
            <div>평점</div>
            <div>총 고객</div>
            <div>월 매출</div>
            <div>상태</div>
            <div>작업</div>
          </div>

          <div className="divide-y divide-stone-100">
            {filteredTherapists.map(therapist => (
              <div key={therapist.id} className="grid grid-cols-7 gap-4 p-6 items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    {therapist.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{therapist.name}</div>
                    <div className="text-xs text-gray-500">{therapist.email}</div>
                  </div>
                </div>

                <div className="text-sm text-gray-700">{therapist.specialty}</div>

                <div className="text-sm font-bold text-gray-900">{therapist.rating}★</div>

                <div className="text-sm text-gray-700">{therapist.totalClients}명</div>

                <div className="text-sm font-semibold text-gray-900">{therapist.totalRevenue}</div>

                <div>
                  {therapist.status === 'checked_in' ? (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      ● 근무중
                      {therapist.checkedInAt && <span className="text-green-600 text-xs ml-1">({therapist.checkedInAt})</span>}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      ○ 퇴근
                      {therapist.checkedOutAt && <span className="text-gray-600 text-xs ml-1">({therapist.checkedOutAt})</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {therapist.status === 'checked_in' ? (
                    <button
                      onClick={() => handleCheckOut(therapist.id)}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded text-xs transition-colors"
                    >
                      퇴근
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(therapist.id)}
                      className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded text-xs transition-colors"
                    >
                      출근
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTherapist(therapist);
                      setShowModal(true);
                    }}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded text-xs transition-colors"
                  >
                    상세
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 상세 모달 */}
      {showModal && selectedTherapist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedTherapist.name[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedTherapist.name}</h3>
                  <p className="text-gray-600">{selectedTherapist.specialty}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-semibold">📞 전화</p>
                  <p className="text-gray-900 font-medium">{selectedTherapist.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-semibold">📧 이메일</p>
                  <p className="text-gray-900 font-medium">{selectedTherapist.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-semibold">⭐ 평점</p>
                  <p className="text-gray-900 font-bold text-lg">{selectedTherapist.rating}★</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-semibold">👥 총 고객</p>
                  <p className="text-gray-900 font-bold text-lg">{selectedTherapist.totalClients}명</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-semibold">💰 월 매출</p>
                  <p className="text-gray-900 font-bold text-lg">{selectedTherapist.totalRevenue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-semibold">📊 수수료율</p>
                  <p className="text-gray-900 font-bold text-lg">{selectedTherapist.commissionRate}%</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                닫기
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                정보 수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
