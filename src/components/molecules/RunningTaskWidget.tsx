import React from 'react';
import { useRouter } from 'next/navigation';
import { FaPlay, FaPause, FaStop, FaEye, FaClock } from 'react-icons/fa';
import { useExecutionStore } from '@/stores/executionStore';
import { useTaskStore } from '@/stores/taskStore';

export const RunningTaskWidget: React.FC = () => {
  const router = useRouter();
  const {
    activeExecution,
    elapsedTime,
    isRunning,
    pauseExecution,
    resumeExecution,
    stopExecution
  } = useExecutionStore();
  
  const { tasks } = useTaskStore();

  // 実行中のタスクがない場合は何も表示しない
  if (!activeExecution) {
    return null;
  }

  // 実行中のタスクの詳細情報を取得
  const runningTask = tasks.find(task => task.id === activeExecution.task_id);
  
  if (!runningTask) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    pauseExecution();
  };

  const handleResume = () => {
    resumeExecution();
  };

  const handleStop = async () => {
    await stopExecution();
  };

  const handleViewDetails = () => {
    router.push(`/tasks?id=${runningTask.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <h3 className="text-sm font-medium text-gray-600">実行中のタスク</h3>
      </div>

      {/* タスク情報 */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {runningTask.title}
        </h4>
        
        {/* 経過時間 */}
        <div className="flex items-center gap-2 mb-3">
          {FaClock({ className: "w-4 h-4 text-gray-500" })}
          <span className="text-2xl font-mono font-bold text-blue-600">
            {formatTime(elapsedTime)}
          </span>
          {runningTask.estimated_duration && (
            <span className="text-sm text-gray-500">
              / {runningTask.estimated_duration}分
            </span>
          )}
        </div>

        {/* ステータス表示 */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isRunning 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isRunning ? '実行中' : '一時停止中'}
          </span>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-medium text-sm transition-colors"
            title="休憩"
          >
            {FaPause({ className: "w-3 h-3" })}
            休憩
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium text-sm transition-colors"
            title="再開"
          >
            {FaPlay({ className: "w-3 h-3" })}
            再開
          </button>
        )}
        
        <button
          onClick={handleStop}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium text-sm transition-colors"
          title={runningTask.is_habit ? "今日分完了" : "完了して記録"}
        >
          {FaStop({ className: "w-3 h-3" })}
          {runningTask.is_habit ? "今日分完了" : "完了して記録"}
        </button>

        <button
          onClick={handleViewDetails}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-sm transition-colors ml-auto"
          title="タスク詳細を表示"
        >
          {FaEye({ className: "w-3 h-3" })}
          詳細
        </button>
      </div>
    </div>
  );
}; 