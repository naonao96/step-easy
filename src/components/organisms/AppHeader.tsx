'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/atoms/Button';
import { NotificationDropdown } from '@/components/molecules/NotificationDropdown';
import { HelpPanel } from '@/components/molecules/HelpPanel';
import { FaArrowLeft, FaSignOutAlt, FaUser, FaQuestionCircle } from 'react-icons/fa';
import { Task } from '@/types/task';

interface AppHeaderProps {
  // ページ固有の設定
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  
  // 右側のアクション
  rightActions?: React.ReactNode;
  
  // 通知機能
  tasks?: Task[];
  showNotifications?: boolean;
  
  // モバイルメニュー制御
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  
  // スタイリング
  variant?: 'default' | 'minimal' | 'transparent';
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  backUrl = '/menu',
  backLabel = '戻る',
  rightActions,
  tasks = [],
  showNotifications = true,
  showMobileMenu = false,
  onMobileMenuToggle,
  variant = 'default',
  className = ''
}) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/lp');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleBack = () => {
    router.push(backUrl);
  };

  // アカウントメニューを閉じる（外側クリック時）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

  // ヘルプパネル開く指示をリッスン
  useEffect(() => {
    const handleOpenHelp = (event: any) => {
      setShowHelpPanel(true);
      // タブの切り替えは実装後に対応
    };

    window.addEventListener('openHelp', handleOpenHelp);
    return () => {
      window.removeEventListener('openHelp', handleOpenHelp);
    };
  }, []);

  // バリアント別のスタイル
  const getHeaderStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-white border-b border-gray-200';
      case 'transparent':
        return 'bg-transparent';
      default:
        return 'bg-white border-b border-gray-200';
    }
  };

  return (
    <header className={`h-20 flex justify-between items-center px-4 sm:px-6 flex-shrink-0 shadow-sm ${getHeaderStyles()} ${className}`}>
      {/* 左側：モバイルハンバーガー + 戻るボタン + タイトル/ロゴ */}
      <div className="flex items-center gap-3">
        {/* ハンバーガーボタンを削除 - ボトムナビゲーションを使用 */}

        {/* 戻るボタン（デスクトップのみ） */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            leftIcon={FaArrowLeft}
            className="hidden md:flex text-gray-600 hover:text-gray-800"
          >
            <span className="text-sm">{backLabel}</span>
          </Button>
        )}

        {/* ロゴ（常に表示） */}
        <div 
          className="cursor-pointer flex items-center gap-3"
          onClick={() => router.push('/menu')}
        >
          <img src="/logo.png" alt="StepEasy" className="h-8 sm:h-10" style={{ width: 'auto' }} />
          {title && (
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          )}
          </div>
      </div>

      {/* 右側：通知 + デスクトップアクション + ユーザー情報 */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 通知ドロップダウン */}
        {showNotifications && tasks.length > 0 && (
          <NotificationDropdown tasks={tasks} />
        )}

        {/* ヘルプボタン */}
        <button
          onClick={() => setShowHelpPanel(true)}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="ヘルプ"
        >
          {FaQuestionCircle({ className: "w-5 h-5" })}
        </button>

        {/* カスタムアクション（デスクトップのみ） */}
        {rightActions && (
          <div className="hidden md:flex items-center gap-2">
            {rightActions}
          </div>
        )}

        {/* アカウントドロップダウン（デスクトップのみ） */}
        <div className="relative hidden lg:flex" ref={accountMenuRef}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
              </span>
            </div>
            <span className="text-sm text-gray-700 font-medium max-w-32 truncate">
              {user?.isGuest ? 'ゲストユーザー' : (user?.displayName || user?.email?.split('@')[0] || 'ユーザー')}
            </span>
          </button>

          {/* ドロップダウンメニュー */}
          {showAccountMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {user?.isGuest ? (
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    router.push('/login');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {FaUser({ className: "w-4 h-4" })}
                  ログイン
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {FaSignOutAlt({ className: "w-4 h-4" })}
                  ログアウト
                </button>
              )}
            </div>
          )}
        </div>

        {/* ユーザーアバター（モバイル用） */}
        <button
          onClick={() => setShowAccountMenu(!showAccountMenu)}
          className="lg:hidden w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-sm font-medium">
            {user?.isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
          </span>
        </button>

        {/* モバイル用ドロップダウンメニュー */}
        {showAccountMenu && (
          <div className="absolute lg:hidden right-4 top-16 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {user?.isGuest ? (
              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  router.push('/login');
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {FaUser({ className: "w-4 h-4" })}
                ログイン
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  handleSignOut();
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {FaSignOutAlt({ className: "w-4 h-4" })}
                ログアウト
              </button>
            )}
          </div>
        )}
      </div>

      {/* ヘルプパネル */}
      <HelpPanel 
        isOpen={showHelpPanel} 
        onClose={() => setShowHelpPanel(false)} 
      />
    </header>
  );
}; 