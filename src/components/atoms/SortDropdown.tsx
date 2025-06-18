import React from 'react';
import { FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

export type SortOption = 
  | 'default'          // デフォルト（未完了優先 + 優先度順）
  | 'priority_desc'    // 優先度（高→低）
  | 'priority_asc'     // 優先度（低→高）
  | 'streak_desc'      // 継続日数（長い順）
  | 'streak_asc'       // 継続日数（短い順）
  | 'due_date_asc'     // 期限日（近い順）
  | 'due_date_desc'    // 期限日（遠い順）
  | 'created_desc'     // 作成日時（新しい順）
  | 'created_asc'      // 作成日時（古い順）
  | 'title_asc'        // タイトル（あいうえお順）
  | 'title_desc';      // タイトル（逆順）

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
  className?: string;
}

const sortOptions: { value: SortOption; label: string; icon?: React.ReactNode }[] = [
  { value: 'default', label: 'デフォルト', icon: FaSort ({className:"w-3 h-3" })},
  { value: 'priority_desc', label: '優先度（高い順）', icon: FaSortAmountDown ({className:"w-3 h-3" })},
  { value: 'priority_asc', label: '優先度（低い順）', icon: FaSortAmountUp  ({className:"w-3 h-3" })},
  { value: 'streak_desc', label: '継続日数（長い順）', icon: FaSortAmountDown  ({className:"w-3 h-3" })},
  { value: 'streak_asc', label: '継続日数（短い順）', icon: FaSortAmountUp  ({className:"w-3 h-3" })},
  { value: 'due_date_asc', label: '期限日（近い順）', icon: FaSortAmountUp  ({className:"w-3 h-3" })},
  { value: 'due_date_desc', label: '期限日（遠い順）', icon: FaSortAmountDown  ({className:"w-3 h-3" })},
  { value: 'created_desc', label: '作成日時（新しい順）', icon: FaSortAmountDown  ({className:"w-3 h-3" })},
  { value: 'created_asc', label: '作成日時（古い順）', icon: FaSortAmountUp  ({className:"w-3 h-3" })},
  { value: 'title_asc', label: 'あいうえお順', icon: FaSortAmountUp  ({className:"w-3 h-3" })},
  { value: 'title_desc', label: 'あいうえお順（逆）', icon: FaSortAmountDown  ({className:"w-3 h-3" })},
];

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const currentOption = sortOptions.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="
          appearance-none bg-white border border-gray-300 rounded-lg
          px-3 py-2 pr-8 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          hover:border-gray-400 transition-colors
          cursor-pointer
        "
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* カスタム矢印アイコン */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <div className="text-gray-400">
          {currentOption?.icon || FaSort  ({className:"w-3 h-3" })}
        </div>
      </div>
    </div>
  );
}; 