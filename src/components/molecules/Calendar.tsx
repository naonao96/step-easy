import React, { useMemo, useState } from 'react';
import { Task } from '@/stores/taskStore';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface CalendarProps {
  tasks?: Task[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onHeightChange?: (height: number) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ tasks = [], selectedDate, onDateSelect, onHeightChange }) => {
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

    // 必要最小限の行数を計算
    const requiredWeeks = Math.ceil((lastDay.getDate() + firstDay.getDay()) / 7);
    const totalDays = requiredWeeks * 7;

    const days = [];
    const currentDate = new Date(startDate);
    
    // 必要な日数分だけ生成（42日固定ではなく、35日または42日）
    for (let i = 0; i < totalDays; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      firstDay,
      lastDay,
      days,
      requiredWeeks,
      monthName: firstDay.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    };
  }, [currentMonth, currentYear]);

  // 各日付のタスク数を計算（通常タスクのみ）
  const getTasksForDate = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      // 習慣タスクは除外
      if (task.is_habit) return false;
      
      // 期間タスクの処理（開始日と期限日の両方がある場合）
      if (task.start_date && task.due_date) {
        const taskStartDate = new Date(task.start_date);
        const taskDueDate = new Date(task.due_date);
        taskStartDate.setHours(0, 0, 0, 0);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 対象日が期間内にある場合
        if (targetDate.getTime() >= taskStartDate.getTime() && 
            targetDate.getTime() <= taskDueDate.getTime()) {
          // 未完了の場合は表示
          if (task.status !== 'done') {
            return true;
          }
          // 完了済みの場合は完了日のみ表示
          if (task.status === 'done' && task.completed_at) {
            const completedDate = new Date(task.completed_at);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === targetDate.getTime();
          }
        }
        return false;
      }
      
      // 開始日のみのタスク
      if (task.start_date && !task.due_date) {
        const taskStartDate = new Date(task.start_date);
        taskStartDate.setHours(0, 0, 0, 0);
        
        // 開始日以降で未完了の場合は表示
        if (targetDate.getTime() >= taskStartDate.getTime() && task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === targetDate.getTime();
        }
        return false;
      }
      
      // 期限日のみのタスク
      if (!task.start_date && task.due_date) {
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 期限日まで（今日以降）で未完了の場合は表示
        if (targetDate.getTime() <= taskDueDate.getTime() && 
            targetDate.getTime() >= today.getTime() &&
            task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === targetDate.getTime();
        }
        return false;
      }
      
      // 開始日も期限日もないタスクの処理
      if (!task.start_date && !task.due_date) {
        // 完了済みタスク：完了日が対象日と一致
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === targetDate.getTime();
        }
        
        // 未完了タスク：今日のみ表示（対象日が今日の場合）
        if (task.status !== 'done') {
          return targetDate.getTime() === today.getTime();
        }
      }
      
      return false;
    });
  };

  // タスク表示情報を取得（シンプル版）
  const getTaskDisplayInfo = (dayTasks: Task[]) => {
    if (dayTasks.length === 0) return null;
    
    return {
      dotColor: 'bg-green-500', // タスクありは緑
      count: dayTasks.length
    };
  };

  // アクティブな習慣を取得
  const activeHabits = useMemo(() => {
    return tasks.filter(task => 
      task.is_habit 
      // 一時的にstatus条件を削除してデバッグ
    );
  }, [tasks]);

  // 習慣エリアの必要な高さを計算
  const getHabitsAreaHeight = () => {
    if (activeHabits.length === 0) return 0;
    
    // 1行あたり約6-8個のバッジが入ると仮定
    const badgesPerRow = 6;
    const rows = Math.ceil(activeHabits.length / badgesPerRow);
    
    // ヘッダー(40px) + 各行(32px) + パディング等(16px)
    return 40 + (rows * 32) + 16;
  };

  const habitsAreaHeight = getHabitsAreaHeight();
  
  // 総高さを計算して親に通知
  const totalHeight = 28 + (habitsAreaHeight / 16); // rem単位
  
  React.useEffect(() => {
    if (onHeightChange) {
      onHeightChange(totalHeight);
    }
  }, [totalHeight, onHeightChange]);

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
    <div 
      className="bg-white rounded-lg shadow-md p-4 flex flex-col"
      style={{ 
        height: `${28 + (habitsAreaHeight / 16)}rem`, // 基本28rem + 習慣エリア分
        minHeight: '28rem' 
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">カレンダー</h2>
          {/* タスクあり凡例 */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>タスクあり</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="前月"
          >
            {FaChevronLeft({ size: 16 })}
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
            {FaChevronRight({ size: 16 })}
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
      <div className={`grid grid-cols-7 gap-1 flex-1 ${
        monthData.requiredWeeks === 5 ? 'grid-rows-5' : 'grid-rows-6'
      }`}>
        {monthData.days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const dayTasks = getTasksForDate(date);
          const displayInfo = getTaskDisplayInfo(dayTasks);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          // 背景色の決定（オレンジ・期限切れ削除）
          let bgClass = '';
          if (isSelected) {
            bgClass = 'bg-blue-600 text-white font-bold ring-2 ring-blue-300';
          } else if (isToday) {
            bgClass = 'bg-blue-500 text-white font-bold';
          } else if (isCurrentMonth) {
            bgClass = 'hover:bg-blue-50';
          }

          return (
            <div
              key={index}
              className={`
                relative p-2 text-center text-sm cursor-pointer rounded transition-colors flex flex-col items-center justify-start
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${bgClass}
                ${isWeekend && !isToday && !isSelected ? 'text-red-500' : ''}
              `}
              onClick={() => handleDateClick(date)}
            >
              {/* 日付を上中央 */}
              <div className="flex-1 flex items-center justify-center">
                {date.getDate()}
              </div>
              
              {/* ドットと件数を下部 */}
              {displayInfo && (
                <div className="flex flex-col items-center gap-0.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${displayInfo.dotColor}`}></div>
                  {displayInfo.count >= 1 && (
                    <span className="text-xs leading-none">
                      {displayInfo.count}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 習慣エリア */}
      {activeHabits.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">設定中の習慣</h3>
            <span className="text-xs text-gray-500">
              {activeHabits.length}個
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {activeHabits.map(habit => (
              <span 
                key={habit.id} 
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
              >
                {habit.title}
              </span>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}; 