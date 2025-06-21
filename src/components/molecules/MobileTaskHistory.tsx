import React from 'react';
import { Task } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';
import { FaHistory, FaClock } from 'react-icons/fa';

interface MobileTaskHistoryProps {
  task: Task;
}

export const MobileTaskHistory: React.FC<MobileTaskHistoryProps> = ({ task }) => {
  const hasExecutionData = task.actual_duration !== null && task.actual_duration !== undefined;
  const estimatedDuration = task.estimated_duration;
  const actualDuration = task.actual_duration;

  if (!hasExecutionData && !estimatedDuration) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        {FaHistory ({className:"w-4 h-4 text-gray-500"})}
        <span className="text-sm font-medium text-gray-700">実行情報</span>
      </div>
      
      <div className="space-y-3">
        {/* 予想時間 */}
        {estimatedDuration && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">予想時間</span>
            <span className="text-sm font-medium text-blue-600">
              {formatDurationShort(estimatedDuration)}
            </span>
          </div>
        )}

        {/* 実際の実行時間 */}
        {hasExecutionData && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">実行時間</span>
            <span className="text-sm font-medium text-green-600">
              {actualDuration}分
            </span>
          </div>
        )}

        {/* 実行時間と予想時間の比較 */}
        {hasExecutionData && estimatedDuration && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">予想との差</span>
              <span className={`text-xs font-medium ${
                actualDuration! <= estimatedDuration 
                  ? 'text-green-600' 
                  : 'text-orange-600'
              }`}>
                {actualDuration! <= estimatedDuration ? '⭐︎ ' : ''}
                {actualDuration! <= estimatedDuration
                  ? `${estimatedDuration - actualDuration!}分 短縮`
                  : `${actualDuration! - estimatedDuration}分 超過`
                }
              </span>
            </div>
            
            {/* 達成率バー */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
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