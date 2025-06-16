'use client';

import React, { useEffect, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { ProgressCard } from '@/components/molecules/ProgressCard';
import { FaCheckCircle, FaClock, FaFire } from 'react-icons/fa';

export default function ProgressPage() {
  const { tasks, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const statistics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'doing').length;
    const pendingTasks = tasks.filter(task => task.status === 'todo').length;
    const habitTasks = tasks.filter(task => task.is_habit).length;
    const completedHabits = tasks.filter(task => task.is_habit && task.status === 'done').length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      habitTasks,
      completedHabits,
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">進捗管理</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ProgressCard
            title="タスク完了率"
            value={statistics.completedTasks}
            total={statistics.totalTasks}
            icon={<span className="w-6 h-6">{FaCheckCircle({})}</span>}
            color="text-green-500"
            description="全タスクに対する完了タスクの割合"
          />

          <ProgressCard
            title="進行中のタスク"
            value={statistics.inProgressTasks}
            total={statistics.totalTasks}
            icon={<span className="w-6 h-6">{FaClock({})}</span>}
            color="text-blue-500"
            description="現在進行中のタスク数"
          />

          <ProgressCard
            title="習慣達成率"
            value={statistics.completedHabits}
            total={statistics.habitTasks}
            icon={<span className="w-6 h-6">{FaFire({})}</span>}
            color="text-orange-500"
            description="習慣タスクの達成率"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">詳細統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">タスクの状態</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">未着手</span>
                  <span className="font-medium">{statistics.pendingTasks}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">進行中</span>
                  <span className="font-medium">{statistics.inProgressTasks}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">完了</span>
                  <span className="font-medium">{statistics.completedTasks}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">習慣の記録</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">習慣タスク数</span>
                  <span className="font-medium">{statistics.habitTasks}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 