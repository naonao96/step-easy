'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/organisms/AppHeader';
import { MobileNavigation } from '@/components/organisms/MobileNavigation';

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
  className = '',
  showMobileNav = true,
  contextActions = []
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ホームバリアント（メニュー画面用）
  if (variant === 'home') {
    return (
      <div className="h-screen bg-blue-50 flex flex-col">
        {/* シンプルなヘッダー（ロゴとアカウント情報のみ） */}
        <AppHeader 
          variant="default"
          showMobileMenu={showMobileMenu}
          onMobileMenuToggle={showMobileNav ? () => setShowMobileMenu(!showMobileMenu) : undefined}
        />
        
        {/* モバイルナビゲーション */}
        {showMobileNav && (
          <MobileNavigation 
            isOpen={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
            contextActions={contextActions}
          />
        )}
        
        {/* メインコンテンツエリア（既存のスタイルを維持） */}
        <main className={`flex-1 overflow-y-auto ${className}`}>
          {children}
        </main>
      </div>
    );
  }

  // 通常バリアント（タスク管理画面など用）
  return (
    <div className="h-screen bg-blue-50 flex flex-col">
      {/* 拡張されたヘッダー */}
      <AppHeader 
        title={title}
        showBackButton={showBackButton}
        backUrl={backUrl}
        backLabel={backLabel}
        rightActions={rightActions}
        variant={headerVariant}
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={showMobileNav ? () => setShowMobileMenu(!showMobileMenu) : undefined}
      />
      
      {/* モバイルナビゲーション */}
      {showMobileNav && (
        <MobileNavigation 
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          contextActions={contextActions}
        />
      )}
      
      {/* メインコンテンツエリア */}
      <main className={`flex-1 overflow-y-auto ${className}`}>
        {children}
      </main>
    </div>
  );
}; 