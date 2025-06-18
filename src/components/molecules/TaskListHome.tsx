import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';
import { StreakBadge } from '../atoms/StreakBadge';
import { ToggleSwitch } from '../atoms/ToggleSwitch';
import { SortOption } from '../atoms/SortDropdown';
import { sortTasks, getSavedSortOption, saveSortOption } from '@/lib/sortUtils';
import { FaPlus, FaCheck, FaEdit, FaFilter } from 'react-icons/fa';

interface TaskListHomeProps {
  tasks?: Task[];
  onAddTask?: () => void;
  onCompleteTask?: (id: string) => void;
  onViewAll?: () => void;
}

export const TaskListHome: React.FC<TaskListHomeProps> = ({
  tasks = [],
  onAddTask,
  onCompleteTask,
  onViewAll
}) => {
  const router = useRouter();
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // ソート設定の読み込み
  useEffect(() => {
    setSortOption(getSavedSortOption());
  }, []);

  // ソート設定の保存
  const handleSortChange = (newOption: SortOption) => {
    setSortOption(newOption);
    saveSortOption(newOption);
  };

  // ソート済みタスク
  const sortedTasks = useMemo(() => {
    return sortTasks(tasks, sortOption);
  }, [tasks, sortOption]);

  // タスク詳細表示（既存のページ遷移方式）
  const handleTaskClick = (task: Task) => {
    router.push(`/tasks?id=${task.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">今日のタスク</h2>
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {FaPlus({ className: "w-3 h-3" })}
          追加
        </button>
      </div>

      {/* ソートドロップダウン */}
      {tasks.length > 1 && (
        <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {FaFilter({ className: "w-4 h-4 text-gray-400" })}
            <span className="font-medium">並び順</span>
          </div>
          <select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 min-h-[44px] touch-manipulation"
          >
            <option value="default">デフォルト</option>
            <option value="priority_desc">優先度（高い順）</option>
            <option value="priority_asc">優先度（低い順）</option>
            <option value="streak_desc">継続日数（長い順）</option>
            <option value="streak_asc">継続日数（短い順）</option>
            <option value="due_date_asc">期限日（近い順）</option>
            <option value="due_date_desc">期限日（遠い順）</option>
            <option value="created_desc">作成日時（新しい順）</option>
            <option value="created_asc">作成日時（古い順）</option>
            <option value="title_asc">あいうえお順</option>
            <option value="title_desc">あいうえお順（逆）</option>
          </select>
        </div>
      )}

      {/* スクロール可能なタスク一覧エリア */}
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {sortedTasks.length > 0 ? (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`
                flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors
                ${task.status === 'done' 
                  ? 'bg-gray-50 opacity-75 hover:bg-gray-100' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              {/* 完了切り替え - レスポンシブ対応 */}
              <div className="flex-shrink-0">
                {/* モバイル: スライドトグル */}
                <div className="block sm:hidden">
                  <ToggleSwitch
                    checked={task.status === 'done'}
                    onChange={() => onCompleteTask?.(task.id)}
                    size="sm"
                  />
                </div>
                
                {/* デスクトップ: 改良チェックボックス */}
                <div className="hidden sm:block">
                  <button
                    onClick={() => onCompleteTask?.(task.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      task.status === 'done'
                        ? 'bg-green-500 border-green-500 text-white scale-110'
                        : 'border-gray-300 hover:border-blue-500 hover:scale-105'
                    }`}
                    title={task.status === 'done' ? '未完了に戻す' : '完了にする'}
                  >
                    {task.status === 'done' && FaCheck({ className: "w-3 h-3" })}
                  </button>
                </div>
              </div>

              {/* タスク内容 - クリッカブル */}
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <p className={`text-sm font-medium truncate ${
                  task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={`text-xs truncate ${
                    task.status === 'done' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {task.description}
                  </p>
                )}
              </div>

              {/* バッジエリア */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* 継続日数バッジ */}
                <StreakBadge 
                  task={task}
                  size="sm"
                  showText={false}
                />
                
                {/* 優先度表示 */}
                <div className={`px-1.5 sm:px-2 py-1 text-xs rounded ${
                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {task.priority === 'high' ? '高' : 
                   task.priority === 'medium' ? '中' : '低'}
                </div>
              </div>

              {/* 編集ボタン */}
              <button
                onClick={() => router.push(`/tasks?id=${task.id}&edit=true`)}
                className={`flex-shrink-0 p-2 sm:p-1 transition-colors touch-manipulation ${
                  task.status === 'done' 
                    ? 'text-gray-400 hover:text-gray-600' 
                    : 'text-gray-400 hover:text-blue-500'
                }`}
                title="編集"
              >
                {FaEdit({ className: "w-4 h-4 sm:w-3 sm:h-3" })}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">今日のタスクがありません</p>
            <button
              onClick={onAddTask}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              タスクを作成する
            </button>
          </div>
        )}
      </div>

      {/* タスク管理リンク */}
      {tasks.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={onViewAll}
            className="w-full text-sm text-blue-600 hover:text-blue-700 py-2"
          >
            タスクを詳細管理する
          </button>
        </div>
      )}

    </div>
  );
}; 