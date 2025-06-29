import React, { forwardRef } from 'react';
import { sanitizeInput, validateTaskInput } from '@/lib/security';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', onValidationChange, onChange, ...props }, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const originalValue = e.target.value;
      
      // セキュリティ: 入力値のサニタイズ
      const sanitizedValue = sanitizeInput(originalValue);
      
      // バリデーション（タスク関連の入力の場合）
      if (props.name === 'title' || props.name === 'description') {
        const validation = validateTaskInput(sanitizedValue);
        onValidationChange?.(validation.isValid, validation.error);
      }
      
      // 元のonChangeを呼び出し（サニタイズされた値で）
      if (onChange) {
        const sanitizedEvent = {
          ...e,
          target: {
            ...e.target,
            value: sanitizedValue
          }
        };
        onChange(sanitizedEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${className}
          `}
          onChange={handleInputChange}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 