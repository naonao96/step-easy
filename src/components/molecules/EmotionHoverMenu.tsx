import React, { useState, useEffect, useRef } from 'react';
import { EmotionType, TimePeriod, EMOTION_ICONS, TIME_PERIOD_LABELS } from '@/types/emotion';
import { useEmotionStore } from '@/stores/emotionStore';

interface EmotionHoverMenuProps {
  isVisible: boolean;
  onClose: () => void;
  // メッセージ表示状態との連携
  isMessageDisplaying?: boolean;
  isTyping?: boolean;
  // キャラクターの位置情報
  characterRef?: React.RefObject<HTMLElement>;
  // Radial Menuの位置情報を親コンポーネントに渡す
  onPositionChange?: (position: { x: number; y: number } | undefined) => void;
  // モバイル版用の設定
  isMobile?: boolean;
}

export const EmotionHoverMenu: React.FC<EmotionHoverMenuProps> = ({
  isVisible,
  onClose,
  isMessageDisplaying = false,
  isTyping = false,
  characterRef,
  onPositionChange,
  isMobile
}) => {

  const { recordStatus, currentTimePeriod, recordEmotion, isLoading } = useEmotionStore();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [menuSize, setMenuSize] = useState(320);
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const menuRef = useRef<HTMLDivElement>(null);
  // キャラクターの足元座標を取得してヘッダーを配置
  const [headerPosition, setHeaderPosition] = useState<{ x: number; y: number } | null>(null);

  // メッセージ表示中は感情ログを無効化
  const isDisabled = isMessageDisplaying || isTyping || isRecording || isLoading;

  // 画面サイズに応じてRadial Menuのサイズを調整
  const getResponsiveSize = () => {
    const viewportWidth = window.innerWidth;
    if (viewportWidth < 768) return 280;
    else if (viewportWidth < 1024) return 320;
    else return 320;
  };

  // キャラクターの位置を取得してメニューを配置（上に覆いかぶさる180度円）
  useEffect(() => {
    if (isVisible && characterRef?.current) {
      const characterRect = characterRef.current.getBoundingClientRect();
      
      let centerX: number;
      let centerY: number;
      
      if (isMobile) {
        // モバイル版: 青い円と同じ配置方法を使用
        centerX = 0;
        centerY = 0;
      } else {
        // デスクトップ版: ビューポート座標
        centerX = characterRect.left + characterRect.width / 2;
        centerY = characterRect.top + characterRect.height / 2;
      }
      
      setMenuPosition({ x: centerX, y: centerY });
      setMenuSize(getResponsiveSize());
      if (onPositionChange) {
        onPositionChange({ x: centerX, y: centerY });
      }
    } else if (onPositionChange) {
      onPositionChange(undefined);
    }
  }, [isVisible, characterRef, onPositionChange, isMobile]);

  // アニメーション制御
  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('entering');
      const timer = setTimeout(() => setAnimationPhase('visible'), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimationPhase('exiting');
    }
  }, [isVisible]);

  // キャラクターの足元座標を取得してヘッダーを配置
  useEffect(() => {
    if (characterRef?.current) {
      const updateHeaderPosition = () => {
        const rect = characterRef.current!.getBoundingClientRect();
        setHeaderPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8 // 8px下にオフセット
        });
      };
      updateHeaderPosition();
      window.addEventListener('resize', updateHeaderPosition);
      return () => window.removeEventListener('resize', updateHeaderPosition);
    }
  }, [characterRef, isVisible]);

  const handleEmotionClick = async (emotionType: EmotionType) => {
    if (isDisabled) return;

    // 即座に視覚的フィードバック
    setSelectedEmotion(emotionType);
    setIsRecording(true);

    // API呼び出しを非同期で実行（ブロッキングしない）
    recordEmotion(emotionType, currentTimePeriod)
      .then(success => {
        if (success) {
          // 成功アニメーション（即座にメニューを閉じる）
          setSelectedEmotion(null);
          setIsRecording(false);
          onClose();
        } else {
          console.error('感情記録失敗');
          setSelectedEmotion(null);
          setIsRecording(false);
        }
      })
      .catch(error => {
        console.error('感情記録エラー:', error);
        setSelectedEmotion(null);
        setIsRecording(false);
      });
  };



  const getEmotionStatus = (emotionType: EmotionType) => {
    const currentRecord = recordStatus[currentTimePeriod];
    return currentRecord?.emotion_type === emotionType;
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: 'bg-green-500 border-green-600 text-white',
      red: 'bg-red-500 border-red-600 text-white',
      orange: 'bg-orange-500 border-orange-600 text-white',
      purple: 'bg-purple-500 border-purple-600 text-white',
      yellow: 'bg-yellow-500 border-yellow-600 text-white',
      blue: 'bg-blue-500 border-blue-600 text-white'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getHoverColorClasses = (color: string) => {
    const colorMap = {
      green: 'hover:bg-green-100/90 hover:border-green-400 text-green-700',
      red: 'hover:bg-red-100/90 hover:border-red-400 text-red-700',
      orange: 'hover:bg-orange-100/90 hover:border-orange-400 text-orange-700',
      purple: 'hover:bg-purple-100/90 hover:border-purple-400 text-purple-700',
      yellow: 'hover:bg-yellow-100/90 hover:border-yellow-400 text-yellow-700',
      blue: 'hover:bg-blue-100/90 hover:border-blue-400 text-blue-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  if (!isVisible) {
    return null;
  }

  const radius = (menuSize * 0.4);
  const startAngle = -180; // 左（上向き）
  const angleStep = 180 / (EMOTION_ICONS.length - 1); // 6個なら36度ずつ

  return (
    <div className={`${isMobile ? 'absolute' : 'fixed'} inset-0 z-[60] pointer-events-none`} data-emotion-menu>
      {/* 背景オーバーレイ（180度円エリアは除外） */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-200 pointer-events-auto ${
          animationPhase === 'visible' ? 'bg-opacity-20' : 'bg-opacity-0'
        }`}
        onClick={() => {
          onClose();
        }}
        data-emotion-menu
        style={{
          clipPath: `path('M ${menuPosition.x} ${menuPosition.y} A ${menuSize * 0.3} ${menuSize * 0.3} 0 0 1 ${menuPosition.x - menuSize * 0.3} ${menuPosition.y} A ${menuSize * 0.3} ${menuSize * 0.3} 0 0 1 ${menuPosition.x} ${menuPosition.y} Z')`
        }}
      />
      
      {/* 180度円型Radial Menu（上に覆いかぶさる） */}
      <div 
        ref={menuRef}
        className={`
          absolute pointer-events-auto
          transition-all duration-200 ease-out
          ${animationPhase === 'visible' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          ${isDisabled ? 'pointer-events-none' : ''}
        `}
        data-emotion-menu
        style={{
          ...(isMobile ? {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          } : {
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translate(-50%, -50%)'
          }),
          width: menuSize,
          height: menuSize
        }}
      >
        {/* 外側のドーナッツ（感情ボタン配置エリア） */}
        <div className="relative w-full h-full">
          {/* 感情アイコンを180度円周上に配置 */}
          {EMOTION_ICONS.map((emotion, index) => {
            const angle = (startAngle + index * angleStep) * (Math.PI / 180); // 左→右へ（上向き）
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            const isRecorded = getEmotionStatus(emotion.type);
            const isCurrentPeriod = recordStatus[currentTimePeriod] !== null;
            const isSelected = selectedEmotion === emotion.type;
            const canChange = isCurrentPeriod && !isDisabled; // 既に記録済みでも変更可能

            return (
              <button
                key={emotion.type}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmotionClick(emotion.type);
                }}
                disabled={isDisabled}
                className={`
                  absolute w-14 h-14 rounded-full flex flex-col items-center justify-center
                  transform -translate-x-1/2 -translate-y-1/2
                  transition-all duration-150 ease-out
                  shadow-lg border-2 backdrop-blur-sm group z-[70]
                  ${isSelected 
                    ? `${getColorClasses(emotion.color)} scale-125 shadow-xl ring-4 ring-${emotion.color}-200` 
                    : isRecorded 
                    ? `${getHoverColorClasses(emotion.color)} border-${emotion.color}-400 hover:scale-110 active:scale-110 hover:shadow-xl` 
                    : `bg-white/90 border-${emotion.color}-300 ${getHoverColorClasses(emotion.color)} hover:scale-110 active:scale-110 hover:shadow-xl`
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  animate-in fade-in-0 zoom-in-95
                `}
                data-emotion-menu
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  animationDelay: `${index * 100}ms`
                }}
                title={`${emotion.label}: ${emotion.description}`}
              >
                <span className="text-lg font-bold drop-shadow-sm">
                  {emotion.icon}
                </span>
                <span className="text-xs font-medium mt-1">
                  {emotion.shortLabel}
                </span>
                {isRecorded && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md group-hover:bg-blue-500 transition-colors">
                    <span className="text-white text-xs font-bold group-hover:scale-110 transition-transform">✓</span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* 内側のドーナッツ（中央エリア） - 透明にしてキャラクターを表示 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/5 h-3/5 rounded-full border-2 border-blue-200/30 flex items-center justify-center">
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};
