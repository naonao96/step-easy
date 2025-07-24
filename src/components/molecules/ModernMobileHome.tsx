import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/task';
import { Habit } from '@/types/habit';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { Character } from './Character';
import { getEmotionTimePeriodLabel } from '@/lib/timeUtils';
import { isNewHabit } from '@/lib/habitUtils';
import { useHabitStore } from '@/stores/habitStore';
import { isToday, getIncompleteTaskCount, getPlanLimits, generateDateTitle } from '@/lib/commonUtils';

import { useAuth } from '@/contexts/AuthContext';
import { MobileTaskTimer } from './MobileTaskTimer';
import { MobileTaskHistory } from './MobileTaskHistory';

  import { useEmotionStore } from '@/stores/emotionStore';
  import { useMessageDisplay } from '@/hooks/useMessageDisplay';
  import ReactMarkdown from 'react-markdown';
import { MobileTaskCarousel } from './MobileTaskCarousel';
import { TaskPreviewModal } from './TaskPreviewModal';
import { TaskEditModal } from './TaskEditModal';
import { 
  FaPlus, 
  FaCalendarAlt, 
  FaChartLine, 
  FaChevronRight,
  FaCheck,
  FaCircle,
  FaEdit,
  FaFire,
  FaTasks,
  FaChevronLeft,
  FaHome,
  FaTimes,
  FaTrash,
  FaChartBar,
  FaCrown
} from 'react-icons/fa';
import { EmotionHoverMenu } from '@/components/molecules/EmotionHoverMenu';
import Image from 'next/image';


interface ModernMobileHomeProps {
  selectedDate: Date;
  selectedDateTasks: Task[];
  tasks: Task[];
  statistics: {
    selectedDateCompletedTasks: number;
    selectedDateTotalTasks: number;
    selectedDatePercentage: number;
    todayCompletedTasks: number;
    todayTotalTasks: number;
    todayPercentage: number;
  };
  characterMessage: string;
  messageParts?: string[];
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task | Habit) => void;
  onDateSelect: (date: Date) => void;
  onTabChange?: (tab: 'tasks' | 'habits') => void;
  onTaskUpdate?: () => Promise<void>; // データ更新関数を追加
  onMessageClick?: () => void; // メッセージクリック用
  emotionLog: {
    todayEmotions: any[];
    recordStatus: {
      morning: any | null;
      afternoon: any | null;
      evening: any | null;
    };
    currentTimePeriod: 'morning' | 'afternoon' | 'evening';
    isComplete: boolean;
    isLoading: boolean;
    error: string | null;
    recordEmotion: (emotionType: any, timePeriod?: any) => Promise<boolean>;
    refreshTodayEmotions: () => Promise<void>;
  }; // 感情記録の状態をpropsで受け取る
}

type TabType = 'tasks' | 'habits';

export const ModernMobileHome: React.FC<ModernMobileHomeProps> = ({
  selectedDate,
  selectedDateTasks,
  tasks,
  statistics,
  characterMessage,
  messageParts = [],
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  onDateSelect,
  onTabChange,
  onTaskUpdate,
  onMessageClick,
  emotionLog
}) => {
  const router = useRouter();
  const { isGuest, isPremium, planType, canAddTaskOnDate, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('habits');

  // タブ変更時の処理
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // 親コンポーネントにタブ変更を通知
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // 感情記録の状態をpropsから取得（一元管理）
  const recordStatus = useMemo(() => {
    return emotionLog.recordStatus;
  }, [emotionLog.recordStatus]);
  const currentTimePeriod = useMemo(() => {
    return emotionLog.currentTimePeriod;
  }, [emotionLog.currentTimePeriod]);
  
  // タスクプレビュー・編集モーダル関連の状態
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskPreviewModal, setShowTaskPreviewModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);

  // 感情記録UIの状態管理（データ取得による再レンダリングの影響を受けない）
  const characterRef = useRef<HTMLImageElement>(null);
  const showEmotionMenuRef = useRef(false);
  const [, forceUpdate] = useState({});
  
  // 感情メニューの開閉状態を管理
  const setShowEmotionMenu = (value: boolean) => {
    showEmotionMenuRef.current = value;
    forceUpdate({});
  };
  
  const showEmotionMenu = showEmotionMenuRef.current;
  
  // 統一されたメッセージ表示状態管理（デスクトップ版と同じ）
  const {
    showMessage,
    isTyping,
    displayedMessage,
    isShowingParts,
    currentPartIndex,
    handleAutoDisplay,
    handleManualDisplay,
    handleMessageClick,
    handleCharacterClick,
    clearMessage
  } = useMessageDisplay({
    characterMessage,
    messageParts,
    isGuest,
    user,
    mounted: true
  });

  // 今日かどうかの判定
  const isTodaySelected = isToday(selectedDate);

  // 通常タスクと習慣タスクの分離
  const { regularTasks, habitTasks } = useMemo(() => {
    const regular: Task[] = [];
    const habit: Task[] = [];
    
    selectedDateTasks.forEach(task => {
      if (isNewHabit(task)) {
        habit.push(task);
      } else {
        regular.push(task);
      }
    });
    
    return { regularTasks: regular, habitTasks: habit };
  }, [selectedDateTasks]);

  // 未完了タスク数の計算
  const regularIncompleteCount = getIncompleteTaskCount(regularTasks);
  const habitIncompleteCount = getIncompleteTaskCount(habitTasks);

  // プラン別習慣制限
  const { maxHabits } = getPlanLimits(planType);

  // 現在のタブに応じたタスクリストを取得
  const getCurrentTasks = () => {
    return activeTab === 'habits' ? habitTasks : regularTasks;
  };

  // 選択日に応じたタイトルを生成
  const getTitle = () => {
    return generateDateTitle(selectedDate, activeTab);
  };

  // 日付操作関数
  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    onDateSelect(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateSelect(nextDay);
  };

  const goToToday = () => {
    onDateSelect(new Date());
  };

  // タスクの展開/折りたたみ
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  // タスククリック時の処理
  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskPreviewModal(true);
  };

  // タスク削除処理
  const handleDeleteTask = async (id: string) => {
    try {
      await onDeleteTask(id);
      setShowTaskPreviewModal(false);
      setShowTaskEditModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('タスク削除エラー:', error);
      alert('タスクの削除に失敗しました');
    }
  };

  // タスク完了処理
  const handleCompleteTask = async (id: string) => {
    try {
      await onCompleteTask(id);
      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (error) {
      console.error('タスク完了エラー:', error);
      alert('タスクの完了処理に失敗しました');
    }
  };

  // 進捗ページに移動
  const handleNavigateToProgress = () => {
    router.push('/progress');
  };



  // 感情記録メニューを閉じる
  const handleCloseEmotionMenu = () => {
    setShowEmotionMenu(false);
  };

  // 感情メニューの外部クリック処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // キャラクター画像自体かどうかを判定
      const isCharacterImage = target.tagName === 'IMG' && 
        target.getAttribute('alt') === 'StepEasy Bird Character';
      
      // 感情メニュー内の要素かどうかを判定
      const isEmotionMenuElement = target.closest('[data-emotion-menu]') !== null;
      
      // ハートボタンかどうかを判定
      const isEmotionButton = target.closest('[data-emotion-button]') !== null;
      
      if (showEmotionMenu && !isCharacterImage && !isEmotionMenuElement && !isEmotionButton) {
        setShowEmotionMenu(false);
      }
    };
    
    if (showEmotionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmotionMenu]);

  // メッセージの外部クリック処理（デスクトップ版と同じ）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMessage) {
        const target = event.target as HTMLElement;
        
        if (!target.closest('.character-container')) {
          clearMessage();
        }
      }
    };
    if (showMessage) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMessage, clearMessage]);

  // 自動表示の実行
  useEffect(() => {
    handleAutoDisplay();
  }, [handleAutoDisplay]);

  // タスクプレビューモーダル表示のイベントリスナー
  useEffect(() => {
    const handleShowTaskPreviewModal = (event: CustomEvent) => {
      const { task } = event.detail;
      setSelectedTask(task);
      setShowTaskPreviewModal(true);
    };

    window.addEventListener('showTaskPreviewModal', handleShowTaskPreviewModal as EventListener);
    
    return () => {
      window.removeEventListener('showTaskPreviewModal', handleShowTaskPreviewModal as EventListener);
    };
  }, []);


  return (
    <div className="min-h-screen mt-4">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center">
            <button
              onClick={goToPreviousDay}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {FaChevronLeft ({className:"w-4 h-4"})}
            </button>
            
            <div className="text-center mx-4">
              <h1 className="text-lg font-semibold text-[#8b4513]">
                {getTitle()}
              </h1>
              {!isTodaySelected && (
                <button
                  onClick={goToToday}
                  className="text-sm text-[#7c5a2a] hover:text-[#8b4513] transition-colors mt-1"
                >
                  今日に戻る
                </button>
              )}
            </div>
            
            <button
              onClick={goToNextDay}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {FaChevronRight ({className:"w-4 h-4"})}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => handleTabChange('habits')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'habits'
                ? 'text-[#8b4513] border-b-2 border-[#8b4513]'
                : 'text-[#7c5a2a] hover:text-[#8b4513]'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {FaFire ({className:"w-4 h-4"})}
              <span>習慣</span>
              {habitIncompleteCount > 0 && (
                <span className="bg-[#deb887] text-[#7c5a2a] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {habitIncompleteCount}
                </span>
              )}
            </div>
          </button>
          

          
          <button
            onClick={() => handleTabChange('tasks')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'text-[#8b4513] border-b-2 border-[#8b4513]'
                : 'text-[#7c5a2a] hover:text-[#8b4513]'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {FaTasks ({className:"w-4 h-4"})}
              <span>タスク</span>
              {regularIncompleteCount > 0 && (
                <span className="bg-[#deb887] text-[#7c5a2a] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {regularIncompleteCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4">
        {/* 無料ユーザー向け習慣制限表示（習慣タブの時のみ） */}
        {activeTab === 'habits' && planType === 'free' && (
          <div className="mb-3 flex justify-center">
            <button
              onClick={() => router.push('/settings?tab=subscription')}
              className="bg-[#f5f5dc] border border-[#deb887] rounded px-2 py-1 hover:bg-[#deb887] transition-colors cursor-pointer"
              title="プレミアム版で習慣を無制限に追加できます"
            >
              <div className="flex items-center gap-1">
                {FaCrown({ className: "w-3 h-3 text-[#8b4513]" })}
                <span className="text-xs font-medium text-[#8b4513]">習慣制限: {habitTasks.length}/3</span>
              </div>
            </button>
          </div>
        )}
        
        {getCurrentTasks().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'habits' ? (
                FaFire ({className:"w-12 h-12 mx-auto"})
              ) : (
                FaTasks ({className:"w-12 h-12 mx-auto"})
              )}
            </div>
            <h3 className="text-lg font-medium text-[#8b4513] mb-2">
              {activeTab === 'habits' ? '習慣がありません' : 'タスクがありません'}
            </h3>
            <p className="text-[#7c5a2a] mb-6">
              {activeTab === 'habits' 
                ? '新しい習慣を追加して、継続的な目標を設定しましょう。'
                : '新しいタスクを追加して、今日の目標を設定しましょう。'
              }
            </p>
          </div>

        ) : (
          <div className="h-56">
            <MobileTaskCarousel
              tasks={getCurrentTasks()}
              onCompleteTask={onCompleteTask}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onTaskClick={handleTaskClick}
              isHabit={activeTab === 'habits'}
              selectedDate={selectedDate}
            />
          </div>
        )}
      </div>

      {/* Character and Message UI - デスクトップ版と同じ配置 */}
      <div className="px-4 pb-10">
        <div className="character-container relative flex justify-center">
          {/* メッセージバブル（キャラクターの上に配置） */}
          {showMessage && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-72 max-w-sm">
              {/* 尻尾を背面に配置（z-index指定なし、枠・影なし、グラデ一致） */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-[#fff8f0]/95 to-[#f5e6d3]/95 rotate-45 -translate-y-1/2 pointer-events-none"></div>
              <div className="relative z-10 bg-gradient-to-br from-[#fff8f0]/95 to-[#f5e6d3]/95 backdrop-blur-md rounded-2xl shadow-2xl transition-all duration-300 p-4 w-72">
                <div className={`text-[#8b4513] font-medium leading-relaxed text-sm text-center ${!isTyping ? 'cursor-pointer' : 'cursor-default'}`} onClick={!isTyping ? onMessageClick : undefined}>
                  <span>{displayedMessage}</span>
                  {isTyping && <span className="animate-blink ml-1">|</span>}
                </div>
              </div>
            </div>
          )}
          
          {/* キャラクター（感情メニュー付き）- モバイル版専用デザイン */}
          <div className="relative">
            <div 
              className="cursor-pointer flex-shrink-0 z-30"
              style={{ height: '3cm', width: 'auto', display: 'flex', alignItems: 'center' }} 
              onClick={(e) => {
                e.stopPropagation(); // イベント伝播を停止
                handleMessageClick();
              }}
            >
              {/* 半透明の円（半径2cm）- 背面に配置 */}
              <div className={`
                absolute inset-0 w-32 h-32 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2
                ${recordStatus && currentTimePeriod && (
                  recordStatus[currentTimePeriod] === null || 
                  (recordStatus[currentTimePeriod] && recordStatus[currentTimePeriod].id?.toString().startsWith('temp-'))
                ) ? 'background-circle-unrecorded' : 'bg-blue-200/20 border-blue-300/30'}
              `} style={{ left: '50%', top: '50%', zIndex: -1 }}></div>
              
              <Image
                ref={characterRef}
                src={showMessage ? '/TalkToTheBird.png' : '/SilentBird.png'}
                alt="StepEasy Bird Character"
                width={120}
                height={120}
                priority={true}
                style={{ height: '3cm', width: 'auto', objectFit: 'contain', display: 'block' }}
                className={`
                  transition-transform transition-shadow duration-200 active:scale-110
                  ${recordStatus && currentTimePeriod && (
                    recordStatus[currentTimePeriod] === null || 
                    (recordStatus[currentTimePeriod] && recordStatus[currentTimePeriod].id?.toString().startsWith('temp-'))
                  ) ? 'character-unrecorded' : ''}
                `}
              />
              
              {/* 朝昼晩（統合型ヘッダー）をキャラクターの足元にabsolute配置：感情メニュー表示時のみ表示 */}
              {showEmotionMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 z-30 w-auto min-w-fit max-w-md flex justify-center pointer-events-none">
                  <span className={`
                    bg-white/90 border border-gray-200 rounded-full px-4 py-1 text-sm font-bold text-gray-800 shadow-md pointer-events-none select-none
                    ${recordStatus && currentTimePeriod && (
                      recordStatus[currentTimePeriod] === null || 
                      (recordStatus[currentTimePeriod] && recordStatus[currentTimePeriod].id?.toString().startsWith('temp-'))
                    ) ? 'border-blue-400 bg-blue-50' : ''}
                  `}>
                    {getEmotionTimePeriodLabel()}
                  </span>
                </div>
              )}
              
              {/* 感情記録メニュー - キャラクター画像の中心に配置 */}
              {showEmotionMenu && (
                <div className="absolute inset-0 z-40">
                  <EmotionHoverMenu
                    isVisible={showEmotionMenu}
                    onClose={() => {
                      handleCloseEmotionMenu();
                    }}
                    characterRef={characterRef}
                    isMessageDisplaying={showMessage}
                    isTyping={isTyping}
                    isMobile={true}
                  />
                </div>
              )}
            </div>
            
            {/* 感情記録ボタン（モバイル版専用） */}
            <button
              onClick={() => {
                setShowEmotionMenu(!showEmotionMenu);
              }}
              className="absolute -bottom-8 -right-8 w-14 h-14 bg-pink-400/30 backdrop-blur-sm rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white hover:bg-pink-500/30 active:scale-95 transition-all duration-200 z-40"
              title="感情を記録"
              data-emotion-button="true"
            >
              <svg className="w-6 h-6" fill="#be185d" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
        </div>
      </div>


      


      {/* タスクプレビュー・編集モーダル */}
      {selectedTask && (
        <>
          <TaskPreviewModal
            task={selectedTask}
            isOpen={showTaskPreviewModal}
            onClose={() => setShowTaskPreviewModal(false)}
            onEdit={(task) => {
              setSelectedTask(task);
              setShowTaskPreviewModal(false);
              setShowTaskEditModal(true);
            }}
            onDelete={handleDeleteTask}
            onComplete={handleCompleteTask}
            onRefresh={() => {
              if (onTaskUpdate) {
                onTaskUpdate();
              }
            }}
            isMobile={true}
            selectedDate={selectedDate}
          />

          <TaskEditModal
            task={selectedTask}
            isOpen={showTaskEditModal}
            onClose={() => setShowTaskEditModal(false)}
            onSave={async (taskData) => {
              if (selectedTask) {
                try {
                  console.log('🔍 モバイル習慣編集保存開始:', {
                    task_id: selectedTask.id,
                    is_habit: isNewHabit(selectedTask),
                    input_data: taskData,
                    timestamp: new Date().toISOString()
                  });

                  // 習慣かどうかを判定して適切な更新関数を使用
                  if (isNewHabit(selectedTask)) {
                    // 習慣の場合はupdateHabitを使用
                    const { updateHabit } = useHabitStore.getState();
                    
                    // taskDataを習慣用の形式に変換（日付処理を修正）
                    const habitData = {
                      title: taskData.title,
                      description: taskData.description,
                      category: taskData.category,
                      priority: taskData.priority,
                      estimated_duration: taskData.estimated_duration,
                      start_date: taskData.start_date ? taskData.start_date : undefined,
                      due_date: taskData.due_date ? taskData.due_date : null,
                      has_deadline: taskData.due_date !== null && taskData.due_date !== undefined
                    };

                    console.log('🔍 モバイル変換後の習慣データ:', {
                      habit_data: habitData,
                      data_types: {
                        title: typeof habitData.title,
                        description: typeof habitData.description,
                        category: typeof habitData.category,
                        priority: typeof habitData.priority,
                        estimated_duration: typeof habitData.estimated_duration,
                        start_date: typeof habitData.start_date,
                        due_date: typeof habitData.due_date,
                        has_deadline: typeof habitData.has_deadline
                      },
                      timestamp: new Date().toISOString()
                    });

                    await updateHabit(selectedTask.id, habitData);
                    
                    // 習慣データを再取得（リアルタイム反映のため）
                    const { fetchHabits } = useHabitStore.getState();
                    await fetchHabits();
                    
                    // 親コンポーネントの更新関数も呼び出し
                    if (onTaskUpdate) {
                      await onTaskUpdate();
                    }
                    
                    console.log('✅ モバイル習慣編集保存完了:', {
                      task_id: selectedTask.id,
                      updated_fields: Object.keys(habitData),
                      timestamp: new Date().toISOString()
                    });
                  } else {
                    // タスクの場合はonEditTaskを使用（従来通り）
                    if (onEditTask) {
                      await onEditTask(taskData);
                    }
                  }
                } catch (error) {
                  console.error('❌ モバイル習慣編集保存エラー:', error);
                  alert('保存に失敗しました: ' + (error as Error).message);
                }
              }
            }}
            onDelete={handleDeleteTask}
            onPreview={(task) => {
              setSelectedTask(task);
              setShowTaskEditModal(false);
              setShowTaskPreviewModal(true);
            }}
            onRefresh={() => {
              if (onTaskUpdate) {
                onTaskUpdate();
              }
            }}
            isMobile={true}
            selectedDate={selectedDate}
          />
        </>
      )}
    </div>
  );
}; 