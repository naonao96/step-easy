import { loadStripe } from '@stripe/stripe-js';

// クライアントサイド用Stripeインスタンス
export const loadStripeClient = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Stripeチェックアウトセッション作成
export const createCheckoutSession = async (userId: string, email: string) => {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw error;
  }
};

// Stripeカスタマーポータルセッション作成
export const createPortalSession = async (userId: string) => {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Portal session creation error:', error);
    throw error;
  }
};

 