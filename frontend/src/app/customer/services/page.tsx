'use client';

import { useState } from 'react';

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const services = [
    {
      id: 1,
      name: '스웨디시 마사지',
      category: 'massage',
      duration: '60분',
      price: '₱80,000',
      rating: 4.9,
      reviews: 245,
      description: '유럽식 전통 마사지로 혈액순환을 촉진하고 근육 이완을 돕습니다.',
      benefits: ['혈액순환 개선', '근육 이완', '스트레스 해소'],
      icon: '💆‍♀️',
    },
    {
      id: 2,
      name: '타이 마사지',
      category: 'massage',
      duration: '90분',
      price: '₱120,000',
      rating: 4.8,
      reviews: 189,
      description: '태국 전통 마사지로 유연성을 높이고 기력을 회복시킵니다.',
      benefits: ['유연성 증대', '기력 회복', '독소 제거'],
      icon: '🧘',
    },
    {
      id: 3,
      name: '핫스톤 테라피',
      category: 'therapy',
      duration: '60분',
      price: '₱100,000',
      rating: 4.7,
      reviews: 156,
      description: '온열 돌을 이용한 깊은 근육 이완 및 에너지 균형 치료.',
      benefits: ['깊은 근육 이완', '에너지 균형', '혈액순환'],
      icon: '🔥',
    },
    {
      id: 4,
      name: '발 마사지',
      category: 'massage',
      duration: '30분',
      price: '₱50,000',
      rating: 4.9,
      reviews: 312,
      description: '발의 반사 지압점을 자극하여 전신 건강을 개선합니다.',
      benefits: ['피로 회복', '혈액순환', '면역력 증진'],
      icon: '🦶',
    },
    {
      id: 5,
      name: '커플 패키지',
      category: 'package',
      duration: '120분',
      price: '₱180,000',
      rating: 5.0,
      reviews: 78,
      description: '두 분이 함께 받으실 수 있는 특별한 마사지 패키지입니다.',
      benefits: ['함께하는 힐링', '특별 할인', '프리미엄 서비스'],
      icon: '👫',
    },
    {
      id: 6,
      name: '아로마테라피',
      category: 'therapy',
      duration: '60분',
      price: '₱85,000',
      rating: 4.8,
      reviews: 201,
      description: '천연 에센셜 오일을 이용한 심신 안정 치료.',
      benefits: ['마음의 안정', '숙면 유도', '피부 건강'],
      icon: '🌸',
    },
  ];

  const filteredServices = selectedCategory === 'all' ? services : services.filter((s) => s.category === selectedCategory);

  const categories = [
    { id: 'all', label: '전체', count: services.length },
    { id: 'massage', label: '마사지', count: services.filter((s) => s.category === 'massage').length },
    { id: 'therapy', label: '테라피', count: services.filter((s) => s.category === 'therapy').length },
    { id: 'package', label: '패키지', count: services.filter((s) => s.category === 'package').length },
  ];

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Header - 모바일 최적화 */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">서비스</h1>
        <p className="text-base sm:text-lg text-gray-600 font-light">ElSpa의 프리미엄 서비스</p>
      </div>

      {/* Category Filter - 모바일 최적화 */}
      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 sm:px-6 py-2 rounded-full whitespace-nowrap font-medium text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 ${
              selectedCategory === category.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-gray-900 border border-stone-200 hover:border-orange-300'
            }`}
          >
            {category.label}
            <span className="ml-1 sm:ml-2 text-xs font-light">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Services Grid - 모바일 최적화 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg hover:border-orange-200 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            {/* Service Image */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 h-24 sm:h-32 md:h-36 flex items-center justify-center text-4xl sm:text-5xl">
              {service.icon}
            </div>

            {/* Service Content */}
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">{service.name}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-light">{service.duration}</p>

              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 mt-2 sm:mt-3 leading-relaxed font-light">{service.description}</p>

              {/* Benefits */}
              <div className="mb-3 sm:mb-4 space-y-1">
                {service.benefits.map((benefit, idx) => (
                  <p key={idx} className="text-xs text-gray-600 flex items-center gap-2 font-light">
                    <span className="text-orange-500 font-bold">✓</span>
                    {benefit}
                  </p>
                ))}
              </div>

              {/* Rating and Button */}
              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">⭐ {service.rating}</span>
                  <span className="text-xs text-gray-500 font-light">({service.reviews})</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-orange-600">{service.price}</p>
              </div>

              <button className="w-full mt-3 sm:mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-all text-xs sm:text-sm font-semibold hover:shadow-md">
                예약하기
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section - 모바일 최적화 */}
      <div className="bg-white rounded-2xl sm:rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">서비스 이용 안내</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="border border-stone-200 rounded-lg p-4 sm:p-6 hover:border-orange-300 hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
            <p className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">⏰ 영업시간</p>
            <p className="text-xs sm:text-sm text-gray-600 font-light">평일 10:00 ~ 22:00</p>
            <p className="text-xs sm:text-sm text-gray-600 font-light">주말 09:00 ~ 23:00</p>
          </div>
          <div className="border border-stone-200 rounded-lg p-4 sm:p-6 hover:border-orange-300 hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
            <p className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">📍 위치</p>
            <p className="text-xs sm:text-sm text-gray-600 font-light">서울시 강남구 테헤란로 123</p>
            <p className="text-xs sm:text-sm text-gray-600 font-light">지하철 2호선 역삼역 5번 출구</p>
          </div>
          <div className="border border-stone-200 rounded-lg p-4 sm:p-6 hover:border-orange-300 hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
            <p className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">💳 결제수단</p>
            <p className="text-xs sm:text-sm text-gray-600 font-light">현금, 카드, 모바일</p>
            <p className="text-xs sm:text-sm text-gray-600 font-light">회원 포인트 사용 가능</p>
          </div>
        </div>
      </div>
    </div>
  );
}

