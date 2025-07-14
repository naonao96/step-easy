import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    console.log('🔍 Portal session request for userId:', userId);

    if (!userId) {
      console.error('❌ User ID is missing');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // ユーザーのサブスクリプション情報を取得
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    console.log('📊 Subscription data:', subscription);
    console.log('❌ Subscription error:', error);

    if (error || !subscription?.stripe_customer_id) {
      console.error('❌ No subscription found for user:', userId);
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    console.log('💳 Creating portal session for customer:', subscription.stripe_customer_id);
    console.log('🔗 Return URL:', `${process.env.NEXT_PUBLIC_APP_URL}/settings`);

    // カスタマーポータルセッション作成
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    console.log('✅ Portal session created successfully:', session.url);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('❌ Portal session creation error:', error);
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 