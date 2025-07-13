import React from 'react';
import { TaskListHome } from './TaskListHome';
import { Calendar } from './Calendar';
import { Task } from '@/types/task';

interface MobileHomeContentProps {
  tasks: Task[];
  selectedDate: Date;
  selectedDateTasks: Task[];
  contentHeight: number;
  onAddTask: () => void;
  onCompleteTask: (id: string) => void;
  onDateSelect: (date: Date) => void;
  onHeightChange: (height: number) => void;
}

export const MobileHomeContent: React.FC<MobileHomeContentProps> = ({
  tasks,
  selectedDate,
  selectedDateTasks,
  contentHeight,
  onAddTask,
  onCompleteTask,
  onDateSelect,
  onHeightChange
}) => {
  return (
    <div className="md:hidden space-y-4">
      {/* タスクセクション */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            📋 タスク
            <span className="text-xs text-gray-500 font-normal">
              ({selectedDateTasks.length}件)
            </span>
          </h3>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          <TaskListHome
            tasks={selectedDateTasks as any}
            selectedDate={selectedDate}
            onAddTask={onAddTask}
            onCompleteTask={onCompleteTask}
            height={contentHeight}
          />
        </div>
      </div>

      {/* カレンダーセクション */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            📅 カレンダー
            <span className="text-xs text-gray-500 font-normal">
              日付をタップして切り替え
            </span>
          </h3>
        </div>
        
        <div className="p-4">
          <Calendar 
            tasks={tasks}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              const newDate = new Date(date);
              newDate.setHours(0, 0, 0, 0);
              onDateSelect(newDate);
            }}
            onHeightChange={onHeightChange}
          />
        </div>
      </div>
    </div>
  );
}; 