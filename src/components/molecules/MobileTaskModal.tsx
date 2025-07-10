import React from 'react';
import { Task } from '@/stores/taskStore';
import { BaseTaskModal } from './BaseTaskModal';

interface MobileTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'preview';
  task?: Task;
  isHabit?: boolean;
  onSave?: (task: Partial<Task>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
}

export const MobileTaskModal: React.FC<MobileTaskModalProps> = ({
  isOpen,
  onClose,
  mode,
  task,
  isHabit = false,
  onSave,
  onDelete,
  onComplete
}) => {
  // createFormData関数の実装
  const createFormData = (data: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    startDate: Date | null;
    dueDate: Date | null;
    estimatedDuration: number | undefined;
    category: string;
  }) => ({
    title: data.title,
    description: data.content,
    priority: data.priority,
    is_habit: isHabit,
    status: 'todo' as const,
    start_date: data.startDate?.toISOString() || null,
    due_date: data.dueDate?.toISOString() || null,
    estimated_duration: data.estimatedDuration,
    category: data.category,
  });

  return (
    <BaseTaskModal
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      initialData={task}
      isHabit={isHabit}
      onSave={onSave}
      onDelete={onDelete}
      onComplete={onComplete}
      createFormData={createFormData}
      // モバイル版専用のスタイル設定
      className="mobile-modal"
      overlayClassName="mobile-overlay"
      contentClassName="mobile-content"
      // モバイル版ではフルスクリーンモーダルを使用
      isFullScreen={true}
      // モバイル版ではスワイプで閉じる機能を有効化
      enableSwipeToClose={true}
    />
  );
}; 