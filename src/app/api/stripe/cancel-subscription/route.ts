import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log('🔐 Stripeサブスクリプションキャンセル開始:', subscriptionId);

    // Stripeサブスクリプションをキャンセル
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    console.log('✅ Stripeサブスクリプションキャンセル完了:', subscription.id);

    return NextResponse.json({ 
      success: true, 
      subscriptionId: subscription.id 
    });
  } catch (error) {
    console.error('❌ Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 