import React, { useState } from 'react';
import { Character } from './Character';
import { Task } from '@/stores/taskStore';
import { FaChevronUp, FaChevronDown, FaChartBar, FaChevronRight } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

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

  // メッセージを短縮（折りたたみ時用）
  const shortMessage = characterMessage.length > 30 
    ? characterMessage.substring(0, 30) + '...' 
    : characterMessage;

  return (
    <div className="md:hidden bg-white border-t border-gray-200 mt-6">
      {/* 折りたたみヘッダー（常に表示） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* キャラクター表情（小さく表示） */}
          <div className="text-2xl">
            {characterMood === 'happy' && '🐦😊'}
            {characterMood === 'normal' && '🐦😐'}
            {characterMood === 'sad' && '🐦😢'}
          </div>
          
          {/* 短縮メッセージ */}
          <span className="text-sm text-gray-700 font-medium">
            {isExpanded ? 'キャラクター & 統計' : shortMessage}
          </span>
        </div>

        {/* 展開/折りたたみアイコン */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {isExpanded ? '詳細を隠す' : '詳細を見る'}
          </span>
          {isExpanded ? (
            React.createElement(FaChevronUp as React.ComponentType<any>, { className: "w-4 h-4 text-gray-400" })
          ) : (
            React.createElement(FaChevronDown as React.ComponentType<any>, { className: "w-4 h-4 text-gray-400" })
          )}
        </div>
      </button>

      {/* 展開コンテンツ */}
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

          {/* 進捗タブへの誘導 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              📊 詳細な統計情報
            </h3>
            
            {/* 進捗ページへのリンクボタン */}
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

            {/* 簡易統計プレビュー */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">今日の完了率</span>
                <span className="font-semibold text-gray-900">
                  {selectedDateTasks.filter(t => t.status === 'done').length}/{selectedDateTasks.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${selectedDateTasks.length > 0 
                      ? Math.round((selectedDateTasks.filter(t => t.status === 'done').length / selectedDateTasks.length) * 100)
                      : 0
                    }%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 