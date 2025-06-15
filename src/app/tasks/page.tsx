'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/atoms/Button';
import { TaskCard } from '@/components/molecules/TaskCard';
import { TaskModal } from '@/components/organisms/TaskModal';
import { TaskFilters } from '@/components/molecules/TaskFilters';
import { useTaskStore } from '@/stores/taskStore';
import { Task } from '@/types/task';
import { FaPlus } from 'react-icons/fa';

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('due_date_asc');
  const [showHabitsOnly, setShowHabitsOnly] = useState(false);

  const { tasks, fetchTasks, createTask, updateTask, deleteTask, completeTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
      );
    }

    // ステータスフィルター
    if (statusFilter) {
      result = result.filter(task => task.status === statusFilter);
    }

    // 優先度フィルター
    if (priorityFilter) {
      result = result.filter(task => task.priority === priorityFilter);
    }

    // 習慣フィルター
    if (showHabitsOnly) {
      result = result.filter(task => task.is_habit);
    }

    // ソート
    result.sort((a, b) => {
      switch (sortBy) {
        case 'due_date_asc':
          return new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime();
        case 'due_date_desc':
          return new Date(b.due_date || '').getTime() - new Date(a.due_date || '').getTime();
        case 'priority_desc':
          return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        case 'priority_asc':
          return getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
        case 'created_at_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy, showHabitsOnly]);

  const getPriorityWeight = (priority: string) => {
    switch (priority) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, "id" | "created_at" | "updated_at">) => {
    await createTask(taskData);
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, taskData);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      await deleteTask(taskId);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(undefined);
  };

  const handleModalSubmit = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await handleUpdateTask(taskData);
    } else {
      await handleCreateTask(taskData as Omit<Task, "id" | "created_at" | "updated_at">);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">タスク管理</h1>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={FaPlus}
          >
            新しいタスク
          </Button>
        </div>

        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showHabitsOnly={showHabitsOnly}
          onHabitsFilterChange={setShowHabitsOnly}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleCompleteTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
            />
          ))}
        </div>

        <TaskModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          task={selectedTask}
        />
      </div>
    </div>
  );
} 