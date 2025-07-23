import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createPortalSession } from '@/lib/stripe-client';
import { FaCrown } from 'react-icons/fa';

export const TrialStatusBanner: React.FC = () => {
  const { user, isPremium } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const url = await createPortalSession(user.id);
      window.location.href = url;
    } catch (error) {
      console.error('Portal session error:', error);
      alert('サブスクリプション管理ページを開けませんでした。');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPremium) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {FaCrown({ className: "w-5 h-5 text-green-600" })}
          </div>
          <div>
            <h3 className="font-medium text-green-800 text-sm">
              プレミアム会員
            </h3>
            <p className="text-xs text-green-600">
              すべての機能をご利用いただけます
            </p>
          </div>
        </div>
        <button
          onClick={handleManageSubscription}
          disabled={isLoading}
          className="text-green-600 hover:text-green-800 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? '読み込み中...' : 'サブスクリプション管理'}
        </button>
      </div>
    </div>
  );
}; 