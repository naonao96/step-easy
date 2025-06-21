import React, { useEffect, useState } from 'react';
import { FaHistory, FaClock, FaCheckCircle } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

interface ExecutionLog {
  id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  task_title: string;
  is_completed: boolean;
}

export const ExecutionHistoryWidget: React.FC = () => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchExecutionLogs();
  }, [user]);

  const fetchExecutionLogs = async () => {
    if (!user) return;

    try {
      const supabase = createClientComponentClient();
      
      // 実行履歴を取得（タスク情報も一緒に）
      const { data: logs, error } = await supabase
        .from('execution_logs')
        .select(`
          id,
          task_id,
          start_time,
          end_time,
          duration,
          is_completed,
          tasks!inner(title)
        `)
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .order('end_time', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedLogs: ExecutionLog[] = logs?.map(log => ({
        id: log.id,
        task_id: log.task_id,
        start_time: log.start_time,
        end_time: log.end_time,
        duration: log.duration,
        task_title: (log.tasks as any).title,
        is_completed: log.is_completed
      })) || [];

      setLogs(formattedLogs);
    } catch (error) {
      console.error('実行履歴取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          {FaHistory({ className: "w-4 h-4 text-gray-500" })}
          <span className="text-sm font-medium text-gray-600">実行履歴</span>
        </div>
        <div className="text-center text-gray-500 text-sm py-4">
          読み込み中...
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          {FaHistory({ className: "w-4 h-4 text-gray-500" })}
          <span className="text-sm font-medium text-gray-600">実行履歴</span>
        </div>
        <div className="text-center text-gray-500 text-sm py-4">
          まだ実行履歴がありません
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        {FaHistory({ className: "w-4 h-4 text-gray-500" })}
        <span className="text-sm font-medium text-gray-600">実行履歴</span>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {FaCheckCircle({ className: "w-3 h-3 text-green-500 shrink-0" })}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {log.task_title}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(log.end_time)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
              {FaClock({ className: "w-3 h-3" })}
              {formatTime(log.duration)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 