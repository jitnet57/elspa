'use client';

import { useState } from 'react';

interface MatchingCandidate {
  id: number;
  name: string;
  score: number;
  expertise: number;
  distance: number;
  rating: number;
  currentStatus: string;
  availableAt: string;
}

interface SimulationResult {
  candidates: MatchingCandidate[];
  estimatedStartTime: string;
  estimatedEndTime: string;
  selectedBed: string;
  waitingTime: string;
  message: string;
}

const SERVICES = [
  { id: 'swedish', name: 'Swedish Massage', duration: 60 },
  { id: 'thai', name: 'Thai Massage', duration: 90 },
  { id: 'hotstone', name: 'Hot Stone Therapy', duration: 60 },
  { id: 'foot', name: 'Foot Massage', duration: 30 },
  { id: 'aromatherapy', name: 'Aromatherapy', duration: 60 },
  { id: 'couple', name: 'Couple Package', duration: 120 },
];

const THERAPISTS = [
  { id: 1, name: 'Sarah', specialty: 'Swedish Specialist' },
  { id: 2, name: 'Emma', specialty: 'Thai Massage' },
  { id: 3, name: 'Jessica', specialty: 'Hot Stone Therapy' },
  { id: 4, name: 'Amanda', specialty: 'Foot Massage' },
  { id: 5, name: 'Kang Ji-yeon', specialty: 'Aromatherapy' },
  { id: 6, name: 'Park Min-gyeong', specialty: 'General' },
];

export default function SimulationPage() {
  const [serviceId, setServiceId] = useState('swedish');
  const [preferredTherapist, setPreferredTherapist] = useState('');
  const [timeOption, setTimeOption] = useState('now');
  const [customTime, setCustomTime] = useState('14:00');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const selectedService = SERVICES.find(s => s.id === serviceId);

  const generateMockResult = (): SimulationResult => {
    const now = new Date();
    const waitMinutes = Math.floor(Math.random() * 45) + 5;
    const startTime = new Date(now.getTime() + waitMinutes * 60000);
    const endTime = new Date(startTime.getTime() + (selectedService?.duration || 60) * 60000);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }).replace(/:\d{2}$/, match => match);
    };

    const candidates: MatchingCandidate[] = [
      {
        id: 3,
        name: 'Jessica',
        score: 92,
        expertise: 95,
        distance: 85,
        rating: 88,
        currentStatus: 'Idle',
        availableAt: 'Immediately',
      },
      {
        id: 2,
        name: 'Emma',
        score: 87,
        expertise: 88,
        distance: 78,
        rating: 85,
        currentStatus: 'In Session (15 min)',
        availableAt: 'About 15 minutes later',
      },
      {
        id: 1,
        name: 'Sarah',
        score: 81,
        expertise: 90,
        distance: 72,
        rating: 92,
        currentStatus: 'On Break',
        availableAt: 'About 5 minutes later',
      },
    ];

    return {
      candidates,
      estimatedStartTime: formatTime(startTime),
      estimatedEndTime: formatTime(endTime),
      selectedBed: 'B' + String(Math.floor(Math.random() * 40) + 1).padStart(2, '0'),
      waitingTime: `${waitMinutes} minutes`,
      message: `Therapist Jessica is currently available. Instant matching is possible.`,
    };
  };

  const handleSimulate = () => {
    setSimulating(true);
    setTimeout(() => {
      setResult(generateMockResult());
      setSimulating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            What-If Matching Simulation
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Enter customer conditions and AI will recommend the best therapist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Area */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Conditions</h2>

              {/* Service Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  📋 Select Service
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light"
                >
                  {SERVICES.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration}분)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 font-light">
                  Selected Service Duration: <span className="font-semibold">{selectedService?.duration} min</span>
                </p>
              </div>

              {/* Therapist Preference */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  👥 Preferred Therapist (Optional)
                </label>
                <select
                  value={preferredTherapist}
                  onChange={(e) => setPreferredTherapist(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light"
                >
                  <option value="">No Preferred Therapist</option>
                  {THERAPISTS.map(therapist => (
                    <option key={therapist.id} value={therapist.id.toString()}>
                      {therapist.name} - {therapist.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  ⏰ Booking Time
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeOption"
                      value="now"
                      checked={timeOption === 'now'}
                      onChange={(e) => setTimeOption(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm font-light text-gray-700">Now (Walk-in)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeOption"
                      value="custom"
                      checked={timeOption === 'custom'}
                      onChange={(e) => setTimeOption(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm font-light text-gray-700">Specific Time</span>
                  </label>
                </div>

                {timeOption === 'custom' && (
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500 font-light mt-3"
                  />
                )}
              </div>

              {/* Simulation Button */}
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md"
              >
                {simulating ? '🔄 Simulating...' : '🚀 Run Simulation'}
              </button>

              {/* Tip */}
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs font-bold text-orange-900 mb-1">💡 Tip</p>
                <p className="text-xs text-orange-800 font-light">
                  Simulation results are not reflected in the database. This is for inquiry purposes only.
                </p>
              </div>
            </div>
          </div>

          {/* Result Area */}
          <div className="lg:col-span-2">
            {!result ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-stone-100 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500 font-light text-lg">
                    Set conditions and click the "Run Simulation" button.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Information */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">Service</p>
                      <p className="text-lg font-bold text-gray-900">{selectedService?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">Est. Wait Time</p>
                      <p className="text-lg font-bold text-orange-600">{result.waitingTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">Est. Start Time</p>
                      <p className="text-lg font-bold text-gray-900">{result.estimatedStartTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-light mb-1">Est. End Time</p>
                      <p className="text-lg font-bold text-gray-900">{result.estimatedEndTime}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 font-light mb-1">Assigned Bed</p>
                      <p className="text-2xl font-bold text-blue-600">{result.selectedBed}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 font-light">{result.message}</p>
                  </div>
                </div>

                {/* Recommended Therapists */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">🏆 AI Recommended Therapists</h3>

                  {result.candidates.map((candidate, idx) => (
                    <div key={candidate.id} className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all">
                      {/* Rank Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                              ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-700'}
                            `}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </div>
                            <div>
                              <p className="text-xl font-bold text-gray-900">{candidate.name}</p>
                              <p className="text-xs text-gray-500 font-light">{THERAPISTS.find(t => t.id === candidate.id)?.specialty}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-orange-600">{candidate.score}</div>
                          <p className="text-xs text-gray-500">Matching Score</p>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600 font-light mb-1">Expertise</p>
                          <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-gray-900">{candidate.expertise}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full h-1 bg-stone-200 rounded-full mt-1">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${candidate.expertise}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-light mb-1">Distance/Time</p>
                          <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-gray-900">{candidate.distance}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full h-1 bg-stone-200 rounded-full mt-1">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${candidate.distance}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-light mb-1">Rating</p>
                          <div className="flex items-end gap-1">
                            <span className="text-lg font-bold text-gray-900">{candidate.rating}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full h-1 bg-stone-200 rounded-full mt-1">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${candidate.rating}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Current Status */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-900 font-light">
                            Current: <span className="font-semibold">{candidate.currentStatus}</span>
                          </p>
                          <p className="text-sm text-orange-600 font-light">
                            Available: <span className="font-semibold">{candidate.availableAt}</span>
                          </p>
                        </div>

                        {idx === 0 && (
                          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg font-semibold transition-all shadow-md text-sm">
                            ✓ Assign Therapist
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Run Simulation Again */}
                <button
                  onClick={() => setResult(null)}
                  className="w-full px-6 py-3 bg-stone-100 text-gray-900 rounded-lg hover:bg-stone-200 font-semibold transition-colors"
                >
                  ← Reset Conditions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
