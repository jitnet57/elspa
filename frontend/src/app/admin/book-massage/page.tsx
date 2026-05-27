'use client';

import { useState } from 'react';
import React from 'react';

interface BookingFormData {
  therapist: string;
  service: string;
  date: string;
  time: string;
  guestName: string;
  roomNumber: string;
  notes: string;
}

export default function BookMassage() {
  const [formData, setFormData] = useState<BookingFormData>({
    therapist: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    guestName: '',
    roomNumber: '',
    notes: ''
  });

  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const therapists = [
    'Maria Santos', 'Ana Mercado', 'Rosa Chavez', 'Carmen Rodriguez',
    'Isabella Lopez', 'Sofia Garcia', 'Elena Martinez', 'Lucia Fernandez'
  ];

  const services = [
    { name: 'Swedish Massage', duration: '60 min', price: '$80' },
    { name: 'Thai Massage', duration: '90 min', price: '$120' },
    { name: 'Hot Stone Therapy', duration: '75 min', price: '$100' },
    { name: 'Foot Massage', duration: '45 min', price: '$60' },
    { name: 'Aromatherapy', duration: '60 min', price: '$85' }
  ];

  const rooms = ['01', '02', '03', '04', '05', '06', '07', '08'];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.therapist && formData.service && formData.guestName) {
      setBookingConfirmed(true);
      setTimeout(() => setBookingConfirmed(false), 3000);
      setFormData({
        therapist: '',
        service: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        guestName: '',
        roomNumber: '',
        notes: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_#1e1b4b,_#0c1324,_#020617)] text-white relative overflow-hidden">

      {/* Nebula Background Layers */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600/20 top-[-200px] right-[-100px] filter blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-600/20 bottom-[-200px] left-[-100px] filter blur-[120px] opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-6 relative z-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-5xl text-cyan-400">spa</span>
            Book Massage with Therapist
          </h1>
          <p className="text-indigo-300/60 text-sm uppercase tracking-wider font-bold">
            Schedule & Reserve Premium Massage Services
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(99,102,241,0.1)]">

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Therapist Selection */}
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    🧑‍⚕️ Select Therapist
                  </label>
                  <select
                    name="therapist"
                    value={formData.therapist}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                  >
                    <option value="">Choose a therapist...</option>
                    {therapists.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    💆 Select Service
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                  >
                    <option value="">Choose a service...</option>
                    {services.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.name} - {s.duration} ({s.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                      📅 Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                      🕐 Time
                    </label>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    >
                      {timeSlots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Guest Name & Room */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                      👤 Guest Name
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                      placeholder="Full name"
                      required
                      className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                      🚪 Room
                    </label>
                    <select
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    >
                      <option value="">Select room...</option>
                      {rooms.map(r => (
                        <option key={r} value={r}>Room {r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                    📝 Special Requests
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="w-full bg-slate-950/80 border border-indigo-500/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black py-4 rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-95"
                >
                  ✨ Confirm Booking
                </button>
              </form>
            </div>
          </div>

          {/* Right: Summary & Confirmation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(99,102,241,0.1)] sticky top-6">

              <h3 className="text-lg font-black text-cyan-400 mb-4 uppercase tracking-wider">
                📋 Booking Summary
              </h3>

              {/* Summary Details */}
              <div className="space-y-3 mb-6">
                <div className="pb-3 border-b border-indigo-500/10">
                  <p className="text-indigo-300/60 text-xs uppercase tracking-wider font-bold mb-1">Therapist</p>
                  <p className="text-white font-bold">{formData.therapist || '—'}</p>
                </div>

                <div className="pb-3 border-b border-indigo-500/10">
                  <p className="text-indigo-300/60 text-xs uppercase tracking-wider font-bold mb-1">Service</p>
                  <p className="text-white font-bold">{formData.service || '—'}</p>
                </div>

                <div className="pb-3 border-b border-indigo-500/10">
                  <p className="text-indigo-300/60 text-xs uppercase tracking-wider font-bold mb-1">Date & Time</p>
                  <p className="text-white font-bold">{formData.date} @ {formData.time}</p>
                </div>

                <div className="pb-3 border-b border-indigo-500/10">
                  <p className="text-indigo-300/60 text-xs uppercase tracking-wider font-bold mb-1">Guest</p>
                  <p className="text-white font-bold">{formData.guestName || '—'}</p>
                </div>

                <div>
                  <p className="text-indigo-300/60 text-xs uppercase tracking-wider font-bold mb-1">Room</p>
                  <p className="text-white font-bold">{formData.roomNumber ? `Room ${formData.roomNumber}` : '—'}</p>
                </div>
              </div>

              {/* Confirmation Alert */}
              {bookingConfirmed && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 animate-bounce">
                  <p className="text-green-400 font-bold text-center text-sm">
                    ✅ Booking Confirmed!
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 space-y-2">
                <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-wider">ℹ️ Service Info</p>
                <p className="text-indigo-300/50 text-xs leading-relaxed">
                  All bookings are confirmed immediately. Therapists will be notified of your appointment. Cancellations must be made 24 hours in advance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
