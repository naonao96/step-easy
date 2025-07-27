import { NextRequest, NextResponse } from 'next/server';
import { checkAuthRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // IPアドレスを取得（簡易版）
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // レート制限チェック
    const rateLimitResult = checkAuthRateLimit(ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'ログイン試行が多すぎます。しばらく待ってから再試行してください。',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // レート制限内の場合、認証処理を続行
    const authData = await request.json();
    
    // ここで実際の認証処理を行う
    // 例: Supabase Auth の呼び出し
    
    return NextResponse.json({ 
      success: true,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime
    });
  } catch (error) {
    console.error('認証レート制限エラー:', error);
    return NextResponse.json(
      { error: '認証処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 