import React, { useState, useEffect, forwardRef } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import { useTaskStore } from '@/stores/taskStore';
import { type Task } from '@/types/task';
import { type Habit, type HabitFormData } from '@/types/habit';
import { useAuth } from '@/contexts/AuthContext';
import { BaseTaskModal } from './BaseTaskModal';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Habit>;
  onSave?: (habit: Habit) => void;
  mode?: 'create' | 'edit' | 'preview';
  isMobile?: boolean;
  onRequestClose?: () => void;
}

export const HabitModal = forwardRef<{ closeWithValidation: () => void }, HabitModalProps>(({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode = 'create',
  isMobile = false,
  onRequestClose
}, ref) => {
  const { habits } = useHabitStore();
  const { tasks } = useTaskStore();
  const { planType } = useAuth();
  const { createHabit, updateHabit } = useHabitStore();

  // 習慣制限チェック
  const checkHabitLimit = () => {
    if (planType === 'guest') {
      return {
        isValid: false,
        message: 'ゲストユーザーは習慣を作成できません。アカウントを作成して続けるには、ログインしてください。'
      };
    }

    if (planType === 'free' && habits.length >= 3) {
      return {
        isValid: false,
        message: '無料プランでは習慣を3個までしか作成できません。プレミアムプランにアップグレードしてください。'
      };
    }

    return { isValid: true, message: '' };
  };



  const handleSave = async (data: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    startDate: Date | null;
    dueDate: Date | null;
    estimatedDuration: number | undefined;
    category: string;
  }) => {
    try {
      const habitData: HabitFormData = {
        title: data.title.trim(),
        description: data.content,
        category: data.category
      };

      if (mode === 'create') {
        await createHabit(habitData);
      } else if (initialData?.id) {
        await updateHabit(initialData.id, habitData);
      }

      if (onSave) {
        // 新しい習慣データを取得してコールバック
        const newHabit = habits.find(h => h.title === habitData.title);
        if (newHabit) {
          onSave(newHabit);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('習慣保存エラー:', error);
    }
  };

  const renderAdditionalFields = () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">習慣</span>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
          <span className="text-sm text-blue-700 font-medium">🔥 毎日</span>
        </div>
      </div>
    </div>
  );

  return (
    <BaseTaskModal
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      initialData={initialData as any}
      onSave={handleSave as any}
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
      createFormData={handleSave as any}
      renderAdditionalFields={renderAdditionalFields}
      isMobile={isMobile}
      onRequestClose={onRequestClose}
    />
  );
}); 