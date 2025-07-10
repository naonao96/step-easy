'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IconType } from 'react-icons/lib';
import { 
  FaHome, 
  FaChartBar, 
  FaCog,
  FaPlus,
  FaArchive,
  FaTrophy
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
  const { isGuest, canAddTaskOnDate } = useAuth();

  // プラン別でナビゲーションアイテムをフィルタリング
  const getAvailableNavItems = (): BottomNavItem[] => {
    const baseItems: BottomNavItem[] = [
      {
        label: 'ホーム',
        href: '/menu',
        icon: FaHome,
      }
    ];

    // ゲストユーザー以外は進捗、アーカイブ、設定を追加
    if (!isGuest) {
      baseItems.push(
        {
          label: '統計情報',
          href: '/progress',
          icon: FaChartBar,
        },
        {
          label: 'アーカイブ',
          href: '/archive',
          icon: FaArchive,
        },
        {
          label: '設定',
          href: '/settings',
          icon: FaCog,
        }
      );
    }

    return baseItems;
  };

  const navItems = getAvailableNavItems();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      // タスク追加制限をチェック
      const { canAdd, message } = canAddTaskOnDate(new Date());
      if (!canAdd) {
        alert(message);
        return;
      }
      // 現在のタブに応じて直接モーダル表示
      // メニューページではタブ状態を管理しているため、デフォルトでタスクモーダルを表示
      const event = new CustomEvent('showTaskModal', {
        detail: { show: true }
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <>
      {/* ボトムナビゲーション - モバイルのみ表示 */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${className}`}>
        {/* セーフエリア対応の背景 */}
        <div className="wood-frame-sidebar border-t border-[#deb887] shadow-lg">
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
                      ? 'text-[#7c5a2a]' 
                      : 'text-gray-700 hover:text-[#7c5a2a]'
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
                    isActive ? 'text-[#7c5a2a]' : 'text-gray-700'
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
          title="新しいタスクを追加"
        >
          {React.createElement(FaPlus as React.ComponentType<any>, { className: "w-6 h-6" })}
        </button>
      )}

      {/* ボトムナビゲーション分のスペース確保 - モバイルのみ */}
      <div className="md:hidden h-16" />
    </>
  );
}; 