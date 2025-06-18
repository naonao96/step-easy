import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      container: 'h-5 w-9',
      thumb: 'h-3 w-3',
      translate: 'translate-x-4'
    },
    md: {
      container: 'h-6 w-11',
      thumb: 'h-4 w-4',
      translate: 'translate-x-5'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex ${currentSize.container} items-center rounded-full 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
        focus:ring-green-500 focus:ring-offset-2 touch-manipulation
        ${checked 
          ? 'bg-green-500' 
          : 'bg-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`
          ${currentSize.thumb} transform rounded-full bg-white shadow-md ring-0 
          transition-transform duration-200 ease-in-out
          ${checked ? currentSize.translate : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}; 