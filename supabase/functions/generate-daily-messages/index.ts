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

// 環境判定（SUPABASE_プレフィックスを削除）
const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development' || 
                     Deno.env.get('NODE_ENV') === 'development' ||
                     Deno.env.get('APP_ENV') === 'development';

const isProduction = Deno.env.get('ENVIRONMENT') === 'production' || 
                    Deno.env.get('NODE_ENV') === 'production' ||
                    Deno.env.get('APP_ENV') === 'production';

// デバッグログ関数
function debugLog(message: string, data?: any) {
  if (isDevelopment) {
    console.log(`[DEV] ${message}`, data || '');
  } else if (isProduction) {
    console.log(`[PROD] ${message}`, data || '');
  }
}

// 本番環境用のログ関数
function productionLog(message: string, data?: any) {
  if (isProduction) {
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

// 既存の感情分析関数
function analyzeEmotionalState(data: {
  recentCompletionRate: number;
  overallRate: number;
  overdueCount: number;
  recentCompletions: number;
  todayTasks: number;
  todayCompleted: number;
}) {
  const { recentCompletionRate, overallRate, overdueCount, recentCompletions, todayTasks, todayCompleted } = data;
  
  // ストレスレベルの判定
  let stressLevel = 'low';
  if (overdueCount > 3 || (todayTasks > 0 && todayCompleted / todayTasks < 0.3)) {
    stressLevel = 'high';
  } else if (overdueCount > 1 || (todayTasks > 0 && todayCompleted / todayTasks < 0.6)) {
    stressLevel = 'medium';
  }
  
  // モチベーションの判定
  let motivation = 'high';
  if (recentCompletionRate < 30 || overallRate < 40) {
    motivation = 'low';
  } else if (recentCompletionRate < 60 || overallRate < 60) {
    motivation = 'medium';
  }
  
  // 進捗状況の判定
  let progress = 'good';
  if (recentCompletions < 2) {
    progress = 'slow';
  } else if (recentCompletions > 5) {
    progress = 'excellent';
  }
  
  // 継続性の判定
  let consistency = 'stable';
  if (recentCompletionRate > 80 && overallRate > 70) {
    consistency = 'improving';
  } else if (recentCompletionRate < 40) {
    consistency = 'declining';
  }
  
  return {
    stressLevel,
    motivation,
    progress,
    consistency,
    needsEncouragement: motivation === 'low' || stressLevel === 'high',
    needsRest: stressLevel === 'high' && recentCompletions > 3
  };
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

// 前日データを取得する関数
function getYesterdayData(tasks: Task[], emotions: any[]) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // 前日のタスク統計
  const yesterdayTasks = tasks?.filter((t: Task) => 
    t.start_date === yesterdayStr || (t.created_at && t.created_at.startsWith(yesterdayStr))
  ) || [];
  
  const yesterdayCompleted = yesterdayTasks.filter((t: Task) => t.status === 'done').length;
  const yesterdayTotal = yesterdayTasks.length;
  const yesterdayPercentage = yesterdayTotal > 0 ? Math.round((yesterdayCompleted / yesterdayTotal) * 100) : 0;
  
  // 前日の感情データ（朝昼晩）
  const yesterdayEmotions = emotions?.filter((e: any) => e.date === yesterdayStr) || [];
  const morningEmotion = yesterdayEmotions.find((e: any) => e.time_period === 'morning')?.emotion_type || 'none';
  const afternoonEmotion = yesterdayEmotions.find((e: any) => e.time_period === 'afternoon')?.emotion_type || 'none';
  const eveningEmotion = yesterdayEmotions.find((e: any) => e.time_period === 'evening')?.emotion_type || 'none';
  
  // 感情分析
  const getEmotionAnalysis = (emotion: string) => {
    switch(emotion) {
      case 'happy': return 'やる気満々';
      case 'satisfied': return '達成感';
      case 'relaxed': return 'リラックス';
      case 'tired': return '疲れ気味';
      case 'anxious': return '緊張';
      case 'sad': return '落ち込み';
      case 'angry': return 'イライラ';
      default: return '記録なし';
    }
  };
  
  // 習慣継続性（直近7日間の完了率）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentTasks = tasks?.filter((t: Task) => 
    t.created_at && new Date(t.created_at) >= sevenDaysAgo
  ) || [];
  
  const completedInWeek = recentTasks.filter((t: Task) => t.status === 'done').length;
  const totalInWeek = recentTasks.length;
  const habitCompletionRate = totalInWeek > 0 ? Math.round((completedInWeek / totalInWeek) * 100) : 0;
  
  // 連続日数計算（簡易版）
  let habitStreak = 0;
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (let i = 1; i <= 30; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    const dayTasks = tasks?.filter((t: Task) => 
      t.start_date === checkDateStr || (t.created_at && t.created_at.startsWith(checkDateStr))
    ) || [];
    
    const dayCompleted = dayTasks.filter((t: Task) => t.status === 'done').length;
    
    if (dayCompleted > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      if (habitStreak === 0) habitStreak = currentStreak;
      currentStreak = 0;
    }
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
async function generateMessage(genAI: GoogleGenerativeAI, userName?: string, tasks?: Task[], statistics?: any, promptTrends: string = '', emotions?: any[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const today = new Date().toLocaleDateString('ja-JP', {
    weekday: 'long',
    month: 'long', 
    day: 'numeric'
  });

  // 前日データを取得
  const yesterdayData = getYesterdayData(tasks || [], emotions || []);

  // 時間帯と曜日の取得
  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'morning';
    if (hour >= 11 && hour < 15) return 'afternoon';
    if (hour >= 16 && hour < 20) return 'evening';
    return 'night';
  };

  const getDayOfWeek = (): string => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date().getDay()];
  };

  const timeGreeting = getTimeBasedGreeting();
  const dayOfWeek = getDayOfWeek();
  
  const userGreeting = userName ? `${userName}さん` : 'ユーザーさん';
  
  // 朝9時向けの新しいプロンプト
  const prompt = `
あなたは優しく寄り添うタスク管理アプリのキャラクターです。
今日は${today}です。朝9時のメッセージです。

${userName ? `ユーザーの名前は「${userName}」です。` : ''}

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
- 朝: ${yesterdayData.morningEmotion} → ${yesterdayData.morningEmotionAnalysis}
- 昼: ${yesterdayData.afternoonEmotion} → ${yesterdayData.afternoonEmotionAnalysis}
- 夜: ${yesterdayData.eveningEmotion} → ${yesterdayData.eveningEmotionAnalysis}

【メッセージ生成条件】
- 必ず200文字以内
- 絵文字を適度に使用（親しみやすく）
- 前日までの実績を褒める
- 今日への具体的なアドバイス
- やさしく応援する口調
- 曜日や季節を考慮

例：
「おはようございます！${userGreeting} 🌅 昨日は${yesterdayData.yesterdayStats.percentage}%の達成率、素晴らしいですね！習慣も${yesterdayData.habitStreak}日連続で継続中です ✨ 今日もその調子で、小さなタスクから始めてみませんか？応援しています 💪」

${promptTrends}
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

        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // ユーザータイプ判定
        const userType = userSettings?.plan_type || 'free';
        const userName = userSettings?.display_name || user.user_metadata?.display_name;

        let message = '';
        let statistics = null;

        // 感情記録データ取得（直近7日分）
        const { data: emotions } = await supabase
          .from('emotions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        // 感情集計（直近3日間のポジティブ/ネガティブ頻度・連続日数）
        let positiveCount = 0, negativeCount = 0, lastEmotion = null, positiveStreak = 0, negativeStreak = 0, currentStreak = 0;
        let streakType = null;
        if (emotions && emotions.length > 0) {
          // 日付降順で並べ替え
          const sorted = [...emotions].sort((a, b) => b.date.localeCompare(a.date));
          for (const e of sorted.slice(0, 3)) {
            if (['happy', 'satisfied', 'relaxed'].includes(e.emotion_type)) positiveCount++;
            if (['sad', 'angry', 'tired', 'anxious'].includes(e.emotion_type)) negativeCount++;
          }
          // 連続日数計算
          for (const e of sorted) {
            const isPositive = ['happy', 'satisfied', 'relaxed'].includes(e.emotion_type);
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
        const todayTasks = tasks?.filter((t: Task) => 
          t.start_date === today || (t.created_at && t.created_at.startsWith(today))
        ) || [];
        
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

        // 統合されたメッセージ生成関数を呼び出す（感情データも渡す）
        message = await generateMessage(genAI, userName, tasks || [], statistics, promptTrends, emotions || []);

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