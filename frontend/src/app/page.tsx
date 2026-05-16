export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-72 bg-gradient-to-b from-stone-100 to-stone-50 border-r border-stone-200 overflow-y-auto p-8 shadow-sm">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              ✨
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">ELSPA</div>
          </div>
          <p className="text-xs text-gray-500 ml-10 font-light tracking-widest">MANAGEMENT SYSTEM</p>
        </div>

        <nav className="space-y-2 mb-8">
          <p className="text-xs font-bold text-gray-600 px-4 mb-3">🎯 메뉴</p>
          <a
            href="/monitor"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-white text-gray-900 shadow-md border border-stone-200 hover:shadow-lg"
          >
            📊 대시보드
          </a>
          <a
            href="/therapist-settlement"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-gray-600 hover:bg-white/50"
          >
            💰 정산 관리
          </a>
        </nav>

        <div className="pt-8 border-t border-stone-200">
          <p className="text-xs text-gray-500 font-light">v 2.1.0</p>
        </div>
      </aside>

      {/* 모바일 헤더 */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-stone-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              ✨
            </div>
            <div className="text-lg font-bold text-gray-900">ELSPA</div>
          </div>
          <p className="text-xs text-gray-500 font-light">v 2.1.0</p>
        </div>
      </div>

      <main className="lg:ml-72 p-4 lg:p-8">
        <div className="text-center py-12 lg:py-20">
          <div className="text-5xl lg:text-6xl mb-4">✨</div>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2 lg:mb-4">ELSPA</h1>
          <p className="text-lg lg:text-xl text-gray-600 mb-8 lg:mb-12">마사지 관리 시스템</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 max-w-2xl mx-auto">
            <a
              href="/monitor"
              className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-stone-200 hover:shadow-lg transition-all"
            >
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📊</div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 lg:mb-2">대시보드</h2>
              <p className="text-xs lg:text-sm text-gray-600">실시간 모니터</p>
            </a>

            <a
              href="/therapist-settlement"
              className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-stone-200 hover:shadow-lg transition-all"
            >
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">💰</div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 lg:mb-2">정산 관리</h2>
              <p className="text-xs lg:text-sm text-gray-600">테라피스트 정산</p>
            </a>
          </div>
        </div>
      </main>

      {/* 모바일 바텀 네비 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg">
        <div className="flex justify-around">
          <a
            href="/monitor"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:text-blue-600 border-r border-stone-200 last:border-r-0"
          >
            <span className="text-lg">📊</span>
            <span className="hidden sm:inline">대시보드</span>
          </a>
          <a
            href="/therapist-settlement"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:text-blue-600"
          >
            <span className="text-lg">💰</span>
            <span className="hidden sm:inline">정산 관리</span>
          </a>
        </div>
      </div>

      {/* 모바일 하단 여백 */}
      <div className="lg:hidden h-16" />
    </div>
  );
}
