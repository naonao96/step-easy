import React from 'react';
import { Button } from '../atoms/Button';
import { FaRobot, FaCheck, FaTimes } from 'react-icons/fa';

interface AISuggestionCardProps {
  title: string;
  description: string;
  type: 'task' | 'habit' | 'improvement';
  onAccept: () => void;
  onReject: () => void;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
  title,
  description,
  type,
  onAccept,
  onReject,
}) => {
  const typeColors = {
    task: 'bg-blue-100 text-blue-800',
    habit: 'bg-purple-100 text-purple-800',
    improvement: 'bg-green-100 text-green-800',
  };

  const typeLabels = {
    task: 'タスク提案',
    habit: '習慣提案',
    improvement: '改善提案',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="w-6 h-6 text-blue-600">{FaRobot({})}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
              {typeLabels[type]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <div className="flex space-x-3">
            <Button
              variant="primary"
              size="sm"
              onClick={onAccept}
              leftIcon={() => <span>{FaCheck({})}</span>}
            >
              採用する
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onReject}
              leftIcon={() => <span>{FaTimes({})}</span>}
            >
              却下
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 