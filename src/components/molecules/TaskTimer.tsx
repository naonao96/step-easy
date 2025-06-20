import React, { useEffect } from 'react';
import { FaPlay, FaPause, FaStop, FaClock } from 'react-icons/fa';
import { useExecutionStore } from '@/stores/executionStore';
import { Task } from '@/types/task';

interface TaskTimerProps {
  task: Task;
  onExecutionComplete?: () => void;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ task, onExecutionComplete }) => {
  const {
    activeExecution,
    elapsedTime,
    isRunning,
    startExecution,
    stopExecution,
    pauseExecution,
    resumeExecution
  } = useExecutionStore();

  const isCurrentTaskActive = activeExecution?.task_id === task.id;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startExecution(task.id);
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

  const handleResume = () => {
    resumeExecution();
  };

  // 他のタスクが実行中の場合は実行不可
  const isOtherTaskRunning = Boolean(activeExecution && !isCurrentTaskActive);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {/* 経過時間表示 */}
      <div className="flex items-center gap-2 min-w-0">
        {FaClock ({className:"w-4 h-4 text-gray-500"})}
        <span className="font-mono text-lg font-semibold text-gray-700">
          {isCurrentTaskActive ? formatTime(elapsedTime) : '0:00'}
        </span>
      </div>

      {/* 予想時間表示 */}
      {task.estimated_duration && (
        <div className="text-sm text-gray-500">
          / {task.estimated_duration}分
        </div>
      )}

      {/* 実行時間表示 */}
      {task.actual_duration && (
        <div className="text-sm text-green-600">
          前回: {task.actual_duration}分
        </div>
      )}

      {/* コントロールボタン */}
      <div className="flex items-center gap-2 ml-auto">
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
                一時停止
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
              停止
            </button>
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