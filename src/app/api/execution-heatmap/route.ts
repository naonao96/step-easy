import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 実行ログデータを取得（過去30日分）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // タスクの実行ログを取得
    const { data: taskLogs, error: taskError } = await supabase
      .from('execution_logs')
      .select(`
        id,
        task_id,
        start_time,
        end_time,
        duration,
        is_completed,
        tasks!inner(title)
      `)
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .not('task_id', 'is', null)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: true });

    if (taskError) {
      console.error('タスク実行ログ取得エラー:', taskError);
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }

    // 習慣の実行ログを取得
    const { data: habitLogs, error: habitError } = await supabase
      .from('execution_logs')
      .select(`
        id,
        habit_id,
        start_time,
        end_time,
        duration,
        is_completed,
        habits!inner(title)
      `)
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .not('habit_id', 'is', null)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: true });

    if (habitError) {
      console.error('習慣実行ログ取得エラー:', habitError);
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }

    // タスクと習慣のログを統合
    const executionLogs = [
      ...(taskLogs || []).map(log => ({ ...log, type: 'task' })),
      ...(habitLogs || []).map(log => ({ ...log, type: 'habit' }))
    ];



    // ヒートマップデータを生成
    const heatmapData = generateHeatmapData(executionLogs || []);

    return NextResponse.json({
      heatmapData,
      totalExecutions: executionLogs?.length || 0,
      totalDuration: executionLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0
    });

  } catch (error) {
    console.error('ヒートマップAPI エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

interface ExecutionLog {
  id: string;
  task_id?: string;
  habit_id?: string;
  start_time: string;
  end_time: string;
  duration: number;
  is_completed: boolean;
  type: 'task' | 'habit';
  tasks?: {
    title: string;
  };
  habits?: {
    title: string;
  };
}

interface HeatmapCell {
  hour: number;
  day: number;
  count: number;
  totalDuration: number;
  intensity: number;
  taskTitles: string[];
}

function generateHeatmapData(executionLogs: any[]): HeatmapCell[][] {
  // 24時間 × 7曜日のマトリックスを初期化
  const matrix: HeatmapCell[][] = [];
  for (let hour = 0; hour < 24; hour++) {
    matrix[hour] = [];
    for (let day = 0; day < 7; day++) {
      matrix[hour][day] = {
        hour,
        day,
        count: 0,
        totalDuration: 0,
        intensity: 0,
        taskTitles: []
      };
    }
  }

  // 実行開始時間でデータを集計
  executionLogs.forEach(log => {
    const startDate = new Date(log.start_time);
    const hour = startDate.getHours();
    const day = startDate.getDay();
    
    matrix[hour][day].count++;
    matrix[hour][day].totalDuration += log.duration || 0;
    
    // タスクまたは習慣のタイトルを取得
    let title = '';
    if (log.type === 'task' && log.tasks) {
      title = Array.isArray(log.tasks) ? log.tasks[0]?.title : log.tasks.title;
    } else if (log.type === 'habit' && log.habits) {
      title = Array.isArray(log.habits) ? log.habits[0]?.title : log.habits.title;
    }
    
    if (title) {
      matrix[hour][day].taskTitles.push(title);
    }
  });

  // 最大値を求めて強度を計算（実行回数と実行時間の両方を考慮）
  const maxCount = Math.max(...matrix.flat().map(cell => cell.count), 1);
  const maxDuration = Math.max(...matrix.flat().map(cell => cell.totalDuration), 1);

  // 強度を0-1の範囲で正規化（実行回数と実行時間の重み付き平均）
  matrix.forEach(hourRow => {
    hourRow.forEach(cell => {
      const countIntensity = cell.count / maxCount;
      const durationIntensity = cell.totalDuration / maxDuration;
      // 実行回数と実行時間の両方を考慮した強度計算
      cell.intensity = (countIntensity * 0.6) + (durationIntensity * 0.4);
    });
  });

  return matrix;
} 