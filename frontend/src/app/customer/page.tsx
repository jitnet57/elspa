'use client';

import { useEffect, useState } from 'react';
import { getTherapists, getTherapistReviews, type Therapist, type Review } from '@/lib/api-client';

export default function CustomerHome() {
  // ============================================================
  // 📌 상태 관리: API에서 가져온 데이터
  // 📋 목적: 테라피스트와 리뷰 데이터를 동적으로 관리
  // ============================================================
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [testimonials, setTestimonials] = useState<Array<{
    name: string;
    service: string;
    text: string;
    rating: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 정적 서비스 데이터 (나중에 API로 변경 가능)
  const services = [
    { name: 'Swedish Massage', duration: '60 min', price: '₩80,000', rating: 4.9, reviews: 245, icon: '💆‍♀️' },
    { name: 'Thai Massage', duration: '90 min', price: '₩120,000', rating: 4.8, reviews: 189, icon: '🧘' },
    { name: 'Hot Stone Therapy', duration: '60 min', price: '₩100,000', rating: 4.7, reviews: 156, icon: '🔥' },
    { name: 'Foot Massage', duration: '30 min', price: '₩50,000', rating: 4.9, reviews: 312, icon: '🦶' },
    { name: 'Aromatherapy', duration: '60 min', price: '₩85,000', rating: 4.8, reviews: 201, icon: '🌸' },
    { name: 'Scalp Care', duration: '30 min', price: '₩45,000', rating: 4.6, reviews: 178, icon: '💇' },
  ];

  // ============================================================
  // 📌 데이터 페칭: API에서 테라피스트 목록과 리뷰 조회
  // 📋 목적: 화면 로드 시 실시간 데이터 불러오기
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 상위 4명의 테라피스트 조회 (평점순)
        const therapistsData = await getTherapists({ limit: 4, sort_by: 'rating' });
        setTherapists(therapistsData);

        // 각 테라피스트의 리뷰 조회 및 추천글 생성
        const reviews: Review[] = [];
        for (const therapist of therapistsData.slice(0, 3)) {
          const therapistReviews = await getTherapistReviews(therapist.id, { limit: 1 });
          if (therapistReviews.length > 0) {
            reviews.push(therapistReviews[0]);
          }
        }

        // 리뷰를 추천글 형식으로 변환
        const testimonialsList = reviews.map((review) => ({
          name: `고객 ${review.customer_id}`,
          service: `테라피스트 ${review.therapist_id}`,
          text: review.comment || '좋은 서비스였습니다!',
          rating: review.rating || 5,
        }));

        // 리뷰가 부족하면 기본 추천글 추가
        if (testimonialsList.length === 0) {
          testimonialsList.push(
            { name: '김민지', service: 'Swedish Massage', text: '정말 좋은 경험이었습니다. 꼭 다시 방문하겠습니다!', rating: 5 },
            { name: '이준호', service: 'Thai Massage', text: '전문적이고 친절한 서비스였습니다. 강력 추천합니다!', rating: 5 },
            { name: '박수진', service: 'Hot Stone', text: '가격 대비 서비스가 정말 좋습니다. 단골이 되었어요!', rating: 5 },
          );
        }

        setTestimonials(testimonialsList);
        setError(null);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다');

        // 오류 발생 시 기본 데이터 표시
        setTestimonials([
          { name: '김민지', service: 'Swedish Massage', text: '정말 좋은 경험이었습니다. 꼭 다시 방문하겠습니다!', rating: 5 },
          { name: '이준호', service: 'Thai Massage', text: '전문적이고 친절한 서비스였습니다. 강력 추천합니다!', rating: 5 },
          { name: '박수진', service: 'Hot Stone', text: '가격 대비 서비스가 정말 좋습니다. 단골이 되었어요!', rating: 5 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Section - 모바일 최적화 */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-2xl sm:rounded-xl p-6 sm:p-8 md:p-12 shadow-sm border border-stone-100 overflow-hidden">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight leading-tight">
            Your Wellness<br />Partner, ElSpa
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed font-light">
            Heal your body and mind with our<br className="sm:hidden" /> professional therapists.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:scale-105 active:scale-95 transition-all font-semibold shadow-md">
              Book Now
            </button>
            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all font-semibold">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Featured Services - 모바일 최적화 */}
      <section>
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Services</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 font-light">ElSpa Premium Services</p>
          </div>
          <a href="/customer/services" className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium">
            View All →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg hover:border-orange-200 active:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              {/* Service Header */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 h-20 sm:h-28 md:h-32 flex items-center justify-center text-4xl sm:text-5xl">
                {service.icon}
              </div>

              {/* Service Content */}
              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{service.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-light">{service.duration}</p>

                <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-gray-900">⭐ {service.rating}</span>
                    <span className="text-xs text-gray-500">({service.reviews})</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{service.price}</p>
                </div>

                <button className="w-full mt-3 sm:mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-all text-xs sm:text-sm font-semibold hover:shadow-md">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Therapists - 모바일 최적화 */}
      <section>
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Our Therapists</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 font-light">Experienced Professionals</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">테라피스트 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {therapists.map((therapist) => (
              <div
                key={therapist.id}
                className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-lg hover:border-orange-200 active:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg mb-3 sm:mb-4 flex items-center justify-center text-3xl sm:text-4xl">
                  💆
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{therapist.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 font-light">{therapist.specialty}</p>
                <p className="text-xs text-gray-500 mt-1 font-light">{therapist.experience_years}년 경력</p>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">⭐ {therapist.rating}</span>
                  <span className="text-xs text-gray-500 font-light">{therapist.review_count}건 후기</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="bg-white rounded-2xl sm:rounded-xl p-6 sm:p-8 md:p-12 shadow-sm border border-stone-100">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Why Choose ElSpa</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 font-light">Customer satisfaction is our top priority</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: '✓', title: 'Expert Therapists', desc: 'Certified professionals\nwith 5+ years\nexperience', stat: '4' },
            { icon: '✓', title: 'Clean Facilities', desc: 'Disinfected and\nmaintained 3+ times\ndaily', stat: '100%' },
            { icon: '✓', title: 'Premium Products', desc: '100% Natural\nEssential Oils', stat: 'Grade A' },
            { icon: '✓', title: 'Custom Service', desc: 'Personalized\nsessions after\nconsultation', stat: '24hrs' },
          ].map((item, idx) => (
            <div key={idx} className="border border-stone-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💚</div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-light whitespace-pre-line mb-3">{item.desc}</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{item.stat}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 font-light">Real experiences from our valued customers</p>

        {error && (
          <p className="text-xs text-orange-600 mb-4">※ 데이터 연결 상태: {error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md hover:border-orange-200 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-base sm:text-lg">⭐</span>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3 sm:mb-4 font-light">
                "{testimonial.text}"
              </p>
              <div className="border-t border-stone-100 pt-3 sm:pt-4">
                <p className="text-xs sm:text-sm font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-xs text-gray-500 mt-1 font-light">{testimonial.service}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl sm:rounded-xl p-6 sm:p-8 md:p-12 shadow-lg text-center hover:shadow-xl transition-all">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Book Today!</h2>
        <p className="text-orange-100 mb-6 sm:mb-8 text-base sm:text-lg font-light">20% off for first-time customers</p>
        <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all font-semibold shadow-lg">
          Book Now
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 pt-8 sm:pt-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
          <div>
            <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">ElSpa</h4>
            <p className="text-xs sm:text-sm text-gray-600 font-light">Your wellness partner</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Services</h4>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2 font-light">
              <li><a href="/customer/booking" className="hover:text-orange-600 transition-colors">Booking</a></li>
              <li><a href="/customer/services" className="hover:text-orange-600 transition-colors">Services</a></li>
              <li><a href="/customer/reviews" className="hover:text-orange-600 transition-colors">Reviews</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Company</h4>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2 font-light">
              <li><a href="#" className="hover:text-orange-600 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Contact</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-1 font-light">📞 031-1234-5678</p>
            <p className="text-xs sm:text-sm text-gray-600 font-light">📧 info@elspa.co.kr</p>
          </div>
        </div>
        <div className="border-t border-stone-200 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-500 font-light">
          <p>© 2026 ElSpa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

