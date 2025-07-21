'use client';

import React, { useState } from 'react';
import { FaUser, FaCheck, FaDove } from 'react-icons/fa';

interface SetupStepProps {
  userName: string;
  setUserName: (name: string) => void;
  characterName: string;
  setCharacterName: (name: string) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  userName,
  setUserName,
  characterName,
  setCharacterName,
  agreedToTerms,
  setAgreedToTerms,
  onComplete,
  onSkip
}) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = userName.trim().length >= 2 && characterName.trim().length >= 1 && agreedToTerms;

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
        body: JSON.stringify({ 
          user_name: userName.trim(),
          character_name: characterName.trim()
        }),
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
    <div className="w-full max-w-md mx-auto text-center relative">
      {/* 背景レイヤー（影効果） */}
      <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
      
      {/* コンテンツ */}
      <div className="relative z-10 p-4">
        {/* ヘッダー */}
        <div className="mb-4">
          <h2 className="text-lg lg:text-2xl font-bold leading-tight mb-2 relative">
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
        <div className="mb-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-[#deb887]/20">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="userName" className="text-[#8b4513] font-semibold text-base">
                  ニックネーム
                </label>
                <span className="text-[#7c5a2a] text-xs">
                  {userName.length}/20文字
                </span>
              </div>
              <div className="relative mb-3">
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="例: 田中太郎"
                  className="w-full px-4 py-2 pl-12 pr-16 border-2 border-[#deb887]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20 focus:border-[#8b4513] bg-white/90 backdrop-blur-sm transition-all duration-300 hover:border-[#8b4513]/70"
                  maxLength={20}
                />
                {React.createElement(FaUser as any, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7c5a2a] transition-colors duration-300" })}
              </div>
              <p className="text-[#7c5a2a] text-xs mb-2">
                小鳥がその名前でメッセージを届けてくれます
              </p>
            </div>
          </div>
        </div>

        {/* キャラクター名入力 */}
        <div className="mb-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-[#deb887]/20">

            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="characterName" className="text-[#8b4513] font-semibold text-base">
                  小鳥の名前
                </label>
                <span className="text-[#7c5a2a] text-xs">
                  {characterName.length}/15文字
                </span>
              </div>
              <div className="relative mb-3">
                <input
                  id="characterName"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="例: ピヨちゃん"
                  className="w-full px-4 py-2 pl-12 pr-16 border-2 border-[#deb887]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20 focus:border-[#8b4513] bg-white/90 backdrop-blur-sm transition-all duration-300 hover:border-[#8b4513]/70"
                  maxLength={15}
                />
                {React.createElement(FaDove as any, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7c5a2a] transition-colors duration-300 w-4 h-4" })}
              </div>
              <p className="text-[#7c5a2a] text-xs mb-2">
                あなたの小鳥キャラクターに名前を付けてください
              </p>
            </div>
          </div>
        </div>

        {/* 利用規約同意 */}
        <div className="mb-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-[#deb887]/20">

            
            <div className="relative z-10">
              <h3 className="text-[#8b4513] font-semibold mb-3 text-base">
                利用規約とプライバシーポリシー
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-start gap-3">
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
                  <div className="flex flex-col">
                    <p className="text-[#7c5a2a] text-sm font-medium mb-1">
                      利用規約とプライバシーポリシーに同意します
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setShowTerms(true)}
                        className="text-[#8b4513] text-xs underline hover:no-underline font-medium transition-colors duration-300 hover:text-[#7c5a2a]"
                      >
                        利用規約
                      </button>
                      <span className="text-[#7c5a2a] text-xs">・</span>
                      <button
                        onClick={() => setShowPrivacy(true)}
                        className="text-[#8b4513] text-xs underline hover:no-underline font-medium transition-colors duration-300 hover:text-[#7c5a2a]"
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
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* CTAボタン */}
        <button
          onClick={handleComplete}
          disabled={!isFormValid || isLoading}
          className={`group relative w-full font-semibold py-3 text-base rounded-2xl transition-all duration-500 transform overflow-hidden ${
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
      </div>
      
      {/* 利用規約モーダル */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-96 overflow-y-auto">
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-96 overflow-y-auto">
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