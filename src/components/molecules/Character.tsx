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

  // ハイブリッドアプローチ: テキスト最適化関数群
  const optimizeText = (text: string, maxLength: number) => {
    if (!text) return text;
    
    // 1. 文字数制限（日本語考慮）
    if (text.length > maxLength) {
      // 自然な切れ目を探す（句読点、スペース）
      const naturalBreaks = ['。', '、', '！', '？', ' ', '\n'];
      let cutPosition = maxLength - 3; // ...分を考慮
      
      for (let i = cutPosition; i >= Math.max(0, cutPosition - 10); i--) {
        if (naturalBreaks.includes(text[i])) {
          cutPosition = i + 1;
          break;
        }
      }
      
      return text.substring(0, cutPosition).trim() + '...';
    }
    
    return text;
  };

  const getTextStyles = (text: string, layoutType: string) => {
    const length = text.length;
    
    // 2. 動的line-clamp調整（自然な表示を優先）
    let lineClamp = '';
    
    // 200文字（プレミアム）の場合は制限を緩く、100文字（無料）は適度に
    if (layoutType === 'horizontal') {
      if (length > 140) lineClamp = ''; // 長いメッセージは制限なし
      else if (length > 80) lineClamp = 'line-clamp-4';
      else if (length > 40) lineClamp = 'line-clamp-3';
      else lineClamp = 'line-clamp-2';
    } else {
      // 縦並びはより自由に表示
      if (length > 120) lineClamp = ''; // 中程度以上のメッセージは制限なし
      else if (length > 60) lineClamp = 'line-clamp-4';
      else if (length > 30) lineClamp = 'line-clamp-3';
      else lineClamp = 'line-clamp-2';
    }
    
    // 3. フォントサイズ動的調整（可読性重視）
    let fontSize = 'text-sm sm:text-base';
    if (length > 160) fontSize = 'text-xs sm:text-sm';
    else if (length > 100) fontSize = 'text-xs sm:text-base';
    
    return { lineClamp, fontSize };
  };

  // プラン別の最大文字数設定（APIと同じ制限）
  const getMaxTextLength = (layoutType: string, userPlan: 'guest' | 'free' | 'premium' = 'free') => {
    // APIの文字数制限に合わせる
    if (userPlan === 'premium') return 200;
    if (userPlan === 'free') return 100;
    return 80; // ゲストユーザーは少し短め
  };

  const processedMessage = message || 'メッセージを読み込み中...';
  // APIから来るメッセージは既に適切な長さに制限されているため、
  // ここでは表示の最適化に集中し、極端に長い場合のみ制限
  const maxLength = 250; // 安全な上限値
  const optimizedText = optimizeText(processedMessage, maxLength);
  const textStyles = getTextStyles(optimizedText, layout);

  if (layout === 'horizontal') {
    // ワイヤーフレーム用の横並びレイアウト（ヘッダー幅に合わせる）
    return (
      <div className="w-full">
        <div className={`relative bg-white rounded-2xl shadow-lg p-8 sm:p-12 w-full ${
          optimizedText.length > 100 ? 'h-40 sm:h-48' : 'h-32 sm:h-40'
        }`}>
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
          <div className="absolute left-4 sm:left-8 right-36 sm:right-48 top-1/2 transform -translate-y-1/2 z-[100]">
            <svg 
              className="w-full h-auto" 
              viewBox={`0 0 520 ${optimizedText.length > 100 ? 120 : 100}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 吹き出しの形状（キャラクターに近い矢印） */}
               <path
                 d={optimizedText.length > 100 
                   ? `M 20 15 
                      L 460 15 
                      Q 480 15 480 25 
                      L 510 60 
                      L 480 75 
                      L 480 90 
                      Q 480 105 460 105 
                      L 20 105 
                      Q 0 105 0 90 
                      L 0 30 
                      Q 0 15 20 15 
                      Z`
                   : `M 20 15 
                      L 460 15 
                      Q 480 15 480 25 
                      L 510 40 
                      L 480 55 
                      L 480 70 
                      Q 480 85 460 85 
                      L 20 85 
                      Q 0 85 0 70 
                      L 0 30 
                      Q 0 15 20 15 
                      Z`
                 }
                 fill="rgb(219 234 254)"
                 stroke="none"
               />
            </svg>
            {/* テキストオーバーレイ */}
            <div className="absolute left-[3.8%] right-[11.5%] top-[15%] bottom-[15%] flex items-center justify-center z-[101]">
              <p className={`text-gray-900 text-center ${textStyles.fontSize} font-medium leading-tight ${textStyles.lineClamp} overflow-hidden w-full h-full flex items-center justify-center`}>
                {optimizedText}
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
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-2 z-10">
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
            {/* 吹き出しの形状（キャラクターに近い上向き矢印） */}
            <path
              d="M 20 80 
                 L 280 80 
                 Q 300 80 300 60 
                 L 300 40 
                 Q 300 20 280 20 
                 L 170 20 
                 L 150 -5 
                 L 130 20 
                 L 20 20 
                 Q 0 20 0 40 
                 L 0 60 
                 Q 0 80 20 80 
                 Z"
              fill="rgb(219 234 254)"
              stroke="none"
            />
          </svg>
          {/* テキストオーバーレイ */}
          <div className="absolute left-[6.7%] right-[6.7%] top-[20%] bottom-[20%] flex items-center justify-center z-50">
            <p className={`text-gray-900 text-center ${textStyles.fontSize} font-medium leading-tight ${textStyles.lineClamp} overflow-hidden w-full h-full flex items-center justify-center`}>
              {optimizedText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 