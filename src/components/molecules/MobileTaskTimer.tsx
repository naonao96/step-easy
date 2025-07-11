import React, { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';
import { useExecutionStore } from '@/stores/executionStore';
import { FaClock, FaPlay, FaPause, FaStop, FaUndo } from 'react-icons/fa';

interface MobileTaskTimerProps {
  task: Task;
  onExecutionComplete?: () => void;
}

export const MobileTaskTimer: React.FC<MobileTaskTimerProps> = ({
  task,
  onExecutionComplete
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

  const isCurrentTaskActive = activeExecution?.task_id === task.id;
  const isOtherTaskRunning = Boolean(activeExecution && !isCurrentTaskActive);
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
            // 必要に応じて再ログインページへリダイレクト
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



  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {FaClock({className:"w-4 h-4 text-gray-500"})}
          <span className="text-sm font-medium text-gray-700">{getSessionLabel()}</span>
        </div>
        <div className="text-lg font-mono font-bold text-gray-900">
          {getDisplayTime()}
        </div>
      </div>

      {/* 時間情報の表示 */}
      <div className="flex justify-between text-xs text-gray-600 mb-3">
        {isHabitTask ? (
          // 習慣タスクの場合
          <>
            <span>今日累計: {task.today_total ? `${Math.floor(task.today_total / 60)}分` : (task.actual_duration && task.actual_duration > 0) ? `${task.actual_duration}分` : '0分'}</span>
            <span className="text-blue-600">🔥 継続中</span>
          </>
        ) : (
          // 通常タスクの場合
          <>
        {task.estimated_duration && (
              <span>予想時間: {formatDurationShort(task.estimated_duration)}</span>
        )}
            <span className="text-green-600">総累計: {task.all_time_total ? `${Math.floor(task.all_time_total / 60)}分` : (task.actual_duration && task.actual_duration > 0) ? `${task.actual_duration}分` : '0分'}</span>
          </>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="flex gap-2">
        {!isCurrentTaskActive ? (
          <button
            onClick={handleStart}
            disabled={isOtherTaskRunning}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 justify-center min-h-[44px] ${
              isOtherTaskRunning
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            title={isOtherTaskRunning ? '他のタスクが実行中です' : '実行開始'}
          >
            {FaPlay({className:"w-3 h-3"})}
            開始
          </button>
        ) : (
          <>
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-xs font-medium transition-colors flex-1 justify-center min-h-[44px]"
                title="一時停止"
              >
                {FaPause({className:"w-3 h-3"})}
                休憩
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-medium transition-colors flex-1 justify-center min-h-[44px]"
                title="再開"
              >
                {FaPlay({className:"w-3 h-3"})}
                再開
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium transition-colors flex-1 justify-center min-h-[44px]"
              title="停止・記録"
            >
              {FaStop({className:"w-3 h-3"})}
              {isHabitTask ? '今日分完了' : '完了して記録'}
            </button>

            {/* リセットボタン */}
            <div className="flex-1 relative">
              <button
                onClick={handleResetClick}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full justify-center min-h-[44px] bg-gray-500 text-white hover:bg-gray-600"
                title="リセット"
              >
                {FaUndo({className:"w-3 h-3"})}
                リセット
              </button>

              {/* ポップオーバー */}
              {showResetPopover && (
                <div 
                  ref={popoverRef}
                  className="absolute bottom-full mb-2 left-0 transform -translate-x-1/2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
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
                      borderTop: '4px solid white'
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
          </>
        )}
      </div>

      {/* 他のタスク実行中の警告 */}
      {isOtherTaskRunning && (
        <div className="text-xs text-orange-600 mt-2 text-center">
          他のタスクが実行中
        </div>
      )}




    </div>
  );
}; 