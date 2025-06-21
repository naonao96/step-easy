import React, { useState } from 'react';
import { Character } from './Character';
import { Task } from '@/stores/taskStore';
import { FaChevronUp, FaChevronDown, FaChartBar, FaChevronRight, FaArchive } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface MobileCollapsibleFooterProps {
  characterMood: 'happy' | 'normal' | 'sad';
  characterMessage: string;
  tasks: Task[];
  selectedDateTasks: Task[];
  selectedDate: Date;
}

export const MobileCollapsibleFooter: React.FC<MobileCollapsibleFooterProps> = ({
  characterMood,
  characterMessage,
  tasks,
  selectedDateTasks,
  selectedDate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const { isGuest } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateTime = new Date(selectedDate);
  selectedDateTime.setHours(0, 0, 0, 0);
  const isToday = selectedDateTime.getTime() === today.getTime();

  // 簡易統計の計算
  const completedToday = selectedDateTasks.filter(task => task.status === 'done').length;
  const totalToday = selectedDateTasks.length;
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // メッセージを短縮（折りたたみ時用）
  const shortMessage = characterMessage.length > 30 
    ? characterMessage.substring(0, 30) + '...' 
    : characterMessage;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      {/* 折りたたみヘッダー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-white text-sm">🤖</span>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">AIアシスタント</h3>
            <p className="text-xs text-gray-600 truncate max-w-48">
              {characterMessage.slice(0, 30)}...
            </p>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? 
            React.createElement(FaChevronDown as React.ComponentType<any>, { className: "w-4 h-4" }) :
            React.createElement(FaChevronUp as React.ComponentType<any>, { className: "w-4 h-4" })
          }
        </div>
      </button>

      {/* 展開時のコンテンツ */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
          {/* キャラクター（フル表示） */}
          <div className="mb-6 pt-4">
            <Character 
              mood={characterMood} 
              message={characterMessage} 
              layout="vertical" 
            />
          </div>

          {/* 詳細情報・機能へのアクセス */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              📊 詳細な統計情報
            </h3>
            
            {/* 進捗ページへのリンクボタン（ゲストユーザーには制限メッセージ） */}
            {isGuest ? (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(FaChartBar as React.ComponentType<any>, { 
                      className: "w-5 h-5 text-gray-400" 
                    })}
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-500">進捗ダッシュボード</h4>
                      <p className="text-xs text-gray-400">
                        ログイン後に利用可能
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push('/progress')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(FaChartBar as React.ComponentType<any>, { 
                      className: "w-5 h-5 text-blue-600" 
                    })}
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">進捗ダッシュボード</h4>
                      <p className="text-xs text-gray-600">
                        詳細な統計とグラフを確認
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {React.createElement(FaChevronRight as React.ComponentType<any>, { 
                      className: "w-4 h-4" 
                    })}
                  </div>
                </div>
              </button>
            )}

            {/* アーカイブページへのリンクボタン（ゲストユーザーには制限メッセージ） */}
            {isGuest ? (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(FaArchive as React.ComponentType<any>, { 
                      className: "w-5 h-5 text-gray-400" 
                    })}
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-500">アーカイブ</h4>
                      <p className="text-xs text-gray-400">
                        ログイン後に利用可能
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push('/archive')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(FaArchive as React.ComponentType<any>, { 
                      className: "w-5 h-5 text-purple-600" 
                    })}
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">アーカイブ</h4>
                      <p className="text-xs text-gray-600">
                        完了タスクの履歴を確認
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {React.createElement(FaChevronRight as React.ComponentType<any>, { 
                      className: "w-4 h-4" 
                    })}
                  </div>
                </div>
              </button>
            )}

            {/* 簡易統計プレビュー */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                📈 {isToday ? '今日' : '選択日'}の進捗
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{completedToday}</div>
                  <div className="text-xs text-gray-600">完了</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">{totalToday}</div>
                  <div className="text-xs text-gray-600">総数</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{completionRate}%</div>
                  <div className="text-xs text-gray-600">達成率</div>
                </div>
              </div>
            </div>

            {/* ゲストユーザー向けアップグレード案内 */}
            {isGuest && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    🚀 より多くの機能を利用しませんか？
                  </h4>
                  <p className="text-xs text-blue-700 mb-3">
                    アカウント登録で進捗分析、アーカイブ、設定機能が利用可能
                  </p>
                  <button
                    onClick={() => router.push('/register')}
                    className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    無料で始める
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 