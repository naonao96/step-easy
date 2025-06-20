'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RunningTaskWidget } from '@/components/molecules/RunningTaskWidget'
import { 
  FaClock, 
  FaPlus, 
  FaChartBar, 
  FaArchive, 
  FaCog 
} from 'react-icons/fa'
import { useExecutionStore } from '@/stores/executionStore'
import { useTaskStore } from '@/stores/taskStore'

interface LeftSidebarProps {
  className?: string;
}

export function LeftSidebar({ className = '' }: LeftSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const { activeExecution, isRunning } = useExecutionStore()
  const { tasks } = useTaskStore()
  
  // 実行中のタスクがあるかチェック
  const runningTask = activeExecution ? tasks.find(task => task.id === activeExecution.task_id) : null

  // タイマーアイコンの色を決定
  const getTimerIconColor = () => {
    if (!activeExecution) return 'text-gray-400 hover:text-gray-500'
    if (isRunning) return 'text-blue-500 hover:text-blue-600 animate-pulse'
    return 'text-yellow-500 hover:text-yellow-600' // 一時停止中
  }

  // タイマーアイコンクリック時の動作
  const handleTimerClick = () => {
    if (runningTask) {
      router.push(`/tasks?id=${runningTask.id}`)
    }
  }

  // アクションアイテムの定義（統一されたアイコン）
  const actionItems = [
    {
      icon: () => FaPlus({ className: 'w-6 h-6 shrink-0 text-green-500 hover:text-green-600' }),
      label: '新しいタスク',
      href: '/tasks'
    },
    {
      icon: () => FaChartBar({ className: 'w-6 h-6 shrink-0 text-blue-500 hover:text-blue-600' }),
      label: '進捗確認',
      href: '/progress'
    },
    {
      icon: () => FaArchive({ className: 'w-6 h-6 shrink-0 text-purple-500 hover:text-purple-600' }),
      label: 'アーカイブ',
      href: '/archive'
    },
    {
      icon: () => FaCog({ className: 'w-6 h-6 shrink-0 text-gray-500 hover:text-gray-600' }),
      label: '設定',
      href: '/settings'
    }
  ]

  const handleActionClick = (href: string) => {
    router.push(href)
  }

  return (
    <div 
      className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-white border-r border-gray-200 z-40 transition-all duration-200 ease-out ${
        isExpanded ? 'w-80' : 'w-16'
      } ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="p-4 h-full flex flex-col">
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
      </div>
    </div>
  )
} 