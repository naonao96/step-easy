import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: タスク一覧取得
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // タスク一覧を取得
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id, title, description, status, priority, 
        due_date, start_date, completed_at, 
        category, estimated_duration, actual_duration,
        current_streak, longest_streak, last_completed_date, streak_start_date,
        session_time, today_total, all_time_total, last_execution_date, execution_count,
        created_at, updated_at, user_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('タスク取得エラー:', error);
      return NextResponse.json({ error: 'タスクの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('タスクAPI エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// POST: タスク作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const taskData = await request.json();
    
    // 入力値検証
    if (!taskData.title || taskData.title.trim() === '') {
      return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 });
    }

    // タスクを作成
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('タスク作成エラー:', error);
      return NextResponse.json({ error: 'タスクの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('タスク作成API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// PUT: タスク更新
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
      return NextResponse.json({ error: 'タスクIDは必須です' }, { status: 400 });
    }

    // タスクを更新（自分のタスクのみ）
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('タスク更新エラー:', error);
      return NextResponse.json({ error: 'タスクの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('タスク更新API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// DELETE: タスク削除
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
      return NextResponse.json({ error: 'タスクIDは必須です' }, { status: 400 });
    }

    // タスクを削除（自分のタスクのみ）
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('タスク削除エラー:', error);
      return NextResponse.json({ error: 'タスクの削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('タスク削除API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 