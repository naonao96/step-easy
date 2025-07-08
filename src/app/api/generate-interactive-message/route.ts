import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { InteractiveMessage, MessageOption } from '@/types/message';

export async function POST(req: NextRequest) {
  try {
    const { context, userType = 'free', userName } = await req.json();
    
    // 環境変数チェック
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Gemini APIでインタラクティブメッセージ生成
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const today = new Date().toLocaleDateString('ja-JP', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });

    // コンテキストに応じたメッセージとオプションを生成
    const { messageText, options } = await generateInteractiveContent(
      model, 
      context, 
      userType, 
      userName, 
      today
    );

    const interactiveMessage: InteractiveMessage = {
      id: `msg_${Date.now()}`,
      text: messageText,
      options: options,
      timestamp: new Date().toISOString(),
      userType: userType as 'free' | 'premium'
    };

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
            scheduled_type: 'interactive',
            user_type: userType,
            user_name: userName,
            message: messageText,
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
      message: interactiveMessage,
      savedToDb,
      userType,
      userName: userName || 'ユーザー',
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Interactive message generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateInteractiveContent(
  model: any, 
  context: string, 
  userType: string, 
  userName?: string, 
  today?: string
): Promise<{ messageText: string; options: MessageOption[] }> {
  
  const userGreeting = userName ? `${userName}さん、` : '';
  
  // コンテキストに応じたメッセージとオプションを生成
  const prompt = `
あなたは優しいタスク管理アプリのキャラクターです。
今日は${today}です。
${userName ? `ユーザーの名前は「${userName}」です。` : ''}

コンテキスト: ${context}

以下の形式でインタラクティブメッセージを生成してください：

メッセージ: 親しみやすく、ユーザーが反応したくなるような質問や提案を含むメッセージ（100文字以内）

オプション: 以下の形式で3-4個の選択肢を提供
- 選択肢1: ポジティブな反応（例：「とても良い！」）
- 選択肢2: 中立的な反応（例：「普通です」）
- 選択肢3: アクション指向（例：「新しいタスクを追加」）
- 選択肢4: 情報要求（例：「統計を見る」）

鳥風なしゃべり口調で、絵文字は使わず、優しく親しみやすい内容にしてください。
`;

  const result = await model.generateContent(prompt);
  const response = result.response.text().trim();
  
  // レスポンスを解析してメッセージとオプションを分離
  const lines = response.split('\n');
  let messageText = '';
  const options: MessageOption[] = [];
  
  for (const line of lines) {
    if (line.startsWith('メッセージ:')) {
      messageText = line.replace('メッセージ:', '').trim();
    } else if (line.includes('選択肢')) {
      const optionText = line.replace(/選択肢\d+:\s*/, '').trim();
      if (optionText) {
        options.push({
          id: `opt_${options.length + 1}`,
          text: optionText,
          action: `action_${options.length + 1}`,
          color: options.length === 0 ? 'success' : 
                 options.length === 1 ? 'primary' : 
                 options.length === 2 ? 'secondary' : 'warning'
        });
      }
    }
  }

  // デフォルトのメッセージとオプション（AIが失敗した場合）
  if (!messageText) {
    messageText = `${userGreeting}今日の調子はどうですか？`;
  }
  
  if (options.length === 0) {
    options.push(
      { id: 'opt_1', text: 'とても良い！', action: 'feeling_great', color: 'success' },
      { id: 'opt_2', text: '普通です', action: 'feeling_normal', color: 'primary' },
      { id: 'opt_3', text: '少し疲れています', action: 'feeling_tired', color: 'warning' }
    );
  }

  return { messageText, options };
} 