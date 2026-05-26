'use client';

import React, { useState } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { therapists, bookings, massageServices } from '../mockData/bookingData';

interface TimeBlock {
  hour: number;
  label: string;
}

interface TherapistBlock {
  therapistId: string;
  therapistName: string;
  blocks: { hour: number; booking?: typeof bookings[0] }[];
}

export default function TherapistScheduleGantt() {
  const [selectedDate, setSelectedDate] = useState('2026-05-26');

  // 시간대 블록 생성 (08:00 - 18:00)
  const timeBlocks: TimeBlock[] = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i;
    const label = `${hour.toString().padStart(2, '0')}:00`;
    return { hour, label };
  });

  // 각 테라피스트별 스케줄 생성
  const therapistSchedules: TherapistBlock[] = therapists.map((therapist) => {
    const blocks = timeBlocks.map((block) => {
      const booking = bookings.find(
        (b) =>
          b.therapistId === therapist.id &&
          parseInt(b.startTime.split(':')[0]) === block.hour &&
          b.date === selectedDate
      );
      return { hour: block.hour, booking };
    });

    return {
      therapistId: therapist.id,
      therapistName: therapist.name,
      blocks,
    };
  });

  const getServiceName = (serviceId: string) => {
    const service = massageServices.find((s) => s.id === serviceId);
    return service?.name || 'Unknown';
  };

  const getServiceColor = (serviceId: string) => {
    const colors: Record<string, string> = {
      'SVC-001': 'bg-purple-500', // Thai Massage
      'SVC-002': 'bg-blue-500',   // Swedish
      'SVC-003': 'bg-red-500',    // Deep Tissue
      'SVC-004': 'bg-amber-500',  // Foot
      'SVC-005': 'bg-pink-500',   // Facial
      'SVC-006': 'bg-cyan-500',   // Aromatherapy
      'SVC-007': 'bg-orange-500', // Hot Stone
    };
    return colors[serviceId] || 'bg-gray-500';
  };

  return (
    <div className="w-full md:w-1/3 bg-white border-r border-outline-variant flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-on-surface">테라피스트 일정</h2>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto">
        {/* Time Header */}
        <div className="sticky top-0 z-10 bg-surface-container border-b border-outline-variant">
          <div className="flex">
            <div className="w-32 flex-shrink-0 px-3 py-2 border-r border-outline-variant">
              <p className="text-label-xs font-bold text-on-surface-variant uppercase">Therapist</p>
            </div>
            <div className="flex">
              {timeBlocks.map((block) => (
                <div
                  key={block.hour}
                  className="w-16 flex-shrink-0 px-2 py-2 border-r border-outline-variant text-center"
                >
                  <p className="text-label-xs font-bold text-on-surface-variant">{block.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Therapist Rows */}
        <div>
          {therapistSchedules.map((schedule, idx) => (
            <div
              key={schedule.therapistId}
              className={`flex border-b border-outline-variant ${idx % 2 === 0 ? 'bg-white' : 'bg-surface'}`}
            >
              {/* Therapist Name */}
              <div className="w-32 flex-shrink-0 px-3 py-3 border-r border-outline-variant">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-secondary">
                    {therapists.find((t) => t.id === schedule.therapistId)?.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-sm font-bold text-on-surface truncate">
                      {schedule.therapistName.split(' ')[0]}
                    </p>
                    <p className="text-label-xs text-on-surface-variant">
                      {therapists.find((t) => t.id === schedule.therapistId)?.rating} ⭐
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Blocks */}
              <div className="flex flex-1">
                {schedule.blocks.map((block, blockIdx) => (
                  <div
                    key={`${schedule.therapistId}-${block.hour}`}
                    className="w-16 flex-shrink-0 px-2 py-2 border-r border-outline-variant relative min-h-20"
                  >
                    {block.booking ? (
                      <div
                        className={`${getServiceColor(block.booking.serviceId)} text-white rounded-lg p-1 text-center text-xs font-bold cursor-pointer hover:opacity-90 transition absolute inset-1`}
                        title={`${block.booking.clientName} - ${getServiceName(block.booking.serviceId)}`}
                      >
                        <p className="truncate">{block.booking.clientName.split(' ')[0]}</p>
                      </div>
                    ) : therapists.find((t) => t.id === schedule.therapistId)?.status === 'available' ? (
                      <div className="h-full border-2 border-dashed border-green-300 rounded-lg" />
                    ) : therapists.find((t) => t.id === schedule.therapistId)?.status === 'busy' ? (
                      <div className="h-full bg-gray-100 rounded-lg" />
                    ) : (
                      <div className="h-full bg-gray-50 rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant text-label-xs text-on-surface-variant">
        <p className="font-bold mb-2">범례:</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>예약가능</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>바쁜중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>예약됨</span>
          </div>
        </div>
      </div>
    </div>
  );
}
