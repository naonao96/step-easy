'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useHabitStore } from '@/stores/habitStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { ProgressCard } from '@/components/molecules/ProgressCard';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { DetailedHeatmap } from '@/components/molecules/DetailedHeatmap';
import { MobileProgressDashboard } from '@/components/molecules/MobileProgressDashboard';

import { FaChartBar, FaChartPie, FaFire, FaChartLine, FaTrophy } from 'react-icons/fa';
import { DEFAULT_CATEGORIES } from '@/types/task';
import { Task } from '@/types/task';
import { useSearchParams } from 'next/navigation';

type TabType = 'today' | 'category' | 'heatmap' | 'overall';

export default function ProgressPage() {
  const { tasks: storeTasks, fetchTasks } = useTaskStore();
  const { habits, habitCompletions, fetchHabits } = useHabitStore();
  const tasks = storeTasks as Task[]; // Type cast to use the Task type with category
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('overall');
  const [showMobileDashboard, setShowMobileDashboard] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchHabits();
  }, [fetchTasks, fetchHabits]);

  // クエリパラメータからデフォルトタブを設定
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['today', 'category', 'heatmap', 'overall', 'badges'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 今日の詳細統計
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 今日の日付文字列を取得（日本時間）
    const japanTime = new Date(today.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const todayString = japanTime.toISOString().split('T')[0];
    
    // 今日のタスクを取得
    const todayTasks = tasks.filter(task => {
      // 期間タスクの処理（開始日と期限日の両方がある場合）
      if (task.start_date && task.due_date) {
        const taskStartDate = new Date(task.start_date);
        const taskDueDate = new Date(task.due_date);
        taskStartDate.setHours(0, 0, 0, 0);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 今日が期間内にある場合
        if (today.getTime() >= taskStartDate.getTime() && 
            today.getTime() <= taskDueDate.getTime()) {
          // 未完了の場合は表示
          if (task.status !== 'done') {
            return true;
          }
          // 完了済みの場合は完了日が今日の場合のみ表示
          if (task.status === 'done' && task.completed_at) {
            const completedDate = new Date(task.completed_at);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === today.getTime();
          }
        }
        return false;
      }
      
      // 開始日のみのタスク
      if (task.start_date && !task.due_date) {
        const taskStartDate = new Date(task.start_date);
        taskStartDate.setHours(0, 0, 0, 0);
        
        // 開始日以降で未完了の場合は表示
        if (today.getTime() >= taskStartDate.getTime() && task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日が今日の場合のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }
        return false;
      }
      
      // 期限日のみのタスク
      if (!task.start_date && task.due_date) {
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        
        // 期限日まで（今日以降）で未完了の場合は表示
        if (today.getTime() <= taskDueDate.getTime() && task.status !== 'done') {
          return true;
        }
        // 完了済みの場合は完了日が今日の場合のみ表示
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }
        return false;
      }
      
      // 開始日も期限日もないタスクの処理
      if (!task.start_date && !task.due_date) {
        // 完了済みタスクで今日完了したもの
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }
        
        // 未完了タスク
        if (task.status !== 'done') {
          return true;
        }
      }
      
      return false;
    });

    // 今日の習慣を取得
    const todayHabits = habits.filter(habit => habit.habit_status === 'active');
    const completedHabits = habitCompletions.filter(completion => 
      completion.completed_date === todayString
    );

    // --- カテゴリ別統計（タスク＋習慣）---
    const categoryStats = DEFAULT_CATEGORIES.map(category => {
      // タスク
      const categoryTasks = todayTasks.filter(task => task.category === category.id);
      const completedCategoryTasks = categoryTasks.filter(task => task.status === 'done');
      // 習慣
      const categoryHabits = todayHabits.filter(habit => habit.category === category.id);
      const completedCategoryHabits = categoryHabits.filter(habit => completedHabits.some(c => c.habit_id === habit.id));
      // 合算
      const total = categoryTasks.length + categoryHabits.length;
      const completed = completedCategoryTasks.length + completedCategoryHabits.length;
      return {
        ...category,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }).filter(stat => stat.total > 0);

    return {
      totalTasks: todayTasks.length,
      completedTasks: todayTasks.filter(task => task.status === 'done').length,
      totalHabits: todayHabits.length,
      completedHabits: completedHabits.length,
      categoryStats,
      tasks: todayTasks
    };
  }, [tasks, habits, habitCompletions]);

  // カテゴリ別詳細統計
  const categoryStats = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'done');
    
    const stats = DEFAULT_CATEGORIES.map(category => {
      const categoryTasks = tasks.filter(task => task.category === category.id);
      const categoryCompletedTasks = completedTasks.filter(task => task.category === category.id);
      
      // 時系列データ（過去30日）
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        return date;
      }).reverse();

      const dailyStats = last30Days.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayCompletedTasks = categoryCompletedTasks.filter(task => {
          if (!task.completed_at) return false;
          const completedDate = new Date(task.completed_at);
          return completedDate.toISOString().split('T')[0] === dateStr;
        });
        
        return {
          date: dateStr,
          count: dayCompletedTasks.length
        };
      });

      // 平均完了時間の計算
      const avgCompletionTime = categoryCompletedTasks.length > 0 ? 
        categoryCompletedTasks.reduce((sum, task) => {
          return sum + (task.actual_duration || task.estimated_duration || 0);
        }, 0) / categoryCompletedTasks.length : 0;



      return {
        ...category,
        totalTasks: categoryTasks.length,
        completedTasks: categoryCompletedTasks.length,
        percentage: categoryTasks.length > 0 ? Math.round((categoryCompletedTasks.length / categoryTasks.length) * 100) : 0,
        dailyStats,
        avgCompletionTime: Math.round(avgCompletionTime)
      };
    }).filter(stat => stat.totalTasks > 0);

    // 完了率でソート（降順）
    return stats.sort((a, b) => b.percentage - a.percentage);
  }, [tasks]);

  // 全体統計
  const overallStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'doing').length;
    const pendingTasks = tasks.filter(task => task.status === 'todo').length;
    
    // 新しい習慣システムのデータを使用
    const activeHabits = habits.filter(habit => habit.habit_status === 'active');
    const habitTasks = activeHabits.length;

    // 習慣の詳細分析（新しい習慣システム）
    const habitStats = activeHabits.map(habit => {
      // 習慣の完了回数を計算
      const habitCompletionsCount = habitCompletions.filter(completion => 
        completion.habit_id === habit.id
      ).length;
      
      // 習慣作成からの日数を計算
      const createdDate = new Date(habit.created_at);
      const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // 完了率を計算
      const completionRate = Math.round((habitCompletionsCount / daysSinceCreation) * 100);
      
      return {
        id: habit.id,
        title: habit.title,
        currentStreak: habit.current_streak || 0,
        longestStreak: habit.longest_streak || 0,
        completionRate
      };
    });

    const averageHabitStreak = habitStats.length > 0 ? 
      Math.round(habitStats.reduce((sum, habit) => sum + habit.currentStreak, 0) / habitStats.length) : 0;
    
    const longestHabitStreak = habitStats.length > 0 ? 
      Math.max(...habitStats.map(habit => habit.longestStreak)) : 0;

    const averageHabitCompletionRate = habitStats.length > 0 ? 
      Math.round(habitStats.reduce((sum, habit) => sum + habit.completionRate, 0) / habitStats.length) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      habitTasks,
      habitStats,
      averageHabitStreak,
      longestHabitStreak,
      averageHabitCompletionRate
    };
  }, [tasks, habits, habitCompletions]);

  const tabs = [
    { id: 'today', label: '今日の詳細', icon: FaChartBar },
    { id: 'category', label: 'カテゴリ別分析', icon: FaChartPie },
    { id: 'heatmap', label: 'ヒートマップ', icon: FaFire },
    { id: 'overall', label: '全体統計', icon: FaChartLine }
  ];

  // モバイルでタブを選択した時のハンドラー
  const handleMobileTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setShowMobileDashboard(false);
  };

  return (
    <AppLayout
      title="進捗管理"
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
      tasks={tasks as any}
    >
      {/* モバイル専用ダッシュボード */}
      {showMobileDashboard && (
        <MobileProgressDashboard 
          tasks={tasks as Task[]}
          onNavigateToTab={handleMobileTabSelect}
        />
      )}

      {/* モバイル詳細タブ表示 */}
      {!showMobileDashboard && (
        <div className="md:hidden px-4 py-4">
          <div className="max-w-7xl mx-auto">
            {/* モバイル用戻るボタン */}
            <button
              onClick={() => setShowMobileDashboard(true)}
              className="flex items-center gap-2 mb-4 text-[#7c5a2a] hover:text-[#8b4513] transition-colors"
            >
              <span>←</span>
              <span className="text-sm font-medium">ダッシュボードに戻る</span>
            </button>

            {/* タブコンテンツ（モバイル用） */}
            <div className="space-y-6">
              {activeTab === 'today' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#8b4513]">今日の詳細分析</h2>
                  
                  {/* 今日の概要 */}
                  <div className="grid grid-cols-1 gap-6 mb-8">
                    <ProgressCard
                      title="今日の達成率"
                      value={todayStats.completedTasks + todayStats.completedHabits}
                      total={todayStats.totalTasks + todayStats.totalHabits}
                      icon={<></>}
                      color="text-[#7c5a2a]"
                      description={`タスク: ${todayStats.completedTasks}/${todayStats.totalTasks}, 習慣: ${todayStats.completedHabits}/${todayStats.totalHabits}`}
                    />
                    

                  </div>

                  {/* カテゴリ別詳細 */}
                  {todayStats.categoryStats.length > 0 && (
                    <div className="wood-frame rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[#8b4513] mb-4">カテゴリ別進捗</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {todayStats.categoryStats.map(stat => (
                          <div key={stat.id} className="p-4 border border-[#deb887] rounded-lg bg-[#f5f5dc]">
                            <div className="flex items-center gap-2 mb-2">
                              <CategoryBadge category={stat.id} size="sm" />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-[#7c5a2a]">
                                {stat.completed}/{stat.total}
                              </span>
                              <span className={`font-medium text-sm ${
                                stat.percentage === 100 ? 'text-[#8b4513]' :
                                stat.percentage >= 70 ? 'text-[#7c5a2a]' :
                                stat.percentage >= 40 ? 'text-[#7c5a2a]' : 'text-[#7c5a2a]'
                              }`}>
                                {stat.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-[#deb887] rounded-full h-2 mt-2">
                              <div
                                className="bg-[#7c5a2a] h-2 rounded-full transition-all duration-300"
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
                    <div className="wood-frame rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[#8b4513] mb-4">今日のタスク</h3>
                      <div className="space-y-2">
                        {todayStats.tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                            <div className="flex items-center gap-3">
                              <CategoryBadge category={task.category} size="sm" showText={false} />
                              <span className={`${task.status === 'done' ? 'line-through text-[#7c5a2a]' : 'text-[#8b4513]'}`}>
                                {task.title}
                              </span>
                            </div>
                            <span className={`px-4 py-1 rounded-full text-xs font-medium min-w-[70px] text-center ${
                              task.status === 'done' ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                              task.status === 'doing' ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]' :
                              'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                            }`}>
                              {task.status === 'done' ? '完了' : task.status === 'doing' ? '進行中' : '未着手'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 今日の習慣一覧 */}
                  {todayStats.totalHabits > 0 && (
                    <div className="wood-frame rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-[#8b4513] mb-4">今日の習慣</h3>
                      <div className="space-y-2">
                        {habits.filter(habit => habit.habit_status === 'active').map(habit => {
                          const isCompleted = habitCompletions.some(completion => 
                            completion.habit_id === habit.id && 
                            completion.completed_date === (() => {
                              const today = new Date();
                              const japanTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
                              return japanTime.toISOString().split('T')[0];
                            })()
                          );
                          
                          return (
                            <div key={habit.id} className="flex items-center justify-between p-3 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                              <div className="flex items-center gap-3">
                                <span className="text-sm">🔄</span>
                                <span className={`${isCompleted ? 'line-through text-[#7c5a2a]' : 'text-[#8b4513]'}`}>
                                  {habit.title}
                                </span>
                              </div>
                              <span className={`px-4 py-1 rounded-full text-xs font-medium min-w-[70px] text-center ${
                                isCompleted ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                                'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                              }`}>
                                {isCompleted ? '完了' : '未完了'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'category' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#8b4513]">カテゴリ別詳細分析</h2>
                  
                  {/* カテゴリ別統計一覧 */}
                  <div className="wood-frame rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[#8b4513] mb-4">カテゴリ別完了率</h3>
                    <div className="space-y-4">
                      {categoryStats.map((category, index) => (
                        <div key={category.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {index === 0 && <span className="text-lg">🏆</span>}
                              {index === 1 && <span className="text-lg">🥈</span>}
                              {index === 2 && <span className="text-lg">🥉</span>}
                              <CategoryBadge category={category.id} size="md" />
                              <div className="text-sm text-[#7c5a2a]">
                                {category.completedTasks}/{category.totalTasks} 完了
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {category.avgCompletionTime > 0 && (
                                <span className="text-xs text-[#7c5a2a]">
                                  平均 {category.avgCompletionTime}分
                                </span>
                              )}

                              <span className={`font-bold text-lg ${
                                category.percentage === 100 ? 'text-[#8b4513]' :
                                category.percentage >= 75 ? 'text-[#7c5a2a]' :
                                category.percentage >= 50 ? 'text-[#7c5a2a]' : 'text-[#7c5a2a]'
                              }`}>
                                {category.percentage}%
                              </span>
                            </div>
                          </div>
                          
                          {/* プログレスバー */}
                          <div className="w-full bg-[#deb887] rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                category.percentage === 100 ? 'bg-[#8b4513]' :
                                category.percentage >= 75 ? 'bg-[#7c5a2a]' :
                                category.percentage >= 50 ? 'bg-[#7c5a2a]' : 'bg-[#deb887]'
                              }`}
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 分析サマリー */}
                  <div className="wood-frame rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[#8b4513] mb-4">分析サマリー</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                        <h4 className="font-medium text-[#8b4513] mb-2">最も生産的なカテゴリ</h4>
                        <p className="text-[#7c5a2a]">
                          {categoryStats[0]?.name || '該当なし'}
                          {categoryStats[0] && ` (${categoryStats[0].percentage}%)`}
                        </p>
                      </div>
                      <div className="p-4 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                        <h4 className="font-medium text-[#8b4513] mb-2">活動カテゴリ数</h4>
                        <p className="text-[#7c5a2a]">
                          {categoryStats.length}/{DEFAULT_CATEGORIES.length} カテゴリ
                        </p>
                      </div>
                      <div className="p-4 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                        <h4 className="font-medium text-[#8b4513] mb-2">総完了タスク</h4>
                        <p className="text-[#7c5a2a]">
                          {categoryStats.reduce((sum, cat) => sum + cat.completedTasks, 0)}件
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'heatmap' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#8b4513]">完了時間ヒートマップ</h2>
                  <DetailedHeatmap tasks={tasks as any} />
                </div>
              )}

              {activeTab === 'overall' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#8b4513]">全体統計</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="wood-frame rounded-xl p-6">
                      <h4 className="text-lg font-medium text-[#8b4513] mb-2">習慣の記録</h4>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-[#7c5a2a]">習慣タスク数</span>
                          <span className="font-medium text-[#8b4513]">{overallStats.habitTasks}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-[#7c5a2a]">平均継続日数</span>
                          <span className="font-medium text-[#8b4513]">{overallStats.averageHabitStreak}日</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-[#7c5a2a]">最長継続記録</span>
                          <span className="font-medium text-[#8b4513]">{overallStats.longestHabitStreak}日</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-[#7c5a2a]">平均達成率</span>
                          <span className="font-medium text-[#8b4513]">{overallStats.averageHabitCompletionRate}%</span>
                        </li>
                      </ul>
                    </div>

                      <div className="wood-frame rounded-xl p-6">
                        <h4 className="text-lg font-medium text-[#8b4513] mb-2">タスクの状態</h4>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                            <span className="text-[#7c5a2a]">未着手</span>
                            <span className="font-medium text-[#8b4513]">{overallStats.pendingTasks}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-[#7c5a2a]">進行中</span>
                            <span className="font-medium text-[#8b4513]">{overallStats.inProgressTasks}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-[#7c5a2a]">完了</span>
                            <span className="font-medium text-[#8b4513]">{overallStats.completedTasks}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      )}

      {/* デスクトップ版（従来の表示） */}
      <div className="hidden md:block px-4 sm:px-6 py-4 sm:py-6 mt-4">
        <div className="max-w-7xl mx-auto">
          {/* タブナビゲーション */}
          <div className="border-b border-[#deb887] mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-[#7c5a2a] text-[#8b4513]'
                      : 'border-transparent text-[#7c5a2a] hover:text-[#8b4513] hover:border-[#deb887]'
                    }
                  `}
                >
                  <span className={activeTab === tab.id ? 'text-[#8b4513]' : 'text-[#7c5a2a]'}>
                    {tab.icon({ className: 'w-4 h-4' })}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'today' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#8b4513]">今日の詳細分析</h2>
              
              {/* 今日の概要 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <ProgressCard
                  title="今日の達成率"
                  value={todayStats.completedTasks + todayStats.completedHabits}
                  total={todayStats.totalTasks + todayStats.totalHabits}
                  icon={<></>}
                  color="text-[#7c5a2a]"
                  progressColor="bg-[#7c5a2a]"
                  description={`タスク: ${todayStats.completedTasks}/${todayStats.totalTasks}, 習慣: ${todayStats.completedHabits}/${todayStats.totalHabits}`}
                />
              </div>

              {/* カテゴリ別詳細 */}
              {todayStats.categoryStats.length > 0 && (
                <div className="wood-frame rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#8b4513] mb-4">カテゴリ別進捗</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todayStats.categoryStats.map(stat => (
                      <div key={stat.id} className="p-4 border border-[#deb887] rounded-lg bg-[#f5f5dc]">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryBadge category={stat.id} size="sm" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#7c5a2a]">
                            {stat.completed}/{stat.total}
                          </span>
                          <span className={`font-medium text-sm ${
                            stat.percentage === 100 ? 'text-[#8b4513]' :
                            stat.percentage >= 70 ? 'text-[#7c5a2a]' :
                            stat.percentage >= 40 ? 'text-[#7c5a2a]' : 'text-[#7c5a2a]'
                          }`}>
                            {stat.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-[#deb887] rounded-full h-2 mt-2">
                          <div
                            className="bg-[#7c5a2a] h-2 rounded-full transition-all duration-300"
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
                <div className="wood-frame rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#8b4513] mb-4">今日のタスク</h3>
                  <div className="space-y-2">
                    {todayStats.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                        <div className="flex items-center gap-3">
                          <CategoryBadge category={task.category} size="sm" showText={false} />
                          <span className={`${task.status === 'done' ? 'line-through text-[#7c5a2a]' : 'text-[#8b4513]'}`}>
                            {task.title}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          task.status === 'done' ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                          task.status === 'doing' ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]' :
                          'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                        }`}>
                          {task.status === 'done' ? '完了' : task.status === 'doing' ? '進行中' : '未着手'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 今日の習慣一覧 */}
              {todayStats.totalHabits > 0 && (
                <div className="wood-frame rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#8b4513] mb-4">今日の習慣</h3>
                  <div className="space-y-2">
                    {habits.filter(habit => habit.habit_status === 'active').map(habit => {
                      const isCompleted = habitCompletions.some(completion => 
                        completion.habit_id === habit.id && 
                        completion.completed_date === (() => {
                          const today = new Date();
                          const japanTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
                          return japanTime.toISOString().split('T')[0];
                        })()
                      );
                      
                      return (
                        <div key={habit.id} className="flex items-center justify-between p-3 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                          <div className="flex items-center gap-3">
                            <span className="text-sm">🔄</span>
                            <span className={`${isCompleted ? 'line-through text-[#7c5a2a]' : 'text-[#8b4513]'}`}>
                              {habit.title}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isCompleted ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                            'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                          }`}>
                            {isCompleted ? '完了' : '未完了'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'category' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#8b4513]">カテゴリ別詳細分析</h2>
              
              {/* カテゴリ別統計一覧 */}
              <div className="wood-frame rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#8b4513] mb-4">カテゴリ別完了率</h3>
                <div className="space-y-4">
                  {categoryStats.map((category, index) => (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {index === 0 && <span className="text-lg">🏆</span>}
                          {index === 1 && <span className="text-lg">🥈</span>}
                          {index === 2 && <span className="text-lg">🥉</span>}
                          <CategoryBadge category={category.id} size="md" />
                          <div className="text-sm text-[#7c5a2a]">
                            {category.completedTasks}/{category.totalTasks} 完了
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {category.avgCompletionTime > 0 && (
                            <span className="text-xs text-[#7c5a2a]">
                              平均 {category.avgCompletionTime}分
                            </span>
                          )}
                          <span className={`font-bold text-lg ${
                            category.percentage === 100 ? 'text-[#8b4513]' :
                            category.percentage >= 75 ? 'text-[#7c5a2a]' :
                            category.percentage >= 50 ? 'text-[#7c5a2a]' : 'text-[#7c5a2a]'
                          }`}>
                            {category.percentage}%
                          </span>
                        </div>
                      </div>
                      
                      {/* プログレスバー */}
                      <div className="w-full bg-[#deb887] rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            category.percentage === 100 ? 'bg-[#8b4513]' :
                            category.percentage >= 75 ? 'bg-[#7c5a2a]' :
                            category.percentage >= 50 ? 'bg-[#7c5a2a]' : 'bg-[#deb887]'
                          }`}
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>

                      {/* 30日間のトレンド（簡易表示） */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#7c5a2a] mr-2">30日間:</span>
                        {category.dailyStats.slice(-14).map((day, dayIndex) => (
                          <div
                            key={day.date}
                            className={`w-2 h-2 rounded-sm ${
                              day.count > 0 ? 'bg-[#7c5a2a]' : 'bg-[#deb887]'
                            }`}
                            title={`${day.date}: ${day.count}件完了`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 分析サマリー */}
              <div className="wood-frame rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#8b4513] mb-4">分析サマリー</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                    <h4 className="font-medium text-[#8b4513] mb-2">最も生産的なカテゴリ</h4>
                    <p className="text-[#7c5a2a]">
                      {categoryStats[0]?.name || '該当なし'}
                      {categoryStats[0] && ` (${categoryStats[0].percentage}%)`}
                    </p>
                  </div>
                  <div className="p-4 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                    <h4 className="font-medium text-[#8b4513] mb-2">活動カテゴリ数</h4>
                    <p className="text-[#7c5a2a]">
                      {categoryStats.length}/{DEFAULT_CATEGORIES.length} カテゴリ
                    </p>
                  </div>
                  <div className="p-4 bg-[#f5f5dc] rounded-lg border border-[#deb887]">
                    <h4 className="font-medium text-[#8b4513] mb-2">総完了タスク</h4>
                    <p className="text-[#7c5a2a]">
                      {categoryStats.reduce((sum, cat) => sum + cat.completedTasks, 0)}件
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#8b4513]">完了時間ヒートマップ</h2>
              <DetailedHeatmap tasks={tasks as any} />
            </div>
          )}

          {activeTab === 'overall' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#8b4513]">全体統計</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="wood-frame rounded-xl p-6">
                  <h4 className="text-lg font-medium text-[#8b4513] mb-2">習慣の記録</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-[#7c5a2a]">習慣タスク数</span>
                      <span className="font-medium text-[#8b4513]">{overallStats.habitTasks}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-[#7c5a2a]">平均継続日数</span>
                      <span className="font-medium text-[#8b4513]">{overallStats.averageHabitStreak}日</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-[#7c5a2a]">最長継続記録</span>
                      <span className="font-medium text-[#8b4513]">{overallStats.longestHabitStreak}日</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-[#7c5a2a]">平均達成率</span>
                      <span className="font-medium text-[#8b4513]">{overallStats.averageHabitCompletionRate}%</span>
                    </li>
                  </ul>
                </div>
              
                  <div className="wood-frame rounded-xl p-6">
                    <h4 className="text-lg font-medium text-[#8b4513] mb-2">タスクの状態</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-[#7c5a2a]">未着手</span>
                        <span className="font-medium text-[#8b4513]">{overallStats.pendingTasks}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-[#7c5a2a]">進行中</span>
                        <span className="font-medium text-[#8b4513]">{overallStats.inProgressTasks}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-[#7c5a2a]">完了</span>
                        <span className="font-medium text-[#8b4513]">{overallStats.completedTasks}</span>
                      </li>
                    </ul>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </AppLayout>
  );
} 