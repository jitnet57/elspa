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
      price: '₩80,000',
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
      price: '₩120,000',
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
      price: '₩100,000',
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
      price: '₩50,000',
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
      price: '₩180,000',
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
      price: '₩85,000',
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
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">서비스</h1>
        <p className="text-lg text-gray-600 font-light">ElSpa의 프리미엄 서비스를 만나보세요</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-6 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
              selectedCategory === category.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-gray-900 border border-stone-200 hover:border-orange-300'
            }`}
          >
            {category.label}
            <span className="ml-2 text-xs font-light">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:border-orange-200 transition-all"
          >
            {/* Service Image */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 h-36 flex items-center justify-center text-5xl">
              {service.icon}
            </div>

            {/* Service Content */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-500 mt-1 font-light">{service.duration}</p>

              <p className="text-sm text-gray-600 mb-4 mt-3 leading-relaxed font-light">{service.description}</p>

              {/* Benefits */}
              <div className="mb-4 space-y-1">
                {service.benefits.map((benefit, idx) => (
                  <p key={idx} className="text-xs text-gray-600 flex items-center gap-2 font-light">
                    <span className="text-orange-500 font-bold">✓</span>
                    {benefit}
                  </p>
                ))}
              </div>

              {/* Rating and Button */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">⭐ {service.rating}</span>
                  <span className="text-xs text-gray-500 font-light">({service.reviews})</span>
                </div>
                <p className="text-xl font-bold text-orange-600">{service.price}</p>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-sm font-semibold">
                예약하기
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">서비스 이용 안내</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-stone-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
            <p className="text-sm font-bold text-gray-900 mb-3">⏰ 영업시간</p>
            <p className="text-sm text-gray-600 font-light">평일 10:00 ~ 22:00</p>
            <p className="text-sm text-gray-600 font-light">주말 09:00 ~ 23:00</p>
          </div>
          <div className="border border-stone-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
            <p className="text-sm font-bold text-gray-900 mb-3">📍 위치</p>
            <p className="text-sm text-gray-600 font-light">서울시 강남구 테헤란로 123</p>
            <p className="text-sm text-gray-600 font-light">지하철 2호선 역삼역 5번 출구</p>
          </div>
          <div className="border border-stone-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
            <p className="text-sm font-bold text-gray-900 mb-3">💳 결제수단</p>
            <p className="text-sm text-gray-600 font-light">현금, 카드, 모바일</p>
            <p className="text-sm text-gray-600 font-light">회원 포인트 사용 가능</p>
          </div>
        </div>
      </div>
    </div>
  );
}
