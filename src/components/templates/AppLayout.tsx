'use client';

import React from 'react';
import { AppHeader } from '@/components/organisms/AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="h-screen bg-blue-50 flex flex-col">
      {/* 共通ヘッダー */}
      <AppHeader />
      
      {/* メインコンテンツエリア */}
      <main className={`flex-1 overflow-y-auto ${className}`}>
        {children}
      </main>
    </div>
  );
}; 