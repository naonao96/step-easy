'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

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

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              ログイン
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              アカウントをお持ちでないですか？{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                新規登録
              </button>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  onClick={() => router.push('/reset-password')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  パスワードをお忘れですか？
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              ログイン
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
} 