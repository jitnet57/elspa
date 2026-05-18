'use client';

import { useState } from 'react';

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid password');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md border border-indigo-200">
          <div className="text-center mb-8">
            <div className="text-4xl sm:text-5xl mb-4">🔐</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 rounded-lg transition-all text-sm sm:text-base hover:shadow-lg hover:scale-105 active:scale-95 duration-300"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const adminMenus = [
    {
      category: '👥 Therapist Management',
      items: [
        { name: 'Therapist Directory', href: '/admin/therapists', icon: '👨‍⚕️' },
        { name: 'Daily Schedule', href: '/admin/therapist-schedule', icon: '📅' },
      ],
    },
    {
      category: '🏢 Company Management',
      items: [
        { name: 'Companies', href: '/admin/companies', icon: '🏢' },
        { name: 'Service Guides', href: '/admin/guides', icon: '📖' },
      ],
    },
    {
      category: '💰 Settlement Management',
      items: [
        { name: 'Therapist Settlement', href: '/therapist-settlement', icon: '👨‍⚕️' },
        { name: 'Company Settlement', href: '/admin/monthly-settlement', icon: '🏢' },
        { name: 'Settlement Reports', href: '/admin/settlement-report', icon: '📊' },
        { name: 'Settlement Guide', href: '/settlement-management', icon: '💰' },
      ],
    },
    {
      category: '📈 Analytics & Audit',
      items: [
        { name: 'Billing Information', href: '/admin/billing', icon: '💳' },
        { name: 'Change Logs', href: '/admin/change-logs', icon: '📋' },
        { name: 'Test Data & Validation', href: '/admin/test-data', icon: '🧪' },
      ],
    },
    {
      category: '📚 References',
      items: [
        { name: 'Deployment Guide', href: '/flowchart', icon: '📍' },
        { name: 'Policies', href: '/admin/policies', icon: '⚙️' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 text-white p-4 sm:p-6 lg:p-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="text-3xl sm:text-4xl">👥</div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-indigo-100 text-sm sm:text-base">ELSPA Management System</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full sm:w-auto px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-bold transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 sm:space-y-8">
          {adminMenus.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{section.category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {section.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="bg-white border border-gray-200 hover:border-indigo-300 rounded-lg p-4 sm:p-6 transition-all hover:shadow-lg hover:scale-105 active:scale-95 group hover:bg-indigo-50 duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                        <h3 className="text-sm sm:text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </div>
                      <div className="text-xl sm:text-2xl opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 text-gray-400 group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-8 sm:mt-12 bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">🔗 Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <a
              href="/monitor"
              className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm font-bold transition-all hover:shadow-md hover:scale-105 active:scale-95 duration-300"
            >
              📊 Dashboard
            </a>
            <a
              href="/"
              className="bg-gray-400 hover:bg-gray-500 text-white p-3 sm:p-4 rounded-lg text-center text-xs sm:text-sm font-bold transition-all hover:shadow-md hover:scale-105 active:scale-95 duration-300"
            >
              🏠 Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
