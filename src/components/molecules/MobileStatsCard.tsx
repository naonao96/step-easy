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
      className="w-full p-4 rounded-lg border border-[#deb887] bg-[#faf8f0] hover:shadow-md hover:border-[#cd853f] transition-all duration-200 text-left wood-frame"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-[#7c5a2a]">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#8b4513]">
              {title}
            </h3>
          </div>
        </div>
        {React.createElement(FaChevronRight as React.ComponentType<any>, { 
          className: "w-4 h-4 text-[#7c5a2a]" 
        })}
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-[#8b4513]">
          {value}
        </div>
        <div className="text-xs text-[#7c5a2a]">
          {subtitle}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-[#deb887] rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300 bg-[#7c5a2a]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}; 