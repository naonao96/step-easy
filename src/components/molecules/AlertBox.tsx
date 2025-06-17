import React, { useMemo } from 'react';
import { Task } from '@/stores/taskStore';
import { FaExclamationTriangle, FaClock, FaCheckCircle, FaCoffee } from 'react-icons/fa';

interface AlertBoxProps {
  tasks?: Task[];
}

interface Alert {
  type: 'warning' | 'info' | 'success' | 'rest';
  title: string;
  message: string;
  icon: React.ReactNode;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ tasks = [] }) => {
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

    // 休憩提案（多くのタスクを処理している場合）
    if (completedToday.length >= 5) {
      alerts.push({
        type: 'rest',
        title: '休憩時間ですね',
        message: '頑張りすぎです。少し休憩しませんか？',
        icon: FaCoffee({ className: "w-4 h-4" })
      });
    }

    // デフォルトメッセージ（アラートがない場合）
    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        title: '順調です',
        message: '今日も一歩ずつ進んでいきましょう！',
        icon: FaCheckCircle({ className: "w-4 h-4" })
      });
    }

    return alerts;
  }, [tasks]);

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'rest':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      case 'rest':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">お知らせ</h3>
      
      <div className="space-y-3">
        {alerts.slice(0, 3).map((alert, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getAlertStyles(alert.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${getIconColor(alert.type)}`}>
                {alert.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
                <p className="text-xs opacity-90">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 3 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            他 {alerts.length - 3} 件のお知らせ
          </p>
        </div>
      )}
    </div>
  );
}; 