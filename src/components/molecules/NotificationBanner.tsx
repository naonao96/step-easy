import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaTimes, FaBell } from 'react-icons/fa';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showBanner, setShowBanner] = useState(false);
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
        .limit(5);

      if (data && data.length > 0) {
        setNotifications(data);
        setShowBanner(true);
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notifications.length <= 1) {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      setNotifications([]);
      setShowBanner(false);
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  if (!showBanner || notifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {FaBell ({className:"w-4 h-4 text-yellow-600"})}
            <span className="text-sm font-medium text-yellow-800">
              通知 ({notifications.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-xs text-yellow-600 hover:text-yellow-800 transition-colors"
            >
              すべて既読
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-yellow-600 hover:text-yellow-800 transition-colors"
            >
              {FaTimes ({className:"w-4 h-4"})}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {notifications.map(notification => (
            <div key={notification.id} className="flex items-start justify-between bg-white/70 rounded-lg p-3 border border-yellow-200/50">
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 text-sm mb-1">
                  {notification.title}
                </h3>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  {notification.message}
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  {new Date(notification.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
              <button
                onClick={() => markAsRead(notification.id)}
                className="ml-3 text-yellow-600 hover:text-yellow-800 transition-colors flex-shrink-0"
              >
                {FaTimes ({className:"w-3 h-3"})}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 