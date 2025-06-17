'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Calendar } from '@/components/molecules/Calendar';
import { Character } from '@/components/molecules/Character';
import { ActivityStats } from '@/components/molecules/ActivityStats';
import { DayOfWeekChart } from '@/components/molecules/DayOfWeekChart';
import { AlertBox } from '@/components/molecules/AlertBox';
import { TaskListHome } from '@/components/molecules/TaskListHome';

export default function MenuPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask } = useTaskStore();
  const [characterMood, setCharacterMood] = React.useState<'happy' | 'normal' | 'sad'>('normal');
  const [characterMessage, setCharacterMessage] = React.useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/lp');
      return;
    }
    fetchTasks();
  }, [user, router, fetchTasks]);

  // 今日のタスクをフィルタリング
  const todayTasks = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter(task => {
      if (task.due_date) {
        return new Date(task.due_date).toDateString() === today;
      }
      return task.status !== 'done'; // 期限がないタスクは未完了のものを表示
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
    await updateTask(id, { status: 'done', completed_at: new Date().toISOString() });
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      await deleteTask(id);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActivityStats tasks={tasks} />
          <DayOfWeekChart tasks={tasks} />
          <AlertBox tasks={tasks} />
        </div>
      </div>
    </AppLayout>
  );
}