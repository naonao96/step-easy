import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { StreakBadge } from '../atoms/StreakBadge';
import { ToggleSwitch } from '../atoms/ToggleSwitch';
import { SortOption } from '../atoms/SortDropdown';
import { sortTasks, getSavedSortOption, saveSortOption } from '@/lib/sortUtils';
import { FaPlus, FaCheck, FaEdit, FaFilter } from 'react-icons/fa';

interface TaskListHomeProps {
  tasks?: Task[];
  selectedDate?: Date;
  onAddTask?: () => void;
  onCompleteTask?: (id: string) => void;
  onViewAll?: () => void;
}

export const TaskListHome: React.FC<TaskListHomeProps> = ({
  tasks = [],
  selectedDate,
  onAddTask,
  onCompleteTask,
  onViewAll
}) => {
  const router = useRouter();
  const { isGuest, isPremium, planType, canAddTaskOnDate, togglePremiumForDev } = useAuth();
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
    return sortTasks(tasks as any, sortOption);
  }, [tasks, sortOption]);

  // タスク詳細表示（既存のページ遷移方式）
  const handleTaskClick = (task: any) => {
    router.push(`/tasks?id=${task.id}`);
  };

  // 選択日に応じたタイトルを生成
  const getTitle = () => {
    if (!selectedDate) return '今日のタスク';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.toDateString() === today.toDateString()) {
      return '今日のタスク';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selected.toDateString() === tomorrow.toDateString()) {
      return '明日のタスク';
    }
    
    if (selected.toDateString() === yesterday.toDateString()) {
      return '昨日のタスク';
    }
    
    // その他の日付
    const month = selected.getMonth() + 1;
    const day = selected.getDate();
    const year = selected.getFullYear();
    const currentYear = today.getFullYear();
    
    if (year === currentYear) {
      return `${month}月${day}日のタスク`;
    } else {
      return `${year}年${month}月${day}日のタスク`;
    }
  };

  // タスク追加の制限チェック
  const getAddTaskButtonInfo = () => {
    if (!selectedDate) return { canAdd: true, label: '追加', message: '' };
    
    const checkResult = canAddTaskOnDate(selectedDate);
    return {
      canAdd: checkResult.canAdd,
      label: checkResult.canAdd ? '追加' : planType === 'guest' ? 'ログインが必要' : 'プレミアム版が必要',
      message: checkResult.message
    };
  };

  const handleAddTask = () => {
    const { canAdd, message } = getAddTaskButtonInfo();
    
    if (!canAdd) {
      alert(message);
      return;
    }
    
    if (onAddTask) {
      onAddTask();
    } else {
      // 選択日を開始日として設定
      if (selectedDate) {
        const startDate = selectedDate.toISOString().split('T')[0];
        router.push(`/tasks?start_date=${startDate}`);
      } else {
        router.push('/tasks');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-96 flex flex-col">
      {/* 開発用: プレミアム切り替えボタン (デスクトップのみ) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="hidden md:block mb-2">
          <button
            onClick={togglePremiumForDev}
            className="text-xs px-2 py-1 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 rounded text-yellow-800"
          >
            DEV: Premium {isPremium ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 min-w-0 flex-1 truncate">{getTitle()}</h2>
        {(() => {
          const { canAdd, label } = getAddTaskButtonInfo();
          return (
        <button
              onClick={handleAddTask}
              disabled={!canAdd}
              className={`flex-shrink-0 ml-2 flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
                canAdd 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!canAdd ? getAddTaskButtonInfo().message : ''}
        >
          {FaPlus({ className: "w-3 h-3" })}
              <span className="text-xs sm:text-sm">{label}</span>
        </button>
          );
        })()}
      </div>

      {/* ソートドロップダウン */}
      <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {FaFilter({ className: "w-4 h-4 text-gray-400" })}
          <span className="font-medium">並び順</span>
        </div>
        <select
          value={sortOption}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
          disabled={tasks.length <= 1}
          className={`w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 min-h-[44px] touch-manipulation ${
            tasks.length <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
          }`}
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

      {/* スクロール可能なタスク一覧エリア */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
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
            {/* 空状態でも幅を確保するための透明な要素 */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg opacity-0 pointer-events-none mb-4">
              <div className="flex-shrink-0 w-5 h-5"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32"></div>
                <div className="h-3 w-24 mt-1"></div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-8 h-5"></div>
                <div className="w-6 h-5"></div>
              </div>
              <div className="flex-shrink-0 w-4 h-4"></div>
            </div>
            
            <p className="text-sm">
              {selectedDate && new Date().toDateString() === selectedDate.toDateString() 
                ? '今日のタスクがありません' 
                : 'この日のタスクがありません'
              }
            </p>
            <button
              onClick={onAddTask}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              タスクを作成する
            </button>
          </div>
        )}
      </div>

    </div>
  );
}; 