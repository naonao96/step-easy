'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore, type Task } from '@/stores/taskStore';
import { Layout } from '@/components/templates/Layout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaArrowLeft, FaSave, FaTrash } from 'react-icons/fa';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { tasks, loading, error, fetchTasks, updateTask, deleteTask } = useTaskStore();
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const foundTask = tasks.find(t => t.id === params.id);
    if (foundTask) {
      setTask(foundTask);
      setEditedTask(foundTask);
    }
  }, [tasks, params.id]);

  const handleUpdate = async () => {
    if (!task) return;
    await updateTask(task.id, editedTask);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      await deleteTask(task.id);
      router.push('/tasks');
    }
  };

  const handleComplete = async () => {
    if (!task) return;
    await updateTask(task.id, { 
      status: 'done', 
      completed_at: new Date().toISOString() 
    });
    router.push('/tasks');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !task) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">
            <p>タスクが見つかりませんでした。</p>
            <Button
              variant="secondary"
              onClick={() => router.push('/tasks')}
              className="mt-4"
            >
              タスク一覧に戻る
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="secondary"
              onClick={() => router.push('/tasks')}
              leftIcon={FaArrowLeft}
            >
              戻る
            </Button>
            <div className="space-x-4">
              {!isEditing && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                  >
                    編集
                  </Button>
                  {task.status !== 'done' && (
                    <Button
                      onClick={handleComplete}
                    >
                      完了
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">タスクを編集</h1>
              <div className="space-y-4">
                <Input
                  label="タイトル"
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                />
                <Input
                  label="説明"
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  multiline
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先度
                  </label>
                  <select
                    value={editedTask.priority || 'medium'}
                    onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Task['priority'] })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedTask.is_habit || false}
                      onChange={(e) => setEditedTask({ ...editedTask, is_habit: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">習慣タスク</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTask(task);
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdate}
                  leftIcon={FaSave}
                >
                  保存
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{task.title}</h1>
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">説明</h2>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{task.description}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500">状態</h2>
                  <p className="mt-1 text-gray-900">
                    {task.status === 'done' ? '完了' : task.status === 'doing' ? '進行中' : '未着手'}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500">優先度</h2>
                  <p className="mt-1 text-gray-900">
                    {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                  </p>
                </div>
                {task.is_habit && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">習慣</h2>
                    <p className="mt-1 text-gray-900">
                      頻度: {task.habit_frequency === 'daily' ? '毎日' : '週間'}
                    </p>
                    <p className="mt-1 text-gray-900">
                      継続回数: {task.streak_count}回
                    </p>
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-medium text-gray-500">作成日</h2>
                  <p className="mt-1 text-gray-900">
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
                {task.completed_at && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">完了日</h2>
                    <p className="mt-1 text-gray-900">
                      {new Date(task.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  leftIcon={FaTrash}
                >
                  削除
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 