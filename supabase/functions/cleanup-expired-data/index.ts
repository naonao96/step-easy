import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log('🧹 無料ユーザーの30日経過データクリーンアップ開始');

    // 日付計算
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoffDate = thirtyDaysAgo.toISOString();
    const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    const thirtyOneDaysAgoISO = thirtyOneDaysAgo.toISOString();
    const twentyThreeDaysAgo = new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000);
    const twentyThreeDaysAgoISO = twentyThreeDaysAgo.toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // 無料ユーザー取得
    const { data: freeUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('plan_type', 'free');
    if (usersError) {
      console.error('無料ユーザー取得エラー:', usersError);
      return new Response(JSON.stringify({ error: usersError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!freeUsers || freeUsers.length === 0) {
      console.log('無料ユーザーが見つかりません');
      return new Response(JSON.stringify({ success: true, message: 'No free users found', deletedTasks: 0, deletedLogs: 0, deletedMessages: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userIds = freeUsers.map(user => user.id);
    let deletedTasks = 0, deletedLogs = 0, deletedMessages = 0;

    // 30日経過データ削除（全テーブル）
    const deleteTables = [
      { table: 'tasks', log: 'タスク', counter: 'deletedTasks' },
      { table: 'execution_logs', log: '実行ログ', counter: 'deletedLogs' },
      { table: 'daily_messages', log: 'daily_messages', counter: 'deletedMessages' },
      { table: 'habits', log: 'habits' },
      // habit_completionsは後で個別処理
      { table: 'emotions', log: 'emotions' },
      { table: 'notifications', log: 'notifications' },
      { table: 'task_categories', log: 'task_categories' },
      { table: 'active_executions', log: 'active_executions' },
      { table: 'premium_waitlist', log: 'premium_waitlist' },
    ];
    for (const entry of deleteTables) {
      if (entry.table === 'habit_completions') continue; // habit_completionsは後で
      try {
        const { data, error } = await supabase
          .from(entry.table)
          .delete()
          .in('user_id', userIds)
          .lt('created_at', cutoffDate)
          .select('id');
        if (error) {
          console.error(`${entry.log}削除エラー:`, error);
        } else {
          if (entry.counter && Array.isArray(data)) {
            if (entry.counter === 'deletedTasks') deletedTasks = data.length;
            if (entry.counter === 'deletedLogs') deletedLogs = data.length;
            if (entry.counter === 'deletedMessages') deletedMessages = data.length;
          }
          console.log(`削除された${entry.log}: ${data?.length ?? 0}件`);
        }
      } catch (e) {
        console.error(`${entry.log}削除時例外:`, e);
      }
    }
    // habit_completionsはhabit_idで削除
    try {
      const { data: userHabits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .in('user_id', userIds)
        .lt('created_at', cutoffDate);
      if (habitsError) {
        console.error('habits取得エラー:', habitsError);
      } else if (userHabits && userHabits.length > 0) {
        const habitIds = userHabits.map(h => h.id);
        const { data, error: completionsError } = await supabase
          .from('habit_completions')
          .delete()
          .in('habit_id', habitIds)
          .select('id');
        if (completionsError) {
          console.error('habit_completions削除エラー:', completionsError);
        } else {
          console.log(`削除されたhabit_completions: ${data?.length ?? 0}件`);
        }
      } else {
        console.log('削除対象のhabit_completionsはありません');
      }
    } catch (e) {
      console.error('habit_completions削除時例外:', e);
    }

    // 23～30日目のいずれかのテーブルにデータが1件でもあれば通知（週1回まで）
    const notifyTables = [
      { table: 'tasks', key: 'user_id' },
      { table: 'execution_logs', key: 'user_id' },
      { table: 'daily_messages', key: 'user_id' },
      { table: 'habits', key: 'user_id' },
      { table: 'emotions', key: 'user_id' },
      { table: 'notifications', key: 'user_id' },
      { table: 'task_categories', key: 'user_id' },
      { table: 'active_executions', key: 'user_id' },
      { table: 'premium_waitlist', key: 'user_id' },
    ];
    for (const userId of userIds) {
      let shouldNotify = false;
      // 各テーブルをチェック
      for (const entry of notifyTables) {
        const { data, error } = await supabase
          .from(entry.table)
          .select('id')
          .eq(entry.key, userId)
          .gt('created_at', thirtyOneDaysAgoISO)
          .lte('created_at', twentyThreeDaysAgoISO)
          .limit(1);
        if (error) {
          console.error(`[DEBUG] userId: ${userId}, ${entry.table}取得エラー:`, error);
          continue;
        }
        if (data && data.length > 0) {
          shouldNotify = true;
          break;
        }
      }
      // habit_completions（habit_id経由）もチェック
      if (!shouldNotify) {
        // まず該当ユーザーのhabit_idを取得
        const { data: habitIds, error: habitIdError } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', userId);
        if (!habitIdError && habitIds && habitIds.length > 0) {
          const ids = habitIds.map(h => h.id);
          const { data: completions, error: completionsError } = await supabase
            .from('habit_completions')
            .select('id, completed_date, created_at, habit_id')
            .in('habit_id', ids)
            .gt('created_at', thirtyOneDaysAgoISO)
            .lte('created_at', twentyThreeDaysAgoISO)
            .limit(1);
          if (!completionsError && completions && completions.length > 0) {
            shouldNotify = true;
          }
        }
      }
      if (shouldNotify) {
        // 直近7日以内に同type/categoryの通知がなければ追加
        const { data: recent } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('category', 'system')
          .eq('type', 'system_info')
          .gte('created_at', sevenDaysAgoISO)
          .limit(1);
        if (!recent || recent.length === 0) {
          const { error: insertError } = await supabase.from('notifications').insert({
            user_id: userId,
            type: 'system_info',
            category: 'system',
            title: '一部の記録がそろそろ旅立ちます',
            message: '無料プランでは、記録は30日間保存されます。\n一部の記録がまもなく保存期間を超えるため、自動的に削除される予定です。\n大切な記録を残したい方は、プレミアムプランをご検討くださいね🕊️',
            is_read: false,
            priority: 'high',
            created_at: new Date()
          });
          if (insertError) {
            console.log(`[ERROR] userId: ${userId}, notification insert error:`, insertError);
          } else {
            console.log(`[DEBUG] userId: ${userId}, notification inserted successfully.`);
          }
        } else {
          console.log(`[DEBUG] userId: ${userId}, recent notification already exists, skipping insert.`);
        }
      }
    }

    console.log('🧹 データクリーンアップ完了');
    return new Response(JSON.stringify({
      success: true,
      message: 'Expired data cleanup completed',
      deletedTasks,
      deletedLogs,
      deletedMessages,
      cutoffDate,
      processedUsers: userIds.length
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('データクリーンアップエラー:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})