'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import Image from 'next/image';
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
              ゲスト体験モード
            </h2>
            <p className="mt-2 text-sm text-amber-700">
              アカウントを作成せずにStepEasyを体験できます
            </p>
          </div>

          {/* メインフォーム */}
          <div className="bg-amber-50 p-8 rounded-2xl shadow-sm border border-amber-200">
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
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium py-3 rounded-xl shadow-sm"
                >
                  ゲストモードで始める
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/register')}
                  className="w-full border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 font-medium py-3 rounded-xl shadow-sm"
                >
                  アカウントを作成する
                </Button>
              </div>

              <div className="text-center text-sm text-amber-800">
                <p>アカウントを作成すると、すべての機能が利用可能になります</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 