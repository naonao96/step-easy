import React from 'react';
import { DEFAULT_CATEGORIES } from '@/types/task';

interface CategorySelectorProps {
  value?: string;
  onChange: (category: string) => void;
  label?: string;
  className?: string;
  required?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  value = 'other',
  onChange,
  label = 'カテゴリ',
  className = '',
  required = false
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {DEFAULT_CATEGORIES.map(category => {
          const isSelected = value === category.id;
          
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className={`
                flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <span className="text-lg">{category.icon}</span>
              <div className="text-left flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {category.name}
                </div>
                {category.description && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {category.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 