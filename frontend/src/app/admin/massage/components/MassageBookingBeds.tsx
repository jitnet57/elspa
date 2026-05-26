'use client';

import React, { useState } from 'react';
import { ChevronDown, MapPin, Users } from 'lucide-react';
import { therapyBeds } from '../mockData/bookingData';

const statusColors = {
  available: 'bg-green-100 text-green-700',
  occupied: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-gray-100 text-gray-700',
};

const typeColors = {
  massage: 'bg-purple-100 text-purple-700',
  spa: 'bg-cyan-100 text-cyan-700',
  facial: 'bg-pink-100 text-pink-700',
  premium: 'bg-amber-100 text-amber-700',
};

export default function MassageBookingBeds() {
  const [beds, setBeds] = useState(therapyBeds);
  const [filter, setFilter] = useState('All');

  const filteredBeds = filter === 'All' ? beds : beds.filter(b => b.status === filter.toLowerCase());

  return (
    <div className="w-full md:w-1/3 bg-white border-r border-outline-variant flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-on-surface">치료실</h2>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          {filteredBeds.length} / {beds.length} 사용 가능
        </p>
      </div>

      {/* Filter */}
      <div className="px-4 py-3 border-b border-outline-variant">
        <div className="flex gap-2 overflow-x-auto">
          {['All', 'Available', 'Occupied', 'Maintenance'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-label-sm font-bold whitespace-nowrap transition ${
                filter === status
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {status === 'All' ? '전체' : status === 'Available' ? '예약가능' : status === 'Occupied' ? '사용중' : '점검중'}
            </button>
          ))}
        </div>
      </div>

      {/* Beds List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-outline-variant">
          {filteredBeds.map((bed) => (
            <div
              key={bed.id}
              className="p-4 hover:bg-surface-container transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-body-md font-bold text-on-surface mb-1">{bed.name}</h3>
                  <p className="text-label-sm text-on-surface-variant">Room {bed.roomNumber}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-label-xs font-bold uppercase ${statusColors[bed.status]}`}>
                  {bed.status === 'available' ? '예약가능' : bed.status === 'occupied' ? '사용중' : '점검중'}
                </span>
              </div>

              {/* Type Badge */}
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-2 py-1 rounded-full text-label-xs font-bold uppercase ${typeColors[bed.type]}`}>
                  {bed.type === 'massage' ? '마사지' : bed.type === 'spa' ? '스파' : bed.type === 'facial' ? '페이셜' : '프리미엄'}
                </span>
                <div className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                  <Users size={14} />
                  <span>{bed.capacity}명</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant text-body-sm text-on-surface-variant">
        <div className="flex justify-between">
          <span>사용가능:</span>
          <span className="font-bold text-green-600">{beds.filter(b => b.status === 'available').length}</span>
        </div>
        <div className="flex justify-between">
          <span>사용중:</span>
          <span className="font-bold text-blue-600">{beds.filter(b => b.status === 'occupied').length}</span>
        </div>
      </div>
    </div>
  );
}
