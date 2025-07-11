'use client';

import React, { useState, useCallback, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { debounce } from 'lodash';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { signInWithGoogle } = useAuth();

  // メールアドレスの重複チェック（リアルタイムバリデーション）
  const checkEmailAvailability = useCallback(
    debounce(async (email: string) => {
      if (!email || !email.includes('@')) {
        setEmailCheckStatus('idle');
        return;
      }

      setEmailCheckStatus('checking');
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'dummy-password-for-check'
        });
        
        // エラーメッセージで判断
        if (error?.message?.includes('Invalid login credentials')) {
          // メールアドレスが存在しない = 利用可能
          setEmailCheckStatus('available');
        } else if (error?.message?.includes('Email not confirmed')) {
          // メールアドレスは存在するが未確認 = 既に登録済み
          setEmailCheckStatus('taken');
        } else {
          // その他のエラーまたは成功（既に登録済み）
          setEmailCheckStatus('taken');
        }
      } catch (error) {
        console.error('メールアドレスチェックエラー:', error);
        setEmailCheckStatus('idle');
      }
    }, 500),
    [supabase]
  );

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setError(null);
    checkEmailAvailability(newEmail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (emailCheckStatus === 'taken') {
      setError('このメールアドレスは既に登録されています。ログイン画面をご利用ください。');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (displayName.trim().length < 1) {
      setError('ユーザー名を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 Supabase認証開始...');
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('🔗 リダイレクトURL:', redirectUrl);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName.trim(),
          }
        },
      });

      console.log('📊 Supabase認証結果:', { data, error });

      if (error) {
        console.error('❌ Supabase認証エラー:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ ユーザー作成成功:', data.user.id);
        console.log('👤 ユーザー名設定:', displayName);
        console.log('📧 確認メール送信状況:', data.user.email_confirmed_at ? '確認済み' : '未確認');
        
        // メール確認が無効化されている場合、すぐにログイン状態になる
        if (data.user.email_confirmed_at) {
          console.log('🎉 即座にログイン状態になりました');
          alert('登録が完了しました！メニュー画面に移動します。');
          router.push('/menu');
          return;
        }
      }

      // メール確認が有効な場合のメッセージ
      alert('確認メールを送信しました。メールをご確認ください。');
      router.push('/login');
    } catch (error: any) {
      console.error('❌ 登録エラー詳細:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        error: error
      });
      setError(`登録に失敗しました: ${error.message || '不明なエラー'}`);
    } finally {
      setIsLoading(false);
      console.log('🏁 登録処理終了');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('❌ Googleログインエラー:', error);
      setError(`Googleログインに失敗しました: ${error.message || '再度お試しください。'}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getEmailStatusIcon = () => {
    switch (emailCheckStatus) {
      case 'checking':
        return <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>;
      case 'available':
        return <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>;
      case 'taken':
        return <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8">
          {/* ロゴ・ブランディングセクション */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* 小鳥キャラクター - 1.5倍拡大 */}
                <div className="relative" style={{ height: '3cm', width: 'auto', display: 'flex', alignItems: 'center', zIndex: 40 }}>
                  {/* 半透明の円（半径2cm）- 背面に配置 */}
                  <div className="absolute inset-0 w-32 h-32 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-200/20 border-blue-300/30" style={{ left: '50%', top: '50%', zIndex: -1 }}></div>
                  
                  <Image 
                    src="/TalkToTheBird.png" 
                    alt="StepEasy小鳥" 
                    width={72} 
                    height={72}
                    className="rounded-full"
                    style={{ transform: 'scale(1.5)' }}
                  />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#8b4513] tracking-tight">
              はじめまして
            </h2>
            <p className="mt-2 text-sm text-[#7c5a2a]">
              小鳥と一緒にタスク管理を始めましょう
            </p>
          </div>

          {/* メインフォーム */}
          <div className="bg-amber-50 p-8 rounded-2xl shadow-sm border border-amber-200">
            {/* Googleログインボタン */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-amber-300 rounded-xl text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Googleで登録
            </button>

            {/* 区切り線 */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-amber-200"></div>
              <div className="mx-4 text-sm text-amber-600 bg-amber-50 px-2">または</div>
              <div className="flex-1 border-t border-amber-200"></div>
            </div>

            {/* メール登録フォーム */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="ユーザー名"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="あなたの名前"
                  required
                />
                <Input
                  label="メールアドレス"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your@email.com"
                  required
                  rightElement={
                    <div className="flex items-center gap-2">
                      {getEmailStatusIcon()}
                    </div>
                  }
                />
                <Input
                  label="パスワード"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上で入力"
                  required
                />
                <Input
                  label="パスワード（確認）"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="同じパスワードを再入力"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium py-3 rounded-xl shadow-sm"
                isLoading={isLoading}
                disabled={isGoogleLoading}
              >
                アカウントを作成
              </Button>
            </form>

            {/* ログインリンク - 視認性改善 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-amber-800">
                既にアカウントをお持ちですか？{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="font-semibold text-amber-900 hover:text-amber-700 transition-colors underline"
                >
                  ログイン
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 