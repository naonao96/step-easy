import React from 'react';
import { Badge, BADGE_DESIGN_SPECS } from '@/types/badge';
import { FaCrown, FaStar, FaGem } from 'react-icons/fa';

interface AchievementBadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  badge,
  size = 'md',
  showName = false,
  showProgress = false,
  onClick,
  className = ''
}) => {
  const sizeClasses = BADGE_DESIGN_SPECS.sizes[size];
  const colors = badge.colorScheme;

  // レベル別の装飾要素
  const getLevelDecoration = (level: string) => {
    switch (level) {
      case 'diamond':
        return FaGem({className:"absolute -top-1 -right-1 w-3 h-3 text-blue-400 animate-pulse"});
      case 'platinum':
        return FaCrown({className:"absolute -top-1 -right-1 w-3 h-3 text-gray-400"});
      case 'gold':
        return FaStar({className:"absolute -top-1 -right-1 w-3 h-3 text-yellow-400"});
      default:
        return null;
    }
  };

  // 木枠風の背景スタイル
  const getWoodFrameStyle = () => {
    if (badge.isUnlocked) {
      return `
        bg-gradient-to-br from-amber-50 to-amber-100
        border-2 border-amber-300
        shadow-lg
        hover:shadow-xl
        transition-all duration-300
        hover:scale-105
      `;
    } else {
      return `
        bg-gradient-to-br from-gray-100 to-gray-200
        border-2 border-gray-300
        opacity-60
        filter grayscale
      `;
    }
  };

  // バッジのメインスタイル
  const getBadgeStyle = () => {
    if (badge.isUnlocked) {
      return `
        bg-gradient-to-br from-${colors.primary} to-${colors.secondary}
        border-2 border-${colors.border}
        shadow-md
        text-${colors.text}
      `;
    } else {
      return `
        bg-gradient-to-br from-gray-300 to-gray-400
        border-2 border-gray-500
        text-gray-600
      `;
    }
  };

  return (
    <div 
      className={`
        relative inline-flex flex-col items-center
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* 木枠風コンテナ */}
      <div className={`
        relative p-2 rounded-xl
        ${getWoodFrameStyle()}
        ${onClick ? 'hover:bg-gradient-to-br hover:from-amber-100 hover:to-amber-200' : ''}
      `}>
        {/* バッジ本体 */}
        <div className={`
          ${sizeClasses}
          rounded-full
          flex items-center justify-center
          font-bold
          ${getBadgeStyle()}
          relative
          transition-all duration-300
        `}>
          <span className="text-lg">{badge.icon}</span>
          
          {/* レベル装飾 */}
          {getLevelDecoration(badge.level)}
          
          {/* ロック状態のオーバーレイ */}
          {!badge.isUnlocked && (
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🔒</span>
            </div>
          )}
        </div>
        
        {/* 木目テクスチャ効果 */}
        <div className="absolute inset-0 rounded-xl opacity-10 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-amber-200 to-transparent rounded-xl" />
        </div>
      </div>

      {/* バッジ名 */}
      {showName && (
        <div className="mt-2 text-center">
          <div className={`text-xs font-medium ${
            badge.isUnlocked ? 'text-gray-800' : 'text-gray-500'
          }`}>
            {badge.name}
          </div>
          {showProgress && badge.progress !== undefined && (
            <div className="mt-1 w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300"
                style={{ width: `${badge.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// バッジコレクション表示用コンポーネント
interface BadgeCollectionProps {
  badges: Badge[];
  title?: string;
  showProgress?: boolean;
  onBadgeClick?: (badge: Badge) => void;
  className?: string;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  badges,
  title,
  showProgress = false,
  onBadgeClick,
  className = ''
}) => {
  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const totalCount = badges.length;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-600">
            {unlockedCount}/{totalCount} 獲得
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {badges.map((badge) => (
          <AchievementBadge
            key={badge.id}
            badge={badge}
            size="md"
            showName={true}
            showProgress={showProgress}
            onClick={() => onBadgeClick?.(badge)}
          />
        ))}
      </div>
      
      {/* 進捗バー */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>進捗</span>
          <span>{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}; 