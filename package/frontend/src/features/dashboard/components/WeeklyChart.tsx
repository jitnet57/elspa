interface WeeklyChartProps {
  weeklyData: number[];
  days: string[];
}

export function WeeklyChart({ weeklyData, days }: WeeklyChartProps) {
  const maxValue = Math.max(...weeklyData);
  const avgValue = Math.round(weeklyData.reduce((a, b) => a + b) / weeklyData.length);
  const totalValue = weeklyData.reduce((a, b) => a + b);

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">주간 예약 추이</h2>
        <p className="text-xs text-gray-500 mt-1 font-light">지난 7일간의 예약 통계</p>
      </div>

      <div className="h-72 flex items-end justify-between gap-3 px-4 py-6 bg-gradient-to-t from-orange-50 to-transparent rounded-lg border border-stone-100">
        {weeklyData.map((value, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
            <div className="relative w-full flex flex-col items-end">
              <div
                className="w-full bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg transition-all hover:from-orange-500 hover:to-orange-400 cursor-pointer shadow-sm group-hover:shadow-md"
                style={{ height: `${(value / maxValue) * 200}px` }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900 whitespace-nowrap">
                  {value}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500 font-light">{days[idx]}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
          <p className="text-xs text-gray-600 font-light mb-1">최고</p>
          <p className="text-2xl font-bold text-gray-900">{maxValue}</p>
        </div>
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
          <p className="text-xs text-gray-600 font-light mb-1">평균</p>
          <p className="text-2xl font-bold text-gray-900">{avgValue}</p>
        </div>
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
          <p className="text-xs text-gray-600 font-light mb-1">총합</p>
          <p className="text-2xl font-bold text-gray-900">{totalValue}</p>
        </div>
      </div>
    </div>
  );
}
