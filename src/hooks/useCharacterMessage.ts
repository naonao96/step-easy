import { useState, useEffect } from 'react';
import { Task } from '@/stores/taskStore';

interface CharacterMessageHookProps {
  userType: 'guest' | 'free' | 'premium';
  userName?: string;
  tasks: Task[];
  statistics: {
    selectedDateCompletedTasks: number;
    selectedDateTotalTasks: number;
    selectedDatePercentage: number;
    todayPercentage: number;
    overallPercentage: number;
  };
}

const GUEST_MESSAGES = [
  '今日も頑張りましょう！',
  '新しいタスクを作成してみませんか？',
  '一歩ずつ進んでいきましょう♪',
  'タスク管理で生活をもっと楽に！',
  '今日はどんなことに挑戦しますか？',
  '小さな積み重ねが大きな成果に！',
  'あなたのペースで大丈夫です',
  '目標に向かって頑張りましょう',
];

export const useCharacterMessage = ({ userType, userName, tasks, statistics }: CharacterMessageHookProps) => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (userType === 'guest') {
          // ゲストユーザー: ランダムメッセージ
          const randomIndex = Math.floor(Math.random() * GUEST_MESSAGES.length);
          setMessage(GUEST_MESSAGES[randomIndex]);
          return;
        }

        // 無料・プレミアムユーザー: API呼び出し
        const response = await fetch('/api/character-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userType,
            userName: userName || null,
            tasks: userType === 'premium' ? tasks : undefined,
            statistics: userType === 'premium' ? statistics : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch character message');
        }

        const data = await response.json();
        setMessage(data.message);

      } catch (err) {
        console.error('Character message error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // エラー時のフォールバック
        if (userType === 'guest') {
          setMessage('今日も頑張りましょう！');
        } else {
          const fallbackMessage = userName ? `${userName}さん、一緒に頑張りましょう！` : '一緒に頑張りましょう！';
          setMessage(fallbackMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessage();
  }, [userType, userName, tasks.length, statistics.selectedDatePercentage, statistics.todayPercentage, statistics.overallPercentage]);

  return { message, isLoading, error };
}; 