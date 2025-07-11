'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IconType } from 'react-icons/lib';
import { 
  FaHome, 
  FaChartBar, 
  FaCog,
  FaPlus,
  FaArchive,
  FaTrophy,
  FaMagic
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
  const [isFABPressed, setIsFABPressed] = useState(false);
  const [isFABHovered, setIsFABHovered] = useState(false);
  const [isFABVisible, setIsFABVisible] = useState(false);

  // FABの初期表示アニメーション
  useEffect(() => {
    if (showAddButton) {
      const timer = setTimeout(() => setIsFABVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showAddButton]);

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

  const handleFABPress = () => {
    setIsFABPressed(true);
    setTimeout(() => setIsFABPressed(false), 150);
    handleAddClick();
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
        <div className={`md:hidden fixed bottom-20 right-5 z-50 transition-all duration-500 transform ${
          isFABVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <button
            onClick={handleFABPress}
            onTouchStart={() => setIsFABPressed(true)}
            onTouchEnd={() => setTimeout(() => setIsFABPressed(false), 150)}
            onMouseEnter={() => setIsFABHovered(true)}
            onMouseLeave={() => setIsFABHovered(false)}
            className={`w-16 h-16 bg-gradient-to-br from-[#8b4513] via-[#7c5a2a] to-[#6b4423] hover:from-[#7c5a2a] hover:via-[#8b4513] hover:to-[#7c5a2a] text-white rounded-full shadow-2xl hover:shadow-3xl border-2 border-[#deb887]/30 hover:border-[#deb887]/50 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center group relative overflow-hidden ${
              isFABPressed ? 'scale-95 shadow-lg' : ''
            }`}
            title="新しいタスクを追加"
          >
            {/* メインアイコン */}
            <div className="relative z-10 transition-all duration-300">
              {isFABHovered ? (
                React.createElement(FaMagic as React.ComponentType<any>, { 
                  className: "w-7 h-7 transition-all duration-300 group-hover:rotate-12" 
                })
              ) : (
                React.createElement(FaPlus as React.ComponentType<any>, { 
                  className: "w-7 h-7 transition-all duration-300 group-hover:rotate-90" 
                })
              )}
            </div>
            
            {/* 光沢効果 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
            
            {/* パルスアニメーション */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#deb887]/30 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5" 
                 style={{ animationDuration: '2s' }} />
            
            {/* リップルエフェクト */}
            <div className={`absolute inset-0 rounded-full bg-white/30 transform scale-0 transition-transform duration-300 ${
              isFABPressed ? 'scale-100' : ''
            }`} />
            
            {/* 外側のグロー効果 */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#deb887]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            
            {/* 浮遊アニメーション */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#deb887]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                 style={{ 
                   animation: isFABHovered ? 'float 2s ease-in-out infinite' : 'none'
                 }} />
          </button>
          

        </div>
      )}

      {/* カスタムアニメーション用のスタイル */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {/* ボトムナビゲーション分のスペース確保 - モバイルのみ */}
      <div className="md:hidden h-16" />
    </>
  );
}; 