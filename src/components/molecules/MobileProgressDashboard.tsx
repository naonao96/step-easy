import React from 'react';
import { MobileStatsCard } from './MobileStatsCard';
import { Task } from '@/types/task';
import { DEFAULT_CATEGORIES } from '@/types/task';
import { FaCalendarCheck, FaFolderOpen, FaFire, FaChartLine } from 'react-icons/fa';
import { useHabitStore } from '@/stores/habitStore';

interface MobileProgressDashboardProps {
  tasks: Task[];
  onNavigateToTab: (tab: 'today' | 'category' | 'heatmap' | 'overall') => void;
}

export const MobileProgressDashboard: React.FC<MobileProgressDashboardProps> = ({
  tasks,
  onNavigateToTab
}) => {
  const { habits, habitCompletions } = useHabitStore();
  
  // 今日の統計を計算
  const todayStats = React.useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(task => {
      // 期間タスクの処理
      if (task.start_date && task.due_date) {
        const taskStartDate = new Date(task.start_date);
        const taskDueDate = new Date(task.due_date);
        taskStartDate.setHours(0, 0, 0, 0);
        taskDueDate.setHours(0, 0, 0, 0);
        
        if (todayDate.getTime() >= taskStartDate.getTime() && 
            todayDate.getTime() <= taskDueDate.getTime()) {
          if (task.status !== 'done') {
            return true;
          }
          if (task.status === 'done' && task.completed_at) {
            const completedDate = new Date(task.completed_at);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate.getTime() === todayDate.getTime();
          }
        }
        return false;
      }
      
      // 開始日のみのタスク
      if (task.start_date && !task.due_date) {
        const taskStartDate = new Date(task.start_date);
        taskStartDate.setHours(0, 0, 0, 0);
        
        if (todayDate.getTime() >= taskStartDate.getTime() && task.status !== 'done') {
          return true;
        }
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === todayDate.getTime();
        }
        return false;
      }
      
      // 期限日のみのタスク
      if (!task.start_date && task.due_date) {
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        
        if (todayDate.getTime() <= taskDueDate.getTime() && task.status !== 'done') {
          return true;
        }
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === todayDate.getTime();
        }
        return false;
      }
      
      // 日付なしタスク
      if (!task.start_date && !task.due_date) {
        if (task.status === 'done' && task.completed_at) {
          const completedDate = new Date(task.completed_at);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === todayDate.getTime();
        }
        
        if (task.status !== 'done') {
          return true;
        }
      }
      
      return false;
    });

    const completedToday = todayTasks.filter(task => task.status === 'done').length;
    const totalToday = todayTasks.length;
    
    // 今日の習慣を取得
    const todayDateForHabits = new Date();
    const japanTime = new Date(todayDateForHabits.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const todayString = japanTime.toISOString().split('T')[0];
    
    const todayHabits = habits.filter(habit => habit.habit_status === 'active');
    const completedHabits = habitCompletions.filter(completion => 
      completion.completed_date === todayString
    ).length;
    
    const totalCompleted = completedToday + completedHabits;
    const totalItems = totalToday + todayHabits.length;
    const percentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    return {
      completed: totalCompleted,
      total: totalItems,
      percentage,
      taskCompleted: completedToday,
      taskTotal: totalToday,
      habitCompleted: completedHabits,
      habitTotal: todayHabits.length
    };
  }, [tasks, habits, habitCompletions]);

  // カテゴリ統計を計算
  const categoryStats = React.useMemo(() => {
    const activeCategoriesCount = DEFAULT_CATEGORIES.filter(category => {
      return tasks.some(task => task.category === category.id);
    }).length;

    const mostProductiveCategory = DEFAULT_CATEGORIES
      .map(category => {
        const categoryTasks = tasks.filter(task => task.category === category.id);
        const completed = categoryTasks.filter(task => task.status === 'done').length;
        return {
          ...category,
          total: categoryTasks.length,
          completed,
          percentage: categoryTasks.length > 0 ? Math.round((completed / categoryTasks.length) * 100) : 0
        };
      })
      .filter(stat => stat.total > 0)
      .sort((a, b) => b.percentage - a.percentage)[0];

    return {
      activeCount: activeCategoriesCount,
      mostProductive: mostProductiveCategory
    };
  }, [tasks]);

  // 全体統計を計算
  const overallStats = React.useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completed: completedTasks,
      total: totalTasks,
      percentage
    };
  }, [tasks]);

  // 連続達成日数を計算（簡易版）
  const streakDays = React.useMemo(() => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const dayTasks = tasks.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === checkDate.getTime();
      });
      
      if (dayTasks.length > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [tasks]);



  // 習慣統計を計算
  const habitStats = React.useMemo(() => {
    const habitTasks = tasks.filter(task => task.is_habit);
    const completedHabits = habitTasks.filter(task => task.status === 'done').length;
    
    const averageStreak = habitTasks.length > 0 ? 
      Math.round(habitTasks.reduce((sum, habit) => sum + (habit.current_streak || 0), 0) / habitTasks.length) : 0;

    return {
      total: habitTasks.length,
      completed: completedHabits,
      averageStreak,
      percentage: habitTasks.length > 0 ? Math.round((completedHabits / habitTasks.length) * 100) : 0
    };
  }, [tasks]);

  return (
    <div className="md:hidden px-4 py-6 space-y-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#8b4513] mb-2">進捗ダッシュボード</h1>
        <p className="text-sm text-[#7c5a2a]">カードをタップして詳細を確認</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* 今日の達成度カード */}
        <MobileStatsCard
          title="今日の達成度"
          icon={React.createElement(FaCalendarCheck as React.ComponentType<any>, { className: "w-5 h-5" })}
          value={`${todayStats.completed}/${todayStats.total}`}
          subtitle={`${todayStats.percentage}% 完了 (タスク: ${todayStats.taskCompleted}/${todayStats.taskTotal}, 習慣: ${todayStats.habitCompleted}/${todayStats.habitTotal})`}
          progress={todayStats.percentage}
          onClick={() => onNavigateToTab('today')}
        />

        {/* カテゴリ別統計カード */}
        <MobileStatsCard
          title="カテゴリ別統計"
          icon={React.createElement(FaFolderOpen as React.ComponentType<any>, { className: "w-5 h-5" })}
          value={categoryStats.activeCount}
          subtitle={categoryStats.mostProductive ? 
            `最高: ${categoryStats.mostProductive.name} (${categoryStats.mostProductive.percentage}%)` : 
            'アクティブなカテゴリ'
          }
          progress={categoryStats.mostProductive?.percentage}
          onClick={() => onNavigateToTab('category')}
        />

        {/* 完了時間ヒートマップカード */}
        <MobileStatsCard
          title="完了時間ヒートマップ"
          icon={React.createElement(FaFire as React.ComponentType<any>, { className: "w-5 h-5" })}
          value={`${streakDays}日`}
          subtitle="連続活動日数"
          onClick={() => onNavigateToTab('heatmap')}
        />

        {/* 全体統計カード */}
        <MobileStatsCard
          title="全体統計"
          icon={React.createElement(FaChartLine as React.ComponentType<any>, { className: "w-5 h-5" })}
          value={`${overallStats.completed}/${overallStats.total}`}
          subtitle={`総合達成率 ${overallStats.percentage}%`}
          progress={overallStats.percentage}
          onClick={() => onNavigateToTab('overall')}
        />



        {/* 習慣統計カード */}
        {habitStats.total > 0 && (
          <MobileStatsCard
            title="習慣統計"
            icon={<span className="text-lg">🔄</span>}
            value={`${habitStats.completed}/${habitStats.total}`}
            subtitle={`平均継続 ${habitStats.averageStreak}日 (${habitStats.percentage}%)`}
            progress={habitStats.percentage}
            onClick={() => onNavigateToTab('overall')}
          />
        )}


      </div>
    </div>
  );
}; 