'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const AppHeader: React.FC = () => {
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

  return (
    <header className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-blue-50 border-b border-blue-100 flex-shrink-0">
      {/* ロゴ */}
      <div 
        className="cursor-pointer"
        onClick={() => router.push('/menu')}
      >
        <img src="/logo.png" alt="StepEasy" className="h-7 sm:h-8" />
      </div>

      {/* 右側のアカウント情報とボタン */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* アカウント情報 */}
        <div className="flex items-center gap-2 hidden sm:flex">
          {/* アバター */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
            </span>
          </div>
          {/* ユーザー名 */}
          <span className="text-sm text-gray-700 font-medium">
            {user?.isGuest ? 'ゲストユーザー' : (user?.email?.split('@')[0] || 'ユーザー')}
          </span>
        </div>
        
        {/* 設定ボタン */}
        <button
          className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1 bg-white border rounded shadow hover:bg-gray-50 transition-colors touch-manipulation"
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
            ログアウト
          </button>
        )}
      </div>
    </header>
  );
}; 