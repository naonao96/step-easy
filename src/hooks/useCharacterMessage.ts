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
 * daily_messagesテーブルから今日のメッセージを取得
 */
const fetchDailyMessage = async (_userId: string): Promise<string | null> => {
  try {
    const { getJapanTimeNow, toJSTDateString } = await import('@/lib/timeUtils');
    const japanTime = getJapanTimeNow();
    const hour = japanTime.hour;
    
    // 9時未満は前日、9時以降は今日のメッセージを取得
    let targetDate = toJSTDateString(japanTime.date);
    
    if (hour < 9) {
      // 前日の日付を計算
      const yesterday = new Date(japanTime.date);
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = toJSTDateString(yesterday);
    }

    // APIエンドポイント経由でメッセージを取得
    const response = await fetch(`/api/daily-messages?date=${targetDate}`);
    
    if (!response.ok) {
      console.error('Daily message fetch error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.success || !data.message) {
      return null;
    }

    return data.message;
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
    const { getJapanTimeNow } = await import('@/lib/timeUtils');
    const registrationTime = new Date(user.created_at);
    const jstRegistrationTime = new Date(registrationTime.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
    const nextDay9AM = new Date(jstRegistrationTime);
    nextDay9AM.setDate(nextDay9AM.getDate() + 1);
    nextDay9AM.setUTCHours(0, 0, 0, 0);
    
    const jstNow = getJapanTimeNow();
    const isNewRegistration = jstNow.date < nextDay9AM;
    
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

  // 時間帯の判定（日本時間）
  const { getJapanTimeNow } = await import('@/lib/timeUtils');
  const japanTime = getJapanTimeNow();
  const hour = japanTime.hour;
  const timeOfDay = hour >= 6 && hour < 12 ? '朝' : hour >= 12 && hour < 18 ? '昼' : '晩';

  // 対象日（フォールバック時の集計対象）を決定：9時未満は前日、それ以外は当日
  const jstToday = new Date(japanTime.date);
  jstToday.setHours(0, 0, 0, 0);
  const targetBase = new Date(japanTime.date);
  if (hour < 9) targetBase.setDate(targetBase.getDate() - 1);
  targetBase.setHours(0, 0, 0, 0);

  // 表示文言のisTodayは対象日に合わせる
  const isToday = targetBase.getTime() === jstToday.getTime();

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

  // 対象日に属するかの判定（menu/page.tsx の日付選択ロジックに準拠）
  const belongsToTargetDate = (task: Task, targetDate: Date, todayMidnight: Date): boolean => {
    // 期間タスク（開始日と期限日）
    if (task.start_date && task.due_date) {
      const taskStartDate = new Date(task.start_date);
      const taskDueDate = new Date(task.due_date);
      taskStartDate.setHours(0, 0, 0, 0);
      taskDueDate.setHours(0, 0, 0, 0);

      if (targetDate.getTime() >= taskStartDate.getTime() && targetDate.getTime() <= taskDueDate.getTime()) {
        if (task.status !== 'done') return true;
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === targetDate.getTime();
        }
      }
      return false;
    }

    // 開始日のみ
    if (task.start_date && !task.due_date) {
      const taskStartDate = new Date(task.start_date);
      taskStartDate.setHours(0, 0, 0, 0);
      if (targetDate.getTime() >= taskStartDate.getTime() && task.status !== 'done') return true;
      if (task.status === 'done' && task.completed_at) {
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === targetDate.getTime();
      }
      return false;
    }

    // 期限日のみ（未来・当日を対象）
    if (!task.start_date && task.due_date) {
      const taskDueDate = new Date(task.due_date);
      taskDueDate.setHours(0, 0, 0, 0);
      if (targetDate.getTime() <= taskDueDate.getTime() && targetDate.getTime() >= todayMidnight.getTime() && task.status !== 'done') return true;
      if (task.status === 'done' && task.completed_at) {
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === targetDate.getTime();
      }
      return false;
    }

    // 開始日も期限日もない
    if (!task.start_date && !task.due_date) {
      if (task.status === 'done' && task.completed_at) {
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === targetDate.getTime();
      }
      // 未完了タスクは当日のみ（対象日が今日の場合に限る）
      if (task.status !== 'done') {
        return targetDate.getTime() === todayMidnight.getTime();
      }
    }

    return false;
  };

  // 対象日ベースでタスクを絞り込む
  const dayTasks = tasks.filter(task => belongsToTargetDate(task, targetBase, jstToday));
  const dayCompleted = dayTasks.filter(task => task.status === 'done').length;
  const dayTotal = dayTasks.length;

  // メッセージ生成（対象日タスクで集計）
  let message = greeting;

  if (isToday) {
    if (dayCompleted === 0) {
      message += `今日は${dayTotal}個のタスクだよ！最初のひとつから、一緒に始めてみよっか👍`;
    } else if (dayCompleted === dayTotal) {
      message += `すごいや！今日のタスクを全て完了しました。おつかれさま✨`;
    } else {
      const remaining = dayTotal - dayCompleted;
      message += `今日は${dayCompleted}個クリアできたね。あと${remaining}個、一緒にがんばろうね！💪`;
    }
  } else {
    if (dayCompleted === 0) {
      message += `昨日は${dayTotal}個タスクがあったみたいだけど、まだ手をつけてなかったんだね。そんな日もあるよ〜☁️`;
    } else if (dayCompleted === dayTotal) {
      message += `昨日のタスクはぜんぶ片付けてるね！僕もびっくりのがんばりだよ✨`;
    } else {
      const remaining = dayTotal - dayCompleted;
      message += `昨日は${dayCompleted}個クリアして、あと${remaining}個残ってたみたい。コツコツ進んでてえらいね🌸`;
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