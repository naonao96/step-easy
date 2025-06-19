import React from 'react';
import { PRIORITY_LABELS } from '@/types/task';

interface PrioritySelectorProps {
  value?: string;
  onChange: (priority: string) => void;
  label?: string;
  className?: string;
  required?: boolean;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({ 
  value = 'medium',
  onChange,
  label = '優先度',
  className = '',
  required = false
}) => {
  const priorities = Object.entries(PRIORITY_LABELS);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex gap-2">
        {priorities.map(([key, priorityData]) => {
          const isSelected = value === key;
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 flex-1
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <span className="text-lg">{priorityData.icon}</span>
              <div className="text-left">
                <div className="font-medium text-sm text-gray-900">
                  {priorityData.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 