'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError('パスワードリセットメールの送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              パスワードをリセット
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              登録したメールアドレスを入力してください
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                パスワードリセット用のメールを送信しました。
                メールをご確認ください。
              </div>
              <Button
                onClick={() => router.push('/login')}
                variant="primary"
                size="lg"
                className="w-full"
              >
                ログインページに戻る
              </Button>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label="メールアドレス"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                リセットメールを送信
              </Button>
            </form>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでないですか？{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                新規登録
              </button>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 