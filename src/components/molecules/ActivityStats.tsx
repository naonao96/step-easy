import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';

interface ActivityStatsProps {
  tasks?: Task[];
}

export const ActivityStats: React.FC<ActivityStatsProps> = ({ tasks = [] }) => {
  const router = useRouter();

  // 今日の達成度を計算
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        return dueDate.toDateString() === today.toDateString();
      }
      return task.status !== 'done'; // 期限がないタスクは未完了のものを今日のタスクとして扱う
    });

    const completedTasks = todayTasks.filter(task => task.status === 'done');
    const totalTasks = todayTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    return {
      completed: completedTasks.length,
      total: totalTasks,
      percentage
    };
  }, [tasks]);

  // 円グラフ用の計算
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayStats.percentage / 100) * circumference;

  const handleClick = () => {
    router.push('/progress');
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">今日の達成度</h3>
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
        <div className="text-center">
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
      </div>
    </div>
  );
}; 