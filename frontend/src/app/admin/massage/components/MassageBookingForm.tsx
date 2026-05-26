'use client';

import React, { useState } from 'react';
import { Calendar, Clock, User, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { therapists, massageServices, therapyBeds } from '../mockData/bookingData';

interface BookingFormData {
  therapistId: string;
  serviceId: string;
  bedId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  notes: string;
}

export default function MassageBookingForm() {
  const [formData, setFormData] = useState<BookingFormData>({
    therapistId: therapists[0].id,
    serviceId: massageServices[0].id,
    bedId: therapyBeds[0].id,
    date: '2026-05-26',
    startTime: '10:00',
    endTime: '11:00',
    clientName: '',
    clientPhone: '',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedService = massageServices.find((s) => s.id === formData.serviceId);
  const selectedTherapist = therapists.find((t) => t.id === formData.therapistId);

  const handleServiceChange = (serviceId: string) => {
    const service = massageServices.find((s) => s.id === serviceId);
    if (service) {
      const startHour = parseInt(formData.startTime.split(':')[0]);
      const endHour = startHour + Math.floor(service.duration / 60);
      const endMin = (service.duration % 60).toString().padStart(2, '0');

      setFormData((prev) => ({
        ...prev,
        serviceId,
        endTime: `${endHour.toString().padStart(2, '0')}:${endMin}`,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = '고객명을 입력하세요';
    }
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = '전화번호를 입력하세요';
    } else if (!/^\d{3}-?\d{3,4}-?\d{4}/.test(formData.clientPhone)) {
      newErrors.clientPhone = '유효한 전화번호를 입력하세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setFormData({
        therapistId: therapists[0].id,
        serviceId: massageServices[0].id,
        bedId: therapyBeds[0].id,
        date: '2026-05-26',
        startTime: '10:00',
        endTime: '11:00',
        clientName: '',
        clientPhone: '',
        notes: '',
      });
    }
  };

  return (
    <div className="w-full md:w-1/3 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-on-surface">예약하기</h2>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          새 마사지 예약을 생성합니다
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          <div>
            <label className="block text-label-sm font-bold text-on-surface mb-2">
              서비스 선택
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {massageServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration}분) - ₱{service.price}
                </option>
              ))}
            </select>
          </div>

          {/* Therapist Selection */}
          <div>
            <label className="block text-label-sm font-bold text-on-surface mb-2">
              테라피스트 선택
            </label>
            <select
              value={formData.therapistId}
              onChange={(e) => setFormData((prev) => ({ ...prev, therapistId: e.target.value }))}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name} ({therapist.status}) - ⭐ {therapist.rating}
                </option>
              ))}
            </select>
            {selectedTherapist && (
              <div className="mt-2 p-3 bg-surface-container rounded-lg text-body-sm">
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedTherapist.specialties.map((spec, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-primary-container text-on-primary-container text-label-xs rounded-full font-bold">
                      {spec}
                    </span>
                  ))}
                </div>
                <p className="text-on-surface-variant text-label-xs">
                  경력 {selectedTherapist.experience}년
                </p>
              </div>
            )}
          </div>

          {/* Bed Selection */}
          <div>
            <label className="block text-label-sm font-bold text-on-surface mb-2">
              치료실 선택
            </label>
            <select
              value={formData.bedId}
              onChange={(e) => setFormData((prev) => ({ ...prev, bedId: e.target.value }))}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {therapyBeds.map((bed) => (
                <option key={bed.id} value={bed.id} disabled={bed.status !== 'available'}>
                  {bed.name} ({bed.status === 'available' ? '예약가능' : bed.status === 'occupied' ? '사용중' : '점검중'})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-bold text-on-surface mb-2">
                날짜
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface mb-2">
                시작 시간
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => {
                  const time = e.target.value;
                  const [hours, mins] = time.split(':');
                  const startHour = parseInt(hours);
                  const duration = selectedService?.duration || 60;
                  const endHour = startHour + Math.floor(duration / 60);
                  const endMin = (duration % 60).toString().padStart(2, '0');

                  setFormData((prev) => ({
                    ...prev,
                    startTime: time,
                    endTime: `${endHour.toString().padStart(2, '0')}:${endMin}`,
                  }));
                }}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Duration Display */}
          {selectedService && (
            <div className="p-3 bg-secondary-container rounded-lg">
              <div className="flex justify-between text-body-sm">
                <span className="text-on-secondary-container">소요 시간:</span>
                <span className="font-bold text-on-secondary-container">
                  {selectedService.duration}분 ({formData.startTime} - {formData.endTime})
                </span>
              </div>
            </div>
          )}

          {/* Client Info */}
          <div>
            <label className="block text-label-sm font-bold text-on-surface mb-2">
              고객명
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
              placeholder="예: 김철수"
              className={`w-full px-3 py-2 border rounded-lg text-body-sm focus:ring-2 focus:border-transparent outline-none transition ${
                errors.clientName
                  ? 'border-error focus:ring-error'
                  : 'border-outline-variant focus:ring-primary'
              }`}
            />
            {errors.clientName && (
              <p className="mt-1 text-label-xs text-error">{errors.clientName}</p>
            )}
          </div>

          <div>
            <label className="block text-label-sm font-bold text-on-surface mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))}
              placeholder="예: 010-1234-5678"
              className={`w-full px-3 py-2 border rounded-lg text-body-sm focus:ring-2 focus:border-transparent outline-none transition ${
                errors.clientPhone
                  ? 'border-error focus:ring-error'
                  : 'border-outline-variant focus:ring-primary'
              }`}
            />
            {errors.clientPhone && (
              <p className="mt-1 text-label-xs text-error">{errors.clientPhone}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-label-sm font-bold text-on-surface mb-2">
              특수사항 (선택)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="예: 첫 방문입니다"
              rows={3}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </form>
      </div>

      {/* Submit Button & Status */}
      <div className="px-4 py-4 border-t border-outline-variant bg-surface-container-low">
        {submitted && (
          <div className="mb-3 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} />
            <span className="text-label-sm font-bold">예약이 생성되었습니다!</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full h-11 bg-primary text-on-primary rounded-lg font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <Calendar size={18} />
          예약 확정
        </button>
        <p className="text-label-xs text-on-surface-variant text-center mt-3">
          예약 수수료: ₱{selectedService?.price || 0} + 10%
        </p>
      </div>
    </div>
  );
}
