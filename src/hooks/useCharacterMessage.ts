import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task } from '@/stores/taskStore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  selectedDate?: Date; // 選択された日付を追加
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

// フォールバックメッセージ（DB取得失敗時）
const FALLBACK_MESSAGES = {
  free: [
    '今日も一緒に頑張りましょう！',
    '新しい一日の始まりです。小さな一歩から始めてみませんか？',
    'あなたのペースで大丈夫です。一つずつ進んでいきましょう。',
    '今日はどんなタスクに挑戦しますか？',
    '一歩ずつ、着実に進んでいきましょう。',
  ],
  premium: [
    'プレミアムメンバーとして、あなたの成功を全力でサポートします！',
    'あなたの目標達成を心から応援しています。',
    'プレミアム機能を活用して、効率的にタスクを進めましょう。',
    '今日も素晴らしい一日になりそうですね。一緒に頑張りましょう！',
    'あなたの継続的な努力が実を結んでいます。今日も前進しましょう。',
  ]
};

// 統一されたフォールバックメッセージ生成関数
const generateUnifiedFallbackMessage = (
  userType: 'guest' | 'free' | 'premium',
  userName?: string,
  tasks?: Task[],
  statistics?: any,
  selectedDate?: Date
): string => {
  // ゲストユーザーの場合
  if (userType === 'guest') {
    const randomIndex = Math.floor(Math.random() * GUEST_MESSAGES.length);
    return GUEST_MESSAGES[randomIndex];
  }

  // 選択された日付が今日かどうか
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = selectedDate ? 
    selectedDate.getTime() === today.getTime() : true;

  // タスク統計の計算
  const regularTasks = tasks?.filter(t => !t.is_habit) || [];
  const habitTasks = tasks?.filter(t => t.is_habit) || [];
  const completedCount = regularTasks.filter(t => t.status === 'done').length + 
                        habitTasks.filter(t => t.status === 'done').length;
  const totalCount = regularTasks.length + habitTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ユーザー名の処理
  const greeting = userName ? `${userName}さん、` : '';

  // 統一されたメッセージ生成ロジック
  if (totalCount === 0) {
    return isToday ? 
      `${greeting}新しい一日の始まりですね！今日はどんなことにチャレンジしますか？` : 
      `${greeting}この日はお休みの日だったようですね。`;
  }

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
  } else if (completedCount > 0) {
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
  
  // AuthContextと同じSupabaseクライアントを使用
  const supabase = createClientComponentClient();

  // メッセージ取得関数
  const fetchMessage = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // ゲストユーザーの場合は統一されたフォールバックメッセージ
      if (userType === 'guest') {
        const fallbackMessage = generateUnifiedFallbackMessage(userType, userName, tasks, statistics, selectedDate);
        setMessage(fallbackMessage);
        return;
      }

      // 認証状態を確認
      const { data: user, error: authError } = await supabase.auth.getUser();
      
      // 日付の準備（認証エラー処理の前に移動）
      const today = new Date().toISOString().split('T')[0];
      const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : today;
      const queryDate = selectedDateStr === today ? today : today; // 常に今日の日付を使用
      
      if (authError || !user.user) {
        // セッションリフレッシュを試行
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session && !refreshError) {
            // セッションが復旧したら再試行
            const { data: retryUser } = await supabase.auth.getUser();
            if (retryUser.user) {
              // ここでデータベースクエリを再実行
              const { data: dailyMessage, error: dbError } = await supabase
                .from('daily_messages')
                .select('*')
                .eq('user_id', retryUser.user.id)
                .eq('message_date', queryDate)
                .eq('scheduled_type', 'morning')
                .single();
              
              if (dailyMessage && dailyMessage.message) {
                setMessage(dailyMessage.message);
                return;
              }
            }
          }
        } catch (refreshError) {
          console.warn('Session refresh failed:', refreshError);
        }
        
        // 認証エラー時は統一されたフォールバック処理
        const fallbackMessage = generateUnifiedFallbackMessage(userType, userName, tasks, statistics, selectedDate);
        setMessage(fallbackMessage);
        return;
      }

      // キャッシュ制御を追加
      const { data: dailyMessage, error: dbError } = await supabase
        .from('daily_messages')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('message_date', queryDate) // 常に今日の日付で検索
        .eq('scheduled_type', 'morning')
        .single();

      if (dbError) {
        // メッセージが見つからない場合は既存のAPI呼び出しにフォールバック
        if (dbError.code === 'PGRST116') { // No rows found
          return await fallbackToApiGeneration(userType, userName, tasks, statistics);
        }
        // その他のDBエラーも同様にフォールバックする
        console.warn('Database error, falling back to API generation:', dbError.message);
        return await fallbackToApiGeneration(userType, userName, tasks, statistics);
      }

      if (dailyMessage && dailyMessage.message) {
        setMessage(dailyMessage.message);
      } else {
        throw new Error('Empty message received from database');
      }

    } catch (err) {
      console.error('Daily message fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // エラー時の統一フォールバック
      const fallbackMessage = generateUnifiedFallbackMessage(userType, userName, tasks, statistics, selectedDate);
      setMessage(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userType, userName, tasks, statistics, selectedDate, isLoading, supabase]);

  // 既存のAPI呼び出しにフォールバック（DB取得失敗時）
  const fallbackToApiGeneration = async (userType: string, userName?: string, tasks?: Task[], statistics?: any) => {
    try {
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMessage(data.message);

    } catch (apiError) {
      console.error('API fallback also failed:', apiError);
      
      // 最終フォールバック：統一処理
      const fallbackMessage = generateUnifiedFallbackMessage(userType as 'guest' | 'free' | 'premium', userName, tasks, statistics, selectedDate);
      setMessage(fallbackMessage);
    }
  };

  useEffect(() => {
    // 初回メッセージ取得
    fetchMessage();

    // ゲストユーザーまたは認証されていない場合は定期的な再取得は不要
    if (userType === 'guest') {
      return;
    }

    // 認証状態を確認してから設定
    const checkAuthAndSetup = async () => {
      try {
        const { data: user, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user.user) {
          return;
        }

        // 定期的な再取得（5分ごと）
        const interval = setInterval(() => {
          fetchMessage();
        }, 5 * 60 * 1000); // 5分

        // リアルタイム監視の設定
        let subscription: any = null;
        
        try {
          const { data: user } = await supabase.auth.getUser();
          
          if (user.user) {
            subscription = supabase
              .channel('daily_messages_changes')
              .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'daily_messages',
                filter: `user_id=eq.${user.user.id}`
              }, (payload) => {
                fetchMessage(); // 新しいメッセージが追加されたら再取得
              })
              .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'daily_messages',
                filter: `user_id=eq.${user.user.id}`
              }, (payload) => {
                fetchMessage(); // メッセージが更新されたら再取得
              })
              .subscribe();
          }
        } catch (subscriptionError) {
          console.warn('Failed to setup realtime subscription:', subscriptionError);
        }

        return () => {
          clearInterval(interval);
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error in checkAuthAndSetup:', error);
      }
    };

    checkAuthAndSetup();
  }, [userType]); // 依存関係を最小限に

  return { message, isLoading, error };
}; 