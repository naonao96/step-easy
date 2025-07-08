import { Badge, DEFAULT_BADGES, BadgeRequirement } from '@/types/badge';
import { Task } from '@/types/task';

// バッジ獲得条件をチェックする関数
export const checkBadgeRequirements = (
  tasks: Task[],
  completedTasks: Task[],
  totalExecutionTime: number,
  streakDays: number,
  totalDays: number
): Badge[] => {
  const unlockedBadges: Badge[] = [];

  DEFAULT_BADGES.forEach(badge => {
    if (isBadgeUnlocked(badge.requirement, {
      tasks,
      completedTasks,
      totalExecutionTime,
      streakDays,
      totalDays
    })) {
      unlockedBadges.push({
        ...badge,
        isUnlocked: true,
        unlockedAt: new Date().toISOString()
      });
    }
  });

  return unlockedBadges;
};

// 個別バッジの獲得条件をチェック
const isBadgeUnlocked = (
  requirement: BadgeRequirement,
  stats: {
    tasks: Task[];
    completedTasks: Task[];
    totalExecutionTime: number;
    streakDays: number;
    totalDays: number;
  }
): boolean => {
  switch (requirement.type) {
    case 'task_count':
      return stats.completedTasks.length >= requirement.value;
    
    case 'total_time':
      return stats.totalExecutionTime >= requirement.value;
    
    case 'streak_days':
      return stats.streakDays >= requirement.value;
    
    case 'completion_rate':
      const today = new Date().toDateString();
      const todayTasks = stats.tasks.filter(task => 
        new Date(task.created_at).toDateString() === today
      );
      const todayCompleted = stats.completedTasks.filter(task => 
        new Date(task.completed_at!).toDateString() === today
      );
      const rate = todayTasks.length > 0 ? (todayCompleted.length / todayTasks.length) * 100 : 0;
      return rate >= requirement.value;
    
    case 'special':
      return false; // 特別バッジは手動で管理
    
    default:
      return false;
  }
};

// 新しく獲得したバッジを検出
export const getNewlyUnlockedBadges = (
  previousBadges: Badge[],
  currentBadges: Badge[]
): Badge[] => {
  const previousIds = new Set(previousBadges.map(b => b.id));
  return currentBadges.filter(badge => 
    badge.isUnlocked && !previousIds.has(badge.id)
  );
};

// バッジの進捗を計算
export const calculateBadgeProgress = (
  badge: Badge,
  stats: {
    tasks: Task[];
    completedTasks: Task[];
    totalExecutionTime: number;
    streakDays: number;
    totalDays: number;
  }
): number => {
  if (badge.isUnlocked) return 100;

  const requirement = badge.requirement;
  let current = 0;
  let target = requirement.value;

  switch (requirement.type) {
    case 'task_count':
      current = stats.completedTasks.length;
      break;
    
    case 'total_time':
      current = stats.totalExecutionTime;
      break;
    
    case 'streak_days':
      current = stats.streakDays;
      break;
    
    case 'completion_rate':
      const today = new Date().toDateString();
      const todayTasks = stats.tasks.filter(task => 
        new Date(task.created_at).toDateString() === today
      );
      const todayCompleted = stats.completedTasks.filter(task => 
        new Date(task.completed_at!).toDateString() === today
      );
      current = todayTasks.length > 0 ? (todayCompleted.length / todayTasks.length) * 100 : 0;
      break;
    
    case 'special':
      current = 0;
      break;
    
    default:
      return 0;
  }

  return Math.min(Math.round((current / target) * 100), 100);
}; 