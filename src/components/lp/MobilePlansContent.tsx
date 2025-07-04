'use client';

import React, { useState } from 'react';
import { FaCheck, FaStar, FaGem, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="px-6 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            プランを選択
          </h2>
          <p className="text-lg text-slate-700">
            無料でも十分強力、プレミアムで更なる高みへ
          </p>
        </div>

        {/* プランカード */}
        <div className="space-y-6">
          {/* ゲストプラン */}
          <div className="bg-slate-50 rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">ゲスト</h3>
              <p className="text-slate-600 mb-4">お試し利用</p>
              <div className="text-2xl font-bold text-slate-900 mb-6">無料</div>
              
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-slate-700">基本タスク管理</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-slate-700">キャラクターサポート</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 text-amber-500">⚠️</span>
                  <span className="text-slate-500">機能制限あり</span>
                </div>
                
                {/* 詳細プレビューボタン */}
                <button 
                  onClick={() => setShowGuestDetails(!showGuestDetails)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-700 mt-2 transition-colors"
                >
                  {showGuestDetails ? '詳細を隠す' : '詳細を見る'}
                  {showGuestDetails ? 
                    (FaChevronUp as any)({ className: "w-3 h-3" }) : 
                    (FaChevronDown as any)({ className: "w-3 h-3" })
                  }
                </button>
                
                {/* 詳細制限（条件付き表示） */}
                {showGuestDetails && (
                  <div className="text-xs text-slate-500 mt-2 border-t pt-2">
                    タスク作成数：3個まで｜新規作成可能日：今日のみ｜既存タスク編集：今日のみ｜期限日設定：不可｜データ保存期間：セッション中｜習慣機能：不可
                  </div>
                )}
              </div>
              
              <button
                onClick={onGuest}
                disabled={isLoading}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                ゲストで試す
              </button>
            </div>
          </div>

          {/* 無料プラン */}
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 shadow-xl border-2 border-blue-300 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              人気No.1
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">無料プラン</h3>
              <p className="text-slate-700 mb-4">フル機能利用</p>
              <div className="text-2xl font-bold text-slate-900 mb-6">無料</div>
              
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-slate-800">全タスク管理機能</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-slate-800">AI心理サポート</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-slate-800">詳細統計・ヒートマップ</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-slate-800">習慣ストリーク記録</span>
                </div>
                
                {/* 詳細プレビューボタン */}
                <button 
                  onClick={() => setShowFreeDetails(!showFreeDetails)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2 transition-colors"
                >
                  {showFreeDetails ? '詳細を隠す' : '詳細を見る'}
                  {showFreeDetails ? 
                    (FaChevronUp as any)({ className: "w-3 h-3" }) : 
                    (FaChevronDown as any)({ className: "w-3 h-3" })
                  }
                </button>
                
                {/* 詳細制限（条件付き表示） */}
                {showFreeDetails && (
                  <div className="text-xs text-slate-500 mt-2 border-t pt-2">
                    タスク作成数：無制限｜新規作成可能日：今日〜14日先｜既存タスク編集：過去〜14日先｜期限日設定：可能｜データ保存期間：30日間｜習慣機能：3個まで
                  </div>
                )}
              </div>
              
              <button
                onClick={onRegister}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                無料で始める
              </button>
            </div>
          </div>

          {/* プレミアムプラン */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-xl border-2 border-amber-300">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {(FaGem as any)({ className: "w-5 h-5 text-amber-600" })}
                <h3 className="text-xl font-bold text-amber-900">プレミアム</h3>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-amber-700">より深い洞察と成長</span>
                <span className="bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                  準備中
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-900 mb-2">月額400円</div>
              <p className="text-sm text-amber-700 mb-4">2025年7月リリース予定</p>
              
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500" })}
                  <span className="text-amber-800">無料プランの全機能</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-amber-600" })}
                  <span className="text-amber-800">週次・月次詳細レポート</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-amber-600" })}
                  <span className="text-amber-800">性格タイプ分析</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-amber-600" })}
                  <span className="text-amber-800">AI専属コーチ強化</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-amber-600" })}
                  <span className="text-amber-800">習慣最適化提案</span>
                </div>
                <div className="flex items-center gap-3">
                  {(FaStar as any)({ className: "w-4 h-4 text-amber-600" })}
                  <span className="text-amber-800">感情パターン解析</span>
                </div>
                
                {/* 詳細プレビューボタン */}
                <button 
                  onClick={() => setShowPremiumDetails(!showPremiumDetails)}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mt-2 transition-colors"
                >
                  {showPremiumDetails ? '詳細を隠す' : '詳細を見る'}
                  {showPremiumDetails ? 
                    (FaChevronUp as any)({ className: "w-3 h-3" }) : 
                    (FaChevronDown as any)({ className: "w-3 h-3" })
                  }
                </button>
                
                {/* 詳細制限（条件付き表示） */}
                {showPremiumDetails && (
                  <div className="text-xs text-slate-500 mt-2 border-t pt-2">
                    タスク作成数：無制限｜新規作成可能日：無制限｜既存タスク編集：無制限｜期限日設定：可能｜データ保存期間：無制限｜習慣機能：無制限
                    <span className="text-amber-500 ml-2">※ベータ版では利用できません</span>
                  </div>
                )}
              </div>
              
              <button
                disabled
                className="w-full bg-amber-200 text-amber-700 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 