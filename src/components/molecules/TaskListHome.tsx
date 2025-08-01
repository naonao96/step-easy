import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { getHabitLimits, getHabitStatus, isNewHabit } from '@/lib/habitUtils';
import { generateDateTitle, getIncompleteTaskCount } from '@/lib/commonUtils';
import { ToggleSwitch } from '../atoms/ToggleSwitch';
import { SortOption } from '../atoms/SortDropdown';
import { sortTasks, getSavedSortOption, saveSortOption } from '@/lib/sortUtils';
import { FaCheck, FaEdit, FaFilter, FaFire, FaTasks, FaCrown} from 'react-icons/fa';

interface TaskListHomeProps {
  tasks?: Task[];
  selectedDate?: Date;
  onAddTask?: () => void;
  onCompleteTask?: (id: string) => void;
  onTaskClick?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onViewAll?: () => void;
  height?: number; // rem単位
  activeTab?: TabType; // 外部から制御するタブ状態
  onTabChange?: (tab: TabType) => void; // タブ変更コールバック
}

type TabType = 'tasks' | 'habits';

export const TaskListHome: React.FC<TaskListHomeProps> = ({
  tasks = [],
  selectedDate,
  onAddTask,
  onCompleteTask,
  onTaskClick,
  onEditTask,
  height = 46,
  activeTab: externalActiveTab,
  onTabChange
}) => {
  const router = useRouter();
  const { isPremium, planType, canAddTaskOnDate, togglePremiumForDev } = useAuth();
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('habits');
  
  // 外部から制御される場合はそれを使用、そうでなければ内部状態を使用
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

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
      if (isNewHabit(task)) {
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
  const regularIncompleteCount = getIncompleteTaskCount(regularTasks);
  const habitIncompleteCount = getIncompleteTaskCount(habitTasks);

  const { maxHabits } = getHabitLimits(planType);

  // タスク詳細表示（モーダル表示方式）
  const handleTaskClick = (task: any) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      router.push(`/tasks?id=${task.id}&mode=preview`);
    }
  };

  // 選択日に応じたタイトルを生成
  const getTitle = () => {
    return generateDateTitle(selectedDate || null, activeTab);
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
    const buttonLabel = getTabAddButtonLabel();
    
    if (!canAdd) {
      // プレミアム版が必要な場合は設定画面のプレミアムタブに遷移
      if (buttonLabel.includes('プレミアム版が必要')) {
        router.push('/settings?tab=subscription');
        return;
      }
      // その他の制限（ログインが必要など）はalertで表示
      alert(message);
      return;
    }
    
    if (onAddTask) {
      onAddTask();
    } else {
      // 現在のタブに応じて直接モーダル表示
      if (activeTab === 'habits') {
        const event = new CustomEvent('showHabitModal', {
          detail: { show: true }
        });
        window.dispatchEvent(event);
      } else {
        const event = new CustomEvent('showTaskModal', {
          detail: { show: true }
        });
        window.dispatchEvent(event);
      }
    }
  };

  // タスクカードの共通レンダリング
  const renderTaskCard = (task: any, isHabit = false) => {
    // 未来日判定（習慣のみ）- 過去日は操作可能
    const isFutureDate = isHabit && selectedDate && selectedDate > new Date();
    
    return (
    <div
      key={task.id}
      className={`
        flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors cursor-pointer
        ${task.status === 'done' 
          ? 'bg-[#f5f5dc] opacity-75 hover:bg-[#deb887]' 
          : 'hover:bg-[#f5f5dc]'
        }
      `}
      onClick={() => handleTaskClick(task)}
    >
      {/* 完了切り替え - レスポンシブ対応 */}
      <div className="flex-shrink-0">
        {/* モバイル: スライドトグル */}
        <div className="block sm:hidden">
          <ToggleSwitch
            checked={task.status === 'done'}
            onChange={() => onCompleteTask?.(task.id)}
            size="sm"
              disabled={isFutureDate}
          />
        </div>
        
        {/* デスクトップ: 改良チェックボックス */}
        <div className="hidden sm:block">
          <button
            onClick={(e) => {
              e.stopPropagation();
                if (!isFutureDate) {
              onCompleteTask?.(task.id);
                }
            }}
              disabled={isFutureDate}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                isFutureDate
                  ? 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-50'
                  : task.status === 'done'
                ? 'bg-[#7c5a2a] border-[#7c5a2a] text-white scale-110'
                : 'border-[#deb887] hover:border-[#7c5a2a] hover:scale-105'
            }`}
              title={isFutureDate ? '未来日は完了できません' : (task.status === 'done' ? '未完了に戻す' : '完了にする')}
          >
              {task.status === 'done' && !isFutureDate && FaCheck({ className: "w-3 h-3" })}
          </button>
        </div>
      </div>

      {/* タスク内容 - クリッカブル */}
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleTaskClick(task);
        }}
      >
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${
            task.status === 'done' ? 'line-through text-[#7c5a2a]' : 'text-[#8b4513]'
          }`}>
            {task.title}
          </p>

        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {task.description && (
            <p className={`text-xs truncate ${
              task.status === 'done' ? 'text-[#7c5a2a]' : 'text-[#7c5a2a]'
            }`}>
              {task.description}
            </p>
          )}
          {isHabit && task.current_streak! > 0 && (
            <span className="text-xs text-[#8b4513] font-medium">
              {getHabitStatus(task.current_streak || 0)}
            </span>
          )}
        </div>
      </div>

      {/* バッジエリア */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* 優先度表示 */}
        <div className={`px-1.5 sm:px-2 py-1 text-xs rounded ${
          task.priority === 'high' ? 'bg-[#deb887] text-[#8b4513]' :
          task.priority === 'medium' ? 'bg-[#f5f5dc] text-[#7c5a2a]' :
          'bg-[#f5f5dc] text-[#7c5a2a]'
        }`}>
          {task.priority === 'high' ? '高' : 
           task.priority === 'medium' ? '中' : '低'}
        </div>
      </div>

      {/* 編集ボタン */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onEditTask) {
            onEditTask(task);
          } else {
            router.push(`/tasks?id=${task.id}&mode=edit`);
          }
        }}
        disabled={isFutureDate}
        className={`flex-shrink-0 p-2 sm:p-1 transition-colors touch-manipulation ${
          isFutureDate
            ? 'text-gray-400 cursor-not-allowed opacity-50'
            : task.status === 'done' 
            ? 'text-[#7c5a2a] hover:text-[#8b4513]' 
            : 'text-[#7c5a2a] hover:text-[#8b4513]'
        }`}
        title={isFutureDate ? '未来日は編集できません' : '編集'}
      >
        {FaEdit({ className: "w-4 h-4 sm:w-3 sm:h-3" })}
      </button>
    </div>
  );
  };

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
          ? 'bg-[#7c5a2a] text-white shadow-sm'
          : disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[#f5f5dc] text-[#7c5a2a] hover:bg-[#deb887] hover:text-[#8b4513]'
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={`
          px-1.5 py-0.5 text-xs rounded-full min-w-[1.25rem] text-center
          ${isActive 
            ? 'bg-white text-[#7c5a2a]'
            : 'bg-[#deb887] text-[#7c5a2a]'
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
      return '追加';
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
        <h2 className="text-lg font-semibold text-[#8b4513] min-w-0 flex-1 truncate">{getTitle()}</h2>
        <button
          onClick={handleAddTask}
          disabled={!getTabAddButtonEnabled() && !getTabAddButtonLabel().includes('プレミアム版が必要')}
          className={`flex-shrink-0 ml-2 flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
            getTabAddButtonEnabled() 
              ? 'bg-[#7c5a2a] text-white hover:bg-[#8b4513] shadow-sm'
              : getTabAddButtonLabel().includes('プレミアム版が必要')
                ? 'bg-[#deb887] text-[#8b4513] hover:bg-[#d4a574] cursor-pointer'
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
          {activeTab === 'habits' ? FaFire({ className: "w-3 h-3" }) : FaTasks({ className: "w-3 h-3" })}
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

      {/* ソートドロップダウンと制限表示 */}
      <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
        <div className="flex items-center gap-2 text-sm text-[#7c5a2a]">
          {FaFilter({ className: "w-4 h-4 text-[#7c5a2a]" })}
          <span className="font-medium">並び順</span>
        </div>
        <select
          value={sortOption}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
          disabled={getCurrentTasks().length <= 1}
          className={`w-full sm:w-auto rounded-md border-[#deb887] shadow-sm focus:border-[#7c5a2a] focus:ring-[#7c5a2a] text-sm py-2 px-3 min-h-[44px] touch-manipulation ${
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
        
        {/* 無料ユーザー向け習慣制限表示（習慣タブの時のみ） */}
        {activeTab === 'habits' && planType === 'free' && (
          <button
            onClick={() => router.push('/settings?tab=subscription')}
            className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-2 hover:bg-[#deb887] transition-colors cursor-pointer"
            title="プレミアム版で習慣を無制限に追加できます"
          >
            <div className="flex items-center gap-2">
              {FaCrown({ className: "w-3 h-3 text-[#8b4513]" })}
              <span className="text-xs font-medium text-[#8b4513]">習慣制限: {habitTasks.length}/3</span>
            </div>
          </button>
        )}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'habits' && (
          <div className="space-y-4 h-full">
            {/* ゲストユーザー向け習慣機能案内 */}
            {planType === 'guest' && (
              <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {FaFire({ className: "w-5 h-5 text-[#7c5a2a]" })}
                  <span className="text-base font-medium text-[#8b4513]">継続的な習慣を管理して目標達成をサポート！</span>
                </div>
                <p className="text-sm text-[#7c5a2a] mb-3">
                  毎日の運動、読書、学習など継続したい習慣のストリーク（継続日数）を記録
                </p>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 bg-[#7c5a2a] text-white text-sm rounded-lg hover:bg-[#8b4513] transition-colors"
                >
                  ユーザー登録で利用開始
                </button>
              </div>
            )}



            {/* 習慣タスク一覧 */}
            {planType !== 'guest' && (
              <div className="space-y-2">
                {habitTasks.length > 0 ? (
                  habitTasks.map((task) => renderTaskCard(task, true))
                ) : (
                  <div className="text-center py-8 text-[#7c5a2a]">
                    {FaFire({ className: "w-8 h-8 mx-auto text-[#deb887] mb-2" })}
                    <p className="text-sm mb-2">習慣がありません</p>
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
              <div className="text-center py-8 text-[#7c5a2a]">
                {FaTasks({ className: "w-8 h-8 mx-auto text-[#deb887] mb-2" })}
                <p className="text-sm mb-2">タスクがありません</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 