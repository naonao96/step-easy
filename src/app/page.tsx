'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { tasks, fetchTasks } = useTaskStore();
  const [characterMessage, setCharacterMessage] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    // タスクの状態に応じてメッセージを更新
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      setCharacterMessage('新しいタスクを作成してみましょう！');
    } else if (completedTasks === totalTasks) {
      setCharacterMessage('すべてのタスクを完了しました！素晴らしいです！');
    } else if (completedTasks / totalTasks >= 0.7) {
      setCharacterMessage('順調に進んでいますね！');
    } else if (completedTasks / totalTasks >= 0.3) {
      setCharacterMessage('頑張って続けましょう！');
    } else {
      setCharacterMessage('少しずつ進めていきましょう。');
    }
  }, [tasks]);

  useEffect(() => {
    if (user) {
      router.push('/menu');
    } else {
      router.push('/lp');
    }
  }, [user, router]);

  return null;
}