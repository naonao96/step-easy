import React from 'react';
import { Button } from '../atoms/Button';
import { IconType } from 'react-icons';

interface MenuItemProps {
  title: string;
  description: string;
  icon: IconType;
  onClick: () => void;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="w-6 h-6 text-blue-600">{Icon({})}</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <Button
            variant="primary"
            size="sm"
            onClick={onClick}
            className="w-full"
          >
            開始する
          </Button>
        </div>
      </div>
    </div>
  );
}; 