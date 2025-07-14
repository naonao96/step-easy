import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // 権限チェック（Vercel Cron Jobsからの呼び出しのみ許可）
    const authHeader = headers().get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 サブスクリプション状態の修正・チェック開始');

    const now = new Date();

    // 全てのサブスクリプションを取得（キャンセル済み + 期間終了チェック）
    const { data: allSubscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        current_period_end,
        cancel_at_period_end,
        status
      `);

    if (error) {
      console.error('サブスクリプション取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log('サブスクリプションはありません');
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found',
        updatedUsers: 0
      });
    }

    let updatedUsers = 0;
    let skippedUsers = 0;

    // 各ユーザーのplan_typeを確認・修正
    for (const subscription of allSubscriptions) {
      try {
        // ユーザーの現在のplan_typeを確認
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('plan_type')
          .eq('id', subscription.user_id)
          .single();

        if (userError) {
          console.error(`ユーザー ${subscription.user_id} の取得エラー:`, userError);
          continue;
        }

        // 既にfreeの場合はスキップ
        if (userData.plan_type === 'free') {
          console.log(`ユーザー ${subscription.user_id} は既にfreeプランです`);
          skippedUsers++;
          continue;
        }

        // plan_typeをfreeに更新するかどうかを判定
        let shouldUpdate = false;

        if (subscription.cancel_at_period_end && subscription.current_period_end) {
          // 期間終了キャンセルの場合：期間終了日をチェック
          const periodEndDate = new Date(subscription.current_period_end);
          if (now >= periodEndDate) {
            shouldUpdate = true;
            console.log(`ユーザー ${subscription.user_id}: 期間終了済み`);
          } else {
            console.log(`ユーザー ${subscription.user_id}: 期間終了前 (${periodEndDate})`);
          }
        } else {
          // 強制キャンセルの場合：即座に更新
          shouldUpdate = true;
          console.log(`ユーザー ${subscription.user_id}: 強制キャンセル`);
        }

        if (shouldUpdate) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ plan_type: 'free' })
            .eq('id', subscription.user_id);

          if (updateError) {
            console.error(`ユーザー ${subscription.user_id} の更新エラー:`, updateError);
          } else {
            console.log(`ユーザー ${subscription.user_id} のplan_typeをfreeに更新しました`);
            updatedUsers++;
          }
        }
      } catch (error) {
        console.error(`ユーザー ${subscription.user_id} の処理エラー:`, error);
      }
    }

    console.log(`サブスクリプション状態修正完了: ${updatedUsers}件更新, ${skippedUsers}件スキップ`);

    return NextResponse.json({
      success: true,
      message: 'Subscription status fix completed',
      totalSubscriptions: allSubscriptions.length,
      updatedUsers,
      skippedUsers
    });

  } catch (error) {
    console.error('キャンセル済みサブスクリプション修正APIエラー:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 