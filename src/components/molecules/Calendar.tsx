import React, { useMemo } from 'react';
import { Task } from '@/stores/taskStore';

interface CalendarProps {
  tasks?: Task[];
  onDateSelect?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ tasks = [], onDateSelect }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 月の情報を計算
  const monthData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      firstDay,
      lastDay,
      days,
      monthName: firstDay.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    };
  }, [currentMonth, currentYear]);

  // 各日付のタスク数を計算
  const getTasksForDate = (date: Date) => {
    const dateString = date.toDateString();
    return tasks.filter(task => 
      task.due_date && new Date(task.due_date).toDateString() === dateString
    );
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">カレンダー</h2>
        <div className="text-sm text-gray-500">
          {monthData.monthName}
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div
            key={day}
            className={`p-2 text-center text-sm font-medium ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {monthData.days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = date.toDateString() === today.toDateString();
          const dayTasks = getTasksForDate(date);
          const hasOverdueTasks = dayTasks.some(task => 
            task.status !== 'done' && new Date(task.due_date!) < today
          );
          const hasPendingTasks = dayTasks.some(task => 
            task.status !== 'done' && new Date(task.due_date!) >= today
          );
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={index}
              className={`
                relative p-2 text-center text-sm cursor-pointer rounded transition-colors
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isToday ? 'bg-blue-500 text-white font-bold' : ''}
                ${!isToday && isCurrentMonth ? 'hover:bg-blue-50' : ''}
                ${isWeekend && !isToday ? 'text-red-500' : ''}
                ${hasOverdueTasks ? 'bg-red-100 text-red-700' : ''}
                ${hasPendingTasks && !hasOverdueTasks ? 'bg-yellow-100 text-yellow-700' : ''}
              `}
              onClick={() => handleDateClick(date)}
            >
              <span>{date.getDate()}</span>
              {dayTasks.length > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></div>
              )}
              {dayTasks.length > 3 && (
                <div className="absolute bottom-1 right-1 text-xs">
                  {dayTasks.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">今日</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-500 rounded-full"></div>
            <span className="text-gray-600">予定あり</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border-2 border-red-500 rounded-full"></div>
            <span className="text-gray-600">期限切れ</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 