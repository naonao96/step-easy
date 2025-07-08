import React, { useState, useRef, useEffect } from 'react';
import { Task } from '@/stores/taskStore';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { FaCheck, FaTrash, FaPlay, FaPause, FaStop, FaClock, FaEdit } from 'react-icons/fa';
import { useExecutionStore } from '@/stores/executionStore';

interface MobileTaskCarouselProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  isHabit?: boolean;
}

/**
 * Instagram Stories風のモバイルタスクカルーセル
 * 
 * 特徴:
 * - スムーズなスワイプ操作
 * - 慣性スクロール
 * - 3Dカード効果
 * - 自然なアニメーション
 */
export const MobileTaskCarousel: React.FC<MobileTaskCarouselProps> = ({
  tasks,
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  isHabit = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTime, setLastTime] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);

  // 実行ログ機能の状態管理
  const {
    activeExecution,
    elapsedTime,
    isRunning,
    startExecution,
    stopExecution,
    pauseExecution,
    resumeExecution
  } = useExecutionStore();

  // タスクが空の場合は何も表示しない
  if (tasks.length === 0) {
    return null;
  }

  // Instagram Stories風カルーセルの設定
  const CAROUSEL_CONFIG = {
    cardWidth: 280,
    cardHeight: 320,
    visibleCards: 5,
    centerIndex: 2, // Math.floor(5 / 2)
    swipeThreshold: 50, // Instagram風のスワイプ閾値
    velocityThreshold: 1.5, // 慣性スクロールの速度閾値
    resistance: 2.0, // スワイプの抵抗係数
    inertiaDecay: 0.88, // 慣性の減衰係数
    animationDuration: 0.3, // アニメーション時間（秒）
  } as const;

  // スワイプ処理
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsAnimating(false);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
    setVelocity(0);
    setLastTranslateX(0);
    setLastTime(Date.now());
  };

  // スワイプ移動処理
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentTime = Date.now();
    const diff = currentX - startX;
    
    // Instagram Stories風の滑らかな動き
    const newTranslateX = diff * CAROUSEL_CONFIG.resistance;
    
    // 速度を計算（60fps基準）
    const timeDiff = currentTime - lastTime;
    if (timeDiff > 0) {
      const newVelocity = (newTranslateX - lastTranslateX) / timeDiff * 16;
      setVelocity(newVelocity);
    }
    
    setLastTranslateX(newTranslateX);
    setLastTime(currentTime);
    setTranslateX(newTranslateX);
  };

  // インデックス更新処理
  const updateIndex = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        // 無限スクロール: 最後のカードを過ぎたら最初に戻る
        return nextIndex >= tasks.length ? 0 : nextIndex;
      });
    } else {
      setCurrentIndex(prev => {
        const prevIndex = prev - 1;
        // 無限スクロール: 最初のカードより前に行ったら最後に移動
        return prevIndex < 0 ? tasks.length - 1 : prevIndex;
      });
    }
  };

  // 慣性スクロール処理
  const animateInertia = (initialVelocity: number, initialTranslateX: number) => {
    let currentVelocity = initialVelocity;
    let currentTranslateX = initialTranslateX;
    
    const animate = () => {
      if (Math.abs(currentVelocity) > 0.3) {
        currentVelocity *= CAROUSEL_CONFIG.inertiaDecay;
        currentTranslateX += currentVelocity;
        setTranslateX(currentTranslateX);
        requestAnimationFrame(animate);
      } else {
        // 慣性終了後の判定
        if (Math.abs(currentTranslateX) > CAROUSEL_CONFIG.swipeThreshold) {
          if (currentTranslateX > 0) {
            updateIndex('prev');
          } else if (currentTranslateX < 0) {
            updateIndex('next');
          }
        }
        
        // 状態リセット
        setTranslateX(0);
        setVelocity(0);
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // スワイプ終了処理
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setIsAnimating(true);
    
    // Instagram Stories風の慣性スクロール
    if (Math.abs(velocity) > CAROUSEL_CONFIG.velocityThreshold) {
      animateInertia(velocity, translateX);
    } else {
      // 通常のスワイプ判定
      if (Math.abs(translateX) > CAROUSEL_CONFIG.swipeThreshold) {
        if (translateX > 0) {
          updateIndex('prev');
        } else if (translateX < 0) {
          updateIndex('next');
        }
      }
      
      // 状態リセット
      setTranslateX(0);
      setVelocity(0);
      setIsAnimating(false);
    }
  };

  // マウスドラッグ処理（デスクトップ対応）
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAnimating(false);
    setStartX(e.clientX);
    setTranslateX(0);
    setVelocity(0);
    setLastTranslateX(0);
    setLastTime(Date.now());
  };

  // マウス移動処理（タッチ処理と統一）
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const currentTime = Date.now();
    const diff = currentX - startX;
    
    // Instagram Stories風の滑らかな動き
    const newTranslateX = diff * CAROUSEL_CONFIG.resistance;
    
    // 速度を計算（60fps基準）
    const timeDiff = currentTime - lastTime;
    if (timeDiff > 0) {
      const newVelocity = (newTranslateX - lastTranslateX) / timeDiff * 16;
      setVelocity(newVelocity);
    }
    
    setLastTranslateX(newTranslateX);
    setLastTime(currentTime);
    setTranslateX(newTranslateX);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  // カードの基本位置計算
  const getBaseCardPosition = (offset: number) => {
    const cardSpacing = 320; // カード間の距離
    
    switch (offset) {
      case 0: // 選択中カード（中央）
        return {
          x: translateX,
          y: 0,
          z: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
        };
      case 1: // 次のカード（右側）
        return {
          x: cardSpacing + translateX,
          y: 0,
          z: -50,
          rotation: 15,
          scale: 0.8,
          opacity: 0.7,
        };
      case -1: // 前のカード（左側）
        return {
          x: -cardSpacing + translateX,
          y: 0,
          z: -50,
          rotation: -15,
          scale: 0.8,
          opacity: 0.7,
        };
      case 2: // さらに次のカード（右側）
        return {
          x: cardSpacing * 2 + translateX,
          y: 0,
          z: -100,
          rotation: 25,
          scale: 0.6,
          opacity: 0.4,
        };
      case -2: // さらに前のカード（左側）
        return {
          x: -cardSpacing * 2 + translateX,
          y: 0,
          z: -100,
          rotation: -25,
          scale: 0.6,
          opacity: 0.4,
        };
      default:
        return {
          x: 0,
          y: 0,
          z: 0,
          rotation: 0,
          scale: 0.4,
          opacity: 0.2,
        };
    }
  };

  // スワイプアニメーション計算
  const getSwipeAnimation = (offset: number, basePosition: ReturnType<typeof getBaseCardPosition>) => {
    const swipeProgress = translateX / 200; // スワイプの進行度（-1 ～ 1）
    
    if (Math.abs(swipeProgress) <= 0.1) return basePosition;
    
    const progress = Math.min(Math.abs(swipeProgress), 1);
    
    if (swipeProgress > 0 && offset === 1) {
      // 右スワイプで次のカードが中央に近づく
      return {
        x: 320 * (1 - progress) + translateX,
        y: 0,
        z: -50 * (1 - progress),
        rotation: 15 * (1 - progress),
        scale: 0.8 + (0.2 * progress),
        opacity: 0.7 + (0.3 * progress),
      };
    } else if (swipeProgress < 0 && offset === -1) {
      // 左スワイプで前のカードが中央に近づく
      return {
        x: -320 * (1 - progress) + translateX,
        y: 0,
        z: -50 * (1 - progress),
        rotation: -15 * (1 - progress),
        scale: 0.8 + (0.2 * progress),
        opacity: 0.7 + (0.3 * progress),
      };
    } else if (offset === 0) {
      // 選択中カードのスワイプ効果
      return {
        ...basePosition,
        scale: 1 - (0.1 * progress),
        opacity: 1 - (0.2 * progress),
      };
    }
    
    return basePosition;
  };

  // Instagram Stories風のカードスタイル計算
  const getCardStyle = (offset: number) => {
    const basePosition = getBaseCardPosition(offset);
    const animatedPosition = getSwipeAnimation(offset, basePosition);
    
    return {
      transform: `translateX(${animatedPosition.x}px) translateY(${animatedPosition.y}px) translateZ(${animatedPosition.z}px) rotateY(${animatedPosition.rotation}deg) scale(${animatedPosition.scale})`,
      opacity: animatedPosition.opacity,
      zIndex: 1000 - Math.abs(offset),
      transition: (isDragging || isAnimating) ? 'none' : `all ${CAROUSEL_CONFIG.animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      willChange: 'transform, opacity',
    };
  };

  // 習慣の頻度表示
  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return '毎日';
      case 'weekly': return '週1回';
      case 'monthly': return '月1回';
      default: return '毎日';
    }
  };

  // 実行ログ機能のヘルパー関数
  const isCurrentTaskActive = (taskId: string) => activeExecution?.task_id === taskId;
  const isOtherTaskRunning = (taskId: string) => Boolean(activeExecution && !isCurrentTaskActive(taskId));

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = (taskId: string) => {
    if (isCurrentTaskActive(taskId)) {
      return formatTime(elapsedTime);
    }
    return '0:00';
  };

  return (
    <div className="relative w-full h-48 overflow-hidden mobile-carousel-container">
      {/* カルーセルコンテナ */}
      <div
        ref={carouselRef}
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
              {/* カルーセルコンテナ */}
      <div className={`relative w-full h-full flex items-center justify-center ${
        isDragging ? '' : 'mobile-carousel-swipe'
      }`}>
        {/* カード配置 */}
        {Array.from({ length: CAROUSEL_CONFIG.visibleCards }, (_, i) => {
          const offset = i - CAROUSEL_CONFIG.centerIndex; // -2, -1, 0, 1, 2
          const taskIndex = (currentIndex + offset + tasks.length) % tasks.length;
          const task = tasks[taskIndex];
          const style = getCardStyle(offset);
          const isCenter = offset === 0; // 中央のカードが現在選択中
            
            return (
              <div
                key={`${task.id}-${offset}`}
                className={`absolute w-70 h-38 mobile-carousel-card ${
                  isCenter ? 'pointer-events-auto mobile-carousel-card-center' : 'pointer-events-none'
                }`}
                style={style}
              >
                {/* Instagram Stories風のタスクカード */}
                <div className={`
                  w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden
                  ${isCenter ? 'border-2 border-blue-400 mobile-carousel-shadow-center' : 'border border-gray-200 mobile-carousel-shadow'}
                  ${task.status === 'done' ? 'opacity-75' : ''}
                  ${isDragging ? '' : 'transition-all duration-300'}
                  ${isCenter ? 'ring-2 ring-blue-200 ring-opacity-30' : ''}
                  backdrop-blur-sm
                `}>
                  {/* カードヘッダー + タイトル（横並び） */}
                  <div className="p-3 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            task.status === 'done'
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {task.status === 'done' && FaCheck({ className: "w-3 h-3" })}
                        </button>
                        
                        {/* タイトル（チェックボックスの横） */}
                        <h3 className={`font-semibold text-lg line-clamp-2 flex-1 min-w-0 ${
                          task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                      </div>
                      
                      <div className="flex gap-1">
                        {onEditTask && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                            className="mt-1 p-1 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                            title="編集"
                          >
                            {FaEdit({ className: "w-4 h-4" })}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                          className="mt-1 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          title="削除"
                        >
                          {FaTrash({ className: "w-4 h-4" })}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* カードコンテンツ */}
                  <div className="px-3 pb-3">

                    {/* 説明（短縮版） */}
                    {task.description && (
                      <p className={`text-sm text-gray-600 mb-2 line-clamp-2 ${
                        task.status === 'done' ? 'line-through text-gray-400' : ''
                      }`}>
                        {task.description}
                      </p>
                    )}

                    {/* 頻度・カテゴリ・優先度を1行にまとめる */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {/* 習慣ラベル */}
                      {isHabit && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          {getFrequencyLabel(task.habit_frequency)}
                        </span>
                      )}
                      {/* カテゴリバッジ */}
                      {task.category && (
                        <CategoryBadge category={task.category} />
                      )}
                      {/* 優先度バッジ */}
                      {task.priority && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                      )}
                    </div>

                    {/* 実行ログ機能（最小限） */}
                    {isCenter && (
                      <div className="flex items-center justify-between mb-2">
                        {/* 実行時間表示 */}
                        <div className="flex items-center gap-1">
                          {FaClock({ className: "w-3 h-3 text-gray-500" })}
                          <span className="text-xs font-mono text-gray-600">
                            {getDisplayTime(task.id)}
                          </span>
                        </div>
                        
                        {/* 実行ボタン */}
                        <div className="flex gap-2 relative z-10">
                          {!isCurrentTaskActive(task.id) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startExecution(task.id);
                              }}
                              disabled={isOtherTaskRunning(task.id)}
                              className={`p-2 rounded-md text-sm transition-colors relative z-20 ${
                                isOtherTaskRunning(task.id)
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                              title={isOtherTaskRunning(task.id) ? '他のタスクが実行中' : '実行開始'}
                            >
                              {FaPlay({ className: "w-3 h-3" })}
                            </button>
                          ) : (
                            <>
                              {isRunning ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pauseExecution();
                                  }}
                                  className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm transition-colors relative z-20"
                                  title="一時停止"
                                >
                                  {FaPause({ className: "w-3 h-3" })}
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    resumeExecution();
                                  }}
                                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-colors relative z-20"
                                  title="再開"
                                >
                                  {FaPlay({ className: "w-3 h-3" })}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopExecution();
                                }}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm transition-colors relative z-20"
                                title="停止・記録"
                              >
                                {FaStop({ className: "w-3 h-3" })}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* スワイプ専用のポケモンカード風カルーセル */}

      {/* Instagram Stories風のカウンター表示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[9999]">
        <div className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
          {currentIndex + 1} / {tasks.length}
        </div>
      </div>
    </div>
  );
}; 