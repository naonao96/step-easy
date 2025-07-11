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
    <div className="bg-[#f5f5dc] rounded-lg shadow-md p-3 border-l-4 border-[#deb887]">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-[#8b4513] rounded-full animate-pulse"></div>
        <h3 className="text-sm font-medium text-[#7c5a2a]">実行中のタスク</h3>
      </div>

      {/* タスク情報 */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-[#8b4513] mb-1 line-clamp-2">
          {runningTask.title}
        </h4>
        
        {/* 経過時間 */}
        <div className="flex items-center gap-2 mb-2">
          {FaClock({ className: "w-3 h-3 text-[#7c5a2a]" })}
          <span className="text-lg font-mono font-bold text-[#8b4513]">
            {formatTime(elapsedTime)}
          </span>
          {runningTask.estimated_duration && (
            <span className="text-xs text-[#7c5a2a]">
              / {runningTask.estimated_duration}分
            </span>
          )}
        </div>
      </div>

      {/* 操作ボタン - 縦並びに変更 */}
      <div className="flex flex-col gap-1">
        {isRunning ? (
          <button
            onClick={handlePause}
            className="flex items-center justify-center gap-2 px-2 py-1 bg-[#deb887] text-[#8b4513] rounded-md hover:bg-[#8b4513] hover:text-white font-medium text-xs transition-colors w-full"
            title="休憩"
          >
            {FaPause({ className: "w-3 h-3" })}
            休憩
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="flex items-center justify-center gap-2 px-2 py-1 bg-[#7c5a2a] text-white rounded-md hover:bg-[#8b4513] font-medium text-xs transition-colors w-full"
            title="再開"
          >
            {FaPlay({ className: "w-3 h-3" })}
            再開
          </button>
        )}
        
        <button
          onClick={handleStop}
          className="flex items-center justify-center gap-2 px-2 py-1 bg-[#8b4513] text-white rounded-md hover:bg-[#7c5a2a] font-medium text-xs transition-colors w-full"
          title={runningTask.is_habit ? "今日分完了" : "完了して記録"}
        >
          {FaStop({ className: "w-3 h-3" })}
          {runningTask.is_habit ? "今日分完了" : "完了して記録"}
        </button>

        <button
          onClick={handleViewDetails}
          className="flex items-center justify-center gap-2 px-2 py-1 bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887] rounded-md hover:bg-[#deb887] font-medium text-xs transition-colors w-full"
          title="タスク詳細を表示"
        >
          {FaEye({ className: "w-3 h-3" })}
          詳細
        </button>
      </div>
    </div>
  );
}; 