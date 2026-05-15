'use client';

import Link from 'next/link';

interface TabItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

interface MobileBottomTabBarProps {
  tabs: TabItem[];
  onWalkInAdd?: () => void;
}

export function MobileBottomTabBar({ tabs, onWalkInAdd }: MobileBottomTabBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-30">
      <div className="flex items-center justify-between">
        {/* 탭 아이템들 */}
        <div className="flex-1 flex divide-x divide-gray-700">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${
                tab.active
                  ? 'bg-blue-600/20 text-blue-400 border-t-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="text-lg mb-1">{tab.icon}</div>
              <div>{tab.label}</div>
            </Link>
          ))}
        </div>

        {/* 워크인 추가 버튼 */}
        {onWalkInAdd && (
          <button
            onClick={onWalkInAdd}
            className="px-3 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-none transition-all text-xs"
            title="워크인 추가"
          >
            <div className="text-lg mb-1">➕</div>
            <div>워크인</div>
          </button>
        )}
      </div>
    </div>
  );
}
