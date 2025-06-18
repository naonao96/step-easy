'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore, Task } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms/Button';
import { FaCalendarAlt, FaCheckCircle, FaUndo, FaTrash, FaFilter } from 'react-icons/fa';

export default function ArchivePage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask } = useTaskStore();
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '14days' | '30days'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/lp');
      return;
    }
    
    // ゲストユーザーはアーカイブにアクセスできない
    if (isGuest) {
      router.push('/menu');
      return;
    }
    
    fetchTasks();
  }, [user, isGuest, router, fetchTasks]);

  // 完了タスクをフィルタリング
  const completedTasks = useMemo(() => {
    const completed = tasks.filter(task => task.status === 'done' && task.completed_at);
    
    // 日付フィルター適用
    const now = new Date();
    const filteredTasks = completed.filter(task => {
      const completedDate = new Date(task.completed_at!);
      const daysDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case '7days':
          return daysDiff <= 7;
        case '14days':
          return daysDiff <= 14;
        case '30days':
          return daysDiff <= 30;
        default:
          return true;
      }
    });

    // 無料ユーザーは14日間制限
    // TODO: プレミアムユーザー判定を実装後、条件分岐を追加
    const isFreeTier = true; // 現在は全員無料扱い
    if (isFreeTier) {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      return filteredTasks.filter(task => 
        new Date(task.completed_at!) >= fourteenDaysAgo
      );
    }

    return filteredTasks;
  }, [tasks, dateFilter]);

  // 日付別にグループ化
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    
    completedTasks.forEach(task => {
      const completedDate = new Date(task.completed_at!);
      const dateKey = completedDate.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });

    // 日付順でソート（新しい順）
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, key) => {
        acc[key] = groups[key].sort((a, b) => 
          new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
        );
        return acc;
      }, {} as { [key: string]: Task[] });

    return sortedGroups;
  }, [completedTasks]);

  const handleRestoreTask = async (taskId: string) => {
    if (window.confirm('このタスクを未完了に戻しますか？')) {
      try {
        await updateTask(taskId, { 
          status: 'todo',
          completed_at: undefined
        });
      } catch (error) {
        console.error('復元エラー:', error);
        alert('復元に失敗しました');
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('このタスクを完全に削除しますか？この操作は取り消せません。')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isGuest) {
    return null; // ゲストはアクセス不可
  }

  return (
    <AppLayout
      title="完了タスク"
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
    >
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  完了タスク アーカイブ
                </h1>
                <p className="text-gray-600 text-sm">
                  完了したタスクの履歴を確認できます（無料プランは14日間保存）
                </p>
              </div>
              
              {/* フィルター */}
              <div className="flex items-center gap-2">
                {FaFilter ({className: "w-4 h-4 text-gray-400"})}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="all">すべて</option>
                  <option value="7days">過去7日間</option>
                  <option value="14days">過去14日間</option>
                  <option value="30days">過去30日間</option>
                </select>
              </div>
            </div>

            {/* 統計 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedTasks.length}
                </div>
                <div className="text-sm text-gray-600">完了タスク</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(groupedTasks).length}
                </div>
                <div className="text-sm text-gray-600">活動日数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(groupedTasks).length > 0 ? 
                    Math.round(completedTasks.length / Object.keys(groupedTasks).length * 10) / 10 : 0}
                </div>
                <div className="text-sm text-gray-600">1日平均</div>
              </div>
            </div>
          </div>

          {/* タスクリスト */}
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              {FaCheckCircle ({className: "w-16 h-16 text-gray-300 mx-auto mb-4"})}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                完了タスクがありません
              </h3>
              <p className="text-gray-600 mb-4">
                タスクを完了すると、ここに履歴が表示されます
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/tasks')}
              >
                新しいタスクを作成
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([dateKey, dayTasks]) => (
                <div key={dateKey} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                    {FaCalendarAlt ({className:"w-5 h-5 text-blue-600"})}
                    <h2 className="text-lg font-semibold text-gray-900">
                      {formatDate(dateKey)}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {dayTasks.length}件完了
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {FaCheckCircle ({className:"w-5 h-5 text-green-500 flex-shrink-0"})}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {formatTime(task.completed_at!)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {task.priority === 'high' ? '高' : 
                             task.priority === 'medium' ? '中' : '低'}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRestoreTask(task.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="未完了に戻す"
                          >
                            {FaUndo ({className:"w-3 h-3"})}
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="完全削除"
                          >
                            {FaTrash ({className:"w-3 h-3"})}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 