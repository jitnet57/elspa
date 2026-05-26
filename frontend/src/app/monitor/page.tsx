'use client';

import { useState, useEffect } from 'react';

export default function MonitorPage() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [mockBeds] = useState([
    { id: 1, bed_number: 1, room_zone: 'Massage Room 1', status: 'available' },
    { id: 2, bed_number: 2, room_zone: 'Massage Room 1', status: 'in_service', customer_name: 'John Doe' },
    { id: 3, bed_number: 3, room_zone: 'Massage Room 1', status: 'available' },
    { id: 4, bed_number: 4, room_zone: 'Massage Room 1', status: 'cleaning' },
    { id: 5, bed_number: 5, room_zone: 'Massage Room 2', status: 'available' },
    { id: 6, bed_number: 6, room_zone: 'Massage Room 2', status: 'reserved', customer_name: 'Jane Smith' },
    { id: 7, bed_number: 7, room_zone: 'Massage Room 2', status: 'available' },
    { id: 8, bed_number: 8, room_zone: 'Massage Room 2', status: 'available' },
  ]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      available: 'bg-green-500 hover:bg-green-600',
      in_service: 'bg-blue-500 hover:bg-blue-600',
      reserved: 'bg-yellow-500 hover:bg-yellow-600',
      cleaning: 'bg-gray-500 hover:bg-gray-600',
    };
    return colors[status] || 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      available: '🟢 Available',
      in_service: '🔵 In Service',
      reserved: '🟠 Reserved',
      cleaning: '⚫ Cleaning',
    };
    return labels[status] || status;
  };

  const bedsByRoom = mockBeds.reduce((acc: { [key: string]: typeof mockBeds }, bed) => {
    if (!acc[bed.room_zone]) acc[bed.room_zone] = [];
    acc[bed.room_zone].push(bed);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🏥 Monitor Dashboard</h1>
        <p className="text-gray-400">Real-time Massage Beds & Therapist Status</p>
        <p className="text-gray-500 mt-2">Current Time: {currentTime}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-green-900 rounded-lg p-4">
          <div className="text-2xl font-bold">{mockBeds.filter(b => b.status === 'available').length}</div>
          <div className="text-green-300">Available Beds</div>
        </div>
        <div className="bg-blue-900 rounded-lg p-4">
          <div className="text-2xl font-bold">{mockBeds.filter(b => b.status === 'in_service').length}</div>
          <div className="text-blue-300">In Service</div>
        </div>
        <div className="bg-yellow-900 rounded-lg p-4">
          <div className="text-2xl font-bold">{mockBeds.filter(b => b.status === 'reserved').length}</div>
          <div className="text-yellow-300">Reserved</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold">{mockBeds.filter(b => b.status === 'cleaning').length}</div>
          <div className="text-gray-300">Cleaning</div>
        </div>
      </div>

      {/* Bed Rooms */}
      <div className="space-y-8">
        {Object.entries(bedsByRoom).map(([roomName, roomBeds]) => (
          <div key={roomName} className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{roomName}</h2>
            <div className="grid grid-cols-8 gap-3">
              {(roomBeds as typeof mockBeds).map((bed) => (
                <div
                  key={bed.id}
                  className={`${getStatusColor(
                    bed.status
                  )} rounded-lg p-4 cursor-pointer transition-all hover:scale-105 text-center`}
                >
                  <div className="font-bold text-lg">Bed {bed.bed_number}</div>
                  <div className="text-sm mt-2">{getStatusLabel(bed.status)}</div>
                  {bed.customer_name && (
                    <div className="text-xs mt-1 font-semibold">{bed.customer_name}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info Message */}
      <div className="mt-8 bg-blue-900 rounded-lg p-4 text-blue-200">
        <p>✅ Monitor Dashboard is now working!</p>
        <p className="text-sm mt-2">
          Note: This is a temporary simplified version. Full features with real-time polling will be restored soon.
        </p>
      </div>
    </div>
  );
}
