'use client';

import { useState } from 'react';

interface MatchingMode {
  id: string;
  name: string;
  description: string;
  formula: string;
  weights: Record<string, number>;
  useCase: string[];
  pros: string[];
  cons: string[];
  color: string;
  example?: {
    candidate: string;
    scores: Record<string, number>;
    total: number;
  }[];
}

const MATCHING_MODES: MatchingMode[] = [
  {
    id: 'basic',
    name: 'Basic Mode (70/20/10)',
    description: 'Traditional matching algorithm that prioritizes customer satisfaction',
    formula: 'Score = (Expertise × 70%) + (Distance/Time × 20%) + (Rating × 10%)',
    weights: {
      expertise: 70,
      distance: 20,
      rating: 10,
      fairness: 0,
    },
    useCase: [
      'VIP customers (high repeat visit rate)',
      'Special services (couple massage, customized services)',
      'Important: customer satisfaction is the top priority',
    ],
    pros: [
      '✓ Always assign the best therapist',
      '✓ Maximize customer satisfaction',
      '✓ Guarantee service quality',
    ],
    cons: [
      '✗ Work concentrated on popular therapists',
      '✗ Limited opportunities for new therapists',
      '✗ Revenue imbalance among therapists',
    ],
    color: 'bg-blue-50 border-blue-200',
    example: [
      {
        candidate: 'Jessica',
        scores: { expertise: 66.5, distance: 17, rating: 8.8 },
        total: 92.3,
      },
      {
        candidate: 'Sarah',
        scores: { expertise: 63, distance: 12, rating: 9.2 },
        total: 84.2,
      },
      {
        candidate: 'Emma',
        scores: { expertise: 59.5, distance: 14, rating: 8.5 },
        total: 82.0,
      },
    ],
  },
  {
    id: 'fairness',
    name: 'Fairness Mode (40/20/10/30)',
    description: 'Fair matching that distributes work equally among therapists',
    formula: 'Score = (Expertise × 40%) + (Distance/Time × 20%) + (Rating × 10%) + (Workload Balance × 30%)',
    weights: {
      expertise: 40,
      distance: 20,
      rating: 10,
      fairness: 30,
    },
    useCase: [
      'Regular hours (11:00~18:00)',
      'Routine bookings',
      'Need to distribute work equally among therapists',
    ],
    pros: [
      '✓ Provide equal opportunities to all therapists',
      '✓ New therapists can receive assignments',
      '✓ Improve therapist revenue balance',
      '✓ Increase motivation',
    ],
    cons: [
      '✗ Sometimes assign non-optimal therapists',
      '✗ Customer satisfaction may slightly decrease',
    ],
    color: 'bg-green-50 border-green-200',
    example: [
      {
        candidate: 'Emma (1건만 받음)',
        scores: { expertise: 34, distance: 15, rating: 8.5, fairness: 28.5 },
        total: 86.0,
      },
      {
        candidate: 'Jessica (4건 받음)',
        scores: { expertise: 38, distance: 17, rating: 8.8, fairness: 6 },
        total: 69.8,
      },
    ],
  },
  {
    id: 'newtherapist',
    name: 'New Therapist Boost Mode',
    description: 'Concentrate opportunities for new therapist to gain experience',
    formula: 'Score = (Base Score) + New Therapist Bonus (+20 points)',
    weights: {
      expertise: 70,
      distance: 20,
      rating: 10,
      fairness: 0,
      newTherapistBonus: 20,
    },
    useCase: [
      'Training period for new therapists (first 6 months)',
      'Need to provide new therapists with sufficient experience',
      'Period for new therapist rating building',
    ],
    pros: [
      '✓ New therapists actively receive assignments',
      '✓ Guarantee opportunities for new therapists to gain experience',
      '✓ Accelerate new therapist rating improvement',
      '✓ Improve training efficiency',
    ],
    cons: [
      '✗ May appear as a temporary measure',
      '✗ Some customer satisfaction may decrease',
    ],
    color: 'bg-amber-50 border-amber-200',
    example: [
      {
        candidate: '이준호 (신입, 1개월)',
        scores: { expertise: 49, distance: 16, rating: 3.5, newTherapistBonus: 20 },
        total: 88.5,
      },
    ],
  },
  {
    id: 'hybrid',
    name: 'Hybrid Mode (Automatic Time-based Switching)',
    description: 'Automatically switch algorithms based on time of day and situation',
    formula: 'Automatically apply one of the 3 modes above based on situation',
    weights: {
      expertise: 0,
      distance: 0,
      rating: 0,
      fairness: 0,
    },
    useCase: [
      'Need flexible operation based on situation',
      'Handle various customer types throughout the day',
      'Most practical operation method',
    ],
    pros: [
      '✓ Provide optimal flexibility',
      '✓ Automatically apply optimal strategy for each time period',
      '✓ Handle VIP/regular/new therapists',
      '✓ Make best decisions for each situation',
    ],
    cons: [
      '✗ Configuration can be complex',
      '✗ Requires manager understanding',
    ],
    color: 'bg-purple-50 border-purple-200',
  },
];

export default function PoliciesPage() {
  const [selectedMode, setSelectedMode] = useState<string>('basic');
  const selectedModeData = MATCHING_MODES.find(m => m.id === selectedMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            📋 Matching Policy Management
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Select therapist matching algorithm mode and monitor the current status
          </p>
        </div>

        {/* Mode Selection Card */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {MATCHING_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-6 rounded-xl border-2 transition-all text-left
                ${
                  selectedMode === mode.id
                    ? `${mode.color} border-current shadow-lg scale-105`
                    : 'bg-white border-stone-200 hover:border-orange-300'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{mode.name}</h3>
                {selectedMode === mode.id && (
                  <span className="text-xl">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-600 font-light">
                {mode.description.split(' ')[0]}
              </p>
            </button>
          ))}
        </div>

        {selectedModeData && (
          <>
            {/* Selected Mode Details */}
            <div className={`${selectedModeData.color} rounded-xl p-8 mb-8 border-2`}>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {selectedModeData.name}
                </h2>
                <p className="text-lg text-gray-700 font-light mb-4">
                  {selectedModeData.description}
                </p>

                {/* Formula */}
                <div className="bg-white/80 rounded-lg p-4 mb-6 border border-stone-200">
                  <p className="text-sm text-gray-600 font-light mb-2">📐 Matching Formula</p>
                  <p className="font-mono text-sm text-gray-900 font-semibold">
                    {selectedModeData.formula}
                  </p>
                </div>

                {/* Weight Display */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {Object.entries(selectedModeData.weights).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      expertise: 'Expertise',
                      distance: 'Distance/Time',
                      rating: 'Rating',
                      fairness: 'Fairness',
                      newTherapistBonus: 'New Therapist Bonus',
                    };
                    return value > 0 ? (
                      <div key={key} className="bg-white/60 rounded-lg p-3 text-center border border-stone-200">
                        <p className="text-xs text-gray-600 font-light">{labels[key]}</p>
                        <p className="text-2xl font-bold text-orange-600">{value}%</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Usage Timing */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Usage Timing */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">📌 When to Use</h3>
                  <ul className="space-y-2">
                    {selectedModeData.useCase.map((use, idx) => (
                      <li key={idx} className="text-sm text-gray-700 font-light flex gap-2">
                        <span className="text-orange-600">•</span>
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Advantages */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">✅ Advantages</h3>
                  <ul className="space-y-2">
                    {selectedModeData.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm text-gray-700 font-light">
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disadvantages */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">⚠️ Disadvantages</h3>
                  <ul className="space-y-2">
                    {selectedModeData.cons.map((con, idx) => (
                      <li key={idx} className="text-sm text-gray-700 font-light">
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Example */}
            {selectedModeData.example && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  🎯 Matching Example: Customer "Min-jun Kim" - Swedish 60-minute Booking
                </h3>

                <div className="space-y-4">
                  {selectedModeData.example.map((ex, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-lg border-2
                        ${idx === 0
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-stone-50 border-stone-200'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold text-lg text-gray-900">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {ex.candidate}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-orange-600">
                            {ex.total.toFixed(1)}점
                          </p>
                          <p className="text-xs text-gray-500">Final Score</p>
                        </div>
                      </div>

                      {/* Score Details */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(ex.scores).map(([key, score]) => {
                          const labels: Record<string, string> = {
                            expertise: 'Expertise',
                            distance: 'Distance/Time',
                            rating: 'Rating',
                            fairness: 'Fairness',
                            newTherapistBonus: 'New Therapist Bonus',
                          };
                          return (
                            <div key={key} className="bg-white rounded p-3 text-center">
                              <p className="text-xs text-gray-600 font-light mb-1">
                                {labels[key]}
                              </p>
                              <p className="font-bold text-gray-900">{score} points</p>
                              <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2">
                                <div
                                  className="h-full bg-orange-500 rounded-full"
                                  style={{ width: `${Math.min(score / 10, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {idx === 0 && (
                        <div className="mt-4 pt-4 border-t border-yellow-200">
                          <p className="text-sm font-semibold text-yellow-900">
                            ✓ Assigned to this therapist
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hybrid Mode Details */}
            {selectedMode === 'hybrid' && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  ⏰ Automatic Policy Switching by Time Period
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      time: '08:00 - 11:00',
                      mode: 'Basic Mode (70/20/10)',
                      reason: 'Early morning customers: Provide best service',
                      icon: '🌅',
                    },
                    {
                      time: '11:00 - 13:00',
                      mode: 'Fairness Mode (40/20/10/30)',
                      reason: 'Lunch peak time: Give opportunities to all therapists',
                      icon: '☀️',
                    },
                    {
                      time: '13:00 - 18:00',
                      mode: 'Hybrid Mode',
                      reason: 'Regular hours: Flexible adjustment based on situation',
                      icon: '🌤️',
                    },
                    {
                      time: '18:00 - 22:00',
                      mode: 'New Therapist Boost Mode',
                      reason: 'Evening: Focus on training new therapists',
                      icon: '🌙',
                    },
                  ].map((slot, idx) => (
                    <div key={idx} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600 font-light mb-1">
                            <span className="text-lg">{slot.icon}</span> {slot.time}
                          </p>
                          <p className="font-bold text-gray-900 mb-1">{slot.mode}</p>
                          <p className="text-sm text-gray-600 font-light">{slot.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Special Situations */}
                  <div className="mt-6 pt-6 border-t-2 border-stone-300">
                    <p className="font-bold text-gray-900 mb-4">🚨 Special Situations</p>
                    <div className="space-y-3">
                      {[
                        { condition: 'VIP customers', action: 'Always use basic mode' },
                        { condition: 'Booking shortage', action: 'Switch to fairness mode' },
                        { condition: 'New therapist rating < 4.0', action: 'Auto-activate new therapist boost' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="text-sm text-orange-600 font-bold">→</div>
                          <div>
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">{item.condition}:</span> {item.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Current Policy Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
            <p className="text-sm text-gray-600 font-light mb-2">Currently Active Mode</p>
            <p className="text-2xl font-bold text-orange-600 mb-4">
              {selectedModeData?.name.split('(')[0].trim()}
            </p>
            <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm">
              Applied with this mode
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
            <p className="text-sm text-gray-600 font-light mb-2">Today's Matching Count</p>
            <p className="text-2xl font-bold text-blue-600 mb-4">24</p>
            <p className="text-xs text-gray-500 font-light">Last 7 days average: 21.3</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
            <p className="text-sm text-gray-600 font-light mb-2">Average Customer Satisfaction</p>
            <p className="text-2xl font-bold text-green-600 mb-4">⭐ 4.7 / 5.0</p>
            <p className="text-xs text-gray-500 font-light">Last 7 days average: 4.65</p>
          </div>
        </div>
      </div>
    </div>
  );
}
