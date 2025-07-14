'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaGoogle, FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft, FaEnvelope } from 'react-icons/fa';
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5dc] via-[#f0e8d8] to-[#e6d7c3] flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[#faf8f0]/90 backdrop-blur-sm p-8 rounded-3xl border border-[#deb887]/30 shadow-2xl">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#8b4513] mb-2">StepEasy</h1>
            <h2 className="text-xl font-semibold text-[#7c5a2a]">おかえりなさい</h2>
            <p className="text-sm text-[#a0522d] mt-1">タスク管理を続けましょう</p>
          </div>

          {/* Googleログイン */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#deb887] rounded-2xl text-[#8b4513] bg-white/80 hover:bg-white transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
                          {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-[#deb887] border-t-[#8b4513] rounded-full animate-spin"></div>
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
          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-[#deb887]/50"></div>
            <span className="px-4 text-sm text-[#7c5a2a] bg-[#faf8f0]/90">または</span>
            <div className="flex-1 h-px bg-[#deb887]/50"></div>
          </div>

          {/* メールログインフォーム */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8b4513]">メールアドレス</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-[#f5f5dc] border border-[#deb887] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513] transition-all duration-200"
                  placeholder="your@email.com"
                  required
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7c5a2a]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8b4513]">パスワード</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-[#f5f5dc] border border-[#deb887] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513] transition-all duration-200"
                  placeholder="パスワードを入力"
                  required
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7c5a2a]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] hover:from-[#7c5a2a] hover:to-[#8b4513] text-white font-medium py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl border border-[#deb887]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>ログイン中...</span>
                </div>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          {/* 新規登録リンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#7c5a2a]">
              アカウントをお持ちでないですか？{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-semibold text-[#8b4513] hover:text-[#7c5a2a] transition-colors underline"
              >
                新規登録
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 