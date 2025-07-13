import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 環境変数からSupabaseクライアントを作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🧹 無料ユーザーの30日経過データクリーンアップ開始');

    // 30日前の日付を計算
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    // 無料ユーザーを取得
    const { data: freeUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('plan_type', 'free');

    if (usersError) {
      console.error('無料ユーザー取得エラー:', usersError);
      return new Response(
        JSON.stringify({ error: usersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!freeUsers || freeUsers.length === 0) {
      console.log('無料ユーザーが見つかりません');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No free users found',
          deletedTasks: 0,
          deletedLogs: 0,
          deletedMessages: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = freeUsers.map(user => user.id);
    let deletedTasks = 0;
    let deletedLogs = 0;
    let deletedMessages = 0;

    // 30日経過タスクを削除
    const { data: deletedTasksData, error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .in('user_id', userIds)
      .lt('created_at', cutoffDate)
      .select('id');

    if (tasksError) {
      console.error('タスク削除エラー:', tasksError);
    } else {
      deletedTasks = deletedTasksData?.length || 0;
      console.log(`削除されたタスク: ${deletedTasks}件`);
    }

    // 30日経過実行ログを削除
    const { data: deletedLogsData, error: logsError } = await supabase
      .from('execution_logs')
      .delete()
      .in('user_id', userIds)
      .lt('created_at', cutoffDate)
      .select('id');

    if (logsError) {
      console.error('実行ログ削除エラー:', logsError);
    } else {
      deletedLogs = deletedLogsData?.length || 0;
      console.log(`削除された実行ログ: ${deletedLogs}件`);
    }

    // 30日経過daily_messagesを削除
    const { data: deletedMessagesData, error: messagesError } = await supabase
      .from('daily_messages')
      .delete()
      .in('user_id', userIds)
      .lt('created_at', cutoffDate)
      .select('id');

    if (messagesError) {
      console.error('daily_messages削除エラー:', messagesError);
    } else {
      deletedMessages = deletedMessagesData?.length || 0;
      console.log(`削除されたdaily_messages: ${deletedMessages}件`);
    }

    console.log('🧹 データクリーンアップ完了');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Expired data cleanup completed',
        deletedTasks,
        deletedLogs,
        deletedMessages,
        cutoffDate,
        processedUsers: userIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('データクリーンアップエラー:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})