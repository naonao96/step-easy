'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaBook, FaShieldAlt, FaFileContract, FaQuestionCircle, FaHome, FaTasks, FaGem, FaSignInAlt, FaUserPlus, FaEye, FaDownload, FaTimes } from 'react-icons/fa';

export type ContentSection = 'home' | 'features' | 'plans' | 'guide' | 'privacy' | 'terms' | 'faq';

interface MobileLPLayoutProps {
  activeSection: ContentSection;
  onSectionChange: (section: ContentSection) => void;
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
  children: React.ReactNode;
}

export const MobileLPLayout: React.FC<MobileLPLayoutProps> = ({
  activeSection,
  onSectionChange,
  onLogin,
  onRegister,
  onGuest,
  isLoading,
  children
}) => {
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWAインストールプロンプト検出
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // 初回訪問時のみ表示
      if (!localStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => setShowPWAPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPWAPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    }
    
    setDeferredPrompt(null);
  };

  const dismissPWAPrompt = () => {
    setShowPWAPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const bottomNavItems = [
    { id: 'home' as ContentSection, label: 'ホーム', icon: FaHome },
    { id: 'features' as ContentSection, label: '機能', icon: FaTasks },
    { id: 'plans' as ContentSection, label: 'プラン', icon: FaGem },
    { id: 'guide' as ContentSection, label: 'ガイド', icon: FaBook },
    { id: 'faq' as ContentSection, label: 'その他', icon: FaQuestionCircle },
  ];

  const moreItems = [
    { id: 'privacy' as ContentSection, label: 'プライバシーポリシー', icon: FaShieldAlt },
    { id: 'terms' as ContentSection, label: '利用規約', icon: FaFileContract },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5dc] via-[#deb887] to-[#f5f5dc] flex flex-col">
      {/* ヘッダー */}
      <header className="bg-[#f5f5dc] shadow-sm border-b border-[#deb887] sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="StepEasy"
                width={32}
                height={32}
                className="drop-shadow-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-[#8b4513]">StepEasy</h1>
                <p className="text-xs text-[#7c5a2a]">習慣を育てる、成長を実感する</p>
              </div>
            </div>
            
            {/* ヘッダーアクション */}
            <div className="flex gap-2">
              <button
                onClick={onLogin}
                disabled={isLoading}
                className="px-3 py-1.5 bg-[#8b4513] hover:bg-[#7c5a2a] text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                ログイン
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PWAインストールプロンプト */}
      {showPWAPrompt && deferredPrompt && (
        <div className="bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] text-white p-4 relative z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {(FaDownload as any)({ className: "w-5 h-5 text-[#deb887]" })}
              <div className="flex-1">
                <p className="font-medium text-sm">アプリとして追加</p>
                <p className="text-xs text-[#deb887]">ホーム画面に追加して快適に利用</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePWAInstall}
                className="px-3 py-1.5 bg-white text-[#8b4513] text-sm rounded-lg font-medium"
              >
                追加
              </button>
              <button
                onClick={dismissPWAPrompt}
                className="p-1.5 text-[#deb887] hover:text-white"
              >
                {(FaTimes as any)({ className: "w-4 h-4" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pb-32">
        {children}
      </main>

      {/* アクションボタンエリア（プランページ以外で表示） */}
      {activeSection !== 'plans' && (
        <div className="fixed bottom-20 left-4 right-4 z-30">
          <div className="bg-[#f5f5dc] rounded-2xl shadow-xl border border-[#deb887] p-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onLogin}
                disabled={isLoading}
                className="flex flex-col items-center gap-1 px-4 py-3 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {(FaSignInAlt as any)({ className: "w-4 h-4" })}
                <span className="text-xs">ログイン</span>
              </button>
              <button
                onClick={onRegister}
                disabled={isLoading}
                className="flex flex-col items-center gap-1 px-4 py-3 bg-[#7c5a2a] hover:bg-[#8b4513] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {(FaUserPlus as any)({ className: "w-4 h-4" })}
                <span className="text-xs">新規登録</span>
              </button>
              <button
                onClick={onGuest}
                disabled={isLoading}
                className="flex flex-col items-center gap-1 px-4 py-3 bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {(FaEye as any)({ className: "w-4 h-4" })}
                <span className="text-xs">ゲスト</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#f5f5dc] border-t border-[#deb887] shadow-lg z-40">
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-[#8b4513] bg-[#deb887]'
                    : 'text-[#7c5a2a] hover:text-[#8b4513]'
                }`}
              >
                {(IconComponent as any)({ className: `w-5 h-5 ${isActive ? 'text-[#8b4513]' : ''}` })}
                <span className={`text-xs font-medium ${isActive ? 'text-[#8b4513]' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>


    </div>
  );
}; 