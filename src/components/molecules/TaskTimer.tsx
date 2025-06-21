import React, { useEffect, useState, useRef } from 'react';
import { FaPlay, FaPause, FaStop, FaClock, FaUndo } from 'react-icons/fa';
import { useExecutionStore } from '@/stores/executionStore';
import { Task } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';

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
      
      // エラー種別に応じた処理
      if (result && !result.success) {
        switch (result.error) {
          case 'DEVICE_CONFLICT':
            const shouldCleanup = confirm(`⚠️ ${result.message}\n\n他のデバイス（${result.conflictInfo?.deviceType}）でタスクが実行中です。\n\n「OK」を押すと強制的に実行状態をクリーンアップして新しく開始します。\n「キャンセル」を押すと操作を中止します。`);
            if (shouldCleanup) {
              // 強制クリーンアップして再開始
              const { forceCleanupActiveExecutions } = useExecutionStore.getState();
              await forceCleanupActiveExecutions();
              // 再度実行開始
              await startExecution(task.id);
            }
            return;
          case 'DATABASE_ERROR':
            alert(`🔌 ${result.message}`);
            return;
          case 'AUTH_ERROR':
            alert(`🔐 ${result.message}`);
            return;
          case 'PERMISSION_ERROR':
            alert(`🚫 ${result.message}`);
            return;
          default:
            alert(`❌ ${result.message || '予期しないエラーが発生しました。'}`);
            return;
        }
      }
    } catch (error) {
      console.error('タスク開始エラー:', error);
      alert('タスクの開始に失敗しました。もう一度お試しください。');
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
      
      // エラー種別に応じた処理
      if (result && !result.success) {
        switch (result.error) {
          case 'DEVICE_CONFLICT':
            const shouldCleanup = confirm(`⚠️ ${result.message}\n\n他のデバイス（${result.conflictInfo?.deviceType}）で別のタスクが実行中です。\n\n「OK」を押すと強制的に実行状態をクリーンアップして再開します。\n「キャンセル」を押すと操作を中止します。`);
            if (shouldCleanup) {
              // 強制クリーンアップして再開
              const { forceCleanupActiveExecutions } = useExecutionStore.getState();
              await forceCleanupActiveExecutions();
              // 再度再開実行
              await resumeExecution();
            }
            return;
          default:
            alert(`❌ ${result.message || '再開に失敗しました。'}`);
            return;
        }
      }
    } catch (error) {
      console.error('タスク再開エラー:', error);
      alert('タスクの再開に失敗しました。もう一度お試しください。');
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
      alert('リセット処理に失敗しました。もう一度お試しください。');
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
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {/* 経過時間表示 */}
      <div className="flex items-center gap-2 min-w-0">
        {FaClock ({className:"w-4 h-4 text-gray-500"})}
        <span className="font-mono text-lg font-semibold text-gray-700">
          {getDisplayTime()}
        </span>
      </div>

      {/* 時間情報表示 */}
      {isHabitTask ? (
        // 習慣タスクの場合
        <>
          <div className="text-sm text-gray-500">
            今日: {task.today_total ? `${Math.floor(task.today_total / 60)}分` : (task.actual_duration && task.actual_duration > 0) ? `${task.actual_duration}分` : '0分'}
          </div>
          <div className="text-sm text-blue-600">
            🔥 継続中
          </div>
        </>
      ) : (
        // 通常タスクの場合
        <>
          {task.estimated_duration && (
            <div className="text-sm text-gray-500">
              予想: {formatDurationShort(task.estimated_duration)}
            </div>
          )}
          <div className="text-sm text-green-600">
            総累計: {task.all_time_total ? `${Math.floor(task.all_time_total / 60)}分` : (task.actual_duration && task.actual_duration > 0) ? `${task.actual_duration}分` : '0分'}
          </div>
        </>
      )}

      {/* コントロールボタン */}
      <div className="flex items-center gap-2 ml-auto relative">
        {!isCurrentTaskActive ? (
          // 開始ボタン
          <button
            onClick={handleStart}
            disabled={isOtherTaskRunning}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors
              ${isOtherTaskRunning
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
              }
            `}
            title={isOtherTaskRunning ? '他のタスクが実行中です' : '実行開始'}
          >
            {FaPlay ({className:"w-3 h-3"})}
            開始
          </button>
        ) : (
          // 実行中のコントロール
          <div className="flex gap-2">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-medium text-sm transition-colors"
                title="一時停止"
              >
                {FaPause ({className:"w-3 h-3"})}
                休憩
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium text-sm transition-colors"
                title="再開"
              >
                {FaPlay ({className:"w-3 h-3"})}
                再開
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium text-sm transition-colors"
              title="停止・記録"
            >
              {FaStop ({className:"w-3 h-3"})}
              {isHabitTask ? '今日分完了' : '完了して記録'}
            </button>

            {/* リセットボタン */}
            <div className="relative">
              <button
                onClick={handleResetClick}
                className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium text-sm transition-colors"
                title="リセット"
              >
                {FaUndo({className:"w-3 h-3"})}
                リセット
              </button>

              {/* ポップオーバー */}
              {showResetPopover && (
                <div 
                  ref={popoverRef}
                  className="absolute top-1/2 right-full mr-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transform: 'translateY(-50%) translateX(8px)'
                  }}
                >
                  {/* 右向き矢印 */}
                  <div 
                    className="absolute left-full top-1/2 w-0 h-0"
                    style={{ 
                      marginLeft: '-1px',
                      transform: 'translateY(-50%)',
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderLeft: '4px solid white'
                    }}
                  ></div>
                  <div className="mb-2">
                    <h3 className="text-xs font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <span className="text-yellow-600 text-sm">⚠️</span>
                      リセット種別を選択
                    </h3>
                    
                    {/* リセット種別選択ボタン */}
                    <div className="space-y-1.5 mb-2">
                      <button
                        onClick={() => handleResetConfirm('session')}
                        className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <div className="font-medium text-xs text-gray-900">⏱️ セッションのみ</div>
                        <div className="text-xs text-gray-500">現在の実行時間のみ</div>
                      </button>
                      
                      <button
                        onClick={() => handleResetConfirm('today')}
                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="font-medium text-xs text-blue-900">📅 今日累計</div>
                        <div className="text-xs text-blue-600">今日分の累積時間</div>
                      </button>
                      
                      <button
                        onClick={() => handleResetConfirm('total')}
                        className="w-full text-left p-2 bg-red-50 hover:bg-red-100 rounded transition-colors"
                      >
                        <div className="font-medium text-xs text-red-900">🗑️ 総累計</div>
                        <div className="text-xs text-red-600">全期間の記録を削除</div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleResetCancel}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 他のタスク実行中の警告 */}
      {isOtherTaskRunning && (
        <div className="text-xs text-orange-600 ml-2">
          他のタスクが実行中
        </div>
      )}
    </div>
  );
}; 