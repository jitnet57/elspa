'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/store';
import * as XLSX from 'xlsx';

interface Therapist {
  id: number;
  name: string;
  status: 'checked_in' | 'idle' | 'in_service' | 'resting' | 'checked_out';
  checked_in_at?: string;
  checked_out_at?: string;
  rating: number;
  specialty: string;
  sessions_today: number;
  revenue_today: number;
  commission_rate: number;
  total_commission: number;
  image_url?: string;
  avatar_color: string;
}

const mockTherapists: Therapist[] = [
  { id: 1, name: 'Sarah', status: 'in_service', checked_in_at: '09:05', rating: 4.9, specialty: 'Swedish Massage', sessions_today: 4, revenue_today: 320000, commission_rate: 30, total_commission: 96000, avatar_color: 'from-orange-400 to-orange-600' },
  { id: 2, name: 'Emma', status: 'in_service', checked_in_at: '09:15', rating: 4.7, specialty: 'Thai Massage', sessions_today: 3, revenue_today: 360000, commission_rate: 30, total_commission: 108000, avatar_color: 'from-pink-400 to-pink-600' },
  { id: 3, name: 'Jessica', status: 'idle', checked_in_at: '09:30', rating: 4.8, specialty: 'Hot Stone', sessions_today: 2, revenue_today: 200000, commission_rate: 30, total_commission: 60000, avatar_color: 'from-amber-400 to-amber-600' },
  { id: 4, name: 'Amanda', status: 'resting', checked_in_at: '09:45', rating: 4.6, specialty: 'Foot Massage', sessions_today: 3, revenue_today: 150000, commission_rate: 30, total_commission: 45000, avatar_color: 'from-yellow-400 to-yellow-600' },
  { id: 5, name: 'Catherine', status: 'checked_out', checked_in_at: '08:00', checked_out_at: '17:00', rating: 4.7, specialty: 'Aromatherapy', sessions_today: 6, revenue_today: 270000, commission_rate: 30, total_commission: 81000, avatar_color: 'from-purple-400 to-purple-600' },
  { id: 6, name: 'Rachel', status: 'checked_out', rating: 4.8, specialty: 'General', sessions_today: 0, revenue_today: 0, commission_rate: 30, total_commission: 0, avatar_color: 'from-blue-400 to-blue-600' },
];

export default function TherapistManagementPage() {
  const [activeTab, setActiveTab] = useState<'manage' | 'register'>('manage');
  const [therapists, setTherapists] = useState<Therapist[]>(mockTherapists);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [newTherapist, setNewTherapist] = useState({
    name: '',
    specialty: '',
    rating: 4.5,
    avatar_color: 'from-blue-400 to-blue-600',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const { calculateMonthlySettlements, addNotification } = useStore();

  const handleRegisterTherapist = () => {
    if (!newTherapist.name || !newTherapist.specialty) {
      alert('이름과 전문분야를 입력해주세요');
      return;
    }
    const therapistId = Math.max(...therapists.map(t => t.id)) + 1;
    const newTherp: Therapist = {
      id: therapistId,
      name: newTherapist.name,
      specialty: newTherapist.specialty,
      rating: newTherapist.rating,
      status: 'checked_out',
      sessions_today: 0,
      revenue_today: 0,
      commission_rate: 30,
      total_commission: 0,
      avatar_color: newTherapist.avatar_color,
    };
    setTherapists([...therapists, newTherp]);
    addNotification({
      type: 'success',
      message: `${newTherapist.name} 테라피스트가 등록되었습니다.`,
      severity: 'success',
      isRead: false,
    });
    setNewTherapist({ name: '', specialty: '', rating: 4.5, avatar_color: 'from-blue-400 to-blue-600' });
    setActiveTab('manage');
  };

  const handleCheckIn = (therapistId: number) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setTherapists(prev => prev.map(t =>
      t.id === therapistId ? { ...t, status: 'idle', checked_in_at: now } : t
    ));
  };

  const handleCheckOut = (therapistId: number) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setTherapists(prev => prev.map(t =>
      t.id === therapistId ? { ...t, status: 'checked_out', checked_out_at: now } : t
    ));
  };

  const handleBreak = (therapistId: number) => {
    setTherapists(prev => prev.map(t =>
      t.id === therapistId ? { ...t, status: 'resting' } : t
    ));
  };

  const handleDeleteTherapist = (therapistId: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setTherapists(prev => prev.filter(t => t.id !== therapistId));
      if (selectedTherapist?.id === therapistId) {
        setSelectedTherapist(null);
      }
      addNotification({
        type: 'success',
        message: '테라피스트가 삭제되었습니다.',
        severity: 'success',
        isRead: false,
      });
    }
  };

  const handleUpdateTherapist = () => {
    if (!editingTherapist || !editingTherapist.name || !editingTherapist.specialty) {
      alert('이름과 전문분야를 입력해주세요');
      return;
    }
    setTherapists(prev => prev.map(t =>
      t.id === editingTherapist.id ? editingTherapist : t
    ));
    setSelectedTherapist(editingTherapist);
    setIsEditModalOpen(false);
    addNotification({
      type: 'success',
      message: '테라피스트 정보가 업데이트되었습니다.',
      severity: 'success',
      isRead: false,
    });
  };

  const downloadExcel = () => {
    const data = therapists.map(t => ({
      ID: t.id,
      이름: t.name,
      상태: t.status,
      출근시간: t.checked_in_at || '-',
      퇴근시간: t.checked_out_at || '-',
      평점: t.rating,
      전문분야: t.specialty,
      세션수: t.sessions_today,
      일일수익: `₩${t.revenue_today.toLocaleString()}`,
      수수료율: `${t.commission_rate}%`,
      지급액: `₩${t.total_commission.toLocaleString()}`,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '테라피스트');

    ws['!cols'] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 6 },
      { wch: 15 },
      { wch: 8 },
      { wch: 12 },
      { wch: 8 },
      { wch: 12 },
    ];

    XLSX.writeFile(wb, `테라피스트_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const checkedInCount = therapists.filter(t => t.status !== 'checked_out').length;
  const idleCount = therapists.filter(t => t.status === 'idle').length;
  const inServiceCount = therapists.filter(t => t.status === 'in_service').length;
  const totalRevenue = therapists.reduce((sum, t) => sum + t.revenue_today, 0);
  const totalCommission = therapists.reduce((sum, t) => sum + t.total_commission, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
              💼 테라피스트 관리
            </h1>
            <button
              onClick={downloadExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm md:text-base whitespace-nowrap"
            >
              📊 엑셀 다운로드
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === 'manage'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 출근 관리
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ➕ 테라피스트 등록
            </button>
          </div>
        </div>

        {/* 주요 통계 (관리 탭에서만) */}
        {activeTab === 'manage' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">출근 테라피스트</div>
            <div className="text-3xl font-bold text-blue-600">{checkedInCount}</div>
            <div className="text-xs text-gray-500 mt-2">총 {therapists.length}명</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">대기 중</div>
            <div className="text-3xl font-bold text-green-600">{idleCount}</div>
            <div className="text-xs text-gray-500 mt-2">즉시 배정 가능</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">서비스중</div>
            <div className="text-3xl font-bold text-purple-600">{inServiceCount}</div>
            <div className="text-xs text-gray-500 mt-2">진행 중인 세션</div>
          </div>
        </div>
        )}

        {/* 메인 콘텐츠 - 관리 탭 */}
        {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 테라피스트 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 테라피스트 현황</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {therapists.map(therapist => (
                  <div
                    key={therapist.id}
                    onClick={() => setSelectedTherapist(therapist)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTherapist?.id === therapist.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-3">
                      {/* 프로필 사진 */}
                      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${therapist.avatar_color} flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}>
                        {therapist.name[0]}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-900">{therapist.name}</div>
                        <div className="text-sm text-gray-500 mb-2">{therapist.specialty}</div>
                        <div className="flex gap-2 items-center text-xs">
                          <span className="text-yellow-600">⭐ {therapist.rating}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{therapist.sessions_today}회 세션</span>
                        </div>
                      </div>

                      {/* 버튼 */}
                      <div className="flex gap-1 flex-shrink-0">
                        {therapist.status === 'checked_out' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(therapist.id);
                            }}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded font-bold"
                          >
                            출근
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBreak(therapist.id);
                              }}
                              className={`px-3 py-1 text-xs rounded font-bold ${
                                therapist.status === 'resting'
                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              휴식
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckOut(therapist.id);
                              }}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-bold"
                            >
                              퇴근
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTherapist(therapist);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-bold"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTherapist(therapist.id);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* 상태 및 수익 */}
                    <div className="grid grid-cols-4 gap-2 text-sm bg-gray-50 p-2 rounded">
                      <div>
                        <span className="text-gray-600 text-xs">상태</span>
                        <div className="font-bold text-gray-900 text-xs">
                          {therapist.status === 'checked_in' && '📋 출근'}
                          {therapist.status === 'idle' && '✅ 대기'}
                          {therapist.status === 'in_service' && '🔵 서비스'}
                          {therapist.status === 'resting' && '☕ 휴식'}
                          {therapist.status === 'checked_out' && '🚪 퇴근'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">수익</span>
                        <div className="font-bold text-green-600 text-sm">₩{(therapist.revenue_today / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">지급</span>
                        <div className="font-bold text-blue-600 text-sm">₩{(therapist.total_commission / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">매장</span>
                        <div className="font-bold text-purple-600 text-sm">₩{((therapist.revenue_today - therapist.total_commission) / 1000).toFixed(0)}K</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 상세 정보 + 대기 손님 */}
          <div className="space-y-8">
            {/* 테라피스트 상세 정보 */}
            {selectedTherapist && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">💰 정산 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">테라피스트</span>
                    <span className="font-bold">{selectedTherapist.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">세션 수</span>
                    <span className="font-bold">{selectedTherapist.sessions_today}회</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">일일 수익</span>
                    <span className="font-bold text-green-600">₩{selectedTherapist.revenue_today.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">수수료율</span>
                    <span className="font-bold">{selectedTherapist.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between py-2 bg-blue-50 px-2 rounded font-bold">
                    <span className="text-blue-900">지급액</span>
                    <span className="text-blue-600">₩{selectedTherapist.total_commission.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* 테라피스트 등록 탭 */}
        {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">➕ 새 테라피스트 등록</h2>

            <div className="space-y-6">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">테라피스트 이름 *</label>
                <input
                  type="text"
                  value={newTherapist.name}
                  onChange={(e) => setNewTherapist({ ...newTherapist, name: e.target.value })}
                  placeholder="예: Sarah, Emma, Jessica"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-light"
                />
              </div>

              {/* 전문분야 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">전문분야 *</label>
                <select
                  value={newTherapist.specialty}
                  onChange={(e) => setNewTherapist({ ...newTherapist, specialty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-light"
                >
                  <option value="">선택해주세요</option>
                  <option value="Swedish Massage">스웨디시 마사지</option>
                  <option value="Thai Massage">타이 마사지</option>
                  <option value="Hot Stone">핫스톤 테라피</option>
                  <option value="Foot Massage">발 마사지</option>
                  <option value="Aromatherapy">아로마테라피</option>
                  <option value="General">일반</option>
                </select>
              </div>

              {/* 평점 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">초기 평점</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={newTherapist.rating}
                  onChange={(e) => setNewTherapist({ ...newTherapist, rating: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-light"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setNewTherapist({ name: '', specialty: '', rating: 4.5, avatar_color: 'from-blue-400 to-blue-600' });
                    setActiveTab('manage');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRegisterTherapist}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 출근 순번 관리 (관리 탭에서만) */}
        {activeTab === 'manage' && (
        <div className="mt-8 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">⏱️ 워크인 배정 순번</h2>
          <div className="space-y-2">
            {therapists
              .filter(t => t.status !== 'checked_out' && t.checked_in_at)
              .sort((a, b) => (a.checked_in_at || '').localeCompare(b.checked_in_at || ''))
              .map((therapist, idx) => (
                <div key={therapist.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${therapist.avatar_color} flex items-center justify-center text-white font-bold text-sm`}>
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{therapist.name}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-300 text-gray-600">
                        {therapist.checked_in_at} 출근
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-600">
                        {therapist.specialty}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {therapist.status === 'idle' && '✅ 즉시 배정 가능'}
                      {therapist.status === 'in_service' && `🔵 서비스 중 (${therapist.sessions_today}회 완료)`}
                      {therapist.status === 'resting' && '☕ 휴식 중'}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500">수익</div>
                    <div className="font-bold text-green-600">₩{(therapist.revenue_today / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <p className="text-xs text-amber-900">
              💡 워크인 손님은 위 순서대로 자동 배정됩니다. 특정 테라피스트를 지정할 수도 있습니다.
            </p>
          </div>
        </div>
        )}

        {activeTab === 'manage' && (
        <div className="mt-8 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          {/* 일일 정산 요약 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 일일 정산 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">총 수익</div>
              <div className="text-4xl font-bold text-green-600">₩{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="text-center border-l border-r border-gray-200">
              <div className="text-sm text-gray-600 mb-2">총 지급액</div>
              <div className="text-4xl font-bold text-blue-600">₩{totalCommission.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">매장 수익</div>
              <div className="text-4xl font-bold text-purple-600">₩{(totalRevenue - totalCommission).toLocaleString()}</div>
            </div>
          </div>
        </div>
        )}

        {/* 월정산 미리보기 (관리 탭에서만) */}
        {activeTab === 'manage' && (
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border-2 border-indigo-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📅 월정산 미리보기</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const currentMonth = new Date().toISOString().slice(0, 7);
                  calculateMonthlySettlements(currentMonth);
                  addNotification({
                    type: 'settlement_ready',
                    message: `${currentMonth} 월정산이 수동으로 생성되었습니다.`,
                    severity: 'success',
                    isRead: false,
                    action_url: '/admin/monthly-settlement',
                  });
                  window.location.href = '/admin/monthly-settlement';
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                ⚙️ 정산 실행
              </button>
              <a
                href="/admin/monthly-settlement"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                상세 보기 →
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">현재월 누적 수익</div>
              <div className="text-3xl font-bold text-indigo-600">₩{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">
                {therapists.filter(t => t.status !== 'checked_out').length}명 활동 중
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">월정산 예상 지급액</div>
              <div className="text-3xl font-bold text-green-600">₩{(totalRevenue * 0.7).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">
                평균 30% 수수료 기준
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">월정산 예상 수수료</div>
              <div className="text-3xl font-bold text-red-600">₩{(totalRevenue * 0.3).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">
                총 수익의 30%
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">정산 상태</div>
              <div className="text-2xl font-bold text-yellow-600">미확정</div>
              <div className="text-xs text-gray-500 mt-2">
                월정산 페이지에서 확정 처리
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-xs text-blue-900">
              💡 월정산은 매월 정산일에 자동으로 계산됩니다. 업체관리에서 각 업체의 정산일과 수수료율을 설정하세요.
            </p>
          </div>
        </div>
        )}

        {/* 수정 모달 */}
        {isEditModalOpen && editingTherapist && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">테라피스트 수정</h2>

              <div className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">이름</label>
                  <input
                    type="text"
                    value={editingTherapist.name}
                    onChange={(e) => setEditingTherapist({ ...editingTherapist, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 전문분야 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">전문분야</label>
                  <select
                    value={editingTherapist.specialty}
                    onChange={(e) => setEditingTherapist({ ...editingTherapist, specialty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">선택해주세요</option>
                    <option value="Swedish Massage">스웨디시 마사지</option>
                    <option value="Thai Massage">타이 마사지</option>
                    <option value="Hot Stone">핫스톤 테라피</option>
                    <option value="Foot Massage">발 마사지</option>
                    <option value="Aromatherapy">아로마테라피</option>
                    <option value="General">일반</option>
                  </select>
                </div>

                {/* 평점 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">평점</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={editingTherapist.rating}
                    onChange={(e) => setEditingTherapist({ ...editingTherapist, rating: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 수수료율 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">수수료율 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingTherapist.commission_rate}
                    onChange={(e) => setEditingTherapist({ ...editingTherapist, commission_rate: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdateTherapist}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    저장
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
