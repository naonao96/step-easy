'use client';

import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { CloudLayer } from '@/components/CloudLayer';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  currentStep
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-50 relative overflow-hidden">
      {/* 背景の雲エフェクト */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
        <CloudLayer />
      </div>

      {/* ヘッダー */}
      <div className="relative z-10 p-4">
        <div className="flex justify-center items-center">
          {/* プログレスインジケーター */}
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  step <= currentStep 
                    ? 'bg-[#8b4513] shadow-lg' 
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>


        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        {children}
      </div>

      {/* フッター */}
      <div className="relative z-10 p-4">
        <div className="text-center">
          <p className="text-[#7c5a2a] text-xs opacity-70">
            StepEasy - やさしく寄り添う習慣化アプリ
          </p>
        </div>
      </div>
    </div>
  );
}; 