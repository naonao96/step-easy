import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaExclamationTriangle, FaClock, FaCheckCircle } from 'react-icons/fa';
import { Task } from '@/types/task';

interface NotificationDropdownProps {
  tasks: Task[];
}

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  time?: string;
  taskId?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ tasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 通知の生成
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 期限が近いタスクの通知
    const upcomingTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'done') return false;
      
      const dueDate = new Date(task.due_date);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff <= 2 && daysDiff >= 0; // 今日～2日後
    });

    upcomingTasks.forEach(task => {
      const dueDate = new Date(task.due_date!);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let timeText = '';
      if (daysDiff === 0) timeText = '今日';
      else if (daysDiff === 1) timeText = '明日';
      else timeText = `${daysDiff}日後`;

      notifications.push({
        id: `due-${task.id}`,
        type: daysDiff === 0 ? 'warning' : 'info',
        title: '期限が近いタスク',
        message: `${task.title} (期限: ${timeText})`,
        time: timeText,
        taskId: task.id
      });
    });

    // 習慣タスクの期限切れ通知
    const expiredHabits = tasks.filter(task => {
      if (!task.is_habit || task.status === 'done') return false;
      
      if (task.last_completed_date) {
        const lastCompleted = new Date(task.last_completed_date);
        const daysSinceCompletion = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 3600 * 24));
        return daysSinceCompletion > 1; // 1日以上経過
      }
      
      return false;
    });

    expiredHabits.forEach(task => {
      notifications.push({
        id: `habit-${task.id}`,
        type: 'warning',
        title: '習慣タスクの継続',
        message: `${task.title} の継続が途切れています`,
        taskId: task.id
      });
    });

    return notifications;
  };

  const notifications = generateNotifications();
  const notificationCount = notifications.length;

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return FaExclamationTriangle({ className: "w-4 h-4 text-orange-500" });
      case 'info':
        return FaClock({ className: "w-4 h-4 text-blue-500" });
      case 'success':
        return FaCheckCircle({ className: "w-4 h-4 text-green-500" });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知ベルアイコン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="通知"
      >
        {FaBell ({className:"w-5 h-5 text-[#7c5a2a] hover:text-yellow-900"})}
        
        {/* 通知数バッジ */}
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <>
          {/* モバイル用ドロップダウン（中央寄せ） */}
          <div className="md:hidden fixed left-1/2 -translate-x-1/2 right-0 mt-2 w-80 sm:w-[calc(100vw-2rem)] max-w-[320px] sm:max-w-none bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                通知 {notificationCount > 0 && `(${notificationCount})`}
              </h3>
            </div>

            {/* 通知一覧 */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  新しい通知はありません
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.time && (
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* フッター */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  すべて確認済み
                </button>
              </div>
            )}
          </div>

          {/* デスクトップ用ドロップダウン（右寄せ） */}
          <div className="hidden md:block absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                通知 {notificationCount > 0 && `(${notificationCount})`}
              </h3>
            </div>

            {/* 通知一覧 */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  新しい通知はありません
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.time && (
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* フッター */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  すべて確認済み
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}; 