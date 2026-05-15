import { Therapist } from '@/lib/dashboard/types';

interface TherapistsPerformanceProps {
  therapists: Therapist[];
}

export function TherapistsPerformance({ therapists }: TherapistsPerformanceProps) {
  return (
    <div>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">성과 Top 4</h2>
          <p className="text-xs text-gray-500 mt-1 font-light">오늘의 테라피스트</p>
        </div>

        <div className="space-y-4">
          {therapists.map((therapist, idx) => (
            <div key={idx} className="p-4 border border-stone-100 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${therapist.imageColor} rounded-full flex items-center justify-center text-lg`}>
                  💆
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{therapist.name}</p>
                  <p className="text-xs text-gray-500 font-light mt-0.5">{therapist.bookings}명 예약</p>
                </div>
                <span className="text-sm font-bold text-orange-600">{therapist.rating}★</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                      style={{ width: `${(therapist.bookings / 8) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-light text-gray-600">{therapist.revenue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-light">가용률</p>
                  <p className="text-xs font-bold text-gray-900">{therapist.availability}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
