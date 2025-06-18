'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore, Task } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Calendar } from '@/components/molecules/Calendar';
import { Character } from '@/components/molecules/Character';
import { ActivityStats } from '@/components/molecules/ActivityStats';
import { DayOfWeekChart } from '@/components/molecules/DayOfWeekChart';
import { AlertBox } from '@/components/molecules/AlertBox';
import { TaskListHome } from '@/components/molecules/TaskListHome';
import { GuestMigrationModal } from '@/components/molecules/GuestMigrationModal';
import { getGuestTasks, migrateGuestTasks, clearGuestTasks } from '@/lib/guestMigration';
import { FaArchive } from 'react-icons/fa';

export default function MenuPage() {
  const router = useRouter();
  const { user, signOut, shouldShowMigrationModal, setShouldShowMigrationModal, isGuest } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask, resetExpiredStreaks } = useTaskStore();
  const [characterMood, setCharacterMood] = React.useState<'happy' | 'normal' | 'sad'>('normal');
  const [characterMessage, setCharacterMessage] = React.useState<string>('');
  const [guestTasks, setGuestTasks] = React.useState<Task[]>([]);
  const [migrationError, setMigrationError] = React.useState<string | null>(null);

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

  // 今日のタスクをフィルタリング
  const todayTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (task.due_date) {
        // 期限があるタスクは期限日で判定（完了・未完了問わず）
        const dueDate = new Date(task.due_date);
        return dueDate.toDateString() === today.toDateString();
      } else {
        // 期限がないタスクの場合
        if (task.status === 'done' && task.completed_at) {
          // 完了済みの場合は、今日完了したもののみ表示
          const completedDate = new Date(task.completed_at);
          return completedDate.toDateString() === today.toDateString();
        } else {
          // 未完了の場合は表示（前日以前の未完了タスクも含む）
          return task.status !== 'done';
        }
      }
    });
  }, [tasks]);

  // 統計計算
  const statistics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const todayCompletedTasks = todayTasks.filter(task => task.status === 'done').length;
    const todayTotalTasks = todayTasks.length;
    
    return {
      totalTasks,
      completedTasks,
      todayCompletedTasks,
      todayTotalTasks,
      overallPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      todayPercentage: todayTotalTasks > 0 ? Math.round((todayCompletedTasks / todayTotalTasks) * 100) : 0,
    };
  }, [tasks, todayTasks]);

  useEffect(() => {
    // タスクの状態に応じてキャラクターの表情とメッセージを更新
    const { todayCompletedTasks, todayTotalTasks } = statistics;

    if (todayTotalTasks === 0) {
      setCharacterMood('normal');
      setCharacterMessage('新しいタスクを作成してみましょう！');
    } else if (todayCompletedTasks === todayTotalTasks) {
      setCharacterMood('happy');
      setCharacterMessage('今日のタスクを全て完了しました！素晴らしいです！');
    } else if (todayCompletedTasks / todayTotalTasks >= 0.7) {
      setCharacterMood('happy');
      setCharacterMessage('順調に進んでいますね！');
    } else if (todayCompletedTasks / todayTotalTasks >= 0.3) {
      setCharacterMood('normal');
      setCharacterMessage('頑張って続けましょう！');
    } else {
      setCharacterMood('sad');
      setCharacterMessage('少しずつ進めていきましょう。');
    }
  }, [statistics]);

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

  return (
    <AppLayout variant="home">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {/* 上段：タスク & カレンダー */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <TaskListHome
            tasks={todayTasks}
            onAddTask={() => router.push('/tasks')}
            onEditTask={(task) => router.push(`/tasks?id=${task.id}`)}
            onCompleteTask={handleCompleteTask}
            onViewAll={() => router.push('/tasks')}
          />
          <Calendar 
            tasks={tasks}
            onDateSelect={(date) => {
              // 日付クリック時の処理（将来的に実装）
              console.log('Selected date:', date);
            }}
          />
        </div>

        {/* 中段：キャラクター吹き出し */}
        <div className="mb-6">
          <div className="block md:hidden">
            <Character mood={characterMood} message={characterMessage} layout="vertical" />
          </div>
          <div className="hidden md:block">
            <Character mood={characterMood} message={characterMessage} layout="horizontal" />
          </div>
        </div>

        {/* 下段：統計・傾向・アラート */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ActivityStats tasks={tasks} />
          <DayOfWeekChart tasks={tasks} />
          <AlertBox tasks={tasks} />
        </div>

        {/* アーカイブアクセス（ログインユーザーのみ） */}
        {!isGuest && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  完了タスクアーカイブ
                </h3>
                <p className="text-sm text-gray-600">
                  完了したタスクの履歴を確認できます
                </p>
              </div>
              <button
                onClick={() => router.push('/archive')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {FaArchive({ className: "w-4 h-4" })}
                <span>履歴を見る</span>
              </button>
            </div>
          </div>
        )}
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
    </AppLayout>
  );
}