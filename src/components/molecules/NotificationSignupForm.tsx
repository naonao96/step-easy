import React, { useState } from 'react';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NotificationSignupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotificationSignupForm: React.FC<NotificationSignupFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interestedFeatures, setInterestedFeatures] = useState<string[]>([]);

  const supabase = createClientComponentClient();

  const features = [
    { id: 'analytics', label: '📊 詳細な分析レポート' },
    { id: 'ai_coach', label: '🤖 AI専属コーチ' },
    { id: 'predictions', label: '⭐ 成長予測' },
    { id: 'emotional_support', label: '💝 感情サポート' },
    { id: 'habit_optimization', label: '📅 習慣最適化' },
    { id: 'pattern_analysis', label: '🧠 行動パターン分析' }
  ];

  const handleFeatureToggle = (featureId: string) => {
    setInterestedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // premium_waitlistテーブルに登録
      const { error: insertError } = await supabase
        .from('premium_waitlist')
        .upsert({
          user_id: user.id,
          email: user.email,
          interested_features: interestedFeatures,
          signup_date: new Date().toISOString(),
          notification_enabled: true
        }, {
          onConflict: 'user_id'
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
      onSuccess?.();
      
      // 3秒後に自動で閉じる
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Notification signup error:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              {FaBell ({className:"w-5 h-5 text-blue-600"})}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                リリース通知登録
              </h3>
              <p className="text-sm text-gray-600">
                ベータ版リリース時にお知らせします
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {FaTimes ({className:"w-4 h-4 text-gray-500"})}
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {isSuccess ? (
            // 成功画面
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                {FaCheck ({className:"w-8 h-8 text-green-600"})}
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                登録完了！
              </h4>
              <p className="text-gray-600 mb-4">
                ベータ版リリース時に優先的にご案内いたします。
              </p>
              <div className="text-sm text-gray-500">
                このウィンドウは自動で閉じます...
              </div>
            </div>
          ) : (
            // 登録フォーム
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ユーザー情報表示 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">通知先メールアドレス</div>
                <div className="font-medium text-gray-900">{user?.email}</div>
              </div>

              {/* 興味のある機能選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  特に興味のある機能を選択してください（複数選択可）
                </label>
                <div className="space-y-2">
                  {features.map((feature) => (
                    <label
                      key={feature.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={interestedFeatures.includes(feature.id)}
                        onChange={() => handleFeatureToggle(feature.id)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* エラー表示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>登録中...</span>
                  </>
                ) : (
                  <>
                    {FaBell ({className:"w-4 h-4"})}
                    <span>通知を受け取る</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                通知は無料で、いつでも配信停止できます
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}; 