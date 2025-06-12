'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterSelect() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // ログイン済みの場合はメニュー画面にリダイレクト
  if (isLoggedIn) {
    router.replace('/menu');
  }

  const handleLogin = () => {
    router.push('/login');
  };

  const handleGuest = () => {
    // ゲストログインの処理を実装
    // ここでは単純にメニュー画面にリダイレクト
    router.push('/menu');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            はじめる前に
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 max-w">
            まずは、以下のいずれかの方法でアプリをご利用ください
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleLogin}
            className="relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            アカウントを作成して始める
          </button>
          <button
            onClick={handleGuest}
            className="relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ゲストで始める
          </button>
        </div>
      </div>
    </div>
  );
}
