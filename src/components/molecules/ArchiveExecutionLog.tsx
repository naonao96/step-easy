import React, { useEffect, useState, useMemo } from 'react';
import { FaHistory, FaClock, FaCheckCircle, FaPlay } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

interface NormalizedExecutionLog {
  id: string;
  task_id: string | null;
  habit_id: string | null;
  start_time: string;
  end_time: string | null;
  duration: number;
  title: string;
  is_completed: boolean;
  device_type: string;
  sourceType: 'task' | 'habit' | 'unknown';
}

interface ArchiveExecutionLogProps {
  dateFilter: 'all' | '7days' | '14days' | '30days';
  searchQuery: string;
}

export const ArchiveExecutionLog: React.FC<ArchiveExecutionLogProps> = ({ 
  dateFilter, 
  searchQuery 
}) => {
  const [logs, setLogs] = useState<NormalizedExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'task'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { user } = useAuth();

  useEffect(() => {
    fetchExecutionLogs();
  }, [user, dateFilter, searchQuery]);

  const fetchExecutionLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const supabase = createClientComponentClient();
      
      // 日付フィルターの計算
      const now = new Date();
      let startDate: Date | null = null;
      
      switch (dateFilter) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '14days':
          startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      // 取りこぼし防止のため LEFT JOIN で tasks/habits のタイトルを取得
      let query = supabase
        .from('execution_logs')
        .select(`
          id,
          user_id,
          task_id,
          habit_id,
          start_time,
          end_time,
          duration,
          is_completed,
          device_type,
          tasks!left(title),
          habits!left(title)
        `)
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }

      // ソートは後段で統一キー（title/date/duration）に対してクライアント側で実施
      const { data, error } = await query.order('start_time', { ascending: false });
      if (error) throw error;

      const normalized: NormalizedExecutionLog[] = (data || []).map((row: any) => {
        const title = row.tasks?.title || row.habits?.title || '（削除済み）';
        const sourceType: 'task' | 'habit' | 'unknown' = row.task_id ? 'task' : row.habit_id ? 'habit' : 'unknown';
        return {
          id: row.id,
          task_id: row.task_id ?? null,
          habit_id: row.habit_id ?? null,
          start_time: row.start_time,
          end_time: row.end_time ?? null,
          duration: row.duration,
          title,
          is_completed: row.is_completed,
          device_type: row.device_type,
          sourceType
        };
      });

      // 削除済みログを除外
      const nonDeleted = normalized.filter(l => l.title !== '（削除済み）');

      // 検索は統一タイトルでクライアント側に適用
      const searched = searchQuery
        ? nonDeleted.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : nonDeleted;

      // ソートをクライアント側で適用
      const sorted = [...searched].sort((a, b) => {
        if (sortBy === 'date') {
          const delta = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          return sortOrder === 'asc' ? delta : -delta;
        } else if (sortBy === 'duration') {
          const delta = a.duration - b.duration;
          return sortOrder === 'asc' ? delta : -delta;
        } else {
          // task名ソート（習慣も含む統一タイトル）
          const nameA = a.title || '';
          const nameB = b.title || '';
          const delta = nameA.localeCompare(nameB, 'ja');
          return sortOrder === 'asc' ? delta : -delta;
        }
      });

      setLogs(sorted);
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
      return `${hours}h ${minutes}m`;
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

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return '📱';
      case 'desktop':
        return '💻';
      default:
        return '🖥️';
    }
  };

  const handleSort = (field: 'date' | 'duration' | 'task') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // 統計情報の計算
  const stats = useMemo(() => {
    const totalExecutions = logs.length;
    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
    const avgDuration = totalExecutions > 0 ? Math.floor(totalDuration / totalExecutions) : 0;
    const uniqueTasks = new Set(logs.map(log => log.task_id || log.habit_id || log.id)).size;

    return {
      totalExecutions,
      totalDuration,
      avgDuration,
      uniqueTasks
    };
  }, [logs]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ローディングリスト */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* StepEasyらしい統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="wood-frame rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#f5f5dc] rounded-lg">
              {FaPlay ({className:"w-6 h-6 text-[#7c5a2a]"})}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[#7c5a2a]">総実行回数</p>
              <p className="text-2xl font-bold text-[#8b4513]">{stats.totalExecutions}</p>
            </div>
          </div>
        </div>
        <div className="wood-frame rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#f5f5dc] rounded-lg">
              {FaClock ({className:"w-6 h-6 text-[#7c5a2a]"})}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[#7c5a2a]">総実行時間</p>
              <p className="text-2xl font-bold text-[#8b4513]">{formatTime(stats.totalDuration)}</p>
            </div>
          </div>
        </div>
        <div className="wood-frame rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#f5f5dc] rounded-lg">
              {FaHistory ({className:"w-6 h-6 text-[#7c5a2a]"})}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[#7c5a2a]">平均時間</p>
              <p className="text-2xl font-bold text-[#8b4513]">{formatTime(stats.avgDuration)}</p>
            </div>
          </div>
        </div>
        <div className="wood-frame rounded-xl p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#f5f5dc] rounded-lg">
              {FaCheckCircle ({className:"w-6 h-6 text-[#7c5a2a]"})}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[#7c5a2a]">実行タスク数</p>
              <p className="text-2xl font-bold text-[#8b4513]">{stats.uniqueTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ソートコントロール */}
      <div className="wood-frame rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#8b4513]">実行履歴</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#7c5a2a]">並び替え:</span>
            <div className="flex gap-1">
              {[
                { key: 'date', label: '日時' },
                { key: 'duration', label: '時間' },
                { key: 'task', label: 'タスク' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key as any)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    sortBy === key
                      ? 'bg-[#7c5a2a] text-white'
                      : 'bg-[#f5f5dc] text-[#7c5a2a] hover:bg-[#deb887]'
                  }`}
                >
                  {label}
                  {sortBy === key && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 実行ログリスト */}
      {logs.length === 0 ? (
        <div className="wood-frame rounded-xl p-12 text-center">
          {FaHistory ({className:"w-16 h-16 text-[#deb887] mx-auto mb-4"})}
          <h3 className="text-lg font-semibold text-[#8b4513] mb-2">
            実行履歴がありません
          </h3>
          <p className="text-[#7c5a2a]">
            タスクを実行すると、ここに履歴が表示されます
          </p>
        </div>
      ) : (
        <div className="wood-frame rounded-xl overflow-hidden">
          <div className="divide-y divide-[#deb887]">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 hover:bg-[#f5f5dc] transition-colors"
              >
                <div className="flex-shrink-0">
                  {FaPlay ({className:"w-5 h-5 text-[#7c5a2a]"})}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#8b4513] truncate">
                    {log.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-[#7c5a2a]">
                      {formatDateTime(log.start_time)}
                    </span>
                    <span className="text-[#deb887]">•</span>
                    <span className="text-sm text-[#7c5a2a]">
                      {formatDate(log.start_time)}
                    </span>
                    <span className="text-[#deb887]">•</span>
                    <span className="text-sm text-[#7c5a2a]">
                      {getDeviceIcon(log.device_type)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-medium text-[#8b4513]">
                      {formatTime(log.duration)}
                    </div>
                    <div className="text-xs text-[#7c5a2a]">
                      実行時間
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 