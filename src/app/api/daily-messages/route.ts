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

    // クエリパラメータから日付を取得（YYYY-MM-DD 前提）
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('date');

    if (!targetDate) {
      return NextResponse.json({ error: '日付パラメータが必要です' }, { status: 400 });
    }

    // セーフガード：不正日付のときはJSTの今日に丸める
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(targetDate);
    const safeTargetDate = isValid ? targetDate : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })).toISOString().split('T')[0];

    // daily_messagesからメッセージを取得
    const { data: dailyMessage, error } = await supabase
      .from('daily_messages')
      .select('message')
      .eq('user_id', user.id)
      .eq('message_date', safeTargetDate)
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