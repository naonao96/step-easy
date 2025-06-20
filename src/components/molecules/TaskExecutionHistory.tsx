import React from 'react';
import { FaClock, FaHistory } from 'react-icons/fa';
import { Task } from '@/types/task';

interface TaskExecutionHistoryProps {
  task: Task;
}

export const TaskExecutionHistory: React.FC<TaskExecutionHistoryProps> = ({ task }) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}時間`;
    }
    return `${hours}時間${remainingMinutes}分`;
  };

  // 実行時間の統計情報
  const hasExecutionData = task.actual_duration !== null && task.actual_duration !== undefined;
  const estimatedDuration = task.estimated_duration;
  const actualDuration = task.actual_duration;

  if (!hasExecutionData && !estimatedDuration) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {FaHistory ({className:"w-4 h-4 text-gray-500"})}
        <h4 className="font-medium text-gray-900">実行時間情報</h4>
      </div>
      
      <div className="space-y-3">
        {/* 予想時間 */}
        {estimatedDuration && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">予想時間</span>
            <span className="text-sm font-medium text-blue-600">
              {formatDuration(estimatedDuration)}
            </span>
          </div>
        )}

        {/* 実際の実行時間 */}
        {hasExecutionData && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">実行時間</span>
            <span className="text-sm font-medium text-green-600">
              {formatDuration(actualDuration!)}
            </span>
          </div>
        )}

        {/* 実行時間と予想時間の比較 */}
        {hasExecutionData && estimatedDuration && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">予想との差</span>
              <span className={`text-sm font-medium ${
                actualDuration! <= estimatedDuration 
                  ? 'text-green-600' 
                  : 'text-orange-600'
              }`}>
                {actualDuration! <= estimatedDuration ? '⭐︎ ' : ''}
                {actualDuration! <= estimatedDuration
                  ? `${formatDuration(estimatedDuration - actualDuration!)} 短縮`
                  : `${formatDuration(actualDuration! - estimatedDuration)} 超過`
                }
              </span>
            </div>
            
            {/* 達成率バー */}
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>達成率</span>
                <span className="font-medium">
                  {Math.round((estimatedDuration / actualDuration!) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    actualDuration! <= estimatedDuration 
                      ? 'bg-green-500' 
                      : 'bg-orange-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (estimatedDuration / actualDuration!) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 実行時間のみの場合の表示 */}
        {hasExecutionData && !estimatedDuration && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {FaClock ({className:"w-3 h-3"})}
            <span>次回は予想時間を設定してみましょう</span>
          </div>
        )}
      </div>
    </div>
  );
}; 