'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import Image from 'next/image';
import { FaUser, FaExclamationTriangle } from 'react-icons/fa';

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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5dc] via-[#f0e8d8] to-[#e6d7c3] flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[#faf8f0]/90 backdrop-blur-sm p-8 rounded-3xl border border-[#deb887]/30 shadow-2xl">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#8b4513] mb-2">StepEasy</h1>
            <h2 className="text-xl font-semibold text-[#7c5a2a]">ゲスト体験モード</h2>
            <p className="text-sm text-[#a0522d] mt-1">アカウントを作成せずにStepEasyを体験できます</p>
          </div>

          {/* 制限事項 */}
          <div className="bg-[#f5f5dc] border border-[#deb887]/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              {FaExclamationTriangle({ className: "w-5 h-5 text-[#deb887] mt-0.5" })}
              <div>
                <h3 className="text-sm font-medium text-[#8b4513]">制限事項</h3>
                <ul className="mt-2 text-sm text-[#7c5a2a] list-disc pl-5 space-y-1">
                        <li>最大3つのタスクまで作成可能</li>
                        <li>データはブラウザに一時保存</li>
                        <li>ブラウザを閉じるとデータは消去</li>
                        <li>一部の機能は制限されます</li>
                      </ul>
                  </div>
                </div>
              </div>

          {/* ボタン群 */}
              <div className="space-y-4">
                <Button
                  variant="primary"
                  onClick={handleStartGuestMode}
              className="w-full bg-[#7c5a2a] hover:bg-[#8b4513] text-white font-medium py-4 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  ゲストモードで始める
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/register')}
              className="w-full border border-[#deb887] text-[#8b4513] bg-white/80 hover:bg-[#f5f5dc] font-medium py-4 rounded-2xl shadow-sm"
                >
                  アカウントを作成する
                </Button>
              </div>

          <div className="text-center text-sm text-[#7c5a2a] mt-6">
                <p>アカウントを作成すると、すべての機能が利用可能になります</p>
          </div>
        </div>
      </div>
    </div>
  );
} 