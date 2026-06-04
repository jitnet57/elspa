'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',              icon: '🏠', href: '/customer' },
  { id: 'services', label: 'Services',           icon: '💆', href: '/customer/services' },
  { id: 'booking',  label: 'Booking',            icon: '📅', href: '/customer/booking' },
  { id: 'mypage',   label: 'My Page',            icon: '🎫', href: '/customer/mypage' },
  { id: 'reviews',  label: 'Reviews',            icon: '⭐', href: '/customer/reviews' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/customer' ? pathname === '/customer' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">

      {/* ── TOP HEADER ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-stone-200 shadow-sm z-40 h-16">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center">

          {/* Logo */}
          <Link href="/customer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              ✨
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">ELSPA</span>
            <span className="hidden sm:inline text-xs text-gray-400 ml-1 font-light">Customer Portal</span>
          </Link>

          {/* Desktop nav links (md+) */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-stone-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="tel:031-1234-5678" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 font-medium">
              📞 031-1234-5678
            </a>
            <button className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all">
              Sign In
            </button>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Open menu"
            >
              <div className="w-5 h-0.5 bg-gray-700 mb-1" />
              <div className="w-5 h-0.5 bg-gray-700 mb-1" />
              <div className="w-5 h-0.5 bg-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      {/* Drawer panel */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-md flex items-center justify-center text-white text-xs font-bold">✨</div>
            <span className="font-bold text-gray-900">ELSPA</span>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-gray-500 text-lg">✕</button>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100'
                  : 'text-gray-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActive(item.href) && <span className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full" />}
            </Link>
          ))}
        </nav>

        {/* VIP card in drawer */}
        <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
          <p className="text-xs font-bold text-gray-900 mb-1">⭐ VIP Benefits</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">Premium member — 5% off + priority booking</p>
          <button className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-lg shadow-md">
            Upgrade
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">© 2026 ElSpa</p>
      </div>

      {/* ── DESKTOP SIDEBAR (lg+) ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] w-60 bg-gradient-to-b from-stone-50 to-white border-r border-stone-200 overflow-y-auto p-5 shadow-sm">
        <nav className="space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-white text-orange-600 shadow-md border border-orange-100'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-stone-200">
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
            <p className="text-xs font-bold text-gray-900 mb-1">⭐ VIP Benefits</p>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">5% off monthly + priority booking</p>
            <button className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all">
              Upgrade
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-5">© 2026 ElSpa</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      {/* lg: offset for sidebar; sm/md: no offset; all: offset for header */}
      <main className="pt-16 lg:pl-60 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* ── BOTTOM TAB BAR (mobile/tablet only, hidden lg+) ────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg z-40">
        <div className="flex">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-all ${
                isActive(item.href)
                  ? 'text-orange-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`text-xl mb-0.5 transition-transform ${isActive(item.href) ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="hidden sm:block">{item.label}</span>
              {isActive(item.href) && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-orange-500 rounded-t-full" />
              )}
            </Link>
          ))}
        </div>
      </nav>

    </div>
  );
}
