import React from 'react';
import { Task } from '@/types/task';
import { Button } from '../atoms/Button';
import { StreakBadge } from '../atoms/StreakBadge';
import { CategoryBadge } from '../atoms/CategoryBadge';
import { FaEdit, FaTrash, FaCheck, FaChevronRight } from 'react-icons/fa';
import { PRIORITY_LABELS } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';

interface TaskCardMobileProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onTap?: (task: Task) => void;
}

export const TaskCardMobile: React.FC<TaskCardMobileProps> = ({
  task,
  onEdit,
  onDelete,
  onComplete,
  onTap,
}) => {
  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    doing: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  };

  // 優先度ラベルの取得
  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const priorityData = PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS];
    if (!priorityData) return null;
    
    return (
      <span 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: priorityData.color + '20', 
          color: priorityData.color 
        }}
      >
        {priorityData.icon} {priorityData.name}
      </span>
    );
  };

  const handleCardTap = () => {
    if (onTap) {
      onTap(task);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* メインタップエリア */}
      <div 
        onClick={handleCardTap}
        className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
      >
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 leading-tight mb-1">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          {onTap && (
            <FaChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-3" />
          )}
        </div>

        {/* バッジエリア */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* カテゴリバッジ */}
          <CategoryBadge category={task.category} size="sm" />
          
          {/* 優先度バッジ */}
          {getPriorityBadge(task.priority)}
          
          {/* ステータスバッジ */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {task.status === 'todo' ? '未着手' : task.status === 'doing' ? '進行中' : '完了'}
          </span>
          
          {/* 期限バッジ */}
          {task.due_date && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              期限: {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
          
          {/* 予想時間バッジ */}
          {task.estimated_duration && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              ⏱️ {formatDurationShort(task.estimated_duration)}
            </span>
          )}
        </div>

        {/* ストリークバッジ（習慣タスクの場合） */}
        {task.is_habit && (
          <div className="mb-3">
            <StreakBadge task={task} size="sm" />
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="px-4 pb-4 border-t border-gray-50">
        <div className="flex gap-2">
          {/* 完了ボタン */}
          {task.status !== 'done' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id);
              }}
              leftIcon={FaCheck}
              className="flex-1 min-h-[44px] text-sm"
            >
              完了
            </Button>
          )}
          
          {/* 編集ボタン */}
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            leftIcon={FaEdit}
            className="min-h-[44px] px-4"
          />
          
          {/* 削除ボタン */}
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            leftIcon={FaTrash}
            className="min-h-[44px] px-4"
          />
        </div>
      </div>
    </div>
  );
}; 