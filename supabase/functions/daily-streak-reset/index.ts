import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 前日までの継続日数を計算する関数
const calculateHabitStreak = (completions: any[], targetDate: string): number => {
  if (completions.length === 0) {
    return 0;
  }

  // 日付順でソート
  const sortedCompletions = completions
    .sort((a, b) => new Date(a.completed_date).getTime() - new Date(b.completed_date).getTime());

  let streak = 0;
  let currentDate = new Date(targetDate);
  currentDate.setDate(currentDate.getDate() - 1); // 前日から開始
  
  // 前日から過去に向かって連続性をチェック
  for (let i = sortedCompletions.length - 1; i >= 0; i--) {
    const completionDate = new Date(sortedCompletions[i].completed_date);
    
    // 連続しているかチェック
    const diffTime = Math.abs(currentDate.getTime() - completionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      currentDate = completionDate;
    } else {
      break; // 連続が途切れたら終了
    }
  }

  return streak;
};

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

    console.log('🔄 全ユーザーの習慣継続日数リセット・再計算開始');

    // 今日の日付を取得（日本時間）
    const now = new Date();
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const today = japanTime.toISOString().split('T')[0];
    
    // 昨日の日付を取得
    const yesterday = new Date(japanTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    console.log(`対象日: ${today}, 昨日: ${yesterdayString}`);

    // 全習慣を取得
    const { data: allHabits, error: habitsError } = await supabase
      .from('habits')
      .select('*');

    if (habitsError) {
      console.error('習慣データ取得エラー:', habitsError);
      return new Response(
        JSON.stringify({ error: habitsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!allHabits || allHabits.length === 0) {
      console.log('習慣データが見つかりません');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No habits found',
          processedHabits: 0,
          resetHabits: 0,
          recalculatedHabits: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`処理対象習慣数: ${allHabits.length}件`);

    let resetHabits = 0;
    let recalculatedHabits = 0;

    // 各習慣の継続日数を処理
    for (const habit of allHabits) {
      try {
        // この習慣の完了記録を取得
        const { data: completions, error: completionsError } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('habit_id', habit.id);

        if (completionsError) {
          console.error(`習慣 ${habit.id} の完了記録取得エラー:`, completionsError);
          continue;
        }

        // 昨日の完了記録を確認
        const yesterdayCompletions = completions.filter(
          c => c.completed_date === yesterdayString
        );

        // 昨日が未完了で現在の継続日数が0より大きい場合はリセット
        if (yesterdayCompletions.length === 0 && habit.current_streak > 0) {
          console.log(`習慣 ${habit.id} をリセット: ${habit.current_streak} → 0`);
          resetHabits++;
          
          await supabase
            .from('habits')
            .update({ current_streak: 0 })
            .eq('id', habit.id);
        }

        // 正しい継続日数を計算
        const correctStreak = calculateHabitStreak(completions, today);
        
        // 現在の値と異なる場合は更新
        if (correctStreak !== habit.current_streak) {
          console.log(`習慣 ${habit.id} の継続日数を更新: ${habit.current_streak} → ${correctStreak}`);
          recalculatedHabits++;
          
          await supabase
            .from('habits')
            .update({ current_streak: correctStreak })
            .eq('id', habit.id);
        }

      } catch (error) {
        console.error(`習慣 ${habit.id} の処理エラー:`, error);
      }
    }

    console.log('🔄 継続日数リセット・再計算完了');
    console.log(`リセットされた習慣: ${resetHabits}件`);
    console.log(`再計算された習慣: ${recalculatedHabits}件`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily streak reset and recalculation completed',
        processedHabits: allHabits.length,
        resetHabits,
        recalculatedHabits,
        targetDate: today,
        yesterdayDate: yesterdayString
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('継続日数リセットエラー:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})