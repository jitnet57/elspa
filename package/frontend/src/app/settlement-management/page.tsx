'use client';

import { useState } from 'react';

export default function SettlementManagement() {
  const [selectedCategory, setSelectedCategory] = useState<'therapist' | 'company' | 'guides' | null>(null);

  const categories = [
    {
      id: 'therapist',
      title: '🧘 Therapist Settlement',
      description: 'Manage monthly settlements, salaries, and revenue for therapists',
      icon: '💆',
      href: '/therapist-settlement',
      color: 'from-blue-400 to-blue-600',
      stats: 'Monthly salary settlement',
    },
    {
      id: 'company',
      title: '🏢 Company Settlement',
      description: 'Manage monthly settlements and revenue for partner companies',
      icon: '💼',
      href: '/admin/monthly-settlement',
      color: 'from-green-400 to-green-600',
      stats: 'Monthly revenue settlement',
    },
    {
      id: 'guides',
      title: '📖 Guide Settlement',
      description: 'Review settlement rules, commission structure, and guidelines',
      icon: '📚',
      href: '/admin/guides',
      color: 'from-purple-400 to-purple-600',
      stats: 'Settlement rules & guidelines',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">💰</div>
            <div>
              <h1 className="text-4xl font-bold">Settlement Management</h1>
              <p className="text-blue-100 text-sm mt-1">Manage therapist, company, and guide settlements integrated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Settlement Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.href}
              className="group"
            >
              <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer h-full`}>
                {/* Icon */}
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">
                  {category.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-white/90 mb-4 leading-relaxed">
                  {category.description}
                </p>

                {/* Stats */}
                <div className="border-t border-white/30 pt-4 mt-4">
                  <p className="text-xs font-semibold text-white/70">
                    {category.stats}
                  </p>
                </div>

                {/* Arrow */}
                <div className="mt-6 flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all">
                  <span>Go to</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Settlement Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>📋</span> Settlement Guide
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Therapist Settlement Info */}
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900 mb-3">Therapist Settlement</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Monthly salary overview</li>
                <li>• Session revenue details</li>
                <li>• Commission calculation history</li>
                <li>• Pending settlement amounts</li>
              </ul>
            </div>

            {/* Company Settlement Info */}
            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <h3 className="font-bold text-gray-900 mb-3">Company Settlement</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Monthly revenue overview</li>
                <li>• Detailed settlement reports</li>
                <li>• Commission and profit margins</li>
                <li>• Transaction history</li>
              </ul>
            </div>

            {/* Guide Settlement Info */}
            <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="font-bold text-gray-900 mb-3">Guide & Settlement</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Settlement rules and standards</li>
                <li>• Commission structure</li>
                <li>• Settlement schedule</li>
                <li>• FAQ & Support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl p-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href="/"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              🏠 Home
            </a>
            <a
              href="/monitor"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              📊 Monitor
            </a>
            <a
              href="/admin"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              👥 Admin
            </a>
            <a
              href="/therapist-settlement"
              className="bg-white hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 font-bold py-3 px-4 rounded-lg text-center transition-all hover:shadow-md"
            >
              💰 Therapist
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
