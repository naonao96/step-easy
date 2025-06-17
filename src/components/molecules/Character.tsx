import React from 'react';
import Image from 'next/image';

interface CharacterProps {
  mood: 'happy' | 'normal' | 'sad';
  message?: string;
  layout?: 'vertical' | 'horizontal';
}

export const Character: React.FC<CharacterProps> = ({ mood, message, layout = 'vertical' }) => {
  const getMoodImage = () => {
    switch (mood) {
      case 'happy':
        return '/TalkToTheBird.png';
      case 'sad':
        return '/SilentBird.png';
      default:
        return '/TalkToTheBird.png';
    }
  };

  if (layout === 'horizontal') {
    // ワイヤーフレーム用の横並びレイアウト（ヘッダー幅に合わせる）
    return (
      <div className="w-full">
        <div className="relative bg-white rounded-2xl shadow-lg p-8 sm:p-12 w-full h-32 sm:h-40">
          {/* キャラクター画像（背面） */}
          <div className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 z-0">
            <Image
              src={getMoodImage()}
              alt="StepEasy Bird Character"
              fill
              sizes="(max-width: 640px) 128px, 160px"
              priority
              style={{ objectFit: 'contain', zIndex: 0 }}
              className="drop-shadow-xl"
            />
          </div>
          
          {/* 吹き出し（前面） */}
          <div className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 w-full max-w-2xl z-[100]">
            <svg 
              className="w-full h-auto" 
              viewBox="0 0 400 120" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 吹き出しの形状（キャラクターに近い矢印） */}
               <path
                 d="M 20 20 
                    L 360 20 
                    Q 380 20 380 30 
                    L 405 45 
                    L 380 60 
                    L 380 80 
                    Q 380 100 360 100 
                    L 20 100 
                    Q 0 100 0 80 
                    L 0 40 
                    Q 0 20 20 20 
                    Z"
                 fill="rgb(219 234 254)"
                 stroke="none"
               />
            </svg>
            {/* テキストオーバーレイ */}
            <div className="absolute inset-0 flex items-center justify-center px-8 py-4 z-[101]">
              <p className="text-gray-900 text-center text-lg sm:text-xl font-medium leading-relaxed">
                {message || 'こんにちは！今日も一緒に頑張りましょう！'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 既存の縦並びレイアウト
  return (
    <div className="flex flex-col items-center p-6 sm:p-8 bg-white rounded-lg shadow-md">
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-6 z-10">
        <Image
          src={getMoodImage()}
          alt="Character"
          fill
          sizes="(max-width: 640px) 160px, 192px"
          priority
          style={{ objectFit: 'contain' }}
          className="drop-shadow-xl"
        />
      </div>
      {message && (
        <div className="relative max-w-md z-50">
          <svg 
            className="w-full h-auto" 
            viewBox="0 0 300 100" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 吹き出しの形状（キャラクターに近い下向き矢印） */}
            <path
              d="M 20 20 
                 L 280 20 
                 Q 300 20 300 40 
                 L 300 60 
                 Q 300 80 280 80 
                 L 170 80 
                 L 150 105 
                 L 130 80 
                 L 20 80 
                 Q 0 80 0 60 
                 L 0 40 
                 Q 0 20 20 20 
                 Z"
              fill="rgb(219 234 254)"
              stroke="none"
            />
          </svg>
          {/* テキストオーバーレイ */}
          <div className="absolute inset-0 flex items-center justify-center px-6 py-4 mt-4 z-50">
            <p className="text-gray-900 text-center text-base sm:text-lg font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 