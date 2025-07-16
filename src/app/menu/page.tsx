'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore } from '@/stores/taskStore';
import { Task } from '@/types/task';
import { useHabitStore } from '@/stores/habitStore';
import { HabitWithCompletion } from '@/types/habit';
import { AppLayout } from '@/components/templates/AppLayout';
import { Calendar } from '@/components/molecules/Calendar';
import { Character } from '@/components/molecules/Character';

import { TaskListHome } from '@/components/molecules/TaskListHome';
import { GuestMigrationModal } from '@/components/molecules/GuestMigrationModal';
import { ModernMobileHome } from '@/components/molecules/ModernMobileHome';

import { TaskModal } from '@/components/molecules/TaskModal';
import { HabitModal } from '@/components/molecules/HabitModal';
import { TaskPreviewModal } from '@/components/molecules/TaskPreviewModal';
import { TaskEditModal } from '@/components/molecules/TaskEditModal';
import { HabitCard } from '@/components/molecules/HabitCard';

import { getGuestTasks, migrateGuestTasks, clearGuestTasks } from '@/lib/guestMigration';
import { useCharacterMessage } from '@/hooks/useCharacterMessage';
import { useEmotionLog } from '@/hooks/useEmotionLog';
import { useMessageDisplay } from '@/hooks/useMessageDisplay';
import { integrateHabitData, convertHabitsToTasks, isNewHabit } from '@/lib/habitUtils';
import { completeHabit, deleteHabit as deleteHabitOperation, editHabit } from '@/lib/habitOperations';
import { useEmotionStore } from '@/stores/emotionStore';
// react-responsiveが未インストールの場合は `npm install react-responsive` を実行してください
const { useMediaQuery } = require('react-responsive');

export default function MenuPage() {
  const router = useRouter();
  const { user, signOut, shouldShowMigrationModal, setShouldShowMigrationModal, isGuest, planType } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask, resetExpiredStreaks } = useTaskStore();
  const { habits, habitCompletions, fetchHabits, deleteHabit } = useHabitStore();
  
  // 感情記録の状態を取得（一元管理）
  const emotionStore = useEmotionStore();

  // 感情記録状態のデバッグ（開発環境のみ）
  useEffect(() => {
    console.log('🔍 MenuPage useEmotionStore 状態:', {
      recordStatus: emotionStore.recordStatus,
      currentTimePeriod: emotionStore.currentTimePeriod,
      recordStatusKeys: emotionStore.recordStatus ? Object.keys(emotionStore.recordStatus) : [],
      allRecordIds: emotionStore.recordStatus ? {
        morning: emotionStore.recordStatus.morning?.id,
        afternoon: emotionStore.recordStatus.afternoon?.id,
        evening: emotionStore.recordStatus.evening?.id
      } : {}
    });
  }, [emotionStore.recordStatus, emotionStore.currentTimePeriod]);

  // 感情記録の初期化
  useEffect(() => {
    emotionStore.refreshTodayEmotions();
    
    // 5分ごとに現在の時間帯を更新
    const interval = setInterval(() => {
      const { getEmotionTimePeriod } = require('@/lib/timeUtils');
      const newTimePeriod = getEmotionTimePeriod();
      if (newTimePeriod !== emotionStore.currentTimePeriod) {
        emotionStore.refreshTodayEmotions();
      }
    }, 300000); // 5分

    return () => clearInterval(interval);
  }, []); // emotionStoreを依存配列から削除して無限ループを防ぐ
  
  // 状態管理
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentMobileTab, setCurrentMobileTab] = useState<'tasks' | 'habits'>('habits');
  const [currentDesktopTab, setCurrentDesktopTab] = useState<'tasks' | 'habits'>('habits');
  const [guestTasks, setGuestTasks] = React.useState<Task[]>([]);
  const [migrationError, setMigrationError] = React.useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState(46); // rem単位（カレンダーと統一）
  const [speechBubbleVisible, setSpeechBubbleVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showTaskPreviewModal, setShowTaskPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // モーダルのref
  const taskModalRef = useRef<{ closeWithValidation: () => void }>(null);
  const habitModalRef = useRef<{ closeWithValidation: () => void }>(null);

  const isDesktop = useMediaQuery({ minWidth: 1024 });
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) {
      router.push('/lp');
      return;
    }
    
    const initializeData = async () => {
      await fetchTasks();
      await fetchHabits();
      // アプリ起動時に期限切れストリークをリセット
      await resetExpiredStreaks();
    };
    
    initializeData();
    
    // ゲストタスクを取得
    if (shouldShowMigrationModal) {
      setGuestTasks(getGuestTasks());
    }
  }, [user, router, fetchTasks, fetchHabits, resetExpiredStreaks, shouldShowMigrationModal]);

  // 選択された日付のタスクをフィルタリング（習慣以外）
  const selectedDateTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      // 習慣タスクは除外
      if (task.is_habit) {
        return false;
      }
      
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

  // 習慣の表示（常に表示）
  const displayHabits = useMemo(() => {
    return integrateHabitData(habits, tasks);
  }, [habits, tasks]);

  // 新しい習慣データをTask型に変換（未来日付でも表示する）
  const convertedHabits = useMemo(() => {
    return convertHabitsToTasks(habits, selectedDate, habitCompletions);
  }, [habits, selectedDate, habitCompletions]);

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
  const { characterMessage, messageParts } = useCharacterMessage({
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

  // 統一されたメッセージ表示状態管理
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
    mounted
  });

  // 外部クリックでメッセージを消す機能
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

  // クリック処理（デスクトップ版用）
  const handleClick = () => {
    handleMessageClick();
  };



  const handleCompleteTask = async (id: string) => {
    // タスクか習慣かを判定
    const task = tasks.find(t => t.id === id);
    const habit = habits.find(h => h.id === id);
    
    if (habit || (task && task.is_habit)) {
      // 習慣の場合：completeHabit関数を使用
      const { completeHabit: completeHabitFn, toggleHabitCompletion: toggleHabitCompletionFn } = useHabitStore.getState();
      const result = await completeHabit(id, habits, tasks, completeHabitFn, updateTask, fetchHabits, toggleHabitCompletionFn, selectedDate);
      
      if (!result.success) {
        console.error('習慣完了エラー:', result.message);
      }
      
      await fetchHabits();
    } else if (task && !task.is_habit) {
      // 通常のタスクの場合：直接updateTaskを使用
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      
      // 完了時は選択されている日付をcompleted_atに設定
      let completedAt: string | undefined;
      if (newStatus === 'done') {
        if (selectedDate) {
          // 選択されている日付がある場合はその日付を使用
          const selectedDateTime = new Date(selectedDate);
          selectedDateTime.setHours(12, 0, 0, 0); // 12時を基準に設定
          completedAt = selectedDateTime.toISOString();
        } else {
          // 選択日がない場合は現在時刻を使用
          completedAt = new Date().toISOString();
        }
      }
      
      try {
        await updateTask(id, { status: newStatus, completed_at: completedAt });
      } catch (error) {
        console.error('タスク完了エラー:', error);
      }
    }
    
    await fetchTasks(); // タスクデータを再取得
  };

  const handleDeleteTask = async (id: string) => {
    // 習慣かどうかを判定
    const isHabit = habits.some(habit => habit.id === id) || 
                   tasks.some(task => task.id === id && task.is_habit);
    
    const message = isHabit ? 'この習慣を削除してもよろしいですか？' : 'このタスクを削除してもよろしいですか？';
    
    if (window.confirm(message)) {
      if (isHabit) {
        // 習慣の場合は習慣削除処理を使用
        const { deleteHabit: deleteHabitFn } = useHabitStore.getState();
        await deleteHabitOperation(id, habits, tasks, deleteHabitFn, deleteTask);
        await fetchHabits();
      } else {
        // 通常のタスクの場合はタスク削除処理を使用
        await deleteTask(id);
      }
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (window.confirm('この習慣を削除してもよろしいですか？')) {
      const { deleteHabit: deleteHabitFn } = useHabitStore.getState();
      await deleteHabitOperation(id, habits, tasks, deleteHabitFn, deleteTask);
      await fetchHabits(); // 習慣データを再取得
    }
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task as any);
    setShowEditModal(true);
  };

  const handleEditHabit = (habit: any) => {
    // 新しい習慣テーブルの習慣の場合
    if (isNewHabit(habit)) {
      // 新しい習慣はHabitModalで編集
      setSelectedTask(habit);
      setShowHabitModal(true);
    } else {
      // 既存のタスクテーブルの習慣はTaskEditModalで編集
      setSelectedTask(habit);
      setShowEditModal(true);
    }
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

  // 時間帯による挨拶の設定（日本時間）
  useEffect(() => {
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const hour = japanTime.getHours();
    if (hour >= 6 && hour < 12) {
      setGreeting('おはようございます');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('こんにちは');
    } else {
      setGreeting('こんばんは');
    }
  }, []);

  // FABクリック時の処理（現在のタブに応じて直接モーダル表示）
  const handleFABClick = () => {
    // モーダルが開いている場合は閉じるボタンと同じ動作
    if (showTaskModal || showHabitModal) {
      // 閉じるボタンと同じ処理を実行（変更がある場合は確認ダイアログ）
      if (showTaskModal) {
        // TaskModalの閉じる処理を呼び出し（既存のhandleCloseWithConfirmと同じ動作）
        taskModalRef.current?.closeWithValidation();
      } else if (showHabitModal) {
        // HabitModalの閉じる処理を呼び出し（既存のhandleCloseWithConfirmと同じ動作）
        habitModalRef.current?.closeWithValidation();
      }
      return;
    }
    
    // モーダルが閉じている場合は開く
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
    <AppLayout variant="home" tasks={tasks as any} showNotifications={true} showFAB={true} onFABClick={handleFABClick} currentTab={currentMobileTab}>
      {/* モダンなモバイル専用レイアウト */}
      <div className="lg:hidden">
        <ModernMobileHome
          selectedDate={selectedDate}
          selectedDateTasks={[...selectedDateTasks, ...convertedHabits] as any}
          tasks={tasks}
          statistics={statistics}
          characterMessage={characterMessage}
          messageParts={messageParts}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={(task) => handleEditTask(task as any)}
          onDateSelect={setSelectedDate}
          onTabChange={handleMobileTabChange}
          onTaskUpdate={fetchTasks} // データ更新関数を追加
          onMessageClick={handleMessageClick} // メッセージクリック用
          emotionLog={emotionStore}
        />
      </div>

      {/* デスクトップ版レイアウト（背景透明で共通背景を使用） */}
      <div className="hidden lg:block px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full min-h-screen">
        {/* 右下固定のキャラクター＋吹き出し（デスクトップ版のみ） */}
        {mounted && isDesktop && (
          <div className="fixed bottom-6 right-24 z-10 character-container">
            <Character
              message={displayedMessage}
              messageParts={messageParts}
              showMessage={showMessage}
              isTyping={isTyping}
              displayedMessage={displayedMessage}
              bubblePosition="left"
              size="3cm"
              onClick={handleClick}
              emotionLog={emotionStore}
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
                tasks={[...selectedDateTasks, ...convertedHabits] as any}
                selectedDate={selectedDate}
                onCompleteTask={handleCompleteTask}
                onTaskClick={handleTaskClick}
                onEditTask={handleEditTask}
                height={46}
                activeTab={currentDesktopTab}
                onTabChange={setCurrentDesktopTab}
              />
              <Calendar 
                tasks={tasks}
                habits={habits}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  const newDate = new Date(date);
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                }}
                onTabChange={(tab: 'tasks' | 'habits') => {
                  setCurrentDesktopTab(tab);
                }}
                activeTab={currentDesktopTab}
              />
            </div>

            {/* 中段：統計・傾向（アラートはサイドバーに移動） */}
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4 mb-6">
            </div>


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
        ref={taskModalRef}
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        isMobile={!isDesktop}
      />

      {/* 習慣作成モーダル */}
      <HabitModal
        ref={habitModalRef}
        isOpen={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        isMobile={!isDesktop}
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
            selectedDate={selectedDate}
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