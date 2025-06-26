'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import { type Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { DatePicker } from '@/components/atoms/DatePicker';
import { DurationInput } from '@/components/atoms/DurationInput';
import { CategorySelector } from '@/components/atoms/CategorySelector';
import { FaSave, FaEye, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { TaskTimer } from '@/components/molecules/TaskTimer';
import { TaskExecutionHistory } from '@/components/molecules/TaskExecutionHistory';
import { formatDateJP } from '@/lib/timeUtils';

// 定数
const DEFAULT_PRIORITY: 'low' | 'medium' | 'high' = 'medium';
const DEFAULT_CATEGORY = 'other';
const DEFAULT_HABIT_FREQUENCY: 'daily' | 'weekly' | 'monthly' = 'daily';
const SAVE_DELAY_MS = 100;

// 型定義
interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  is_habit: boolean;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
  status: 'todo';
  start_date: string | null;
  due_date: string | null;
  estimated_duration: number | undefined;
  category: string;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
}

export default function TaskEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
  const { planType, canAddTaskOnDate, canEditTaskOnDate, getStartDateLimits, getDueDateLimits } = useAuth();
  
  // URLパラメータから編集モードを判定
  const taskId = searchParams.get('id');
  const isEditParam = searchParams.get('edit') === 'true';
  const initialStartDate = searchParams.get('start_date') || '';
  const isHabitDefault = searchParams.get('habit') === 'true';
  const isExistingTask = !!taskId;
  
  // 表示モードの決定: 新規作成は編集、既存タスクはプレビュー（edit=trueで編集）
  const [isEditMode, setIsEditMode] = useState(() => {
    if (!isExistingTask) return true; // 新規作成は編集モード
    return isEditParam; // 既存タスクはeditパラメータに依存
  });
  
  // 編集中のタスクデータ
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(DEFAULT_PRIORITY);
  const [isHabit, setIsHabit] = useState(false);
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly' | 'monthly'>(DEFAULT_HABIT_FREQUENCY);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [isSaving, setIsSaving] = useState(false);

  // 今日の日付（各種制限チェック用）
  const today = new Date().toISOString().split('T')[0];
  
  // プラン別の制限を取得
  const startDateLimits = getStartDateLimits(isExistingTask);
  const dueDateLimits = getDueDateLimits(startDate || undefined);

  // 初期データの設定
  const initializeFormData = (foundTask?: Task) => {
    if (foundTask) {
      setTask(foundTask);
      setTitle(foundTask.title);
      setContent(foundTask.description || '');
      setPriority(foundTask.priority || DEFAULT_PRIORITY);
      setIsHabit(foundTask.is_habit || false);
      setHabitFrequency(foundTask.habit_frequency || DEFAULT_HABIT_FREQUENCY);
      setStartDate(foundTask.start_date ? new Date(foundTask.start_date) : new Date());
      setDueDate(foundTask.due_date ? new Date(foundTask.due_date) : null);
      setEstimatedDuration(foundTask.estimated_duration);
      setCategory(foundTask.category || DEFAULT_CATEGORY);
    } else {
      // 新規作成モード
      setTask(null);
      setTitle('');
      setContent('');
      setPriority(DEFAULT_PRIORITY);
      setIsHabit(isHabitDefault);
      setHabitFrequency(DEFAULT_HABIT_FREQUENCY);
      setStartDate(initialStartDate ? new Date(initialStartDate) : new Date());
      setDueDate(null);
      setEstimatedDuration(undefined);
      setCategory(DEFAULT_CATEGORY);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isExistingTask && tasks.length > 0) {
      const foundTask = tasks.find(t => t.id === taskId);
      initializeFormData(foundTask as Task);
    } else {
      initializeFormData();
    }
  }, [isExistingTask, taskId, tasks, initialStartDate, isHabitDefault]);

  // 日付バリデーション関数
  const validateDates = (): ValidationResult => {
    // 開始日のプラン別制限チェック
    if (startDate) {
      const checkResult = canEditTaskOnDate(startDate, isExistingTask);
      if (!checkResult.canEdit) {
        return { isValid: false, message: checkResult.message };
      }
    }

    // ゲストユーザーは期限日設定不可
    if (planType === 'guest' && dueDate) {
      return {
        isValid: false,
        message: 'ゲストユーザーは期限日を設定できません。'
      };
    }

    // 期限日は開始日以降に設定
    if (dueDate && startDate) {
      const startDateOnly = new Date(startDate.getTime());
      startDateOnly.setHours(0, 0, 0, 0);
      const dueDateOnly = new Date(dueDate.getTime());
      dueDateOnly.setHours(0, 0, 0, 0);
      
      if (dueDateOnly < startDateOnly) {
        return {
          isValid: false,
          message: '期限日は開始日以降に設定してください。'
        };
      }
    }

    return { isValid: true, message: '' };
  };

  // モード切り替え関数
  const switchToEditMode = () => {
    if (isExistingTask) {
      router.push(`/tasks?id=${taskId}&edit=true`);
    }
    setIsEditMode(true);
  };

  const switchToPreviewMode = () => {
    if (isExistingTask) {
      router.push(`/tasks?id=${taskId}`);
    }
    setIsEditMode(false);
  };

  // カスタム戻る処理（編集モードからプレビューに戻る場合）
  const handleBackFromEdit = () => {
    if (isExistingTask && isEditMode) {
      // 編集モードから戻る場合はプレビューモードに切り替え
      switchToPreviewMode();
    } else {
      // その他の場合は通常の戻る処理
      router.push('/menu');
    }
  };

  // フォームデータの作成
  const createTaskFormData = (): TaskFormData => ({
    title: title.trim(),
    description: content,
    priority,
    is_habit: isHabit,
    habit_frequency: isHabit ? habitFrequency : undefined,
    status: 'todo',
    start_date: startDate ? startDate.toISOString().split('T')[0] : null,
    due_date: dueDate ? dueDate.toLocaleDateString('sv-SE') : null,
    estimated_duration: estimatedDuration,
    category
  });

  // 保存処理
  const handleSave = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    // 日付バリデーション
    const validation = validateDates();
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    setIsSaving(true);
    try {
      const taskData = createTaskFormData();

      // デバッグ情報を出力
      console.log('保存データ:', taskData);
      console.log('開始日:', startDate);
      console.log('期限日:', dueDate);

      if (isExistingTask && task) {
        console.log('既存タスクを更新中...');
        await updateTask(task.id, taskData);
        console.log('更新完了');
        // 保存後はプレビューモードに切り替え
        switchToPreviewMode();
      } else {
        console.log('新規タスクを作成中...');
        const result = await createTask(taskData as any);
        console.log('作成結果:', result);
        
        // エラーがある場合はストアのエラーを確認
        const error = useTaskStore.getState().error;
        if (error) {
          console.error('ストアエラー:', error);
          alert(error);
          return;
        }
        console.log('メニューに遷移中...');
        
        // 短い遅延を入れてからリダイレクト（画面の更新を確実にする）
        setTimeout(() => {
          router.push('/menu');
        }, SAVE_DELAY_MS);
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!isExistingTask || !task) return;
    
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      try {
        await deleteTask(task.id);
        router.push('/menu');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  // 完了状態切り替え処理
  const handleComplete = async () => {
    if (!isExistingTask || !task) return;
    
    try {
      await updateTask(task.id, { 
        status: task.status === 'done' ? 'todo' : 'done',
        completed_at: task.status === 'done' ? undefined : new Date().toISOString()
      });
      // 完了切り替え後もプレビューモードを維持
      router.push(`/tasks?id=${taskId}`);
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータス更新に失敗しました');
    }
  };

  // ローディング状態の表示
  if (loading) {
    return (
      <AppLayout tasks={tasks as any}>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">読み込み中...</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <AppLayout tasks={tasks as any}>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center">
                <p className="text-red-600">エラーが発生しました: {error}</p>
                <button 
                  onClick={() => router.push('/menu')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  メニューに戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // プレビューモードの表示
  if (!isEditMode && isExistingTask && task) {
    return (
      <AppLayout
        title="タスク詳細"
        showBackButton={true}
        backUrl="/menu"
        backLabel="メニューに戻る"
        tasks={tasks as any}
      >
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* アクションバー（カード内） */}
              <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100/60 px-6 py-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span>{formatDateJP(task.created_at)}</span>
                    </div>
                    {task.completed_at && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>完了 {formatDateJP(task.completed_at)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={switchToEditMode}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100/60 rounded-lg transition-all duration-200"
                    >
                      編集
                    </button>
                    <button
                      onClick={handleComplete}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                        task.status === 'done' 
                          ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/60' 
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/80'
                      }`}
                    >
                      {task.status === 'done' ? '未完了に戻す' : '完了'}
                    </button>
                    <div className="w-px h-3 bg-gray-200 mx-1"></div>
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-all duration-200"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
              
              {/* メインコンテンツ */}
              <div className="p-6">
                {/* タスクタイトル */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      優先度: {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                    </span>
                    {task.is_habit && (
                      <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
                        習慣タスク
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      task.status === 'done' ? 'bg-green-100 text-green-700' :
                      task.status === 'doing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'done' ? '完了' : task.status === 'doing' ? '進行中' : '未着手'}
                    </span>
                  </div>
                </div>

                {/* タスク内容 */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>
                      {task.description || '*メモが入力されていません*'}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* 実行タイマー */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">実行ログ</h3>
                  <div className="space-y-4">
                    <TaskTimer 
                      task={task} 
                      onExecutionComplete={() => {
                        // 実行完了後にタスクデータを再読み込み
                        fetchTasks();
                      }}
                    />
                    <TaskExecutionHistory task={task} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 編集モードの表示
  return (
    <AppLayout
      title={isExistingTask ? "タスクを編集" : "新しいタスク"}
      showBackButton={true}
      backUrl={isExistingTask ? `/tasks?id=${taskId}` : "/menu"}
      backLabel={isExistingTask ? "プレビューに戻る" : "メニューに戻る"}
      tasks={tasks as any}
      onBackClick={isExistingTask ? handleBackFromEdit : undefined}
    >
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* アクションバー（カード内） */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100/60 px-6 py-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>{isExistingTask ? '編集モード' : '新規作成'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* プレビューボタン（モバイルのみ表示） */}
                  {isExistingTask && (
                    <button
                      onClick={switchToPreviewMode}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100/60 rounded-lg transition-all duration-200 md:hidden"
                    >
                      プレビュー
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-all duration-200"
                  >
                    {FaSave({ className: "w-3 h-3" })}
                    <span>{isSaving ? '保存中...' : '保存'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* メインコンテンツ */}
            <div className="p-6">
              {/* タイトル入力 */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル *
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タスクのタイトルを入力してください"
                  className="w-full"
                  required
                />
              </div>

              {/* 内容入力 */}
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  メモ
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="タスクの詳細やメモを入力してください（Markdown対応）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              {/* 優先度選択 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  優先度
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        priority === p
                          ? p === 'high' ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                            p === 'medium' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                            'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 習慣タスク設定 */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isHabit"
                    checked={isHabit}
                    onChange={(e) => setIsHabit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={planType === 'guest'}
                  />
                  <label htmlFor="isHabit" className="text-sm font-medium text-gray-700">
                    習慣タスクにする {planType === 'guest' && '(ログインで利用可能)'}
                  </label>
                </div>
                {planType === 'guest' && (
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    ゲストユーザーは習慣機能を利用できません。ログインして習慣管理を始めましょう。
                  </p>
                )}
                {isHabit && planType !== 'guest' && (
                  <div className="mt-3 ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      頻度
                    </label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setHabitFrequency(f)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                            habitFrequency === f
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {f === 'daily' ? '毎日' : f === 'weekly' ? '毎週' : '毎月'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 日付設定 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始日 * {planType === 'guest' && '(今日のみ)'}
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    maxDate={startDateLimits.max ? new Date(startDateLimits.max) : undefined}
                    minDate={startDateLimits.min ? new Date(startDateLimits.min) : undefined}
                    placeholderText="開始日を選択"
                    className="w-full"
                    disabled={startDateLimits.disabled}
                  />
                  {startDateLimits.message && (
                    <p className="text-xs text-gray-500 mt-1">{startDateLimits.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    期限日 {planType === 'guest' && '(プレミアム機能)'}
                  </label>
                  <DatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                    maxDate={dueDateLimits.max ? new Date(dueDateLimits.max) : undefined}
                    minDate={dueDateLimits.min ? new Date(dueDateLimits.min) : undefined}
                    placeholderText="期限日を選択"
                    className="w-full"
                    disabled={dueDateLimits.disabled}
                  />
                  {dueDateLimits.message && (
                    <p className="text-xs text-gray-500 mt-1">{dueDateLimits.message}</p>
                  )}
                </div>
              </div>

              {/* 予想時間 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予想時間（分）
                </label>
                <DurationInput
                  value={estimatedDuration}
                  onChange={setEstimatedDuration}
                  placeholder="予想時間を入力"
                  className="w-full"
                />
              </div>

              {/* カテゴリ選択 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ
                </label>
                <CategorySelector
                  value={category}
                  onChange={setCategory}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 