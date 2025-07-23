import React, { useState, useEffect } from 'react';
import { type Task } from '@/types/task';
import { type Habit } from '@/types/habit';
import { toDateStringOrNull, toTimestampStringOrNull } from '@/lib/timeUtils';
import { BaseTaskModal } from './BaseTaskModal';
import { isNewHabit } from '@/lib/habitUtils';

interface TaskEditModalProps {
  task: Task | Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Task | Habit) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPreview: (task: Task | Habit) => void;
  onRefresh: () => void;
  isMobile?: boolean;
  selectedDate?: Date;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onPreview,
  onRefresh,
  isMobile = false,
  selectedDate
}) => {
  // 習慣かどうかを判定
  const isHabit = task ? isNewHabit(task) : false;
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
    status: 'todo' as const,
    start_date: toDateStringOrNull(data.startDate), // DATE型用（YYYY-MM-DD）
    due_date: toTimestampStringOrNull(data.dueDate), // TIMESTAMP WITH TIME ZONE型用（ISO文字列）
      estimated_duration: data.estimatedDuration,
    category: data.category
  });

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
      isHabit={isHabit}
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
      selectedDate={selectedDate}
    />
  );
}; 