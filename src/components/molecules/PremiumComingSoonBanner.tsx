import React, { useState } from 'react';
import { FaStar, FaChartLine, FaGem, FaBell, FaCrown, FaInfinity, FaEdit, FaHistory } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripeClient, createCheckoutSession } from '@/lib/stripe-client';

interface PremiumComingSoonBannerProps {
  className?: string;
}

export const PremiumComingSoonBanner: React.FC<PremiumComingSoonBannerProps> = ({
  className = ''
}) => {
  const { isGuest, user, isPremium } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpgrade = async () => {
    if (!user?.id || !user?.email) {
      alert('ユーザー情報が見つかりません。');
      return;
    }

    setIsLoading(true);
    try {
      const sessionId = await createCheckoutSession(user.id, user.email);
      const stripe = await loadStripeClient();
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('決済ページを開けませんでした。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // プレミアムユーザーには表示しない
  if (isPremium) return null;
  
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
      <div className="grid grid-cols-1 gap-2 mb-4">
        {isGuest ? (
          <>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaInfinity({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">データ保存期間：30日</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaStar({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">習慣機能：3個まで</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaEdit({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">タスク編集：14日先まで</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border border-[#deb887]/30">
              {FaHistory({className:"w-4 h-4 text-[#8b4513]"})}
              <span className="text-sm font-medium text-[#7c5a2a]">過去のタスク：編集不可</span>
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
        <button 
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              読み込み中...
            </>
          ) : (
            <>
              {FaCrown({className:"w-4 h-4"})}
              {isGuest ? 'アカウント登録' : 'プレミアムにアップグレード'}
            </>
          )}
        </button>
      </div>

      {/* 小さなメッセージ */}
      <p className="text-xs text-[#8b4513] text-center mt-3">
        {isGuest 
          ? '登録は無料です。現在の進捗は引き継がれます'
          : '7日間の無料体験期間付き・いつでも解約可能'
        }
      </p>
    </div>
  );
}; 