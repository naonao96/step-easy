'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore } from '@/stores/taskStore';
import { Task } from '@/types/task';
import { AppLayout } from '@/components/templates/AppLayout';
import { FaCalendarAlt, FaCheckCircle, FaUndo, FaTrash, FaFilter, FaHistory, FaSearch, FaSort } from 'react-icons/fa';
import { ArchiveExecutionLog } from '@/components/molecules/ArchiveExecutionLog';

type TabType = 'completed' | 'execution';

export default function ArchivePage() {
  const router = useRouter();
  const { user, isGuest, planType } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask } = useTaskStore();
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '14days' | '30days'>('all');
  const [activeTab, setActiveTab] = useState<TabType>('completed');
  const [searchQuery, setSearchQuery] = useState('');

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
    
    // 検索フィルター適用
    const searchFiltered = searchQuery 
      ? completed.filter(task => 
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : completed;
    
    // 日付フィルター適用
    const now = new Date();
    const filteredTasks = searchFiltered.filter(task => {
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

    // プラン別データ表示制限（実際のデータ削除は別途バックグラウンドで実行）
    // 無料ユーザーは30日間のみ表示
    if (!isGuest && planType === 'free') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return filteredTasks.filter(task => 
        new Date(task.completed_at!) >= thirtyDaysAgo
      );
    }

    return filteredTasks;
  }, [tasks, dateFilter, searchQuery, isGuest, planType]);

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

  const tabs = [
    { id: 'completed', label: '完了タスク', icon: FaCheckCircle },
    { id: 'execution', label: '実行ログ', icon: FaHistory }
  ];

  return (
    <AppLayout
      title="アーカイブ"
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
      tasks={tasks as any}
    >
      <div className="px-4 sm:px-6 py-4 sm:py-6 mt-4">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#8b4513] mb-2">
                  アーカイブ
                </h1>
                <p className="text-[#7c5a2a] text-sm">
                  完了したタスクと実行履歴を確認できます
                </p>
              </div>
            </div>

            {/* StepEasyらしいタブナビゲーション */}
            <div className="border-b border-[#deb887]">
              <nav className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`
                        flex items-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
                        ${isActive
                          ? 'bg-[#7c5a2a] text-white shadow-sm'
                          : 'text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc]'
                        }
                      `}
                    >
                      {Icon ({className:`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7c5a2a]'}`})}
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 検索とフィルター */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              {/* 検索バー */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {FaSearch ({className:"h-4 w-4 text-[#7c5a2a]"})}
                </div>
                <input
                  type="text"
                  placeholder="タスクを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-[#deb887] rounded-lg focus:ring-2 focus:ring-[#7c5a2a] focus:border-[#7c5a2a] text-sm bg-white"
                />
              </div>

              {/* フィルター */}
              <div className="flex items-center gap-2">
                {FaFilter ({className:"w-4 h-4 text-[#7c5a2a]"})}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="rounded-lg border-[#deb887] shadow-sm focus:border-[#7c5a2a] focus:ring-[#7c5a2a] text-sm bg-white"
                >
                  <option value="all">すべて</option>
                  <option value="7days">過去7日間</option>
                  <option value="14days">過去14日間</option>
                  <option value="30days">過去30日間</option>
                </select>
              </div>
            </div>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'completed' && (
            <div className="space-y-6">
              {/* StepEasyらしい統計カード */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="wood-frame rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-[#f5f5dc] rounded-lg">
                      {FaCheckCircle ({className:"w-6 h-6 text-[#7c5a2a]"})}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#7c5a2a]">完了タスク</p>
                      <p className="text-2xl font-bold text-[#8b4513]">{completedTasks.length}</p>
                    </div>
                  </div>
                </div>
                <div className="wood-frame rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-[#f5f5dc] rounded-lg">
                      {FaCalendarAlt ({className:"w-6 h-6 text-[#7c5a2a]"})}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#7c5a2a]">活動日数</p>
                      <p className="text-2xl font-bold text-[#8b4513]">{Object.keys(groupedTasks).length}</p>
                    </div>
                  </div>
                </div>
                <div className="wood-frame rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-[#f5f5dc] rounded-lg">
                      {FaHistory ({className:"w-6 h-6 text-[#7c5a2a]"})}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[#7c5a2a]">1日平均</p>
                      <p className="text-2xl font-bold text-[#8b4513]">
                        {Object.keys(groupedTasks).length > 0 ? 
                          Math.round(completedTasks.length / Object.keys(groupedTasks).length * 10) / 10 : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* タスクリスト */}
              {Object.keys(groupedTasks).length === 0 ? (
                <div className="wood-frame rounded-xl p-12 text-center">
                  {FaCheckCircle ({className:"w-16 h-16 text-[#deb887] mx-auto mb-4"})}
                  <h3 className="text-lg font-semibold text-[#8b4513] mb-2">
                    完了タスクがありません
                  </h3>
                  <p className="text-[#7c5a2a]">
                    タスクを完了すると、ここに履歴が表示されます
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTasks).map(([dateKey, dayTasks]) => (
                    <div key={dateKey} className="wood-frame rounded-xl overflow-hidden">
                      <div className="px-6 py-4 bg-[#f5f5dc] border-b border-[#deb887]">
                        <div className="flex items-center gap-3">
                          {FaCalendarAlt ({className:"w-5 h-5 text-[#7c5a2a]"})}
                          <h2 className="text-lg font-semibold text-[#8b4513]">
                            {formatDate(dateKey)}
                          </h2>
                          <span className="text-sm text-[#7c5a2a] bg-white px-3 py-1 rounded-full border border-[#deb887]">
                            {dayTasks.length}件完了
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-[#deb887]">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-4 p-4 hover:bg-[#f5f5dc] transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {FaCheckCircle ({className:"w-5 h-5 text-[#7c5a2a]"})}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-[#8b4513] truncate">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-[#7c5a2a] truncate mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-sm text-[#7c5a2a]">
                                {formatTime(task.completed_at!)}
                              </span>
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                task.priority === 'high' ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                                task.priority === 'medium' ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]' :
                                'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                              }`}>
                                {task.priority === 'high' ? '高' : 
                                 task.priority === 'medium' ? '中' : '低'}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRestoreTask(task.id)}
                                className="p-2 text-[#7c5a2a] hover:bg-[#f5f5dc] rounded-lg transition-colors"
                                title="未完了に戻す"
                              >
                                {FaUndo ({className:"w-4 h-4"})}
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-colors"
                                title="完全削除"
                              >
                                {FaTrash ({className:"w-4 h-4"})}
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
          )}

          {activeTab === 'execution' && (
            <ArchiveExecutionLog 
              dateFilter={dateFilter}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
} 