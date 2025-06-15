import React, { ChangeEvent } from 'react';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean;
  className?: string;
  required?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  multiline = false,
  className = '',
  required = false,
  placeholder = '',
  name,
  id,
}) => {
  const inputClasses = `w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={inputClasses}
          required={required}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className={inputClasses}
          required={required}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}; 