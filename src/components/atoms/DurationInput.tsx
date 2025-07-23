import React, { useState, useEffect } from 'react';
import { FaClock, FaCalendarDay } from 'react-icons/fa';
import { formatDuration } from '@/lib/timeUtils';

interface DurationInputProps {
  value?: number; // 分単位での値
  onChange: (minutes: number | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  label = "予想所要時間",
  placeholder,
  disabled = false,
  className = ""
}) => {
  // 内部状態：時間と分を別々に管理
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [inputMode, setInputMode] = useState<'preset' | 'custom'>('preset');

  // プリセット選択肢（分単位）
  const presets = [
    { label: '15分', value: 15, icon: '⚡' },
    { label: '30分', value: 30, icon: '🔥' },
    { label: '1時間', value: 60, icon: '⏰' },
    { label: '2時間', value: 120, icon: '📚' },
    { label: '半日', value: 240, icon: '🌅' },
    { label: '1日', value: 480, icon: '🌞' }, // 8時間
    { label: '数日', value: 1440, icon: '📅' }, // 24時間
  ];

  // 外部値の変更を内部状態に反映
  useEffect(() => {
    if (value !== undefined) {
      const h = Math.floor(value / 60);
      const m = value % 60;
      setHours(h);
      setMinutes(m);
      
      // プリセットに一致するかチェック
      const matchingPreset = presets.find(p => p.value === value);
      if (matchingPreset) {
        setInputMode('preset');
      } else {
        setInputMode('custom');
      }
    } else {
      setHours(0);
      setMinutes(0);
      setInputMode('preset');
    }
  }, [value]);

  // 内部状態の変更を外部に通知
  const updateValue = (newHours: number, newMinutes: number) => {
    const totalMinutes = newHours * 60 + newMinutes;
    if (totalMinutes === 0) {
      onChange(undefined);
    } else {
      onChange(totalMinutes);
    }
  };

  // プリセット選択
  const handlePresetSelect = (presetValue: number) => {
    const h = Math.floor(presetValue / 60);
    const m = presetValue % 60;
    setHours(h);
    setMinutes(m);
    setInputMode('preset');
    onChange(presetValue);
  };

  // カスタム時間入力
  const handleHoursChange = (newHours: number) => {
    setHours(newHours);
    setInputMode('custom');
    updateValue(newHours, minutes);
  };

  const handleMinutesChange = (newMinutes: number) => {
    setMinutes(newMinutes);
    setInputMode('custom');
    updateValue(hours, newMinutes);
  };



  return (
    <div className={`space-y-4 ${className}`}>
      {/* ラベル - 外部から指定された場合のみ表示 */}
      {label && (
        <div className="flex items-center gap-2">
          {FaClock ({className:"w-4 h-4 text-gray-500"})}
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        </div>
      )}

      {/* プリセット選択 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetSelect(preset.value)}
            disabled={disabled}
            className={`
              relative px-3 py-3 rounded-lg border text-sm font-medium transition-all duration-200
              ${value === preset.value && inputMode === 'preset'
                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">{preset.icon}</span>
              <span className="text-xs">{preset.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* カスタム入力 */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">カスタム設定</span>
          {inputMode === 'custom' && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              選択中
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* 時間入力 */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={hours}
              onChange={(e) => handleHoursChange(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={disabled}
              min="0"
              max="168" // 1週間
              className="w-16 px-2 py-2 text-center border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-600">時間</span>
          </div>

          {/* 分入力 */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={minutes}
              onChange={(e) => handleMinutesChange(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              disabled={disabled}
              min="0"
              max="59"
              className="w-16 px-2 py-2 text-center border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-600">分</span>
          </div>
        </div>
      </div>

      {/* 選択中の時間を見やすく表示 */}
      {value && value > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            {FaCalendarDay ({className:"w-4 h-4 text-blue-600"})}
            <span className="text-sm font-medium text-blue-900">
              設定時間: {formatDuration(value)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            disabled={disabled}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            クリア
          </button>
        </div>
      )}

      {/* ヘルプテキスト */}
      <p className="text-xs text-gray-500">
        プリセットから選ぶか、カスタム設定で詳細な時間を入力できます
      </p>
    </div>
  );
}; 