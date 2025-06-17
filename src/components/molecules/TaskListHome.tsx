import React from 'react';
import { Task } from '@/stores/taskStore';
import { FaPlus, FaCheck, FaEdit } from 'react-icons/fa';

interface TaskListHomeProps {
  tasks?: Task[];
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
  onCompleteTask?: (id: string) => void;
  onViewAll?: () => void;
}

export const TaskListHome: React.FC<TaskListHomeProps> = ({
  tasks = [],
  onAddTask,
  onEditTask,
  onCompleteTask,
  onViewAll
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">今日のタスク</h2>
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {FaPlus({ className: "w-3 h-3" })}
          追加
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {tasks.length > 0 ? (
          tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* 完了チェックボックス */}
              <button
                onClick={() => onCompleteTask?.(task.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  task.status === 'done'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                {task.status === 'done' && FaCheck({ className: "w-3 h-3" })}
              </button>

              {/* タスク内容 */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {task.description}
                  </p>
                )}
              </div>

              {/* 優先度表示 */}
              <div className={`px-2 py-1 text-xs rounded ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority === 'high' ? '高' : 
                 task.priority === 'medium' ? '中' : '低'}
              </div>

              {/* 編集ボタン */}
              <button
                onClick={() => onEditTask?.(task)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {FaEdit({ className: "w-3 h-3" })}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">今日のタスクがありません</p>
            <button
              onClick={onAddTask}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              タスクを作成する
            </button>
          </div>
        )}
      </div>

      {/* 全件表示リンク */}
      {tasks.length > 5 && (
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={onViewAll}
            className="w-full text-sm text-blue-600 hover:text-blue-700 py-2"
          >
            すべてのタスクを見る（他 {tasks.length - 5} 件）
          </button>
        </div>
      )}

      {tasks.length > 0 && tasks.length <= 5 && (
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={onViewAll}
            className="w-full text-sm text-gray-500 hover:text-blue-600 py-2"
          >
            すべてのタスクを管理する
          </button>
        </div>
      )}
    </div>
  );
}; 