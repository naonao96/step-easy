'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/atoms/Button';
import { NotificationDropdown } from '@/components/molecules/NotificationDropdown';
import { FaArrowLeft, FaSignOutAlt, FaUser, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { Task } from '@/types/task';
import Image from 'next/image';

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
        return '';
      case 'transparent':
        return 'bg-transparent';
      default:
        return '';
    }
  };

  return (
    <header className={`h-16 md:h-20 flex justify-between items-center px-4 sm:px-6 flex-shrink-0 bg-gradient-to-b from-[#f7ecd7] to-[#f5e9da] border-b border-[#deb887]/30 backdrop-blur-sm shadow-none ${getHeaderStyles()} ${className} fixed top-0 left-0 right-0 z-40 pt-safe`}>
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
            className="hidden md:flex text-[#7c5a2a] hover:text-[#8b4513]"
          >
            <span className="text-sm">{backLabel}</span>
          </Button>
        )}

        {/* ロゴ（常に表示） */}
        <div 
          className="cursor-pointer flex items-center gap-3"
          onClick={() => router.push('/menu')}
        >
          <img 
            src="/logo.png" 
            alt="StepEasy" 
            className="h-8 sm:h-10 w-auto"
            style={{ width: 'auto' }}
            loading="eager"
            decoding="sync"
          />
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
          <div className="text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200">
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
            className="flex items-center gap-2 p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 font-medium bg-transparent border-none shadow-none group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c5a2a] to-[#4b2e0e] flex items-center justify-center text-white text-sm font-medium transition-colors duration-200 group-hover:from-[#a67c52] group-hover:to-[#c9b29b]">
              {user?.isGuest ? 'G' : (user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U')}
            </div>
            <span className="text-sm hidden xl:block">
              {user?.isGuest ? 'ゲスト' : (user?.displayName || user?.email?.split('@')[0] || 'ユーザー')}
            </span>
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-[#deb887]/20 py-1 z-50">
              {user?.isGuest ? (
                <>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      router.push('/register');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#7c5a2a] hover:bg-[#deb887]/10 transition-all duration-200"
                  >
                    {FaUserPlus({ className: "w-4 h-4 flex-shrink-0" })}
                    <span>新規登録</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      router.push('/login');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#7c5a2a] hover:bg-[#deb887]/10 transition-all duration-200"
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
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#7c5a2a] hover:bg-[#deb887]/10 transition-all duration-200"
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
          className="lg:hidden p-1 w-10 h-10 bg-gradient-to-br from-[#7c5a2a] to-[#4b2e0e] rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 hover:scale-105"
          title="アカウントメニュー"
        >
          <span className="text-white text-sm font-medium">
            {user?.isGuest ? 'G' : (user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U')}
          </span>
        </button>

        {/* モバイル用ドロップダウンメニュー */}
        {showAccountMenu && (
          <div className="absolute lg:hidden right-2 top-16 w-44 sm:w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-[#deb887]/20 py-1 z-[9999]" ref={mobileAccountMenuRef}>
            {user?.isGuest ? (
              <>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    router.push('/register');
                  }}
                  className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 text-sm text-[#7c5a2a] hover:bg-[#deb887]/10 transition-all duration-200"
                >
                  {FaUserPlus({ className: "w-4 h-4 flex-shrink-0" })}
                  <span>新規登録</span>
                </button>
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    router.push('/login');
                  }}
                  className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 text-sm text-[#7c5a2a] hover:bg-[#deb887]/10 transition-all duration-200"
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
                className="flex items-center gap-3 w-full px-3 sm:px-4 py-2 text-sm text-[#7c5a2a] hover:bg-[#deb887]/10 transition-all duration-200"
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