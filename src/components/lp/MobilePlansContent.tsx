'use client';

import React from 'react';
import { FaCheck, FaStar, FaGem } from 'react-icons/fa';

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
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">ゲスト</h3>
              <p className="text-slate-600 mb-4">お試し利用</p>
              <div className="text-3xl font-bold text-slate-900 mb-4">無料</div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" })}
                <span className="text-slate-700">基本タスク管理</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" })}
                <span className="text-slate-700">キャラクターサポート</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 text-amber-500 flex-shrink-0">⚠</span>
                <span className="text-slate-500">機能制限あり</span>
              </div>
            </div>
            
            <button
              onClick={onGuest}
              disabled={isLoading}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
            >
              ゲストで試す
            </button>
          </div>

          {/* 無料プラン */}
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 shadow-xl border-2 border-blue-300 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
              人気No.1
            </div>
            
            <div className="text-center mb-6 pt-4">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">無料プラン</h3>
              <p className="text-slate-700 mb-4">フル機能利用</p>
              <div className="text-3xl font-bold text-slate-900 mb-4">無料</div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" })}
                <span className="text-slate-800">全タスク管理機能</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" })}
                <span className="text-slate-800">AI心理サポート</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" })}
                <span className="text-slate-800">詳細統計・ヒートマップ</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" })}
                <span className="text-slate-800">習慣ストリーク記録</span>
              </div>
            </div>
            
            <button
              onClick={onRegister}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
            >
              無料で始める
            </button>
          </div>

          {/* プレミアムプラン */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-xl border-2 border-amber-300 relative">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                {(FaGem as any)({ className: "w-5 h-5 text-amber-600" })}
                <h3 className="text-2xl font-bold text-amber-900">プレミアム</h3>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-amber-700">より深い洞察と成長</span>
                <span className="bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                  準備中
                </span>
              </div>
              <div className="text-3xl font-bold text-amber-900 mb-2">月額400円</div>
              <p className="text-sm text-amber-700 mb-4">2025年7月リリース予定</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                {(FaCheck as any)({ className: "w-4 h-4 text-emerald-500 flex-shrink-0" })}
                <span className="text-amber-800">無料プランの全機能</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaStar as any)({ className: "w-4 h-4 text-amber-600 flex-shrink-0" })}
                <span className="text-amber-800">週次・月次詳細レポート</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaStar as any)({ className: "w-4 h-4 text-amber-600 flex-shrink-0" })}
                <span className="text-amber-800">性格タイプ分析</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaStar as any)({ className: "w-4 h-4 text-amber-600 flex-shrink-0" })}
                <span className="text-amber-800">AI専属コーチ強化</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaStar as any)({ className: "w-4 h-4 text-amber-600 flex-shrink-0" })}
                <span className="text-amber-800">習慣最適化提案</span>
              </div>
              <div className="flex items-center gap-3">
                {(FaStar as any)({ className: "w-4 h-4 text-amber-600 flex-shrink-0" })}
                <span className="text-amber-800">感情パターン解析</span>
              </div>
            </div>
            
            <button
              disabled
              className="w-full bg-amber-200 text-amber-700 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">
            まずは無料で全機能をお試しください
          </p>
          <button
            onClick={onRegister}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
          >
            無料で始める
          </button>
        </div>

        {/* 機能比較表アコーディオンの追加 */}
        <div className="mt-8">
          <details className="bg-white rounded-xl shadow-lg">
            <summary className="px-6 py-4 text-lg font-semibold text-slate-900 cursor-pointer">
              機能詳細比較を見る
            </summary>
            <div className="px-6 pb-4">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">タスク作成数</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-600">ゲスト: 3個</span>
                    <span className="text-slate-600">無料: 無制限</span>
                    <span className="text-amber-700">プレミアム: 無制限</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">新規作成可能日</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-600">ゲスト: 今日のみ</span>
                    <span className="text-slate-600">無料: 今日〜14日先</span>
                    <span className="text-amber-700">プレミアム: 無制限</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">既存タスク編集</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-600">ゲスト: 今日のみ</span>
                    <span className="text-slate-600">無料: 過去〜14日先</span>
                    <span className="text-amber-700">プレミアム: 無制限</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">期限日設定</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-600">ゲスト: 不可</span>
                    <span className="text-slate-600">無料: 可能</span>
                    <span className="text-amber-700">プレミアム: 可能</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">データ保存期間</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-600">ゲスト: セッション中</span>
                    <span className="text-slate-600">無料: 30日間</span>
                    <span className="text-amber-700">プレミアム: 無制限</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-700">習慣機能</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-600">ゲスト: 不可</span>
                    <span className="text-slate-600">無料: 3個まで</span>
                    <span className="text-amber-700">プレミアム: 無制限</span>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}; 