'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log('🔐 ログイン処理開始:', { email, passwordLength: password.length });

    try {
      console.log('📧 Supabaseログイン開始...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Supabaseログイン結果:', { data, error });

      if (error) {
        console.error('❌ ログインエラー:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ ログイン成功:', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          lastSignIn: data.user.last_sign_in_at
        });
      }

      console.log('🚀 メニュー画面にリダイレクト...');
      router.push('/menu');
      router.refresh();
    } catch (error: any) {
      console.error('❌ ログインエラー詳細:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        error: error
      });
      setError(`ログインに失敗しました: ${error.message || 'メールアドレスとパスワードを確認してください。'}`);
    } finally {
      setIsLoading(false);
      console.log('🏁 ログイン処理終了');
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

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* ロゴ・ブランディングセクション */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* 小鳥キャラクター */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center shadow-lg border-4 border-white">
                  <Image 
                    src="/TalkToTheBird.png" 
                    alt="StepEasy小鳥" 
                    width={48} 
                    height={48}
                    className="rounded-full"
                  />
                </div>
                {/* 吹き出し */}
                <div className="absolute -top-2 -right-16 bg-white border border-slate-200 rounded-lg px-3 py-1 shadow-sm">
                  <div className="text-xs text-slate-600 whitespace-nowrap">おかえり！</div>
                  <div className="absolute left-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              おかえりなさい
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              小鳥と一緒にタスク管理を続けましょう
            </p>
          </div>

          {/* メインフォーム */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            {/* Googleログインボタン */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Googleでログイン
            </button>

            {/* 区切り線 */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-slate-200"></div>
              <div className="mx-4 text-sm text-slate-500 bg-white px-2">または</div>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            {/* メールログインフォーム */}
            <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                required
              />
              <Input
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                required
              />
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                    type="button"
                  onClick={() => router.push('/reset-password')}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  パスワードをお忘れですか？
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl shadow-sm"
              isLoading={isLoading}
                disabled={isGoogleLoading}
            >
              ログイン
            </Button>
          </form>

            {/* 新規登録リンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                アカウントをお持ちでないですか？{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  新規登録
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 