import React, { useMemo, useState } from 'react';
import { Task } from '@/stores/taskStore';

interface DetailedHeatmapProps {
  tasks?: Task[];
}

interface HeatmapData {
  hour: number;
  day: number;
  count: number;
  intensity: number;
  taskTitles: string[];
}

export const DetailedHeatmap: React.FC<DetailedHeatmapProps> = ({ tasks = [] }) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapData | null>(null);

  // 完全なヒートマップデータを計算
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
          intensity: 0,
          taskTitles: []
        };
      }
    }

    // 完了時刻でデータを集計
    completedTasks.forEach(task => {
      const completedDate = new Date(task.completed_at!);
      const hour = completedDate.getHours();
      const day = completedDate.getDay();
      matrix[hour][day].count++;
      matrix[hour][day].taskTitles.push(task.title);
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
      return 'bg-gray-100 hover:bg-gray-200';
    } else if (intensity <= 0.2) {
      return 'bg-blue-100 hover:bg-blue-200';
    } else if (intensity <= 0.4) {
      return 'bg-blue-300 hover:bg-blue-400';
    } else if (intensity <= 0.6) {
      return 'bg-blue-500 hover:bg-blue-600';
    } else if (intensity <= 0.8) {
      return 'bg-blue-700 hover:bg-blue-800';
    } else {
      return 'bg-blue-900 hover:bg-blue-950';
    }
  };

  const weekDays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const weekDaysShort = ['日', '月', '火', '水', '木', '金', '土'];

  // 統計情報を計算
  const stats = useMemo(() => {
    const totalCompletions = heatmapData.flat().reduce((sum, cell) => sum + cell.count, 0);
    const activeCells = heatmapData.flat().filter(cell => cell.count > 0).length;
    
    // 最も活発な時間帯
    const hourCounts = Array(24).fill(0);
    heatmapData.forEach((hourRow, hour) => {
      hourCounts[hour] = hourRow.reduce((sum, cell) => sum + cell.count, 0);
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    
    // 最も活発な曜日
    const dayCounts = Array(7).fill(0);
    heatmapData.forEach(hourRow => {
      hourRow.forEach((cell, day) => {
        dayCounts[day] += cell.count;
      });
    });
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

    return {
      totalCompletions,
      activeCells,
      peakHour,
      peakDay,
      peakHourCount: hourCounts[peakHour],
      peakDayCount: dayCounts[peakDay]
    };
  }, [heatmapData]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">完了時間ヒートマップ</h2>
        <p className="text-sm text-gray-600">
          タスクを完了した時間帯のパターンを可視化しています
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalCompletions}</div>
          <div className="text-xs text-gray-600">総完了数</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.activeCells}</div>
          <div className="text-xs text-gray-600">活動時間帯</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.peakHour}時</div>
          <div className="text-xs text-gray-600">最活発時間</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{weekDaysShort[stats.peakDay]}</div>
          <div className="text-xs text-gray-600">最活発曜日</div>
        </div>
      </div>

      {/* ヒートマップ */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-xs text-gray-500 text-center py-2"></div>
            {weekDaysShort.map(day => (
              <div key={day} className="text-xs text-gray-700 text-center font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* ヒートマップグリッド */}
          <div className="space-y-1">
            {heatmapData.map((hourRow, hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1">
                <div className="text-xs text-gray-500 text-right py-2 pr-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {hourRow.map((cell, dayIndex) => (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`h-8 rounded-sm transition-all duration-200 cursor-pointer border border-gray-200 ${getCellColor(cell.intensity)}`}
                    onClick={() => setSelectedCell(cell)}
                    title={`${weekDays[dayIndex]} ${hour}:00 - ${cell.count}個完了`}
                  >
                    {cell.count > 0 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className={`text-xs font-medium ${
                          cell.intensity > 0.5 ? 'text-white' : 'text-gray-700'
                        }`}>
                          {cell.count > 99 ? '99+' : cell.count}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">完了数:</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">0</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-gray-100 rounded-sm border border-gray-200"></div>
                <div className="w-4 h-4 bg-blue-100 rounded-sm border border-gray-200"></div>
                <div className="w-4 h-4 bg-blue-300 rounded-sm border border-gray-200"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-sm border border-gray-200"></div>
                <div className="w-4 h-4 bg-blue-700 rounded-sm border border-gray-200"></div>
                <div className="w-4 h-4 bg-blue-900 rounded-sm border border-gray-200"></div>
              </div>
              <span className="text-xs text-gray-500">多い</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            最大: {Math.max(...heatmapData.flat().map(cell => cell.count))}個
          </div>
        </div>
      </div>

      {/* 選択されたセルの詳細情報 */}
      {selectedCell && selectedCell.count > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900">
              {weekDays[selectedCell.day]} {selectedCell.hour}:00の完了タスク
            </h4>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="text-sm text-gray-700 mb-2">
            {selectedCell.count}個のタスクが完了されました
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedCell.taskTitles.map((title, index) => (
              <div key={index} className="text-sm bg-white px-2 py-1 rounded border">
                {title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 