import React from 'react';
import { Button } from '../atoms/Button';
import { FaCheck, FaTrash, FaEdit } from 'react-icons/fa';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onDelete,
  onEdit,
}) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    doing: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(task)}
            leftIcon={FaEdit}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(task.id)}
            leftIcon={FaTrash}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
          {task.priority === 'high' ? '高優先度' : task.priority === 'medium' ? '中優先度' : '低優先度'}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
          {task.status === 'todo' ? '未着手' : task.status === 'doing' ? '進行中' : '完了'}
        </span>
        {task.is_habit && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            習慣
          </span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {task.due_date && (
            <span>期限: {new Date(task.due_date).toLocaleDateString()}</span>
          )}
        </div>
        {task.status !== 'done' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onComplete(task.id)}
            leftIcon={FaCheck}
          >
            完了
          </Button>
        )}
      </div>
    </div>
  );
}; 