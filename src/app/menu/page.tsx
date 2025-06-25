'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore, Task } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Calendar } from '@/components/molecules/Calendar';
import { Character } from '@/components/molecules/Character';
import { ActivityStats } from '@/components/molecules/ActivityStats';
import { CategoryStats } from '@/components/molecules/CategoryStats';
import { HeatmapChart } from '@/components/molecules/HeatmapChart';
import { AlertBox } from '@/components/molecules/AlertBox';
import { TaskListHome } from '@/components/molecules/TaskListHome';
import { GuestMigrationModal } from '@/components/molecules/GuestMigrationModal';
import { MobileHomeHeader } from '@/components/molecules/MobileHomeHeader';
import { MobileHomeContent } from '@/components/molecules/MobileHomeContent';
import { MobileCollapsibleFooter } from '@/components/molecules/MobileCollapsibleFooter';
import { ModernMobileHome } from '@/components/molecules/ModernMobileHome';
import { PremiumComingSoonBanner } from '@/components/molecules/PremiumComingSoonBanner';
import { PremiumPreviewModal } from '@/components/molecules/PremiumPreviewModal';
import { NotificationSignupForm } from '@/components/molecules/NotificationSignupForm';

import { Button } from '@/components/atoms/Button';

import { getGuestTasks, migrateGuestTasks, clearGuestTasks } from '@/lib/guestMigration';
import { useCharacterMessage } from '@/hooks/useCharacterMessage';
import { FaArchive } from 'react-icons/fa';

export default function MenuPage() {
  const router = useRouter();
  const { user, signOut, shouldShowMigrationModal, setShouldShowMigrationModal, isGuest, planType } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask, resetExpiredStreaks, cleanupExpiredData } = useTaskStore();
  const [characterMood, setCharacterMood] = React.useState<'happy' | 'normal' | 'sad'>('normal');
  const [guestTasks, setGuestTasks] = React.useState<Task[]>([]);
  const [migrationError, setMigrationError] = React.useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [contentHeight, setContentHeight] = useState(28); // rem単位
  const [currentMobileTab, setCurrentMobileTab] = useState<'tasks' | 'habits'>('tasks');
  
  // プレミアム関連のstate（デスクトップ版用）
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  // 選択された日付を管理（初期値は今日）
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  useEffect(() => {
    if (!user) {
      router.push('/lp');
      return;
    }
    
    const initializeData = async () => {
      await fetchTasks();
      // アプリ起動時に期限切れストリークをリセット
      await resetExpiredStreaks();
      // 無料ユーザーの30日経過データをクリーンアップ
      await cleanupExpiredData();
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

  // AIキャラクターメッセージ
  const { message: characterMessage, isLoading: isMessageLoading } = useCharacterMessage({
    userType: user?.isGuest ? 'guest' : planType,
    userName: user?.displayName,
    tasks,
    statistics,
    selectedDate,
  });

  useEffect(() => {
    // タスクの状態に応じてキャラクターの表情を更新
    const { selectedDateCompletedTasks, selectedDateTotalTasks } = statistics;

    if (selectedDateTotalTasks === 0) {
      setCharacterMood('normal');
    } else if (selectedDateCompletedTasks === selectedDateTotalTasks) {
      setCharacterMood('happy');
    } else if (selectedDateCompletedTasks / selectedDateTotalTasks >= 0.7) {
      setCharacterMood('happy');
    } else if (selectedDateCompletedTasks / selectedDateTotalTasks >= 0.3) {
      setCharacterMood('normal');
    } else {
      setCharacterMood('sad');
    }
  }, [statistics, selectedDate]);

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

  // FABクリック時の処理（現在のタブに応じてタスク追加画面に遷移）
  const handleFABClick = () => {
    if (currentMobileTab === 'habits') {
      // 習慣追加画面に遷移（習慣モードでタスクページを開く）
      router.push('/tasks?type=habit');
    } else {
      // 通常のタスク追加画面に遷移
      router.push('/tasks?type=task');
    }
  };

  return (
    <AppLayout variant="home" tasks={tasks as any} showNotifications={true} onFABClick={handleFABClick}>
      {/* モダンなモバイル専用レイアウト */}
      <div className="md:hidden">
        <ModernMobileHome
          selectedDate={selectedDate}
          selectedDateTasks={selectedDateTasks}
          tasks={tasks}
          statistics={statistics}
          characterMood={characterMood}
          characterMessage={characterMessage}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onDateSelect={setSelectedDate}
          onTabChange={setCurrentMobileTab}
          onTaskUpdate={fetchTasks} // データ更新関数を追加
        />
      </div>

      {/* デスクトップ版レイアウト（変更なし） */}
      <div className="hidden md:block px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full">
        {/* メインコンテンツエリア（サイドバーは左固定で分離） */}
        <div>
          <div>
            {/* 上段：タスク & カレンダー */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
              style={{ minHeight: `${contentHeight}rem` }}
            >
              <TaskListHome
                tasks={selectedDateTasks as any}
                selectedDate={selectedDate}
                onAddTask={() => router.push('/tasks')}
                onCompleteTask={handleCompleteTask}
                height={contentHeight}
              />
              <Calendar 
                tasks={tasks}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  const newDate = new Date(date);
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                }}
                onHeightChange={setContentHeight}
              />
            </div>

            {/* 中段：キャラクター吹き出し */}
            <div className="mb-6">
              <div className="hidden md:block">
                <Character mood={characterMood} message={characterMessage} layout="horizontal" />
              </div>
            </div>

            {/* 中段：統計・傾向（アラートはサイドバーに移動） */}
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4 mb-6">
              <ActivityStats tasks={tasks} selectedDateTasks={selectedDateTasks} selectedDate={selectedDate} />
              <CategoryStats tasks={tasks} />
              <HeatmapChart tasks={tasks} />
            </div>

            {/* プレミアム導線（デスクトップ版）- 一番下に移動 */}
            {!isGuest && planType === 'free' && (
              <div className="mb-6">
                <PremiumComingSoonBanner
                  onPreviewClick={() => setShowPreviewModal(true)}
                  onNotificationSignup={() => setShowNotificationForm(true)}
                />
              </div>
            )}
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

      {/* プレミアム関連モーダル（デスクトップ版） */}
      <PremiumPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onNotificationSignup={() => {
          setShowPreviewModal(false);
          setShowNotificationForm(true);
        }}
      />

      <NotificationSignupForm
        isOpen={showNotificationForm}
        onClose={() => setShowNotificationForm(false)}
        onSuccess={() => {
          console.log('Premium notification signup successful (desktop)');
        }}
      />
    </AppLayout>
  );
}