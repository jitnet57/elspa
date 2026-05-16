'use client';

import { useEffect, useState } from 'react';
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/lib/LanguageContext';

interface Bed {
  id: number;
  bed_number: number;
  room_zone: string;
  status: 'available' | 'reserved' | 'in_service' | 'cleaning';
  customer_name?: string;
  therapist_name?: string;
  service_name?: string;
  starts_at?: string;
  ends_at?: string;
}

interface MobileBedCardProps {
  bed: Bed;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-600/20 border-green-500';
    case 'reserved':
      return 'bg-blue-600/20 border-blue-500';
    case 'in_service':
      return 'bg-purple-600/20 border-purple-500';
    case 'cleaning':
      return 'bg-orange-600/20 border-orange-500';
    default:
      return 'bg-gray-700/20 border-gray-600';
  }
};

export function MobileBedCard({ bed }: MobileBedCardProps) {
  const { language } = useLanguage();
  const [roomZoneLabel, setRoomZoneLabel] = useState<string>(bed.room_zone);

  useEffect(() => {
    // room_zone 번역
    const roomKey = bed.room_zone.toLowerCase().replace(' ', '_');
    const translated = getTranslation(language, `roomZones.${roomKey}`);
    setRoomZoneLabel(translated !== `roomZones.${roomKey}` ? translated : bed.room_zone);
  }, [bed.room_zone, language]);

  return (
    <div className={`border-l-4 p-4 rounded-r mb-3 ${getStatusColor(bed.status)}`}>
      {/* 헤더: 침대번호와 상태 */}
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-lg text-white">
          {roomZoneLabel} · {bed.bed_number}
        </div>
        <div className="text-xs font-bold text-gray-300">
          {getTranslation(language, `bedStatus.statusLabel.${bed.status}`)}
        </div>
      </div>

      {/* 상세 정보 */}
      {bed.status === 'in_service' && (
        <div className="space-y-1 text-sm text-gray-300">
          <div>
            <span className="text-gray-400">{getTranslation(language, 'labels.therapist')}:</span>{' '}
            <span className="font-semibold text-white">{bed.therapist_name}</span>
          </div>
          <div>
            <span className="text-gray-400">{getTranslation(language, 'labels.customer')}:</span>{' '}
            <span className="font-semibold text-white">{bed.customer_name}</span>
          </div>
          <div>
            <span className="text-gray-400">{getTranslation(language, 'labels.service')}:</span>{' '}
            <span className="text-white">{bed.service_name}</span>
          </div>
          <div>
            <span className="text-gray-400">{getTranslation(language, 'labels.time')}:</span>{' '}
            <span className="text-white">
              {bed.starts_at} ~ {bed.ends_at}
            </span>
          </div>
        </div>
      )}

      {bed.status === 'reserved' && (
        <div className="space-y-1 text-sm text-gray-300">
          <div>
            <span className="text-gray-400">{getTranslation(language, 'labels.customer')}:</span>{' '}
            <span className="font-semibold text-white">{bed.customer_name}</span>
          </div>
          <div>
            <span className="text-gray-400">{getTranslation(language, 'labels.reservationTime')}:</span>{' '}
            <span className="text-white">{bed.starts_at}</span>
          </div>
        </div>
      )}

      {bed.status === 'available' && (
        <div className="text-sm text-green-400 font-semibold">
          {getTranslation(language, 'bedStatus.immediatelyAvailable')}
        </div>
      )}

      {bed.status === 'cleaning' && (
        <div className="text-sm text-orange-400 font-semibold">
          {getTranslation(language, 'bedStatus.cleaning_in_progress')}
        </div>
      )}
    </div>
  );
}
