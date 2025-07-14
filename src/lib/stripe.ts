import Stripe from 'stripe';

// サーバーサイド用Stripeインスタンス
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// クライアントサイド用Stripeインスタンス
export const getStripe = () => {
  if (typeof window !== 'undefined') {
    return new (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return null;
};

// Stripe設定定数
export const STRIPE_CONFIG = {
  TRIAL_DAYS: 7,
  PRICE_ID: process.env.STRIPE_PRICE_ID!,
  CURRENCY: 'jpy',
  AMOUNT: 200, // 月額200円
} as const;

// サブスクリプション状態の型定義
export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'unpaid' 
  | 'incomplete' 
  | 'trialing';

// 通知タイプの型定義
export type NotificationType = 
  | 'trial_started'
  | 'trial_ending'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'subscription_canceled';

// Stripeイベントの型定義
export interface StripeSubscription {
  id: string;
  customer: string;
  status: SubscriptionStatus;
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end: boolean;
  metadata: {
    userId: string;
  };
}

export interface StripeInvoice {
  id: string;
  customer: string;
  subscription: string;
  payment_intent?: string;
  amount_paid: number;
  amount_due: number;
  status: string;
  metadata: {
    userId: string;
  };
} 