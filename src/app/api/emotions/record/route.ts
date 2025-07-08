import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { emotion_type, time_period } = await request.json();

    // バリデーション
    if (!emotion_type || !time_period) {
      return NextResponse.json({ error: '感情タイプと時間帯は必須です' }, { status: 400 });
    }

    const validEmotions = ['joy', 'sadness', 'anger', 'surprise', 'fear', 'calm'];
    const validTimePeriods = ['morning', 'afternoon', 'evening'];

    if (!validEmotions.includes(emotion_type)) {
      return NextResponse.json({ error: '無効な感情タイプです' }, { status: 400 });
    }

    if (!validTimePeriods.includes(time_period)) {
      return NextResponse.json({ error: '無効な時間帯です' }, { status: 400 });
    }

    // 今日の日付を取得（日本時間）
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
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
      // 既存記録がある場合は更新
      const { data: updatedRecord, error: updateError } = await supabase
        .from('emotions')
        .update({
          emotion_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      emotionRecord = updatedRecord;
      insertError = updateError;
    } else {
      // 新規記録の場合は挿入
      const { data: newRecord, error: newInsertError } = await supabase
        .from('emotions')
        .insert({
          user_id: user.id,
          emotion_type,
          time_period,
          intensity: 3, // デフォルト値
          note: null
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