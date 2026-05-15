'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/store';
import { NotificationCenter } from '@/components/NotificationCenter';

interface ScheduleItem {
  therapistId: number;
  therapistName: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  customerName?: string;
  serviceType: string;
  status: 'in_service' | 'reserved' | 'break';
}

interface Therapist {
  id: number;
  name: string;
  status: 'idle' | 'in_service' | 'resting' | 'checked_out';
  specialty?: string;
  rating?: number;
  current_bed?: number;
  remaining_minutes?: number;
  checked_in_at?: string;
}

const mockTherapists: Therapist[] = [
  { id: 1, name: 'Anna', status: 'idle', specialty: 'Swedish', rating: 4.9, checked_in_at: '09:00' },
  { id: 2, name: 'Bella', status: 'in_service', specialty: 'Thai', rating: 4.8, current_bed: 2 },
  { id: 3, name: 'Cathy', status: 'in_service', specialty: 'Foot', rating: 4.7 },
  { id: 4, name: 'Daisy', status: 'resting', specialty: 'Hot Stone', rating: 4.6 },
  { id: 5, name: 'Ella', status: 'in_service', specialty: 'Aroma', rating: 4.8 },
  { id: 6, name: 'Fatima', status: 'idle', specialty: 'Swedish', rating: 4.9 },
  { id: 7, name: 'Gina', status: 'checked_out', specialty: 'General', rating: 4.5 },
  { id: 8, name: 'Hana', status: 'in_service', specialty: 'Thai', rating: 4.9 },
];

const mockSchedules: ScheduleItem[] = [
  { therapistId: 2, therapistName: 'Bella', startTime: '10:00', endTime: '12:00', serviceName: 'Swedish Massage', customerName: 'John', serviceType: 'swedish', status: 'in_service' },
  { therapistId: 3, therapistName: 'Cathy', startTime: '09:30', endTime: '11:30', serviceName: 'Foot Massage', customerName: 'Jane', serviceType: 'foot', status: 'in_service' },
  { therapistId: 2, therapistName: 'Bella', startTime: '12:30', endTime: '14:30', serviceName: 'Aromatherapy', customerName: 'Mike', serviceType: 'aroma', status: 'reserved' },
  { therapistId: 5, therapistName: 'Ella', startTime: '11:00', endTime: '13:00', serviceName: 'Thai Massage', customerName: 'Sarah', serviceType: 'thai', status: 'in_service' },
  { therapistId: 3, therapistName: 'Cathy', startTime: '12:00', endTime: '14:00', serviceName: 'Thai Massage', customerName: 'Tom', serviceType: 'thai', status: 'reserved' },
  { therapistId: 4, therapistName: 'Daisy', startTime: '09:00', endTime: '10:00', serviceName: 'Break', customerName: '', serviceType: 'break', status: 'break' },
  { therapistId: 5, therapistName: 'Ella', startTime: '13:30', endTime: '15:30', serviceName: 'Swedish Massage', customerName: 'Emma', serviceType: 'swedish', status: 'reserved' },
  { therapistId: 2, therapistName: 'Bella', startTime: '15:00', endTime: '17:00', serviceName: 'Hot Stone', customerName: 'David', serviceType: 'hotstone', status: 'reserved' },
  { therapistId: 8, therapistName: 'Hana', startTime: '13:00', endTime: '15:00', serviceName: 'Thai Massage', customerName: 'Lisa', serviceType: 'thai', status: 'reserved' },
  { therapistId: 8, therapistName: 'Hana', startTime: '15:30', endTime: '17:30', serviceName: 'Hot Stone', customerName: 'Mark', serviceType: 'hotstone', status: 'reserved' },
];

const massageTypes = [
  { name: 'Swedish Massage', icon: '💆', type: 'swedish' },
  { name: 'Thai Massage', icon: '🧘', type: 'thai' },
  { name: 'Aromatherapy Massage', icon: '🌸', type: 'aroma' },
  { name: 'Hot Stone Massage', icon: '🔥', type: 'hotstone' },
  { name: 'Foot Massage', icon: '🦶', type: 'foot' },
  { name: 'Others (Custom)', icon: '•••', type: 'custom' },
];

export default function MonitorPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedSession, setSelectedSession] = useState<ScheduleItem | null>(null);

  const hours = Array.from({ length: 13 }, (_, i) => i + 9);
  const therapistCount = mockTherapists.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-green-100 text-green-800';
      case 'in_service':
        return 'bg-blue-100 text-blue-800';
      case 'resting':
        return 'bg-orange-100 text-orange-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'idle':
        return '● Available';
      case 'in_service':
        return '◆ In Session';
      case 'resting':
        return '☕ Break';
      case 'checked_out':
        return '○ Off Duty';
      default:
        return status;
    }
  };

  const getScheduleColor = (serviceType: string) => {
    switch (serviceType) {
      case 'swedish':
        return 'bg-blue-200 border-blue-400';
      case 'thai':
        return 'bg-indigo-200 border-indigo-400';
      case 'aroma':
        return 'bg-pink-200 border-pink-400';
      case 'hotstone':
        return 'bg-orange-200 border-orange-400';
      case 'foot':
        return 'bg-sky-200 border-sky-400';
      case 'break':
        return 'bg-orange-100 border-orange-300';
      default:
        return 'bg-gray-200 border-gray-400';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: Record<string, string> = {
      swedish: '💆',
      thai: '🧘',
      hotstone: '🔥',
      foot: '🦶',
      aroma: '🌸',
    };
    return icons[serviceType] || '✋';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getTherapistSchedules = (therapistId: number) => {
    return mockSchedules.filter(s => s.therapistId === therapistId).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getSchedulePosition = (startTime: string): { left: number; width: number } => {
    const [hours, mins] = startTime.split(':').map(Number);
    const startHour = hours - 9;
    const leftPercent = (startHour + mins / 60) * (100 / 13);
    return {
      left: leftPercent,
      width: (100 / 13),
    };
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-56 bg-blue-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <span className="text-3xl">💆</span>
          <h1 className="text-xl font-bold">Therapist Schedule</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon="📊" label="Dashboard" active={true} />
          <NavItem icon="📅" label="Schedule" active={false} />
          <NavItem icon="👥" label="Therapists" active={false} />
          <NavItem icon="👤" label="Clients" active={false} />
          <NavItem icon="💇" label="Massage Types" active={false} />
          <NavItem icon="📋" label="Reports" active={false} />
          <NavItem icon="⚙️" label="Settings" active={false} />
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm transition-colors">
            🚪 Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Daily Therapist Schedule</h2>
            <div className="flex items-center gap-4">
              <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:border-gray-400">
                <option>English</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                👤 Receptionist
              </button>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-3 gap-6">
            <StepIndicator number={1} title="Select Date" description="View daily schedule by date." />
            <StepIndicator number={2} title="Daily Therapist Schedule" description="See who is working, their schedule, time, and massage type at a glance." />
            <StepIndicator number={3} title="Start New Massage" description="Select therapist, client and massage type to start a new session." />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          {/* Left: Date and Therapist List */}
          <div className="w-96 bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            {/* Date Picker */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded">←</button>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-300">
                  <span>📅</span>
                  <span className="font-semibold text-gray-700">{formatDate(selectedDate)} (Fri)</span>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded">→</button>
              </div>
            </div>

            {/* Therapist List */}
            <div className="flex-1 overflow-y-auto">
              <div className="text-sm font-semibold text-gray-700 mb-4">
                Therapists ({therapistCount})
              </div>
              <div className="space-y-2">
                {mockTherapists.map(therapist => (
                  <div
                    key={therapist.id}
                    onClick={() => setSelectedTherapist(therapist)}
                    className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
                      selectedTherapist?.id === therapist.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm">
                        {therapist.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{therapist.name}</div>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(therapist.status)}`}>
                          {getStatusBadge(therapist.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Schedule Grid */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col overflow-hidden">
            {/* Time Header */}
            <div className="mb-4">
              <div className="flex">
                <div className="w-32 flex-shrink-0" />
                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(13, minmax(0, 1fr))` }}>
                  {hours.map(hour => (
                    <div key={hour} className="text-xs font-semibold text-gray-600 text-center border-r border-gray-200">
                      {hour < 12 ? hour : hour === 12 ? '12' : hour - 12}:00
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule Rows */}
            <div className="flex-1 overflow-y-auto border-t border-gray-200">
              {mockTherapists.map(therapist => {
                const schedules = getTherapistSchedules(therapist.id);
                return (
                  <div key={therapist.id} className="flex border-b border-gray-200 relative min-h-24">
                    {/* Therapist Name */}
                    <div className="w-32 flex-shrink-0 p-3 border-r border-gray-200 bg-gray-50">
                      <div className="font-semibold text-sm text-gray-900">{therapist.name}</div>
                      <div className="text-xs text-gray-500">{therapist.specialty}</div>
                    </div>

                    {/* Time Slots */}
                    <div className="flex-1 relative grid" style={{ gridTemplateColumns: `repeat(13, minmax(0, 1fr))` }}>
                      {hours.map(hour => (
                        <div key={hour} className="border-r border-gray-100 relative" />
                      ))}

                      {/* Schedule Items */}
                      {schedules.map((schedule, idx) => {
                        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                        const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                        const startOffset = (startHour - 9) * 100 + (startMin / 60) * 100;
                        const duration = ((endHour - startHour) * 60 + (endMin - startMin)) / 60;
                        const width = (duration / 13) * 100;

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedSession(schedule)}
                            className={`absolute top-1 bottom-1 mx-1 rounded border-2 p-2 cursor-pointer hover:shadow-md transition-shadow ${getScheduleColor(schedule.serviceType)}`}
                            style={{
                              left: `${(startOffset / 13) * 100}%`,
                              width: `${width}%`,
                            }}
                          >
                            <div className="text-xs font-semibold text-gray-900 truncate">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            <div className="text-xs text-gray-700 truncate">{schedule.serviceName}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Details Panel */}
          <div className="w-80 flex flex-col gap-6">
            {/* Start New Massage Button */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                + Start New Massage
              </button>
            </div>

            {/* Massage Types */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 overflow-y-auto">
              <div className="text-lg font-bold text-gray-900 mb-4">
                ④ Massage Types
              </div>
              <div className="text-xs text-gray-600 mb-4">
                Select massage type when starting a new session.
              </div>
              <div className="grid grid-cols-2 gap-3">
                {massageTypes.map(type => (
                  <button
                    key={type.type}
                    className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs font-semibold text-gray-700">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 overflow-y-auto">
              <div className="text-lg font-bold text-gray-900 mb-4">
                ⑤ Session Details
              </div>
              <div className="text-xs text-gray-600 mb-4">
                Track ongoing or completed sessions with details.
              </div>

              {selectedSession ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Service</div>
                    <div className="font-semibold text-gray-900">{selectedSession.serviceName}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Time</div>
                    <div className="font-semibold text-gray-900">{selectedSession.startTime} - {selectedSession.endTime}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Client</div>
                    <div className="font-semibold text-gray-900">{selectedSession.customerName || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Status</div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      selectedSession.status === 'in_service' ? 'bg-blue-100 text-blue-800' :
                      selectedSession.status === 'reserved' ? 'bg-gray-200 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedSession.status === 'in_service' ? 'In Session' : selectedSession.status === 'reserved' ? 'Reserved' : 'Break'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">Select a session to view details</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">Current / Recent Sessions</div>
                <div className="space-y-2">
                  {mockSchedules.slice(0, 3).map((schedule, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSession(schedule)}
                      className="p-3 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getServiceIcon(schedule.serviceType)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">{schedule.customerName}</div>
                          <div className="text-xs text-gray-500 truncate">{schedule.serviceName}</div>
                          <div className="text-xs text-blue-600 font-medium">{schedule.startTime} - {schedule.endTime}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center text-blue-600 hover:text-blue-700 font-semibold text-sm py-2">
                    View All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-blue-700 text-white'
          : 'text-blue-100 hover:bg-blue-800'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StepIndicator({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  );
}
