import React, { useMemo } from 'react';
import { Task } from '@/types/task';
import { FaExclamationTriangle, FaClock, FaCheckCircle, FaFire, FaGem } from 'react-icons/fa';
import { getRiskyStreakTasks, getExpiredStreakTasks, getActiveStreakTasks } from '@/lib/streakUtils';
import { useAuth } from '@/contexts/AuthContext';

interface Alert {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  icon: React.ReactNode;
}

interface AlertBoxProps {
  tasks?: Task[];
}

export const AlertBox: React.FC<AlertBoxProps> = ({ tasks = [] }) => {
  const { isGuest, planType } = useAuth();
  
  const alerts = useMemo(() => {
    const alerts: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 期限切れタスクのチェック
    const overdueTasks = tasks.filter(task => 
      task.status !== 'done' && 
      task.due_date && 
      new Date(task.due_date) < today
    );

    if (overdueTasks.length > 0) {
      alerts.push({
        type: 'warning',
        title: '期限切れタスクあり',
        message: `${overdueTasks.length}件のタスクが期限を過ぎています`,
        icon: FaExclamationTriangle({ className: "w-4 h-4" })
      });
    }

    // 今日締切のタスクのチェック
    const todayDueTasks = tasks.filter(task => 
      task.status !== 'done' && 
      task.due_date && 
      new Date(task.due_date).toDateString() === today.toDateString()
    );

    if (todayDueTasks.length > 0) {
      alerts.push({
        type: 'info',
        title: '今日締切のタスク',
        message: `${todayDueTasks.length}件のタスクが今日締切です`,
        icon: FaClock({ className: "w-4 h-4" })
      });
    }

    // 継続が危険な習慣タスクのチェック
    const riskyStreaks = getRiskyStreakTasks(tasks as any);
    if (riskyStreaks.length > 0) {
      alerts.push({
        type: 'warning',
        title: '継続が危険です！',
        message: `${riskyStreaks.length}件の習慣が途切れそうです`,
        icon: FaExclamationTriangle({ className: "w-4 h-4" })
      });
    }

    // 期限切れストリークのチェック
    const expiredStreaks = getExpiredStreakTasks(tasks as any);
    if (expiredStreaks.length > 0) {
      alerts.push({
        type: 'error',
        title: 'ストリークが途切れました',
        message: `${expiredStreaks.length}件の習慣の継続が途切れています`,
        icon: FaExclamationTriangle({ className: "w-4 h-4" })
      });
    }

    // 完了タスクの励まし
    const completedToday = tasks.filter(task => 
      task.status === 'done' && 
      task.completed_at &&
      new Date(task.completed_at).toDateString() === today.toDateString()
    );

    if (completedToday.length >= 3) {
      alerts.push({
        type: 'success',
        title: '素晴らしい進捗！',
        message: `今日は${completedToday.length}件のタスクを完了しました`,
        icon: FaCheckCircle({ className: "w-4 h-4" })
      });
    }

    // 長期継続の達成を祝う
    const longStreaks = getActiveStreakTasks(tasks as any).filter(task => 
      (task.current_streak || 0) >= 7
    );

    if (longStreaks.length > 0) {
      const maxStreak = Math.max(...longStreaks.map(task => task.current_streak || 0));
      alerts.push({
        type: 'success',
        title: '素晴らしい継続力！',
        message: `最長${maxStreak}日継続中！${longStreaks.length}件の習慣を1週間以上継続中`,
        icon: FaFire({ className: "w-4 h-4" })
      });
    }

    // プレミアム機能予告通知（週1回程度の頻度で表示）
    if (!isGuest && planType === 'free') {
      const weekOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      // 週番号が偶数の場合のみ表示（頻度調整）
      if (weekOfYear % 2 === 0) {
        alerts.push({
          type: 'info',
          title: '🚀 プレミアム機能開発中',
          message: '詳細な分析レポートとAI専属コーチ機能を準備中です',
          icon: FaGem({ className: "w-4 h-4" })
        });
      }
    }

    return alerts;
  }, [tasks, isGuest, planType]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">通知</h3>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-3 rounded-lg bg-gray-50 border-l-4 border-gray-300">
            <div className="flex items-start">
              <div className="flex-shrink-0 text-gray-400">
                {FaCheckCircle({ className: "w-4 h-4" })}
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-600">
                  すべて順調です
                </h4>
                <p className="text-sm text-gray-500">
                  現在お知らせはありません
                </p>
              </div>
            </div>
          </div>
        ) : (
          alerts.map((alert, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-l-4 ${
              alert.type === 'success'
                ? 'bg-green-50 border-green-400'
                : alert.type === 'warning'
                ? 'bg-yellow-50 border-yellow-400'
                : alert.type === 'info'
                ? 'bg-blue-50 border-blue-400'
                : 'bg-red-50 border-red-400'
            }`}
          >
            <div className="flex items-start">
              <div
                className={`flex-shrink-0 ${
                  alert.type === 'success'
                    ? 'text-green-500'
                    : alert.type === 'warning'
                    ? 'text-yellow-500'
                    : alert.type === 'info'
                    ? 'text-blue-500'
                    : 'text-red-500'
                }`}
              >
                {alert.icon}
              </div>
              <div className="ml-3">
                <h4
                  className={`text-sm font-medium ${
                    alert.type === 'success'
                      ? 'text-green-800'
                      : alert.type === 'warning'
                      ? 'text-yellow-800'
                      : alert.type === 'info'
                      ? 'text-blue-800'
                      : 'text-red-800'
                  }`}
                >
                  {alert.title}
                </h4>
                <p
                  className={`text-sm ${
                    alert.type === 'success'
                      ? 'text-green-700'
                      : alert.type === 'warning'
                      ? 'text-yellow-700'
                      : alert.type === 'info'
                      ? 'text-blue-700'
                      : 'text-red-700'
                  }`}
                >
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}; 