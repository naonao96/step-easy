import React from 'react';
import { FaSearch, FaFilter, FaSort } from 'react-icons/fa';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  showHabitsOnly: boolean;
  onHabitsFilterChange: (show: boolean) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortChange,
  showHabitsOnly,
  onHabitsFilterChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 検索 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="h-4 w-4 text-gray-400">
              {FaSearch({})}
            </span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="タスクを検索..."
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* ステータスフィルター */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="h-4 w-4 text-gray-400">
              {FaFilter({})}
            </span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">すべてのステータス</option>
            <option value="todo">未着手</option>
            <option value="doing">進行中</option>
            <option value="done">完了</option>
          </select>
        </div>

        {/* 優先度フィルター */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="h-4 w-4 text-gray-400">
              {FaFilter({})}
            </span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">すべての優先度</option>
            <option value="high">高優先度</option>
            <option value="medium">中優先度</option>
            <option value="low">低優先度</option>
          </select>
        </div>

        {/* ソート */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="h-4 w-4 text-gray-400">
              {FaSort({})}
            </span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="due_date_asc">期限が近い順</option>
            <option value="due_date_desc">期限が遠い順</option>
            <option value="priority_desc">優先度が高い順</option>
            <option value="priority_asc">優先度が低い順</option>
            <option value="created_at_desc">作成日が新しい順</option>
            <option value="created_at_asc">作成日が古い順</option>
          </select>
        </div>
      </div>

      {/* 習慣フィルター */}
      <div className="mt-4 flex items-center">
        <input
          type="checkbox"
          id="habitsOnly"
          checked={showHabitsOnly}
          onChange={(e) => onHabitsFilterChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="habitsOnly" className="ml-2 block text-sm text-gray-700">
          習慣タスクのみ表示
        </label>
      </div>
    </div>
  );
}; 