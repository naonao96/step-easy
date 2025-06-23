import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';

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
  selectedDate?: Date;
}

// ゲストユーザー用のシンプルなメッセージ
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

/**
 * 統一されたメッセージ生成関数
 * 認証状態に関係なく、現在のタスクデータから動的にメッセージを生成
 */
const generatePersonalizedMessage = (
  userType: 'guest' | 'free' | 'premium',
  userName?: string,
  tasks?: Task[],
  selectedDate?: Date
): string => {
  // ゲストユーザーの場合はランダムメッセージ
  if (userType === 'guest') {
    const randomIndex = Math.floor(Math.random() * GUEST_MESSAGES.length);
    return GUEST_MESSAGES[randomIndex];
  }

  // 選択された日付が今日かどうか
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = selectedDate ? new Date(selectedDate) : today;
  targetDate.setHours(0, 0, 0, 0);
  const isToday = targetDate.getTime() === today.getTime();

  // 時間帯の判定
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? '朝' : hour < 18 ? '昼' : '夜';
  
  // ユーザー名の処理
  const displayName = userName || 'あなた';
  const greeting = `${timeOfDay}の時間、${displayName}さん！`;

  // タスクが存在しない場合
  if (!tasks || tasks.length === 0) {
    return isToday ? 
      `${greeting}新しい一日の始まりですね！今日はどんなことにチャレンジしますか？✨` : 
      `${greeting}この日はお休みの日だったようですね。`;
  }

  // 対象日のタスクをフィルタリング
  const targetTasks = tasks.filter(task => {
    if (!task.due_date) return isToday; // 期限なしは今日のタスクとして扱う
    
    const taskDate = new Date(task.due_date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === targetDate.getTime();
  });

  // 完了タスクの計算
  const completedTasks = targetTasks.filter(task => task.status === 'done');
  const totalTasks = targetTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // タスクがない日
  if (totalTasks === 0) {
    return isToday ? 
      `${greeting}今日はゆっくり過ごす日ですね。新しいタスクを追加して、小さな一歩から始めてみませんか？` : 
      `${greeting}この日はゆっくり過ごされた日でした。`;
  }

  // 完了率に基づいたメッセージ生成
  if (completionRate >= 100) {
    return isToday ? 
      `${greeting}🎉 完璧です！全てのタスクを完了しました。今日は本当によく頑張りましたね！` : 
      `${greeting}素晴らしい一日でした！全てのタスクを完了されていますね。`;
  } else if (completionRate >= 80) {
    return isToday ? 
      `${greeting}💪 とても順調に進んでいます！あと少しで今日の目標達成ですね。` : 
      `${greeting}とても良いペースで進められた一日でした。`;
  } else if (completionRate >= 50) {
    return isToday ? 
      `${greeting}📈 半分以上完了していて素晴らしいです。この調子で最後まで頑張りましょう！` : 
      `${greeting}まずまずの進捗でした。着実に進歩されています。`;
  } else if (completionRate >= 20) {
    return isToday ? 
      `${greeting}🚀 良いスタートを切れていますね！一歩ずつ、着実に進んでいきましょう。` : 
      `${greeting}少しずつでも前進されています。それが大切です。`;
  } else if (completedTasks.length > 0) {
    return isToday ? 
      `${greeting}✨ 第一歩を踏み出せました！小さな一歩も大きな成果につながります。` : 
      `${greeting}何かを始めることができた日でした。`;
  } else {
    return isToday ? 
      `${greeting}💡 今日はまだこれからです。最初の小さな一歩から始めてみませんか？` : 
      `${greeting}時にはチャレンジが難しい日もありますね。それも大切な経験です。`;
  }
};

export const useCharacterMessage = ({ userType, userName, tasks, statistics, selectedDate }: CharacterMessageHookProps) => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // AuthContextから認証状態を取得
  const { user, isLoading: authLoading } = useAuth();

  // メッセージ生成関数（認証不要のシンプルなアプローチ）
  const generateMessage = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // 認証状態に関係なく、現在のデータからメッセージを生成
      const personalizedMessage = generatePersonalizedMessage(
        userType,
        userName,
        tasks,
        selectedDate
      );
      
      setMessage(personalizedMessage);
      console.log('✅ Character message generated successfully');
    } catch (err) {
      console.error('Error generating character message:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // エラー時のフォールバック
      const fallbackMessage = userType === 'guest' ? 
        '今日も頑張りましょう！' : 
        '今日も一緒に頑張りましょう！';
      setMessage(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userType, userName, tasks, selectedDate]);

  // 初期化とメッセージ生成
  useEffect(() => {
    // AuthContextが初期化中の場合は待機
    if (authLoading) {
      return;
    }

    // ゲストユーザーまたは認証完了後にメッセージ生成
    if (userType === 'guest' || user) {
      generateMessage();
    }
  }, [authLoading, user, generateMessage, userType]);

  // タスクや日付が変更された際の再生成
  useEffect(() => {
    // 認証初期化が完了していて、かつ適切な条件が揃った場合のみ再生成
    if (!authLoading && (userType === 'guest' || user)) {
      generateMessage();
    }
  }, [tasks, selectedDate, generateMessage, authLoading, user, userType]);

  return { 
    message, 
    isLoading: isLoading || authLoading, // 認証ローディング状態も含める
    error 
  };
}; 