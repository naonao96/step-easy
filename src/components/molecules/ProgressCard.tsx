import React from 'react';

interface ProgressCardProps {
  title: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  total,
  icon,
  color,
  description,
}) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className={`text-2xl ${color}`}>{icon}</div>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{value} / {total}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
}; 