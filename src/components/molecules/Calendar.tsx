import React, { useMemo, useState } from 'react';
import { Task } from '@/stores/taskStore';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaFire, FaTasks, FaInfoCircle } from 'react-icons/fa';

interface CalendarProps {
  tasks?: Task[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onHeightChange?: (height: number) => void;
}

type DisplayMode = 'month' | 'week';
type CalendarMode = 'tasks' | 'habits';

export const Calendar: React.FC<CalendarProps> = ({ tasks = [], selectedDate, onDateSelect, onHeightChange }) => {
  const today = new Date();
  
  // 表示モードとカレンダーモードの状態管理
  const [displayMode, setDisplayMode] = useState<DisplayMode>('month');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('habits');
  
  // ツールチップの状態管理
  const [showLegendTooltip, setShowLegendTooltip] = useState(false);
  
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

  // 週表示用のデータ計算
  const weekData = useMemo(() => {
    const targetDate = selectedDate || today;
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    return { 
      days, 
      startOfWeek,
      endOfWeek,
      weekName: `${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`
    };
  }, [selectedDate, today]);

  // 各日付のタスク数を計算（通常タスクのみ）
  const getTasksForDate = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      // カレンダーモードに応じてフィルタリング
      if (calendarMode === 'tasks' && task.is_habit) return false;
      if (calendarMode === 'habits' && !task.is_habit) return false;
      
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

  // タスク表示情報を取得（カレンダーモード対応）
  const getTaskDisplayInfo = (dayTasks: Task[]) => {
    if (dayTasks.length === 0) return null;
    
    // カレンダーモードに応じた色とアイコン
    if (calendarMode === 'tasks') {
      return {
        dotColor: 'bg-red-500', // タスクは赤色
        count: dayTasks.length,
        icon: '📋'
      };
    } else {
      // 習慣モード
      const overdueHabits = dayTasks.filter(task => isHabitOverdue(task));
      const normalHabits = dayTasks.filter(task => !isHabitOverdue(task));
    
    return {
        dotColor: overdueHabits.length > 0 ? 'bg-orange-500' : 'bg-blue-500', // 期限切れはオレンジ、通常は青
        count: dayTasks.length,
        icon: '🔥',
        overdueCount: overdueHabits.length
      };
    }
  };

  // アクティブな習慣を取得
  const activeHabits = useMemo(() => {
    return tasks.filter(task => 
      task.is_habit 
      // 一時的にstatus条件を削除してデバッグ
    );
  }, [tasks]);

  // カレンダーの高さを動的に調整
  React.useEffect(() => {
    if (onHeightChange) {
      const baseHeight = 28; // 基本28rem
      const habitsHeight = calendarMode === 'habits' && activeHabits.length > 0 ? 4 : 0; // 習慣エリア4rem
      const statsHeight = displayMode === 'week' ? 6 : 0; // 統計エリア6rem
      const totalHeight = baseHeight + habitsHeight + statsHeight;
      onHeightChange(totalHeight);
    }
  }, [onHeightChange, activeHabits.length, calendarMode, displayMode]);

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

  // 週表示のナビゲーション
  const goToPreviousWeek = () => {
    if (onDateSelect) {
      const currentTarget = selectedDate || today;
      const previousWeek = new Date(currentTarget);
      previousWeek.setDate(previousWeek.getDate() - 7);
      onDateSelect(previousWeek);
    }
  };

  const goToNextWeek = () => {
    if (onDateSelect) {
      const currentTarget = selectedDate || today;
      const nextWeek = new Date(currentTarget);
      nextWeek.setDate(nextWeek.getDate() + 7);
      onDateSelect(nextWeek);
    }
  };

  const goToThisWeek = () => {
    if (onDateSelect) {
      onDateSelect(today);
    }
  };

  // 習慣の頻度表示
  const getFrequencyIcon = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'monthly': return '🗓️';
      default: return '📅';
    }
  };

  // 習慣の期限切れチェック
  const isHabitOverdue = (task: Task) => {
    if (!task.is_habit || !task.due_date) return false;
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate.getTime() < today.getTime() && task.status !== 'done';
  };

  // タスクアイコンを取得
  const getTaskIcon = (task: Task) => {
    if (task.is_habit) {
      return '🔥'; // 習慣は炎アイコン
    }
    
    // カテゴリに応じたアイコン
    switch (task.category) {
      case 'work':
        return '💼';
      case 'personal':
        return '👤';
      case 'health':
        return '🏃';
      case 'study':
        return '📚';
      case 'shopping':
        return '🛒';
      case 'meeting':
        return '⏰';
      case 'home':
        return '🏠';
      default:
        return '📋';
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 flex flex-col"
      style={{ 
        minHeight: '46rem',
        height: '46rem',
      }}
    >
      {/* カレンダーのタイトルを最上部に移動 */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-900">カレンダー</h2>
      </div>
      {/* ヘッダー部分（凡例・切り替え・ナビゲーション） */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {/* 凡例ツールチップ */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowLegendTooltip(true)}
              onMouseLeave={() => setShowLegendTooltip(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="凡例を表示"
            >
              {FaInfoCircle({ className: "w-4 h-4" })}
            </button>
            {/* ツールチップ */}
            {showLegendTooltip && (
              <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 mb-2">凡例</div>
                <div className="space-y-2">
                  {/* 習慣モードの凡例 */}
                  {calendarMode === 'habits' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">習慣あり</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">期限切れ習慣</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">📅 毎日</span>
                        <span className="text-sm text-gray-500">📊 毎週</span>
                        <span className="text-sm text-gray-500">🗓️ 毎月</span>
                      </div>
                    </>
                  )}
                  {/* タスクモードの凡例 */}
                  {calendarMode === 'tasks' && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">タスクあり</span>
                    </div>
                  )}
                  {/* 共通の凡例 */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">今日</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full ring-2 ring-blue-300 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">選択中</span>
                  </div>
                </div>
                {/* ツールチップの矢印 */}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
              </div>
            )}
          </div>
          {/* 表示モード切り替え */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDisplayMode('month')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                displayMode === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {FaCalendarAlt({ className: "w-3 h-3" })}
              <span>月</span>
            </button>
            <button
              onClick={() => setDisplayMode('week')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                displayMode === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>週</span>
            </button>
          </div>
          {/* カレンダーモード切り替え */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCalendarMode('habits')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                calendarMode === 'habits' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {FaFire({ className: "w-3 h-3" })}
              <span>習慣</span>
            </button>
            <button
              onClick={() => setCalendarMode('tasks')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                calendarMode === 'tasks' 
                  ? 'bg-white text-red-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {FaTasks({ className: "w-3 h-3" })}
              <span>タスク</span>
            </button>
          </div>
        </div>
        {/* ナビゲーションボタン */}
        <div className="flex items-center gap-2">
          <button
            onClick={displayMode === 'month' ? goToPreviousMonth : goToPreviousWeek}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title={displayMode === 'month' ? '前月' : '前週'}
          >
            {FaChevronLeft({ size: 16 })}
          </button>
          <button
            onClick={displayMode === 'month' ? goToToday : goToThisWeek}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
            title={displayMode === 'month' ? '今日の月に戻る' : '今週に戻る'}
          >
            {displayMode === 'month' ? monthData.monthName : weekData.weekName}
          </button>
          <button
            onClick={displayMode === 'month' ? goToNextMonth : goToNextWeek}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title={displayMode === 'month' ? '次月' : '次週'}
          >
            {FaChevronRight({ size: 16 })}
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー（月表示専用、シンプル化） */}
      {displayMode === 'month' && (
        <div className="grid grid-cols-7 gap-3 w-full mb-4">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}
        </div>
      )}

      {/* カレンダーグリッド（月表示専用、シンプル化） */}
      {displayMode === 'month' && (
        <div className="grid grid-cols-7 gap-3 w-full grid-rows-7">
          {monthData.days.map((date, i) => {
            const isTodayDate = date.getDate() === today.getDate() && 
                               date.getMonth() === today.getMonth() && 
                               date.getFullYear() === today.getFullYear();
            const isCurrentMonthDate = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            const dayTasks = getTasksForDate(date);
            const taskInfo = getTaskDisplayInfo(dayTasks);
            
            return (
              <div
                key={i}
                className={`relative p-3 text-center cursor-pointer rounded-xl transition-all duration-200 flex flex-col items-center justify-between h-20 ${
                  isTodayDate 
                    ? 'bg-blue-50 ring-2 ring-blue-200 shadow-sm' 
                    : isCurrentMonthDate
                    ? 'bg-white border border-gray-100 hover:bg-gray-50 hover:shadow-md'
                    : 'bg-gray-50 border border-gray-100'
                }`}
                onClick={() => handleDateClick(date)}
              >
                {/* 1列目: 日付 */}
                <div className={`text-sm font-bold ${
                  isTodayDate 
                    ? 'text-blue-700' 
                    : isCurrentMonthDate 
                    ? 'text-gray-900' 
                    : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </div>
                
                {/* 2列目: 凡例バッチ */}
                <div className="flex justify-center">
                  {taskInfo ? (
                    <div className={`w-2 h-2 rounded-full ${taskInfo.dotColor} shadow-sm`}></div>
                  ) : (
                    <div className="w-2 h-2"></div>
                  )}
                </div>
                
                {/* 3列目: 習慣数・タスク数 */}
                <div className="flex justify-center">
                  {taskInfo && taskInfo.count >= 1 ? (
                    <div className="bg-gray-100 rounded-full px-1.5 py-0.5">
                      <span className="text-xs font-semibold text-gray-700">
                        {taskInfo.count}
                      </span>
                    </div>
                  ) : (
                    <div className="h-5"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 週表示のカレンダーグリッド（曜日ラベル＋日付セルのペアを縦に7行） */}
      {displayMode === 'week' && (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-row items-start gap-2 w-full min-h-[4.5rem]">
              {/* 曜日ラベル */}
              <div className="w-10 flex-shrink-0 p-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg flex items-center justify-center">
                {['日', '月', '火', '水', '木', '金', '土'][i]}
              </div>
              {/* 日付セル */}
              {(() => {
                const date = weekData.days[i];
                const isTodayDate = date.getDate() === today.getDate() && 
                                   date.getMonth() === today.getMonth() && 
                                   date.getFullYear() === today.getFullYear();
                const dayTasks = getTasksForDate(date);
                const taskInfo = getTaskDisplayInfo(dayTasks);
                return (
                  <div
                    className={`relative p-3 text-left cursor-pointer rounded-xl transition-all duration-200 flex flex-col items-start justify-start w-full ${
                      isTodayDate 
                        ? 'bg-blue-50 ring-2 ring-blue-200 shadow-sm' 
                        : 'bg-white border border-gray-100 hover:bg-gray-50 hover:shadow-md'
                    }`}
                    style={{ minHeight: '5rem' }}
                    onClick={() => handleDateClick(date)}
                  >
                    {/* 日付 */}
                    <div className={`text-sm font-bold mb-1 ${
                      isTodayDate ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    {/* 凡例バッチ＋タスク・習慣タイトル（横並び1行） */}
                    <div className="flex flex-row items-center gap-2 w-full">
                      {/* バッチ */}
                      {taskInfo ? (
                        <div className={`w-2 h-2 rounded-full ${taskInfo.dotColor} shadow-sm flex-shrink-0`}></div>
                      ) : (
                        <div className="w-2 h-2 flex-shrink-0"></div>
                      )}
                      {/* タスク・習慣リスト（横並び） */}
                      <div className="flex flex-row flex-wrap gap-2 items-center w-full">
                        {dayTasks.slice(0, 6).map((task, idx) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded bg-gray-50 max-w-[8rem] ${
                              task.status === 'done' ? 'line-through text-gray-400 bg-gray-100' : task.is_habit ? 'text-orange-700 bg-orange-50' : 'text-blue-700 bg-blue-50'
                            }`}
                            title={task.title}
                            style={{ fontSize: '11px' }}
                          >
                            <span className="flex-shrink-0">{getTaskIcon(task)}</span>
                            <span className="truncate" style={{ maxWidth: '5.5rem' }}>{task.title.length > 12 ? task.title.substring(0, 12) + '...' : task.title}</span>
                          </div>
                        ))}
                        {dayTasks.length > 6 && (
                          <div className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                            +{dayTasks.length - 6}件
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}; 