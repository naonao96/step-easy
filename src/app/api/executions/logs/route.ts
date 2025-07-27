import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// GET: 実行ログデータ取得
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const habitId = searchParams.get('habitId');
    const today = searchParams.get('today');

    // Service Role Keyを使用してデータを取得
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('execution_logs')
      .select(`
        id, user_id, task_id, habit_id, execution_type,
        start_time, end_time, duration, device_type, is_completed,
        created_at, updated_at
      `)
      .eq('user_id', user.id)
      .eq('is_completed', true);

    // フィルター適用
    if (taskId) {
      query = query.eq('task_id', taskId);
    }
    if (habitId) {
      query = query.eq('habit_id', habitId);
    }
    if (today) {
      query = query
        .gte('start_time', `${today}T00:00:00.000Z`)
        .lt('start_time', `${today}T23:59:59.999Z`);
    }

    const { data: executionLogs, error: logError } = await query
      .order('start_time', { ascending: false });

    if (logError) {
      console.error('実行ログ取得エラー:', logError);
      return NextResponse.json({ error: '実行ログの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ executionLogs: executionLogs || [] });
  } catch (error) {
    console.error('実行ログAPI エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// POST: 実行ログデータ作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const logData = await request.json();
    
    // Service Role Keyを使用してデータを作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: executionLog, error } = await supabaseAdmin
      .from('execution_logs')
      .insert([{
        ...logData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('実行ログ作成エラー:', error);
      return NextResponse.json({ error: '実行ログの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ executionLog });
  } catch (error) {
    console.error('実行ログ作成API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// DELETE: 実行ログデータ削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const habitId = searchParams.get('habitId');
    const today = searchParams.get('today');
    const resetType = searchParams.get('resetType');

    if (!taskId && !habitId) {
      return NextResponse.json({ error: 'タスクIDまたは習慣IDは必須です' }, { status: 400 });
    }

    // Service Role Keyを使用してデータを削除
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('execution_logs')
      .delete()
      .eq('user_id', user.id);

    // フィルター適用
    if (taskId) {
      query = query.eq('task_id', taskId);
    }
    if (habitId) {
      query = query.eq('habit_id', habitId);
    }
    if (today && resetType === 'today') {
      query = query
        .gte('start_time', `${today}T00:00:00.000Z`)
        .lt('start_time', `${today}T23:59:59.999Z`);
    }

    const { error } = await query;

    if (error) {
      console.error('実行ログ削除エラー:', error);
      return NextResponse.json({ error: '実行ログの削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('実行ログ削除API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 