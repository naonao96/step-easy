'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { ProgressCard } from '@/components/molecules/ProgressCard';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
// Removed react-icons import due to type issues
import { DEFAULT_CATEGORIES, Task } from '@/types/task';
import { useSearchParams } from 'next/navigation';

type TabType = 'today' | 'weekly' | 'overall';

export default function ProgressPage() {
  const { tasks: storeTasks, fetchTasks } = useTaskStore();
  const tasks = storeTasks as Task[]; // Type cast to use the Task type with category
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('overall');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // クエリパラメータからデフォルトタブを設定
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['today', 'weekly', 'overall'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 今日の詳細統計
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 今日のタスクを取得
    const todayTasks = tasks.filter(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      }
      
      if (task.start_date && !task.due_date) {
        const startDate = new Date(task.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate.getTime() === today.getTime() && task.status !== 'done';
      }
      
      if (task.status === 'done' && task.completed_at) {
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      }
      
      return false;
    });

    // カテゴリ別統計
    const categoryStats = DEFAULT_CATEGORIES.map(category => {
      const categoryTasks = todayTasks.filter(task => task.category === category.id);
      const completed = categoryTasks.filter(task => task.status === 'done').length;
      return {
        ...category,
        total: categoryTasks.length,
        completed,
        percentage: categoryTasks.length > 0 ? Math.round((completed / categoryTasks.length) * 100) : 0
      };
    }).filter(stat => stat.total > 0);

    return {
      totalTasks: todayTasks.length,
      completedTasks: todayTasks.filter(task => task.status === 'done').length,
      categoryStats,
      tasks: todayTasks
    };
  }, [tasks]);

  // 曜日別詳細統計
  const weeklyStats = useMemo(() => {
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completed_at);
    
    const dayStats = weekDays.map((day, index) => {
      const dayTasks = completedTasks.filter(task => {
        const completedDate = new Date(task.completed_at!);
        return completedDate.getDay() === index;
      });

      // 時間帯別分析
      const hourStats = Array.from({ length: 24 }, (_, hour) => {
        const hourCount = dayTasks.filter(task => {
          const completedDate = new Date(task.completed_at!);
          return completedDate.getHours() === hour;
        }).length;
        return { hour, count: hourCount };
      }).filter(stat => stat.count > 0);

      return {
        day,
        dayIndex: index,
        count: dayTasks.length,
        hourStats,
        peakHour: hourStats.reduce((max, current) => 
          current.count > max.count ? current : max, 
          { hour: 0, count: 0 }
        )
      };
    });

    const maxCount = Math.max(...dayStats.map(d => d.count), 1);
    
    return dayStats.map(item => ({
      ...item,
      percentage: (item.count / maxCount) * 100
    }));
  }, [tasks]);

  // 全体統計
  const overallStats = useMemo(() => {
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

  const tabs = [
    { id: 'today', label: '今日の詳細', icon: <span className="text-blue-500">📊</span> },
    { id: 'weekly', label: '曜日別分析', icon: <span className="text-blue-500">📅</span> },
    { id: 'overall', label: '全体統計', icon: <span className="text-blue-500">📈</span> }
  ];

  return (
    <AppLayout
      title="進捗管理"
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
    >
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'today' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">今日の詳細分析</h2>
              
              {/* 今日の概要 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <ProgressCard
                  title="今日の達成率"
                  value={todayStats.completedTasks}
                  total={todayStats.totalTasks}
                  icon={<span className="text-2xl">✅</span>}
                  color="text-blue-500"
                  description="今日予定されたタスクの完了状況"
                />
              </div>

              {/* カテゴリ別詳細 */}
              {todayStats.categoryStats.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別進捗</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todayStats.categoryStats.map(stat => (
                      <div key={stat.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryBadge category={stat.id} size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {stat.completed}/{stat.total}
                          </span>
                          <span className={`font-medium text-sm ${
                            stat.percentage === 100 ? 'text-green-600' :
                            stat.percentage >= 70 ? 'text-blue-600' :
                            stat.percentage >= 40 ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            {stat.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 今日のタスク一覧 */}
              {todayStats.tasks.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">今日のタスク</h3>
                  <div className="space-y-2">
                    {todayStats.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CategoryBadge category={task.category} size="sm" showText={false} />
                          <span className={`${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          task.status === 'done' ? 'bg-green-100 text-green-800' :
                          task.status === 'doing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'done' ? '完了' : task.status === 'doing' ? '進行中' : '未着手'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">曜日別詳細分析</h2>
              
              {/* 曜日別チャート */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">曜日別完了タスク数</h3>
                <div className="space-y-4">
                  {weeklyStats.map((item) => (
                    <div key={item.day} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 text-sm font-medium text-gray-600 text-center">
                            {item.day}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-8 rounded-full transition-all duration-300 flex items-center justify-end pr-3"
                              style={{ width: `${Math.max(item.percentage, 5)}%` }}
                            >
                              {item.count > 0 && (
                                <span className="text-white text-sm font-medium">
                                  {item.count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {item.peakHour.count > 0 && (
                          <span className="text-xs text-gray-500 ml-4">
                            ピーク: {item.peakHour.hour}時
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 分析サマリー */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">分析サマリー</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">最も生産的な曜日</h4>
                    <p className="text-blue-700">
                      {weeklyStats.reduce((max, current) => 
                        current.count > max.count ? current : max,
                        { day: '不明', count: 0 }
                      ).day}曜日 ({weeklyStats.reduce((max, current) => 
                        current.count > max.count ? current : max,
                        { day: '不明', count: 0 }
                      ).count}件完了)
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">週間完了総数</h4>
                    <p className="text-green-700">
                      {weeklyStats.reduce((sum, day) => sum + day.count, 0)}件
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overall' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">全体統計</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <ProgressCard
                  title="タスク完了率"
                  value={overallStats.completedTasks}
                  total={overallStats.totalTasks}
                  icon={<span className="text-2xl">✅</span>}
                  color="text-green-500"
                  description="全タスクに対する完了タスクの割合"
                />

                <ProgressCard
                  title="進行中のタスク"
                  value={overallStats.inProgressTasks}
                  total={overallStats.totalTasks}
                  icon={<span className="text-2xl">🕐</span>}
                  color="text-blue-500"
                  description="現在進行中のタスク数"
                />

                <ProgressCard
                  title="習慣達成率"
                  value={overallStats.completedHabits}
                  total={overallStats.habitTasks}
                  icon={<span className="text-2xl">🔥</span>}
                  color="text-orange-500"
                  description="習慣タスクの達成率"
                />
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">詳細統計</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-2">タスクの状態</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">未着手</span>
                        <span className="font-medium">{overallStats.pendingTasks}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">進行中</span>
                        <span className="font-medium">{overallStats.inProgressTasks}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">完了</span>
                        <span className="font-medium">{overallStats.completedTasks}</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-2">習慣の記録</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">習慣タスク数</span>
                        <span className="font-medium">{overallStats.habitTasks}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 