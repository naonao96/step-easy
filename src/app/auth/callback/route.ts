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
      const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
      
      if (session?.user) {
        // ユーザーのオンボーディング完了状況をチェック
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('created_at, onboarding_completed_at')
          .eq('id', session.user.id)
          .single();

        if (!userError && userData) {
          // オンボーディングが完了していない場合のみオンボーディング画面にリダイレクト
          if (!userData.onboarding_completed_at) {
            return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
          }
        }
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`);
    }
  }

  // オンボーディング完了済みまたは新規ユーザーでない場合はメニュー画面にリダイレクト
  return NextResponse.redirect(`${requestUrl.origin}/menu`);
} 