import React from 'react';
import { Task } from '@/types/task';
import { Button } from '../atoms/Button';
import { StreakBadge } from '../atoms/StreakBadge';
import { CategoryBadge } from '../atoms/CategoryBadge';
import { FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import { PRIORITY_LABELS } from '@/types/task';
import { formatDurationShort } from '@/lib/timeUtils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onTaskClick?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onComplete,
  onTaskClick,
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
        className="px-2 py-1 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: priorityData.color + '20', 
          color: priorityData.color 
        }}
      >
        {priorityData.icon} {priorityData.name}
      </span>
    );
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onTaskClick ? () => onTaskClick(task) : undefined}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            leftIcon={FaEdit}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            leftIcon={FaTrash}
          />
        </div>
      </div>

      {task.description && (
        <p className="text-gray-600 mb-4">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {/* カテゴリバッジ */}
        <CategoryBadge category={task.category} size="sm" />
        
        {/* 優先度バッジ */}
        {getPriorityBadge(task.priority)}
        
        {/* ステータスバッジ */}
        <span className={`px-2 py-1 rounded-full text-sm ${statusColors[task.status]}`}>
          {task.status === 'todo' ? '未着手' : task.status === 'doing' ? '進行中' : '完了'}
        </span>
        
        {/* 期限バッジ */}
        {task.due_date && (
          <span className="px-2 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
            期限: {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
        
        {/* 予想時間バッジ */}
        {task.estimated_duration && (
          <span className="px-2 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
            ⏱️ {formatDurationShort(task.estimated_duration)}
          </span>
        )}
        
        {/* ストリークバッジ */}
        <StreakBadge 
          task={task}
          size="sm"
        />
      </div>

      {task.status !== 'done' && (
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          leftIcon={FaCheck}
          fullWidth
        >
          完了にする
        </Button>
      )}
    </div>
  );
}; 