import React, { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { type Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { BaseTaskModal } from './BaseTaskModal';
import { FaFire } from 'react-icons/fa';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Task>;
  onSave?: (task: Task) => void;
  mode?: 'create' | 'edit' | 'preview';
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode = 'create'
}) => {
  const { tasks } = useTaskStore();
  const { planType } = useAuth();
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // 習慣制限チェック
  const checkHabitLimit = () => {
    if (planType === 'guest') {
      return {
        isValid: false,
        message: 'ゲストユーザーは習慣を作成できません。アカウントを作成して続けるには、ログインしてください。'
      };
    }

    if (planType === 'free' && tasks.filter(t => t.is_habit).length >= 3) {
      return {
        isValid: false,
        message: '無料プランでは習慣を3個までしか作成できません。プレミアムプランにアップグレードしてください。'
      };
    }

    return { isValid: true, message: '' };
  };

  const createHabitFormData = (data: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    startDate: Date | null;
    dueDate: Date | null;
    estimatedDuration: number | undefined;
    category: string;
  }) => ({
    title: data.title.trim(),
    description: data.content,
    priority: data.priority,
    is_habit: true, // 習慣は常にtrue
    habit_frequency: habitFrequency,
    status: 'todo' as const,
    start_date: data.startDate ? data.startDate.toISOString().split('T')[0] : null,
    due_date: data.dueDate ? data.dueDate.toLocaleDateString('sv-SE') : null,
    estimated_duration: data.estimatedDuration,
    category: data.category
  });

  const renderAdditionalFields = () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">習慣タスク</span>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
          {FaFire({ className: "w-4 h-4 text-blue-600" })}
          <span className="text-sm text-blue-700 font-medium">習慣</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">頻度:</label>
        <select
          value={habitFrequency}
          onChange={(e) => setHabitFrequency(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="daily">毎日</option>
          <option value="weekly">週1回</option>
          <option value="monthly">月1回</option>
        </select>
      </div>
    </div>
  );

  return (
    <BaseTaskModal
      isOpen={isOpen}
      onClose={onClose}
      initialData={initialData}
      onSave={onSave}
      mode={mode}
      isHabit={true}
      titlePlaceholder="習慣のタイトルを入力"
      contentPlaceholder={`# 習慣メモ

## 今日やること
- [ ] 習慣1
- [ ] 習慣2

## メモ
**重要**: 
*参考*: 

---

Markdownで自由に書けます！`}
      modalTitle="新規作成"
      additionalValidation={checkHabitLimit}
      createFormData={createHabitFormData}
      renderAdditionalFields={renderAdditionalFields}
    />
  );
}; 