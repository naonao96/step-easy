import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/stores/taskStore';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { Character } from './Character';
import { StreakBadge } from '@/components/atoms/StreakBadge';
import { useAuth } from '@/contexts/AuthContext';
import { MobileTaskTimer } from './MobileTaskTimer';
import { MobileTaskHistory } from './MobileTaskHistory';
import { PremiumComingSoonBanner } from './PremiumComingSoonBanner';
import { PremiumPreviewModal } from './PremiumPreviewModal';
import { NotificationSignupForm } from './NotificationSignupForm';
import ReactMarkdown from 'react-markdown';
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
  onDateSelect,
  onTabChange,
  onTaskUpdate
}) => {
  const router = useRouter();
  const { isGuest, isPremium, planType, canAddTaskOnDate } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // プレミアム機能モーダル関連の状態
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

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
    return activeTab === 'tasks' ? regularTasks : habitTasks;
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
      return activeTab === 'tasks' ? '今日のタスク' : '今日の習慣';
    }
    
    const formattedDate = formatDate(selectedDate);
    return activeTab === 'tasks' ? `${formattedDate}のタスク` : `${formattedDate}の習慣`;
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

  return (
    <div className="md:hidden min-h-screen bg-gray-50">
      {/* Header with Date Navigation */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="前日"
            >
              {React.createElement(FaChevronLeft as React.ComponentType<any>, { className: "w-4 h-4 text-gray-600" })}
            </button>
            
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-800">
                {formatDate(selectedDate)}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isToday ? '今日の予定' : 'スケジュール'}
              </p>
            </div>
            
            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="翌日"
            >
              {React.createElement(FaChevronRight as React.ComponentType<any>, { className: "w-4 h-4 text-gray-600" })}
            </button>
          </div>
          
          {/* 今日に戻るボタン（今日以外の日付の場合のみ表示） */}
          {!isToday && (
            <div className="flex justify-center">
              <button
                onClick={goToToday}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
              >
                {React.createElement(FaHome as React.ComponentType<any>, { className: "w-3 h-3" })}
                <span>今日に戻る</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm">
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab('tasks');
              onTabChange?.('tasks');
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {React.createElement(FaTasks as React.ComponentType<any>, { className: "w-4 h-4" })}
              <span>タスク</span>
              {regularIncompleteCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {regularIncompleteCount}
                </span>
              )}
            </div>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('habits');
              onTabChange?.('habits');
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === 'habits'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {React.createElement(FaFire as React.ComponentType<any>, { className: "w-4 h-4" })}
              <span>習慣</span>
              {habitIncompleteCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {habitIncompleteCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {getTitle()}
          </h2>
          <span className="text-sm text-gray-500">
            {getCurrentTasks().length}件
          </span>
        </div>

                 {/* Plan Restriction Notice for Habits */}
         {activeTab === 'habits' && planType === 'guest' && (
           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
             <div className="flex items-start space-x-2">
               {React.createElement(FaFire as React.ComponentType<any>, { className: "text-yellow-500 mt-0.5 flex-shrink-0" })}
               <div>
                 <h3 className="text-sm font-medium text-yellow-800">習慣機能について</h3>
                 <p className="text-xs text-yellow-700 mt-1">
                   {planType === 'guest' 
                     ? '習慣機能を使用するには会員登録が必要です。'
                     : `現在のプランでは習慣を${maxHabits}個まで作成できます。`
                   }
                 </p>
               </div>
             </div>
           </div>
         )}

         {/* 無料ユーザー向けプレミアム誘導 */}
         {activeTab === 'habits' && planType === 'free' && habitTasks.length > 0 && (
           <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
             <div className="flex items-center gap-2 mb-1">
               {React.createElement(FaCrown as React.ComponentType<any>, { className: "w-3 h-3 text-purple-600" })}
               <span className="text-xs font-medium text-purple-900">
                 プレミアムで習慣を無制限に ({habitTasks.length}/{maxHabits}個)
               </span>
             </div>
             <p className="text-xs text-purple-700">
               ストリークも永続保存！高度な分析機能も利用可能
             </p>
           </div>
         )}

        {/* Mobile Optimized Task Cards */}
        <div className="space-y-3">
          {getCurrentTasks().map((task: Task) => (
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
                
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleTaskExpansion(task.id)}
                >
                  <h3 className={`font-medium text-sm leading-tight ${
                  task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-800'
                }`}>
                  {task.title}
                </h3>
              </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/tasks?id=${task.id}&edit=true`);
                  }}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="編集"
                >
                  {React.createElement(FaEdit as React.ComponentType<any>, { className: "w-3 h-3" })}
                </button>
                </div>

              {/* Row 2: Category and Priority */}
              <div className="px-4 pb-2">
                <div className="flex items-center space-x-2 pl-8">
                  {task.category && (
                    <CategoryBadge category={task.category} size="sm" />
                  )}
                  
                  {task.priority && task.priority !== 'medium' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'low' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {task.priority === 'high' ? '高' : 
                       task.priority === 'low' ? '低' : '中'}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Time/Frequency and Streak (for habits) */}
               <div className="px-4 pb-4">
                 <div className="flex items-center justify-between pl-8">
                   <div className="flex items-center space-x-2">
                     {(task as any).estimated_duration && (
                       <span className="text-xs text-gray-500">
                         {(task as any).estimated_duration}分
                       </span>
                     )}
                     
                     {task.is_habit && (
                       <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                         {getFrequencyLabel((task as any).habit_frequency)}
                       </span>
                     )}
                   </div>

                   {task.is_habit && (task as any).current_streak !== undefined && (task as any).current_streak > 0 && (
                     <StreakBadge task={task as any} size="sm" showText={false} />
                   )}
                 </div>
               </div>

              {/* インライン展開エリア */}
              {expandedTaskId === task.id && (
                <div className="border-t border-gray-100 bg-gray-50 animate-in slide-in-from-top duration-300">
                  <div className="p-4 space-y-4">
                    {/* タスクステータスとバッジ */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        優先度: {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </span>
                      {task.is_habit && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                          習慣タスク
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'done' ? 'bg-green-100 text-green-700' :
                        task.status === 'doing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'done' ? '完了' : task.status === 'doing' ? '進行中' : '未着手'}
                      </span>
                    </div>

                    {/* メモ */}
                    {task.description && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">メモ</h4>
                        <div className="bg-white rounded p-2 text-xs text-gray-600 prose prose-xs max-w-none">
                          <ReactMarkdown>
                            {task.description}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 日程情報 */}
                    {(task.start_date || (task.due_date && planType !== 'guest')) && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">📅 日程情報</h4>
                        <div className="bg-purple-50 rounded p-2 space-y-1">
                          {task.start_date && (
                            <div className="flex items-center gap-2 text-xs text-purple-700">
                              <span>🚀</span>
                              <span>開始日: {new Date(task.start_date).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                          {task.due_date && planType !== 'guest' && (
                            <div className="flex items-center gap-2 text-xs text-purple-700">
                              <span>🎯</span>
                              <span>期限日: {new Date(task.due_date).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 習慣情報 */}
                    {task.is_habit && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">習慣情報</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>頻度: {getFrequencyLabel((task as any).habit_frequency)}</div>
                          {(task as any).current_streak !== undefined && (task as any).current_streak > 0 && (
                            <div className="flex items-center gap-1">
                              <span>継続:</span>
                              <StreakBadge task={task as any} size="sm" showText={true} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* タイマー・実行情報 */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-700">タイマー・実行情報</h4>
                      <MobileTaskTimer 
                        task={task as any} 
                        onExecutionComplete={async () => {
                          // データのみを再取得（ページリロードを避ける）
                          try {
                            console.log('タスク実行完了 - データ更新中...');
                            
                            // 親コンポーネントのデータ更新を呼び出す
                            if (onTaskUpdate) {
                              await onTaskUpdate();
                            }
                            
                            console.log('データ更新完了');
                          } catch (error) {
                            console.error('データ更新エラー:', error);
                          }
                        }}
                      />
                      <MobileTaskHistory task={task as any} />
                    </div>

                  </div>
                </div>
              )}
            </div>
          ))}

                     {getCurrentTasks().length === 0 && (
             <div className="text-center py-12">
               {activeTab === 'tasks' ? (
                 <>
                   {React.createElement(FaCalendarAlt as React.ComponentType<any>, { className: "mx-auto text-gray-300 text-3xl mb-3" })}
                   <p className="text-gray-500 text-sm">
                     {isToday ? '今日のタスクはありません' : 'この日のタスクはありません'}
                   </p>
                 </>
               ) : (
                 <>
                   {React.createElement(FaFire as React.ComponentType<any>, { className: "mx-auto text-gray-300 text-3xl mb-3" })}
                   <p className="text-gray-500 text-sm">
                     {isToday ? '今日の習慣はありません' : 'この日の習慣はありません'}
                   </p>
                 </>
               )}
             </div>
           )}
        </div>
      </div>

            {/* Enhanced Character Insights Card */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Main Content */}
          <div className="p-5">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Character Section */}
              <div className="flex-shrink-0">
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={characterMood === 'happy' ? '/TalkToTheBird.png' : characterMood === 'sad' ? '/SilentBird.png' : '/TalkToTheBird.png'}
                    alt="StepEasy Bird Character"
                    className="w-16 h-16 object-contain"
                  />
                  {/* Mood indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    characterMood === 'happy' ? 'bg-green-400' :
                    characterMood === 'normal' ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`} />
                </div>
              </div>

              {/* Character Message */}
              <div className="w-full">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {characterMessage || '読み込み中...'}
                  </p>
                </div>
                
                {/* 詳細分析ボタン */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleNavigateToProgress()}
                    className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         {React.createElement(FaChartBar as React.ComponentType<any>, { className: "w-4 h-4 text-blue-600" })}
                         <span className="text-sm font-medium text-blue-900">詳細統計</span>
                       </div>
                       <div className="text-xs text-blue-600">
                         進捗ページで確認
                       </div>
                     </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* プレミアム Coming Soon バナー */}
      {!isPremium && (
        <div className="mb-6">
          <PremiumComingSoonBanner
            onPreviewClick={() => setShowPreviewModal(true)}
            onNotificationSignup={() => setShowNotificationForm(true)}
          />
        </div>
      )}

      {/* プレミアムプレビューモーダル */}
      <PremiumPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onNotificationSignup={() => {
          setShowPreviewModal(false);
          setShowNotificationForm(true);
        }}
      />

      {/* 通知登録フォーム */}
      <NotificationSignupForm
        isOpen={showNotificationForm}
        onClose={() => setShowNotificationForm(false)}
        onSuccess={() => {
          // 成功時の処理（必要に応じて）
          console.log('Premium notification signup successful');
        }}
      />

      <div className="pb-20"></div>
    </div>
  );
}; 