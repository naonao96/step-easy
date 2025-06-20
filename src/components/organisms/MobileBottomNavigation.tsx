'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { IconType } from 'react-icons/lib';
import { 
  FaHome, 
  FaTasks, 
  FaChartBar, 
  FaCog,
  FaPlus
} from 'react-icons/fa';

interface BottomNavItem {
  label: string;
  href: string;
  icon: IconType;
  badge?: number;
}

interface MobileBottomNavigationProps {
  className?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  className = '',
  showAddButton = true,
  onAddClick
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: BottomNavItem[] = [
    {
      label: 'ホーム',
      href: '/menu',
      icon: FaHome,
    },
    {
      label: 'タスク',
      href: '/tasks',
      icon: FaTasks,
    },
    {
      label: '進捗',
      href: '/progress',
      icon: FaChartBar,
    },
    {
      label: '設定',
      href: '/settings',
      icon: FaCog,
    },
  ];

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      router.push('/tasks');
    }
  };

  return (
    <>
      {/* ボトムナビゲーション - モバイルのみ表示 */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${className}`}>
        {/* セーフエリア対応の背景 */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-around py-2 pb-safe">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] transition-colors ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="relative">
                    {React.createElement(Icon as React.ComponentType<any>, { className: "w-5 h-5" })}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* フローティングアクションボタン - モバイルのみ表示 */}
      {showAddButton && (
        <button
          onClick={handleAddClick}
          className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        >
          {React.createElement(FaPlus as React.ComponentType<any>, { className: "w-6 h-6" })}
        </button>
      )}

      {/* ボトムナビゲーション分のスペース確保 - モバイルのみ */}
      <div className="md:hidden h-16" />
    </>
  );
}; 