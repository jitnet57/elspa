'use client';

import React from 'react';
import MassageBookingBeds from './components/MassageBookingBeds';
import TherapistScheduleGantt from './components/TherapistScheduleGantt';
import MassageBookingForm from './components/MassageBookingForm';

export default function MassageBookingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button className="text-primary p-2 hover:bg-surface-container rounded-full transition md:hidden">
            <span>☰</span>
          </button>
          <h1 className="text-xl font-bold text-primary">ElSpa Massage Booking</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-md text-on-surface-variant hidden md:block">Staff Admin</span>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxhfYielMwYvx2hiT6f95h_yBbGpSnpQFHYv8fyKo-CB9xZiWH-uJWUbkIaMX3-2nPcvfRFFr5wgnJdxpXKlzEmG5_1mUpXtkNeJg2y70BqL_4_IjiXKMUAw5Lozs_hQpYFE_ObaOfqq45AmC-GQjOPVjpGFPK6N6qmn8w1aJ8f4OxPeSHqhYqlIhkGZ5eIgEelMlmks2jRB_BnPbjmumNCkjzUNXPalEsSqhcYMgNE_3ZOANLLM1InNptM9F2hzvIo1XSS6lUHfRM"
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-8 h-screen flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Tab Navigation */}
        <div className="md:hidden flex border-b border-outline-variant bg-white overflow-x-auto">
          <button className="flex-1 px-4 py-3 text-center font-bold text-primary border-b-2 border-primary">
            🛏️ 치료실
          </button>
          <button className="flex-1 px-4 py-3 text-center font-bold text-on-surface-variant hover:text-primary">
            📅 일정
          </button>
          <button className="flex-1 px-4 py-3 text-center font-bold text-on-surface-variant hover:text-primary">
            ✏️ 예약
          </button>
        </div>

        {/* 3-Panel Layout (Desktop) */}
        <div className="hidden md:flex w-full flex-1 overflow-hidden">
          {/* Left Panel: Beds */}
          <div className="flex flex-col overflow-hidden">
            <MassageBookingBeds />
          </div>

          {/* Middle Panel: Schedule */}
          <div className="flex flex-col overflow-hidden">
            <TherapistScheduleGantt />
          </div>

          {/* Right Panel: Booking Form */}
          <div className="flex flex-col overflow-hidden">
            <MassageBookingForm />
          </div>
        </div>

        {/* Mobile Single Panel (Hidden on Desktop) */}
        <div className="md:hidden flex flex-col overflow-hidden flex-1">
          <div className="overflow-y-auto flex-1">
            <MassageBookingBeds />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-white border-t border-outline-variant py-2">
        {[
          { icon: '📊', label: 'Dashboard' },
          { icon: '🛏️', label: 'Beds' },
          { icon: '👥', label: 'Staff' },
          { icon: '📅', label: 'Schedule' },
          { icon: '✏️', label: 'Booking' },
        ].map((item, idx) => (
          <a
            key={idx}
            href="#"
            className="flex flex-col items-center justify-center py-2 px-3 text-on-surface-variant hover:text-primary"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
