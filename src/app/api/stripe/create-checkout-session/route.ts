import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // 既存のStripe顧客を確認
    let customer;
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      // 既存の顧客を取得
      customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id);
    } else {
      // 新しい顧客を作成
      customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      // 顧客IDをデータベースに保存
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          status: 'incomplete',
        });
    }

    // チェックアウトセッション作成
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      subscription_data: {
        trial_period_days: STRIPE_CONFIG.TRIAL_DAYS,
        metadata: {
          userId,
        },
      },
      metadata: {
        userId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 