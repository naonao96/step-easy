import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { Character } from './Character';
import { MobileEmotionRecorder } from './MobileEmotionRecorder';
import { StreakBadge } from '@/components/atoms/StreakBadge';
import { useAuth } from '@/contexts/AuthContext';
import { MobileTaskTimer } from './MobileTaskTimer';
import { MobileTaskHistory } from './MobileTaskHistory';
import { PremiumComingSoonBanner } from './PremiumComingSoonBanner';
import { PremiumPreviewModal } from './PremiumPreviewModal';
import { NotificationSignupForm } from './NotificationSignupForm';
import { useEmotionLog } from '@/hooks/useEmotionLog';
import ReactMarkdown from 'react-markdown';
import { MobileTaskCarousel } from './MobileTaskCarousel';
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
  characterMood: 'happy' | 'normal' | 'sad';
  characterMessage: string;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onDateSelect: (date: Date) => void;
  onTabChange?: (tab: 'tasks' | 'habits') => void;
  onTaskUpdate?: () => Promise<void>; // データ更新関数を追加
}

type TabType = 'tasks' | 'habits';

export const ModernMobileHome: React.FC<ModernMobileHomeProps> = ({
  selectedDate,
  selectedDateTasks,
  tasks,
  statistics,
  characterMood,
  characterMessage,
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  onDateSelect,
  onTabChange,
  onTaskUpdate
}) => {
  const router = useRouter();
  const { isGuest, isPremium, planType, canAddTaskOnDate, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('habits');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // 感情記録の状態を取得
  const { recordStatus, currentTimePeriod } = useEmotionLog();
  
  // プレミアム機能モーダル関連の状態
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  // 感情記録関連の状態
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);
  const characterRef = useRef<HTMLImageElement>(null);
  
  // メッセージ表示関連の状態（デスクトップ版と同じ仕様）
  const [showMessage, setShowMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState('');

  // 今日かどうかの判定
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateTime = new Date(selectedDate);
  selectedDateTime.setHours(0, 0, 0, 0);
  const isToday = selectedDateTime.getTime() === today.getTime();

  // 通常タスクと習慣タスクの分離
  const { regularTasks, habitTasks } = useMemo(() => {
    const regular: Task[] = [];
    const habit: Task[] = [];
    
    selectedDateTasks.forEach(task => {
      if (task.is_habit) {
        habit.push(task);
      } else {
        regular.push(task);
      }
    });
    
    return { regularTasks: regular, habitTasks: habit };
  }, [selectedDateTasks]);

  // 未完了タスク数の計算
  const getIncompleteCount = (taskList: Task[]) => {
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

  const { maxHabits } = getHabitLimits();

  // 現在のタブに応じたタスクリストを取得
  const getCurrentTasks = () => {
    return activeTab === 'habits' ? habitTasks : regularTasks;
  };

  // 日付フォーマット
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 (${weekday})`;
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

  // 選択日に応じたタイトルを生成
  const getTitle = () => {
    if (isToday) {
      return activeTab === 'habits' ? '今日の習慣' : '今日のタスク';
    }
    
    const formattedDate = formatDate(selectedDate);
    return activeTab === 'habits' ? `${formattedDate}の習慣` : `${formattedDate}のタスク`;
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

  // 進捗ページに移動
  const handleNavigateToProgress = () => {
    router.push('/progress');
  };

  // キャラクタークリック処理（デスクトップ版と同じ）
  const handleCharacterClick = () => {
    if (characterMessage && !isTyping) {
      setShowMessage(true);
      setIsTyping(true);
      // タイプライター開始
      let i = 0;
      const type = () => {
        setDisplayedMessage(characterMessage.slice(0, i));
        if (i < characterMessage.length) {
          i++;
          setTimeout(type, 30);
        } else {
          setIsTyping(false);
          // タイプライター完了後、5秒で自動消去
          setTimeout(() => {
            setShowMessage(false);
            setDisplayedMessage('');
          }, 5000);
        }
      };
      type();
    }
  };

  // 感情記録メニューを閉じる
  const handleCloseEmotionMenu = () => {
    setShowEmotionMenu(false);
  };

  // 外部クリックでメッセージと感情メニューを消す機能（デスクトップ版と同じ）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isCharacterContainer = target.closest('.character-container');
      
      // メッセージが表示中で、キャラクター以外の場所をクリックした場合
      if (showMessage && !isTyping && !isCharacterContainer) {
        setShowMessage(false);
        setDisplayedMessage('');
      }
      
      // 感情メニューが表示中で、キャラクター以外の場所をクリックした場合
      if (showEmotionMenu && !isCharacterContainer) {
        setShowEmotionMenu(false);
      }
    };

    if (showMessage || showEmotionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmotionMenu, isTyping]); // showMessageを依存配列から削除

  // 初回表示（リロード・ログイン時は毎回実行）
  useEffect(() => {
    // ユーザー情報が確実に取得できてからメッセージ表示（ゲストユーザーは除く）
    if (characterMessage && !showMessage && !isTyping && (isGuest || user?.displayName || user?.email)) {
      setShowMessage(true);
      setIsTyping(true);
      // タイプライター開始（メッセージを固定）
      const messageToDisplay = characterMessage;
      let i = 0;
      const type = () => {
        // タイプライター中は他の処理をブロック
        if (!isTyping) return;
        setDisplayedMessage(messageToDisplay.slice(0, i));
        if (i < messageToDisplay.length) {
          i++;
          setTimeout(type, 30);
        } else {
          setIsTyping(false);
          // タイプライター完了後、5秒で自動消去
          setTimeout(() => {
            setShowMessage(false);
            setDisplayedMessage('');
          }, 5000);
        }
      };
      type();
    }
  }, [isGuest, user, isTyping]); // isTypingを追加して保護

  // タスクカードのレンダリング関数
  const renderTaskCard = (task: Task, isHabit: boolean) => (
    <div
      key={task.id}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Row 1: Checkbox, Title, and Edit Button */}
      <div className="flex items-start space-x-3 p-4 pb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCompleteTask(task.id);
          }}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.status === 'done'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          {task.status === 'done' && React.createElement(FaCheck as React.ComponentType<any>, { className: "w-2.5 h-2.5" })}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`font-medium text-gray-900 truncate ${
              task.status === 'done' ? 'line-through text-gray-500' : ''
            }`}>
              {task.title}
            </h3>
            {isHabit && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {getFrequencyLabel(task.habit_frequency)}
              </span>
            )}
          </div>
          
          {task.description && (
            <p className={`text-sm text-gray-600 line-clamp-2 ${
              task.status === 'done' ? 'line-through text-gray-400' : ''
            }`}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center space-x-2 mt-2">
            {task.category && (
              <CategoryBadge category={task.category} />
            )}
            {task.priority && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(task.id);
          }}
          className="mt-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          {FaTrash ({className:"w-4 h-4"})}
        </button>
      </div>

      {/* Row 2: Task Timer and History */}
      <div className="px-4 pb-4">
        <MobileTaskTimer
          task={task as any}
          onExecutionComplete={onTaskUpdate}
        />
        
        {expandedTaskId === task.id && (
          <MobileTaskHistory task={task as any} />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
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
              <h1 className="text-lg font-semibold text-gray-900">
                {getTitle()}
              </h1>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors mt-1"
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
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'habits'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {FaFire ({className:"w-4 h-4"})}
              <span>習慣</span>
              {habitIncompleteCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {habitIncompleteCount}
                </span>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'text-[#7c5a2a] border-b-2 border-[#7c5a2a]'
                : 'text-gray-700 hover:text-[#7c5a2a]'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {FaTasks ({className:"w-4 h-4"})}
              <span>タスク</span>
              {regularIncompleteCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {regularIncompleteCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4">
        {getCurrentTasks().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'habits' ? (
                FaFire ({className:"w-12 h-12 mx-auto"})
              ) : (
                FaTasks ({className:"w-12 h-12 mx-auto"})
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'habits' ? '習慣がありません' : 'タスクがありません'}
            </h3>
            <p className="text-gray-500 mb-6">
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
              isHabit={activeTab === 'habits'}
            />
          </div>
        )}
      </div>

      {/* Character and Message UI - デスクトップ版と同じ配置 */}
      <div className="px-4 pb-10">
        <div className="character-container relative flex justify-center">
          {/* メッセージバブル（キャラクターの上に配置） */}
          {showMessage && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-80 max-w-sm">
              <div className="bg-gradient-to-br from-blue-50/95 to-indigo-100/95 backdrop-blur-md rounded-2xl border border-blue-200/50 shadow-2xl transition-all duration-300 p-4 w-80">
                <div className="text-gray-800 font-medium leading-relaxed text-xs">
                  <span>{displayedMessage}</span>
                  {isTyping && <span className="animate-blink ml-1">|</span>}
                </div>
                {/* 尻尾部分（下向き） */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-blue-50/95 to-indigo-100/95 border-r border-b border-blue-200/50 transform rotate-45 -translate-y-1/2"></div>
              </div>
            </div>
          )}
          
          {/* キャラクター（感情メニュー付き）- モバイル版専用デザイン */}
          <div className="relative">
            <div 
              className="cursor-pointer flex-shrink-0 relative" 
              style={{ height: '3cm', width: 'auto', display: 'flex', alignItems: 'center', zIndex: 40 }} 
              onClick={handleCharacterClick}
            >
              {/* 半透明の円（半径2cm）- 背面に配置 */}
              <div className={`
                absolute inset-0 w-32 h-32 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2
                ${recordStatus && currentTimePeriod && recordStatus[currentTimePeriod] === null ? 'background-circle-unrecorded' : 'bg-blue-200/20 border-blue-300/30'}
              `} style={{ left: '50%', top: '50%', zIndex: -1 }}></div>
              
              <img
                ref={characterRef}
                src={characterMood === 'happy' ? '/TalkToTheBird.png' : characterMood === 'sad' ? '/SilentBird.png' : '/TalkToTheBird.png'}
                alt="StepEasy Bird Character"
                style={{ height: '3cm', width: 'auto', objectFit: 'contain', display: 'block' }}
                className={`
                  transition-transform transition-shadow duration-200 active:scale-110
                  ${recordStatus && currentTimePeriod && recordStatus[currentTimePeriod] === null ? 'character-unrecorded' : ''}
                `}
              />
              
              {/* 朝昼晩（統合型ヘッダー）をキャラクターの足元にabsolute配置：感情メニュー表示時のみ表示 */}
              {showEmotionMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 z-50 w-auto min-w-fit max-w-md flex justify-center pointer-events-none">
                  <span className={`
                    bg-white/90 border border-gray-200 rounded-full px-4 py-1 text-sm font-bold text-gray-800 shadow-md pointer-events-auto
                    ${recordStatus && currentTimePeriod && recordStatus[currentTimePeriod] === null ? 'border-blue-400 bg-blue-50' : ''}
                  `}>
                    {(() => {
                      const now = new Date();
                      const hour = now.getHours();
                      if (hour >= 6 && hour < 12) return '朝';
                      if (hour >= 12 && hour < 18) return '昼';
                      return '晩';
                    })()}
                  </span>
                </div>
              )}
              
              {/* テキストヒント（未記録時のみ表示） */}
              {recordStatus && currentTimePeriod && recordStatus[currentTimePeriod] === null && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="hint-text bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-2 rounded-full whitespace-nowrap shadow-lg">
                    💭 今の気持ちを記録してみて！
                  </div>
                </div>
              )}
              
              {/* 感情記録メニュー - キャラクター画像の中心に配置 */}
              {showEmotionMenu && (
                <div className="absolute inset-0 z-50">
                  <EmotionHoverMenu
                    isVisible={showEmotionMenu}
                    onClose={handleCloseEmotionMenu}
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
              onClick={() => setShowEmotionMenu(!showEmotionMenu)}
              className="absolute -bottom-3 -right-3 w-14 h-14 bg-pink-400/30 backdrop-blur-sm rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white hover:bg-pink-500/30 active:scale-95 transition-all duration-200 z-50"
              title="感情を記録"
            >
              <svg className="w-6 h-6" fill="#be185d" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Features */}
      <PremiumComingSoonBanner
        onPreviewClick={() => setShowPreviewModal(true)}
        onNotificationSignup={() => setShowNotificationForm(true)}
      />
      
      <PremiumPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onNotificationSignup={() => setShowNotificationForm(true)}
      />
      
      {showNotificationForm && (
        <NotificationSignupForm
          isOpen={showNotificationForm}
          onClose={() => setShowNotificationForm(false)}
        />
      )}
    </div>
  );
}; 