import React from 'react';
import { FaBrain, FaRobot, FaChartLine, FaFire, FaTasks, FaHeart } from 'react-icons/fa';

export const FeaturesContent: React.FC = () => {
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
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#8b4513] mb-6">
            あなたの習慣を支える6つの力
          </h2>
          <p className="text-xl text-[#7c5a2a]">
            科学的なアプローチと心理的サポートで、継続を実現します
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <div
                key={index}
                className={`rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${getColorClasses(feature.color)}`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    {(IconComponent as any)({ className: "w-8 h-8 text-[#8b4513]" })}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-[#7c5a2a] leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 