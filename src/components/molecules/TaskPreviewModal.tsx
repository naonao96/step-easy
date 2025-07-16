import React, { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
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
import { isNewHabit } from '@/lib/habitUtils';
import { toJSTDateString } from '@/lib/timeUtils';
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
  selectedDate?: Date;
}

export const TaskPreviewModal: React.FC<TaskPreviewModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onComplete,
  onRefresh,
  isMobile = false,
  selectedDate
}) => {
  const { habitCompletions } = useHabitStore();
  const [localCompletionStatus, setLocalCompletionStatus] = useState<'done' | 'todo' | 'doing' | null>(null);
  
  // 習慣の完了状態を正しく判定（リアルタイム + ローカル状態）
  const getTaskStatus = () => {
    // ローカル状態が設定されている場合はそれを優先
    if (localCompletionStatus !== null) {
      return localCompletionStatus;
    }
    
    if (isNewHabit(task)) {
      // 新しい習慣テーブルの習慣の場合：habitCompletionsからリアルタイムで判定
      const targetDate = selectedDate || new Date();
      const japanTime = new Date(targetDate.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const dateString = japanTime.toISOString().split('T')[0];
      
      const isCompleted = habitCompletions.some(
        completion => completion.habit_id === task.id && completion.completed_date === dateString
      );
      return isCompleted ? 'done' : 'todo';
    } else {
      // 既存のタスクテーブルの習慣または通常のタスクの場合
      return task.status;
    }
  };
  
  // 完了状態を反映したタスクデータを作成
  const taskWithCorrectStatus = {
    ...task,
    status: getTaskStatus()
  };
  
  // 楽観的更新付きの完了処理
  const handleCompleteWithOptimisticUpdate = async (id: string) => {
    // 現在の状態を取得
    const currentStatus = getTaskStatus();
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    
    // 即座にローカル状態を更新（楽観的更新）
    setLocalCompletionStatus(newStatus);
    
    try {
      await onComplete(id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('完了処理エラー:', error);
      // エラーが発生した場合は元の状態に戻す
      setLocalCompletionStatus(currentStatus);
      alert('完了処理に失敗しました');
    }
  };
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
    start_date: data.startDate ? toJSTDateString(data.startDate) : null,
    due_date: data.dueDate ? toJSTDateString(data.dueDate) : null,
    estimated_duration: data.estimatedDuration,
    category: data.category
  });

  // モーダルが閉じられた時にローカル状態をリセット
  const handleClose = () => {
    setLocalCompletionStatus(null);
    onClose();
  };

  return (
    <BaseTaskModal
      isOpen={isOpen}
      onClose={handleClose}
      initialData={taskWithCorrectStatus}
      onDelete={async (id: string) => onDelete(id)}
      onComplete={handleCompleteWithOptimisticUpdate}
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
      selectedDate={selectedDate}
    />
  );
}; 