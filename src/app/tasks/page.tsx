'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore, type Task } from '@/stores/taskStore';
import { TaskList } from '@/components/molecules/TaskList';
import { TaskModal } from '@/components/organisms/TaskModal';
import { Button } from '@/components/atoms/Button';
import { FaPlus } from 'react-icons/fa';
import { Layout } from '@/components/templates/Layout';

export default function TasksPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (taskData: Partial<Task>) => {
    await createTask(taskData as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
    setIsModalOpen(false);
  };

  const handleUpdateTask = async (id: string, taskData: Partial<Task>) => {
    await updateTask(id, taskData);
    setSelectedTask(undefined);
    setIsModalOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      await deleteTask(id);
    }
  };

  const handleCompleteTask = async (id: string) => {
    await updateTask(id, { status: 'done', completed_at: new Date().toISOString() });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">タスク管理</h1>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedTask(undefined);
              setIsModalOpen(true);
            }}
            leftIcon={FaPlus}
          >
            新規タスク
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={(task) => router.push(`/tasks/${task.id}`)}
            onDelete={handleDeleteTask}
            onComplete={handleCompleteTask}
          />
        )}

        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(undefined);
          }}
          onSubmit={selectedTask ? (data) => handleUpdateTask(selectedTask.id, data) : handleCreateTask}
          task={selectedTask}
        />
      </div>
    </Layout>
  );
} 