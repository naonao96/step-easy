import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // テスト用サブスクリプション通知を作成
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type: 'subscription_payment_success',
          title: '支払いが完了しました',
          message: 'プレミアム機能をご利用いただけます。',
          priority: 'high',
          category: 'subscription',
          is_read: false
        },
        {
          user_id: userId,
          type: 'trial_ending',
          title: '無料体験期間が終了します',
          message: '3日後に無料体験期間が終了し、月額200円の課金が開始されます。',
          priority: 'high',
          category: 'subscription',
          is_read: false
        },
        {
          user_id: userId,
          type: 'subscription_canceled',
          title: 'サブスクリプションが解約されました',
          message: '現在の期間終了までプレミアム機能をご利用いただけます。',
          priority: 'high',
          category: 'subscription',
          is_read: false
        }
      ])
      .select();

    if (error) {
      console.error('通知作成エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      notifications: data,
      message: 'テスト用サブスクリプション通知を作成しました'
    });

  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 