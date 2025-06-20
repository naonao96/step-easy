import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';

interface HeatmapChartProps {
  tasks?: Task[];
}

interface HeatmapData {
  hour: number;
  day: number;
  count: number;
  intensity: number;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ tasks = [] }) => {
  const router = useRouter();

  // ヒートマップデータを計算
  const heatmapData = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completed_at);
    
    // 24時間 × 7曜日のマトリックスを初期化
    const matrix: HeatmapData[][] = [];
    for (let hour = 0; hour < 24; hour++) {
      matrix[hour] = [];
      for (let day = 0; day < 7; day++) {
        matrix[hour][day] = {
          hour,
          day,
          count: 0,
          intensity: 0
        };
      }
    }

    // 完了時刻でデータを集計
    completedTasks.forEach(task => {
      const completedDate = new Date(task.completed_at!);
      const hour = completedDate.getHours();
      const day = completedDate.getDay();
      matrix[hour][day].count++;
    });

    // 最大値を求めて強度を計算
    const maxCount = Math.max(
      ...matrix.flat().map(cell => cell.count),
      1
    );

    // 強度を0-1の範囲で正規化
    matrix.forEach(hourRow => {
      hourRow.forEach(cell => {
        cell.intensity = cell.count / maxCount;
      });
    });

    return matrix;
  }, [tasks]);

  // セルの色を計算
  const getCellColor = (intensity: number) => {
    if (intensity === 0) {
      return 'bg-gray-100';
    } else if (intensity <= 0.25) {
      return 'bg-blue-200';
    } else if (intensity <= 0.5) {
      return 'bg-blue-400';
    } else if (intensity <= 0.75) {
      return 'bg-blue-600';
    } else {
      return 'bg-blue-800';
    }
  };

  const handleClick = () => {
    router.push('/progress?tab=heatmap');
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const displayHours = [6, 9, 12, 15, 18, 21]; // 表示する時間（簡略化）

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">完了時間ヒートマップ</h3>
        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          詳細を見る →
        </span>
      </div>

      <div className="space-y-2">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-8 gap-1">
          <div className="text-xs text-gray-500 text-center"></div>
          {weekDays.map(day => (
            <div key={day} className="text-xs text-gray-600 text-center font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* ヒートマップグリッド */}
        {displayHours.map(hour => (
          <div key={hour} className="grid grid-cols-8 gap-1">
            <div className="text-xs text-gray-500 text-center py-1">
              {hour}:00
            </div>
            {heatmapData[hour].map((cell, dayIndex) => (
              <div
                key={`${hour}-${dayIndex}`}
                className={`h-6 rounded-sm transition-all duration-200 group-hover:scale-105 ${getCellColor(cell.intensity)}`}
                title={`${weekDays[dayIndex]} ${hour}:00 - ${cell.count}個完了`}
              >
                {cell.count > 0 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {cell.count > 9 ? '9+' : cell.count}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">少ない</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-800 rounded-sm"></div>
            </div>
            <span className="text-xs text-gray-500">多い</span>
          </div>
          <div className="text-xs text-gray-500">
            最大: {Math.max(...heatmapData.flat().map(cell => cell.count))}個
          </div>
        </div>
      </div>
    </div>
  );
}; 