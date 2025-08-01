import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { EmotionHoverMenu } from './EmotionHoverMenu';
import { getEmotionTimePeriodLabel } from '@/lib/timeUtils';
import { useEmotionStore } from '@/stores/emotionStore';
import { useAuth } from '@/contexts/AuthContext';

interface CharacterProps {
  message?: string;
  messageParts?: string[];
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
  displayedMessage?: string;
  bubblePosition?: 'left' | 'bottom';
  size?: string | number;
  onClick?: () => void;
  // モバイル版対応追加props
  isMobile?: boolean;
  onMessageClick?: () => void; // モバイル版用
}

export const Character: React.FC<CharacterProps> = ({ 
  message, 
  layout = 'vertical',
  isInteractive = false,
  onOptionSelect,
  options = [],
  showMessage,
  isTyping,
  displayedMessage,
  bubblePosition = 'bottom',
  onClick,
  isMobile,
  onMessageClick
}) => {
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);
  const characterRef = useRef<HTMLDivElement>(null);
  const { isGuest } = useAuth();
  
  // ゲストモード時は感情メニューを無効化
  const shouldShowEmotionMenu = showEmotionMenu && !isGuest;
  
  // 感情記録の状態を直接storeから取得
  const { recordStatus, currentTimePeriod } = useEmotionStore();
  
  // 感情記録促進のロジック
  const shouldBlink = recordStatus && currentTimePeriod && (
    recordStatus[currentTimePeriod] === null || 
    (recordStatus[currentTimePeriod] && recordStatus[currentTimePeriod].id?.toString().startsWith('temp-'))
  );
  
  // クリックハンドラー（useMessageDisplay.tsに統一）
  const handleMessageClick = () => {
    // 親コンポーネントのonMessageClickを使用
    onMessageClick?.();
  };

  // 感情メニューを閉じるハンドラー
  const handleCloseEmotionMenu = () => {
    setShowEmotionMenu(false);
  };

  // 時間帯ラベル取得（共通関数を使用）
  const getTimePeriodLabel = () => {
    const timePeriod = currentTimePeriod;
    if (timePeriod) {
      const labels = { morning: '朝', afternoon: '昼', evening: '晩' };
      return labels[timePeriod];
    }
    // フォールバック: 現在時刻から判定（共通関数を使用）
    return getEmotionTimePeriodLabel();
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

  const processedMessage = message || 'メッセージを読み込み中...';
  // APIから来るメッセージは既に適切な長さに制限されているため、
  // ここでは表示の最適化に集中し、極端に長い場合のみ制限
  const maxLength = 250; // 安全な上限値
  const optimizedText = optimizeText(processedMessage, maxLength);
  const textStyles = getTextStyles(optimizedText, layout);

  // モバイル版の吹き出し表示
  if (isMobile && bubblePosition === 'bottom' && showMessage) {
    return (
      <div className="character-container relative flex justify-center">
        {/* メッセージバブル（キャラクターの上に配置） */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-72 max-w-sm pointer-events-none">
          <div className="bg-gradient-to-br from-[#f7ecd7] to-[#f5e9da] rounded-2xl border border-[#deb887] shadow-2xl transition-all duration-300 p-4 w-72 pointer-events-none">
            <div className={`text-[#7c5a2a] font-medium leading-relaxed text-sm sm:text-base text-center ${!isTyping ? 'cursor-pointer' : 'cursor-default'}`} onClick={!isTyping ? onMessageClick : undefined}>
              {displayedMessage || message}
              {isTyping && <span className="animate-blink ml-1">|</span>}
            </div>
            {/* 尻尾部分（下向き） */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-[#f7ecd7] to-[#f5e9da] border-r border-b border-[#deb887] rotate-45 -translate-y-1/2 pointer-events-none"></div>
          </div>
        </div>
        
        {/* キャラクター（感情メニュー付き）- モバイル版専用デザイン */}
        <div className="relative">
          <div 
            className="cursor-pointer flex-shrink-0 relative z-40" 
            style={{ height: '3cm', width: 'auto', display: 'flex', alignItems: 'center' }} 
            onClick={onClick}
          >
            {/* 半透明の円（半径2cm）- 背面に配置 */}
            <div className={`
              absolute inset-0 w-32 h-32 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2
              ${shouldBlink ? 'background-circle-unrecorded' : 'bg-blue-200/20 border-blue-300/30'}
            `} style={{ left: '50%', top: '50%', zIndex: -1 }}></div>
            
            <Image
              src={showMessage ? '/TalkToTheBird.png' : '/SilentBird.png'}
              alt="StepEasy Bird Character"
              width={120}
              height={120}
              priority={true}
              style={{ height: '3cm', width: 'auto', objectFit: 'contain', display: 'block' }}
              className={`
                transition-transform transition-shadow duration-200 active:scale-110
                ${shouldBlink ? 'character-unrecorded' : ''}
              `}
            />
            
            {/* 朝昼晩（統合型ヘッダー）をキャラクターの足元にabsolute配置：感情メニュー表示時のみ表示 */}
            {shouldShowEmotionMenu && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 z-30 w-auto min-w-fit max-w-md flex justify-center pointer-events-none">
                <span className={`
                  bg-white/90 border border-gray-200 rounded-full px-4 py-1 text-sm font-bold text-gray-800 shadow-md pointer-events-none select-none
                  ${shouldBlink ? 'border-blue-400 bg-blue-50' : ''}
                `}>
                  {getTimePeriodLabel()}
                </span>
              </div>
            )}
            
            {/* 感情記録メニュー - キャラクター画像の中心に配置 */}
            {shouldShowEmotionMenu && (
              <div className="absolute inset-0 z-40">
                <EmotionHoverMenu
                  isVisible={shouldShowEmotionMenu}
                  onClose={handleCloseEmotionMenu}
                  characterRef={characterRef}
                  isMessageDisplaying={showMessage}
                  isTyping={isTyping}
                  isMobile={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // デスクトップ版の吹き出し表示
  if (bubblePosition === 'left') {
    return (
      <div className="character-container relative flex justify-center">
        {/* メッセージバブル（キャラクターの上に配置） */}
        {showMessage && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-72 max-w-sm pointer-events-auto">
            <div className="bg-gradient-to-br from-[#f7ecd7] to-[#f5e9da] rounded-2xl border border-[#deb887] shadow-2xl transition-all duration-300 p-4 w-72 pointer-events-auto">
              <div className={`text-[#7c5a2a] font-medium leading-relaxed text-sm sm:text-base text-center ${!isTyping ? 'cursor-pointer' : 'cursor-default'}`} onClick={!isTyping ? handleMessageClick : undefined}>
                {displayedMessage || message}
                {isTyping && <span className="animate-blink ml-1">|</span>}
              </div>
              {/* 尻尾部分（下向き） */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-[#f7ecd7] to-[#f5e9da] border-r border-b border-[#deb887] rotate-45 -translate-y-1/2 pointer-events-none"></div>
            </div>
          </div>
        )}
        {/* キャラクター */}
        <div 
          ref={characterRef}
          className="cursor-pointer flex-shrink-0 relative z-40" 
          style={{ height: '3cm', width: 'auto', display: 'flex', alignItems: 'center' }} 
          onClick={() => {
            console.log('🔍 Character コンポーネント クリック:', {
              onClick: !!onClick,
              showEmotionMenu,
              showMessage,
              isTyping
            });
            onClick?.();
          }}
          onMouseEnter={() => setShowEmotionMenu(true)}
          onMouseLeave={() => setShowEmotionMenu(false)}
        >
          {/* 半透明の円（半径2cm）- 背面に配置 */}
          <div className={`
            absolute inset-0 w-32 h-32 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2
            ${shouldBlink ? 'background-circle-unrecorded' : 'bg-blue-200/20 border-blue-300/30'}
          `} style={{ left: '50%', top: '50%', zIndex: -1 }}></div>
          
          <Image
            src={showMessage ? '/TalkToTheBird.png' : '/SilentBird.png'}
            alt="StepEasy Bird Character"
            width={120}
            height={120}
            priority={true}
            style={{ height: '3cm', width: 'auto', objectFit: 'contain', display: 'block' }}
            className={`
              transition-transform transition-shadow duration-200 hover:scale-110 active:scale-110
              ${shouldBlink ? 'character-unrecorded' : ''}
            `}
          />
          
          {/* 朝昼晩（統合型ヘッダー）をキャラクターの足元にabsolute配置：ホバー時のみ表示 */}
          {shouldShowEmotionMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 z-50 w-auto min-w-fit max-w-md flex justify-center pointer-events-none">
              <span className={`
                bg-white/90 border border-gray-200 rounded-full px-4 py-1 text-sm font-bold text-gray-800 shadow-md pointer-events-auto
                ${shouldBlink ? 'border-blue-400 bg-blue-50' : ''}
              `}>
                {getTimePeriodLabel()}
              </span>
            </div>
          )}
          
          
          {/* 感情ログホバーメニュー（Radial Menu） */}
          <EmotionHoverMenu
            isVisible={shouldShowEmotionMenu}
            onClose={handleCloseEmotionMenu}
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
          src={showMessage ? '/TalkToTheBird.png' : '/SilentBird.png'}
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
              {displayedMessage || optimizedText}
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
        isVisible={shouldShowEmotionMenu}
        onClose={handleCloseEmotionMenu}
        isMessageDisplaying={showMessage}
        isTyping={isTyping}
        characterRef={characterRef}
      />
    </div>
  );
};