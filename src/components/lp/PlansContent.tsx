import React from 'react';
import { FaCheck, FaStar, FaGem } from 'react-icons/fa';

interface PlansContentProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
}

export const PlansContent: React.FC<PlansContentProps> = ({ onLogin, onRegister, onGuest, isLoading }) => {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            プランを選択
          </h2>
          <p className="text-xl text-slate-700">
            無料でも十分強力、プレミアムで更なる高みへ
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ゲストプラン */}
          <div className="bg-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">ゲスト</h3>
              <p className="text-slate-600 mb-6">お試し利用</p>
              <div className="text-3xl font-bold text-slate-900 mb-8">無料</div>
              
              <div className="space-y-4 text-left mb-8">
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
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 shadow-xl border-2 border-blue-300 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
              人気No.1
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">無料プラン</h3>
              <p className="text-slate-700 mb-6">フル機能利用</p>
              <div className="text-3xl font-bold text-slate-900 mb-8">無料</div>
              
              <div className="space-y-4 text-left mb-8">
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
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 shadow-xl border-2 border-amber-300">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {(FaGem as any)({ className: "w-5 h-5 text-amber-600" })}
                <h3 className="text-2xl font-bold text-amber-900">プレミアム</h3>
              </div>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-amber-700">より深い洞察と成長</span>
                <span className="bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                  準備中
                </span>
              </div>
              <div className="text-3xl font-bold text-amber-900 mb-2">月額400円</div>
              <p className="text-sm text-amber-700 mb-6">2025年7月リリース予定</p>
              
              <div className="space-y-4 text-left mb-8">
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

        {/* 機能比較表の追加 */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              機能詳細比較
            </h3>
            <p className="text-slate-600">
              各プランの機能を詳しく比較できます
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">機能</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">ゲスト</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">無料</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-amber-900">プレミアム</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">タスク作成数</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">3個まで</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">無制限</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">無制限</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">新規作成可能日</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">今日のみ</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">今日〜14日先</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">無制限</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">既存タスク編集</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">今日のみ</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">過去〜14日先</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">無制限</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">期限日設定</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">不可</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">可能</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">可能</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">データ保存期間</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">セッション中</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">30日間</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">無制限</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-700">習慣機能</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">不可</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">3個まで</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600">無制限</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 