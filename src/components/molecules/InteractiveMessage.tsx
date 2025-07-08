'use client';

import React from 'react';
import { InteractiveMessage as InteractiveMessageType, MessageOption } from '@/types/message';
import { Button } from '@/components/atoms/Button';

interface InteractiveMessageProps {
  message: InteractiveMessageType;
  onOptionSelect: (option: MessageOption) => void;
  className?: string;
}

export const InteractiveMessage: React.FC<InteractiveMessageProps> = ({
  message,
  onOptionSelect,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 ${className}`}>
      {/* メッセージテキスト */}
      <div className="mb-4">
        <p className="text-gray-800 text-sm leading-relaxed">
          {message.text}
        </p>
      </div>

      {/* インタラクティブオプション */}
      {message.options && message.options.length > 0 && (
        <div className="space-y-2">
          {message.options.map((option) => (
            <Button
              key={option.id}
              onClick={() => onOptionSelect(option)}
              variant="outline"
              size="sm"
              className={`w-full justify-start text-left ${
                option.color === 'primary' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' :
                option.color === 'success' ? 'border-green-200 text-green-700 hover:bg-green-50' :
                option.color === 'warning' ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50' :
                'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.icon && <span className="mr-2">{option.icon}</span>}
              {option.text}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}; 