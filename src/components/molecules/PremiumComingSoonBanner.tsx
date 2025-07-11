import React from 'react';
import { FaStar, FaChartLine, FaGem, FaBell } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumComingSoonBannerProps {
  className?: string;
}

export const PremiumComingSoonBanner: React.FC<PremiumComingSoonBannerProps> = ({
  className = ''
}) => {
  const { isGuest } = useAuth();
  
  return (
    <div className={`bg-gradient-to-r from-[#f5f5dc] to-[#f0f0e0] border border-[#deb887] rounded-xl p-4 mx-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-3">
        {FaGem ({className:"w-5 h-5 text-[#8b4513]"})}
        <span className="text-lg font-bold text-[#8b4513]">
          {isGuest ? 'アカウント登録で解放される機能' : 'プレミアム機能'}
        </span>
        <span className="text-xs bg-[#deb887] text-[#8b4513] px-2 py-1 rounded-full font-medium">
          {isGuest ? '無料' : '月額200円'}
        </span>
      </div>

      {/* 説明文 */}
      <p className="text-sm text-[#7c5a2a] mb-4">
        {isGuest 
          ? 'アカウント登録すると、これらの機能がご利用いただけます'
          : '習慣の記録を"人生の記憶"として残せます'
        }
      </p>

      {/* 機能プレビュー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {isGuest ? (
          <>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaChartLine({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">進捗分析</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaStar({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">習慣管理</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaBell({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">データ保存</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaGem({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">期限設定</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaGem({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">データ保存期間：無制限</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaStar({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">習慣機能：登録数無制限</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaChartLine({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">タスク編集：過去・未来すべて</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaBell({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">人生の記憶として残せる</span>
            </div>
          </>
        )}
      </div>

      {/* CTAボタン */}
      <div className="mt-4 pt-3 border-t border-[#deb887]/30">
        <button className="w-full px-4 py-2 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-lg font-medium transition-colors">
          プレミアムを試す
        </button>
      </div>

      {/* 小さなメッセージ */}
      <p className="text-xs text-[#8b4513] text-center mt-3">
        {isGuest 
          ? '登録は無料です。現在の進捗は引き継がれます'
          : '現在の機能は引き続きご利用いただけます'
        }
      </p>
    </div>
  );
}; 