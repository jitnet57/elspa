'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store/store';

function BookingContent() {
  const searchParams = useSearchParams();
  const source = (searchParams.get('source') || 'web') as 'web' | 'kakao_channel' | 'facebook_messenger' | 'whatsapp' | 'other';
  const { addBooking, addNotification } = useStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    time: '',
    therapist: '',
    name: '',
    phone: '',
    memo: '',
  });

  const services = [
    { id: 'swedish', name: '스웨디시 마사지', duration: '60분', price: '80,000', icon: '💆‍♀️' },
    { id: 'thai', name: '타이 마사지', duration: '90분', price: '120,000', icon: '🧘' },
    { id: 'hotstone', name: '핫스톤 테라피', duration: '60분', price: '100,000', icon: '🔥' },
    { id: 'foot', name: '발 마사지', duration: '30분', price: '50,000', icon: '🦶' },
  ];

  const therapists = [
    { id: 1, name: 'Sarah', specialty: 'Swedish Massage', rating: 4.9 },
    { id: 2, name: 'Emma', specialty: 'Thai Massage', rating: 4.7 },
    { id: 3, name: 'Jessica', specialty: 'Hot Stone Therapy', rating: 4.8 },
    { id: 4, name: 'Amanda', specialty: 'Foot Massage', rating: 4.6 },
  ];

  const timeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00', '17:30', '18:00', '18:30', '19:00'];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const selectedService = services.find((s) => s.id === formData.service);
  const selectedTherapist = therapists.find((t) => t.id.toString() === formData.therapist);

  const sourceLabels = {
    web: '웹사이트',
    kakao_channel: '카카오톡 채널',
    facebook_messenger: 'Facebook Messenger',
    whatsapp: 'WhatsApp',
    other: '기타',
  };

  const handleBookingSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.service || !formData.date || !formData.time) {
      addNotification({
        type: 'error',
        message: '모든 필수 정보를 입력해주세요.',
        severity: 'error',
        isRead: false,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addBooking({
        customer_name: formData.name,
        phone: formData.phone,
        service_type: formData.service,
        service_minutes: parseInt(selectedService?.duration || '60'),
        scheduled_at: `${formData.date}T${formData.time}`,
        notes: formData.memo,
        source: source,
      });

      addNotification({
        type: 'success',
        message: `예약이 완료되었습니다! (예약번호: #${Math.random().toString(36).substr(2, 9).toUpperCase()})`,
        severity: 'success',
        isRead: false,
        action_url: '/customer/mypage',
      });

      setTimeout(() => {
        window.location.href = '/customer/mypage';
      }, 2000);
    } catch (error) {
      addNotification({
        type: 'error',
        message: '예약 처리 중 오류가 발생했습니다.',
        severity: 'error',
        isRead: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">예약하기</h1>
        <p className="text-lg text-gray-600 font-light">간단한 단계를 따라 예약을 완료해보세요</p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1">
            <div className={`h-2 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-stone-200'}`}></div>
            <p className="text-xs text-gray-600 mt-2 text-center font-light">{['서비스선택', '날짜&시간', '테라피스트', '확인'][s - 1]}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1단계: 서비스 선택</h2>
          <div className="space-y-4">
            {services.map((service) => (
              <label
                key={service.id}
                className={`flex items-center p-6 border rounded-lg cursor-pointer transition-all ${
                  formData.service === service.id
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-white border-stone-200 hover:border-orange-300'
                }`}
              >
                <input type="radio" name="service" value={service.id} checked={formData.service === service.id} onChange={handleChange} className="mr-4" />
                <span className="text-2xl mr-4">{service.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600 font-light">{service.duration}</p>
                </div>
                <p className="text-xl font-bold text-orange-600">₩{service.price}</p>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">2단계: 날짜 & 시간 선택</h2>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">예약 날짜</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-4">예약 시간</label>
            <div className="grid grid-cols-5 gap-2">
              {timeSlots.map((time) => (
                <button key={time} onClick={() => setFormData({ ...formData, time })} className={`py-2 rounded-lg font-medium transition-all ${formData.time === time ? 'bg-orange-500 text-white' : 'bg-stone-100 text-gray-900 hover:bg-stone-200'}`}>
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Therapist Selection */}
      {step === 3 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3단계: 테라피스트 선택</h2>
          <div className="space-y-4">
            {therapists.map((therapist) => (
              <label key={therapist.id} className={`flex items-center p-6 border rounded-lg cursor-pointer transition-all ${formData.therapist === therapist.id.toString() ? 'bg-orange-50 border-orange-500' : 'bg-white border-stone-200 hover:border-orange-300'}`}>
                <input type="radio" name="therapist" value={therapist.id} checked={formData.therapist === therapist.id.toString()} onChange={handleChange} className="mr-4" />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">{therapist.name}</p>
                  <p className="text-sm text-gray-600 font-light">{therapist.specialty}</p>
                </div>
                <span className="text-3xl">💆</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">4단계: 개인정보 입력</h2>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">이름 *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="성함을 입력해주세요" className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">전화번호 *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="010-0000-0000" className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">특별 요청사항</label>
            <textarea name="memo" value={formData.memo} onChange={handleChange} placeholder="알레르기나 특별한 요청사항이 있으신가요?" className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 resize-none h-24 font-light" ></textarea>
          </div>
          <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
            <h3 className="font-bold text-gray-900 mb-4">예약 정보</h3>
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-600 font-light">서비스:</span>
                <span className="font-semibold text-gray-900 ml-2">{selectedService?.name}</span>
              </p>
              <p>
                <span className="text-gray-600 font-light">날짜:</span>
                <span className="font-semibold text-gray-900 ml-2">{formData.date}</span>
              </p>
              <p>
                <span className="text-gray-600 font-light">시간:</span>
                <span className="font-semibold text-gray-900 ml-2">{formData.time}</span>
              </p>
              <p>
                <span className="text-gray-600 font-light">테라피스트:</span>
                <span className="font-semibold text-gray-900 ml-2">{selectedTherapist?.name}</span>
              </p>
              <p>
                <span className="text-gray-600 font-light">예약 출처:</span>
                <span className="font-semibold text-gray-900 ml-2">{sourceLabels[source]}</span>
              </p>
              <div className="border-t border-stone-300 pt-3 mt-3">
                <p className="flex justify-between font-bold text-gray-900">
                  <span>예약금:</span>
                  <span className="text-orange-600">₩{selectedService?.price}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button onClick={handlePrev} disabled={step === 1} className="px-6 py-3 bg-stone-200 text-gray-900 rounded-lg hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors">
          ← 이전
        </button>
        <button
          onClick={step === 4 ? handleBookingSubmit : handleNext}
          disabled={step === 4 && isSubmitting}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
        >
          {step === 4 ? (isSubmitting ? '처리 중...' : '예약 완료') : '다음 →'}
        </button>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto py-8">예약 페이지를 로딩하는 중입니다...</div>}>
      <BookingContent />
    </Suspense>
  );
}
