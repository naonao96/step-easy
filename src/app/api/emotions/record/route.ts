import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getEmotionTimePeriod, getJapanTime } from '@/lib/timeUtils';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { emotion_type } = await request.json();

    // バリデーション
    if (!emotion_type) {
      return NextResponse.json({ error: '感情タイプは必須です' }, { status: 400 });
    }

    const validEmotions = ['joy', 'sadness', 'anger', 'surprise', 'fear', 'calm'];

    if (!validEmotions.includes(emotion_type)) {
      return NextResponse.json({ error: '無効な感情タイプです' }, { status: 400 });
    }

    // 現在の時間帯をサーバー側で判定（共通関数を使用）
    const time_period = getEmotionTimePeriod();
    const japanTime = getJapanTime();

    // 開発環境でのみデバッグログを出力
    if (process.env.NODE_ENV === 'development') {
      console.log('感情記録 - 時間帯判定デバッグ:', {
        utcTime: new Date().toISOString(),
        japanTime: japanTime.toISOString(),
        hour: japanTime.getHours(),
        timePeriod: time_period
      });
    }

    // 今日の日付を取得（日本時間）
    const today = japanTime.toISOString().split('T')[0];

    // 既存の記録をチェック
    const { data: existingRecord, error: checkError } = await supabase
      .from('emotions')
      .select('id, emotion_type')
      .eq('user_id', user.id)
      .eq('time_period', time_period)
      .gte('created_at', `${today}T00:00:00+09:00`)
      .lt('created_at', `${today}T23:59:59+09:00`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116はレコードが見つからない場合
      console.error('既存記録チェックエラー:', checkError);
      return NextResponse.json({ error: 'データベースエラー' }, { status: 500 });
    }

    let emotionRecord;
    let insertError;

    if (existingRecord) {
      // 既存記録がある場合は更新（日本時間で保存）
      const { data: updatedRecord, error: updateError } = await supabase
        .from('emotions')
        .update({
          emotion_type,
          updated_at: japanTime.toISOString() // 日本時間を明示的に指定
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      emotionRecord = updatedRecord;
      insertError = updateError;
    } else {
      // 新規記録の場合は挿入（日本時間で保存）
      const { data: newRecord, error: newInsertError } = await supabase
        .from('emotions')
        .insert({
          user_id: user.id,
          emotion_type,
          time_period,
          intensity: 3, // デフォルト値
          note: null,
          created_at: japanTime.toISOString() // 日本時間を明示的に指定
        })
        .select()
        .single();

      emotionRecord = newRecord;
      insertError = newInsertError;
    }

    if (insertError) {
      console.error('感情記録挿入エラー:', insertError);
      return NextResponse.json({ error: '感情記録の保存に失敗しました' }, { status: 500 });
    }

    console.log('感情記録完了:', {
      userId: user.id,
      emotionType: emotion_type,
      timePeriod: time_period,
      recordId: emotionRecord.id,
      action: existingRecord ? 'updated' : 'created'
    });

    return NextResponse.json({ 
      success: true, 
      data: emotionRecord 
    });

  } catch (error) {
    console.error('感情記録APIエラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
} 