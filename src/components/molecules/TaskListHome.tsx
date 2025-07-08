import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { StreakBadge } from '../atoms/StreakBadge';
import { ToggleSwitch } from '../atoms/ToggleSwitch';
import { SortOption } from '../atoms/SortDropdown';
import { sortTasks, getSavedSortOption, saveSortOption } from '@/lib/sortUtils';
import { formatDurationShort } from '@/lib/timeUtils';
import { FaPlus, FaCheck, FaEdit, FaFilter, FaCrown, FaFire, FaTasks } from 'react-icons/fa';

interface TaskListHomeProps {
  tasks?: Task[];
  selectedDate?: Date;
  onAddTask?: () => void;
  onCompleteTask?: (id: string) => void;
  onViewAll?: () => void;
  height?: number; // rem単位
}

type TabType = 'tasks' | 'habits';

export const TaskListHome: React.FC<TaskListHomeProps> = ({
  tasks = [],
  selectedDate,
  onAddTask,
  onCompleteTask,
  onViewAll,
  height = 46
}) => {
  const router = useRouter();
  const { isGuest, isPremium, planType, canAddTaskOnDate, togglePremiumForDev } = useAuth();
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [activeTab, setActiveTab] = useState<TabType>('habits');

  // ソート設定の読み込み
  useEffect(() => {
    setSortOption(getSavedSortOption());
  }, []);

  // ソート設定の保存
  const handleSortChange = (newOption: SortOption) => {
    setSortOption(newOption);
    saveSortOption(newOption);
  };

  // 通常タスクと習慣タスクの分離
  const { regularTasks, habitTasks } = useMemo(() => {
    const regular: Task[] = [];
    const habit: Task[] = [];
    
    tasks.forEach(task => {
      if (task.is_habit) {
        habit.push(task);
      } else {
        regular.push(task);
      }
    });
    
    return { 
      regularTasks: sortTasks(regular as any, sortOption),
      habitTasks: sortTasks(habit as any, sortOption)
    };
  }, [tasks, sortOption]);

  // 未完了タスク数の計算
  const getIncompleteCount = (taskList: any[]) => {
    return taskList.filter(task => task.status !== 'done').length;
  };

  const regularIncompleteCount = getIncompleteCount(regularTasks);
  const habitIncompleteCount = getIncompleteCount(habitTasks);

  // プラン別習慣制限
  const getHabitLimits = () => {
    switch (planType) {
      case 'guest': return { maxHabits: 0, maxStreakDays: 0 };
      case 'free': return { maxHabits: 3, maxStreakDays: 14 };
      case 'premium': return { maxHabits: Infinity, maxStreakDays: Infinity };
      default: return { maxHabits: 0, maxStreakDays: 0 };
    }
  };

  const { maxHabits, maxStreakDays } = getHabitLimits();

  // タスク詳細表示（既存のページ遷移方式）
  const handleTaskClick = (task: any) => {
    router.push(`/tasks?id=${task.id}`);
  };

  // 選択日に応じたタイトルを生成
  const getTitle = () => {
    if (!selectedDate) return '今日の習慣';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.toDateString() === today.toDateString()) {
      return '今日の習慣';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selected.toDateString() === tomorrow.toDateString()) {
      return '明日の習慣';
    }
    
    if (selected.toDateString() === yesterday.toDateString()) {
      return '昨日の習慣';
    }
    
    // その他の日付
    const month = selected.getMonth() + 1;
    const day = selected.getDate();
    const year = selected.getFullYear();
    const currentYear = today.getFullYear();
    
    if (year === currentYear) {
      return `${month}月${day}日の習慣`;
    } else {
      return `${year}年${month}月${day}日の習慣`;
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
      // タブに応じて適切なURLに遷移
      const isHabitTab = activeTab === 'habits';
      if (selectedDate) {
        const startDate = selectedDate.toISOString().split('T')[0];
        if (isHabitTab) {
          router.push(`/tasks?habit=true&start_date=${startDate}`);
        } else {
          router.push(`/tasks?start_date=${startDate}`);
        }
      } else {
        if (isHabitTab) {
          router.push('/tasks?habit=true');
        } else {
          router.push('/tasks');
        }
      }
    }
  };

  // 習慣タスクの頻度表示
  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return '毎日';
      case 'weekly': return '週1回';
      case 'monthly': return '月1回';
      default: return '毎日';
    }
  };

  // 習慣タスクの継続状況表示
  const getHabitStatus = (task: Task) => {
    if (!task.is_habit) return '';
    
    const currentStreak = task.current_streak || 0;
    if (currentStreak === 0) return '未開始';
    
    return `${currentStreak}日継続中`;
  };

  // タスクカードの共通レンダリング
  const renderTaskCard = (task: any, isHabit = false) => (
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
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${
            task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
          }`}>
            {task.title}
          </p>
          {isHabit && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex items-center gap-1">
              {FaFire({ className: "w-2.5 h-2.5" })}
              {getFrequencyLabel(task.habit_frequency)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {task.description && (
            <p className={`text-xs truncate ${
              task.status === 'done' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {task.description}
            </p>
          )}
          {isHabit && task.current_streak! > 0 && (
            <span className="text-xs text-green-600 font-medium">
              {getHabitStatus(task)}
            </span>
          )}
        </div>
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
  );

  // タブボタンコンポーネント
  const TabButton = ({ 
    tabKey, 
    label, 
    icon, 
    count, 
    isActive, 
    onClick, 
    disabled = false 
  }: {
    tabKey: string;
    label: string;
    icon: React.ReactNode;
    count: number;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={`
          px-1.5 py-0.5 text-xs rounded-full min-w-[1.25rem] text-center
          ${isActive 
            ? 'bg-white text-blue-600' 
            : 'bg-blue-100 text-blue-600'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );

  // 現在のタブに応じたタスクリストを取得
  const getCurrentTasks = () => {
    return activeTab === 'habits' ? habitTasks : regularTasks;
  };

  // 現在のタブに応じた追加ボタンのラベルを取得
  const getTabAddButtonLabel = () => {
    if (activeTab === 'tasks') {
      const { label } = getAddTaskButtonInfo();
      return label;
    }
      if (planType === 'guest') return 'ログインが必要';
      if (habitTasks.length >= maxHabits && maxHabits !== Infinity) return 'プレミアム版が必要';
      // 過去日付制限をチェック
      if (selectedDate) {
        const checkResult = canAddTaskOnDate(selectedDate);
        if (!checkResult.canAdd) {
          return 'プレミアム版が必要';
        }
      }
      return '習慣追加';
  };

  // 現在のタブに応じた追加ボタンの有効性を取得
  const getTabAddButtonEnabled = () => {
    if (activeTab === 'tasks') {
      const { canAdd } = getAddTaskButtonInfo();
      return canAdd;
    }
      if (planType === 'guest') return false;
      if (habitTasks.length >= maxHabits && maxHabits !== Infinity) return false;
      // 過去日付制限をチェック
      if (selectedDate) {
        const checkResult = canAddTaskOnDate(selectedDate);
        if (!checkResult.canAdd) return false;
      }
      return true;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 flex flex-col"
      style={{ height: `${height}rem` }}
    >
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
      
      {/* ヘッダー: タイトルと追加ボタン */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 min-w-0 flex-1 truncate">{getTitle()}</h2>
        <button
          onClick={handleAddTask}
          disabled={!getTabAddButtonEnabled()}
          className={`flex-shrink-0 ml-2 flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
            getTabAddButtonEnabled() 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!getTabAddButtonEnabled() ? 
            (activeTab === 'habits' ? 
              (planType === 'guest' ? 'ユーザー登録が必要です' : 
               (habitTasks.length >= maxHabits && maxHabits !== Infinity) ? 'プレミアム版で習慣を無制限に追加できます' :
               (selectedDate && !canAddTaskOnDate(selectedDate).canAdd) ? canAddTaskOnDate(selectedDate).message : 'プレミアム版で習慣を無制限に追加できます') :
              getAddTaskButtonInfo().message
            ) : ''
          }
        >
          {FaPlus({ className: "w-3 h-3" })}
          <span className="text-xs sm:text-sm">{getTabAddButtonLabel()}</span>
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="flex gap-2 mb-4">
        <TabButton
          tabKey="habits"
          label="習慣"
          icon={FaFire({ className: "w-4 h-4" })}
          count={habitIncompleteCount}
          isActive={activeTab === 'habits'}
          onClick={() => setActiveTab('habits')}
          disabled={planType === 'guest'}
        />
        <TabButton
          tabKey="tasks"
          label="タスク"
          icon={FaTasks({ className: "w-4 h-4" })}
          count={regularIncompleteCount}
          isActive={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
        />
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
          disabled={getCurrentTasks().length <= 1}
          className={`w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 min-h-[44px] touch-manipulation ${
            getCurrentTasks().length <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
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

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'habits' && (
          <div className="space-y-4 h-full">
            {/* ゲストユーザー向け習慣機能案内 */}
            {planType === 'guest' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {FaFire({ className: "w-5 h-5 text-blue-600" })}
                  <span className="text-base font-medium text-blue-900">継続的な習慣を管理して目標達成をサポート！</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  毎日の運動、読書、学習など継続したい習慣のストリーク（継続日数）を記録
                </p>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ユーザー登録で利用開始
                </button>
              </div>
            )}

            {/* 無料ユーザー向けプレミアム誘導 */}
            {planType === 'free' && habitTasks.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  {FaCrown({ className: "w-3 h-3 text-purple-600" })}
                  <span className="text-xs font-medium text-purple-900">
                    プレミアムで習慣を無制限に ({habitTasks.length}/{maxHabits}個)
                  </span>
                </div>
                <p className="text-xs text-purple-700">
                  ストリークも永続保存！高度な分析機能も利用可能
                </p>
              </div>
            )}

            {/* 習慣タスク一覧 */}
            {planType !== 'guest' && (
              <div className="space-y-2">
                {habitTasks.length > 0 ? (
                  habitTasks.map((task) => renderTaskCard(task, true))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {FaFire({ className: "w-8 h-8 mx-auto text-gray-400 mb-2" })}
                    <p className="text-sm mb-2">習慣タスクがありません</p>
                    <button
                      onClick={() => router.push('/tasks?habit=true')}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      最初の習慣を作成する
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {regularTasks.length > 0 ? (
              regularTasks.map((task) => renderTaskCard(task, false))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {FaTasks({ className: "w-8 h-8 mx-auto text-gray-400 mb-2" })}
                <p className="text-sm mb-2">タスクがありません</p>
                <button
                  onClick={() => router.push('/tasks')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  最初のタスクを作成する
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 