import React, { useMemo, useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';

interface DetailedHeatmapProps {
  tasks?: Task[];
}

interface HeatmapData {
  hour: number;
  day: number;
  count: number;
  totalDuration: number;
  intensity: number;
  taskTitles: string[];
}

interface ExecutionHeatmapData {
  heatmapData: HeatmapData[][];
  totalExecutions: number;
  totalDuration: number;
}

export const DetailedHeatmap: React.FC<DetailedHeatmapProps> = ({ tasks = [] }) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapData | null>(null);
  const [executionData, setExecutionData] = useState<ExecutionHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // 実行ログデータを取得
  useEffect(() => {
    const fetchExecutionData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/execution-heatmap');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        
        const data: ExecutionHeatmapData = await response.json();
        setExecutionData(data);
      } catch (err) {
        console.error('実行データ取得エラー:', err);
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchExecutionData();
  }, [user]);

  // 実行時間ベースのヒートマップデータを使用
  const heatmapData = useMemo(() => {
    if (executionData) {
      return executionData.heatmapData;
    }

    // フォールバック: 完了時間ベースのデータ（既存ロジック）
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
          totalDuration: 0,
          intensity: 0,
          taskTitles: []
        };
      }
    }

    // 完了時刻でデータを集計（フォールバック）
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
  }, [executionData, tasks]);

  // セルの色を計算
  const getCellColor = (intensity: number) => {
    if (intensity === 0) {
      return 'bg-[#f5f5dc] hover:bg-[#deb887] border-[#deb887]';
    } else if (intensity <= 0.2) {
      return 'bg-[#deb887] hover:bg-[#d2b48c] border-[#cd853f]';
    } else if (intensity <= 0.4) {
      return 'bg-[#cd853f] hover:bg-[#c19a6b] border-[#b8860b]';
    } else if (intensity <= 0.6) {
      return 'bg-[#b8860b] hover:bg-[#a0522d] border-[#8b4513]';
    } else if (intensity <= 0.8) {
      return 'bg-[#8b4513] hover:bg-[#654321] border-[#654321]';
    } else {
      return 'bg-[#654321] hover:bg-[#3e2723] border-[#3e2723]';
    }
  };

  const weekDays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const weekDaysShort = ['日', '月', '火', '水', '木', '金', '土'];

  // 統計情報を計算
  const stats = useMemo(() => {
    const totalExecutions = executionData?.totalExecutions || heatmapData.flat().reduce((sum, cell) => sum + cell.count, 0);
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

    // 総実行時間（分単位）
    const totalDurationMinutes = executionData?.totalDuration 
      ? Math.floor(executionData.totalDuration / 60)
      : 0;

    return {
      totalExecutions,
      activeCells,
      peakHour,
      peakDay,
      peakHourCount: hourCounts[peakHour],
      peakDayCount: dayCounts[peakDay],
      totalDurationMinutes
    };
  }, [heatmapData, executionData]);

  // 時間フォーマット関数
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="wood-frame rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#8b4513] mb-2">実行時間ヒートマップ</h2>
          <p className="text-sm text-[#7c5a2a]">
            タスクを実行した時間帯のパターンを可視化しています
          </p>
        </div>
        <div className="text-center text-[#7c5a2a] py-8">
          データを読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wood-frame rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#8b4513] mb-2">実行時間ヒートマップ</h2>
          <p className="text-sm text-[#7c5a2a]">
            タスクを実行した時間帯のパターンを可視化しています
          </p>
        </div>
        <div className="text-center text-[#8b4513] py-8">
          エラー: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="wood-frame rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#8b4513] mb-2">
          {executionData ? '実行時間ヒートマップ' : '完了時間ヒートマップ'}
        </h2>
        <p className="text-sm text-[#7c5a2a]">
          {executionData 
            ? 'タスクを実行した時間帯のパターンを可視化しています（実行回数と実行時間を考慮）'
            : 'タスクを完了した時間帯のパターンを可視化しています（実行データが不足しているため完了時間で表示）'
          }
        </p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#f5f5dc] p-3 rounded-lg border border-[#deb887]">
          <div className="text-2xl font-bold text-[#8b4513]">{stats.totalExecutions}</div>
          <div className="text-xs text-[#7c5a2a]">
            {executionData ? '総実行回数' : '総完了数'}
          </div>
        </div>
        {executionData && (
          <div className="bg-[#f5f5dc] p-3 rounded-lg border border-[#deb887]">
            <div className="text-2xl font-bold text-[#8b4513]">{stats.totalDurationMinutes}分</div>
            <div className="text-xs text-[#7c5a2a]">総実行時間</div>
          </div>
        )}
        <div className="bg-[#f5f5dc] p-3 rounded-lg border border-[#deb887]">
          <div className="text-2xl font-bold text-[#8b4513]">{stats.activeCells}</div>
          <div className="text-xs text-[#7c5a2a]">活動時間帯</div>
        </div>
        <div className="bg-[#f5f5dc] p-3 rounded-lg border border-[#deb887]">
          <div className="text-2xl font-bold text-[#8b4513]">{stats.peakHour}時</div>
          <div className="text-xs text-[#7c5a2a]">最活発時間</div>
        </div>
        <div className="bg-[#f5f5dc] p-3 rounded-lg border border-[#deb887]">
          <div className="text-2xl font-bold text-[#8b4513]">{weekDaysShort[stats.peakDay]}</div>
          <div className="text-xs text-[#7c5a2a]">最活発曜日</div>
        </div>
      </div>

      {/* ヒートマップ */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-xs text-[#7c5a2a] text-center py-2"></div>
            {weekDaysShort.map(day => (
              <div key={day} className="text-xs text-[#8b4513] text-center font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* ヒートマップグリッド */}
          <div className="space-y-1">
            {heatmapData.map((hourRow, hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1">
                <div className="text-xs text-[#7c5a2a] text-right py-2 pr-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {hourRow.map((cell, dayIndex) => (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`h-8 rounded-sm transition-all duration-200 cursor-pointer ${getCellColor(cell.intensity)}`}
                    onClick={() => setSelectedCell(cell)}
                    title={`${weekDays[dayIndex]} ${hour}:00 - ${cell.count}回実行${executionData && cell.totalDuration > 0 ? ` (${formatDuration(cell.totalDuration)})` : ''}`}
                  >
                    {cell.count > 0 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className={`text-xs font-medium ${
                          cell.intensity > 0.5 ? 'text-white' : 'text-[#8b4513]'
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
      <div className="mt-6 pt-4 border-t border-[#deb887]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#7c5a2a]">
              {executionData ? '実行回数:' : '完了数:'}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#7c5a2a]">0</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-[#f5f5dc] rounded-sm border border-[#deb887]"></div>
                <div className="w-4 h-4 bg-[#deb887] rounded-sm border border-[#cd853f]"></div>
                <div className="w-4 h-4 bg-[#cd853f] rounded-sm border border-[#b8860b]"></div>
                <div className="w-4 h-4 bg-[#b8860b] rounded-sm border border-[#8b4513]"></div>
                <div className="w-4 h-4 bg-[#8b4513] rounded-sm border border-[#654321]"></div>
                <div className="w-4 h-4 bg-[#654321] rounded-sm border border-[#3e2723]"></div>
              </div>
              <span className="text-xs text-[#7c5a2a]">多い</span>
            </div>
          </div>
          <div className="text-sm text-[#7c5a2a]">
            最大: {Math.max(...heatmapData.flat().map(cell => cell.count))}回
          </div>
        </div>
      </div>

      {/* 選択されたセルの詳細情報 */}
      {selectedCell && selectedCell.count > 0 && (
        <div className="mt-6 p-4 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-[#8b4513]">
              {weekDays[selectedCell.day]} {selectedCell.hour}:00の{executionData ? '実行' : '完了'}タスク
            </h4>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-[#7c5a2a] hover:text-[#8b4513]"
            >
              ×
            </button>
          </div>
          <div className="text-sm text-[#7c5a2a] mb-2">
            {selectedCell.count}回{executionData ? '実行' : '完了'}されました
            {executionData && selectedCell.totalDuration > 0 && (
              <span className="ml-2 text-[#8b4513]">
                (総実行時間: {formatDuration(selectedCell.totalDuration)})
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {selectedCell.taskTitles.map((title, index) => (
              <div key={index} className="text-sm bg-white px-2 py-1 rounded border border-[#deb887]">
                {title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 