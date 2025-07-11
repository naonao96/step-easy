import React from 'react';
import { Task } from '@/types/task';
import { BaseTaskModal } from './BaseTaskModal';

interface TaskPreviewModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onRefresh: () => void;
  isMobile?: boolean;
}

export const TaskPreviewModal: React.FC<TaskPreviewModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onComplete,
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
  }) => ({
    title: data.title.trim(),
    description: data.content,
    priority: data.priority,
    is_habit: task.is_habit || false,
    habit_frequency: task.habit_frequency || 'daily',
    status: 'todo' as const,
    start_date: data.startDate ? data.startDate.toISOString().split('T')[0] : null,
    due_date: data.dueDate ? data.dueDate.toLocaleDateString('sv-SE') : null,
    estimated_duration: data.estimatedDuration,
    category: data.category
  });

  return (
    <BaseTaskModal
      isOpen={isOpen}
      onClose={onClose}
      initialData={task}
      onDelete={async (id: string) => onDelete(id)}
      onComplete={async (id: string) => onComplete(id)}
      onEdit={onEdit}
      onRefresh={onRefresh}
      mode="preview"
      isHabit={task.is_habit}
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
      modalTitle="プレビュー"
      createFormData={createTaskFormData}
      isMobile={isMobile}
    />
  );
}; 