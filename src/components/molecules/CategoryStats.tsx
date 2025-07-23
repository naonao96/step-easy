import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/task';
import { DEFAULT_CATEGORIES } from '@/types/task';
import { CategoryBadge } from '../atoms/CategoryBadge';

interface CategoryStatsProps {
  tasks?: Task[];
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({ tasks = [] }) => {
  const router = useRouter();

  // カテゴリ別統計を計算
  const categoryStats = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'done');
    
    const stats = DEFAULT_CATEGORIES.map(category => {
      const categoryTasks = tasks.filter(task => task.category === category.id);
      const categoryCompletedTasks = completedTasks.filter(task => task.category === category.id);
      
      return {
        ...category,
        totalTasks: categoryTasks.length,
        completedTasks: categoryCompletedTasks.length,
        percentage: categoryTasks.length > 0 ? Math.round((categoryCompletedTasks.length / categoryTasks.length) * 100) : 0
      };
    }).filter(stat => stat.totalTasks > 0); // タスクがあるカテゴリのみ表示

    // 完了率でソート（降順）
    return stats.sort((a, b) => b.percentage - a.percentage);
  }, [tasks]);

  // 最も良い成績のカテゴリ
  const topCategory = categoryStats[0];
  const totalCategories = categoryStats.length;

  const handleClick = () => {
    router.push('/progress?tab=category');
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">カテゴリ別統計</h3>
        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          詳細を見る →
        </span>
      </div>

      {categoryStats.length > 0 ? (
        <div className="space-y-3">
          {/* トップ3カテゴリを表示 */}
          {categoryStats.slice(0, 3).map((category, index) => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index === 0 && <span className="text-sm">🏆</span>}
                  {index === 1 && <span className="text-sm">🥈</span>}
                  {index === 2 && <span className="text-sm">🥉</span>}
                  <CategoryBadge category={category.id} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {category.completedTasks}/{category.totalTasks}
                  </span>
                  <span className={`font-medium text-sm ${
                    category.percentage === 100 ? 'text-green-600' :
                    category.percentage >= 75 ? 'text-blue-600' :
                    category.percentage >= 50 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {category.percentage}%
                  </span>
                </div>
              </div>
              
              {/* プログレスバー */}
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

          {/* 残りのカテゴリがある場合 */}
          {categoryStats.length > 3 && (
            <div className="text-center py-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                他 {categoryStats.length - 3} カテゴリ
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-sm text-gray-500">
            タスクを作成すると<br />カテゴリ別の統計が表示されます
          </p>
        </div>
      )}

      {/* サマリー */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>活動カテゴリ</span>
          <span>{totalCategories}/{DEFAULT_CATEGORIES.length}</span>
        </div>
        {topCategory && (
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>最高完了率</span>
            <span>{topCategory.name} {topCategory.percentage}%</span>
          </div>
        )}
      </div>
    </div>
  );
}; 