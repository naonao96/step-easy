import React, { useState, useEffect } from 'react';
import { Badge } from '@/types/badge';
import { AchievementBadge } from '@/components/atoms/AchievementBadge';
import { FaTimes, FaTrophy } from 'react-icons/fa';

interface BadgeNotificationProps {
  badge: Badge;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badge,
  isVisible,
  onClose,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // 5秒後に自動で閉じる
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50
      transform transition-all duration-500 ease-out
      ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${className}
    `}>
      {/* 木枠風通知カード */}
      <div className="
        bg-gradient-to-br from-amber-50 to-amber-100
        border-2 border-amber-300
        rounded-xl shadow-2xl
        p-4 max-w-sm
        relative overflow-hidden
      ">
        {/* 木目テクスチャ効果 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-transparent rounded-xl" />
        </div>

        {/* 装飾的な角の装飾 */}
        <div className="absolute top-2 left-2 right-2 bottom-2 border border-amber-200 rounded-lg pointer-events-none" />

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-amber-600 hover:text-amber-800 transition-colors"
        >
          {FaTimes({ className: "w-4 h-4" })}
        </button>

        {/* バッジ獲得アイコン */}
        <div className="absolute top-2 left-2 text-amber-600">
          {FaTrophy({ className: "w-5 h-5 animate-bounce" })}
        </div>

        {/* メインコンテンツ */}
        <div className="flex items-center gap-4 pt-6">
          {/* バッジ表示 */}
          <div className="flex-shrink-0">
            <AchievementBadge
              badge={badge}
              size="lg"
              showName={false}
            />
          </div>

          {/* テキスト */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-amber-800 mb-1">
              バッジ獲得！
            </h3>
            <p className="text-sm font-medium text-amber-700 mb-1">
              {badge.name}
            </p>
            <p className="text-xs text-amber-600 leading-relaxed">
              {badge.description}
            </p>
          </div>
        </div>

        {/* 装飾的な要素 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
      </div>
    </div>
  );
};

// バッジ獲得通知マネージャー
interface BadgeNotificationManagerProps {
  notifications: Array<{ id: string; badge: Badge; timestamp: number }>;
  onCloseNotification: (id: string) => void;
  className?: string;
}

export const BadgeNotificationManager: React.FC<BadgeNotificationManagerProps> = ({
  notifications,
  onCloseNotification,
  className = ''
}) => {
  return (
    <div className={className}>
      {notifications.map((notification, index) => (
        <BadgeNotification
          key={notification.id}
          badge={notification.badge}
          isVisible={true}
          onClose={() => onCloseNotification(notification.id)}
          className={`top-${4 + index * 20}`}
        />
      ))}
    </div>
  );
}; 