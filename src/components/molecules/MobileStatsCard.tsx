import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

interface MobileStatsCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  subtitle: string;
  onClick: () => void;
  progress?: number; // 0-100のパーセンテージ
}

export const MobileStatsCard: React.FC<MobileStatsCardProps> = ({
  title,
  icon,
  value,
  subtitle,
  onClick,
  progress
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-blue-600">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              {title}
            </h3>
          </div>
        </div>
        {React.createElement(FaChevronRight as React.ComponentType<any>, { 
          className: "w-4 h-4 text-gray-400" 
        })}
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">
          {value}
        </div>
        <div className="text-xs text-gray-600">
          {subtitle}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300 bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}; 