import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaTimes, FaCheck } from 'react-icons/fa';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  priority?: 'high' | 'medium' | 'low';
  category?: 'task' | 'habit' | 'subscription' | 'system' | 'ai';
}

export const NotificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1); // 最新の1件のみ表示

      if (data && data.length > 0) {
        setNotifications(data);
        showNextNotification();
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
    }
  };

  const showNextNotification = () => {
    if (notifications.length > 0) {
      setCurrentNotification(notifications[0]);
      setShowToast(true);
      
      // 5秒後に自動消去
      setTimeout(() => {
        setShowToast(false);
        setTimeout(() => {
          if (notifications.length > 1) {
            setNotifications(prev => prev.slice(1));
            showNextNotification();
          }
        }, 300); // アニメーション完了後
      }, 5000);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('id', notificationId);

      setShowToast(false);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notifications.length > 1) {
          showNextNotification();
        }
      }, 300);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const dismissNotification = () => {
    setShowToast(false);
    setTimeout(() => {
      if (notifications.length > 1) {
        setNotifications(prev => prev.slice(1));
        showNextNotification();
      }
    }, 300);
  };

  const getNotificationIcon = (notification: Notification) => {
    const category = notification.category;
    const priority = notification.priority;
    
    if (category === 'subscription') {
      return '👑';
    } else if (category === 'ai') {
      return '🤖';
    } else if (category === 'system') {
      return '🛡️';
    } else if (category === 'habit') {
      return '🔥';
    } else if (category === 'task') {
      return '📝';
    }
    
    // 優先度に基づくアイコン
    if (priority === 'high') {
      return '⚠️';
    } else if (priority === 'medium') {
      return 'ℹ️';
    } else {
      return '✅';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-orange-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-[#8b4513]';
    }
  };

  if (!showToast || !currentNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`
          bg-[#f5f5dc] border border-[#deb887] rounded-lg shadow-lg p-4 max-w-sm
          transition-all duration-300 ease-out transform
          ${showToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${getPriorityColor(currentNotification.priority)}
        `}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">
            {getNotificationIcon(currentNotification)}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[#8b4513] text-sm mb-1">
              {currentNotification.title}
            </h3>
            <p className="text-[#7c5a2a] text-sm leading-relaxed">
              {currentNotification.message}
            </p>
            <p className="text-[#a0522d] text-xs mt-2">
              {new Date(currentNotification.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => markAsRead(currentNotification.id)}
              className="text-[#8b4513] hover:text-[#7c5a2a] transition-colors p-1"
              title="既読にする"
            >
              {FaCheck({ className: "w-3 h-3" })}
            </button>
            <button
              onClick={dismissNotification}
              className="text-[#8b4513] hover:text-[#7c5a2a] transition-colors p-1"
              title="閉じる"
            >
              {FaTimes({ className: "w-3 h-3" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 