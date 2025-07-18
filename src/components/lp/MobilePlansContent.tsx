'use client';

import React, { useState } from 'react';
import { FaCheck, FaStar, FaGem, FaChevronDown, FaChevronUp, FaExclamationTriangle } from 'react-icons/fa';

interface MobilePlansContentProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
}

export const MobilePlansContent: React.FC<MobilePlansContentProps> = ({
  onLogin,
  onRegister,
  onGuest,
  isLoading
}) => {
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [showFreeDetails, setShowFreeDetails] = useState(false);
  const [showPremiumDetails, setShowPremiumDetails] = useState(false);

  return (
    <div className="min-h-screen relative">
      <div className="relative px-6 py-8 pb-20">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#8b4513] mb-4">
            プランを選択
          </h2>
          <p className="text-lg text-[#7c5a2a]">
            無料でも十分強力、プレミアムで更なる高みへ
          </p>
        </div>

        {/* プランカード */}
        <div className="space-y-6">
          {/* ゲストプラン */}
          <div className="bg-gradient-to-br from-[#f5f5dc] to-[#ecd9c6] rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#8b4513] mb-2">ゲスト</h3>
              <p className="text-[#7c5a2a] mb-4">お試し利用</p>
              <div className="text-2xl font-bold text-[#8b4513] mb-6">無料</div>
              
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#7c5a2a]">基本タスク管理</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#7c5a2a]">キャラクターサポート</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaExclamationTriangle as any)({ className: "w-4 h-4 text-amber-500" })}
                  <span className="text-[#7c5a2a]">統計分析：ログイン後利用</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaExclamationTriangle as any)({ className: "w-4 h-4 text-amber-500" })}
                  <span className="text-[#7c5a2a]">感情記録：ログイン後利用</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaExclamationTriangle as any)({ className: "w-4 h-4 text-amber-500" })}
                  <span className="text-[#7c5a2a]">アーカイブ機能：ログイン後利用</span>
                </div>
                
                {/* 詳細プレビューボタン */}
                <button 
                  onClick={() => setShowGuestDetails(!showGuestDetails)}
                  className="flex items-center gap-1 text-xs text-[#7c5a2a] hover:text-[#8b4513] mt-2 transition-colors"
                >
                  {showGuestDetails ? '詳細を隠す' : '詳細を見る'}
                  {showGuestDetails ? 
                    (FaChevronUp as any)({ className: "w-4 h-4" }) : 
                    (FaChevronDown as any)({ className: "w-4 h-4" })
                  }
                </button>
                
                {/* 詳細制限（条件付き表示） */}
                {showGuestDetails && (
                  <div className="text-xs text-[#7c5a2a] mt-2 border-t border-[#deb887]/30 pt-2 bg-[#f5f5dc]/50 rounded-lg p-2">
                    タスク作成数：3個まで｜新規作成可能日：今日のみ｜既存タスク編集：今日のみ｜期限日設定：不可｜データ保存期間：セッション中｜習慣機能：不可｜統計分析：ログイン後利用｜感情記録：ログイン後利用｜アーカイブ機能：ログイン後利用
                  </div>
                )}
              </div>
              
              <button
                onClick={onGuest}
                disabled={isLoading}
                className="w-full bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                ゲストで試す
              </button>
            </div>
          </div>

          {/* 無料プラン */}
          <div className="bg-gradient-to-br from-[#f5f5dc] to-[#deb887] rounded-2xl p-6 shadow-xl border-2 border-[#8b4513] relative hover:shadow-2xl transition-all duration-300">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
              人気No.1
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#8b4513] mb-2">無料プラン</h3>
              <p className="text-[#7c5a2a] mb-4">フル機能利用</p>
              <div className="text-2xl font-bold text-[#8b4513] mb-6">無料</div>
              
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#8b4513] font-medium">タスク管理：無制限</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#8b4513] font-medium">AI心理サポート</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#8b4513] font-medium">統計分析</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#8b4513] font-medium">習慣機能：3個まで</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#8b4513] font-medium">感情記録</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#8b4513] font-medium">アーカイブ機能</span>
                </div>
                
                {/* 詳細プレビューボタン */}
                <button 
                  onClick={() => setShowFreeDetails(!showFreeDetails)}
                  className="flex items-center gap-1 text-xs text-[#8b4513] hover:text-[#7c5a2a] mt-2 transition-colors"
                >
                  {showFreeDetails ? '詳細を隠す' : '詳細を見る'}
                  {showFreeDetails ? 
                    (FaChevronUp as any)({ className: "w-4 h-4" }) : 
                    (FaChevronDown as any)({ className: "w-4 h-4" })
                  }
                </button>
                
                {/* 詳細制限（条件付き表示） */}
                {showFreeDetails && (
                  <div className="text-xs text-[#7c5a2a] mt-2 border-t border-[#deb887]/30 pt-2 bg-[#f5f5dc]/50 rounded-lg p-2">
                    タスク作成数：無制限｜新規作成可能日：今日〜14日先｜既存タスク編集：過去〜14日先｜期限日設定：可能｜データ保存期間：30日間｜習慣機能：3個まで｜感情記録：朝・昼・夜3回｜アーカイブ：30日間表示
                  </div>
                )}
              </div>
              
              <button
                onClick={onRegister}
                disabled={isLoading}
                className="w-full bg-[#8b4513] hover:bg-[#7c5a2a] text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                無料で始める
              </button>
            </div>
          </div>

          {/* プレミアムプラン */}
          <div className="bg-gradient-to-br from-[#deb887] to-[#f5f5dc] rounded-2xl p-6 shadow-xl border-2 border-[#7c5a2a] hover:shadow-2xl transition-all duration-300 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
              おすすめ
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {(FaGem as any)({ className: "w-4 h-4 text-[#8b4513]" })}
                <h3 className="text-xl font-bold text-[#8b4513]">プレミアム</h3>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-[#7c5a2a] text-sm">あなたの成長を永遠に記録</span>
              </div>
              <div className="text-2xl font-bold text-[#8b4513] mb-2">月額200円</div>
              <p className="text-sm text-[#7c5a2a] mb-2">いつでも解約可能</p>
              <span className="bg-gradient-to-r from-[#deb887] to-[#cd853f] text-[#8b4513] px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm mb-4 block">
                7日間無料
              </span>
              
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-[#8b4513] font-medium">無料プランの全機能</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-[#8b4513] flex-shrink-0" })}
                  <span className="text-[#8b4513] font-medium">データ永久保存</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-[#8b4513] flex-shrink-0" })}
                  <span className="text-[#8b4513] font-medium">過去・未来のタスク自由編集</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-[#8b4513] flex-shrink-0" })}
                  <span className="text-[#8b4513] font-medium">習慣機能：無制限</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-[#8b4513] flex-shrink-0" })}
                  <span className="text-[#8b4513] font-medium">詳細な成長分析</span>
                </div>

                
                {/* 詳細プレビューボタン */}
                <button 
                  onClick={() => setShowPremiumDetails(!showPremiumDetails)}
                  className="flex items-center gap-1 text-xs text-[#8b4513] hover:text-[#7c5a2a] mt-2 transition-colors"
                >
                  {showPremiumDetails ? '詳細を隠す' : '詳細を見る'}
                  {showPremiumDetails ? 
                    (FaChevronUp as any)({ className: "w-4 h-4" }) : 
                    (FaChevronDown as any)({ className: "w-4 h-4" })
                  }
                </button>
                
                {/* 詳細制限（条件付き表示） */}
                {showPremiumDetails && (
                  <div className="text-xs text-[#7c5a2a] mt-2 border-t border-[#deb887]/30 pt-2 bg-[#f5f5dc]/50 rounded-lg p-2">
                    タスク作成数：無制限｜新規作成可能日：無制限｜既存タスク編集：無制限｜期限日設定：可能｜データ保存期間：無制限｜習慣機能：無制限｜感情記録：朝・昼・夜3回｜アーカイブ：無制限表示
                  </div>
                )}
              </div>
              
              <button
                onClick={onRegister}
                disabled={isLoading}
                className="w-full bg-[#8b4513] hover:bg-[#7c5a2a] text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                プレミアムで始める
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 