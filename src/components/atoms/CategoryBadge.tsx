import React from 'react';
import { DEFAULT_CATEGORIES } from '@/types/task';

interface CategoryBadgeProps {
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category = 'other', 
  size = 'md',
  showIcon = true,
  showText = true,
  className = ''
}) => {
  const categoryData = DEFAULT_CATEGORIES.find(c => c.id === category) || DEFAULT_CATEGORIES[5]; // default to 'other'
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const baseClasses = `inline-flex items-center gap-1 rounded-full font-medium transition-colors ${sizeClasses[size]} ${className}`;
  
  // カテゴリ色に基づいたスタイリング
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3B82F6': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      '#10B981': 'bg-green-100 text-green-800 hover:bg-green-200',
      '#8B5CF6': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      '#F59E0B': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      '#EF4444': 'bg-red-100 text-red-800 hover:bg-red-200',
      '#6B7280': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };
  
  return (
    <span className={`${baseClasses} ${getColorClasses(categoryData.color)}`}>
      {showIcon && <span>{categoryData.icon}</span>}
      {showText && <span>{categoryData.name}</span>}
    </span>
  );
}; 