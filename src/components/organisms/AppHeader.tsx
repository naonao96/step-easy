'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/atoms/Button';
import { FaArrowLeft, FaBars, FaTimes } from 'react-icons/fa';

interface AppHeaderProps {
  // ページ固有の設定
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  
  // 右側のアクション
  rightActions?: React.ReactNode;
  
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
  showMobileMenu = false,
  onMobileMenuToggle,
  variant = 'default',
  className = ''
}) => {
  const router = useRouter();
  const { user, signOut } = useAuth();

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

  // バリアント別のスタイル
  const getHeaderStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-white border-b border-gray-200';
      case 'transparent':
        return 'bg-transparent';
      default:
        return 'bg-blue-50 border-b border-blue-100';
    }
  };

  return (
    <header className={`flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 ${getHeaderStyles()} ${className}`}>
      {/* 左側：モバイルメニューボタン + 戻るボタン + タイトル or ロゴ */}
      <div className="flex items-center gap-3">
        {/* モバイルメニューボタン */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {showMobileMenu ? FaTimes({ className: "w-5 h-5" }) : FaBars({ className: "w-5 h-5" })}
          </button>
        )}

        {/* 戻るボタン */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            leftIcon={FaArrowLeft}
            className="text-gray-600 hover:text-gray-800"
          >
            <span className="hidden sm:inline">{backLabel}</span>
          </Button>
        )}

        {/* タイトル or ロゴ */}
        {title ? (
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {title}
          </h1>
        ) : (
          <div 
            className="cursor-pointer"
            onClick={() => router.push('/menu')}
          >
            <img src="/logo.png" alt="StepEasy" className="h-7 sm:h-8" />
          </div>
        )}
      </div>

      {/* 右側：カスタムアクション + アカウント情報 */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* カスタムアクション */}
        {rightActions && (
          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        )}

        {/* アカウント情報（デスクトップのみ） */}
        <div className="flex items-center gap-2 hidden lg:flex">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
            </span>
          </div>
          <span className="text-sm text-gray-700 font-medium max-w-32 truncate">
            {user?.isGuest ? 'ゲストユーザー' : (user?.email?.split('@')[0] || 'ユーザー')}
          </span>
        </div>

        {/* 設定ボタン */}
        <button
          className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1 bg-white border rounded shadow hover:bg-gray-50 transition-colors touch-manipulation hidden sm:inline-block"
          onClick={() => router.push('/settings')}
        >
          設定
        </button>

        {/* ログイン/ログアウトボタン */}
        {user?.isGuest ? (
          <button
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition-colors touch-manipulation"
            onClick={() => router.push('/login')}
          >
            ログイン
          </button>
        ) : (
          <button
            className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1 bg-red-500 text-white rounded shadow hover:bg-red-600 transition-colors touch-manipulation"
            onClick={handleSignOut}
          >
            <span className="hidden sm:inline">ログアウト</span>
            <span className="sm:hidden">OUT</span>
          </button>
        )}
      </div>
    </header>
  );
}; 