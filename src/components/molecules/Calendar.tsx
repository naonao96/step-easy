import React, { useMemo, useState } from 'react';
import { Task } from '@/stores/taskStore';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface CalendarProps {
  tasks?: Task[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ tasks = [], selectedDate, onDateSelect }) => {
  const today = new Date();
  
  // 表示する年月を state で管理
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

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
    return tasks.filter(task => {
      // 開始日が一致するタスク
      if (task.start_date && new Date(task.start_date).toDateString() === dateString) {
        return true;
      }
      
      // 期限日が一致するタスク
      if (task.due_date && new Date(task.due_date).toDateString() === dateString) {
        return true;
      }
      
      return false;
    });
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // 前月に移動
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 次月に移動
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 今日の月に戻る
  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-96 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">カレンダー</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="前月"
          >
            {FaChevronLeft({ className: "w-4 h-4" })}
          </button>
          <button
            onClick={goToToday}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
            title="今日の月に戻る"
          >
            {monthData.monthName}
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="次月"
          >
            {FaChevronRight({ className: "w-4 h-4" })}
          </button>
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
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
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
                ${isToday && !isSelected ? 'bg-blue-500 text-white font-bold' : ''}
                ${isSelected ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300' : ''}
                ${!isToday && !isSelected && isCurrentMonth ? 'hover:bg-blue-50' : ''}
                ${isWeekend && !isToday && !isSelected ? 'text-red-500' : ''}
                ${hasOverdueTasks && !isSelected ? 'bg-red-100 text-red-700' : ''}
                ${hasPendingTasks && !hasOverdueTasks && !isSelected ? 'bg-yellow-100 text-yellow-700' : ''}
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