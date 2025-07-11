'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore, Task } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Calendar } from '@/components/molecules/Calendar';
import { Character } from '@/components/molecules/Character';

import { TaskListHome } from '@/components/molecules/TaskListHome';
import { GuestMigrationModal } from '@/components/molecules/GuestMigrationModal';
import { ModernMobileHome } from '@/components/molecules/ModernMobileHome';
import { PremiumComingSoonBanner } from '@/components/molecules/PremiumComingSoonBanner';
import { TaskModal } from '@/components/molecules/TaskModal';
import { HabitModal } from '@/components/molecules/HabitModal';
import { TaskPreviewModal } from '@/components/molecules/TaskPreviewModal';
import { TaskEditModal } from '@/components/molecules/TaskEditModal';

import { getGuestTasks, migrateGuestTasks, clearGuestTasks } from '@/lib/guestMigration';
import { useCharacterMessage } from '@/hooks/useCharacterMessage';
import { useEmotionLog } from '@/hooks/useEmotionLog';
// react-responsiveが未インストールの場合は `npm install react-responsive` を実行してください
const { useMediaQuery } = require('react-responsive');

export default function MenuPage() {
  const router = useRouter();
  const { user, signOut, shouldShowMigrationModal, setShouldShowMigrationModal, isGuest, planType } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask, resetExpiredStreaks } = useTaskStore();
  
  // 感情記録の状態を取得
  const { recordStatus, currentTimePeriod } = useEmotionLog();
  
  // 状態管理
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [characterMood, setCharacterMood] = React.useState<'happy' | 'normal' | 'sad'>('normal');
  const [showMessage, setShowMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentMobileTab, setCurrentMobileTab] = useState<'tasks' | 'habits'>('habits');
  const [guestTasks, setGuestTasks] = React.useState<Task[]>([]);
  const [migrationError, setMigrationError] = React.useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState(46); // rem単位（カレンダーと統一）
  const [speechBubbleVisible, setSpeechBubbleVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showTaskPreviewModal, setShowTaskPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const isDesktop = useMediaQuery({ minWidth: 1024 });
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) {
      router.push('/lp');
      return;
    }
    
    const initializeData = async () => {
      await fetchTasks();
      // アプリ起動時に期限切れストリークをリセット
      await resetExpiredStreaks();
    };
    
    initializeData();
    
    // ゲストタスクを取得
    if (shouldShowMigrationModal) {
      setGuestTasks(getGuestTasks());
    }
  }, [user, router, fetchTasks, resetExpiredStreaks, shouldShowMigrationModal]);

  // 選択された日付のタスクをフィルタリング
  const selectedDateTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      // 期間タスクの処理（開始日と期限日の両方がある場合）
      if (task.start_date && task.due_date) {
        const taskStartDate = new Date(task.start_date);
        const taskDueDate = new Date(task.due_date);
        taskStartDate.setHours(0, 0, 0, 0);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 選択日が期間内にある場合
        if (selectedDateTime.getTime() >= taskStartDate.getTime() && 
            selectedDateTime.getTime() <= taskDueDate.getTime()) {
          // 未完了の場合は表示
          if (task.status !== 'done') {
            return true;
          }
          // 完了済みの場合は完了日のみ表示
          if (task.status === 'done' && task.completed_at) {
            const completedDate = new Date(task.completed_at);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === selectedDateTime.getTime();
          }
        }
        return false;
      }
      
      // 開始日のみのタスク
      if (task.start_date && !task.due_date) {
        const taskStartDate = new Date(task.start_date);
        taskStartDate.setHours(0, 0, 0, 0);
        
        // 開始日以降で未完了の場合は表示
        if (selectedDateTime.getTime() >= taskStartDate.getTime() && task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === selectedDateTime.getTime();
        }
        return false;
      }
      
      // 期限日のみのタスク
      if (!task.start_date && task.due_date) {
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 期限日まで（今日以降）で未完了の場合は表示
        if (selectedDateTime.getTime() <= taskDueDate.getTime() && 
            selectedDateTime.getTime() >= today.getTime() &&
            task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === selectedDateTime.getTime();
        }
        return false;
      }
      
      // 開始日も期限日もないタスクの処理
      if (!task.start_date && !task.due_date) {
        // 完了済みタスク：完了日が選択日と一致
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === selectedDateTime.getTime();
        }
        
        // 未完了タスク：今日のみ表示（選択日が今日の場合）
        if (task.status !== 'done') {
          return selectedDateTime.getTime() === today.getTime();
        }
      }
      
      return false;
    });
  }, [tasks, selectedDate]);

  // 統計計算
  const statistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 全体統計
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    
    // 今日のタスク統計（todayとselectedDateが同じ場合）
    const todayTasks = tasks.filter(task => {
      // 期間タスクの処理（開始日と期限日の両方がある場合）
      if (task.start_date && task.due_date) {
        const taskStartDate = new Date(task.start_date);
        const taskDueDate = new Date(task.due_date);
        taskStartDate.setHours(0, 0, 0, 0);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 今日が期間内にある場合
        if (today.getTime() >= taskStartDate.getTime() && 
            today.getTime() <= taskDueDate.getTime()) {
          // 未完了の場合は表示
          if (task.status !== 'done') {
            return true;
          }
          // 完了済みの場合は完了日が今日の場合のみ表示
          if (task.status === 'done' && task.completed_at) {
            const completedDate = new Date(task.completed_at);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === today.getTime();
          }
        }
        return false;
      }
      
      // 開始日のみのタスク
      if (task.start_date && !task.due_date) {
        const taskStartDate = new Date(task.start_date);
        taskStartDate.setHours(0, 0, 0, 0);
        
        // 開始日以降で未完了の場合は表示
        if (today.getTime() >= taskStartDate.getTime() && task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日が今日の場合のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }
        return false;
      }
      
      // 期限日のみのタスク
      if (!task.start_date && task.due_date) {
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 期限日まで（今日以降）で未完了の場合は表示
        if (today.getTime() <= taskDueDate.getTime() && task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日が今日の場合のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }
        return false;
      }
      
      // 開始日も期限日もないタスクの処理
      if (!task.start_date && !task.due_date) {
        // 完了済みタスクで今日完了したもの
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }
        
        // 未完了タスク
        if (task.status !== 'done') {
          return true;
        }
      }
      
      return false;
    });
    
    const todayCompletedTasks = todayTasks.filter(task => task.status === 'done').length;
    const todayTotalTasks = todayTasks.length;
    
    // 選択日のタスク統計
    const selectedDateCompletedTasks = selectedDateTasks.filter(task => task.status === 'done').length;
    const selectedDateTotalTasks = selectedDateTasks.length;
    
    return {
      totalTasks,
      completedTasks,
      todayCompletedTasks,
      todayTotalTasks,
      selectedDateCompletedTasks,
      selectedDateTotalTasks,
      overallPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      todayPercentage: todayTotalTasks > 0 ? Math.round((todayCompletedTasks / todayTotalTasks) * 100) : 0,
      selectedDatePercentage: selectedDateTotalTasks > 0 ? Math.round((selectedDateCompletedTasks / selectedDateTotalTasks) * 100) : 0,
    };
  }, [tasks, selectedDateTasks]);

  // AIキャラクターメッセージ（ユーザー情報が確実に取得できてから実行）
  const { message: characterMessage } = useCharacterMessage({
    userType: user?.planType || 'guest',
    userName: user?.displayName || user?.email?.split('@')[0] || 'ユーザー',
    tasks,
    statistics: {
      selectedDateCompletedTasks: 0,
      selectedDateTotalTasks: 0,
      selectedDatePercentage: 0,
      todayPercentage: 0,
      overallPercentage: 0,
    },
    selectedDate,
  });

  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 外部クリックでメッセージを消す機能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMessage) {
        const target = event.target as HTMLElement;
        if (!target.closest('.character-container')) {
          setShowMessage(false);
          setDisplayedMessage('');
          setIsTyping(false);
          if (typewriterTimeoutRef.current) {
            clearTimeout(typewriterTimeoutRef.current);
            typewriterTimeoutRef.current = null;
          }
        }
      }
    };
    if (showMessage) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMessage]);

  // 初回表示（リロード・ログイン時は毎回実行）
  useEffect(() => {
    if (mounted && isDesktop && characterMessage && !showMessage && (user?.isGuest || user?.displayName || user?.email)) {
      setShowMessage(true);
      setIsTyping(true);
      let i = 0;
      const type = () => {
        setDisplayedMessage(characterMessage.slice(0, i));
        if (i < characterMessage.length) {
          i++;
          typewriterTimeoutRef.current = setTimeout(type, 30);
        } else {
          setIsTyping(false);
          typewriterTimeoutRef.current = setTimeout(() => {
            setShowMessage(false);
            setDisplayedMessage('');
            setIsTyping(false);
            if (typewriterTimeoutRef.current) {
              clearTimeout(typewriterTimeoutRef.current);
              typewriterTimeoutRef.current = null;
            }
          }, 5000);
        }
      };
      type();
    }
    // クリーンアップでタイマーを必ず解除
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
        typewriterTimeoutRef.current = null;
      }
      // 画面切り替え時に状態をリセット
      setIsTyping(false);
      setDisplayedMessage('');
      setShowMessage(false);
    };
  }, [mounted, isDesktop, characterMessage, user]);

  // クリック処理
  const handleClick = () => {
    if (characterMessage && !isTyping) {
      setShowMessage(true);
      setIsTyping(true);
      let i = 0;
      const type = () => {
        setDisplayedMessage(characterMessage.slice(0, i));
        if (i < characterMessage.length) {
          i++;
          typewriterTimeoutRef.current = setTimeout(type, 30);
        } else {
          setIsTyping(false);
          typewriterTimeoutRef.current = setTimeout(() => {
            setShowMessage(false);
            setDisplayedMessage('');
            setIsTyping(false);
            if (typewriterTimeoutRef.current) {
              clearTimeout(typewriterTimeoutRef.current);
              typewriterTimeoutRef.current = null;
            }
          }, 5000);
        }
      };
      type();
    }
  };

  useEffect(() => {
    // タスクの状態に応じてキャラクターの表情を更新
    // 注意: 選択された日付に関係なく、常に今日のタスク状況に基づいて表情を決定
    const { todayCompletedTasks, todayTotalTasks } = statistics;

    if (todayTotalTasks === 0) {
      setCharacterMood('normal');
    } else if (todayCompletedTasks === todayTotalTasks) {
      setCharacterMood('happy');
    } else if (todayCompletedTasks / todayTotalTasks >= 0.7) {
      setCharacterMood('happy');
    } else if (todayCompletedTasks / todayTotalTasks >= 0.3) {
      setCharacterMood('normal');
    } else {
      setCharacterMood('sad');
    }
  }, [statistics]); // selectedDateを依存配列から削除

  const handleCompleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // 完了⇔未完了の切り替え
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : undefined;
    
    await updateTask(id, { 
      status: newStatus, 
      completed_at: completedAt 
    });
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      await deleteTask(id);
    }
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task as any);
    setShowEditModal(true);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task as any);
    setShowTaskPreviewModal(true);
  };

  const handleMigrationConfirm = async () => {
    if (!user) return;
    
    setMigrationError(null);
    try {
      const result = await migrateGuestTasks(user.id);
      
      if (!result.success) {
        throw new Error(result.errors.join(', '));
      }
      
      // 移行成功後、ローカルストレージをクリアしてタスクを再取得
      clearGuestTasks();
      await fetchTasks();
    } catch (error) {
      console.error('移行エラー:', error);
      setMigrationError((error as Error).message);
      throw error;
    }
  };

  const handleMigrationCancel = () => {
    setShouldShowMigrationModal(false);
  };

  const handleMigrationComplete = () => {
    setShouldShowMigrationModal(false);
    setGuestTasks([]);
    setMigrationError(null);
  };

  // 時間帯による挨拶の設定
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('おはようございます');
    } else if (hour < 18) {
      setGreeting('こんにちは');
    } else {
      setGreeting('こんばんは');
    }
  }, []);

  // FABクリック時の処理（現在のタブに応じて直接モーダル表示）
  const handleFABClick = () => {
    if (currentMobileTab === 'habits') {
      setShowHabitModal(true);
    } else {
      setShowTaskModal(true);
    }
  };

  // モーダル表示のイベントリスナー
  useEffect(() => {
    const handleShowTaskModal = (event: CustomEvent) => {
      setShowTaskModal(true);
    };

    const handleShowHabitModal = (event: CustomEvent) => {
      setShowHabitModal(true);
    };

    window.addEventListener('showTaskModal', handleShowTaskModal as EventListener);
    window.addEventListener('showHabitModal', handleShowHabitModal as EventListener);
    
    return () => {
      window.removeEventListener('showTaskModal', handleShowTaskModal as EventListener);
      window.removeEventListener('showHabitModal', handleShowHabitModal as EventListener);
    };
  }, []);

  // タブ変更時の処理
  const handleTabChange = (tab: 'tasks' | 'habits') => {
    setCurrentMobileTab(tab);
  };

  // モバイル版のタブ変更時のモーダル表示処理
  const handleMobileTabChange = (tab: 'tasks' | 'habits') => {
    setCurrentMobileTab(tab);
    // モバイル版ではタブ変更時にモーダルを表示しない（FABクリック時のみ）
  };

  return (
    <AppLayout variant="home" tasks={tasks as any} showNotifications={true} showFAB={true} onFABClick={handleFABClick}>
      {/* モダンなモバイル専用レイアウト */}
      <div className="lg:hidden">
        <ModernMobileHome
          selectedDate={selectedDate}
          selectedDateTasks={selectedDateTasks}
          tasks={tasks}
          statistics={statistics}
          characterMood={characterMood}
          characterMessage={characterMessage}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={(task) => handleEditTask(task as any)}
          onDateSelect={setSelectedDate}
          onTabChange={handleMobileTabChange}
          onTaskUpdate={fetchTasks} // データ更新関数を追加
        />
      </div>

      {/* デスクトップ版レイアウト（背景透明で共通背景を使用） */}
      <div className="hidden lg:block px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full min-h-screen">
        {/* 右下固定のキャラクター＋吹き出し（デスクトップ版のみ） */}
        {mounted && isDesktop && (
          <div className="fixed bottom-6 right-24 z-10 character-container">
            <Character
              mood={characterMood}
              message={displayedMessage}
              showMessage={showMessage}
              isTyping={isTyping}
              bubblePosition="left"
              size="3cm"
              onClick={handleClick}
              isDesktop={isDesktop}
              recordStatus={recordStatus}
              currentTimePeriod={currentTimePeriod}
            />
          </div>
        )}
        {/* 既存のメインコンテンツ */}
        <div>
        {/* メインコンテンツエリア（サイドバーは左固定で分離） */}
        <div>
          <div>
            {/* 上段：タスク & カレンダー */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            >
              <TaskListHome
                tasks={selectedDateTasks as any}
                selectedDate={selectedDate}
                onCompleteTask={handleCompleteTask}
                onTaskClick={handleTaskClick}
                onEditTask={handleEditTask}
                height={46}
              />
              <Calendar 
                tasks={tasks}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  const newDate = new Date(date);
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                }}
              />
            </div>

            {/* 中段：統計・傾向（アラートはサイドバーに移動） */}
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4 mb-6">
            </div>

            {/* プレミアム導線（デスクトップ版）- 一番下に移動 */}
            {(isGuest || (!isGuest && planType === 'free')) && (
              <div className="mb-6">
                <PremiumComingSoonBanner />
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* ゲストタスク移行モーダル */}
      <GuestMigrationModal
        isOpen={shouldShowMigrationModal}
        guestTasks={guestTasks}
        onConfirm={handleMigrationConfirm}
        onCancel={handleMigrationCancel}
        onComplete={handleMigrationComplete}
        error={migrationError}
      />





      {/* タスク作成モーダル */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />

      {/* 習慣作成モーダル */}
      <HabitModal
        isOpen={showHabitModal}
        onClose={() => setShowHabitModal(false)}
      />

      {/* タスクプレビュー・編集モーダル */}
      {selectedTask && (
        <>
          <TaskPreviewModal
            task={selectedTask}
            isOpen={showTaskPreviewModal}
            onClose={() => setShowTaskPreviewModal(false)}
            onEdit={(task) => {
              setSelectedTask(task as any);
              setShowTaskPreviewModal(false);
              setShowEditModal(true);
            }}
            onDelete={handleDeleteTask}
            onComplete={handleCompleteTask}
            onRefresh={fetchTasks}
            isMobile={!isDesktop}
          />

          <TaskEditModal
            task={selectedTask}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={async (taskData) => {
              if (selectedTask) {
                await updateTask(selectedTask.id, taskData);
              }
            }}
            onDelete={handleDeleteTask}
            onPreview={(task) => {
              setSelectedTask(task as any);
              setShowEditModal(false);
              setShowTaskPreviewModal(true);
            }}
            onRefresh={fetchTasks}
            isMobile={!isDesktop}
          />
        </>
      )}
    </AppLayout>
  );
}