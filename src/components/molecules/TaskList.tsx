import React from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onTaskClick?: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onTaskClick,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">タスクがありません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task as any}
          onEdit={onEdit as any}
          onDelete={onDelete}
          onComplete={onComplete}
          onTaskClick={onTaskClick as any}
        />
      ))}
    </div>
  );
}; 