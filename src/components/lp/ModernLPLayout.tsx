'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FaBook, FaShieldAlt, FaFileContract, FaQuestionCircle, FaHome, FaTasks, FaGem, FaSignInAlt, FaUserPlus, FaEye } from 'react-icons/fa';

export type ContentSection = 'home' | 'features' | 'plans' | 'guide' | 'privacy' | 'terms' | 'faq';

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
    { id: 'features' as ContentSection, label: '機能紹介', icon: FaTasks },
    { id: 'plans' as ContentSection, label: 'プラン比較', icon: FaGem },
    { id: 'guide' as ContentSection, label: '機能ガイド', icon: FaBook },
    { id: 'privacy' as ContentSection, label: 'プライバシーポリシー', icon: FaShieldAlt },
    { id: 'terms' as ContentSection, label: '利用規約', icon: FaFileContract },
    { id: 'faq' as ContentSection, label: 'よくある質問', icon: FaQuestionCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* サイドバー */}
      <div className="w-64 bg-white shadow-xl border-r border-slate-200 flex flex-col">
        {/* ロゴエリア */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="StepEasy"
              width={40}
              height={40}
              className="drop-shadow-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900">StepEasy</h1>
              <p className="text-xs text-slate-600">習慣を育てる、成長を実感する</p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {(IconComponent as any)({ className: "w-5 h-5" })}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* アクションボタン */}
        <div className="p-4 border-t border-slate-200">
          <div className="space-y-2">
            <button
              onClick={onLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {(FaSignInAlt as any)({ className: "w-4 h-4" })}
              ログイン
            </button>
            <button
              onClick={onRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {(FaUserPlus as any)({ className: "w-4 h-4" })}
              新規登録
            </button>
            <button
              onClick={onGuest}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {(FaEye as any)({ className: "w-4 h-4" })}
              ゲストで試す
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}; 