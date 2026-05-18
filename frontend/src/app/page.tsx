export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              💆
            </div>
            <div className="text-lg font-bold text-gray-900">ELSPA</div>
          </div>
          <p className="text-xs text-gray-500 font-light">v 2.1.0</p>
        </div>
      </div>

      <main className="p-4 lg:p-8">
        <div className="text-center py-12 lg:py-20">
          <div className="text-5xl lg:text-6xl mb-4">💆</div>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2 lg:mb-4">ELSPA Manager</h1>
          <p className="text-lg lg:text-xl text-gray-600 mb-8 lg:mb-12">Professional Wellness & Therapist Management System</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 max-w-2xl mx-auto">
            {/* Dashboard */}
            <a
              href="/monitor"
              className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📊</div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 lg:mb-2">Dashboard</h2>
              <p className="text-xs lg:text-sm text-gray-600">Real-time monitoring & analytics</p>
            </a>

            {/* Admin */}
            <a
              href="/admin"
              className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">👥</div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 lg:mb-2">Admin Panel</h2>
              <p className="text-xs lg:text-sm text-gray-600">Manage therapists & settlements</p>
            </a>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around">
          <a
            href="/monitor"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:text-indigo-600 border-r border-slate-200 last:border-r-0"
          >
            <span className="text-lg">📊</span>
            <span className="hidden sm:inline">Dashboard</span>
          </a>
          <a
            href="/admin"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-600 hover:text-indigo-600"
          >
            <span className="text-lg">👥</span>
            <span className="hidden sm:inline">Admin</span>
          </a>
        </div>
      </div>

      {/* Mobile bottom padding */}
      <div className="lg:hidden h-16" />
    </div>
  );
}
