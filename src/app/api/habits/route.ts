import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: 習慣一覧と完了データ取得
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 習慣一覧を取得
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select(`
        id, title, description, habit_status, frequency, priority, category,
        current_streak, longest_streak, last_completed_date, streak_start_date,
        estimated_duration, all_time_total, today_total, last_execution_date,
        start_date, due_date, has_deadline, created_at, updated_at, user_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (habitsError) {
      console.error('習慣取得エラー:', habitsError);
      return NextResponse.json({ error: '習慣の取得に失敗しました' }, { status: 500 });
    }

    // 習慣完了データを取得（habit_id経由で関連する完了データのみ取得）
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select(`
        id, habit_id, completed_date, completed_at, created_at
      `)
      .in('habit_id', habits?.map(h => h.id) || []);

    if (completionsError) {
      console.error('習慣完了データ取得エラー:', completionsError);
      return NextResponse.json({ error: '習慣完了データの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ 
      habits: habits || [], 
      habitCompletions: completions || [] 
    });
  } catch (error) {
    console.error('習慣API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// POST: 習慣作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const habitData = await request.json();
    
    // 入力値検証
    if (!habitData.title || habitData.title.trim() === '') {
      return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 });
    }

    // 習慣を作成
    const { data: habit, error } = await supabase
      .from('habits')
      .insert([{
        ...habitData,
        user_id: user.id,
        habit_status: habitData.habit_status || 'active',
        frequency: 'daily',
        priority: habitData.priority || 'medium',
        current_streak: 0,
        longest_streak: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('習慣作成エラー:', error);
      return NextResponse.json({ error: '習慣の作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ habit });
  } catch (error) {
    console.error('習慣作成API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// PUT: 習慣更新
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: '習慣IDは必須です' }, { status: 400 });
    }

    // 習慣を更新（自分の習慣のみ）
    const { data: habit, error } = await supabase
      .from('habits')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('習慣更新エラー:', error);
      return NextResponse.json({ error: '習慣の更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ habit });
  } catch (error) {
    console.error('習慣更新API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// DELETE: 習慣削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '習慣IDは必須です' }, { status: 400 });
    }

    // 習慣を削除（自分の習慣のみ）
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('習慣削除エラー:', error);
      return NextResponse.json({ error: '習慣の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('習慣削除API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 