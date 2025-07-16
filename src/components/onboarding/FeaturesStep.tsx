'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FaTasks, FaFire, FaHeart, FaChartBar, FaRobot } from 'react-icons/fa';

// Lottie Playerを動的インポート
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => ({ default: mod.Player })), {
  ssr: false,
  loading: () => <div className="w-[150px] h-[150px] mx-auto bg-gray-100 rounded-lg animate-pulse"></div>
});

interface FeaturesStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const features = [
  {
    icon: FaTasks,
    title: 'タスク管理',
    description: 'シンプルで使いやすいタスク管理で、毎日のやることを整理',
    benefit: '効率的に1日を過ごせます',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    icon: FaFire,
    title: '習慣記録',
    description: '継続の喜びを記録して、習慣化のモチベーションを維持',
    benefit: '小さな積み重ねが大きな変化に',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    icon: FaHeart,
    title: '感情ログ',
    description: 'その日の気持ちを記録して、心の状態を理解',
    benefit: '自分を大切にする習慣が身につきます',
    color: 'from-pink-400 to-pink-600',
    bgColor: 'bg-pink-50'
  },
  {
    icon: FaChartBar,
    title: '統計分析',
    description: 'あなたの成長を可視化して、継続の成果を実感',
    benefit: 'データで見える成長の軌跡',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50'
  },
  {
    icon: FaRobot,
    title: 'AIメッセージ',
    description: '小鳥があなたに寄り添って、毎朝やさしく応援',
    benefit: '一人じゃない、いつも一緒に',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50'
  }
];

export const FeaturesStep: React.FC<FeaturesStepProps> = ({ onNext, onSkip }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 自動切り替えのタイマー
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentFeature((prev) => {
          const next = (prev + 1) % features.length;
          // 最後の機能まで行ったら次へボタンを有効にする
          if (next === 0) {
            setHasSkipped(true);
          }
          return next;
        });
        setTimeout(() => setIsAnimating(false), 300);
      }, 150);
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleFeatureChange = (index: number) => {
    if (index === currentFeature || isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentFeature(index);
      setTimeout(() => setIsAnimating(false), 300);
    }, 150);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Lottieアニメーション */}
      <div className="mb-6">
        {isClient && (
          <Player
            autoplay
            loop
            src="/animations/Business Idea Animation.json"
            style={{ height: '150px', width: '150px' }}
            className="mx-auto"
          />
        )}
      </div>

      {/* メインテキスト */}
      <div className="mb-6">
        <h2 className="text-xl lg:text-3xl font-bold leading-tight mb-3 relative">
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
              StepEasy
            </span>
            の機能
          </div>
        </h2>
        <p className="text-[#7c5a2a] text-sm">
          あなたの習慣化をサポートする機能をご紹介
        </p>
      </div>

      {/* 機能カード */}
      <div className="mb-8">
        <div 
          className={`relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-[#deb887]/20 transition-all duration-500 ${features[currentFeature].bgColor}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* 背景グラデーション */}
          <div className={`absolute inset-0 bg-gradient-to-br ${features[currentFeature].color} opacity-5`}></div>
          
          {/* プログレスバー */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] transition-all duration-300 ease-linear"
              style={{ 
                width: `${((currentFeature + 1) / features.length) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* カード内容 */}
          <div className={`relative z-10 flex flex-col items-center transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {/* アイコン */}
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${features[currentFeature].color} flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-all duration-300`}>
              {React.createElement(features[currentFeature].icon as any, { 
                className: "w-10 h-10 text-white drop-shadow-sm" 
              })}
            </div>
            
            {/* タイトル */}
            <h3 className="text-xl font-bold text-[#8b4513] mb-3">
              {features[currentFeature].title}
            </h3>
            
            {/* 説明 */}
            <p className="text-[#7c5a2a] text-sm leading-relaxed mb-4">
              {features[currentFeature].description}
            </p>
            
            {/* メリット */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-[#deb887]/30">
              <p className="text-xs font-medium text-[#8b4513]">
                ✨ {features[currentFeature].benefit}
              </p>
            </div>
          </div>
        </div>

        {/* スキップボタン */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              setHasSkipped(true);
              onNext();
            }}
            className="text-[#7c5a2a] text-sm hover:text-[#8b4513] transition-colors duration-300 underline"
          >
            機能紹介をスキップ
          </button>
        </div>
      </div>

      {/* CTAボタン */}
      <button
        onClick={onNext}
        disabled={!hasSkipped}
        className={`group relative w-full font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-500 transform shadow-lg overflow-hidden ${
          hasSkipped 
            ? 'bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {/* グラデーションオーバーレイ */}
        {hasSkipped && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        )}
        
        {/* ボタンテキスト */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          <span>{hasSkipped ? '次へ' : '機能紹介をお待ちください...'}</span>
          {hasSkipped && (
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}; 