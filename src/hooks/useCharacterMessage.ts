import { useState, useEffect } from 'react';
import { Task } from '@/stores/taskStore';
import { createClient } from '@/lib/supabase';

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
          // ゲストユーザー: ランダムメッセージ（変更なし）
          const randomIndex = Math.floor(Math.random() * GUEST_MESSAGES.length);
          setMessage(GUEST_MESSAGES[randomIndex]);
          return;
        }

        console.log('Fetching daily message from database for:', userType, userName);

        // Supabaseから今日のメッセージを取得
        const supabase = createClient();
        const { data: user, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user.user) {
          console.warn('User not authenticated, falling back to static messages:', authError?.message);
          // 認証エラー時は静的メッセージにフォールバック
          const fallbackMessages = FALLBACK_MESSAGES[userType as 'free' | 'premium'] || FALLBACK_MESSAGES.free;
          const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
          let fallbackMessage = fallbackMessages[randomIndex];
          
          if (userName) {
            fallbackMessage = `${userName}さん、${fallbackMessage}`;
          }
          
          setMessage(fallbackMessage);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        const { data: dailyMessage, error: dbError } = await supabase
          .from('daily_messages')
          .select('*')
          .eq('user_id', user.user.id)
          .eq('message_date', today)
          .eq('scheduled_type', 'morning')
          .single();

        if (dbError) {
          // メッセージが見つからない場合は既存のAPI呼び出しにフォールバック
          if (dbError.code === 'PGRST116') { // No rows found
            console.log('No daily message found, falling back to API generation');
            return await fallbackToApiGeneration(userType, userName, tasks, statistics);
          }
          throw dbError;
        }

        if (dailyMessage && dailyMessage.message) {
          setMessage(dailyMessage.message);
          console.log('Successfully fetched daily message from database');
        } else {
          throw new Error('Empty message received from database');
        }

      } catch (err) {
        console.error('Daily message fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // エラー時のフォールバック
        const fallbackMessages = FALLBACK_MESSAGES[userType as 'free' | 'premium'] || FALLBACK_MESSAGES.free;
        const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
        let fallbackMessage = fallbackMessages[randomIndex];
        
        if (userName) {
          fallbackMessage = `${userName}さん、${fallbackMessage}`;
        }
        
        setMessage(fallbackMessage);
      } finally {
        setIsLoading(false);
      }
    };

    // 既存のAPI呼び出しにフォールバック（DB取得失敗時）
    const fallbackToApiGeneration = async (userType: string, userName?: string, tasks?: Task[], statistics?: any) => {
      try {
        console.log('Attempting API fallback generation');
        
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
        console.log('Successfully generated message via API fallback');

      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
        
        // 最終フォールバック
        const fallbackMessages = FALLBACK_MESSAGES[userType as 'free' | 'premium'] || FALLBACK_MESSAGES.free;
        const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
        let fallbackMessage = fallbackMessages[randomIndex];
        
        if (userName) {
          fallbackMessage = `${userName}さん、${fallbackMessage}`;
        }
        
        setMessage(fallbackMessage);
      }
    };

    fetchMessage();
  }, [userType, userName]); // 依存配列を簡素化（DBから取得するため）

  return { message, isLoading, error };
}; 