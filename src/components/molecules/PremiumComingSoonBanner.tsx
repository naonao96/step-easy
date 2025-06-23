import React from 'react';
import { FaStar, FaChartLine, FaRobot, FaBell, FaGem } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumComingSoonBannerProps {
  className?: string;
  onNotificationSignup?: () => void;
  onPreviewClick?: () => void;
}

export const PremiumComingSoonBanner: React.FC<PremiumComingSoonBannerProps> = ({
  className = '',
  onNotificationSignup,
  onPreviewClick
}) => {
  const { isGuest } = useAuth();
  
  return (
    <div className={`bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 border border-amber-300 rounded-xl p-4 mx-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-3">
        {FaGem ({className:"w-5 h-5 text-amber-600"})}
        <span className="text-lg font-bold text-amber-900">
          {isGuest ? '🎯 アカウント登録で解放される機能' : '🚀 プレミアム機能'}
        </span>
        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
          Coming Soon
        </span>
      </div>

      {/* 説明文 */}
      <p className="text-sm text-amber-800 mb-4">
        {isGuest 
          ? 'アカウント登録すると、将来これらの高度な機能がご利用いただけます'
          : '400円相当の価値ある機能を開発中。あなたのタスク管理を次のレベルへ'
        }
      </p>

      {/* 機能プレビュー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg">
          {FaChartLine ({className:"w-4 h-4 text-amber-600"})}
          <span className="text-sm font-medium text-amber-800">詳細レポート</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg">
          {FaRobot ({className:"w-4 h-4 text-amber-600"})}
          <span className="text-sm font-medium text-amber-800">AI専属コーチ</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg">
          {FaStar ({className:"w-4 h-4 text-amber-600"})}
          <span className="text-sm font-medium text-amber-800">成長予測</span>
        </div>
      </div>

      {/* ステータス */}
      <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-amber-800">
            🚧 ベータ版リリース準備中
          </span>
        </div>
        <span className="text-xs text-amber-600 font-medium">
          2025年7月リリース予定
        </span>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-2">
        {isGuest ? (
          <>
            <button
              onClick={onPreviewClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {FaGem ({className:"w-4 h-4"})}
              <span>機能詳細を見る</span>
            </button>
            <button
              onClick={() => window.location.href = '/register'}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              アカウント登録
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onNotificationSignup}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
            >
              {FaBell ({className:"w-4 h-4"})}
              <span>リリース通知を受け取る</span>
            </button>
            <button 
              onClick={onPreviewClick}
              className="flex-1 px-4 py-2 bg-white/80 hover:bg-white text-amber-700 border border-amber-300 rounded-lg font-medium transition-colors"
            >
              詳細を見る
            </button>
          </>
        )}
      </div>

      {/* 小さなメッセージ */}
      <p className="text-xs text-amber-600 text-center mt-3">
        {isGuest 
          ? '登録は無料です。現在の進捗は引き継がれます'
          : '現在の機能は引き続きご利用いただけます'
        }
      </p>
    </div>
  );
}; 