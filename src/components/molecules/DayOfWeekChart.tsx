import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';

interface DayOfWeekChartProps {
  tasks?: Task[];
}

export const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({ tasks = [] }) => {
  const router = useRouter();

  // 曜日別の完了タスク数を計算
  const weeklyData = useMemo(() => {
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completed_at);
    
    const dayCount = weekDays.map((day, index) => {
      const count = completedTasks.filter(task => {
        const completedDate = new Date(task.completed_at!);
        return completedDate.getDay() === index;
      }).length;
      
      return { day, count };
    });

    const maxCount = Math.max(...dayCount.map(d => d.count), 1);
    
    return dayCount.map(item => ({
      ...item,
      percentage: (item.count / maxCount) * 100
    }));
  }, [tasks]);

  const handleClick = () => {
    router.push('/progress');
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">曜日別傾向</h3>
        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          詳細を見る →
        </span>
      </div>
      
      <div className="space-y-3">
        {weeklyData.map((item, index) => (
          <div key={item.day} className="flex items-center gap-3">
            <div className="w-6 text-sm font-medium text-gray-600 text-center">
              {item.day}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 group-hover:from-blue-500 group-hover:to-blue-700 h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(item.percentage, 5)}%` }}
              >
                {item.count > 0 && (
                  <span className="text-white text-xs font-medium">
                    {item.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>完了タスク数</span>
          <span>最大: {Math.max(...weeklyData.map(d => d.count))}</span>
        </div>
      </div>
    </div>
  );
}; 