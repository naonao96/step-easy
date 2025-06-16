'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore } from '@/stores/taskStore';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import { Character } from '@/components/molecules/Character';
import { TaskList } from '@/components/molecules/TaskList';
import { FaTasks, FaChartLine, FaCog, FaSignOutAlt } from 'react-icons/fa';

export default function MenuPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { tasks, fetchTasks } = useTaskStore();
  const [characterMood, setCharacterMood] = React.useState<'happy' | 'normal' | 'sad'>('normal');
  const [characterMessage, setCharacterMessage] = React.useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/lp');
      return;
    }
    fetchTasks();
  }, [user, router, fetchTasks]);

  useEffect(() => {
    // タスクの状態に応じてキャラクターの表情とメッセージを更新
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      setCharacterMood('normal');
      setCharacterMessage('新しいタスクを作成してみましょう！');
    } else if (completedTasks === totalTasks) {
      setCharacterMood('happy');
      setCharacterMessage('すべてのタスクを完了しました！素晴らしいです！');
    } else if (completedTasks / totalTasks >= 0.7) {
      setCharacterMood('happy');
      setCharacterMessage('順調に進んでいますね！');
    } else if (completedTasks / totalTasks >= 0.3) {
      setCharacterMood('normal');
      setCharacterMessage('頑張って続けましょう！');
    } else {
      setCharacterMood('sad');
      setCharacterMessage('少しずつ進めていきましょう。');
    }
  }, [tasks]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/lp');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* キャラクター表示 */}
          <div className="md:col-span-1">
            <Character mood={characterMood} message={characterMessage} />
          </div>

          {/* メインコンテンツ */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Button
                variant="primary"
                onClick={() => router.push('/tasks')}
                className="h-32 flex flex-col items-center justify-center space-y-2"
              >
                <span className="w-8 h-8">
                  {FaTasks({ className: 'w-8 h-8' })}
                </span>
                <span>タスク管理</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => router.push('/progress')}
                className="h-32 flex flex-col items-center justify-center space-y-2"
              >
                <span className="w-8 h-8">
                  {FaChartLine({ className: 'w-8 h-8' })}
                </span>
                <span>進捗管理</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => router.push('/settings')}
                className="h-32 flex flex-col items-center justify-center space-y-2"
              >
                <span className="w-8 h-8">
                  {FaCog({ className: 'w-8 h-8' })}
                </span>
                <span>設定</span>
              </Button>

              <Button
                variant="danger"
                onClick={handleSignOut}
                className="h-32 flex flex-col items-center justify-center space-y-2"
              >
                <span className="w-8 h-8">
                  {FaSignOutAlt({ className: 'w-8 h-8' })}
                </span>
                <span>ログアウト</span>
              </Button>
            </div>
            
            {/* 最近のタスク */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">最近のタスク</h2>
              <TaskList
                tasks={tasks.slice(0, 3)}
                onEdit={(task) => router.push(`/tasks/${task.id}`)}
                onDelete={() => {}}
                onComplete={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}