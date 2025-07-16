import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // エラー時は環境変数またはリクエストURLのoriginを使用
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
      return NextResponse.redirect(`${redirectUrl}/login?error=auth_error`);
    }
  }

  // 認証成功後はメニュー画面にリダイレクト
  // Vercelプレビューモード対応: 環境変数またはリクエストURLのoriginを使用
  const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  return NextResponse.redirect(`${redirectUrl}/menu`);
} 