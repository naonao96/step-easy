'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { RunningTaskWidget } from '@/components/molecules/RunningTaskWidget'
import { 
  FaClock, 
  FaPlus, 
  FaChartBar, 
  FaArchive, 
  FaCog,
  FaTrophy
} from 'react-icons/fa'
import { useExecutionStore } from '@/stores/executionStore'
import { useTaskStore } from '@/stores/taskStore'

interface LeftSidebarProps {
  className?: string;
}

export function LeftSidebar({ className = '' }: LeftSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const { isGuest, planType } = useAuth()
  const { activeExecution, isRunning } = useExecutionStore()
  const { tasks } = useTaskStore()
  
  // 実行中のタスクがあるかチェック
  const runningTask = activeExecution ? tasks.find(task => task.id === activeExecution.task_id) : null

  // タイマーアイコンの色を決定
  const getTimerIconColor = () => {
    if (!activeExecution) return 'text-gray-400 hover:text-gray-500'
    if (isRunning) return 'text-[#7c5a2a] animate-pulse'
    return 'text-[#7c5a2a]' // 一時停止中
  }

  // タイマーアイコンクリック時の動作
  const handleTimerClick = () => {
    if (runningTask) {
      router.push(`/tasks?id=${runningTask.id}`)
    }
  }

  // プラン別でアクションアイテムをフィルタリング
  const getAvailableActionItems = () => {
    const baseItems = [
      {
        icon: () => FaPlus({ className: 'w-6 h-6 shrink-0 text-[#7c5a2a] hover:text-yellow-900' }),
        label: '新しいタスク',
        href: '/tasks'
      },
      {
        icon: () => FaChartBar({ className: 'w-6 h-6 shrink-0 text-[#7c5a2a] hover:text-yellow-900' }),
        label: '進捗確認',
        href: '/progress'
      }
    ];

    // ゲストユーザー以外はアーカイブ、設定を追加
    if (!isGuest) {
      baseItems.push(
        {
          icon: () => FaArchive({ className: 'w-6 h-6 shrink-0 text-[#7c5a2a] hover:text-yellow-900' }),
          label: 'アーカイブ',
          href: '/archive'
        },
        {
          icon: () => FaCog({ className: 'w-6 h-6 shrink-0 text-[#7c5a2a] hover:text-yellow-900' }),
          label: '設定',
          href: '/settings'
        }
      );
    }

    return baseItems;
  };

  const actionItems = getAvailableActionItems();

  const handleActionClick = (href: string) => {
    router.push(href)
  }

  return (
    <div 
      className={`absolute left-0 top-0 h-screen wood-frame wood-frame-sidebar transition-all duration-200 ease-out ${
        isExpanded ? 'w-60' : 'w-16'
      } ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{height: '100vh'}}
    >
      <div className="wood-content p-2  h-full flex flex-col">
        {/* タスク実行エリア（境界線で区別） */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <button
            onClick={handleTimerClick}
            className={`flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full ${
              isExpanded ? 'justify-start' : 'justify-center'
            }`}
            title={!isExpanded ? (runningTask ? `実行中: ${runningTask.title}` : 'タスク実行') : undefined}
          >
            {FaClock({ className: `w-6 h-6 shrink-0 ${getTimerIconColor()}` })}
            {isExpanded && (
              <span className="ml-3 text-sm font-medium text-gray-700">
                タスク実行
              </span>
            )}
          </button>
        </div>

        {/* 展開時：実行中タスクウィジェット */}
        {isExpanded && activeExecution && (
          <div className="mb-6">
            <RunningTaskWidget />
          </div>
        )}



        {/* アクションアイテム */}
        <div className="flex flex-col space-y-4">
          {actionItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(item.href)}
              className={`flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                isExpanded ? 'justify-start' : 'justify-center'
              }`}
              title={!isExpanded ? item.label : undefined}
            >
              {item.icon()}
              {isExpanded && (
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ゲストユーザー向けメッセージ（展開時のみ表示） */}
        {isExpanded && isGuest && (
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700 text-center">
                📚 アーカイブと設定は<br/>
                ログイン後に利用可能
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 