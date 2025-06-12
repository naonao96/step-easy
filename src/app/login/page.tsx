'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { isLoggedIn, login } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/menu');
    }
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      if (email === 'demo@example.com' && password === 'passpass0729') {
        login();
        router.replace('/menu');
      } else {
        setError('メールアドレスまたはパスワードが間違っています');
      }
    } catch (err) {
      setError('ログイン中にエラーが発生しました');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 装飾用の雲 */}
      <div className="cloud absolute w-20 h-20 top-[15%] left-[15%] bg-white rounded-full opacity-80"></div>
      <div className="cloud absolute w-32 h-32 bottom-[20%] right-[10%] bg-white rounded-full opacity-80"></div>

      <div className="container mx-auto px-4 pt-8">
        <div className="login-card w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* ヘッダー部分 */}
          <div className="bg-gradient-to-r from-sky-200 to-blue-200 p-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-blue-600">StepEasy</h1>
              <p className="text-blue-500 text-xs">タスクを完了へ導く、心理的サポート付き目標管理アプリ</p>
            </div>
            <Image
                src="/SilentBird.png"
                alt="StepEasy アイコン"
                width={96}
                height={96}
                className="mx-auto mb-4"
                priority
              />
          </div>

          {/* フォーム部分 */}
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 w-full py-2 px-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                    placeholder="example@mail.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <a href="#" className="text-xs text-sky-500 hover:text-sky-700 font-medium">
                    パスワードを忘れた
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 w-full py-2 px-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sky-400 hover:text-sky-600 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-3 w-3 text-sky-500 focus:ring-sky-400 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-xs text-gray-700">
                  ログイン情報を保存する
                </label>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 text-sm transition-colors"
              >
                ログインして一歩踏み出す
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                アカウントをお持ちでないですか？{' '}
                <a href="#" className="font-medium text-sky-500 hover:text-sky-700">
                  新規登録
                </a>
              </p>
            </div>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex justify-center items-center py-1.5 px-3 border border-gray-200 rounded-lg shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  <svg className="h-4 w-4 mr-1" fill="#4285F4" viewBox="0 0 24 24">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex justify-center items-center py-1.5 px-3 border border-gray-200 rounded-lg shadow-sm bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  <svg className="h-4 w-4 mr-1" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center py-2 bg-gray-50 text-xs text-gray-500">
            <p>© 2023 StepEasy</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cloud {
          border-radius: 50%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .floating {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 