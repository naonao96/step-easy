import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// GET: 実行ログ・アクティブ実行データ取得
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Service Role Keyを使用してデータを取得
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // アクティブ実行データ取得
    const { data: activeExecutions, error: activeError } = await supabaseAdmin
      .from('active_executions')
      .select(`
        id, user_id, task_id, habit_id, execution_type,
        start_time, device_type, is_paused, accumulated_time,
        created_at, updated_at
      `)
      .eq('user_id', user.id);
    if (activeError) {
      console.error('アクティブ実行取得エラー:', activeError);
      return NextResponse.json({ error: 'アクティブ実行データの取得に失敗しました' }, { status: 500 });
    }

    // 実行ログデータ取得
    const { data: executionLogs, error: logError } = await supabaseAdmin
      .from('execution_logs')
      .select(`
        id, user_id, task_id, habit_id, execution_type,
        start_time, end_time, duration, device_type, is_completed,
        created_at, updated_at
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });
    if (logError) {
      console.error('実行ログ取得エラー:', logError);
      return NextResponse.json({ error: '実行ログの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      activeExecutions: activeExecutions || [],
      executionLogs: executionLogs || []
    });
  } catch (error) {
    console.error('実行ログAPI エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// POST: アクティブ実行データ作成・実行ログ作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const execData = await request.json();
    const { type, ...data } = execData;

    // Service Role Keyを使用してデータを作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (type === 'active_execution') {
      // アクティブ実行データ作成
      const { data: activeExecution, error } = await supabaseAdmin
        .from('active_executions')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('アクティブ実行作成エラー:', error);
        return NextResponse.json({ error: 'アクティブ実行の作成に失敗しました' }, { status: 500 });
      }
      
      return NextResponse.json({ activeExecution });
    } else if (type === 'execution_log') {
      // 実行ログデータ作成
      const { data: executionLog, error } = await supabaseAdmin
        .from('execution_logs')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('実行ログ作成エラー:', error);
        return NextResponse.json({ error: '実行ログの作成に失敗しました' }, { status: 500 });
      }
      
      return NextResponse.json({ executionLog });
    } else {
      return NextResponse.json({ error: '無効なタイプです' }, { status: 400 });
    }
  } catch (error) {
    console.error('実行ログ作成API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// PUT: アクティブ実行データ更新・実行ログ更新
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id, type, ...updateData } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'IDは必須です' }, { status: 400 });
    }

    // Service Role Keyを使用してデータを更新
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (type === 'active_execution') {
      // アクティブ実行データ更新
      const { data: activeExecution, error } = await supabaseAdmin
        .from('active_executions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('アクティブ実行更新エラー:', error);
        return NextResponse.json({ error: 'アクティブ実行の更新に失敗しました' }, { status: 500 });
      }
      
      return NextResponse.json({ activeExecution });
    } else if (type === 'execution_log') {
      // 実行ログデータ更新
      const { data: executionLog, error } = await supabaseAdmin
        .from('execution_logs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('実行ログ更新エラー:', error);
        return NextResponse.json({ error: '実行ログの更新に失敗しました' }, { status: 500 });
      }
      
      return NextResponse.json({ executionLog });
    } else {
      return NextResponse.json({ error: '無効なタイプです' }, { status: 400 });
    }
  } catch (error) {
    console.error('実行ログ更新API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// DELETE: アクティブ実行データ削除・実行ログ削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    
    if (!id) {
      return NextResponse.json({ error: 'IDは必須です' }, { status: 400 });
    }

    // Service Role Keyを使用してデータを削除
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (type === 'active_execution') {
      // アクティブ実行データ削除
      const { error } = await supabaseAdmin
        .from('active_executions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('アクティブ実行削除エラー:', error);
        return NextResponse.json({ error: 'アクティブ実行の削除に失敗しました' }, { status: 500 });
      }
    } else if (type === 'execution_log') {
      // 実行ログデータ削除
      const { error } = await supabaseAdmin
        .from('execution_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('実行ログ削除エラー:', error);
        return NextResponse.json({ error: '実行ログの削除に失敗しました' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: '無効なタイプです' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('実行ログ削除API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 