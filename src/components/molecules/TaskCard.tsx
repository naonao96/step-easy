import React from 'react';
import { Task } from '@/stores/taskStore';
import { Button } from '../atoms/Button';
import { FaEdit, FaTrash, FaCheck } from 'react-icons/fa';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onComplete,
}) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    doing: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
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

      <p className="text-gray-600 mb-4">{task.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-sm ${priorityColors[task.priority]}`}>
          {task.priority === 'low' ? '低' : task.priority === 'medium' ? '中' : '高'}
        </span>
        <span className={`px-2 py-1 rounded-full text-sm ${statusColors[task.status]}`}>
          {task.status === 'todo' ? '未着手' : task.status === 'doing' ? '進行中' : '完了'}
        </span>
        {task.due_date && (
          <span className="px-2 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
            期限: {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.status !== 'done' && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onComplete(task.id)}
          leftIcon={FaCheck}
          fullWidth
        >
          完了にする
        </Button>
      )}
    </div>
  );
}; 