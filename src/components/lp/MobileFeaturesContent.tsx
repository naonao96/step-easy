'use client';

import React from 'react';
import { FaBrain, FaRobot, FaChartLine, FaFire, FaTasks, FaHeart } from 'react-icons/fa';

interface MobileFeaturesContentProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
}

export const MobileFeaturesContent: React.FC<MobileFeaturesContentProps> = ({
  onLogin,
  onRegister,
  onGuest,
  isLoading
}) => {
  const features = [
    {
      icon: FaBrain,
      title: '今の気持ちを理解',
      description: 'AI感情分析で、あなたの今の状態に寄り添ったメッセージを提供します',
      color: 'blue'
    },
    {
      icon: FaRobot,
      title: 'あなた専用のメッセージ',
      description: 'Google Gemini搭載AIが、個人の行動パターンに基づいてパーソナライズ',
      color: 'green'
    },
    {
      icon: FaChartLine,
      title: '行動パターンの発見',
      description: 'ヒートマップで24時間×7曜日の活動パターンを可視化',
      color: 'purple'
    },
    {
      icon: FaFire,
      title: '成長の実感',
      description: '継続ストリークで習慣の定着度を数値化、達成感を味わえます',
      color: 'orange'
    },
    {
      icon: FaTasks,
      title: '得意分野の把握',
      description: 'カテゴリ別分析で、あなたの得意・不得意分野を明確化',
      color: 'indigo'
    },
    {
      icon: FaHeart,
      title: 'いつでも寄り添う',
      description: 'ストレス状況を察知し、無理のないペースでサポート',
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-[#f5f5dc] border-[#deb887] text-[#8b4513]',
      green: 'bg-[#f5f5dc] border-[#deb887] text-[#8b4513]',
      purple: 'bg-[#f5f5dc] border-[#deb887] text-[#8b4513]',
      orange: 'bg-[#f5f5dc] border-[#deb887] text-[#8b4513]',
      indigo: 'bg-[#f5f5dc] border-[#deb887] text-[#8b4513]',
      pink: 'bg-[#f5f5dc] border-[#deb887] text-[#8b4513]'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5dc] to-[#deb887]">
      <div className="px-6 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#8b4513] mb-4">
            あなたの習慣を支える6つの力
          </h2>
          <p className="text-lg text-[#7c5a2a]">
            科学的なアプローチと心理的サポートで、継続を実現します
          </p>
        </div>

        {/* 機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <div
                key={index}
                className={`rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${getColorClasses(feature.color)}`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {(IconComponent as any)({ className: "w-8 h-8 text-[#8b4513]" })}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-[#7c5a2a] leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <div className="bg-[#f5f5dc] rounded-2xl p-6 shadow-lg border border-[#deb887]">
            <h3 className="text-xl font-bold text-[#8b4513] mb-4">
              今すぐ体験してみませんか？
            </h3>
            <p className="text-[#7c5a2a] mb-6">
              すべての機能を無料でお試しいただけます
            </p>
            <div className="space-y-3">
              <button
                onClick={onRegister}
                disabled={isLoading}
                className="w-full bg-[#8b4513] hover:bg-[#7c5a2a] text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors disabled:opacity-50"
              >
                無料で始める
              </button>
              <button
                onClick={onGuest}
                disabled={isLoading}
                className="w-full bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white border-2 border-[#8b4513] font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
              >
                まずは体験
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 