import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// POST: 習慣完了を作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { habit_id, completed_date } = body;

    if (!habit_id || !completed_date) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    // Service Role Keyを使用して習慣完了を作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 習慣が存在し、ユーザーが所有しているかチェック
    const { data: habit, error: habitError } = await supabaseAdmin
      .from('habits')
      .select('id')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: '習慣が見つかりません' }, { status: 404 });
    }

    // 習慣完了を作成
    const { data: completion, error } = await supabaseAdmin
      .from('habit_completions')
      .insert([{
        habit_id,
        completed_date,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('習慣完了作成エラー:', error);
      return NextResponse.json({ error: '習慣完了の作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ completion });
  } catch (error) {
    console.error('習慣完了作成API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// DELETE: 習慣完了を削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const habit_id = searchParams.get('habit_id');
    const completed_date = searchParams.get('completed_date');

    if (!habit_id || !completed_date) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    // Service Role Keyを使用して習慣完了を削除
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 習慣が存在し、ユーザーが所有しているかチェック
    const { data: habit, error: habitError } = await supabaseAdmin
      .from('habits')
      .select('id')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: '習慣が見つかりません' }, { status: 404 });
    }

    // 習慣完了を削除
    const { error } = await supabaseAdmin
      .from('habit_completions')
      .delete()
      .eq('habit_id', habit_id)
      .eq('completed_date', completed_date);

    if (error) {
      console.error('習慣完了削除エラー:', error);
      return NextResponse.json({ error: '習慣完了の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('習慣完了削除API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 