'use client';

import React from 'react';
import { AppHeader } from '@/components/organisms/AppHeader';
import { MobileBottomNavigation } from '@/components/organisms/MobileBottomNavigation';
import { LeftSidebar } from '@/components/organisms/LeftSidebar';
import { CloudLayer } from '@/components/CloudLayer';

import { Task } from '@/types/task';

interface AppLayoutProps {
  children: React.ReactNode;
  
  // レイアウトバリアント
  variant?: 'default' | 'home' | 'minimal';
  
  // ヘッダー設定（default/minimalバリアント用）
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  onBackClick?: () => void;
  rightActions?: React.ReactNode;
  headerVariant?: 'default' | 'minimal' | 'transparent';
  
  // 通知機能
  tasks?: Task[];
  showNotifications?: boolean;
  
  // レイアウト設定
  className?: string;

  // モバイル専用設定
  showBottomNav?: boolean;
  showFAB?: boolean;
  onFABClick?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  variant = 'default',
  title,
  showBackButton = false,
  backUrl = '/menu',
  backLabel = '戻る',
  onBackClick,
  rightActions,
  headerVariant = 'default',
  tasks = [],
  showNotifications = true,
  className = '',
  showBottomNav = true,
  showFAB = false,
  onFABClick
}) => {
  // モバイルメニュー関連のstateを削除（ボトムナビゲーションを使用）

  // ホームバリアント（メニュー画面用）
  if (variant === 'home') {
    return (
      <div className="flex flex-col h-screen">
        {/* ヘッダー（固定・非縮小） */}
        <AppHeader 
          variant="default"
          tasks={tasks}
          showNotifications={showNotifications}
          showMobileMenu={false}
          onMobileMenuToggle={undefined}
          className="h-20 flex-shrink-0 wood-frame wood-frame-header"
        />
        {/* メインエリア（ヘッダー下の残りスペース） */}
        <div className="flex flex-1 overflow-hidden">
          {/* サイドバー（固定幅・非縮小） */}
          <LeftSidebar className="hidden lg:block w-16 flex-shrink-0" />
          {/* メインコンテンツ（残りスペース・スクロール可能） */}
          <main className="flex-1 overflow-y-auto md:pb-0 pb-20">
          {children}
        </main>
        </div>
        {/* モバイル専用ボトムナビゲーション */}
        {showBottomNav && (
          <MobileBottomNavigation 
            showAddButton={showFAB}
            onAddClick={onFABClick}
          />
        )}
      </div>
    );
  }

  // 通常バリアント（タスク管理画面など用）
  return (
    <div className="flex flex-col h-screen">
      <AppHeader 
        title={title}
        showBackButton={showBackButton}
        backUrl={backUrl}
        backLabel={backLabel}
        onBackClick={onBackClick}
        rightActions={rightActions}
        variant={headerVariant}
        tasks={tasks}
        showNotifications={showNotifications}
        showMobileMenu={false}
        onMobileMenuToggle={undefined}
        className="h-20 flex-shrink-0 wood-frame wood-frame-header"
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar className="hidden md:block w-16 flex-shrink-0" />
        <main className="flex-1 overflow-y-auto md:pb-0 pb-20">
        {children}
      </main>
      </div>
      {showBottomNav && (
        <MobileBottomNavigation 
          showAddButton={showFAB}
          onAddClick={onFABClick}
        />
      )}
    </div>
  );
}; 