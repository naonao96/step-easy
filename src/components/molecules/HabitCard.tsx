import React from 'react';
import { FaFire, FaCheck, FaEdit, FaTrash } from 'react-icons/fa';
import { HabitWithCompletion } from '@/types/habit';
import { Task } from '@/types/task';
import { useHabitStore } from '@/stores/habitStore';
import { useTaskStore } from '@/stores/taskStore';
import { Button } from '../atoms/Button';
import {
  isNewHabit,
  isHabitCompleted
} from '@/lib/habitUtils';

interface HabitCardProps {
  habit: HabitWithCompletion | Task;
  onEdit?: (habit: HabitWithCompletion | Task) => void;
  onDelete?: (habitId: string) => void;
  selectedDate?: Date; // 選択日付を追加
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  onEdit, 
  onDelete,
  selectedDate // 選択日付を受け取り
}) => {
  const { completeHabit, getDisplayStreak } = useHabitStore();
  const { updateTask } = useTaskStore();

  const handleComplete = async () => {
    try {
      if (isNewHabit(habit)) {
        // 新しい習慣テーブルの習慣：切り替え機能を使用
        const { toggleHabitCompletion } = useHabitStore.getState();
        const isCurrentlyCompleted = isHabitCompleted(habit);
        
        // 選択日付または今日の日付を取得（日本時間）
        const targetDate = selectedDate || new Date();
        const japanTime = new Date(targetDate.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        const dateString = japanTime.toISOString().split('T')[0];
        
        const result = await toggleHabitCompletion(habit.id, !isCurrentlyCompleted, dateString);
        if (!result.success) {
          console.error('習慣切り替えエラー:', result.message);
        }
      } else if (!isNewHabit(habit)) {
        // 既存のタスクテーブルの習慣：従来の切り替え
        const newStatus = habit.status === 'done' ? 'todo' : 'done';
        
        // 完了時は選択されている日付をcompleted_atに設定
        let completedAt: string | undefined;
        if (newStatus === 'done') {
          if (selectedDate) {
            // 選択されている日付がある場合はその日付を使用
            const selectedDateTime = new Date(selectedDate);
            selectedDateTime.setHours(12, 0, 0, 0); // 12時を基準に設定
            completedAt = selectedDateTime.toISOString();
          } else {
            // 選択日がない場合は現在時刻を使用
            completedAt = new Date().toISOString();
          }
        }
        
        await updateTask(habit.id, { status: newStatus, completed_at: completedAt });
      }
    } catch (error) {
      console.error('習慣完了エラー:', error);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(habit);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('この習慣を削除してもよろしいですか？')) {
      onDelete(habit.id);
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 ${
      isHabitCompleted(habit)
        ? 'bg-green-50 border-green-200 shadow-sm' 
        : 'bg-white border-gray-200 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900">{habit.title}</h4>
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
              <span className="text-xs text-blue-700 font-medium">🔥 習慣</span>
            </div>
          </div>
          
          {habit.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {habit.description}
            </p>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                継続{getDisplayStreak(habit.id)}日
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                最長{habit.longest_streak || 0}日
              </span>
            </div>
            
            {habit.category && habit.category !== 'other' && (
              <div className="flex items-center gap-1">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {habit.category}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant={isHabitCompleted(habit) ? "secondary" : "primary"}
            size="sm"
            onClick={handleComplete}
            leftIcon={FaCheck}
          >
            {isHabitCompleted(habit) ? '完了済み' : '完了'}
          </Button>
          
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEdit}
                leftIcon={FaEdit}
                title="編集"
              />
            )}
            
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                leftIcon={FaTrash}
                title="削除"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 