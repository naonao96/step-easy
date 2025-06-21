import React from 'react';
import { Task } from '@/stores/taskStore';

interface MobileHomeHeaderProps {
  selectedDate: Date;
  selectedDateTasks: Task[];
  statistics: {
    selectedDateCompletedTasks: number;
    selectedDateTotalTasks: number;
    selectedDatePercentage: number;
  };
}

export const MobileHomeHeader: React.FC<MobileHomeHeaderProps> = ({
  selectedDate,
  selectedDateTasks,
  statistics
}) => {
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // 時間を0にして日付のみで比較
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return '今日';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return '明日';
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  const { selectedDateCompletedTasks, selectedDateTotalTasks, selectedDatePercentage } = statistics;

  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 mb-4">
      {/* 選択日表示 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          📅 {formatDate(selectedDate)}
        </h2>
        <div className="text-sm text-gray-500">
          {selectedDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
        </div>
      </div>

      {/* 進捗表示 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            ✅ 完了: {selectedDateCompletedTasks}/{selectedDateTotalTasks} タスク
          </span>
          <span className="text-sm font-bold text-blue-600">
            {selectedDatePercentage}%
          </span>
        </div>
        
        {/* 進捗バー */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${selectedDatePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}; 