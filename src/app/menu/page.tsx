'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Layout } from '@/components/templates/Layout';

export default function MenuPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // ゲストモードとして扱う
          setIsGuestMode(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
        // エラーの場合もゲストモードとして扱う
        setIsGuestMode(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {isGuestMode && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  ゲストモードで利用中です。一部機能が制限されます。
                  <button
                    onClick={() => router.push('/login')}
                    className="ml-2 text-yellow-700 underline hover:text-yellow-600"
                  >
                    ログイン
                  </button>
                  して全機能を利用できます。
                </p>
              </div>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-8">メニュー</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* メニュー項目をここに追加 */}
        </div>
      </div>
    </Layout>
  );
}