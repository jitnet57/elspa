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
      message: `${newTherapist.name} therapist has been registered.`,
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
    if (confirm('Are you sure you want to delete this therapist?')) {
      setTherapists(prev => prev.filter(t => t.id !== therapistId));
      if (selectedTherapist?.id === therapistId) {
        setSelectedTherapist(null);
      }
      addNotification({
        type: 'success',
        message: 'Therapist has been deleted.',
        severity: 'success',
        isRead: false,
      });
    }
  };

  const handleUpdateTherapist = () => {
    if (!editingTherapist || !editingTherapist.name || !editingTherapist.specialty) {
      alert('Please enter name and specialty');
      return;
    }
    setTherapists(prev => prev.map(t =>
      t.id === editingTherapist.id ? editingTherapist : t
    ));
    setSelectedTherapist(editingTherapist);
    setIsEditModalOpen(false);
    addNotification({
      type: 'success',
      message: 'Therapist information has been updated.',
      severity: 'success',
      isRead: false,
    });
  };

  const downloadExcel = () => {
    const data = therapists.map(t => ({
      ID: t.id,
      Name: t.name,
      Status: t.status,
      CheckInTime: t.checked_in_at || '-',
      CheckOutTime: t.checked_out_at || '-',
      Rating: t.rating,
      Specialty: t.specialty,
      Sessions: t.sessions_today,
      DailyRevenue: `₱${t.revenue_today.toLocaleString()}`,
      CommissionRate: `${t.commission_rate}%`,
      PaymentAmount: `₱${t.total_commission.toLocaleString()}`,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Therapists');

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

    XLSX.writeFile(wb, `Therapists_${new Date().toISOString().split('T')[0]}.xlsx`);
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
              💼 Therapist Management
            </h1>
            <button
              onClick={downloadExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm md:text-base whitespace-nowrap"
            >
              📊 Download Excel
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
              👥 Check-in Management
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-3 font-semibold transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ➕ Register Therapist
            </button>
          </div>
        </div>

        {/* 주요 통계 (관리 탭에서만) */}
        {activeTab === 'manage' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">Checked In</div>
            <div className="text-3xl font-bold text-blue-600">{checkedInCount}</div>
            <div className="text-xs text-gray-500 mt-2">of {therapists.length}</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">Waiting</div>
            <div className="text-3xl font-bold text-green-600">{idleCount}</div>
            <div className="text-xs text-gray-500 mt-2">Ready for Assignment</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium mb-1">In Service</div>
            <div className="text-3xl font-bold text-purple-600">{inServiceCount}</div>
            <div className="text-xs text-gray-500 mt-2">Active Sessions</div>
          </div>
        </div>
        )}

        {/* 메인 콘텐츠 - 관리 탭 */}
        {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 테라피스트 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Therapist Status</h2>
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
                          <span className="text-gray-600">{therapist.sessions_today} sessions</span>
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
                            Check In
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
                              Break
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckOut(therapist.id);
                              }}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-bold"
                            >
                              Check Out
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
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTherapist(therapist.id);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* 상태 및 수익 */}
                    <div className="grid grid-cols-4 gap-2 text-sm bg-gray-50 p-2 rounded">
                      <div>
                        <span className="text-gray-600 text-xs">Status</span>
                        <div className="font-bold text-gray-900 text-xs">
                          {therapist.status === 'checked_in' && '📋 In'}
                          {therapist.status === 'idle' && '✅ Waiting'}
                          {therapist.status === 'in_service' && '🔵 Service'}
                          {therapist.status === 'resting' && '☕ Break'}
                          {therapist.status === 'checked_out' && '🚪 Out'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">Revenue</span>
                        <div className="font-bold text-green-600 text-sm">₱{(therapist.revenue_today / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">Payment</span>
                        <div className="font-bold text-blue-600 text-sm">₱{(therapist.total_commission / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs">Shop</span>
                        <div className="font-bold text-purple-600 text-sm">₱{((therapist.revenue_today - therapist.total_commission) / 1000).toFixed(0)}K</div>
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Settlement Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Therapist</span>
                    <span className="font-bold">{selectedTherapist.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-bold">{selectedTherapist.sessions_today}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Daily Revenue</span>
                    <span className="font-bold text-green-600">₱{selectedTherapist.revenue_today.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Commission Rate</span>
                    <span className="font-bold">{selectedTherapist.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between py-2 bg-blue-50 px-2 rounded font-bold">
                    <span className="text-blue-900">Payment Amount</span>
                    <span className="text-blue-600">₱{selectedTherapist.total_commission.toLocaleString()}</span>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">➕ Register New Therapist</h2>

            <div className="space-y-6">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Therapist Name *</label>
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
                <label className="block text-sm font-bold text-gray-900 mb-2">Specialty *</label>
                <select
                  value={newTherapist.specialty}
                  onChange={(e) => setNewTherapist({ ...newTherapist, specialty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-light"
                >
                  <option value="">Select</option>
                  <option value="Swedish Massage">Swedish Massage</option>
                  <option value="Thai Massage">Thai Massage</option>
                  <option value="Hot Stone">Hot Stone Therapy</option>
                  <option value="Foot Massage">Foot Massage</option>
                  <option value="Aromatherapy">Aromatherapy</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* 평점 */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Initial Rating</label>
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
                  Cancel
                </button>
                <button
                  onClick={handleRegisterTherapist}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Check-in Order Management (Management Tab Only) */}
        {activeTab === 'manage' && (
        <div className="mt-8 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">⏱️ Walk-in Assignment Queue</h2>
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
                        Check-in {therapist.checked_in_at}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-600">
                        {therapist.specialty}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {therapist.status === 'idle' && '✅ Ready for Assignment'}
                      {therapist.status === 'in_service' && `🔵 In Service (${therapist.sessions_today} completed)`}
                      {therapist.status === 'resting' && '☕ On Break'}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="font-bold text-green-600">₱{(therapist.revenue_today / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <p className="text-xs text-amber-900">
              💡 Walk-in customers are automatically assigned in the order above. You can specify a specific therapist if needed.
            </p>
          </div>
        </div>
        )}

        {activeTab === 'manage' && (
        <div className="mt-8 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          {/* 일일 정산 요약 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Daily Settlement Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
              <div className="text-4xl font-bold text-green-600">₱{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="text-center border-l border-r border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Total Payment</div>
              <div className="text-4xl font-bold text-blue-600">₱{totalCommission.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Shop Revenue</div>
              <div className="text-4xl font-bold text-purple-600">₱{(totalRevenue - totalCommission).toLocaleString()}</div>
            </div>
          </div>
        </div>
        )}

        {/* 월정산 미리보기 (관리 탭에서만) */}
        {activeTab === 'manage' && (
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border-2 border-indigo-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📅 Monthly Settlement Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const currentMonth = new Date().toISOString().slice(0, 7);
                  calculateMonthlySettlements(currentMonth);
                  addNotification({
                    type: 'settlement_ready',
                    message: `Monthly settlement for ${currentMonth} has been generated manually.`,
                    severity: 'success',
                    isRead: false,
                    action_url: '/admin/monthly-settlement',
                  });
                  window.location.href = '/admin/monthly-settlement';
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                ⚙️ Run Settlement
              </button>
              <a
                href="/admin/monthly-settlement"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                View Details →
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">Current Month Accumulated Revenue</div>
              <div className="text-3xl font-bold text-indigo-600">₱{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">
                {therapists.filter(t => t.status !== 'checked_out').length} therapists active
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">Expected Monthly Payment</div>
              <div className="text-3xl font-bold text-green-600">₱{(totalRevenue * 0.7).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">
                Based on 30% average commission
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">Expected Monthly Commission</div>
              <div className="text-3xl font-bold text-red-600">₱{(totalRevenue * 0.3).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">
                30% of total revenue
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-sm text-gray-600 mb-2">Settlement Status</div>
              <div className="text-2xl font-bold text-yellow-600">Pending</div>
              <div className="text-xs text-gray-500 mt-2">
                Confirm on settlement page
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-xs text-blue-900">
              💡 Monthly settlements are automatically calculated on the settlement date. Set the settlement date and commission rate for each company in company management.
            </p>
          </div>
        </div>
        )}

        {/* 수정 모달 */}
        {isEditModalOpen && editingTherapist && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Therapist</h2>

              <div className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Name</label>
                  <input
                    type="text"
                    value={editingTherapist.name}
                    onChange={(e) => setEditingTherapist({ ...editingTherapist, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 전문분야 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Specialty</label>
                  <select
                    value={editingTherapist.specialty}
                    onChange={(e) => setEditingTherapist({ ...editingTherapist, specialty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="Swedish Massage">Swedish Massage</option>
                    <option value="Thai Massage">Thai Massage</option>
                    <option value="Hot Stone">Hot Stone Therapy</option>
                    <option value="Foot Massage">Foot Massage</option>
                    <option value="Aromatherapy">Aromatherapy</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* 평점 */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Rating</label>
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
                  <label className="block text-sm font-bold text-gray-900 mb-2">Commission Rate (%)</label>
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
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTherapist}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Save
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

