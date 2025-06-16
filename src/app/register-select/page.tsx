'use client';
export const dynamic = "force-dynamic";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';

export default function RegisterSelect() {
  const router = useRouter();
  const { user } = useAuth();

  // ログイン済みの場合はメニュー画面にリダイレクト
  if (user) {
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
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            はじめる前に
          </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
            まずは、以下のいずれかの方法でアプリをご利用ください
          </p>
        </div>
        <div className="mt-8 space-y-6">
            <Button
            onClick={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
          >
            アカウントを作成して始める
            </Button>
            <Button
            onClick={handleGuest}
              variant="secondary"
              size="lg"
              fullWidth
          >
            ゲストで始める
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
