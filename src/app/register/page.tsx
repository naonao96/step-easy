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
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5dc] via-[#f0e8d8] to-[#e6d7c3] flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[#faf8f0]/90 backdrop-blur-sm p-8 rounded-3xl border border-[#deb887]/30 shadow-2xl">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#8b4513] mb-2">StepEasy</h1>
            <h2 className="text-xl font-semibold text-[#7c5a2a]">はじめましょう</h2>
            <p className="text-sm text-[#a0522d] mt-1">新しいタスク管理体験</p>
          </div>

          {/* フォーム */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8b4513]">ユーザー名</label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-[#f5f5dc] border border-[#deb887] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513] transition-all duration-200"
                  placeholder="ユーザー名"
                  required
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7c5a2a]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8b4513]">メールアドレス</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full px-4 py-3 pl-12 bg-[#f5f5dc] border border-[#deb887] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513] transition-all duration-200"
                  placeholder="your@email.com"
                  required
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7c5a2a]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2">{getEmailStatusIcon()}</span>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8b4513]">パスワード（確認）</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-[#f5f5dc] border border-[#deb887] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513] transition-all duration-200"
                  placeholder="もう一度入力"
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
                  <span>作成中...</span>
          </div>
              ) : (
                'アカウントを作成'
              )}
            </button>
          </form>

          {/* Google新規登録 */}
          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#deb887] rounded-2xl text-[#8b4513] bg-white/80 hover:bg-white transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              Googleで新規登録
            </button>
            </div>

          {/* ログインリンク */}
            <div className="mt-6 text-center">
            <p className="text-sm text-[#7c5a2a]">
                既にアカウントをお持ちですか？{' '}
                <button
                  onClick={() => router.push('/login')}
                className="font-semibold text-[#8b4513] hover:text-[#7c5a2a] transition-colors underline"
                >
                  ログイン
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
} 