import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // クエリパラメータから日付を取得
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('date');

    if (!targetDate) {
      return NextResponse.json({ error: '日付パラメータが必要です' }, { status: 400 });
    }

    // daily_messagesからメッセージを取得
    const { data: dailyMessage, error } = await supabase
      .from('daily_messages')
      .select('message')
      .eq('user_id', user.id)
      .eq('message_date', targetDate)
      .eq('scheduled_type', 'morning')
      .single();

    if (error) {
      console.error('Daily message fetch error:', error);
      return NextResponse.json({ error: 'メッセージの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: dailyMessage?.message || null 
    });

  } catch (error) {
    console.error('Daily message API error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
} 