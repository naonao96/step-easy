import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// PUT: 統計情報の更新
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { targetId, isHabit, updates } = body;

    if (!targetId || !updates) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    // Service Role Keyを使用して統計情報を更新
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (isHabit) {
      // 習慣の現在の統計情報を取得
      const { data: currentHabit, error: fetchError } = await supabaseAdmin
        .from('habits')
        .select('all_time_total, today_total')
        .eq('id', targetId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('習慣統計取得エラー:', fetchError);
        return NextResponse.json({ error: '習慣の統計取得に失敗しました' }, { status: 500 });
      }

      // 既存値に加算
      const newAllTimeTotal = ((currentHabit?.all_time_total as number) || 0) + (updates.all_time_total || 0);
      const newTodayTotal = updates.today_total || 0;

      // 習慣の統計情報を更新
      const { data: updatedHabit, error } = await supabaseAdmin
        .from('habits')
        .update({
          ...updates,
          all_time_total: newAllTimeTotal,
          today_total: newTodayTotal
        })
        .eq('id', targetId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('習慣統計更新エラー:', error);
        return NextResponse.json({ error: '習慣の統計更新に失敗しました' }, { status: 500 });
      }

      return NextResponse.json({ updatedHabit });
    } else {
      // タスクの現在の統計情報を取得
      const { data: currentTask, error: fetchError } = await supabaseAdmin
        .from('tasks')
        .select('all_time_total, execution_count')
        .eq('id', targetId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('タスク統計取得エラー:', fetchError);
        return NextResponse.json({ error: 'タスクの統計取得に失敗しました' }, { status: 500 });
      }

      // 既存値に加算
      const newAllTimeTotal = ((currentTask?.all_time_total as number) || 0) + (updates.all_time_total || 0);
      const newExecutionCount = ((currentTask?.execution_count as number) || 0) + (updates.execution_count || 0);
      const newTodayTotal = updates.today_total || 0;

      // タスクの統計情報を更新
      const { data: updatedTask, error } = await supabaseAdmin
        .from('tasks')
        .update({
          ...updates,
          all_time_total: newAllTimeTotal,
          execution_count: newExecutionCount,
          today_total: newTodayTotal
        })
        .eq('id', targetId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('タスク統計更新エラー:', error);
        return NextResponse.json({ error: 'タスクの統計更新に失敗しました' }, { status: 500 });
      }

      return NextResponse.json({ updatedTask });
    }
  } catch (error) {
    console.error('統計更新API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// DELETE: 実行ログの一括削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    const isHabit = searchParams.get('isHabit') === 'true';
    const resetType = searchParams.get('resetType'); // 'today' or 'total'
    const today = searchParams.get('today');

    if (!targetId || !resetType || !today) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 });
    }

    // Service Role Keyを使用して実行ログを削除
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (isHabit) {
      // 習慣の実行ログを削除
      if (resetType === 'today') {
        const { data: deletedLogs, error } = await supabaseAdmin
          .from('execution_logs')
          .delete()
          .eq('habit_id', targetId)
          .eq('user_id', user.id)
          .gte('start_time', `${today}T00:00:00.000Z`)
          .lt('start_time', `${today}T23:59:59.999Z`)
          .select();

        if (error) {
          console.error('習慣の今日のログ削除エラー:', error);
          return NextResponse.json({ error: '習慣の今日のログ削除に失敗しました' }, { status: 500 });
        }

        return NextResponse.json({ deletedLogs });
      } else if (resetType === 'total') {
        const { data: deletedLogs, error } = await supabaseAdmin
          .from('execution_logs')
          .delete()
          .eq('habit_id', targetId)
          .eq('user_id', user.id)
          .select();

        if (error) {
          console.error('習慣の全ログ削除エラー:', error);
          return NextResponse.json({ error: '習慣の全ログ削除に失敗しました' }, { status: 500 });
        }

        return NextResponse.json({ deletedLogs });
      }
    } else {
      // タスクの実行ログを削除
      if (resetType === 'today') {
        const { data: deletedLogs, error } = await supabaseAdmin
          .from('execution_logs')
          .delete()
          .eq('task_id', targetId)
          .eq('user_id', user.id)
          .gte('start_time', `${today}T00:00:00.000Z`)
          .lt('start_time', `${today}T23:59:59.999Z`)
          .select();

        if (error) {
          console.error('タスクの今日のログ削除エラー:', error);
          return NextResponse.json({ error: 'タスクの今日のログ削除に失敗しました' }, { status: 500 });
        }

        return NextResponse.json({ deletedLogs });
      } else if (resetType === 'total') {
        const { data: deletedLogs, error } = await supabaseAdmin
          .from('execution_logs')
          .delete()
          .eq('task_id', targetId)
          .eq('user_id', user.id)
          .select();

        if (error) {
          console.error('タスクの全ログ削除エラー:', error);
          return NextResponse.json({ error: 'タスクの全ログ削除に失敗しました' }, { status: 500 });
        }

        return NextResponse.json({ deletedLogs });
      }
    }

    return NextResponse.json({ error: '無効なリセットタイプです' }, { status: 400 });
  } catch (error) {
    console.error('実行ログ削除API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 