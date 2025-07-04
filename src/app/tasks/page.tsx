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
                      <span>{new Date(task.created_at).toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric'
                      })}</span>
                    </div>
                    {task.completed_at && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>完了 {new Date(task.completed_at).toLocaleDateString('ja-JP', { 
                          month: 'short', 
                          day: 'numeric'
                        })}</span>
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
                  {isExistingTask && task && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>編集中 {new Date(task.updated_at).toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                  {!isExistingTask && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>新規作成</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isExistingTask && (
                    <button
                      onClick={switchToPreviewMode}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100/60 rounded-lg transition-all duration-200"
                    >
                      プレビュー
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  {isExistingTask && task && (
                    <>
                      <div className="w-px h-3 bg-gray-200 mx-1"></div>
                      <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-all duration-200"
                      >
                        削除
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* メインコンテンツ */}
            <div className="p-6">
              {/* タイトル入力 */}
              <div className="mb-6">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タスクのタイトルを入力..."
                  className="text-2xl font-bold border-0 shadow-none px-0 focus:ring-0"
                />
              </div>

              {/* メタデータ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {/* 開始日 */}
                <DatePicker
                  label={`開始日 ${
                    planType === 'guest' ? '（今日のみ）' :
                    planType === 'free' ? '（14日先まで）' :
                    '（制限なし）'
                  }`}
                  selected={startDate}
                  onChange={setStartDate}
                  minDate={planType === 'premium' ? undefined : new Date()}
                  maxDate={startDateLimits.max ? new Date(startDateLimits.max) : undefined}
                  disabled={planType === 'guest'}
                  placeholderText="開始日を選択..."
                  helpText={
                    planType === 'guest' ? 'ゲストは今日のタスクのみ作成可能' :
                    planType === 'free' ? '14日先まで設定可能' :
                    '制限なし（過去日・未来日両方OK）'
                  }
                  required
                />

                {/* 期限日（ゲスト以外） */}
                {planType !== 'guest' && (
                  <DatePicker
                    label="期限日（オプション）"
                    selected={dueDate}
                    onChange={setDueDate}
                    minDate={startDate || new Date()}
                    placeholderText="期限日を選択..."
                    helpText="期限日は開始日以降に設定してください"
                  />
                )}

                {/* 優先度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    優先度
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>

                {/* カテゴリ選択 */}
                <div className="md:col-span-2">
                  <CategorySelector
                    value={category}
                    onChange={setCategory}
                    label="カテゴリ"
                  />
                </div>

                {/* 予想所要時間 */}
                <div className="md:col-span-2">
                  <DurationInput
                    value={estimatedDuration}
                    onChange={setEstimatedDuration}
                    label="予想所要時間"
                  />
                </div>
                
                {/* 習慣タスク設定 */}
                <div className="md:col-span-2">
                  {planType === 'guest' ? (
                    // ゲストユーザー向け制限メッセージ
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={true}
                          className="form-checkbox h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-lg">🔥</span>
                              <span className="text-base font-medium text-blue-900">継続的な習慣を管理して目標達成をサポート！</span>
                            </div>
                            <p className="text-sm text-blue-700 mb-3">
                              毎日の運動、読書、学習など継続したい習慣のストリーク（継続日数）を記録
                            </p>
                            <button
                              onClick={() => router.push('/register')}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              ユーザー登録で利用開始
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : planType === 'free' && tasks.filter(t => t.is_habit).length >= 3 ? (
                    // 無料ユーザー向け制限メッセージ（3つ以上の習慣がある場合）
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={true}
                          className="form-checkbox h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-lg">👑</span>
                              <span className="text-base font-medium text-purple-900">プレミアムで習慣を無制限に追加できます</span>
                            </div>
                            <p className="text-sm text-purple-700 mb-3">
                              現在のプランでは習慣を3個まで作成できます
                            </p>
                            <button
                              onClick={() => router.push('/menu')}
                              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              ホーム画面のプレミアム機能を確認
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 通常の習慣タスク設定
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isHabit}
                          onChange={(e) => setIsHabit(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-blue-900 mb-2 block">
                            🔥 習慣タスクとして設定する
                          </label>
                          <div className="text-xs text-blue-700 space-y-1">
                            <p className="font-medium">継続的に繰り返したいタスクの場合にチェック:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ml-2">
                              <div>✅ 毎日の運動・読書</div>
                              <div>✅ 週次レビュー・掃除</div>
                              <div>✅ 月次目標確認</div>
                              <div>✅ 日記・瞑想</div>
                            </div>
                            <p className="mt-2 pt-2 border-t border-blue-300">
                              <strong>💡 効果:</strong> ストリーク（継続日数）がカウントされ、継続をサポートします
                            </p>
                          </div>
                          <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-300">
                            <strong>⚠️ 通常タスクの場合:</strong> プレゼン資料作成、メール返信など一回で完了するもの
                          </div>
                        </div>
                      </div>
                      
                      {/* 習慣頻度設定（習慣タスクの場合のみ表示） */}
                      {isHabit && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            📅 実行頻度を選択してください
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              { value: 'daily', label: '毎日', description: '24時間ごと' },
                              { value: 'weekly', label: '週1回', description: '7日ごと' },
                              { value: 'monthly', label: '月1回', description: '30日ごと' }
                            ].map(({ value, label, description }) => (
                              <label key={value} className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name="habitFrequency"
                                  value={value}
                                  checked={habitFrequency === value}
                                  onChange={(e) => setHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                                  className="form-radio h-4 w-4 text-blue-600 mr-2"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{label}</div>
                                  <div className="text-xs text-gray-500">{description}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 完了切り替えボタン（既存タスクのみ） */}
                {isExistingTask && task && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={task.status === 'done' ? 'secondary' : 'primary'}
                      onClick={handleComplete}
                      size="sm"
                    >
                      {task.status === 'done' ? '未完了に戻す' : '完了にする'}
                    </Button>
                  </div>
                )}
              </div>

              {/* エディターエリア */}
              <div className="bg-gray-50 rounded-lg border mb-6">
                <div className="p-6">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`# メモ

## 今日やること
- [ ] タスク1
- [ ] タスク2

## メモ
**重要**: 
*参考*: 

---

Markdownで自由に書けます！`}
                    className="w-full h-96 resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                    style={{ fontFamily: 'Monaco, Menlo, monospace' }}
                  />
                </div>
              </div>

              {/* ヘルプテキスト */}
              <div className="text-sm text-gray-500">
                <p><strong>使える記法:</strong></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div># 見出し → <strong>見出し</strong></div>
                  <div>**太字** → <strong>太字</strong></div>
                  <div>*斜体* → <em>斜体</em></div>
                  <div>- [ ] チェックボックス</div>
                  <div>- リスト項目</div>
                  <div>--- → 区切り線</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 