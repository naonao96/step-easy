import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

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

// アカウント登録完了時の特別メッセージ
const REGISTRATION_MESSAGES = [
  "ようこそStepEasyへ！タスク管理はもうひとりじゃありません。一緒にこっそり頑張っていきましょう。",
  "登録完了！ここからは、あなたの習慣を全力で見守る係です。サボっても怒らないので安心してくださいね。",
  "アカウント登録、おめでとうございます🎉（←心の中で鳴ってるファンファーレ）今日からは、あなたの\"ちいさな一歩\"を全力応援します！"
];

/**
 * 日本時間での日付文字列を取得する関数
 */
const getJSTDateString = (date?: Date): string => {
  const targetDate = date ? new Date(date) : new Date();
  
  // 日本時間のオフセット（+9時間）を適用
  const jstOffset = 9 * 60; // 分単位
  const jstTime = new Date(targetDate.getTime() + (jstOffset * 60 * 1000));
  
  return jstTime.toISOString().split('T')[0];
};

/**
 * daily_messagesテーブルから今日のメッセージを取得
 * 0-9時の期間は前日のメッセージを表示（CronJob実行前のフォールバック）
 */
const fetchDailyMessage = async (userId: string, selectedDate?: Date): Promise<string | null> => {
  try {
    // AuthContextと同じSupabaseクライアントを使用
    const supabase = createClientComponentClient();
    
    // 現在時刻を取得（日本時間）
    const now = new Date();
    const hour = now.getHours();
    
    // 0-9時の場合は前日のメッセージを取得
    let targetDate: string;
    if (hour >= 0 && hour < 9) {
      // 前日の日付を計算
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = getJSTDateString(yesterday);
      console.log('🕐 Early morning (0-9am): fetching yesterday\'s message for date:', targetDate);
    } else {
      // 通常は今日の日付
      targetDate = getJSTDateString();
      console.log('📅 Normal hours: fetching today\'s message for date:', targetDate);
    }

    // デバッグ情報を追加
    console.log('=== fetchDailyMessage デバッグ ===')
    console.log('User ID:', userId)
    console.log('Current hour (JST):', hour)
    console.log('Target Date:', targetDate)
    console.log('Selected Date (ignored):', selectedDate)
    console.log('Supabase client created:', !!supabase)

    const { data: dailyMessage, error } = await supabase
      .from('daily_messages')
      .select('message')
      .eq('user_id', userId)
      .eq('message_date', targetDate)
      .eq('scheduled_type', 'morning')
      .single();

    console.log('Query result:', { dailyMessage, error })

    if (error) {
      console.log(`❌ No daily message found: ${error.message}`);
      console.log(`   Error Code: ${error.code}`);
      return null;
    }

    if (dailyMessage?.message) {
      console.log('✅ Daily message fetched from database');
      return dailyMessage.message;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching daily message:', error);
    return null;
  }
};

/**
 * 統一されたメッセージ生成関数（フォールバック用）
 * 認証状態に関係なく、現在のタスクデータから動的にメッセージを生成
 */
const generatePersonalizedMessage = (
  userType: 'guest' | 'free' | 'premium',
  userName?: string,
  tasks?: Task[],
  selectedDate?: Date,
  user?: any
): string => {
  // ゲストユーザーの場合はランダムメッセージ
  if (userType === 'guest') {
    const randomIndex = Math.floor(Math.random() * GUEST_MESSAGES.length);
    return GUEST_MESSAGES[randomIndex];
  }

  // 新規登録判定（翌日9時まで）- 日本時間基準
  if (user?.created_at) {
    const registrationTime = new Date(user.created_at);
    
    // 日本時間に変換（+9時間）
    const jstRegistrationTime = new Date(registrationTime.getTime() + (9 * 60 * 60 * 1000));
    const nextDay9AM = new Date(jstRegistrationTime);
    nextDay9AM.setDate(nextDay9AM.getDate() + 1);
    nextDay9AM.setHours(9, 0, 0, 0);
    
    // 現在時刻も日本時間で比較
    const now = new Date();
    const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const isNewRegistration = jstNow < nextDay9AM;
    
    if (isNewRegistration) {
      const randomIndex = Math.floor(Math.random() * REGISTRATION_MESSAGES.length);
      return REGISTRATION_MESSAGES[randomIndex];
    }
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
  const router = useRouter();

  // メッセージ生成関数（DBを優先、フォールバック付き）
  const generateMessage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ゲストユーザーの場合は即座にフォールバック
      if (userType === 'guest' || !user) {
        const personalizedMessage = generatePersonalizedMessage(
          userType,
          userName,
          tasks,
          selectedDate,
          user
        );
        setMessage(personalizedMessage);
        console.log('✅ Guest/unauthenticated message generated');
        return;
      }

      // 認証ユーザーの場合：まずDBから取得を試行
      const dailyMessage = await fetchDailyMessage(user.id, selectedDate);
      
      if (dailyMessage) {
        setMessage(dailyMessage);
        console.log('✅ Daily message loaded from database');
        return;
      }

      // DBにメッセージがない場合のみフォールバック
      const personalizedMessage = generatePersonalizedMessage(
        userType,
        userName,
        tasks,
        selectedDate,
        user
      );
      
      setMessage(personalizedMessage);
      console.log('✅ Fallback message generated (no DB message found)');
      
    } catch (err) {
      console.error('Error generating character message:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // エラー時のフォールバック
      const fallbackMessage = userType === 'guest' ? 
        '今日も頑張りましょう！' : 
        '今日も一緒に頑張りましょう！';
      setMessage(fallbackMessage);
      console.log('⚠️ Error fallback message used');
    } finally {
      setIsLoading(false);
    }
  }, [userType, userName, tasks, selectedDate, user]);

  // 初期化とメッセージ生成
  useEffect(() => {
    // AuthContextが初期化中の場合は待機
    if (authLoading) {
      return;
    }

    // メッセージ生成実行
    generateMessage();
  }, [authLoading, generateMessage]);

  // タスクや日付が変更された際の再生成
  useEffect(() => {
    // 認証初期化が完了していて、かつ適切な条件が揃った場合のみ再生成
    if (!authLoading) {
      generateMessage();
    }
  }, [tasks, selectedDate, generateMessage, authLoading]);

  useEffect(() => {
    const checkAuth = async () => {
      // ゲストユーザーの場合は認証チェックをスキップ
      if (userType === 'guest') {
        return;
      }
      
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('=== 認証状態詳細確認 ===')
      console.log('Session exists:', !!session)
      console.log('User exists:', !!user)
      console.log('User ID:', user?.id)
      console.log('Session user ID:', session?.user?.id)
      console.log('Role:', session?.user?.role)
      
      if (!user || !session) {
        console.log('❌ 認証されていません')
        // ログイン画面にリダイレクト
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router, userType])

  useEffect(() => {
    const updateSession = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase.auth.refreshSession()
      console.log('Session refresh:', { data, error })

      if (data.session) {
        console.log('New session user ID:', data.session.user.id)
      }
    }
    
    updateSession()
  }, [])

  return { 
    message, 
    isLoading: isLoading || authLoading, // 認証ローディング状態も含める
    error 
  };
}; 