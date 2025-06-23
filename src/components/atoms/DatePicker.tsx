'use client';

import React, { forwardRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { ja } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

// 日本語ロケールを登録
registerLocale('ja', ja);

interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  helpText?: string;
  error?: string;
  className?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
}

// カスタムインプットコンポーネント
const CustomInput = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, onChange, onClear, placeholder, disabled, error, ...props }, ref) => (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        value={value}
        onClick={onClick}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        className={`
          w-full pl-10 pr-10 py-2.5 text-sm
          border rounded-lg
          transition-all duration-200
          cursor-pointer
          ${disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
            : error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50'
            : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/20 bg-white hover:bg-gray-50'
          }
          ${!disabled && 'focus:ring-4'}
        `}
      />
      
      {/* カレンダーアイコン */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {FaCalendarAlt ({className:`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`})}
      </div>
      
      {/* クリアボタン */}
      {value && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {FaTimes ({className:"w-3 h-3"})} 
        </button>
      )}
    </div>
  )
);

CustomInput.displayName = 'CustomInput';

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  placeholderText = "日付を選択...",
  minDate,
  maxDate,
  disabled = false,
  required = false,
  label,
  helpText,
  error,
  className = "",
  showTimeSelect = false,
  dateFormat = showTimeSelect ? "yyyy/MM/dd HH:mm" : "yyyy/MM/dd",
  ...props
}) => {

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {/* ラベル */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 日付ピッカー */}
      <ReactDatePicker
        {...props}
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        placeholderText={placeholderText}
        dateFormat={dateFormat}
        showTimeSelect={showTimeSelect}
        timeFormat="HH:mm"
        timeIntervals={15}
        customInput={
          <CustomInput 
            onClear={handleClear}
            error={error}
          />
        }
        popperClassName="z-50"
        calendarClassName="shadow-lg border-0 rounded-xl"
        dayClassName={(date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          date.setHours(0, 0, 0, 0);
          
          if (date.getTime() === today.getTime()) {
            return "bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200";
          }
          return "hover:bg-blue-50 transition-colors duration-150";
        }}
        weekDayClassName={() => "text-gray-600 text-xs font-medium"}
        monthClassName={() => "text-lg font-semibold text-gray-900"}
        timeClassName={() => "text-sm"}
        showPopperArrow={false}
        fixedHeight
        locale="ja"
        todayButton="今日"
      />

      {/* ヘルプテキスト・エラーメッセージ */}
      {(helpText || error) && (
        <p className={`text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helpText}
        </p>
      )}
    </div>
  );
};

export default DatePicker; 