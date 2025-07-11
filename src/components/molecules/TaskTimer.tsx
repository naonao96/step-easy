import React, { useEffect, useState, useRef } from 'react';
import { FaPlay, FaPause, FaStop, FaClock, FaUndo } from 'react-icons/fa';
import { useExecutionStore } from '@/stores/executionStore';
import { Task } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';
import { handleTimerError, getTimerErrorMessage } from '@/lib/timerUtils';

interface TaskTimerProps {
  task: Task;
  onExecutionComplete?: () => void;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ task, onExecutionComplete }) => {
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

  // ポップオーバー表示状態の管理
  const [showResetPopover, setShowResetPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isCurrentTaskActive = activeExecution?.task_id === task.id;
  const isHabitTask = task.is_habit;

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

  // 他のタスクが実行中の場合は実行不可
  const isOtherTaskRunning = Boolean(activeExecution && !isCurrentTaskActive);

  return (
    <div className="bg-[#f5f5dc] rounded-lg shadow-md p-2 border-l-4 border-[#deb887]">
      {/* 経過時間表示 */}
      <div className="flex items-center gap-2 mb-2">
        {FaClock({ className: "w-3 h-3 text-[#7c5a2a]" })}
        <span className="text-lg font-mono font-bold text-[#8b4513]">
          {getDisplayTime()}
        </span>
        {task.estimated_duration && (
          <span className="text-xs text-[#7c5a2a]">
            / {task.estimated_duration}分
          </span>
        )}
      </div>

      {/* 時間情報表示 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
        {isHabitTask ? (
          // 習慣タスクの場合
          <>
            <div className="text-xs text-[#7c5a2a]">
              今日: {task.today_total ? `${Math.floor(task.today_total / 60)}分` : (task.actual_duration && task.actual_duration > 0) ? `${task.actual_duration}分` : '0分'}
            </div>
            <div className="text-xs text-[#8b4513]">
              🔥 継続中
            </div>
          </>
        ) : (
          // 通常タスクの場合
          <>
            {task.estimated_duration && (
              <div className="text-xs text-[#7c5a2a]">
                予想: {formatDurationShort(task.estimated_duration)}
              </div>
            )}
            <div className="text-xs text-[#8b4513]">
              総累計: {task.all_time_total ? `${Math.floor(task.all_time_total / 60)}分` : (task.actual_duration && task.actual_duration > 0) ? `${task.actual_duration}分` : '0分'}
            </div>
          </>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="flex flex-row items-center gap-2">
        {!isCurrentTaskActive ? (
          // 開始ボタン
          <button
            onClick={handleStart}
            disabled={isOtherTaskRunning}
            className={`
              flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition-colors
              ${isOtherTaskRunning
                ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887] cursor-not-allowed'
                : 'bg-[#7c5a2a] text-white hover:bg-[#8b4513]'
              }
            `}
            title={isOtherTaskRunning ? '他のタスクが実行中です' : '実行開始'}
          >
            {FaPlay({ className: "w-3 h-3" })}
            開始
          </button>
        ) : (
          // 実行中のコントロール
          <>
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#deb887] text-[#8b4513] rounded-md hover:bg-[#8b4513] hover:text-white font-medium text-xs transition-colors"
                title="一時停止"
              >
                {FaPause({ className: "w-3 h-3" })}
                休憩
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#7c5a2a] text-white rounded-md hover:bg-[#8b4513] font-medium text-xs transition-colors"
                title="再開"
              >
                {FaPlay({ className: "w-3 h-3" })}
                再開
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#8b4513] text-white rounded-md hover:bg-[#7c5a2a] font-medium text-xs transition-colors"
              title="停止・記録"
            >
              {FaStop({ className: "w-3 h-3" })}
              {isHabitTask ? '今日分完了' : '完了して記録'}
            </button>

            {/* リセットボタン */}
            <div className="relative">
              <button
                onClick={handleResetClick}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887] rounded-md hover:bg-[#deb887] font-medium text-xs transition-colors"
                title="リセット"
              >
                {FaUndo({ className: "w-3 h-3" })}
                リセット
              </button>

              {/* ポップオーバー */}
              {showResetPopover && (
                <div 
                  ref={popoverRef}
                  className="absolute bottom-full left-1/2 mb-2 w-64 bg-[#f5f5dc] border border-[#deb887] rounded-lg shadow-lg z-50 p-3"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* 下向き矢印 */}
                  <div 
                    className="absolute top-full left-1/2 w-0 h-0"
                    style={{ 
                      marginTop: '-1px',
                      transform: 'translateX(-50%)',
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