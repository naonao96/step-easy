import React from 'react';
import { Task } from '@/types/task';
import { BaseTaskModal } from './BaseTaskModal';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPreview: (task: Task) => void;
  onRefresh: () => void;
  isMobile?: boolean;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onPreview,
  onRefresh,
  isMobile = false
}) => {
  const createTaskFormData = (data: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    startDate: Date | null;
    dueDate: Date | null;
    estimatedDuration: number | undefined;
    category: string;
  }) => {
    const taskData: any = {
      title: data.title.trim(),
      description: data.content.trim(),
      priority: data.priority,
      category: data.category,
      is_habit: task?.is_habit || false,
      start_date: data.startDate?.toISOString().split('T')[0],
      estimated_duration: data.estimatedDuration,
    };

    if (data.dueDate) {
      taskData.due_date = data.dueDate.toISOString().split('T')[0];
    }

    if (task?.is_habit) {
      taskData.habit_frequency = task.habit_frequency;
    }

    return taskData;
  };

  return (
    <BaseTaskModal
      isOpen={isOpen}
      onClose={onClose}
      initialData={task || undefined}
      onSave={onSave}
      onDelete={onDelete}
      onPreview={onPreview}
      onRefresh={onRefresh}
      mode="edit"
      isHabit={task?.is_habit || false}
      titlePlaceholder="タスクのタイトルを入力"
      contentPlaceholder={`# メモ

## 今日やること
- [ ] タスク1
- [ ] タスク2

## メモ
**重要**: 
*参考*: 

---

Markdownで自由に書けます！`}
      modalTitle="編集"
      createFormData={createTaskFormData}
      isMobile={isMobile}
    />
  );
}; 