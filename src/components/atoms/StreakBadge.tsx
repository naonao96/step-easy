import React from 'react';
import { Task } from '@/types/task';
import { getStreakStatus, getTimeRemaining } from '@/lib/streakUtils';

interface StreakBadgeProps {
  task: Task;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  showTimeRemaining?: boolean;
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  task,
  size = 'md',
  showIcon = true,
  showText = true,
  showTimeRemaining = false,
  className = ''
}) => {
  const streak = task.current_streak || 0;
  const status = getStreakStatus(task);
  const timeRemaining = showTimeRemaining ? getTimeRemaining(task) : null;

  // ストリークが0の場合は表示しない
  if (streak === 0) return null;

  // サイズに応じたスタイル
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1'
  };

  // ストリーク状態に応じたスタイルとアイコン
  const getStatusStyle = (status: string, streakCount: number) => {
    switch (status) {
      case 'expired':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          icon: '💀',
          borderColor: 'border-gray-300'
        };
      case 'at-risk':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: '⚠️',
          borderColor: 'border-yellow-300'
        };
      case 'active':
        // アクティブな場合は継続日数に応じて色分け
        if (streakCount >= 30) {
          return {
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            icon: '👑',
            borderColor: 'border-purple-300'
          };
        } else if (streakCount >= 14) {
          return {
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            icon: '🔥',
            borderColor: 'border-red-300'
          };
        } else if (streakCount >= 7) {
          return {
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            icon: '🔥',
            borderColor: 'border-orange-300'
          };
        } else if (streakCount >= 3) {
          return {
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            icon: '⚡',
            borderColor: 'border-yellow-300'
          };
        } else {
          return {
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            icon: '✨',
            borderColor: 'border-green-300'
          };
        }
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          icon: '📊',
          borderColor: 'border-gray-300'
        };
    }
  };

  const style = getStatusStyle(status, streak);

  return (
    <div className={`
      ${sizeClasses[size]}
      ${style.bgColor} ${style.textColor}
      rounded-full font-medium
      flex items-center gap-1
      border ${style.borderColor}
      ${className}
    `}>
      {showIcon && <span>{style.icon}</span>}
      <span>{streak}</span>
      {showText && size !== 'sm' && <span>日連続</span>}
      {showText && size === 'sm' && <span className="hidden sm:inline">日連続</span>}
      
      {/* 状態表示 */}
      {status === 'expired' && size !== 'sm' && (
        <span className="text-xs opacity-75">(期限切れ)</span>
      )}
      {status === 'at-risk' && timeRemaining && size !== 'sm' && (
        <span className="text-xs opacity-75">({timeRemaining})</span>
      )}
      
      {/* 残り時間表示（独立表示） */}
      {showTimeRemaining && timeRemaining && status !== 'expired' && (
        <span className="text-xs opacity-75 ml-1">
          {timeRemaining}
        </span>
      )}
    </div>
  );
}; 