import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import type Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const item = subscription.items.data[0];
  
  // サブスクリプション情報をデータベースに保存
  const subscriptionData = {
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_start: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
    current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date(),
  };

  await supabase
    .from('subscriptions')
    .update(subscriptionData)
    .eq('user_id', userId);

  // ユーザーのplan_typeを更新
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await supabase
      .from('users')
      .update({ plan_type: 'premium' })
      .eq('id', userId);
  }

  // 体験期間開始の通知
  if (subscription.status === 'trialing') {
    await createNotification(userId, 'trial_started', '無料体験期間が開始されました', '7日間、すべてのプレミアム機能をお試しいただけます。');
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const item = subscription.items.data[0];

  const subscriptionData = {
    status: subscription.status,
    current_period_start: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
    current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date(),
  };

  await supabase
    .from('subscriptions')
    .update(subscriptionData)
    .eq('user_id', userId);

  // ユーザーのplan_typeを更新
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await supabase
      .from('users')
      .update({ plan_type: 'premium' })
      .eq('id', userId);
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await supabase
      .from('users')
      .update({ plan_type: 'free' })
      .eq('id', userId);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const item = subscription.items.data[0];
  const currentPeriodEnd = item?.current_period_end;

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date(),
    })
    .eq('user_id', userId);

  // サブスクリプションがキャンセルされた場合のplan_type更新
  if (subscription.status === 'canceled') {
    if (subscription.cancel_at_period_end && currentPeriodEnd) {
      // 期間終了キャンセルの場合：期間終了日をチェック
      const periodEndDate = new Date(currentPeriodEnd * 1000);
      const now = new Date();
      
      if (now >= periodEndDate) {
        console.log(`Period ended for user ${userId}, updating plan_type to free`);
        await supabase
          .from('users')
          .update({ plan_type: 'free' })
          .eq('id', userId);
      } else {
        console.log(`Period not ended yet for user ${userId}, keeping premium until ${periodEndDate}`);
      }
    } else {
      // 強制キャンセルの場合：即座にfreeに更新
      console.log(`Forced cancellation for user ${userId}, updating plan_type to free immediately`);
      await supabase
        .from('users')
        .update({ plan_type: 'free' })
        .eq('id', userId);
    }
  }

  await createNotification(userId, 'subscription_canceled', 'サブスクリプションが解約されました', '現在の期間終了までプレミアム機能をご利用いただけます。');
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // 体験期間終了3日前の通知
  await createNotification(
    userId, 
    'trial_ending', 
    '無料体験期間が終了します', 
    '3日後に無料体験期間が終了し、月額200円の課金が開始されます。'
  );
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId;
  if (!userId) return;
  
  // 支払い履歴を記録（payment_intent_idは省略）
  await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: null, // Stripe v18では直接取得できないため
      amount: invoice.amount_paid,
      status: 'succeeded',
    });

  await createNotification(userId, 'payment_succeeded', '支払いが完了しました', 'プレミアム機能をご利用いただけます。');
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId;
  if (!userId) return;
  
  // 支払い履歴を記録（payment_intent_idは省略）
  await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: null, // Stripe v18では直接取得できないため
      amount: invoice.amount_due,
      status: 'failed',
    });

  await createNotification(userId, 'payment_failed', '支払いに失敗しました', 'お支払い方法をご確認ください。');
}

async function createNotification(userId: string, type: string, title: string, message: string) {
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      created_at: new Date(),
    });
} 