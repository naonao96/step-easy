import React, { useState, useMemo } from 'react';
import { Task } from '@/types/task';
import { DEFAULT_CATEGORIES } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';
import { useExecutionStore } from '@/stores/executionStore';
import { 
  FaFolderOpen,
  FaFire,
  FaTrophy
} from 'react-icons/fa';

interface MobileDetailedAnalysisProps {
  tasks: Task[];
  selectedTask?: Task;
  onExecutionComplete?: () => void;
}

type AnalysisTab = 'heatmap' | 'category' | 'performance';

export const MobileDetailedAnalysis: React.FC<MobileDetailedAnalysisProps> = ({
  tasks,
  selectedTask,
  onExecutionComplete
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('heatmap');



  // タブ定義
  const tabs = [
    { id: 'heatmap' as AnalysisTab, label: 'ヒートマップ', icon: FaFire },
    { id: 'category' as AnalysisTab, label: 'カテゴリ', icon: FaFolderOpen },
    { id: 'performance' as AnalysisTab, label: 'パフォーマンス', icon: FaTrophy }
  ];



  // ヒートマップ（簡易版）
  const renderHeatmap = () => {
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completed_at);
    
    // 24時間×7曜日のマトリックス（簡易版）
    const heatmapData = useMemo(() => {
      const matrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
      
      completedTasks.forEach(task => {
        const completedDate = new Date(task.completed_at!);
        const hour = completedDate.getHours();
        const day = completedDate.getDay();
        matrix[day][hour]++;
      });
      
      return matrix;
    }, [completedTasks]);

    const maxCount = Math.max(...heatmapData.flat(), 1);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const displayHours = [6, 9, 12, 15, 18, 21];

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-4">完了時間パターン</h3>
          
          {/* 簡易ヒートマップ */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-xs text-center font-medium text-gray-600">
              {weekDays.map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>
            
            {displayHours.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-1 items-center">
                <div className="text-xs text-gray-500 text-right pr-2">
                  {hour}:00
                </div>
                {heatmapData.map((dayData, dayIndex) => {
                  const count = dayData[hour];
                  const intensity = count / maxCount;
                  return (
                    <div
                      key={dayIndex}
                      className={`h-6 rounded-sm flex items-center justify-center text-xs font-medium ${
                        intensity === 0 ? 'bg-gray-100' :
                        intensity <= 0.25 ? 'bg-blue-200 text-blue-800' :
                        intensity <= 0.5 ? 'bg-blue-400 text-white' :
                        intensity <= 0.75 ? 'bg-blue-600 text-white' :
                        'bg-blue-800 text-white'
                      }`}
                    >
                      {count > 0 ? (count > 9 ? '9+' : count) : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* 統計 */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">総完了数</span>
                <div className="font-bold text-blue-600">{completedTasks.length}</div>
              </div>
              <div>
                <span className="text-gray-600">最大完了数</span>
                <div className="font-bold text-green-600">{maxCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // カテゴリ統計
  const renderCategory = () => {
    const categoryStats = useMemo(() => {
      const completedTasks = tasks.filter(task => task.status === 'done');
      
      return DEFAULT_CATEGORIES.map(category => {
        const categoryTasks = tasks.filter(task => task.category === category.id);
        const categoryCompletedTasks = completedTasks.filter(task => task.category === category.id);
        
        return {
          ...category,
          totalTasks: categoryTasks.length,
          completedTasks: categoryCompletedTasks.length,
          percentage: categoryTasks.length > 0 ? Math.round((categoryCompletedTasks.length / categoryTasks.length) * 100) : 0
        };
      }).filter(stat => stat.totalTasks > 0)
        .sort((a, b) => b.percentage - a.percentage);
    }, [tasks]);

    return (
      <div className="space-y-3">
        {categoryStats.map((category, index) => (
          <div key={category.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {index === 0 && <span className="text-lg">🏆</span>}
                {index === 1 && <span className="text-lg">🥈</span>}
                {index === 2 && <span className="text-lg">🥉</span>}
                <span className="font-semibold text-gray-900">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{category.percentage}%</div>
                <div className="text-xs text-gray-500">
                  {category.completedTasks}/{category.totalTasks}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  category.percentage === 100 ? 'bg-green-500' :
                  category.percentage >= 75 ? 'bg-blue-500' :
                  category.percentage >= 50 ? 'bg-amber-500' : 'bg-gray-400'
                }`}
                style={{ width: `${category.percentage}%` }}
              />
            </div>
          </div>
        ))}
        
        {categoryStats.length === 0 && (
          <div className="text-center py-8">
            {FaFolderOpen ({className:"w-12 h-12 text-gray-300 mx-auto mb-4"})}
            <p className="text-gray-500">カテゴリ統計がありません</p>
          </div>
        )}
      </div>
    );
  };

  // パフォーマンス分析
  const renderPerformance = () => {
    const performanceStats = useMemo(() => {
      const completedTasks = tasks.filter(task => task.status === 'done');
      const tasksWithEstimate = completedTasks.filter(task => 
        task.estimated_duration && task.actual_duration
      );
      
      if (tasksWithEstimate.length === 0) {
        return null;
      }

      const avgAccuracy = tasksWithEstimate.reduce((sum, task) => {
        const accuracy = (task.estimated_duration! / task.actual_duration!) * 100;
        return sum + Math.min(accuracy, 100);
      }, 0) / tasksWithEstimate.length;

      const onTimeCount = tasksWithEstimate.filter(task => 
        task.actual_duration! <= task.estimated_duration!
      ).length;

      return {
        totalAnalyzed: tasksWithEstimate.length,
        avgAccuracy: Math.round(avgAccuracy),
        onTimeRate: Math.round((onTimeCount / tasksWithEstimate.length) * 100),
        onTimeCount,
        totalCompleted: completedTasks.length
      };
    }, [tasks]);

    if (!performanceStats) {
      return (
        <div className="text-center py-8">
          {FaTrophy ({className:"w-12 h-12 text-gray-300 mx-auto mb-4"})}
          <p className="text-gray-500">パフォーマンスデータが不足しています</p>
          <p className="text-xs text-gray-400 mt-2">予想時間と実行時間の両方が記録されたタスクが必要です</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* 全体パフォーマンス */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <h3 className="font-semibold text-purple-900 mb-3">全体パフォーマンス</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{performanceStats.avgAccuracy}%</div>
              <div className="text-xs text-purple-700">平均精度</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{performanceStats.onTimeRate}%</div>
              <div className="text-xs text-pink-700">時間内完了率</div>
            </div>
          </div>
        </div>

        {/* 詳細統計 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">詳細統計</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">分析対象タスク</span>
              <span className="font-medium">{performanceStats.totalAnalyzed}件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">時間内完了</span>
              <span className="font-medium text-green-600">
                {performanceStats.onTimeCount}件
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">総完了タスク</span>
              <span className="font-medium">{performanceStats.totalCompleted}件</span>
            </div>
          </div>
        </div>

        {/* 改善提案 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 改善提案</h3>
          <div className="text-sm text-blue-800 space-y-1">
            {performanceStats.avgAccuracy < 70 && (
              <p>• 予想時間の精度を上げるため、似たタスクの実績を参考にしましょう</p>
            )}
            {performanceStats.onTimeRate < 60 && (
              <p>• 時間内完了率が低めです。余裕を持った時間設定を心がけましょう</p>
            )}
            {performanceStats.avgAccuracy >= 80 && performanceStats.onTimeRate >= 80 && (
              <p>• 優秀なパフォーマンスです！この調子で継続しましょう 🎉</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* タブヘッダー */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon ({className:"w-4 h-4"})}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="p-4">
        {activeTab === 'heatmap' && renderHeatmap()}
        {activeTab === 'category' && renderCategory()}
        {activeTab === 'performance' && renderPerformance()}
      </div>
    </div>
  );
}; 