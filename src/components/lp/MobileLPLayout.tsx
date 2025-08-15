'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaBook, FaShieldAlt, FaFileContract, FaQuestionCircle, FaHome, FaGem, FaSignInAlt, FaUserPlus, FaEye, FaDownload, FaTimes } from 'react-icons/fa';

export type ContentSection = 'home' | 'plans' | 'privacy' | 'terms' | 'faq';

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
    { id: 'plans' as ContentSection, label: 'プラン', icon: FaGem },
    { id: 'faq' as ContentSection, label: 'その他', icon: FaQuestionCircle },
  ];

  const moreItems = [
    { id: 'privacy' as ContentSection, label: 'プライバシーポリシー', icon: FaShieldAlt },
    { id: 'terms' as ContentSection, label: '利用規約', icon: FaFileContract },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="h-16 md:h-20 bg-gradient-to-b from-[#f7ecd7] to-[#f5e9da] backdrop-blur-sm shadow-lg border-b border-[#deb887]/30 sticky top-0 z-40 pt-safe">
        <div className="px-4 sm:px-6 h-full flex items-center">
          <div className="flex items-center justify-between w-full">
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
            
            {/* ヘッダーアクション */}
            <div className="flex gap-2">
              <button
                onClick={onLogin}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-[#8b4513] hover:bg-[#7c5a2a] text-white text-xs rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {(FaSignInAlt as any)({ className: "w-3 h-3" })}
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
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>



      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#f7ecd7] to-[#f5e9da] backdrop-blur-sm border-t border-[#deb887]/30 shadow-lg z-40 pb-safe">
        <div className="grid grid-cols-3 h-16">
          {bottomNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-[#8b4513] bg-[#f5f5dc]/80'
                    : 'text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc]/80'
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