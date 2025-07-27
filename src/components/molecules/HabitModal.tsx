import React, { useState, useEffect, forwardRef } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import { useTaskStore } from '@/stores/taskStore';
import { type Task } from '@/types/task';
import { type Habit, type HabitFormData } from '@/types/habit';
import { useAuth } from '@/contexts/AuthContext';
import { BaseTaskModal } from './BaseTaskModal';
import { toDateStringOrNull, toTimestampStringOrNull } from '@/lib/timeUtils';

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



  // BaseTaskFormData形式でデータを返す関数
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
    status: 'todo' as const,
    start_date: toDateStringOrNull(data.startDate),
    due_date: toTimestampStringOrNull(data.dueDate), // TIMESTAMP WITH TIME ZONE型に統一
    estimated_duration: data.estimatedDuration,
    category: data.category
  });

  const handleSave = async (data: any) => {
    try {
      console.log('🔍 HabitModal handleSave開始:', {
        mode: mode,
        initialData: initialData,
        input_data: data,
        timestamp: new Date().toISOString()
      });

      const habitData: HabitFormData = {
        title: data.title.trim(),
        description: data.description,
        category: data.category,
        priority: data.priority,
        estimated_duration: data.estimated_duration,
        // データベース基準で文字列のまま渡す
        start_date: data.start_date || null,
        due_date: data.due_date || null,
        has_deadline: data.due_date !== null
      };

      console.log('🔍 変換後のhabitData:', {
        habitData: habitData,
        data_types: {
          title: typeof habitData.title,
          description: typeof habitData.description,
          category: typeof habitData.category,
          priority: typeof habitData.priority,
          estimated_duration: typeof habitData.estimated_duration,
          start_date: typeof habitData.start_date,
          due_date: typeof habitData.due_date,
          has_deadline: typeof habitData.has_deadline
        },
        timestamp: new Date().toISOString()
      });

      if (mode === 'create') {
        console.log('📝 習慣作成モード');
        await createHabit(habitData);
      } else if (initialData?.id) {
        console.log('✏️ 習慣編集モード:', { habit_id: initialData.id });
        await updateHabit(initialData.id, habitData);
      }

      if (onSave) {
        // 新しい習慣データを取得してコールバック
        const newHabit = habits.find(h => h.title === habitData.title);
        if (newHabit) {
          onSave(newHabit);
        }
      }
      
      console.log('✅ HabitModal handleSave完了');
      onClose();
    } catch (error) {
      console.error('❌ 習慣保存エラー:', error);
    }
  };

  const renderAdditionalFields = () => null;

  return (
    <BaseTaskModal
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      initialData={initialData}
      onSave={handleSave}
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
      isMobile={isMobile}
      onRequestClose={onRequestClose}
    />
  );
}); 