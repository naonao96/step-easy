import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getEmotionTimePeriod, toJSTDateString } from '@/lib/timeUtils';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 今日の日付を取得（日本時間, 安全なJST日付文字列）
    const today = toJSTDateString(new Date());

    // 今日の感情記録を取得
    const { data: todayEmotions, error: fetchError } = await supabase
      .from('emotions')
      .select('id, emotion_type, time_period, intensity, note, created_at')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00+09:00`)
      .lt('created_at', `${today}T23:59:59+09:00`)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('感情記録取得エラー:', fetchError);
      return NextResponse.json({ error: 'データベースエラー' }, { status: 500 });
    }

    // 時間帯ごとの記録状況を整理
    const recordStatus = {
      morning: todayEmotions?.find(e => e.time_period === 'morning') || null,
      afternoon: todayEmotions?.find(e => e.time_period === 'afternoon') || null,
      evening: todayEmotions?.find(e => e.time_period === 'evening') || null
    };

    // 現在の時間帯を判定（共通関数を使用）
    const currentTimePeriod = getEmotionTimePeriod();

    // 開発環境でのみデバッグログを出力
    if (process.env.NODE_ENV === 'development') {
      console.log('今日の感情記録取得 - 時間帯判定デバッグ:', {
        utcTime: new Date().toISOString(),
        jstToday: today,
        currentTimePeriod: currentTimePeriod,
        recordCount: todayEmotions?.length || 0,
        recordStatus: recordStatus
      });
    }

    // 開発環境でのみログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log('今日の感情記録取得完了:', {
        userId: user.id,
        recordCount: todayEmotions?.length || 0,
        currentTimePeriod,
        recordStatus
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        todayEmotions,
        recordStatus,
        currentTimePeriod,
        isComplete: Object.values(recordStatus).every(record => record !== null)
      }
    });

  } catch (error) {
    console.error('今日の感情記録取得APIエラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
} 