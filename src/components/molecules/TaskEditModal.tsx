import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { type Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/atoms/Input';
import { PrioritySelector } from '@/components/atoms/PrioritySelector';
import { CategorySelector } from '@/components/atoms/CategorySelector';
import { DatePicker } from '@/components/atoms/DatePicker';
import { DurationInput } from '@/components/atoms/DurationInput';
import { Button } from '@/components/atoms/Button';
import { TaskTimer } from './TaskTimer';
import { TaskExecutionHistory } from './TaskExecutionHistory';
import { FaTimes, FaSave, FaEdit, FaTrash, FaCheck, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { TASK_CONSTANTS } from '@/lib/constants';
import { toJSTDateString } from '@/lib/timeUtils';
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
      is_habit: task?.is_habit || false,
    habit_frequency: task?.habit_frequency || undefined,
    status: 'todo' as const,
    start_date: data.startDate ? toJSTDateString(data.startDate) : null,
    due_date: data.dueDate ? toJSTDateString(data.dueDate) : null,
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
      selectedDate={selectedDate}
    />
  );
}; 