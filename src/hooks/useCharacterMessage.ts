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
  "アカウント登録、おめでとうございます🎉今日からは、あなたの\"ちいさな一歩\"を全力応援します！"
];

// キャラ個性・季節イベント・パーツ分割テンプレート
const CHARACTER_PERSONALITIES = [
  'のんびり屋',
  '応援好き',
  '独り言多め',
  '間が長い',
  'おせっかい',
  '励まし上手',
  'ちょっと天然',
  'ツンデレ',
  'おしゃべり',
  'マイペース',
];

// 季節・天気・イベントパーツ
const SEASONAL_EVENT_PARTS = [
  { condition: (date: Date) => date.getMonth() === 0, text: '新年のスタート、一緒にがんばろう！' },
  { condition: (date: Date) => date.getMonth() === 2, text: '春の訪れ、気分も新たに！' },
  { condition: (date: Date) => date.getMonth() === 5, text: '梅雨の季節、無理せずいこう☔️' },
  { condition: (date: Date) => date.getMonth() === 6, text: '夏本番、体調に気をつけてね🌻' },
  { condition: (date: Date) => date.getMonth() === 8, text: '秋の気配、落ち着いて進もう🍁' },
  { condition: (date: Date) => date.getMonth() === 11, text: '年末、1年おつかれさま！' },
];

// 呼びかけパーツ
const GREETING_PARTS = [
  (userName: string) => `おはよう、${userName}！`,
  (userName: string) => `こんにちは、${userName}！`,
  (userName: string) => `今日もよろしくね、${userName}`,
  (userName: string) => `お疲れさま、${userName}！`,
];

// メインメッセージパーツ
const MAIN_PARTS = [
  '昨日よりちょっとだけ前進できたかな？',
  '小さな一歩も、積み重ねれば大きな成果だよ。',
  'たまには休むのも大事だよ。',
  '自分のペースで大丈夫。',
  '今日も一緒にがんばろう！',
  '失敗しても大丈夫、また明日があるよ。',
  '最近どう？無理しすぎてない？',
  '継続は力なり、だね。',
  'どんな日も、君の味方だよ。',
  '昨日の自分にちょっとだけ勝てたらOK！',
];

// 締めパーツ
const CLOSING_PARTS = [
  '今日も応援してるよ🐦',
  'またあとでね！',
  '深呼吸してリラックスしよう。',
  '水分補給も忘れずにね。',
  '無理せずいこう！',
  'いい一日になりますように。',
  '君ならできるよ！',
  'ファイト！',
];

// 50文字以上の自然なバリエーション生成
function createTemplateMessage({ userName, personality, date }: { userName: string, personality: string, date: Date }) {
  // 季節・イベントパーツ抽出
  const seasonal = SEASONAL_EVENT_PARTS.find(p => p.condition(date));
  // ランダム選択
  const greeting = GREETING_PARTS[Math.floor(Math.random() * GREETING_PARTS.length)](userName);
  const main = MAIN_PARTS[Math.floor(Math.random() * MAIN_PARTS.length)];
  const closing = CLOSING_PARTS[Math.floor(Math.random() * CLOSING_PARTS.length)];
  // キャラ個性を文頭や文中に混ぜる
  const personalityPhrase = `（${personality}の小鳥より）`;
  // 季節パーツは時々混ぜる
  const seasonalText = seasonal && Math.random() < 0.5 ? seasonal.text + ' ' : '';
  // 50文字以上になるよう調整
  let message = `${greeting} ${seasonalText}${main} ${closing} ${personalityPhrase}`;
  if (message.length < 50) {
    message += ' 今日も一歩ずつ進もうね。';
  }
  return message;
}

// テンプレートベースに蓄積データを織り込んだメッセージ生成
function createEnhancedTemplateMessage({ userName, personality, date, taskData }: { userName: string, personality: string, date: Date, taskData: { hasTasks: boolean, completionRate: number, completedCount: number, totalCount: number, isToday: boolean } }) {
  const personalityPhrase = `（${personality}の小鳥より）`;
  const seasonalText = SEASONAL_EVENT_PARTS.find(p => p.condition(date))?.text + ' ';

  // 基本テンプレート
  let message = `${GREETING_PARTS[Math.floor(Math.random() * GREETING_PARTS.length)](userName)} ${seasonalText}${MAIN_PARTS[Math.floor(Math.random() * MAIN_PARTS.length)]} ${CLOSING_PARTS[Math.floor(Math.random() * CLOSING_PARTS.length)]} ${personalityPhrase}`;

  // 小鳥の性格に応じたタスク状況の表現
  if (taskData.hasTasks) {
    const taskComment = getTaskCommentByPersonality(personality, taskData);
    message += ` ${taskComment}`;
  } else {
    const noTaskComment = getNoTaskCommentByPersonality(personality, taskData.isToday);
    message += ` ${noTaskComment}`;
  }

  if (message.length < 50) {
    message += ' 今日も一歩ずつ進もうね。';
  }
  return message;
}

// 小鳥の性格に応じたタスク状況コメント
function getTaskCommentByPersonality(personality: string, taskData: { completionRate: number, completedCount: number, totalCount: number, isToday: boolean }): string {
  const timePrefix = taskData.isToday ? '今日も' : '昨日は';
  
  switch (personality) {
    case '励まし上手':
      if (taskData.completionRate >= 100) {
        return `${timePrefix}完璧に頑張ってますね！素晴らしいです♪`;
      } else if (taskData.completionRate >= 80) {
        return `${timePrefix}とても順調に進んでますね。あと少しで目標達成です！`;
      } else if (taskData.completionRate >= 50) {
        return `${timePrefix}半分以上完了していて素晴らしいです。この調子で頑張りましょう！`;
      } else if (taskData.completionRate >= 20) {
        return `${timePrefix}良いスタートを切れていますね。一歩ずつ着実に進んでいきましょう！`;
      } else {
        return `${timePrefix}第一歩を踏み出せましたね。小さな一歩も大きな成果につながりますよ♪`;
      }
    
    case 'のんびり屋':
      if (taskData.completionRate >= 100) {
        return `${timePrefix}ゆっくりでも着実に進められてますね。素晴らしいです♪`;
      } else if (taskData.completionRate >= 80) {
        return `${timePrefix}マイペースで進んでいて、とても良い感じですね。`;
      } else if (taskData.completionRate >= 50) {
        return `${timePrefix}無理せず進められてますね。そのペースで大丈夫ですよ。`;
      } else if (taskData.completionRate >= 20) {
        return `${timePrefix}少しずつでも前進されてますね。焦らずいきましょう♪`;
      } else {
        return `${timePrefix}ゆっくり始められてますね。時には休むのも大切ですよ。`;
      }
    
    case 'おせっかい':
      if (taskData.completionRate >= 100) {
        return `${timePrefix}本当によく頑張りましたね！でも無理しすぎてない？水分補給も忘れずにね♪`;
      } else if (taskData.completionRate >= 80) {
        return `${timePrefix}順調に進んでますね！でも休憩も大切ですよ。肩の力を抜いて♪`;
      } else if (taskData.completionRate >= 50) {
        return `${timePrefix}まずまずの進捗ですね。でも無理しないで、自分のペースで大丈夫ですよ。`;
      } else if (taskData.completionRate >= 20) {
        return `${timePrefix}少しずつでも進んでますね。疲れたら休んで、また明日頑張りましょう♪`;
      } else {
        return `${timePrefix}何か始められてますね。でも無理しすぎないで、ゆっくりいきましょう。`;
      }
    
    case 'ツンデレ':
      if (taskData.completionRate >= 100) {
        return `${timePrefix}完璧にできてるじゃない。まあ、まあまあかな...`;
      } else if (taskData.completionRate >= 80) {
        return `${timePrefix}結構頑張ってるじゃない。でも、まだまだだよ？`;
      } else if (taskData.completionRate >= 50) {
        return `${timePrefix}半分くらいはできてるじゃない。もう少し頑張りなさいよ。`;
      } else if (taskData.completionRate >= 20) {
        return `${timePrefix}少しはできてるじゃない。でも、もっとできるでしょ？`;
      } else {
        return `${timePrefix}何か始められてるじゃない。まあ、最初の一歩は大切だよね...`;
      }
    
    case 'おしゃべり':
      if (taskData.completionRate >= 100) {
        return `${timePrefix}すごいすごい！完璧にできてるじゃない！本当に素晴らしいです♪ 見てて感動しちゃった！`;
      } else if (taskData.completionRate >= 80) {
        return `${timePrefix}とても順調に進んでますね！あと少しで目標達成ですよ♪ 頑張って頑張って！`;
      } else if (taskData.completionRate >= 50) {
        return `${timePrefix}半分以上できてますね！この調子で最後まで頑張りましょう♪ 応援してますよ！`;
      } else if (taskData.completionRate >= 20) {
        return `${timePrefix}良いスタートを切れていますね！一歩ずつ着実に進んでいきましょう♪ 一緒に頑張ろうね！`;
      } else {
        return `${timePrefix}何か始められてますね！小さな一歩も大きな成果につながりますよ♪ ファイト！`;
      }
    
    default: // その他の性格
      if (taskData.completionRate >= 100) {
        return `${timePrefix}素晴らしい進歩ですね♪`;
      } else if (taskData.completionRate >= 80) {
        return `${timePrefix}とても順調に進んでいますね。`;
      } else if (taskData.completionRate >= 50) {
        return `${timePrefix}着実に進歩されていますね。`;
      } else if (taskData.completionRate >= 20) {
        return `${timePrefix}少しずつでも前進されていますね。`;
      } else {
        return `${timePrefix}何かを始めることができましたね。`;
      }
  }
}

// 小鳥の性格に応じたタスクなしコメント
function getNoTaskCommentByPersonality(personality: string, isToday: boolean): string {
  const timePrefix = isToday ? '今日は' : '昨日は';
  
  switch (personality) {
    case '励まし上手':
      return `${timePrefix}ゆっくり過ごす日ですね。新しい習慣を追加して、小さな一歩から始めてみませんか？`;
    
    case 'のんびり屋':
      return `${timePrefix}ゆっくり過ごす日ですね。時には休むのも大切ですよ♪`;
    
    case 'おせっかい':
      return `${timePrefix}タスクがない日ですね。でも、無理に何かしようとしなくても大丈夫ですよ。休むのも立派な選択です♪`;
    
    case 'ツンデレ':
      return `${timePrefix}何もない日じゃない。まあ、休むのも大切だよね...`;
    
    case 'おしゃべり':
      return `${timePrefix}タスクがない日ですね！でも、それも大切な時間ですよ♪ ゆっくり過ごして、また明日頑張りましょうね！`;
    
    default:
      return `${timePrefix}ゆっくり過ごす日でしたね。`;
  }
}

// Supabaseクライアント
const supabase = createClientComponentClient();

// 新規登録判定
const isNewRegistration = async (user: any): Promise<boolean> => {
  if (!user?.id) return false;
  
  // created_atを直接Supabaseから取得
    let created_at = user.created_at;
    if (!created_at) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('created_at')
          .eq('id', user.id)
          .single();
        created_at = userData?.created_at;
      } catch (error) {
        console.warn('Failed to fetch created_at from database:', error);
      return false;
      }
    }
    
    if (created_at) {
      const registrationTime = new Date(created_at);
      const jstRegistrationTime = new Date(registrationTime.getTime() + (9 * 60 * 60 * 1000));
      const nextDay9AM = new Date(jstRegistrationTime);
    nextDay9AM.setDate(jstRegistrationTime.getDate() + 1);
    nextDay9AM.setUTCHours(0, 0, 0, 0);
      
      const now = new Date();
    const jstNow = now;
    
    return jstNow < nextDay9AM;
  }
  
  return false;
};

// ローカルメッセージ生成（統合版）
const generateLocalMessage = (
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

  // テンプレートベースに蓄積データを織り込む
  return generateEnhancedTemplateMessage(userName, tasks, selectedDate);
};

// テンプレートベースに蓄積データを織り込んだメッセージ生成
const generateEnhancedTemplateMessage = (
  userName?: string,
  tasks?: Task[],
  selectedDate?: Date
): string => {
  const personality = CHARACTER_PERSONALITIES[Math.floor(Math.random() * CHARACTER_PERSONALITIES.length)];
  const date = selectedDate || new Date();
  const displayName = userName || 'あなた';
  
  // 蓄積データの取得
  const taskData = getTaskData(tasks, selectedDate);
  
  return createEnhancedTemplateMessage({
    userName: displayName,
    personality,
    date,
    taskData,
  });
};

// タスクデータの取得
const getTaskData = (tasks?: Task[], selectedDate?: Date) => {
  if (!tasks || tasks.length === 0) {
    return { hasTasks: false, completionRate: 0, completedCount: 0, totalCount: 0, isToday: false };
  }

  // 選択された日付のタスクをフィルタリング
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = selectedDate ? new Date(selectedDate) : today;
  targetDate.setHours(0, 0, 0, 0);
  const isToday = targetDate.getTime() === today.getTime();

  const targetTasks = tasks.filter(task => {
    if (!task.due_date) return isToday;
    
    const taskDate = new Date(task.due_date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === targetDate.getTime();
  });

  const completedTasks = targetTasks.filter(task => task.status === 'done');
  const totalTasks = targetTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return {
    hasTasks: totalTasks > 0,
    completionRate,
    completedCount: completedTasks.length,
    totalCount: totalTasks,
    isToday,
  };
};

// 新規登録メッセージ取得
const getRegistrationMessage = (user: any): string => {
  const messageIndex = (user?.id?.charCodeAt(0) || 0) % REGISTRATION_MESSAGES.length;
  return REGISTRATION_MESSAGES[messageIndex];
};

// シンプルなメッセージ生成
const generateMessage = async (
  userType: 'guest' | 'free' | 'premium',
  userName?: string,
  tasks?: Task[],
  selectedDate?: Date,
  user?: any
): Promise<string> => {
  // 1. 新規登録判定
  if (user && user.id) { // user.idが存在するかどうかで判定
    const isNew = await isNewRegistration(user);
    if (isNew) {
      return getRegistrationMessage(user);
    }
  }
  
  // 2. ローカル生成メッセージ（統合版）
  return generateLocalMessage(userType, userName, tasks, selectedDate);
};

export const useCharacterMessage = ({ userType, userName, tasks, statistics, selectedDate }: CharacterMessageHookProps) => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // AuthContextから認証状態を取得
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // メッセージ生成
  const generateNewMessage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newMessage = await generateMessage(userType, userName, tasks, selectedDate, user);
      setMessage(newMessage);
      console.log('✅ Message generated:', newMessage);
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
  }, [userType, userName, tasks, selectedDate, user]);

  // 初期化（一度だけ実行）
  useEffect(() => {
    if (authLoading) return;
    generateNewMessage();
  }, [authLoading]);

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      if (userType === 'guest') return;
      
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !session) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, userType]);

  return { 
    message, 
    isLoading: isLoading || authLoading,
    error,
    generateNewMessage // 新しいメッセージ生成関数を公開
  };
}; 