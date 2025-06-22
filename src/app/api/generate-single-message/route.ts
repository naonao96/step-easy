import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userType, userName } = await req.json();
    
    // 環境変数チェック
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Gemini APIで簡単なメッセージ生成
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const today = new Date().toLocaleDateString('ja-JP', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });

    const userGreeting = userName ? `${userName}さん、` : '';
    
    const prompt = userType === 'premium' ? 
      `あなたは優しいタスク管理アプリのキャラクターです。
今日は${today}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

プレミアムユーザー向けの特別なメッセージを200文字以内で生成してください：
- ${userName ? `「${userName}さん」という呼びかけを含める` : ''}
- 今日の天気や季節感を含める
- プレミアム特典への感謝も込める
- タスク管理へのモチベーションを上げる内容
- 絵文字は使わない
- 優しく親しみやすい口調

例：「${userGreeting}今日は清々しい朝ですね！プレミアムメンバーとして、あなたの目標達成を全力でサポートします。今日も一つずつタスクを完了していき、素晴らしい一日にしましょう。」` :
      
      `あなたは優しいタスク管理アプリのキャラクターです。
今日は${today}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

フリーユーザー向けのメッセージを100文字以内で生成してください：
- ${userName ? `「${userName}さん」という呼びかけを含める` : ''}
- 今日の天気や季節感を含める
- タスク管理へのモチベーションを上げる内容
- 絵文字は使わない
- 優しく親しみやすい口調

例：「${userGreeting}今日は晴れて気持ちの良い一日ですね！新しいタスクにチャレンジするのにぴったりです。一歩ずつゆっくりと進んでいきましょう。」`;

    const result = await model.generateContent(prompt);
    let message = result.response.text().trim();
    
    // データベース制限に合わせて文字数をチェック（350文字上限）
    if (message.length > 350) {
      console.log(`Message too long (${message.length} chars), trimming to 347 chars...`);
      message = message.substring(0, 347) + '...';
    }

    // 認証ユーザーの場合、DBにも保存を試行
    let savedToDb = false;
    try {
      const supabase = createClient();
      const { data: user, error: authError } = await supabase.auth.getUser();
      
      if (!authError && user.user) {
        const today = new Date().toISOString().split('T')[0];
        
        const { error: insertError } = await supabase
          .from('daily_messages')
          .insert({
            user_id: user.user.id,
            message_date: today,
            scheduled_type: 'morning',
            user_type: userType,
            user_name: userName,
            message,
            stats_today_completed: 0,
            stats_today_total: 0,
            stats_today_percentage: 0,
            stats_overall_percentage: 0
          });
          
        if (!insertError) {
          savedToDb = true;
        }
      }
    } catch (dbError) {
      console.log('Could not save to database, but message generated successfully');
    }

    return NextResponse.json({
      success: true,
      message,
      savedToDb,
      userType,
      userName: userName || 'ユーザー',
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Message generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 