'use client';

import React, { useState } from 'react';
import { FaUser, FaCheck } from 'react-icons/fa';

interface SetupStepProps {
  userName: string;
  setUserName: (name: string) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  userName,
  setUserName,
  agreedToTerms,
  setAgreedToTerms,
  onComplete,
  onSkip
}) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = userName.trim().length >= 2 && agreedToTerms;

  const handleComplete = async () => {
    if (!isFormValid || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_name: userName.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'オンボーディングの完了に失敗しました');
      }
      
      // 成功時の処理
      onComplete();
    } catch (error) {
      console.error('Onboarding completion error:', error);
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* ヘッダー */}
      <div className="mb-8">
        <h2 className="text-xl lg:text-3xl font-bold leading-tight mb-3 relative">
          {/* 背景レイヤー（影効果） */}
          <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
          
          {/* メインテキスト */}
          <div className="relative z-10 text-[#4a3728]" 
               style={{ 
                 textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                 filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
               }}>
            ここから、<br />
            あなたの
            <span className="relative z-20 text-[#8b4513] font-extrabold"
                  style={{ 
                    textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                  }}>
              StepEasy
            </span>
            が始まります
          </div>
        </h2>
        <p className="text-[#7c5a2a] text-sm">
          快適にご利用いただくために、利用規約のご確認とお名前の登録をお願いします。
        </p>
      </div>

      {/* 名前入力 */}
      <div className="mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-[#deb887]/20">
          {/* 装飾要素 */}
          <div className="absolute top-4 right-4 w-6 h-6 text-[#8b4513] opacity-30">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          
          <div className="relative z-10">
            <label htmlFor="userName" className="block text-[#8b4513] font-semibold mb-4 text-lg">
              ニックネーム
            </label>
            <div className="relative mb-4">
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="例: 田中太郎"
                className="w-full px-6 py-4 pl-14 border-2 border-[#deb887]/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#8b4513]/20 focus:border-[#8b4513] bg-white/90 backdrop-blur-sm transition-all duration-300 hover:border-[#8b4513]/70"
                maxLength={20}
              />
              {React.createElement(FaUser as any, { className: "absolute left-5 top-1/2 transform -translate-y-1/2 text-[#7c5a2a] transition-colors duration-300" })}
            </div>
            <p className="text-[#7c5a2a] text-sm mb-3">
              小鳥がその名前でメッセージを届けてくれます
            </p>
            {userName.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-[#deb887]/30">
                <p className="text-[#8b4513] text-sm font-medium">
                  {userName.length}/20文字
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 利用規約同意 */}
      <div className="mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-[#deb887]/20">
          {/* 装飾要素 */}
          <div className="absolute top-4 right-4 w-6 h-6 text-[#8b4513] opacity-30">
            {React.createElement(FaCheck as any, { className: "w-full h-full" })}
          </div>
          
          <div className="relative z-10">
            <h3 className="text-[#8b4513] font-semibold mb-6 text-lg">
              利用規約とプライバシーポリシー
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    agreedToTerms 
                      ? 'bg-gradient-to-br from-[#8b4513] to-[#7c5a2a] border-[#8b4513] shadow-md' 
                      : 'border-[#deb887] hover:border-[#8b4513]/70'
                  }`}
                >
                  {agreedToTerms && React.createElement(FaCheck as any, { className: "text-white text-sm" })}
                </button>
                <div className="flex-1">
                  <p className="text-[#7c5a2a] text-base font-medium mb-3">
                    利用規約とプライバシーポリシーに同意します
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-[#8b4513] text-sm underline hover:no-underline font-medium transition-colors duration-300 hover:text-[#7c5a2a]"
                    >
                      利用規約
                    </button>
                    <span className="text-[#7c5a2a] text-sm">・</span>
                    <button
                      onClick={() => setShowPrivacy(true)}
                      className="text-[#8b4513] text-sm underline hover:no-underline font-medium transition-colors duration-300 hover:text-[#7c5a2a]"
                    >
                      プライバシーポリシー
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* CTAボタン */}
      <button
        onClick={handleComplete}
        disabled={!isFormValid || isLoading}
        className={`group relative w-full font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-500 transform overflow-hidden ${
          isFormValid && !isLoading
            ? 'bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {/* グラデーションオーバーレイ（有効時のみ） */}
        {isFormValid && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        )}
        
        {/* ボタンテキスト */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>処理中...</span>
            </>
          ) : (
            <>
              <span>はじめる</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* 利用規約モーダル */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-[#8b4513] mb-4">利用規約</h3>
            <div className="text-sm text-[#7c5a2a] space-y-3">
              <p>StepEasyをご利用いただくにあたり、以下の利用規約に同意をお願いします。</p>
              <p>本サービスは、ユーザーの習慣化をサポートすることを目的としています。</p>
              <p>ユーザーは、本サービスを適切に利用し、他のユーザーに迷惑をかける行為を行わないものとします。</p>
            </div>
            <button
              onClick={() => setShowTerms(false)}
              className="mt-6 w-full bg-[#8b4513] text-white py-2 rounded-lg"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* プライバシーポリシーモーダル */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-[#8b4513] mb-4">プライバシーポリシー</h3>
            <div className="text-sm text-[#7c5a2a] space-y-3">
              <p>StepEasyは、ユーザーのプライバシーを大切にしています。</p>
              <p>収集した個人情報は、サービスの提供と改善のためにのみ使用されます。</p>
              <p>第三者への個人情報の提供は、法律で定められた場合を除き行いません。</p>
            </div>
            <button
              onClick={() => setShowPrivacy(false)}
              className="mt-6 w-full bg-[#8b4513] text-white py-2 rounded-lg"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 