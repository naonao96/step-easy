import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';
import { StreakBadge } from '../atoms/StreakBadge';
import { getActiveStreakTasks, getRiskyStreakTasks } from '@/lib/streakUtils';

interface ActivityStatsProps {
  tasks?: Task[];
  selectedDateTasks?: Task[];
  selectedDate?: Date;
}

export const ActivityStats: React.FC<ActivityStatsProps> = ({ 
  tasks = [], 
  selectedDateTasks, 
  selectedDate 
}) => {
  const router = useRouter();

  // 選択日に応じたタイトルを生成
  const getTitle = () => {
    if (!selectedDate) return '今日の達成度';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.getTime() === today.getTime()) {
      return '今日の達成度';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selected.getTime() === tomorrow.getTime()) {
      return '明日の達成度';
    }
    
    if (selected.getTime() === yesterday.getTime()) {
      return '昨日の達成度';
    }
    
    // その他の日付
    const month = selected.getMonth() + 1;
    const day = selected.getDate();
    return `${month}/${day}の達成度`;
  };

  // 今日の達成度を計算
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 選択された日付のタスクが提供されている場合はそれを使用
    // そうでなければ従来のロジックで今日のタスクを計算
    let relevantTasks: Task[];
    
    if (selectedDateTasks && selectedDate) {
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(0, 0, 0, 0);
      
      // 選択日が今日の場合は、選択されたタスクを使用
      if (selectedDateTime.getTime() === today.getTime()) {
        relevantTasks = selectedDateTasks;
      } else {
        // 選択日が今日以外の場合は、従来のロジックで今日のタスクを計算
        relevantTasks = tasks.filter(task => {
          if (task.due_date) {
            const dueDate = new Date(task.due_date);
            return dueDate.toDateString() === today.toDateString();
          } else {
            if (task.status === 'done' && task.completed_at) {
              const completedDate = new Date(task.completed_at);
              return completedDate.toDateString() === today.toDateString();
            } else {
              return task.status !== 'done';
            }
          }
        });
      }
    } else {
      // 従来のロジック
      relevantTasks = tasks.filter(task => {
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          return dueDate.toDateString() === today.toDateString();
        } else {
          if (task.status === 'done' && task.completed_at) {
            const completedDate = new Date(task.completed_at);
            return completedDate.toDateString() === today.toDateString();
          } else {
            return task.status !== 'done';
          }
        }
      });
    }

    const completedTasks = relevantTasks.filter(task => task.status === 'done');
    const totalTasks = relevantTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    return {
      completed: completedTasks.length,
      total: totalTasks,
      percentage
    };
  }, [tasks, selectedDateTasks, selectedDate]);

  // 継続日数統計を計算（修正版）
  const streakStats = useMemo(() => {
    const activeStreaks = getActiveStreakTasks(tasks as any);
    const riskyStreaks = getRiskyStreakTasks(tasks as any);
    const totalActiveStreaks = activeStreaks.length;
    
    // 上位3つのストリークを取得（アクティブなもののみ）
    const topStreaks = activeStreaks
      .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
      .slice(0, 3);

    return {
      totalActiveStreaks,
      riskyStreaksCount: riskyStreaks.length,
      topStreaks
    };
  }, [tasks]);

  // 円グラフ用の計算
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayStats.percentage / 100) * circumference;

  const handleClick = () => {
    router.push('/progress?tab=today');
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          詳細を見る →
        </span>
      </div>
      
      <div className="flex flex-col items-center">
        {/* 円グラフ */}
        <div className="relative w-40 h-40 mb-4">
          <svg 
            className="absolute top-0 left-0 w-full h-full transform -rotate-90"
            viewBox="0 0 160 160"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 背景の円 */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            {/* 進捗の円 */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#3b82f6"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out group-hover:stroke-blue-500"
            />
          </svg>
          {/* 中央の数値 */}
          <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-blue-600 group-hover:text-blue-500 transition-colors">
              {todayStats.percentage}%
            </span>
            <span className="text-sm text-gray-500">
              {todayStats.completed}/{todayStats.total}
            </span>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">
            今日のタスク進捗
          </p>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">完了: {todayStats.completed}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-gray-600">残り: {todayStats.total - todayStats.completed}</span>
            </div>
          </div>
        </div>

        {/* 継続日数統計（修正版） */}
        {streakStats.totalActiveStreaks > 0 && (
          <div className="w-full mt-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">継続中のタスク</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-orange-600 font-medium">
                  {streakStats.totalActiveStreaks}件
                </span>
                {streakStats.riskyStreaksCount > 0 && (
                  <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded">
                    ⚠️ {streakStats.riskyStreaksCount}件注意
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {streakStats.topStreaks.map(task => (
                <div key={task.id} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 truncate flex-1 mr-2">{task.title}</span>
                  <StreakBadge 
                    task={task}
                    size="sm"
                    showText={false}
                    showTimeRemaining={true}
                  />
                </div>
              ))}
              {streakStats.totalActiveStreaks > 3 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  他 {streakStats.totalActiveStreaks - 3}件
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 