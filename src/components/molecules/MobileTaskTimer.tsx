import React, { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';
import { useExecutionStore } from '@/stores/executionStore';
import { handleTimerError, getTimerErrorMessage } from '@/lib/timerUtils';
import { FaClock, FaPlay, FaPause, FaStop, FaUndo } from 'react-icons/fa';
import { getHabitDailyExecutionTime, formatHabitExecutionTime } from '@/lib/habitUtils';

interface MobileTaskTimerProps {
  task: Task;
  onExecutionComplete?: () => void;
  selectedDate?: Date;
}

export const MobileTaskTimer: React.FC<MobileTaskTimerProps> = ({
  task,
  onExecutionComplete,
  selectedDate
}) => {
  const {
    activeExecution,
    elapsedTime,
    accumulatedTime,
    isRunning,
    startExecution,
    stopExecution,
    pauseExecution,
    resumeExecution,
    resetExecution
  } = useExecutionStore();

  // リセット関連の状態管理
  const [showResetPopover, setShowResetPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 習慣の実行時間状態
  const [habitExecutionTime, setHabitExecutionTime] = useState<number>(0);
  const [isLoadingHabitTime, setIsLoadingHabitTime] = useState(false);

  const isCurrentTaskActive = activeExecution?.task_id === task.id;
  const isOtherTaskRunning = Boolean(activeExecution && !isCurrentTaskActive);
  const isHabitTask = task.is_habit;
  
  // 過去日・未来日判定（習慣のみ）- 今日以外は実行不可
  const isNotToday = task.is_habit && selectedDate && selectedDate.toDateString() !== new Date().toDateString();

  // 習慣の実行時間を取得
  useEffect(() => {
    const fetchHabitExecutionTime = async () => {
      if (isHabitTask) {
        setIsLoadingHabitTime(true);
        try {
          // 今日の日付を日本時間で取得
          const today = new Date();
          const jstOffset = 9 * 60; // 分単位
          const jstTime = new Date(today.getTime() + (jstOffset * 60 * 1000));
          const executionTime = await getHabitDailyExecutionTime(task.id, jstTime);
          setHabitExecutionTime(executionTime);
        } catch (error) {
          console.error('習慣の実行時間取得エラー:', error);
        } finally {
          setIsLoadingHabitTime(false);
        }
      }
    };

    fetchHabitExecutionTime();
  }, [task.id, isHabitTask]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 表示する時間を計算（累積時間の表示問題を修正）
  const getDisplayTime = () => {
    if (isCurrentTaskActive) {
      return formatTime(elapsedTime);
    }
    // 非実行時でも累積時間があれば表示
    if (accumulatedTime > 0) {
      return formatTime(accumulatedTime);
    }
    return '0:00';
  };

  // セッション状態の表示
  const getSessionLabel = () => {
    if (isCurrentTaskActive && isRunning) {
      return isHabitTask ? '今日のセッション' : '現在のセッション';
    }
    if (isCurrentTaskActive && !isRunning) {
      return isHabitTask ? '休憩中（今日累計）' : '休憩中（今日累計）';
    }
    if (accumulatedTime > 0) {
      return isHabitTask ? '今日分完了' : '記録完了！';
    }
    return isHabitTask ? '今日のセッション' : '実行タイマー';
  };

  const handleStart = async () => {
    try {
      const result = await startExecution(task.id);
      
      if (result && !result.success) {
        const success = await handleTimerError(result as any, 'start', async () => {
          await startExecution(task.id);
        });
        if (!success) return;
      }
    } catch (error) {
      console.error('タスク開始エラー:', error);
      alert(getTimerErrorMessage('start'));
    }
  };

  const handleStop = async () => {
    await stopExecution();
    // 習慣の場合は実行時間を再取得
    if (isHabitTask) {
      // 今日の日付を日本時間で取得
      const today = new Date();
      const jstOffset = 9 * 60; // 分単位
      const jstTime = new Date(today.getTime() + (jstOffset * 60 * 1000));
      const executionTime = await getHabitDailyExecutionTime(task.id, jstTime);
      setHabitExecutionTime(executionTime);
    }
    if (onExecutionComplete) {
      onExecutionComplete();
    }
  };

  const handlePause = () => {
    pauseExecution();
  };

  const handleResume = async () => {
    try {
      const result = await resumeExecution();
      
      if (result && !result.success) {
        const success = await handleTimerError(result as any, 'resume', async () => {
          await resumeExecution();
        });
        if (!success) return;
      }
    } catch (error) {
      console.error('タスク再開エラー:', error);
      alert(getTimerErrorMessage('resume'));
    }
  };

  // リセット関連の処理
  const handleResetClick = () => {
    setShowResetPopover(true);
  };

  const handleResetConfirm = async (resetType: 'session' | 'today' | 'total' = 'session') => {
    try {
      setShowResetPopover(false);
      await resetExecution(resetType);
      
      if (onExecutionComplete) {
        onExecutionComplete();
      }
    } catch (error) {
      console.error('リセット処理エラー:', error);
      alert(getTimerErrorMessage('reset'));
    }
  };

  const handleResetCancel = () => {
    setShowResetPopover(false);
  };

  // 外側クリックでポップオーバーを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowResetPopover(false);
      }
    };

    if (showResetPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResetPopover]);

  // キーボードイベント処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showResetPopover) {
        if (event.key === 'Escape') {
          setShowResetPopover(false);
        } else if (event.key === 'Enter') {
          handleResetConfirm();
        }
      }
    };

    if (showResetPopover) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResetPopover]);



  return (
    <div className="bg-[#f5f5dc] rounded-lg p-3 border border-[#deb887]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {FaClock({className:"w-4 h-4 text-[#7c5a2a]"})}
          <span className="text-sm font-medium text-[#8b4513]">{getSessionLabel()}</span>
        </div>
        <div className="text-lg font-mono font-bold text-[#8b4513]">
          {getDisplayTime()}
        </div>
      </div>

      {/* 時間情報の表示 */}
      <div className="flex justify-between text-xs text-[#7c5a2a] mb-3">
        {isHabitTask ? (
          // 習慣タスクの場合
          <>
            <span>今日: {isLoadingHabitTime ? '読み込み中...' : formatHabitExecutionTime(habitExecutionTime)}</span>
            <span className="text-[#8b4513]">🔥 継続中</span>
          </>
        ) : (
          // 通常タスクの場合
          <>
        {task.estimated_duration && (
              <span>予想時間: {formatDurationShort(task.estimated_duration)}</span>
        )}
            <span className="text-[#8b4513]">総累計: {task.all_time_total ? `${Math.floor(task.all_time_total / 60)}分` : (task.actual_duration && task.actual_duration > 0) ? `${task.actual_duration}分` : '0分'}</span>
          </>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="flex gap-2">
        {!isCurrentTaskActive ? (
          <button
            onClick={handleStart}
            disabled={isOtherTaskRunning || isNotToday}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 justify-center min-h-[44px] ${
              isNotToday
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                : isOtherTaskRunning
                ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887] cursor-not-allowed'
                : 'bg-[#7c5a2a] text-white hover:bg-[#8b4513]'
            }`}
            title={isNotToday ? '今日以外は実行できません' : (isOtherTaskRunning ? '他のタスクが実行中です' : '実行開始')}
          >
            {FaPlay({className:"w-3 h-3"})}
            開始
          </button>
        ) : (
          <>
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-1 px-3 py-2 bg-[#deb887] text-[#8b4513] rounded-lg hover:bg-[#8b4513] hover:text-white text-xs font-medium transition-colors flex-1 justify-center min-h-[44px]"
                title="一時停止"
              >
                {FaPause({className:"w-3 h-3"})}
                休憩
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center gap-1 px-3 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] text-xs font-medium transition-colors flex-1 justify-center min-h-[44px]"
                title="再開"
              >
                {FaPlay({className:"w-3 h-3"})}
                再開
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-3 py-2 bg-[#8b4513] text-white rounded-lg hover:bg-[#7c5a2a] text-xs font-medium transition-colors flex-1 justify-center min-h-[44px]"
              title="停止・記録"
            >
              {FaStop({className:"w-3 h-3"})}
              {isHabitTask ? '今日分完了' : '完了して記録'}
            </button>

            {/* リセットボタン */}
            <div className="flex-1 relative">
              <button
                onClick={handleResetClick}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full justify-center min-h-[44px] bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887] hover:bg-[#deb887]"
                title="リセット"
              >
                {FaUndo({className:"w-3 h-3"})}
                リセット
              </button>

              {/* ポップオーバー */}
              {showResetPopover && (
                <div 
                  ref={popoverRef}
                  className="absolute bottom-full mb-2 left-0 transform -translate-x-1/2 w-56 bg-[#f5f5dc] border border-[#deb887] rounded-lg shadow-lg z-50 p-3"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {/* 下向き矢印 */}
                  <div 
                    className="absolute top-full left-1/2 w-0 h-0"
                    style={{ 
                      marginLeft: '-4px',
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '4px solid #f5f5dc'
                    }}
                  ></div>
                  <div className="mb-2">
                    <h3 className="text-xs font-medium text-[#8b4513] mb-2 flex items-center gap-1">
                      <span className="text-[#8b4513] text-sm">⚠️</span>
                      リセット種別を選択
                    </h3>
                    
                    {/* リセット種別選択ボタン */}
                    <div className="space-y-1.5 mb-2">
                      <button
                        onClick={() => handleResetConfirm('session')}
                        className="w-full text-left p-2 bg-[#f5f5dc] hover:bg-[#deb887] rounded transition-colors border border-[#deb887]"
                      >
                        <div className="font-medium text-xs text-[#8b4513]">⏱️ セッションのみ</div>
                        <div className="text-xs text-[#7c5a2a]">現在の実行時間のみ</div>
                      </button>
                      
                      <button
                        onClick={() => handleResetConfirm('today')}
                        className="w-full text-left p-2 bg-[#f5f5dc] hover:bg-[#deb887] rounded transition-colors border border-[#deb887]"
                      >
                        <div className="font-medium text-xs text-[#8b4513]">📅 今日累計</div>
                        <div className="text-xs text-[#7c5a2a]">今日分の累積時間</div>
                      </button>
                      
                      <button
                        onClick={() => handleResetConfirm('total')}
                        className="w-full text-left p-2 bg-[#f5f5dc] hover:bg-[#deb887] rounded transition-colors border border-[#deb887]"
                      >
                        <div className="font-medium text-xs text-[#8b4513]">🗑️ 総累計</div>
                        <div className="text-xs text-[#7c5a2a]">全期間の記録を削除</div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleResetCancel}
                      className="px-2 py-1 text-xs font-medium text-[#7c5a2a] bg-[#f5f5dc] border border-[#deb887] rounded hover:bg-[#deb887] transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 他のタスク実行中の警告 */}
      {isOtherTaskRunning && (
        <div className="text-xs text-[#8b4513] mt-2 text-center">
          他のタスクが実行中
        </div>
      )}




    </div>
  );
}; 