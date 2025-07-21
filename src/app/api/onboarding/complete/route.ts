import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証状態の確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // リクエストボディの取得
    const { user_name, character_name } = await request.json();
    
    // バリデーション
    if (!user_name || typeof user_name !== 'string') {
      return NextResponse.json(
        { error: 'ユーザー名は必須です' },
        { status: 400 }
      );
    }
    
    if (user_name.length < 2 || user_name.length > 50) {
      return NextResponse.json(
        { error: 'ユーザー名は2文字以上50文字以下で入力してください' },
        { status: 400 }
      );
    }

    if (!character_name || typeof character_name !== 'string') {
      return NextResponse.json(
        { error: 'キャラクター名は必須です' },
        { status: 400 }
      );
    }
    
    if (character_name.length < 1 || character_name.length > 30) {
      return NextResponse.json(
        { error: 'キャラクター名は1文字以上30文字以下で入力してください' },
        { status: 400 }
      );
    }

    // ユーザー名の重複チェック
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_name')
      .eq('user_name', user_name)
      .neq('id', user.id) // 自分以外のユーザーをチェック
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116は「データが見つからない」エラー
      return NextResponse.json(
        { error: 'ユーザー名の確認中にエラーが発生しました' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています' },
        { status: 409 }
      );
    }

    // 現在時刻を取得
    const now = new Date().toISOString();

    // Usersテーブルに保存
    const { error: updateError } = await supabase
      .from('users')
      .update({
        user_name: user_name,
        character_name: character_name,
        terms_accepted_at: now,
        privacy_accepted_at: now,
        onboarding_completed_at: now,
        updated_at: now
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Onboarding completion error:', updateError);
      return NextResponse.json(
        { error: 'オンボーディングの完了に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'オンボーディングが完了しました'
    });

  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 