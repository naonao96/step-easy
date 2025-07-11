'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/atoms/Button';
import { NotificationDropdown } from '@/components/molecules/NotificationDropdown';
import { FaArrowLeft, FaSignOutAlt, FaUser, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { Task } from '@/types/task';

interface AppHeaderProps {
  // ページ固有の設定
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  onBackClick?: () => void;
  
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
  onBackClick,
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
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileAccountMenuRef = useRef<HTMLDivElement>(null);

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
      const target = event.target as Node;
      
      // デスクトップ用メニュー
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        // モバイル用メニューも確認
        if (mobileAccountMenuRef.current && !mobileAccountMenuRef.current.contains(target)) {
          setShowAccountMenu(false);
        }
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

  // バリアント別のスタイル
  const getHeaderStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'wood-frame wood-frame-header';
      case 'transparent':
        return 'bg-transparent';
      default:
        return 'wood-frame wood-frame-header';
    }
  };

  return (
    <header className={`h-16 md:h-20 flex justify-between items-center px-4 sm:px-6 flex-shrink-0 woodgrain-header-bg ${getHeaderStyles()} ${className} md:relative md:top-auto md:left-auto md:right-auto fixed top-0 left-0 right-0 z-40 md:relative md:z-auto pt-safe md:pt-0`}>
      {/* 左側：モバイルハンバーガー + 戻るボタン + タイトル/ロゴ */}
      <div className="flex items-center gap-3">
        {/* ハンバーガーボタンを削除 - ボトムナビゲーションを使用 */}

        {/* 戻るボタン（デスクトップのみ） */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick || handleBack}
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
          <h1 className="text-lg sm:text-xl font-bold text-[#8b4513] truncate">
            {title}
          </h1>
          )}
          </div>
      </div>

      {/* 右側：通知 + デスクトップアクション + ユーザー情報 */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 通知ドロップダウン */}
        {showNotifications && (
          <div className="text-[#7c5a2a] hover:text-yellow-900">
            <NotificationDropdown tasks={tasks} />
          </div>
        )}

        {/* カスタムアクション（デスクトップのみ） */}
        {rightActions && (
          <div className="hidden md:flex items-center gap-2">
            {rightActions}
          </div>
        )}

        {/* アカウントドロップダウン（デスクトップのみ） */}
        <div className="relative hidden lg:block" ref={accountMenuRef}>
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#7c5a2a] to-[#4b2e0e] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
              </span>
            </div>
            <span className="text-sm text-gray-700 hidden xl:block">
              {user?.isGuest ? 'ゲスト' : (user?.email?.split('@')[0] || 'ユーザー')}
            </span>
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
              {user?.isGuest ? (
                <>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      router.push('/register');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {FaUserPlus({ className: "w-4 h-4 flex-shrink-0" })}
                    <span>新規登録</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      router.push('/login');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {FaSignInAlt({ className: "w-4 h-4 flex-shrink-0" })}
                    <span>ログイン</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {FaSignOutAlt({ className: "w-4 h-4 flex-shrink-0" })}
                  <span>ログアウト</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* モバイル用アカウントボタン */}
        <button
          onClick={() => setShowAccountMenu(!showAccountMenu)}
          className="lg:hidden p-1 w-10 h-10 bg-gradient-to-br from-[#7c5a2a] to-[#4b2e0e] rounded-full flex items-center justify-center hover:shadow-md transition-all"
          title="アカウントメニュー"
        >
          <span className="text-white text-sm font-medium">
            {user?.isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
          </span>
        </button>

        {/* モバイル用ドロップダウンメニュー */}
        {showAccountMenu && (
          <div className="absolute lg:hidden right-2 top-16 w-44 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999]" ref={mobileAccountMenuRef}>
            {user?.isGuest ? (
              <>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    router.push('/register');
                  }}
                  className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {FaUserPlus({ className: "w-4 h-4 flex-shrink-0" })}
                  <span>新規登録</span>
                </button>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    router.push('/login');
                  }}
                  className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {FaSignInAlt({ className: "w-4 h-4 flex-shrink-0" })}
                  <span>ログイン</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  handleSignOut();
                }}
                className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {FaSignOutAlt({ className: "w-4 h-4 flex-shrink-0" })}
                <span>ログアウト</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}; 