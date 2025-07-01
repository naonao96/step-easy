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
  free: {
    target: 100,
    max: 200,
    database: 350   // データベース制限（安全上限）
  },
  premium: {
    target: 200,
    max: 300,
    database: 350   // データベース制限（安全上限）
  }
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

// 既存のフリーユーザー向けメッセージ生成（プロンプト活用）
async function generateFreeMessage(genAI: GoogleGenerativeAI, userName?: string, tasks?: Task[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const today = new Date().toLocaleDateString('ja-JP', {
    weekday: 'long',
    month: 'long', 
    day: 'numeric'
  });

  const userGreeting = userName ? `${userName}さん、` : '';
  
  // 基本的なタスク分析（無料版向け）
  const recentTasks = tasks?.slice(-5) || []; // 最新5件
  const completedCount = recentTasks.filter(t => t.status === 'done').length;
  const totalCount = recentTasks.length;
  const recentCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // 今日のタスク状況
  const todayTasks = tasks?.filter(t => {
    if (!t.due_date) return false;
    const taskDate = new Date(t.due_date).toISOString().split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    return taskDate === todayDate;
  }) || [];
  
  const todayCompleted = todayTasks.filter(t => t.status === 'done').length;
  const todayTotal = todayTasks.length;

  // パーソナライズされたプロンプト（無料版）
  const prompt = `
あなたは優しいタスク管理アプリのキャラクターです。
今日は${today}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

ユーザーの基本情報：
- 最近のタスク完了率: ${recentCompletionRate}%（最新${totalCount}個中${completedCount}個完了）
- 今日のタスク状況: ${todayTotal}個中${todayCompleted}個完了
- タスク管理の傾向: ${totalCount > 0 ? '継続的に取り組んでいる' : '新しくタスク管理を始めた'}

【重要】無料版ユーザー向けの親しみやすいメッセージを以下の条件で生成してください：
- 必ず100文字以内（絶対条件）
- 親しみやすく優しい口調
- ${userName ? `「${userName}さん」という呼びかけを自然に含める` : ''}
- 基本的な進捗状況を反映した励まし
- 今日の天気や季節感を含める
- タスク管理へのモチベーションを上げる内容
- 絵文字は使わない
- プレッシャーを与えず、優しく寄り添う内容
- 鳥風なしゃべり口調でお願いします

例（進捗に応じて）：
- 順調な場合: 「${userGreeting}今日は爽やかな朝ですね！最近とても頑張っていらっしゃいますね。この調子で今日も一歩ずつ進んでいきましょう。」
- 始めたばかりの場合: 「${userGreeting}新しい一週間の始まりですね！タスク管理を始められて素晴らしいです。小さな一歩から始めていきましょう。」
- 今日タスクがある場合: 「${userGreeting}今日は${todayTotal}個のタスクがありますね。焦らずに一つずつ取り組んでいけば大丈夫です。」
`;

  debugLog('Generating free message with prompt:', { userName, recentCompletionRate, todayTotal, todayCompleted });
  return await generateWithRetry(model, prompt, MESSAGE_LIMITS.free.target, MESSAGE_LIMITS.free.max);
}

// 既存のプレミアムユーザー向けメッセージ生成（プロンプト活用）
async function generatePremiumMessage(genAI: GoogleGenerativeAI, userName?: string, tasks?: Task[], statistics?: any): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const today = new Date().toLocaleDateString('ja-JP', {
    weekday: 'long',
    month: 'long', 
    day: 'numeric'
  });

  // 既存の高度な分析ロジックを活用
  const recentTasks = tasks?.slice(-10) || [];
  const completedCount = recentTasks.filter(t => t.status === 'done').length;
  const totalCount = recentTasks.length;
  const recentCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const recentCompletions = tasks?.filter(t => 
    t.status === 'done' && t.completed_at && new Date(t.completed_at) >= threeDaysAgo
  ) || [];
  
  const overdueCount = tasks?.filter(t => 
    t.due_date && new Date(t.due_date) < now && t.status !== 'done'
  ).length || 0;

  const emotionalState = analyzeEmotionalState({
    recentCompletionRate,
    overallRate: statistics?.overallPercentage || 0,
    overdueCount,
    recentCompletions: recentCompletions.length,
    todayTasks: statistics?.selectedDateTotalTasks || 0,
    todayCompleted: statistics?.selectedDateCompletedTasks || 0
  });

  const userGreeting = userName ? `${userName}さん、` : '';
  
  // 既存のプレミアムプロンプトを活用
  const prompt = `
あなたは優しく寄り添うタスク管理アプリのキャラクターです。
今日は${today}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

ユーザーの状況：
- 今日の達成率: ${statistics?.selectedDatePercentage || 0}%
- 今日のタスク: ${statistics?.selectedDateTotalTasks || 0}個
- 今日の完了: ${statistics?.selectedDateCompletedTasks || 0}個
- 全体の完了率: ${statistics?.overallPercentage || 0}%
- 直近のタスク完了率: ${recentCompletionRate}%
- 期限切れタスク: ${overdueCount}個
- 最近3日間の完了: ${recentCompletions.length}個

感情分析結果：
- ストレスレベル: ${emotionalState.stressLevel}
- モチベーション: ${emotionalState.motivation}
- 進捗状況: ${emotionalState.progress}
- 継続性: ${emotionalState.consistency}
- 励ましが必要: ${emotionalState.needsEncouragement ? 'はい' : 'いいえ'}
- 休息が必要: ${emotionalState.needsRest ? 'はい' : 'いいえ'}

【重要】以下の条件でパーソナライズされたメッセージを生成してください：
- 必ず200文字以内（絶対条件）
- ${userName ? `「${userName}さん」という呼びかけを自然に含める` : ''}
- 今日の達成率を主な判断基準とし、感情分析結果に基づいた詳細な心理的サポート
- ユーザーの心境に寄り添う共感的なメッセージ
- 優しく寄り添う口調
- 絵文字は使わない
- ストレスが高い場合は無理をしないよう配慮
- プレミアムユーザー向けの特別感のあるメッセージ
- 具体的なアドバイスや提案を含める

例（必ず200文字以内）：
- 高達成率時: 「${userGreeting}今日は${statistics?.selectedDatePercentage || 0}%の達成率、素晴らしい調子ですね！この勢いを大切にしつつ、適度な休憩も取ってくださいね。」
- 低達成率時: 「${userGreeting}今日はまだ${statistics?.selectedDatePercentage || 0}%の達成率ですが、焦らずに小さなタスクから始めて、達成感を味わいながら進んでみませんか？」
- 高ストレス時: 「${userGreeting}期限切れタスクでプレッシャーを感じているかもしれませんね。まずは重要なタスクから取り組みましょう。」
`;

  return await generateWithRetry(model, prompt, MESSAGE_LIMITS.premium.target, MESSAGE_LIMITS.premium.max);
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

        if (userType === 'premium') {
          // プレミアムユーザー：詳細統計付きメッセージ（日本時間で比較）
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

          message = await generatePremiumMessage(genAI, userName, tasks || [], statistics);
        } else {
          // フリーユーザー：シンプルメッセージ
          message = await generateFreeMessage(genAI, userName, tasks || []);
        }

        // メッセージ文字数の最終チェック（データベース制約に合わせる）
        const databaseLimit = MESSAGE_LIMITS[userType as 'free' | 'premium']?.database || 350;
        const finalMessage = message.length > databaseLimit 
          ? smartTrim(message, databaseLimit - 3) 
          : message;

        console.log(`Final message length for ${userType} user: ${finalMessage.length}/${databaseLimit}`);

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