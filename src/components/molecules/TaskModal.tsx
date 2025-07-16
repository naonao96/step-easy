import React, { forwardRef } from 'react';
import { type Task } from '@/types/task';
import { BaseTaskModal } from './BaseTaskModal';
import { toJSTDateString } from '@/lib/timeUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Task>;
  onSave?: (task: Task) => void;
  mode?: 'create' | 'edit' | 'preview';
  isMobile?: boolean;
  onRequestClose?: () => void;
}

export const TaskModal = forwardRef<{ closeWithValidation: () => void }, TaskModalProps>(({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode = 'create',
  isMobile = false,
  onRequestClose
}, ref) => {
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
    is_habit: false, // 通常タスクは常にfalse
    habit_frequency: undefined, // 通常タスクは習慣頻度なし
    status: 'todo' as const,
    start_date: data.startDate ? toJSTDateString(data.startDate) : null,
    due_date: data.dueDate ? toJSTDateString(data.dueDate) : null,
    estimated_duration: data.estimatedDuration,
    category: data.category
  });

  return (
    <BaseTaskModal
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      initialData={initialData}
      onSave={onSave}
      mode={mode}
      isHabit={false}
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
      modalTitle="新規作成"
      createFormData={createTaskFormData}
      isMobile={isMobile}
      onRequestClose={onRequestClose}
    />
  );
}); 