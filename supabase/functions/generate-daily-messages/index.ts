// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3'

// Deno型定義
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Task型定義
interface Task {
  id: string;
  status: 'todo' | 'doing' | 'done';
  start_date?: string;
  created_at: string;
  completed_at?: string;
  due_date?: string;
  [key: string]: any;
}

// 新しい習慣関連の型定義
interface Habit {
  id: string;
  user_id: string;
  title: string;
  habit_status: string;
  frequency: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
  [key: string]: any;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}

// デバッグログ関数
function debugLog(message: string, data?: any) {
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development' || 
                       Deno.env.get('NODE_ENV') === 'development' ||
                       Deno.env.get('APP_ENV') === 'development';
  
  if (isDevelopment) {
    console.log(`[DEV] ${message}`, data || '');
  } else {
    console.log(`[PROD] ${message}`, data || '');
  }
}

// 既存のプロンプトとロジックを再利用
const MESSAGE_LIMITS = {
  target: 200,
  max: 300,
  database: 350   // データベース制限（安全上限）
};

// 既存のスマートトリム関数
function smartTrim(text: string, targetLength: number): string {
  if (text.length <= targetLength) return text;
  
  const searchStart = Math.max(0, targetLength - 20);
  const searchEnd = Math.min(text.length, targetLength + 20);
  
  const naturalBreaks = ['。', '！', '？', '♪', '\n'];
  const secondaryBreaks = ['、', ')', '）', '...', '…'];
  
  for (let i = searchEnd; i >= searchStart; i--) {
    if (naturalBreaks.includes(text[i])) {
      return text.substring(0, i + 1);
    }
  }
  
  for (let i = searchEnd; i >= searchStart; i--) {
    if (secondaryBreaks.includes(text[i])) {
      return text.substring(0, i + 1);
    }
  }
  
  return text.substring(0, targetLength - 3) + '...';
}



// 既存のリトライ付き生成関数
async function generateWithRetry(model: any, prompt: string, targetLength: number, maxLength: number): Promise<string> {
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`Generating message attempt ${attempt}/${maxRetries}`);
      
      const result = await model.generateContent(prompt);
      const generatedText = result.response.text().trim();
      
      // 文字数制限の適用
      if (generatedText.length <= maxLength) {
        debugLog(`Message generated successfully: ${generatedText.length} chars`);
        return generatedText;
      } else {
        const trimmedText = smartTrim(generatedText, targetLength);
        debugLog(`Message trimmed: ${trimmedText.length} chars`);
        return trimmedText;
      }
    } catch (error) {
      lastError = error;
      debugLog(`Generation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // 指数バックオフで待機
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to generate message after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

// 正確な習慣継続日数計算関数（streakUtils.tsのロジックを移植）
function calculateHabitStreak(completions: HabitCompletion[], isCompletedToday: boolean = false): number {
  if (completions.length === 0) {
    return 0;
  }

  // 日付順でソート（完了順序は無視）
  const sortedCompletions = completions
    .sort((a, b) => new Date(a.completed_date).getTime() - new Date(b.completed_date).getTime());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1); // 昨日から開始（今日は含めない）
  
  // 昨日から過去に向かって連続性をチェック
  for (let i = sortedCompletions.length - 1; i >= 0; i--) {
    const completionDate = new Date(sortedCompletions[i].completed_date);
    
    // 連続しているかチェック
    const diffTime = Math.abs(currentDate.getTime() - completionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      currentDate = completionDate;
    } else {
      break; // 連続が途切れたら終了
    }
  }

  return streak;
}

// JST現在時刻を取得
function getJapanTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

// 任意の日時をJSTのYYYY-MM-DD文字列に変換
function toJSTDateString(date: Date | string): string {
  const base = typeof date === 'string' ? new Date(date) : date;
  const jst = new Date(base.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  return jst.toISOString().split('T')[0];
}

// 前日データを取得する関数（既存のタスクベース計算 + 新しい習慣計算）
function getYesterdayData(tasks: Task[], habits: Habit[], habitCompletions: HabitCompletion[], emotions: any[]) {
  const jstNow = getJapanTime();
  const yesterday = new Date(jstNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // 前日のタスク統計（既存の計算を維持）
  const yesterdayTasks = tasks?.filter((t: Task) => {
    const matchStartDate = t.start_date === yesterdayStr;
    const matchCreatedAt = t.created_at ? toJSTDateString(t.created_at) === yesterdayStr : false;
    return matchStartDate || matchCreatedAt;
  }) || [];
  
  const yesterdayCompleted = yesterdayTasks.filter((t: Task) => t.status === 'done').length;
  const yesterdayTotal = yesterdayTasks.length;
  const yesterdayPercentage = yesterdayTotal > 0 ? Math.round((yesterdayCompleted / yesterdayTotal) * 100) : 0;
  
  // 前日の感情データ（朝昼晩）
  const yesterdayEmotions = emotions?.filter((e: any) => {
    const emotionDate = new Date(e.created_at);
    const jstEmotionDate = new Date(emotionDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const emotionDateStr = jstEmotionDate.toISOString().split('T')[0];
    return emotionDateStr === yesterdayStr;
  }) || [];
  const morningEmotion = yesterdayEmotions.find((e: any) => e.time_period === 'morning')?.emotion_type || 'none';
  const afternoonEmotion = yesterdayEmotions.find((e: any) => e.time_period === 'afternoon')?.emotion_type || 'none';
  const eveningEmotion = yesterdayEmotions.find((e: any) => e.time_period === 'evening')?.emotion_type || 'none';
  
  // 感情分析（データベースの感情タイプに統一）
  const getEmotionAnalysis = (emotion: string) => {
    switch(emotion) {
      case 'joy': return '達成感';
      case 'calm': return 'リラックス';
      case 'fear': return '緊張';
      case 'sadness': return '落ち込み';
      case 'anger': return 'イライラ';
      case 'surprise': return '挫折感';
      default: return '記録なし';
    }
  };

  // 新しい習慣継続情報の計算（正確な計算）
  let habitStreak = 0;
  let maxStreak = 0;
  let habitCompletionRate = 0;
  
  try {
    if (habits && habits.length > 0 && habitCompletions && habitCompletions.length > 0) {
      // 各習慣の継続日数を計算
      const habitStreaks = habits.map(habit => {
        const habitCompletionsForHabit = habitCompletions.filter(c => c.habit_id === habit.id);
        const currentStreak = calculateHabitStreak(habitCompletionsForHabit, false);
        return { habit, currentStreak, longestStreak: habit.longest_streak || 0 };
      });
      
      // 全体の継続日数と最長記録を計算
      habitStreak = habitStreaks.length > 0 ? 
        Math.round(habitStreaks.reduce((sum, h) => sum + h.currentStreak, 0) / habitStreaks.length) : 0;
      maxStreak = habitStreaks.length > 0 ? 
        Math.max(...habitStreaks.map(h => h.longestStreak)) : 0;
      
      // 習慣完了率の計算（直近7日間）
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentCompletions = habitCompletions.filter(c => 
        new Date(c.completed_date) >= sevenDaysAgo
      );
      const totalPossibleCompletions = habits.length * 7; // 7日間 × 習慣数
      habitCompletionRate = totalPossibleCompletions > 0 ? 
        Math.round((recentCompletions.length / totalPossibleCompletions) * 100) : 0;
      
      debugLog('習慣継続情報計算完了', { habitStreak, maxStreak, habitCompletionRate, habitsCount: habits.length });
    }
  } catch (error) {
    debugLog('習慣継続情報計算エラー', error);
    // エラーが発生した場合は既存の計算にフォールバック
    habitStreak = 0;
    maxStreak = 0;
    habitCompletionRate = 0;
  }
  
  return {
    yesterdayStats: {
      percentage: yesterdayPercentage,
      completed: yesterdayCompleted,
      total: yesterdayTotal
    },
    overallStats: {
      percentage: Math.round((tasks?.filter((t: Task) => t.status === 'done').length || 0) / (tasks?.length || 1) * 100)
    },
    habitStreak,
    habitCompletionRate,
    maxStreak,
    morningEmotion,
    afternoonEmotion,
    eveningEmotion,
    morningEmotionAnalysis: getEmotionAnalysis(morningEmotion),
    afternoonEmotionAnalysis: getEmotionAnalysis(afternoonEmotion),
    eveningEmotionAnalysis: getEmotionAnalysis(eveningEmotion)
  };
}

// 統合されたメッセージ生成関数（朝9時向け）
async function generateMessage(genAI: GoogleGenerativeAI, userName?: string, tasks?: Task[], habits?: Habit[], habitCompletions?: HabitCompletion[], statistics?: any, promptTrends: string = '', emotions?: any[], characterName?: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // 表示用の日付もJST基準に統一
  const jstForDisplay = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const today = jstForDisplay.toLocaleDateString('ja-JP', {
    weekday: 'long',
    month: 'long', 
    day: 'numeric'
  });

  // 前日データを取得
  const yesterdayData = getYesterdayData(tasks || [], habits || [], habitCompletions || [], emotions || []);
  const userGreeting = userName ? `${userName}さん` : 'ユーザーさん';
  const birdName = characterName || 'ぼく';
  
  // 朝9時向けの新しいプロンプト
  const prompt = `
あなたは優しく寄り添う感情・タスク・習慣を記録するアプリの
のんびり小鳥のキャラクター「${birdName}」です。
今日は${today}です。朝9時のメッセージです。

${userName ? `ユーザーの名前は「${userName}」さんです。` : ''}

【前日までのデータ分析】
📊 タスク達成状況：
- 前日の達成率: ${yesterdayData.yesterdayStats.percentage}%
- 前日の完了タスク: ${yesterdayData.yesterdayStats.completed}個
- 全体の完了率: ${yesterdayData.overallStats.percentage}%

🔥 習慣継続状況：
- 現在の連続日数: ${yesterdayData.habitStreak}日
- 習慣の完了率: ${yesterdayData.habitCompletionRate}%
- 最長記録: ${yesterdayData.maxStreak}日

😊 前日の感情パターン：
- 朝: ${yesterdayData.morningEmotionAnalysis}
- 昼: ${yesterdayData.afternoonEmotionAnalysis}
- 夜: ${yesterdayData.eveningEmotionAnalysis}
${promptTrends}

# 🎯 メッセージ生成ルール

以下のルールに従って、**200文字以内**の「親しみ・共感・励まし」に満ちたメッセージを生成してください。

---

## 1. 🌿 語り口とキャラ性

- 「やさしく、すこし眠たげ」な口調で語ります。
- 小鳥らしい比喩や語尾、軽い独り言を時々交えても◎
- 押しつけがましくならず、あたたかく寄り添う表現を心がけましょう。

---

## 2. ☀️ 昨日の実績や感情への共感

- データは「単なる報告」ではなく、「寄り添い・共感・応援」の気持ちで語ります。
- タスク・習慣うち **ひとつに絞って** 共感し、やさしく褒めてください。
- 前日の感情パターンは「描写」に変換して活用します  
  （例：「夜は少し疲れてたんだねぇ」など）。

---

## 3. 🌱 今日へのささやかな提案（ひとつだけ）

- 「これをやってみよう」と **ひとつだけ** 具体的に提案してください。
- 習慣継続状況ベース・タスク達成状況ベースどちらでもOKですが、選択肢ではなく「ひと声の導き」に。
- 命令ではなく、「〜してみるのはどうかなぁ」といった自然な提案を。

---

## 4. 🕊️ 季節感・曜日・生活との接続

- 曜日・季節・天気などの要素を、さりげなくメッセージに取り入れてください。
- 例：「水曜日はちょっと疲れやすいかも」「暑い日の朝は、ゆっくり動き出すのもいいかなぁ」など。

---

## 5. 💬 最後は安心を届ける一言で締める

- メッセージの締めには、「見守っている」気持ちを伝えるひとことを添えてください。
- 例：「ぼくはそばにいるよ」「無理しないでね」「いつでも応援してるよ🕊️」など。

---

## 🎨 補足

- 固有名詞（ユーザー名・キャラ名・曜日など）は可能な範囲で自然に組み込んでください。
- 感情データが欠けている場合は、一般的な文脈で補完してOKです。
- 曜日ごとの傾向（例：月曜＝気持ち切り替え、水曜＝中だるみ）を活かすと自然さが増します。
- **適度に絵文字を使い、読みやすく親しみやすい文にしてください。**
`;

  // デバッグ: プロンプトをログに出力
  debugLog('Generated prompt:', prompt);

  return await generateWithRetry(model, prompt, MESSAGE_LIMITS.target, MESSAGE_LIMITS.max);
}

serve(async (_req: any) => {
  try {
    // 環境変数チェック（SUPABASE_プレフィックスを削除）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!; // SUPABASE_プレフィックスを削除
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Supabase初期化（サービスロールキー使用）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // 日本時間での日付取得（統一処理）
    const getJSTDateString = (): string => {
      const now = new Date();
      const jstOffset = 9 * 60; // 日本時間は UTC+9
      const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
      return jstTime.toISOString().split('T')[0];
    };
    const today = getJSTDateString();
    console.log(`Starting daily message generation for ${today} (JST)`);

    // 全ユーザーの取得（認証済みユーザーのみ）
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    let successCount = 0;
    let errorCount = 0;

    // 各ユーザーのメッセージ生成
    for (const user of users.users) {
      try {
        // 既にメッセージが生成済みかチェック
        const { data: existingMessage } = await supabase
          .from('daily_messages')
          .select('id')
          .eq('user_id', user.id)
          .eq('message_date', today)
          .eq('scheduled_type', 'morning')
          .single();

        if (existingMessage) {
          console.log(`Message already exists for user ${user.id}`);
          continue;
        }

        // ユーザー設定とタスクデータ取得
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // ユーザー情報からキャラクター名を取得
        const { data: userData } = await supabase
          .from('users')
          .select('character_name')
          .eq('id', user.id)
          .single();

        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // ユーザータイプ判定
        const userType = userSettings?.plan_type || 'free';
        const userName = userSettings?.display_name || user.user_metadata?.display_name;
        const characterName = userData?.character_name || '小鳥';

        let message = '';
        let statistics = null;

        // 感情記録データ取得（直近7日分）
        const { data: emotions } = await supabase
          .from('emotions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // 習慣データ取得
        const { data: habits } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id);

        // 習慣完了データ取得（全期間）
        const { data: habitCompletions } = await supabase
          .from('habit_completions')
          .select('*')
          .in('habit_id', habits?.map(h => h.id) || []);

        // 感情集計（直近3日間のポジティブ/ネガティブ頻度・連続日数）
        let positiveCount = 0, negativeCount = 0, lastEmotion = null, positiveStreak = 0, negativeStreak = 0, currentStreak = 0;
        let streakType = null;
        if (emotions && emotions.length > 0) {
          // 日付降順で並べ替え（created_atから日付を抽出）
          const sorted = [...emotions].sort((a, b) => {
            const dateA = new Date(a.created_at).toISOString().split('T')[0];
            const dateB = new Date(b.created_at).toISOString().split('T')[0];
            return dateB.localeCompare(dateA);
          });
          for (const e of sorted.slice(0, 3)) {
            if (['joy', 'calm'].includes(e.emotion_type)) positiveCount++;
            if (['sadness', 'anger', 'fear'].includes(e.emotion_type)) negativeCount++;
          }
          // 連続日数計算
          for (const e of sorted) {
            const isPositive = ['joy', 'calm'].includes(e.emotion_type);
            if (lastEmotion === null) {
              streakType = isPositive ? 'positive' : 'negative';
              currentStreak = 1;
            } else if ((isPositive && streakType === 'positive') || (!isPositive && streakType === 'negative')) {
              currentStreak++;
            } else {
              break;
            }
            lastEmotion = e.emotion_type;
          }
          if (streakType === 'positive') positiveStreak = currentStreak;
          if (streakType === 'negative') negativeStreak = currentStreak;
        }

        // 傾向・変化・成長・弱点の要約
        let trendSummary = '';
        if (positiveStreak >= 3) trendSummary += `ポジティブな感情が${positiveStreak}日連続で記録されています。`;
        if (negativeStreak >= 3) trendSummary += `ネガティブな感情が${negativeStreak}日連続で記録されています。`;
        if (positiveCount > negativeCount) trendSummary += '最近はポジティブな感情が多い傾向です。';
        if (negativeCount > positiveCount) trendSummary += '最近はネガティブな感情が多い傾向です。';
        if (!trendSummary) trendSummary = '感情の傾向に大きな変化はありません。';

        // 既存のstatisticsやタスク傾向も要約
        let taskTrend = '';
        if (statistics) {
          const stats = statistics as any;
          if (stats.selectedDatePercentage > stats.overallPercentage) taskTrend += '今日は全体平均より高い達成率です。';
          if (stats.selectedDatePercentage < stats.overallPercentage) taskTrend += '今日は全体平均より低い達成率です。';
          if (stats.selectedDateCompletedTasks >= 5) taskTrend += '今日だけで5件以上のタスクを完了しています。';
        } else {
          taskTrend = 'タスク達成率は安定しています。';
        }

        // 統計データの計算（全ユーザーに適用）
        const todayTasks = tasks?.filter((t: Task) => {
          const matchStartDate = t.start_date === today;
          const matchCreatedAt = t.created_at ? toJSTDateString(t.created_at) === today : false;
          return matchStartDate || matchCreatedAt;
        }) || [];
        
        const completedToday = todayTasks.filter((t: Task) => t.status === 'done').length;
        const totalToday = todayTasks.length;
        const todayPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
        
        const allCompleted = tasks?.filter((t: Task) => t.status === 'done').length || 0;
        const allTotal = tasks?.length || 0;
        const overallPercentage = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0;

        statistics = {
          selectedDateCompletedTasks: completedToday,
          selectedDateTotalTasks: totalToday,
          selectedDatePercentage: todayPercentage,
          todayPercentage,
          overallPercentage
        };

        // プロンプトに傾向・変化・成長・弱点を追加
        const promptTrends = `\n【最近の傾向・変化】\n${trendSummary}\n${taskTrend}\n`;

        // 統合されたメッセージ生成関数を呼び出す（習慣データも渡す）
        message = await generateMessage(genAI, userName, tasks || [], habits || [], habitCompletions || [], statistics, promptTrends, emotions || [], characterName);

        // メッセージ文字数の最終チェック（データベース制約に合わせる）
        const finalMessage = message.length > MESSAGE_LIMITS.database 
          ? smartTrim(message, MESSAGE_LIMITS.database - 3) 
          : message;

        console.log(`Final message length for ${userType} user: ${finalMessage.length}/${MESSAGE_LIMITS.database}`);

        // DBに保存
        const { error: insertError } = await supabase
          .from('daily_messages')
          .insert({
            user_id: user.id,
            message_date: today,
            scheduled_type: 'morning',
            user_type: userType,
            user_name: userName,
            message: finalMessage,
            stats_today_completed: statistics?.selectedDateCompletedTasks || 0,
            stats_today_total: statistics?.selectedDateTotalTasks || 0,
            stats_today_percentage: statistics?.selectedDatePercentage || 0,
            stats_overall_percentage: statistics?.overallPercentage || 0
          });

        if (insertError) {
          throw new Error(`Failed to save message: ${insertError.message}`);
        }

        successCount++;
        console.log(`Generated message for user ${user.id} (${userType})`);
        
        // レート制限対策：少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to generate message for user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Daily message generation completed: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: users.users.length,
        successCount,
        errorCount,
        date: today
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Daily message generation failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 