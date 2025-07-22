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
  is_read: boolean; // 追加
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

      setDatabaseNotifications((prev: DatabaseNotification[]) =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      // setIsOpen(false); ← これを呼ばないことでドロップダウンを閉じない
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

      setDatabaseNotifications((prev: DatabaseNotification[]) =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      // setIsOpen(false); ← これを呼ばないことでドロップダウンを閉じない
    } catch (error) {
      console.error('全通知既読エラー:', error);
    }
  };

  // データベース通知をTaskNotification形式に変換
  const convertDatabaseNotifications = (): (TaskNotification & { is_read: boolean })[] => {
    return databaseNotifications.map(dbNotif => ({
      id: dbNotif.id,
      type: dbNotif.priority === 'high' ? 'warning' : 
            dbNotif.priority === 'medium' ? 'info' : 'success',
      title: dbNotif.title,
      message: dbNotif.message,
      category: dbNotif.category,
      priority: dbNotif.priority,
      is_read: dbNotif.is_read
    }));
  };

  // DB通知のみを表示
  const allNotifications = convertDatabaseNotifications();
  const unreadCount = allNotifications.filter(n => !n.is_read).length;

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
    <div className="relative">
      {/* 通知ベルアイコン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f0e8d8] rounded-lg transition-colors"
        title="通知"
      >
        {MdLocalPostOffice({ className: "w-6 h-6 text-[#7c5a2a] hover:text-[#8b4513] transition-colors" })}
        {/* 通知数バッジ */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ドロップダウンメニュー（ポータルでbody直下に出す） */}
      {isOpen && ReactDOM.createPortal(
        <>
          {/* モバイル用ドロップダウン（中央寄せ） */}
          <div ref={dropdownRef} className="md:hidden fixed left-1/2 -translate-x-1/2 right-0 top-[5.5rem] w-80 sm:w-[calc(100vw-2rem)] max-w-[320px] sm:max-w-none bg-[#f5f5dc] rounded-lg shadow-lg border border-[#deb887] z-[100000]">
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-[#deb887]/30 bg-[#f0e8d8] rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#8b4513]">
                    通知 {unreadCount > 0 && `(${unreadCount})`}
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
                      className={`px-4 py-3 hover:bg-[#f0e8d8] cursor-pointer border-b border-[#deb887]/30 last:border-b-0 relative
                        ${notification.is_read ? 'bg-[#f0e8d8] text-[#b0a18b]' : 'bg-[#f5f5dc] text-[#8b4513] font-semibold'}
                      `}
                      onClick={e => {
                        if (isReadable(notification)) {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }
                      }}
                      style={{ cursor: isReadable(notification) ? 'pointer' : 'default' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification as TaskNotification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notification.is_read ? 'font-normal text-[#b0a18b]' : 'font-bold text-[#8b4513]'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mt-1 ${notification.is_read ? 'font-normal text-[#b0a18b]' : 'font-bold text-[#8b4513]'}`} style={{ whiteSpace: 'pre-line' }}>
                            {notification.message}
                          </p>
                          {'created_at' in notification && (
                            <p className="text-xs text-[#a0522d] mt-1">
                              {new Date(String(notification.created_at)).toLocaleString('ja-JP')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* デスクトップ用ドロップダウン（右寄せ） */}
          <div ref={dropdownRef} className="hidden md:block fixed right-4 top-20 mt-2 w-80 bg-[#f5f5dc] rounded-lg shadow-lg border border-[#deb887] z-[100000]">
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-[#deb887]/30 bg-[#f0e8d8] rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#8b4513]">
                    通知 {unreadCount > 0 && `(${unreadCount})`}
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
                      onClick={e => {
                        if (isReadable(notification)) {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }
                      }}
                      style={{ cursor: isReadable(notification) ? 'pointer' : 'default' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification as TaskNotification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notification.is_read ? 'font-normal text-[#b0a18b]' : 'font-bold text-[#8b4513]'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mt-1 ${notification.is_read ? 'font-normal text-[#b0a18b]' : 'font-bold text-[#8b4513]'}`} style={{ whiteSpace: 'pre-line' }}>
                            {notification.message}
                          </p>
                          {'created_at' in notification && (
                            <p className="text-xs text-[#a0522d] mt-1">
                              {new Date(String(notification.created_at)).toLocaleString('ja-JP')}
                            </p>
                          )}
                        </div>
                        {/* 既読ボタンは不要なので削除 */}
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