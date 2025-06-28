import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// 簡易版のメッセージ生成関数
async function generateDailyMessagesLocally(
  supabaseUrl: string, 
  supabaseAnonKey: string, 
  serviceRoleKey: string, 
  geminiApiKey: string
) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  console.log('Starting local daily message generation...');
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('Service Role Key:', serviceRoleKey ? 'Set' : 'Not set');
  console.log('Gemini API Key:', geminiApiKey ? 'Set' : 'Not set');
  
  // Supabaseクライアント（Service Role使用、または通常キーでフォールバック）
  const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // 日本時間での日付取得（統一処理）
  const getJSTDateString = (): string => {
    const now = new Date();
    const jstOffset = 9 * 60; // 日本時間は UTC+9
    const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
    return jstTime.toISOString().split('T')[0];
  };

  const today = getJSTDateString();
  console.log(`Starting local daily message generation for ${today} (JST)`);

  // 全ユーザーの取得（簡易版）
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Failed to fetch users:', usersError);
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }

  console.log(`Found ${users.users.length} users`);

  let successCount = 0;
  let errorCount = 0;

  // 各ユーザーのメッセージ生成（全ユーザー対象）
  for (const user of users.users) { // 全ユーザーにメッセージ配信
    try {
      console.log(`Processing user: ${user.id}`);
      
      // 既存メッセージチェック
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

      // ユーザーのタスクデータを取得
      const { data: userTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // 最新10件

      // ユーザー設定を取得
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Public.usersテーブルからdisplay_nameを取得
      const { data: userData } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single();

      // ユーザー名の取得（Public.usersを最優先）
      const userName = userData?.display_name || 
                     user.user_metadata?.display_name || 
                     user.user_metadata?.name || 
                     'ユーザー';

      // ユーザー名取得の詳細ログ
      console.log('=== ユーザー名取得デバッグ ===');
      console.log('Public.users.display_name:', userData?.display_name);
      console.log('Auth.user.user_metadata.display_name:', user.user_metadata?.display_name);
      console.log('Auth.user.user_metadata.name:', user.user_metadata?.name);
      console.log('最終的なuserName:', userName);

      // 昨日の日付を計算
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      // 基本的なタスク分析
      const recentTasks = userTasks?.slice(-5) || [];
      const completedCount = recentTasks.filter(t => t.status === 'done').length;
      const totalCount = recentTasks.length;
      const recentCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      
      // 昨日のタスク状況（日本時間で比較）
      const yesterdayTasks = userTasks?.filter(t => {
        if (!t.due_date) return false;
        const taskDate = new Date(t.due_date).toISOString().split('T')[0];
        return taskDate === yesterdayDate; // 昨日の日付と比較
      }) || [];
      
      const yesterdayCompleted = yesterdayTasks.filter(t => t.status === 'done').length;
      const yesterdayTotal = yesterdayTasks.length;

      // プロンプトデータの詳細ログ
      console.log('=== プロンプトデータデバッグ ===');
      console.log('userName:', userName);
      console.log('recentCompletionRate:', recentCompletionRate);
      console.log('totalCount:', totalCount);
      console.log('completedCount:', completedCount);
      console.log('yesterdayTotal:', yesterdayTotal);
      console.log('yesterdayCompleted:', yesterdayCompleted);
      console.log('yesterdayDate:', yesterdayDate);

      // パーソナライズされたプロンプト（昨日のデータ使用）
      const prompt = `
あなたは優しいタスク管理アプリのキャラクターです。
${userName}さんに向けて、今日一日のモチベーションを上げるメッセージを100文字以内で生成してください。

ユーザーの状況：
- お名前: ${userName}さん
- 最近のタスク完了率: ${recentCompletionRate}%（${totalCount}個中${completedCount}個完了）
- 昨日のタスク: ${yesterdayTotal}個中${yesterdayCompleted}個完了
- タスク管理状況: ${totalCount > 0 ? '積極的に取り組んでいる' : '新しく始めた'}

【重要】以下の条件でメッセージを生成してください：
- 最近のタスク完了率が低い場合は、励ますトーンを強めてください
- 昨日のタスク数が0のときは、「昨日は休息も大事だったね」と伝えるようにしてください
- 親しみやすく、優しい口調で、絵文字は使わずに書いてください
- ${userName}さんの頑張りを認めて、今日への励ましを込めてください
- プレッシャーを与えず、寄り添うような内容でお願いします
- 鳥風なしゃべり口調でお願いします
`;

      // プロンプト全体のログ
      console.log('=== 生成されたプロンプト ===');
      console.log(prompt);

      console.log(`Generating personalized message for user: ${userName}`);
      console.log(`User stats: ${recentCompletionRate}% completion rate, ${yesterdayTotal} tasks yesterday`);
      
      const result = await model.generateContent(prompt);
      const message = result.response.text().trim();
      console.log(`Generated message: ${message}`);

      // DBに保存
      const { error: insertError } = await supabase
        .from('daily_messages')
        .insert({
          user_id: user.id,
          message_date: today,
          scheduled_type: 'morning',
          user_type: 'free',
          user_name: userName,
          message,
          stats_today_completed: 0,
          stats_today_total: 0,
          stats_today_percentage: 0,
          stats_overall_percentage: 0
        });

      if (insertError) {
        console.error('Failed to save message:', insertError);
        throw new Error(`Failed to save message: ${insertError.message}`);
      }

      successCount++;
      console.log(`Generated message for user ${user.id}: ${message}`);
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Failed to generate message for user ${user.id}:`, error);
      errorCount++;
    }
  }

  console.log(`Daily message generation completed: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount, processed: users.users.length };
}

export async function POST(req: NextRequest) {
  try {
    // 権限チェック（Vercel Cron Jobsからの呼び出しのみ許可）
    const authHeader = headers().get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Daily message generation triggered');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    if (!geminiApiKey) {
      console.error('Missing Gemini API key');
      return NextResponse.json(
        { error: 'Missing Gemini API key' },
        { status: 500 }
      );
    }

    console.log('All required environment variables are set');

    const result = await generateDailyMessagesLocally(
      supabaseUrl,
      supabaseAnonKey,
      serviceRoleKey || '',
      geminiApiKey
    );

    // 日本時間での日付取得（統一処理）
    const getJSTDateString = (): string => {
      const now = new Date();
      const jstOffset = 9 * 60;
      const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000));
      return jstTime.toISOString().split('T')[0];
    };

    return NextResponse.json({
      success: true,
      ...result,
      date: getJSTDateString() // 日本時間での日付
    });

  } catch (error) {
    console.error('Daily message generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 