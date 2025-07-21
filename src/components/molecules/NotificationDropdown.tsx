import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaBell, FaExclamationTriangle, FaClock, FaCheckCircle, FaCrown, FaRobot, FaShieldAlt, FaFire, FaTimes, FaCheck } from 'react-icons/fa';
import { MdLocalPostOffice } from 'react-icons/md';
import { Task } from '@/types/task';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

const supabase = createClientComponentClient();

interface NotificationDropdownProps {
  tasks: Task[];
}

interface DatabaseNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  category: 'task' | 'habit' | 'subscription' | 'system' | 'ai';
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface TaskNotification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  time?: string;
  taskId?: string;
  category: 'task' | 'habit' | 'subscription' | 'system' | 'ai';
  priority: 'high' | 'medium' | 'low';
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ tasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [databaseNotifications, setDatabaseNotifications] = useState<DatabaseNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // データベース通知を取得（NotificationBannerと同じロジック）
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('通知取得エラー:', error);
        } else {
          setDatabaseNotifications(data || []);
        }
      } catch (error) {
        console.error('通知取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // 通知を既読にする
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setDatabaseNotifications((prev: DatabaseNotification[]) => prev.filter((n: DatabaseNotification) => n.id !== notificationId));
    } catch (error) {
      console.error('通知既読エラー:', error);
    }
  };

  // すべての通知を既読にする
  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      setDatabaseNotifications([]);
      setIsOpen(false);
    } catch (error) {
      console.error('全通知既読エラー:', error);
    }
  };

  // タスクベース通知の生成（通知設定を考慮）
  const generateTaskNotifications = (): TaskNotification[] => {
    if (!user?.notification_settings) return [];

    const notifications: TaskNotification[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // タスク通知（通知設定が有効な場合のみ）
    if (user.notification_settings.task) {
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
          taskId: task.id,
          category: 'task',
          priority: daysDiff === 0 ? 'high' : 'medium'
        });
      });
    }

    // 習慣通知（通知設定が有効な場合のみ）
    if (user.notification_settings.habit) {
      const expiredHabits = tasks.filter(task => {
        if (task.habit_status !== 'active' || task.status === 'done') return false;
        
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
          taskId: task.id,
          category: 'habit',
          priority: 'medium'
        });
      });
    }

    return notifications;
  };

  // 通知設定に基づいてフィルタリング（デフォルトで有効）
  const filterNotificationsBySettings = (notifications: (DatabaseNotification | TaskNotification)[]) => {
    if (!user?.notification_settings) return notifications;

    return notifications.filter(notification => {
      const category = 'category' in notification ? notification.category : 
                     (notification as any).type?.includes('subscription') ? 'subscription' :
                     (notification as any).type?.includes('system') ? 'system' :
                     (notification as any).type?.includes('ai') ? 'ai' : 'task';
      
      // 通知設定が未定義の場合は表示する（デフォルトで有効）
      return user.notification_settings?.[category] !== false;
    });
  };

  // データベース通知をTaskNotification形式に変換
  const convertDatabaseNotifications = (): TaskNotification[] => {
    return databaseNotifications.map(dbNotif => ({
      id: dbNotif.id,
      type: dbNotif.priority === 'high' ? 'warning' : 
            dbNotif.priority === 'medium' ? 'info' : 'success',
      title: dbNotif.title,
      message: dbNotif.message,
      category: dbNotif.category,
      priority: dbNotif.priority
    }));
  };

  // 全通知を統合
  const allNotifications = filterNotificationsBySettings([
    ...convertDatabaseNotifications(),
    ...generateTaskNotifications()
  ]);

  const notificationCount = allNotifications.length;

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

  const getNotificationIcon = (notification: TaskNotification) => {
    // カテゴリに基づくアイコン
    if (notification.category === 'subscription') {
      return <span className="text-lg">👑</span>;
    } else if (notification.category === 'ai') {
      return <span className="text-lg">🤖</span>;
    } else if (notification.category === 'system') {
      return <span className="text-lg">🛡️</span>;
    } else if (notification.category === 'habit') {
      return <span className="text-lg">🔥</span>;
    } else if (notification.category === 'task') {
      return <span className="text-lg">📝</span>;
    }

    // タイプに基づくアイコン（フォールバック）
    switch (notification.type) {
      case 'warning':
        return <span className="text-lg">⚠️</span>;
      case 'info':
        return <span className="text-lg">ℹ️</span>;
      case 'success':
        return <span className="text-lg">✅</span>;
      default:
        return <span className="text-lg">📢</span>;
    }
  };

  // 通知が既読可能かどうかを判定
  const isReadable = (notification: DatabaseNotification | TaskNotification) => {
    return 'is_read' in notification; // データベース通知のみ既読可能
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知ベルアイコン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f0e8d8] rounded-lg transition-colors"
        title="通知"
      >
        {MdLocalPostOffice({ className: "w-6 h-6 text-[#7c5a2a] hover:text-[#8b4513] transition-colors" })}
        {/* 通知数バッジ */}
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* ドロップダウンメニュー（ポータルでbody直下に出す） */}
      {isOpen && ReactDOM.createPortal(
        <>
          {/* モバイル用ドロップダウン（中央寄せ） */}
          <div className="md:hidden fixed left-1/2 -translate-x-1/2 right-0 top-[5.5rem] w-80 sm:w-[calc(100vw-2rem)] max-w-[320px] sm:max-w-none bg-[#f5f5dc] rounded-lg shadow-lg border border-[#deb887] z-[100000]">
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-[#deb887]/30 bg-[#f0e8d8] rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#8b4513]">
                    通知 {notificationCount > 0 && `(${notificationCount})`}
                  </h3>
                </div>
                {databaseNotifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#8b4513] hover:text-[#7c5a2a] transition-colors"
                  >
                    すべて既読
                  </button>
                )}
              </div>
            </div>

            {/* 通知一覧 */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-6 text-center text-[#7c5a2a] text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8b4513] mx-auto mb-2"></div>
                  読み込み中...
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-[#7c5a2a] text-sm">
                  新しい通知はありません
                </div>
              ) : (
                <div className="py-2">
                  {allNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-[#f0e8d8] cursor-pointer border-b border-[#deb887]/30 last:border-b-0 relative ${
                        isReadable(notification) ? 'bg-[#f5f5dc]' : 'bg-[#faf8f0]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification as TaskNotification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#8b4513]">
                            {notification.title}
                          </p>
                          <p className="text-sm text-[#7c5a2a] mt-1">
                            {notification.message}
                          </p>
                          {'time' in notification && notification.time && (
                            <p className="text-xs text-[#a0522d] mt-1">
                              {notification.time}
                            </p>
                          )}
                          {'created_at' in notification && (
                            <p className="text-xs text-[#a0522d] mt-1">
                              {new Date(notification.created_at).toLocaleString('ja-JP')}
                            </p>
                          )}
                        </div>
                        {/* 既読ボタン（データベース通知のみ） */}
                        {isReadable(notification) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              markAsRead(notification.id);
                            }}
                            className="text-[#8b4513] hover:text-[#7c5a2a] transition-colors flex-shrink-0 p-1 relative z-10"
                            title="既読にする"
                          >
                            {FaCheck ({className:"w-3 h-3"})}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* デスクトップ用ドロップダウン（右寄せ） */}
          <div className="hidden md:block fixed right-4 top-20 mt-2 w-80 bg-[#f5f5dc] rounded-lg shadow-lg border border-[#deb887] z-[100000]">
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-[#deb887]/30 bg-[#f0e8d8] rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#8b4513]">
                    通知 {notificationCount > 0 && `(${notificationCount})`}
                  </h3>
                </div>
                {databaseNotifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#8b4513] hover:text-[#7c5a2a] transition-colors"
                  >
                    すべて既読
                  </button>
                )}
              </div>
            </div>

            {/* 通知一覧 */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-6 text-center text-[#7c5a2a] text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8b4513] mx-auto mb-2"></div>
                  読み込み中...
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-[#7c5a2a] text-sm">
                  新しい通知はありません
                </div>
              ) : (
                <div className="py-2">
                  {allNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-[#f0e8d8] cursor-pointer border-b border-[#deb887]/30 last:border-b-0 relative ${
                        isReadable(notification) ? 'bg-[#f5f5dc]' : 'bg-[#faf8f0]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification as TaskNotification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#8b4513]">
                            {notification.title}
                          </p>
                          <p className="text-sm text-[#7c5a2a] mt-1">
                            {notification.message}
                          </p>
                          {'time' in notification && notification.time && (
                            <p className="text-xs text-[#a0522d] mt-1">
                              {notification.time}
                            </p>
                          )}
                          {'created_at' in notification && (
                            <p className="text-xs text-[#a0522d] mt-1">
                              {new Date(notification.created_at).toLocaleString('ja-JP')}
                            </p>
                          )}
                        </div>
                        {/* 既読ボタン（データベース通知のみ） */}
                        {isReadable(notification) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              markAsRead(notification.id);
                            }}
                            className="text-[#8b4513] hover:text-[#7c5a2a] transition-colors flex-shrink-0 p-1 relative z-10"
                            title="既読にする"
                          >
                            {FaCheck ({className:"w-3 h-3"})}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}; 