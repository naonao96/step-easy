'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaGoogle, FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/templates/Layout';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabaseクライアントはシングルトンとしてモジュールレベルで一度だけ生成
const supabase = createClientComponentClient();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log('🔐 ログイン処理開始:', { email, passwordLength: password.length });

    try {
      console.log('📧 AuthContext signInWithEmail呼び出し...');
      await signInWithEmail(email, password);
      
      console.log('✅ ログイン成功・画面遷移完了');
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
            <h2 className="text-3xl font-bold text-amber-900 tracking-tight">
              おかえりなさい
            </h2>
            <p className="mt-2 text-sm text-amber-700">
              小鳥と一緒にタスク管理を続けましょう
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
              Googleでログイン
            </button>

            {/* 区切り線 */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-amber-200"></div>
              <div className="mx-4 text-sm text-amber-600 bg-amber-50 px-2">または</div>
              <div className="flex-1 border-t border-amber-200"></div>
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={true}
                    className="font-medium text-gray-400 cursor-not-allowed line-through"
                  >
                    パスワードをお忘れですか？
                  </button>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    ベータ版では利用不可
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium py-3 rounded-xl shadow-sm"
              isLoading={isLoading}
                disabled={isGoogleLoading}
            >
              ログイン
            </Button>
          </form>

            {/* 新規登録リンク - 視認性改善 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-amber-800">
                アカウントをお持ちでないですか？{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="font-semibold text-amber-900 hover:text-amber-700 transition-colors underline"
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