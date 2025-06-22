import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 簡易版のメッセージ生成関数
async function generateDailyMessagesLocally(
  supabaseUrl: string, 
  supabaseAnonKey: string, 
  serviceRoleKey: string, 
  geminiApiKey: string
) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  // Supabaseクライアント（Service Role使用、または通常キーでフォールバック）
  const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const today = new Date().toISOString().split('T')[0];
  console.log(`Starting local daily message generation for ${today}`);

  // 全ユーザーの取得（簡易版）
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }

  let successCount = 0;
  let errorCount = 0;

  // 各ユーザーのメッセージ生成（簡易版）
  for (const user of users.users.slice(0, 5)) { // 最初の5ユーザーのみテスト
    try {
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

      // シンプルなメッセージ生成
      const userName = user.user_metadata?.name || 'ユーザー';
      const prompt = `
あなたは優しいタスク管理アプリのキャラクターです。
${userName}さんに向けて、今日一日のモチベーションを上げる短いメッセージを100文字以内で生成してください。
親しみやすく、優しい口調で、絵文字は使わずに書いてください。
`;

      const result = await model.generateContent(prompt);
      const message = result.response.text().trim().substring(0, 100);

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

  return {
    success: true,
    processed: Math.min(users.users.length, 5),
    successCount,
    errorCount,
    date: today,
    mode: 'fallback'
  };
}

export async function POST(req: NextRequest) {
  try {
    // 開発環境とローカル環境でのみ実行可能にする
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_MANUAL_TRIGGER) {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    console.log('Manual trigger for daily message generation requested');

    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // 開発環境では最低限の設定のみチェック
    if (!supabaseUrl || !geminiApiKey) {
      return NextResponse.json(
        { 
          error: 'Missing required configuration',
          details: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            hasServiceKey: !!serviceRoleKey,
            hasGeminiKey: !!geminiApiKey
          }
        },
        { status: 500 }
      );
    }

    // Service Role Keyがない場合は警告のみ
    if (!serviceRoleKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set - using alternative approach');
    }

    // 認証チェック（簡略化 - 開発環境なので）
    console.log('Skipping authentication check for development');

    // Edge Functionを手動で呼び出し

    // Service Role Keyがない場合は、より詳細な指示とフォールバック提案
    if (!serviceRoleKey) {
      console.log('Service Role Key not found, will use fallback method');
      
      // フォールバック処理を直接実行
      try {
        const fallbackResult = await generateDailyMessagesLocally(supabaseUrl, supabaseAnonKey!, 'mock-service-key', geminiApiKey!);
        
        return NextResponse.json({
          success: true,
          message: 'Daily message generation completed (local fallback mode)',
          result: fallbackResult,
          note: 'Service Role Key not configured, used local fallback',
          instructions: [
            '1. Go to Supabase Dashboard → Settings → API',
            '2. Copy the "service_role" key (marked as secret)',
            '3. Add SUPABASE_SERVICE_ROLE_KEY=your_key to .env.local',
            '4. Restart the development server for full functionality'
          ]
        });
      } catch (fallbackError) {
        return NextResponse.json({
          success: false,
          error: 'Service Role Key required and fallback failed',
          message: 'SUPABASE_SERVICE_ROLE_KEY environment variable is required',
          fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          instructions: [
            '1. Go to Supabase Dashboard → Settings → API',
            '2. Copy the "service_role" key (marked as secret)',
            '3. Add SUPABASE_SERVICE_ROLE_KEY=your_key to .env.local',
            '4. Restart the development server'
          ]
        }, { status: 400 });
      }
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-daily-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Edge Function error:', errorData);
        
        // Edge Functionが存在しない場合、フォールバック処理に進む
        if (response.status === 404) {
          console.log('Edge Function not found, falling back to local generation...');
          throw new Error('Edge Function not deployed - using fallback');
        }
        
        throw new Error(`Edge Function failed: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      console.log('Daily message generation result:', result);

      return NextResponse.json({
        success: true,
        message: 'Daily message generation triggered successfully',
        result
      });
      
    } catch (fetchError) {
      console.error('Edge Function call failed:', fetchError);
      
      // 開発環境での代替処理：直接ここでメッセージ生成を実行
      console.log('Attempting fallback message generation...');
      
      try {
        const fallbackResult = await generateDailyMessagesLocally(supabaseUrl, supabaseAnonKey!, serviceRoleKey, geminiApiKey!);
        
        return NextResponse.json({
          success: true,
          message: 'Daily message generation completed (fallback mode)',
          result: fallbackResult,
          note: 'Used local fallback instead of Edge Function'
        });
        
      } catch (fallbackError) {
        return NextResponse.json({
          success: false,
          error: 'Both Edge Function and fallback failed',
          edgeFunctionError: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          suggestion: 'Check Supabase configuration and Gemini API key'
        }, { status: 503 });
      }
    }

  } catch (error) {
    console.error('Manual trigger failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 