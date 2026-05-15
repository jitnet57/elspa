'use client';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
  rightContent?: React.ReactNode;
}

export function MobileHeader({ onMenuClick, title, rightContent }: MobileHeaderProps) {
  return (
    <div className="lg:hidden bg-gray-800 border-b border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between p-4">
        {/* 햄버거 메뉴 */}
        <button
          onClick={onMenuClick}
          className="text-white text-2xl p-1 hover:bg-gray-700 rounded transition-colors"
        >
          ☰
        </button>

        {/* 제목 */}
        <h1 className="text-lg font-bold text-white flex-1 ml-4 truncate">
          {title}
        </h1>

        {/* 우측 콘텐츠 */}
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      </div>
    </div>
  );
}
