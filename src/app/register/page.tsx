'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/templates/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { FaGoogle } from 'react-icons/fa';

export default function RegisterPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signInWithGoogle } = useAuth();

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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-gray-200 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#8b4513] mb-2">StepEasy</h1>
            <h2 className="text-xl font-semibold text-[#7c5a2a]">はじめましょう</h2>
            <p className="text-sm text-[#a0522d] mt-1">新しいタスク管理体験</p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Google新規登録 */}
          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#deb887] rounded-2xl text-[#8b4513] bg-white/80 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="text-center">
              <p className="text-sm text-[#7c5a2a]">
                既にアカウントをお持ちですか？{' '}
                <a href="/login" className="text-[#8b4513] hover:underline font-medium">
                  ログイン
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 