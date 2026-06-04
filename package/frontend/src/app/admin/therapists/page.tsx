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
  gcash_number?: string;
  bank_name?: string;
  bank_account?: string;
}

// 60 Philippine English names for therapists
const THERAPIST_NAMES = [
  'Maria Santos', 'Jose Garcia', 'Carmen Reyes', 'Antonio Flores', 'Rosa Cruz',
  'Francisco Rodriguez', 'Ana Maria', 'Juan Santos', 'Luz Garcia', 'Miguel Mendoza',
  'Jennifer Cruz', 'Michael Santos', 'Mary Ann Garcia', 'Christopher Reyes', 'Patricia Flores',
  'Robert Santos', 'Linda Rodriguez', 'James Garcia', 'Margaret Cruz', 'David Mendoza',
  'Angela Reyes', 'John Santos', 'Theresa Flores', 'Peter Garcia', 'Gloria Rodriguez',
  'Paul Mendoza', 'Irene Cruz', 'Mark Santos', 'Deborah Reyes', 'Steven Flores',
  'Nancy Garcia', 'Kevin Santos', 'Lisa Rodriguez', 'Brian Mendoza', 'Donna Cruz',
  'Edward Reyes', 'Michelle Santos', 'Ronald Flores', 'Dorothy Garcia', 'Timothy Rodriguez',
  'Elizabeth Mendoza', 'Jason Cruz', 'Barbara Santos', 'Jeffrey Reyes', 'Maria Elena Flores',
  'Ryan Garcia', 'Susan Rodriguez', 'Jacob Santos', 'Carol Mendoza', 'Gary Cruz',
  'Sarah Reyes', 'Nicholas Flores', 'Jessica Garcia', 'Eric Rodriguez', 'Karen Santos',
  'Jonathan Mendoza', 'Stephen Cruz', 'Betty Flores', 'Larry Garcia', 'Helen Reyes',
];

const SPECIALTIES = [
  'Swedish Massage', 'Thai Massage', 'Hot Stone Therapy', 'Foot Reflexology',
  'Aromatherapy', 'Deep Tissue Massage', 'Sports Massage', 'Shiatsu',
];

// Generate 60 therapists with realistic data
const generateMockTherapists = (): Therapist[] => {
  return THERAPIST_NAMES.map((name, index) => {
    const id = index + 1;
    const specialty = SPECIALTIES[id % SPECIALTIES.length];
    const isCheckedIn = true; // All 60 therapists checked in for testing
    const totalClients = 30 + Math.floor(Math.random() * 30);
    const rating = 4.5 + Math.random() * 0.5;
    const totalRevenue = `₱${(totalClients * (2000 + Math.random() * 1500)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    const areaCode = '+63' + (900 + Math.floor(Math.random() * 100));
    const phone = `${areaCode}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    return {
      id,
      name,
      specialty,
      status: 'checked_in', // All therapists checked in
      rating: Math.round(rating * 10) / 10,
      totalClients,
      totalRevenue,
      commissionRate: 30 + Math.floor(Math.random() * 12),
      checkedInAt: `${8 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM`,
      phone,
      email: `${name.toLowerCase().replace(' ', '.')}@elspa.com`,
    };
  });
};

const mockTherapists: Therapist[] = generateMockTherapists();

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>(mockTherapists);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'checked_out'>('all');
  const [formData, setFormData] = useState<Partial<Therapist>>({});

  const checkedInCount = therapists.filter(t => t.status === 'checked_in').length;
  const checkedOutCount = therapists.filter(t => t.status === 'checked_out').length;

  const filteredTherapists = therapists.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

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

  const handleAddTherapist = () => {
    if (!formData.name || !formData.specialty || !formData.phone || !formData.email) {
      alert('Please enter all required information');
      return;
    }
    const newTherapist: Therapist = {
      id: Math.max(...therapists.map(t => t.id), 0) + 1,
      name: formData.name,
      specialty: formData.specialty,
      status: 'checked_out',
      rating: 4.5,
      totalClients: 0,
      totalRevenue: '₱0',
      commissionRate: 40,
      phone: formData.phone,
      email: formData.email,
      gcash_number: formData.gcash_number,
      bank_name: formData.bank_name,
      bank_account: formData.bank_account,
    };
    setTherapists([...therapists, newTherapist]);
    setShowModal(false);
    setFormData({});
    alert('Therapist registered successfully');
  };

  const openNewTherapistModal = () => {
    setSelectedTherapist(null);
    setFormData({});
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Top Fixed Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">👨‍⚕️ Therapists</h1>

        {/* Statistics Badges */}
        <div className="flex gap-3 mt-3">
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
            Working: {checkedInCount}
          </div>
          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
            Off Duty: {checkedOutCount}
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
            filterStatus === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('checked_in')}
          className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
            filterStatus === 'checked_in'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🟢 Working
        </button>
        <button
          onClick={() => setFilterStatus('checked_out')}
          className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
            filterStatus === 'checked_out'
              ? 'bg-gray-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ⚪ Off Duty
        </button>
      </div>

      {/* Therapist List */}
      <main className="px-4 py-4 pb-24">
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredTherapists.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No therapists found
            </div>
          ) : (
            filteredTherapists.map(therapist => (
              <div
                key={therapist.id}
                className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                {/* Top - Name, Status, Avatar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {therapist.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">{therapist.name}</h3>
                    <p className="text-sm text-gray-600">{therapist.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {therapist.status === 'checked_in' ? (
                        <>
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-xs font-bold text-green-600">Working</span>
                          {therapist.checkedInAt && (
                            <span className="text-xs text-gray-500">{therapist.checkedInAt}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
                          <span className="text-xs font-bold text-gray-600">Off Duty</span>
                          {therapist.checkedOutAt && (
                            <span className="text-xs text-gray-500">{therapist.checkedOutAt}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-lg font-bold text-yellow-600">{therapist.rating}★</div>
                    <div className="text-xs text-gray-500">{therapist.totalClients} clients</div>
                  </div>
                </div>

                {/* Center - Revenue Info */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-600 font-semibold">Monthly Revenue</div>
                      <div className="text-xl font-bold text-blue-600">{therapist.totalRevenue}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 font-semibold">Commission Rate</div>
                      <div className="text-xl font-bold text-orange-600">{therapist.commissionRate}%</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {therapist.status === 'checked_in' ? (
                    <button
                      onClick={() => handleCheckOut(therapist.id)}
                      className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all active:scale-95 text-sm"
                    >
                      🚪 Check Out
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(therapist.id)}
                      className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all active:scale-95 text-sm"
                    >
                      ✓ Check In
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTherapist(therapist);
                      setShowModal(true);
                    }}
                    className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 text-sm"
                  >
                    📋 Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          {filteredTherapists.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 border-2 border-gray-200">
              No therapists found
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Specialty</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Rating</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Clients</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Revenue</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Commission</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTherapists.map((therapist) => (
                    <tr key={therapist.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                            {therapist.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{therapist.name}</p>
                            <p className="text-xs text-gray-500">{therapist.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{therapist.specialty}</td>
                      <td className="px-6 py-4 text-center">
                        {therapist.status === 'checked_in' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            🟢 Working
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                            ⚪ Off Duty
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-yellow-600">{therapist.rating}★</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">{therapist.totalClients}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{therapist.totalRevenue}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-orange-600">{therapist.commissionRate}%</td>
                      <td className="px-6 py-4 text-center space-x-2">
                        {therapist.status === 'checked_in' ? (
                          <button
                            onClick={() => handleCheckOut(therapist.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-xs transition-all"
                          >
                            Check Out
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(therapist.id)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-xs transition-all"
                          >
                            Check In
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTherapist(therapist);
                            setShowModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-xs transition-all"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Register button (FAB) */}
      <button
        onClick={openNewTherapistModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:shadow-xl transition-all active:scale-95 z-50 font-bold"
      >
        +
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedTherapist ? 'Therapist Info' : 'Register New Therapist'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({});
                }}
                className="text-4xl text-gray-400 hover:text-gray-600 leading-none w-10 h-10 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {selectedTherapist ? (
                // View Details Mode
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                      {selectedTherapist.name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedTherapist.name}</h3>
                      <p className="text-lg text-gray-600">{selectedTherapist.specialty}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`mb-6 p-4 rounded-xl border-2 ${
                    selectedTherapist.status === 'checked_in'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-4 h-4 rounded-full ${
                        selectedTherapist.status === 'checked_in' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      <span className={`text-lg font-bold ${
                        selectedTherapist.status === 'checked_in' ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        {selectedTherapist.status === 'checked_in' ? 'Working' : 'Off Duty'}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        {selectedTherapist.checkedInAt || selectedTherapist.checkedOutAt}
                      </span>
                    </div>
                  </div>

                  {/* Information Section */}
                  <div className="space-y-4 mb-6">
                    <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                      <div className="text-sm text-yellow-700 font-semibold mb-1">Rating</div>
                      <div className="text-2xl font-bold text-yellow-900">{selectedTherapist.rating}★ ({selectedTherapist.totalClients})</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <div className="text-sm text-blue-700 font-semibold mb-1">Monthly Revenue</div>
                      <div className="text-2xl font-bold text-blue-900">{selectedTherapist.totalRevenue}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                      <div className="text-sm text-purple-700 font-semibold mb-1">Commission Rate</div>
                      <div className="text-2xl font-bold text-purple-900">{selectedTherapist.commissionRate}%</div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">📞</span>
                        <span className="text-gray-900">{selectedTherapist.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">📧</span>
                        <span className="text-gray-900 break-all">{selectedTherapist.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* GCash and Bank Account */}
                  {(selectedTherapist.gcash_number || selectedTherapist.bank_name) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Payment Information</h4>
                      <div className="space-y-2">
                        {selectedTherapist.gcash_number && (
                          <div className="p-3 bg-cyan-50 rounded-lg border-2 border-cyan-200">
                            <div className="text-sm text-cyan-700 font-semibold">💳 GCash</div>
                            <div className="text-lg font-bold text-cyan-900">{selectedTherapist.gcash_number}</div>
                          </div>
                        )}
                        {selectedTherapist.bank_name && (
                          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                            <div className="text-sm text-green-700 font-semibold">🏦 {selectedTherapist.bank_name}</div>
                            <div className="text-lg font-bold text-green-900">{selectedTherapist.bank_account}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-colors text-base"
                    >
                      Close
                    </button>
                    <button className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-base">
                      Edit
                    </button>
                  </div>
                </>
              ) : (
                // Registration Mode
                <>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 block">📋 Basic Information</label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Name *"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Specialty *"
                          value={formData.specialty || ''}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                        />
                        <input
                          type="tel"
                          placeholder="Phone *"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                        />
                        <input
                          type="email"
                          placeholder="Email *"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 block">💳 GCash Information (Optional)</label>
                      <input
                        type="text"
                        placeholder="GCash Number"
                        value={formData.gcash_number || ''}
                        onChange={(e) => setFormData({ ...formData, gcash_number: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 block">🏦 Bank Account Information (Optional)</label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Bank Name"
                          value={formData.bank_name || ''}
                          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Account Number"
                          value={formData.bank_account || ''}
                          onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setFormData({});
                      }}
                      className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-colors text-base"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddTherapist}
                      className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-base"
                    >
                      Register
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
