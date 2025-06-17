'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('🚀 登録処理開始:', { email, passwordLength: password.length });

    if (password !== confirmPassword) {
      console.log('❌ パスワード不一致');
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      console.log('❌ パスワード文字数不足:', password.length);
      setError('パスワードは6文字以上で入力してください');
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
        },
      });

      console.log('📊 Supabase認証結果:', { data, error });

      if (error) {
        console.error('❌ Supabase認証エラー:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ ユーザー作成成功:', data.user.id);
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

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              新規登録
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              アカウントを作成して始めましょう
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
              <Input
                label="パスワード（確認）"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              登録する
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちですか？{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                ログイン
              </button>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 