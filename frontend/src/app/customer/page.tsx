'use client';

export default function CustomerHome() {
  const services = [
    { name: '스웨디시 마사지', duration: '60분', price: '₩80,000', rating: 4.9, reviews: 245, icon: '💆‍♀️' },
    { name: '타이 마사지', duration: '90분', price: '₩120,000', rating: 4.8, reviews: 189, icon: '🧘' },
    { name: '핫스톤 테라피', duration: '60분', price: '₩100,000', rating: 4.7, reviews: 156, icon: '🔥' },
    { name: '발 마사지', duration: '30분', price: '₩50,000', rating: 4.9, reviews: 312, icon: '🦶' },
    { name: '커플 패키지', duration: '120분', price: '₩180,000', rating: 5.0, reviews: 78, icon: '👫' },
    { name: '아로마테라피', duration: '60분', price: '₩85,000', rating: 4.8, reviews: 201, icon: '🌸' },
  ];

  const therapists = [
    { name: '박유진', specialty: '스웨디시 전문', experience: '7년', rating: 4.9, bookings: 156 },
    { name: '최정은', specialty: '타이 마사지', experience: '5년', rating: 4.7, bookings: 128 },
    { name: '이소영', specialty: '핫스톤 테라피', experience: '8년', rating: 4.8, bookings: 167 },
    { name: '김태희', specialty: '발 마사지', experience: '6년', rating: 4.6, bookings: 145 },
  ];

  const testimonials = [
    { name: '김민지', service: '스웨디시 마사지', text: '정말 편안한 경험이었어요. 다시 꼭 방문하겠습니다!', rating: 5 },
    { name: '이준호', service: '타이 마사지', text: '테라피스트가 전문적이고 친절했어요. 강력 추천합니다!', rating: 5 },
    { name: '박수진', service: '커플 패키지', text: '가격 대비 서비스가 정말 좋습니다. 이제 단골입니다!', rating: 5 },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-white rounded-xl p-12 shadow-sm border border-stone-100 overflow-hidden">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            당신의 웰니스<br />파트너, ElSpa
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
            프로페셔널 테라피스트들과 함께 몸과 마음을 힐링해보세요.
            최고의 시설과 서비스로 당신의 건강을 지켜드립니다.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold shadow-md">
              지금 예약하기
            </button>
            <button className="px-8 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all font-semibold">
              더 알아보기
            </button>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">인기 서비스</h2>
            <p className="text-sm text-gray-500 mt-2 font-light">엘스파의 프리미엄 서비스를 경험해보세요</p>
          </div>
          <a href="/customer/services" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            전체 보기 →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md hover:border-orange-200 transition-all"
            >
              {/* Service Header */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 h-32 flex items-center justify-center text-5xl">
                {service.icon}
              </div>

              {/* Service Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500 mt-1 font-light">{service.duration}</p>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">⭐ {service.rating}</span>
                    <span className="text-xs text-gray-500">({service.reviews})</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{service.price}</p>
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-sm font-semibold">
                  예약하기
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Therapists */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">저희 테라피스트</h2>
          <p className="text-sm text-gray-500 mt-2 font-light">경험 많은 전문가들이 당신을 맞이합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {therapists.map((therapist, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all"
            >
              <div className="w-full h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg mb-4 flex items-center justify-center text-4xl">
                💆
              </div>
              <h3 className="text-lg font-bold text-gray-900">{therapist.name}</h3>
              <p className="text-sm text-gray-600 mt-1 font-light">{therapist.specialty}</p>
              <p className="text-xs text-gray-500 mt-2 font-light">{therapist.experience} 경력</p>

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">⭐ {therapist.rating}</span>
                <span className="text-xs text-gray-500 font-light">{therapist.bookings} 예약</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white rounded-xl p-12 shadow-sm border border-stone-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">ElSpa를 선택하는 이유</h2>
        <p className="text-gray-600 mb-8 font-light">고객 만족이 우리의 최우선 목표입니다</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '✓', title: '전문 테라피스트', desc: '5년 이상 경력의\n검증된 전문가', stat: '4명' },
            { icon: '✓', title: '청결한 시설', desc: '매일 3회 이상\n소독 및 관리', stat: '100%' },
            { icon: '✓', title: '프리미엄 제품', desc: '100% 천연\n에센셜 오일', stat: 'A급' },
            { icon: '✓', title: '맞춤 서비스', desc: '개인 상담 후\n맞춤 세션', stat: '24시' },
          ].map((item, idx) => (
            <div key={idx} className="border border-stone-200 rounded-xl p-6 hover:border-orange-300 hover:bg-orange-50 transition-all">
              <div className="text-4xl mb-3">💚</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600 font-light whitespace-pre-line mb-3">{item.desc}</p>
              <p className="text-2xl font-bold text-orange-600">{item.stat}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">고객 후기</h2>
        <p className="text-gray-600 mb-8 font-light">실제 고객님들의 솔직한 경험담입니다</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 shadow-sm border border-stone-100"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-lg">⭐</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4 font-light">
                "{testimonial.text}"
              </p>
              <div className="border-t border-stone-100 pt-4">
                <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-xs text-gray-500 mt-1 font-light">{testimonial.service}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-12 shadow-lg text-center">
        <h2 className="text-3xl font-bold text-white mb-2">오늘 바로 예약하세요!</h2>
        <p className="text-orange-100 mb-8 text-lg font-light">첫 방문 고객 20% 할인</p>
        <button className="px-8 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-all font-semibold shadow-lg">
          지금 예약하기
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-gray-900 mb-2">ElSpa</h4>
            <p className="text-sm text-gray-600 font-light">당신의 웰니스 파트너</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">서비스</h4>
            <ul className="text-sm text-gray-600 space-y-2 font-light">
              <li><a href="/customer/booking" className="hover:text-orange-600 transition-colors">예약하기</a></li>
              <li><a href="/customer/services" className="hover:text-orange-600 transition-colors">서비스 안내</a></li>
              <li><a href="/customer/reviews" className="hover:text-orange-600 transition-colors">후기</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">회사</h4>
            <ul className="text-sm text-gray-600 space-y-2 font-light">
              <li><a href="#" className="hover:text-orange-600 transition-colors">소개</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">문의</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">채용</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">연락처</h4>
            <p className="text-sm text-gray-600 mb-1 font-light">📞 031-1234-5678</p>
            <p className="text-sm text-gray-600 font-light">📧 info@elspa.co.kr</p>
          </div>
        </div>
        <div className="border-t border-stone-200 pt-8 text-center text-sm text-gray-500 font-light">
          <p>© 2026 ElSpa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
