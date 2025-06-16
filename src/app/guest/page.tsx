'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
const { FaUser, FaExclamationTriangle } = require('react-icons/fa');

const FaUserIcon = (props: any) => <FaUser {...props} />;
const FaExclamationTriangleIcon = (props: any) => <FaExclamationTriangle {...props} />;

export default function GuestPage() {
  const router = useRouter();
  const { user, signInAsGuest, isGuest } = useAuth();

  useEffect(() => {
    if (user && (user.isGuest || !user.isGuest)) {
      router.push('/menu');
    }
  }, [user, router]);

  const handleStartGuestMode = async () => {
    try {
      await signInAsGuest();
      router.push('/menu');
    } catch (error) {
      console.error('Guest mode error:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ゲスト体験モード</h1>
              <p className="mt-2 text-gray-600">
                アカウントを作成せずにStepEasyを体験できます
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FaExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">制限事項</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>最大3つのタスクまで作成可能</li>
                        <li>データはブラウザに一時保存</li>
                        <li>ブラウザを閉じるとデータは消去</li>
                        <li>一部の機能は制限されます</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="primary"
                  onClick={handleStartGuestMode}
                  className="w-full"
                >
                  ゲストモードで始める
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/register-select')}
                  className="w-full"
                >
                  アカウントを作成する
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>アカウントを作成すると、すべての機能が利用可能になります</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 