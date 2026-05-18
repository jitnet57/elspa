'use client';

export default function CustomerHome() {
  const services = [
    { name: 'Swedish Massage', duration: '60 min', price: '₱80,000', rating: 4.9, reviews: 245, icon: '💆‍♀️' },
    { name: 'Thai Massage', duration: '90 min', price: '₱120,000', rating: 4.8, reviews: 189, icon: '🧘' },
    { name: 'Hot Stone Therapy', duration: '60 min', price: '₱100,000', rating: 4.7, reviews: 156, icon: '🔥' },
    { name: 'Foot Massage', duration: '30 min', price: '₱50,000', rating: 4.9, reviews: 312, icon: '🦶' },
    { name: 'Couple Package', duration: '120 min', price: '₱180,000', rating: 5.0, reviews: 78, icon: '👫' },
    { name: 'Aromatherapy', duration: '60 min', price: '₱85,000', rating: 4.8, reviews: 201, icon: '🌸' },
  ];

  const therapists = [
    { name: 'Sarah', specialty: 'Swedish Specialist', experience: '7 years', rating: 4.9, bookings: 156 },
    { name: 'Emma', specialty: 'Thai Massage', experience: '5 years', rating: 4.7, bookings: 128 },
    { name: 'Jessica', specialty: 'Hot Stone Therapy', experience: '8 years', rating: 4.8, bookings: 167 },
    { name: 'Amanda', specialty: 'Foot Massage', experience: '6 years', rating: 4.6, bookings: 145 },
  ];

  const testimonials = [
    { name: 'Min-ji Kim', service: 'Swedish Massage', text: 'It was a very relaxing experience. I will definitely visit again!', rating: 5 },
    { name: 'Jun-ho Lee', service: 'Thai Massage', text: 'The therapist was professional and kind. Highly recommended!', rating: 5 },
    { name: 'Su-jin Park', service: 'Couple Package', text: 'The service is really good for the price. I\'m a regular now!', rating: 5 },
  ];

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {therapists.map((therapist, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-lg hover:border-orange-200 active:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg mb-3 sm:mb-4 flex items-center justify-center text-3xl sm:text-4xl">
                💆
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">{therapist.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 font-light">{therapist.specialty}</p>
              <p className="text-xs text-gray-500 mt-1 font-light">{therapist.experience} experience</p>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-gray-900">⭐ {therapist.rating}</span>
                <span className="text-xs text-gray-500 font-light">{therapist.bookings} bookings</span>
              </div>
            </div>
          ))}
        </div>
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

