'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FaBook, FaShieldAlt, FaFileContract, FaQuestionCircle, FaHome, FaGem, FaSignInAlt, FaUserPlus, FaEye } from 'react-icons/fa';

export type ContentSection = 'home' | 'plans' | 'guide' | 'privacy' | 'terms' | 'faq';

interface ModernLPLayoutProps {
  activeSection: ContentSection;
  onSectionChange: (section: ContentSection) => void;
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
  children: React.ReactNode;
}

export const ModernLPLayout: React.FC<ModernLPLayoutProps> = ({
  activeSection,
  onSectionChange,
  onLogin,
  onRegister,
  onGuest,
  isLoading,
  children
}) => {
  const sidebarItems = [
    { id: 'home' as ContentSection, label: 'ホーム', icon: FaHome },
    { id: 'plans' as ContentSection, label: 'プラン比較', icon: FaGem },
    { id: 'guide' as ContentSection, label: '機能ガイド', icon: FaBook },
    { id: 'privacy' as ContentSection, label: 'プライバシーポリシー', icon: FaShieldAlt },
    { id: 'terms' as ContentSection, label: '利用規約', icon: FaFileContract },
    { id: 'faq' as ContentSection, label: 'よくある質問', icon: FaQuestionCircle },
  ];

  return (
    <div className="min-h-screen">
      {/* サイドバー */}
      <div className="fixed left-0 top-0 w-64 h-full bg-gradient-to-b from-[#f7ecd7] to-[#f5e9da] backdrop-blur-sm border-r border-[#deb887]/30 shadow-lg flex flex-col z-50">
        {/* ロゴエリア */}
        <div className="p-4 border-b border-[#deb887]/40">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="StepEasy"
              width={80}
              height={80}
              className="h-8 sm:h-10 w-auto drop-shadow-lg"
              priority
              quality={100}
            />
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    // プライバシーポリシーと利用規約は専用ページを開く
                    if (item.id === 'privacy') {
                      window.open('/privacy', '_blank');
                    } else if (item.id === 'terms') {
                      window.open('/terms', '_blank');
                    } else {
                      onSectionChange(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#f5f5dc]/80 text-[#8b4513]'
                      : 'text-[#7c5a2a] hover:bg-[#f5f5dc]/80 hover:text-[#8b4513]'
                  }`}
                >
                  {(IconComponent as any)({ className: "w-5 h-5 shrink-0" })}
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* アクションボタン */}
        <div className="p-2 border-t border-[#deb887]/40">
          <div className="space-y-1">
            <button
              onClick={onLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {(FaSignInAlt as any)({ className: "w-4 h-4" })}
              ログイン
            </button>
            {/* 新規登録ボタン削除済み */}
            <button
              onClick={onGuest}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {(FaEye as any)({ className: "w-4 h-4" })}
              ゲストで試す
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="ml-64 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}; 