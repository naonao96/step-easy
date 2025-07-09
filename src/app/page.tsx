'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function HomePage() {
  const router = useRouter();
  const { tasks, fetchTasks } = useTaskStore();
  const [characterMood, setCharacterMood] = useState<'happy' | 'normal' | 'sad'>('normal');
  const [characterMessage, setCharacterMessage] = useState<string>('');
  const { user } = useAuth();

  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    isFeedbackOpen,
    feedbackType,
    completeOnboarding,
    skipOnboarding,
    submitFeedback,
    shouldShowOnboarding,
    setIsFeedbackOpen
  } = useOnboarding(user?.id || '');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  useEffect(() => {
    if (user) {
      router.push('/menu');
    } else {
      router.push('/lp');
    }
  }, [user, router]);

  // オンボーディングはuseOnboardingフック内で自動制御される

  return (
    <div>
      {/* 既存のコンテンツ */}
      {/* オンボーディングフロー */}
      <OnboardingFlow
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />

      {/* フィードバックモーダル */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={(data) => submitFeedback({ ...data, type: feedbackType })}
        type={feedbackType}
      />
    </div>
  );
}