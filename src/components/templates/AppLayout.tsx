'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/organisms/AppHeader';
import { MobileNavigation } from '@/components/organisms/MobileNavigation';
import { MobileBottomNavigation } from '@/components/organisms/MobileBottomNavigation';
import { LeftSidebar } from '@/components/organisms/LeftSidebar';

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
  rightActions?: React.ReactNode;
  headerVariant?: 'default' | 'minimal' | 'transparent';
  
  // 通知機能
  tasks?: Task[];
  showNotifications?: boolean;
  
  // レイアウト設定
  className?: string;
  showMobileNav?: boolean;
  
  // コンテキスト依存のアクション（ハンバーガーメニュー用）
  contextActions?: {
    label: string;
    action: () => void;
    icon?: any;
    variant?: 'default' | 'primary' | 'danger';
  }[];

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
  rightActions,
  headerVariant = 'default',
  tasks = [],
  showNotifications = true,
  className = '',
  showMobileNav = true,
  contextActions = [],
  showBottomNav = true,
  showFAB = true,
  onFABClick
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ホームバリアント（メニュー画面用）
  if (variant === 'home') {
    return (
      <div className="h-screen bg-blue-50">
        {/* 固定ヘッダー */}
        <AppHeader 
          variant="default"
          tasks={tasks}
          showNotifications={showNotifications}
          showMobileMenu={showMobileMenu}
          onMobileMenuToggle={showMobileNav ? () => setShowMobileMenu(!showMobileMenu) : undefined}
          className="fixed top-0 left-0 right-0 z-50"
        />
        
        {/* 左サイドバー（デスクトップのみ） */}
        <LeftSidebar className="hidden lg:block" />
        
        {/* モバイルナビゲーション */}
        {showMobileNav && (
          <MobileNavigation 
            isOpen={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
            contextActions={contextActions}
          />
        )}
        
        {/* メインコンテンツエリア */}
        <main className={`pt-20 lg:ml-16 overflow-y-auto min-h-screen ${
          showBottomNav ? 'pb-16 md:pb-0' : ''
        } ${className}`}>
          {children}
        </main>

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
    <div className="h-screen bg-blue-50">
      {/* 固定ヘッダー */}
      <AppHeader 
        title={title}
        showBackButton={showBackButton}
        backUrl={backUrl}
        backLabel={backLabel}
        rightActions={rightActions}
        variant={headerVariant}
        tasks={tasks}
        showNotifications={showNotifications}
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={showMobileNav ? () => setShowMobileMenu(!showMobileMenu) : undefined}
        className="fixed top-0 left-0 right-0 z-50"
      />
      
      {/* 左サイドバー（デスクトップのみ） */}
      <LeftSidebar className="hidden lg:block" />
      
      {/* モバイルナビゲーション */}
      {showMobileNav && (
        <MobileNavigation 
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          contextActions={contextActions}
        />
      )}
      
      {/* メインコンテンツエリア */}
      <main className={`pt-20 lg:ml-16 overflow-y-auto min-h-screen ${
        showBottomNav ? 'pb-16 md:pb-0' : ''
      } ${className}`}>
        {children}
      </main>

      {/* モバイル専用ボトムナビゲーション */}
      {showBottomNav && (
        <MobileBottomNavigation 
          showAddButton={showFAB}
          onAddClick={onFABClick}
        />
      )}
    </div>
  );
}; 