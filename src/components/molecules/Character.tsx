import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { EmotionHoverMenu } from './EmotionHoverMenu';
import { EmotionRecord, TimePeriod } from '@/types/emotion';

interface CharacterProps {
  mood: 'happy' | 'normal' | 'sad';
  message?: string;
  layout?: 'vertical' | 'horizontal';
  isInteractive?: boolean;
  onOptionSelect?: (option: any) => void;
  options?: Array<{
    id: string;
    text: string;
    action: string;
    icon?: string;
    color?: string;
  }>;
  // デスクトップ用追加props
  showMessage?: boolean;
  isTyping?: boolean;
  bubblePosition?: 'left' | 'bottom';
  size?: string | number;
  onClick?: () => void;
  isDesktop?: boolean;
  // 感情記録促進用props
  recordStatus?: {
    morning: EmotionRecord | null;
    afternoon: EmotionRecord | null;
    evening: EmotionRecord | null;
  };
  currentTimePeriod?: TimePeriod;
}

export const Character: React.FC<CharacterProps> = ({ 
  mood, 
  message, 
  layout = 'vertical',
  isInteractive = false,
  onOptionSelect,
  options = [],
  showMessage,
  isTyping,
  bubblePosition = 'bottom',
  size,
  onClick,
  isDesktop,
  recordStatus,
  currentTimePeriod
}) => {
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);
  const characterRef = useRef<HTMLDivElement>(null);
  
  // 感情記録促進のロジック
  const shouldBlink = recordStatus && currentTimePeriod && recordStatus[currentTimePeriod] === null;
  
  // 時間帯ラベル取得
  const getTimePeriodLabel = () => {
    if (currentTimePeriod) {
      const labels = { morning: '朝', afternoon: '昼', evening: '晩' };
      return labels[currentTimePeriod];
    }
    // フォールバック: 現在時刻から判定
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 6 && hour < 12) return '朝';
    if (hour >= 12 && hour < 18) return '昼';
    return '晩';
  };

  // デバッグ用：メッセージの更新を監視
  useEffect(() => {
    if (message) {
      console.log('Character component received new message:', {
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messageLength: message.length,
        timestamp: new Date().toISOString(),
        mood
      });
    }
  }, [message, mood]);

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

  if (isDesktop && bubblePosition === 'left') {
    return (
      <div className="flex items-end gap-4">
        {/* モダンなスピーチバルーン（Radial Menu表示時は左にスライド） */}
        {showMessage && (
          <div className="mb-4 transition-all duration-300" style={{ minHeight: '3cm', height: 'auto', transform: showEmotionMenu ? 'translateX(-120px)' : 'translateX(0px)', marginTop: '40px', zIndex: 50, right: 'calc(50% + 2cm)' }}>
            <div className="relative">
              <div
                className="bg-gradient-to-br from-blue-50/95 to-indigo-100/95 backdrop-blur-md rounded-2xl border border-blue-200/50 shadow-2xl transition-all duration-300 p-4 w-80"
              >
                <div className="text-gray-800 font-medium leading-relaxed text-xs">
                  <span>{message}</span>
                  {isTyping && <span className="animate-blink ml-1">|</span>}
                </div>
              </div>
              {/* 尻尾部分（右辺に取り付け） */}
              <div className="absolute top-1/2 -right-2 w-4 h-4 bg-gradient-to-br from-blue-50/95 to-indigo-100/95 border-r border-b border-blue-200/50 transform rotate-45 -translate-y-1/2"></div>
            </div>
          </div>
        )}
        {/* キャラクター */}
        <div 
          ref={characterRef}
          className="cursor-pointer flex-shrink-0 relative" 
          style={{ height: '3cm', width: 'auto', display: 'flex', alignItems: 'center', zIndex: 40 }} 
          onClick={onClick}
          onMouseEnter={() => setShowEmotionMenu(true)}
          onMouseLeave={() => setShowEmotionMenu(false)}
        >
          {/* 半透明の円（半径2cm）- 背面に配置 */}
          <div className={`
            absolute inset-0 w-32 h-32 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2
            ${shouldBlink ? 'background-circle-unrecorded' : 'bg-blue-200/20 border-blue-300/30'}
          `} style={{ left: '50%', top: '50%', zIndex: -1 }}></div>
          
          <img
            src={mood === 'happy' ? '/TalkToTheBird.png' : mood === 'sad' ? '/SilentBird.png' : '/TalkToTheBird.png'}
            alt="StepEasy Bird Character"
            style={{ height: '3cm', width: 'auto', objectFit: 'contain', display: 'block' }}
            className={`
              transition-transform transition-shadow duration-200 hover:scale-110
              ${shouldBlink ? 'character-unrecorded' : ''}
            `}
          />
          
          {/* 朝昼晩（統合型ヘッダー）をキャラクターの足元にabsolute配置：ホバー時のみ表示 */}
          {showEmotionMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 z-50 w-auto min-w-fit max-w-md flex justify-center pointer-events-none">
              <span className={`
                bg-white/90 border border-gray-200 rounded-full px-4 py-1 text-sm font-bold text-gray-800 shadow-md pointer-events-auto
                ${shouldBlink ? 'border-blue-400 bg-blue-50' : ''}
              `}>
                {getTimePeriodLabel()}
              </span>
            </div>
          )}
          
          {/* テキストヒント（未記録時のみ表示） */}
          {shouldBlink && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50">
              <div className="hint-text bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-2 rounded-full whitespace-nowrap shadow-lg">
                💭 今の気持ちを記録してみて！
              </div>
            </div>
          )}
          
          {/* 感情ログホバーメニュー（Radial Menu） */}
          <EmotionHoverMenu
            isVisible={showEmotionMenu}
            onClose={() => setShowEmotionMenu(false)}
            isMessageDisplaying={false} // メッセージ表示中でもRadial Menu有効
            isTyping={false}
            characterRef={characterRef}
          />
        </div>
      </div>
    );
  }

  // 既存の縦並びレイアウト
  return (
    <div className="flex flex-col items-center p-6 sm:p-8 bg-white rounded-lg shadow-md">
      <div 
        ref={characterRef}
        className="relative w-40 h-40 sm:w-48 sm:h-48 mb-2 z-10 cursor-pointer"
        onMouseEnter={() => setShowEmotionMenu(true)}
        onMouseLeave={() => setShowEmotionMenu(false)}
      >
        <Image
          src={getMoodImage()}
          alt="Character"
          fill
          sizes="(max-width: 640px) 160px, 192px"
          priority
          style={{ objectFit: 'contain' }}
          className={`
            drop-shadow-xl
            ${shouldBlink ? 'character-unrecorded' : ''}
          `}
        />
        
        {/* テキストヒント（未記録時のみ表示） */}
        {shouldBlink && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50">
            <div className="hint-text bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-2 rounded-full whitespace-nowrap shadow-lg">
              💭 今の気持ちを記録してみて！
            </div>
          </div>
        )}
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
              filter="drop-shadow(0 6px 24px rgba(0,0,0,0.22))"
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
      {/* インタラクティブオプション */}
      {isInteractive && options && options.length > 0 && (
        <div className="mt-4 space-y-2 w-full max-w-md">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onOptionSelect?.(option)}
              className={`w-full px-4 py-2 text-sm rounded-lg border transition-colors ${
                option.color === 'success' ? 'border-green-200 text-green-700 hover:bg-green-50' :
                option.color === 'primary' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' :
                option.color === 'warning' ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50' :
                'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.icon && <span className="mr-2">{option.icon}</span>}
              {option.text}
            </button>
          ))}
        </div>
      )}
      {/* 感情ログホバーメニュー */}
      <EmotionHoverMenu 
        isVisible={showEmotionMenu}
        onClose={() => setShowEmotionMenu(false)}
        isMessageDisplaying={showMessage}
        isTyping={isTyping}
        characterRef={characterRef}
      />
    </div>
  );
};