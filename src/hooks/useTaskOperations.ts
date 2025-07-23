import { useState } from 'react';
import { Task } from '@/types/task';

interface UseTaskOperationsProps {
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onTaskUpdate?: () => Promise<void>;
}

export const useTaskOperations = ({
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  onTaskUpdate
}: UseTaskOperationsProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskPreviewModal, setShowTaskPreviewModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);

  // タスククリック時の処理
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskPreviewModal(true);
  };

  // タスク削除処理
  const handleDeleteTask = async (id: string) => {
    try {
      await onDeleteTask(id);
      setShowTaskPreviewModal(false);
      setShowTaskEditModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('タスク削除エラー:', error);
      alert('タスクの削除に失敗しました');
    }
  };

  // タスク完了処理
  const handleCompleteTask = async (id: string) => {
    try {
      await onCompleteTask(id);
      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (error) {
      console.error('タスク完了エラー:', error);
      alert('タスクの完了処理に失敗しました');
    }
  };

  // プレビューから編集への切り替え
  const handleEditFromPreview = (task: Task) => {
    setSelectedTask(task);
    setShowTaskPreviewModal(false);
    setShowTaskEditModal(true);
  };

  // 編集からプレビューへの切り替え
  const handlePreviewFromEdit = (task: Task) => {
    setSelectedTask(task);
    setShowTaskEditModal(false);
    setShowTaskPreviewModal(true);
  };

  // モーダルを閉じる
  const closeModals = () => {
    setShowTaskPreviewModal(false);
    setShowTaskEditModal(false);
    setSelectedTask(null);
  };

  return {
    selectedTask,
    showTaskPreviewModal,
    showTaskEditModal,
    handleTaskClick,
    handleDeleteTask,
    handleCompleteTask,
    handleEditFromPreview,
    handlePreviewFromEdit,
    closeModals,
    setShowTaskPreviewModal,
    setShowTaskEditModal
  };
}; 