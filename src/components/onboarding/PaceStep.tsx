'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lottie Playerを動的インポート
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => ({ default: mod.Player })), {
  ssr: false,
  loading: () => <div className="w-[180px] h-[180px] mx-auto bg-gray-100 rounded-lg animate-pulse"></div>
});

interface PaceStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export const PaceStep: React.FC<PaceStepProps> = ({ onNext, onSkip }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Lottieアニメーション */}
      <div className="mb-6">
        {isClient && (
          <Player
            autoplay
            loop
            src="/animations/Emoji Semi-Flat Lottie animation.json"
            style={{ height: '180px', width: '180px' }}
            className="mx-auto"
          />
        )}
      </div>

      {/* メインテキスト */}
      <div className="mb-8">
        <h2 className="text-xl lg:text-3xl font-bold leading-tight mb-4 relative">
          {/* 背景レイヤー（影効果） */}
          <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
          
          {/* メインテキスト */}
          <div className="relative z-10 text-[#4a3728]" 
               style={{ 
                 textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                 filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
               }}>
            <span className="relative z-20 text-[#8b4513] font-extrabold"
                  style={{ 
                    textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                  }}>
              自分のペース
            </span>
            で大丈夫
          </div>
        </h2>
        
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-[#deb887]/20 mb-6">
          {/* 装飾要素 */}
          <div className="absolute top-4 right-4 w-6 h-6 text-[#8b4513] opacity-40">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          
          {/* メインテキスト */}
          <div className="relative z-10 text-center">
            <div className="mb-6">
              <p className="text-[#7c5a2a] text-lg sm:text-xl leading-relaxed font-medium">
                続けられなかった日があっても、
                <span className="text-[#8b4513] font-bold text-xl">大丈夫。</span>
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-4 border border-[#deb887]/30 shadow-sm">
              <p className="text-[#8b4513] text-base font-medium">
                <span className="text-[#7c5a2a]">StepEasyは、</span>
                あなたのペースをいちばん大切にします。
              </p>
            </div>
          </div>
        </div>
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
          <span>次へ</span>
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </button>
    </div>
  );
}; 