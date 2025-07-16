'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lottie Playerを動的インポート
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => ({ default: mod.Player })), {
  ssr: false,
  loading: () => <div className="w-[200px] h-[200px] mx-auto bg-gray-100 rounded-lg animate-pulse"></div>
});

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, onSkip }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Lottieアニメーション */}
      <div className="mb-8">
        {isClient && (
          <Player
            autoplay
            loop
            src="/animations/Welcome.json"
            style={{ height: '200px', width: '200px' }}
            className="mx-auto"
          />
        )}
      </div>

      {/* メインテキスト */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-4xl font-bold leading-tight mb-6 relative">
          {/* 背景レイヤー（影効果） */}
          <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
          
          {/* メインテキスト */}
          <div className="relative z-10 text-[#4a3728]" 
               style={{ 
                 textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                 filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
               }}>
            小鳥の
            <span className="relative inline-block">
              <span className="relative z-20 text-[#8b4513] font-extrabold"
                    style={{ 
                      textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                    }}>
                ひと声
              </span>
            </span>
            が、<br />
            あなたの習慣を<br />
            運んでいく。
          </div>
        </h1>
        
        <p className="text-[#7c5a2a] text-base sm:text-lg leading-relaxed">
          StepEasyは、やさしく寄り添う習慣化アプリ。<br />
          無理なく、あなたらしく、続けられる毎日を。
        </p>
      </div>

      {/* CTAボタン */}
      <button
        onClick={onNext}
        className="group relative w-full bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl overflow-hidden"
      >
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        {/* ボタンテキスト */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          <span>はじめる</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </button>
    </div>
  );
}; 