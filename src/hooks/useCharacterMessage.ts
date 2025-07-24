import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
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

// アカウント登録完了時の統一メッセージ
const generateRegistrationMessage = (userName: string, characterName: string = '') => 
`おかえり、じゃなかった、はじめまして${userName}さん！

ぼくは${characterName}。
これから、あなたの「ちょっとやってみようかな」を
そっと応援する小鳥です🕊️

毎朝9時には、あなたのペースに合わせてひとこと送るよ。
うまくいく日も、いかない日も、気にしなくて大丈夫。
だって、それが"あなたのリズム"だから。

一緒に、少しずつ育てていこうね🌱`;

const supabase = createClientComponentClient();

/**
 * 日本時間での日付文字列を取得する関数
 */
const getJSTDateString = (date?: Date): string => {
  const targetDate = date ? new Date(date) : new Date();
  const jstOffset = 9 * 60;
  const jstTime = new Date(targetDate.getTime() + (jstOffset * 60 * 1000));
  return jstTime.toISOString().split('T')[0];
};

/**
 * daily_messagesテーブルから今日のメッセージを取得
 */
const fetchDailyMessage = async (userId: string): Promise<string | null> => {
  try {
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const hour = japanTime.getHours();
    
    // 常に今日のメッセージを取得（日本時間）
    const targetDate = japanTime.toISOString().split('T')[0];

    const { data: dailyMessage, error } = await supabase
      .from('daily_messages')
      .select('message')
      .eq('user_id', userId)
      .eq('message_date', targetDate)
      .eq('scheduled_type', 'morning')
      .single();

    if (error || !dailyMessage?.message) {
      return null;
    }

    return dailyMessage.message;
  } catch (error) {
    console.error('Error fetching daily message:', error);
    return null;
  }
};

/**
 * メッセージを自然な文単位で分割
 */
const splitMessageIntoParts = (message: string): string[] => {
  if (!message) return [];
  
  // 文の区切り文字で分割（句読点、感嘆符、疑問符）
  const sentences = message.split(/(?<=[。！？])\s*/).filter(s => s.trim());
  
  // 1文が長すぎる場合はさらに分割
  const parts: string[] = [];
  sentences.forEach(sentence => {
    if (sentence.length > 100) {
      // 長い文は句読点で分割
      const subParts = sentence.split(/(?<=[、，])\s*/).filter(s => s.trim());
      parts.push(...subParts);
    } else {
      parts.push(sentence);
    }
  });
  
  return parts.length > 0 ? parts : [message];
};

/**
 * 統一されたメッセージ生成関数
 */
const generatePersonalizedMessage = async (
  userType: 'guest' | 'free' | 'premium',
  userName?: string,
  tasks?: Task[],
  selectedDate?: Date,
  user?: any
): Promise<{ message: string; isNewRegistration: boolean }> => {
  // ゲストユーザーの場合はランダムメッセージ
  if (userType === 'guest') {
    const randomIndex = Math.floor(Math.random() * GUEST_MESSAGES.length);
    return { message: GUEST_MESSAGES[randomIndex], isNewRegistration: false };
  }

  // 新規登録判定（翌日9時まで）
  if (user?.id && user?.created_at) {
    const registrationTime = new Date(user.created_at);
    const jstRegistrationTime = new Date(registrationTime.getTime() + (9 * 60 * 60 * 1000));
    const nextDay9AM = new Date(jstRegistrationTime);
    nextDay9AM.setDate(nextDay9AM.getDate() + 1);
    nextDay9AM.setUTCHours(0, 0, 0, 0);
    
    const now = new Date();
    const isNewRegistration = now < nextDay9AM;
    
    if (isNewRegistration) {
      // キャラクター名を取得
      let characterName = '';
      try {
        const { data, error } = await supabase
          .from('users')
          .select('character_name')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.character_name) {
          characterName = data.character_name;
        }
      } catch (error) {
        console.error('Error fetching character name:', error);
      }
      
      const message = generateRegistrationMessage(userName || 'あなた', characterName);
      return { message, isNewRegistration: true };
    }
  }

  // 選択された日付が今日かどうか
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = selectedDate ? new Date(selectedDate) : today;
  targetDate.setHours(0, 0, 0, 0);
  const isToday = targetDate.getTime() === today.getTime();

  // 時間帯の判定（日本時間）
  const now = new Date();
  const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  const hour = japanTime.getHours();
  const timeOfDay = hour >= 6 && hour < 12 ? '朝' : hour >= 12 && hour < 18 ? '昼' : '晩';
  
  // ユーザー名の処理
  const displayName = userName || 'あなた';
  const greeting = `${timeOfDay}の時間、${displayName}さん！`;

  // タスクが存在しない場合
  if (!tasks || tasks.length === 0) {
    const message = isToday ? 
      `${greeting}今日はゆっくり過ごす日ですね。新しい習慣を追加して、小さな一歩から始めてみませんか？` : 
      `${greeting}選択した日にはタスクがありませんね。新しい習慣を追加してみませんか？`;
    return { message, isNewRegistration: false };
  }

  // 完了済みタスクの数
  const completedTasks = tasks.filter(task => task.status === 'done');
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  // メッセージ生成
  let message = greeting;

  if (isToday) {
    if (completedTasks.length === 0) {
      message += `今日は${totalTasks}個のタスクがありますね。一つずつ着実に進めていきましょう！`;
    } else if (completedTasks.length === totalTasks) {
      message += `素晴らしい！今日のタスクを全て完了しました。お疲れ様でした！`;
    } else {
      const remaining = totalTasks - completedTasks.length;
      message += `今日は${completedTasks.length}個のタスクを完了しました。あと${remaining}個頑張りましょう！`;
    }
  } else {
    if (completedTasks.length === 0) {
      message += `選択した日には${totalTasks}個のタスクがありますが、まだ完了していませんね。`;
    } else if (completedTasks.length === totalTasks) {
      message += `選択した日のタスクを全て完了しています。素晴らしい成果です！`;
    } else {
      const remaining = totalTasks - completedTasks.length;
      message += `選択した日は${completedTasks.length}個のタスクを完了し、あと${remaining}個が残っています。`;
    }
  }

  return { message, isNewRegistration: false };
};

export const useCharacterMessage = ({ userType, userName, tasks, statistics, selectedDate }: CharacterMessageHookProps) => {
  const [characterMessage, setCharacterMessage] = useState<string>('');
  const [messageParts, setMessageParts] = useState<string[]>([]);
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>('');

  // キャラクター名を取得
  useEffect(() => {
    const fetchCharacterName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('users')
          .select('character_name')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.character_name) {
          setCharacterName(data.character_name);
        }
      } catch (error) {
        console.error('Error fetching character name:', error);
      }
    };

    fetchCharacterName();
  }, []);

  // メッセージ生成と分割を一度だけ実行
  const generateMessage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let message = '';
      let isNewReg = false;

      // 認証済みユーザーの場合、daily_messagesから取得を試行
      if (userType !== 'guest') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dailyMessage = await fetchDailyMessage(user.id);
          if (dailyMessage) {
            message = dailyMessage;
          }
        }
      }

      // daily_messagesから取得できない場合は動的生成
      if (!message) {
        const { data: { user } } = await supabase.auth.getUser();
        const result = await generatePersonalizedMessage(userType, userName, tasks, selectedDate, user);
        message = result.message;
        isNewReg = result.isNewRegistration;
      }

      console.log('🔍 メッセージ生成結果:', {
        userType,
        message,
        isNewReg,
        messageLength: message.length
      });

      setCharacterMessage(message);
      setIsNewRegistration(isNewReg);
      
      // メッセージを分割
      const parts = splitMessageIntoParts(message);
      setMessageParts(parts);
      
    } catch (err) {
      console.error('Error generating character message:', err);
      setError('メッセージの生成に失敗しました');
      
      // エラー時のフォールバック
      const fallbackMessage = '今日も頑張りましょう！';
      setCharacterMessage(fallbackMessage);
      setMessageParts([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userType, userName, tasks, selectedDate]);

  // 初回のみメッセージ生成
  useEffect(() => {
    generateMessage();
  }, []); // 依存配列を空にして一度だけ実行

  return {
    characterMessage,
    messageParts,
    isNewRegistration,
    isLoading,
    error,
    refetch: generateMessage
  };
}; 