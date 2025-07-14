import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { type Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/atoms/Input';
import { PrioritySelector } from '@/components/atoms/PrioritySelector';
import { CategorySelector } from '@/components/atoms/CategorySelector';
import { DatePicker } from '@/components/atoms/DatePicker';
import { DurationInput } from '@/components/atoms/DurationInput';
import { Button } from '@/components/atoms/Button';
import { TaskTimer } from './TaskTimer';
import { MobileTaskTimer } from './MobileTaskTimer';
import { TaskExecutionHistory } from './TaskExecutionHistory';
import { FaTimes, FaSave, FaEdit, FaTrash, FaCheck, FaEye, FaChevronDown, FaChevronUp, FaExclamationTriangle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { TASK_CONSTANTS, MODAL_CONSTANTS } from '@/lib/constants';
import { useHabitStore } from '@/stores/habitStore';
import { isNewHabit, isHabitCompleted } from '@/lib/habitUtils';

// 型定義
interface BaseTaskFormData {
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

// 初期値の型定義
interface InitialFormValues {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  startDate: Date | null;
  dueDate: Date | null;
  estimatedDuration: number | undefined;
  category: string;
  habit_frequency?: 'daily' | 'weekly' | 'monthly';
}

interface BaseTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Task>;
  onSave?: (task: Task) => void;
  onDelete?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onEdit?: (task: Task) => void;
  onPreview?: (task: Task) => void;
  onRefresh?: () => void;
  mode?: 'create' | 'edit' | 'preview';
  isHabit?: boolean;
  titlePlaceholder?: string;
  contentPlaceholder?: string;
  modalTitle?: string;
  additionalValidation?: () => ValidationResult;
  createFormData: (data: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    startDate: Date | null;
    dueDate: Date | null;
    estimatedDuration: number | undefined;
    category: string;
  }) => BaseTaskFormData;
  renderAdditionalFields?: () => React.ReactNode;
  // モバイル版専用プロパティ
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  isFullScreen?: boolean;
  enableSwipeToClose?: boolean;
  // レスポンシブ対応用プロパティ
  isMobile?: boolean;
  selectedDate?: Date;
  // 外部から閉じる処理を呼び出すためのプロパティ
  onRequestClose?: () => void;
}

export const BaseTaskModal = forwardRef<{ closeWithValidation: () => void }, BaseTaskModalProps>(({
  isOpen,
  onClose,
  initialData,
  onSave,
  onDelete,
  onComplete,
  onEdit,
  onPreview,
  onRefresh,
  mode = 'create',
  isHabit = false,
  titlePlaceholder = 'タイトルを入力',
  contentPlaceholder = '# メモ\n\n## 今日やること\n- [ ] タスク1\n- [ ] タスク2\n\n## メモ\n**重要**: \n*参考*: \n\n---\n\nMarkdownで自由に書けます！',
  modalTitle = '新規作成',
  additionalValidation,
  createFormData,
  renderAdditionalFields,
  // モバイル版専用プロパティ
  className = '',
  overlayClassName = '',
  contentClassName = '',
  isFullScreen = false,
  enableSwipeToClose = false,
  // レスポンシブ対応用プロパティ
  isMobile = false,
  selectedDate,
  // 外部から閉じる処理を呼び出すためのプロパティ
  onRequestClose
}, ref) => {
  const { createTask, updateTask } = useTaskStore();
  const { planType, canEditTaskOnDate } = useAuth();
  const { habitCompletions } = useHabitStore();
  
  // 編集中のタスクデータ
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(TASK_CONSTANTS.DEFAULT_PRIORITY);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string>(TASK_CONSTANTS.DEFAULT_CATEGORY);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // 完了状態のローカル管理
  const [localCompletionStatus, setLocalCompletionStatus] = useState<'done' | 'todo' | 'doing' | null>(null);

  // 変更検知用の状態
  const [initialValues, setInitialValues] = useState<InitialFormValues>({
    title: '',
    content: '',
    priority: TASK_CONSTANTS.DEFAULT_PRIORITY,
    startDate: null,
    dueDate: null,
    estimatedDuration: undefined,
    category: TASK_CONSTANTS.DEFAULT_CATEGORY,
    habit_frequency: 'daily'
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  const isExistingTask = !!initialData?.id;
  const isPreviewMode = mode === 'preview';
  const isEditMode = mode === 'edit';
  
  // 習慣の完了状態を正しく判定（リアルタイム + ローカル状態）
  const getTaskStatus = () => {
    // ローカル状態が設定されている場合はそれを優先
    if (localCompletionStatus !== null) {
      return localCompletionStatus;
    }
    
    if (initialData && initialData.id && isNewHabit(initialData as any)) {
      // 新しい習慣テーブルの習慣の場合：habitCompletionsからリアルタイムで判定
      const targetDate = selectedDate || new Date();
      const japanTime = new Date(targetDate.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const dateString = japanTime.toISOString().split('T')[0];
      
      const isCompleted = habitCompletions.some(
        completion => completion.habit_id === initialData.id && completion.completed_date === dateString
      );
      return isCompleted ? 'done' : 'todo';
    } else {
      // 既存のタスクテーブルの習慣または通常のタスクの場合
      return initialData?.status || 'todo';
    }
  };

  // 変更検知関数
  const hasChanges = (): boolean => {
    return (
      initialValues.title !== title ||
      initialValues.content !== content ||
      initialValues.priority !== priority ||
      initialValues.category !== category ||
      initialValues.estimatedDuration !== estimatedDuration ||
      (initialValues.startDate?.getTime() !== startDate?.getTime()) ||
      (initialValues.dueDate?.getTime() !== dueDate?.getTime()) ||
      // 習慣タスクの場合のみ習慣頻度を比較
      (isHabit && initialValues.habit_frequency !== initialData?.habit_frequency)
    );
  };

  // 確認ダイアログの処理
  const handleCloseWithConfirm = (closeAction: () => void) => {
    // プレビューモードでは変更検知をスキップ
    if (mode === 'preview' || !hasChanges()) {
      closeAction();
    } else {
      setShowConfirmDialog(true);
      setPendingCloseAction(() => closeAction);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    if (pendingCloseAction) {
      pendingCloseAction();
      setPendingCloseAction(null);
    }
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
    setPendingCloseAction(null);
  };

  // モーダルが閉じられた時にローカル状態をリセット
  const handleModalClose = () => {
    setLocalCompletionStatus(null);
    onClose();
  };

  // 外部から閉じる処理を呼び出すための関数
  const handleRequestClose = () => {
    handleCloseWithConfirm(handleModalClose);
  };

  // 外部から閉じる処理を呼び出せるようにする
  useImperativeHandle(ref, () => ({
    closeWithValidation: () => {
      handleCloseWithConfirm(handleModalClose);
    }
  }));

  // 初期データの設定
  useEffect(() => {
    if (initialData) {
      const newTitle = initialData.title || '';
      const newContent = initialData.description || '';
      const newPriority = initialData.priority || TASK_CONSTANTS.DEFAULT_PRIORITY;
      const newStartDate = initialData.start_date ? new Date(initialData.start_date) : new Date();
      const newDueDate = initialData.due_date ? new Date(initialData.due_date) : null;
      const newEstimatedDuration = initialData.estimated_duration;
      const newCategory = initialData.category || TASK_CONSTANTS.DEFAULT_CATEGORY;
      const newHabitFrequency = initialData.habit_frequency || 'daily';

      setTitle(newTitle);
      setContent(newContent);
      setPriority(newPriority);
      setStartDate(newStartDate);
      setDueDate(newDueDate);
      setEstimatedDuration(newEstimatedDuration);
      setCategory(newCategory);

      // 初期値を保存
      setInitialValues({
        title: newTitle,
        content: newContent,
        priority: newPriority,
        startDate: newStartDate,
        dueDate: newDueDate,
        estimatedDuration: newEstimatedDuration,
        category: newCategory,
        habit_frequency: newHabitFrequency
      });
    } else {
      // 新規作成モード
      const defaultValues = {
        title: '',
        content: '',
        priority: TASK_CONSTANTS.DEFAULT_PRIORITY,
        startDate: new Date(),
        dueDate: null,
        estimatedDuration: undefined,
        category: TASK_CONSTANTS.DEFAULT_CATEGORY,
        habit_frequency: 'daily' as const
      };

      setTitle(defaultValues.title);
      setContent(defaultValues.content);
      setPriority(defaultValues.priority);
      setStartDate(defaultValues.startDate);
      setDueDate(defaultValues.dueDate);
      setEstimatedDuration(defaultValues.estimatedDuration);
      setCategory(defaultValues.category);
      setInitialValues(defaultValues);
    }
  }, [initialData, isOpen]);

  // 日付バリデーション関数
  const validateDates = (): ValidationResult => {
    // 開始日のプラン別制限チェック
    if (startDate) {
      const checkResult = canEditTaskOnDate(startDate, !!initialData);
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

  // 保存処理
  const handleSave = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    // 追加バリデーション
    if (additionalValidation) {
      const validation = additionalValidation();
      if (!validation.isValid) {
        alert(validation.message);
        return;
      }
    }

    // 日付バリデーション
    const validation = validateDates();
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    setIsSaving(true);
    try {
      const taskData = createFormData({
        title,
        content,
        priority,
        startDate,
        dueDate,
        estimatedDuration,
        category
      });

      if (initialData && initialData.id) {
        // 既存タスクの更新
        await updateTask(initialData.id, taskData);
        // 保存後はプレビューモードに切り替え
        if (onPreview && initialData) {
          onPreview(initialData as Task);
        }
      } else {
        // 新規タスクの作成
        await createTask(taskData as any);
      }

      // 短い遅延を入れてからモーダルを閉じる
      setTimeout(() => {
        onClose();
      }, TASK_CONSTANTS.SAVE_DELAY_MS);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!isExistingTask || !initialData?.id || !onDelete) return;
    
    const message = isHabit ? 'この習慣を削除してもよろしいですか？' : 'このタスクを削除してもよろしいですか？';
    
    if (window.confirm(message)) {
      setIsDeleting(true);
      try {
        await onDelete(initialData.id);
        onClose();
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // 完了処理（楽観的更新）
  const handleComplete = async () => {
    if (!isExistingTask || !initialData?.id || !onComplete) return;
    
    // 現在の状態を取得
    const currentStatus = getTaskStatus();
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    
    // 即座にローカル状態を更新（楽観的更新）
    setLocalCompletionStatus(newStatus);
    
    try {
      await onComplete(initialData.id);
      // onRefreshが提供されている場合は呼び出し
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      // エラーが発生した場合は元の状態に戻す
      setLocalCompletionStatus(currentStatus);
      alert('ステータス更新に失敗しました');
    }
  };

  if (!isOpen) return null;

  // プレビューモードの表示
  if (isPreviewMode && initialData) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${overlayClassName}`}>
        <div className={`bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(80vh-120px)] overflow-hidden flex flex-col ${contentClassName} ${isFullScreen ? 'max-w-none max-h-none rounded-none' : ''}`}>
          {/* ヘッダー */}
          <div className={`bg-[#f5f5dc] border-b border-[#deb887] px-4 sm:px-6 ${isMobile ? 'py-3 pt-safe' : 'py-4'}`}>
            {/* モバイル版：3行レイアウト */}
            {isMobile ? (
              <>
                {/* 1行目：作成日と完了日 */}
                <div className="flex items-center gap-4 text-xs text-[#7c5a2a] font-medium mb-1 mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c5a2a]"></div>
                    <span>{new Date(initialData.created_at || '').toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric'
                    })}</span>
                  </div>
                  {initialData.completed_at && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8b4513]"></div>
                      <span>完了 {new Date(initialData.completed_at).toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric'
                      })}</span>
                    </div>
                  )}
                </div>
                
                {/* 2行目：アクションボタン */}
                <div className="flex items-center gap-2 mb-1">
                  {onEdit && (
                    <>
                      <button
                        onClick={() => onEdit(initialData as Task)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                      >
                        {FaEdit({ className: "w-3 h-3" })}
                        編集
                      </button>
                      {onComplete && (
                        <div className="w-px h-3 bg-[#deb887] mx-1"></div>
                      )}
                    </>
                  )}
                  {onComplete && (
                    <button
                      onClick={handleComplete}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                        getTaskStatus() === 'done' 
                          ? 'text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc]' 
                          : 'text-[#8b4513] hover:text-[#7c5a2a] hover:bg-[#f5f5dc]'
                      }`}
                    >
                      {FaCheck({ className: "w-3 h-3" })}
                      {getTaskStatus() === 'done' ? '未完了に戻す' : '完了'}
                    </button>
                  )}
                  {onDelete && (
                    <>
                      <div className="w-px h-3 bg-[#deb887] mx-1"></div>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8b4513] hover:text-[#7c5a2a] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {FaTrash({ className: "w-3 h-3" })}
                        {isDeleting ? '削除中...' : '削除'}
                      </button>
                    </>
                  )}
                </div>
                
                              {/* 3行目：閉じるボタン（左寄せ） */}
              <div className="flex justify-start">
                <button
                  onClick={() => handleCloseWithConfirm(handleModalClose)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-3 h-3" })}
                  閉じる
                </button>
              </div>
              </>
            ) : (
              /* デスクトップ版：1行レイアウト（既存のまま） */
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-4 text-xs text-[#7c5a2a] font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7c5a2a]"></div>
                  <span>{new Date(initialData.created_at || '').toLocaleDateString('ja-JP', { 
                    month: 'short', 
                    day: 'numeric'
                  })}</span>
                </div>
                {initialData.completed_at && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8b4513]"></div>
                    <span>完了 {new Date(initialData.completed_at).toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric'
                    })}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(initialData as Task)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                  >
                    {FaEdit({ className: "w-3 h-3" })}
                    編集
                  </button>
                )}
                {onComplete && (
                  <button
                    onClick={handleComplete}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      getTaskStatus() === 'done' 
                        ? 'text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc]' 
                        : 'text-[#8b4513] hover:text-[#7c5a2a] hover:bg-[#f5f5dc]'
                    }`}
                  >
                    {FaCheck({ className: "w-3 h-3" })}
                    {getTaskStatus() === 'done' ? '未完了に戻す' : '完了'}
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="w-px h-3 bg-[#deb887] mx-1"></div>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#8b4513] hover:text-[#7c5a2a] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {FaTrash({ className: "w-3 h-3" })}
                      {isDeleting ? '削除中...' : '削除'}
                    </button>
                  </>
                )}
                <div className="w-px h-3 bg-[#deb887] mx-1"></div>
                <button
                  onClick={() => handleCloseWithConfirm(handleModalClose)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-3 h-3" })}
                  閉じる
                </button>
              </div>
            </div>
            )}
          </div>
          
          {/* メインコンテンツ */}
            <div className={`overflow-y-auto`}>
              <div className={`p-4 sm:p-6 ${isMobile ? 'pb-12' : ''}`}>
              {/* タスクタイトル */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-[#8b4513] mb-2">{initialData.title}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
                    initialData.priority === 'high' ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                    initialData.priority === 'medium' ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]' :
                    'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                  }`}>
                    優先度: {initialData.priority === 'high' ? '高' : initialData.priority === 'medium' ? '中' : '低'}
                  </span>
                  {initialData.is_habit && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]">
                      習慣タスク
                    </span>
                  )}
                  <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
                    getTaskStatus() === 'done' ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                    getTaskStatus() === 'doing' ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]' :
                    'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                  }`}>
                    {getTaskStatus() === 'done' ? '完了' : getTaskStatus() === 'doing' ? '進行中' : '未着手'}
                  </span>
                </div>
              </div>

              {/* タスク内容 */}
              <div className="bg-[#f5f5dc] rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-[#deb887]">
                <div className="prose prose-sm max-w-none text-[#8b4513] text-sm sm:text-base">
                  <ReactMarkdown>
                    {initialData.description || '*メモが入力されていません*'}
                  </ReactMarkdown>
                </div>
              </div>

              {/* 実行タイマー */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#8b4513] mb-3">実行ログ</h3>
                <div className="space-y-3 sm:space-y-4">
                  {isMobile ? (
                    <MobileTaskTimer 
                      task={initialData as Task} 
                      onExecutionComplete={() => {
                        if (onRefresh) onRefresh();
                      }}
                    />
                  ) : (
                    <TaskTimer 
                      task={initialData as Task} 
                      onExecutionComplete={() => {
                        if (onRefresh) onRefresh();
                      }}
                    />
                  )}
                  
                  <div className="border-t border-[#deb887] pt-3 sm:pt-4">
                    <div className="max-h-[150px] overflow-y-auto">
                      <TaskExecutionHistory task={initialData as Task} selectedDate={selectedDate} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${overlayClassName}`}>
      <div className={`bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(80vh-120px)] overflow-hidden flex flex-col ${contentClassName} ${isFullScreen ? 'max-w-none max-h-none rounded-none' : ''}`}>
        {/* ヘッダー */}
        <div className={`bg-[#f5f5dc] border-b border-[#deb887] px-4 sm:px-6 ${isMobile ? 'py-3 pt-safe' : 'py-4'}`}>
          {/* モバイル版：3行レイアウト */}
          {isMobile ? (
            <>
              {/* 1行目：編集中の状態とタイムスタンプ */}
              <div className="flex items-center gap-4 text-xs text-[#7c5a2a] font-medium mb-1 mt-1">
                {initialData ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c5a2a]"></div>
                    <span>編集中 {new Date(initialData.updated_at || initialData.created_at || '').toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8b4513]"></div>
                    <span>{modalTitle}</span>
                  </div>
                )}
              </div>
              
              {/* 2行目：アクションボタン */}
              <div className="flex items-center gap-2 mb-1">
                {isExistingTask && initialData && onPreview && (
                  <>
                    <button
                      onClick={() => onPreview(initialData as Task)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                    >
                      {FaEye({ className: "w-3 h-3" })}
                      プレビュー
                    </button>
                    <div className="w-px h-3 bg-[#deb887] mx-1"></div>
                  </>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {FaSave({ className: "w-3 h-3" })}
                  {isSaving ? '保存中...' : '保存'}
                </button>
                {isExistingTask && initialData && onDelete && (
                  <>
                    <div className="w-px h-3 bg-[#deb887] mx-1"></div>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8b4513] hover:text-[#7c5a2a] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {FaTrash({ className: "w-3 h-3" })}
                      {isDeleting ? '削除中...' : '削除'}
                    </button>
                  </>
                )}
              </div>
              
              {/* 3行目：閉じるボタン（左寄せ） */}
              <div className="flex justify-start">
                <button
                  onClick={() => handleCloseWithConfirm(onClose)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-3 h-3" })}
                  閉じる
                </button>
              </div>
            </>
          ) : (
            /* デスクトップ版：1行レイアウト（既存のまま） */
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-4 text-xs text-[#7c5a2a] font-medium">
                {isExistingTask && initialData && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7c5a2a]"></div>
                    <span>編集中 {new Date(initialData.updated_at || '').toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                )}
                {!isExistingTask && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8b4513]"></div>
                    <span>{modalTitle}</span>
                  </div>
                )}
              </div>
            
            <div className="flex items-center gap-2">
              {isExistingTask && initialData && onPreview && (
                <button
                  onClick={() => onPreview(initialData as Task)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                >
                  {FaEye({ className: "w-3 h-3" })}
                  プレビュー
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#7c5a2a] hover:bg-[#8b4513] text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {FaSave({ className: "w-3 h-3" })}
                {isSaving ? '保存中...' : '保存'}
              </button>
              {isExistingTask && initialData && onDelete && (
                <>
                  <div className="w-px h-3 bg-[#deb887] mx-1"></div>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#8b4513] hover:text-[#7c5a2a] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {FaTrash({ className: "w-3 h-3" })}
                    {isDeleting ? '削除中...' : '削除'}
                  </button>
                </>
              )}
              <div className="w-px h-3 bg-[#deb887] mx-1"></div>
              <button
                onClick={() => handleCloseWithConfirm(onClose)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
              >
                {FaTimes({ className: "w-3 h-3" })}
                閉じる
              </button>
            </div>
          </div>
          )}
        </div>
        
        {/* メインコンテンツ */}
        <div className={`overflow-y-auto`}>
          <div className={`p-4 sm:p-6 ${isMobile ? 'pb-12' : ''}`}>
            <div className="space-y-4 sm:space-y-6">
              {/* 基本情報 */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8b4513] mb-2">
                    タイトル *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={titlePlaceholder}
                    className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a] text-sm sm:text-base"
                    disabled={isPreviewMode}
                  />
                </div>

                {/* 日付設定（必須項目） */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8b4513] mb-2">
                      開始日
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={setStartDate}
                      className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a] text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8b4513] mb-2">
                      期限日
                    </label>
                    <DatePicker
                      selected={dueDate}
                      onChange={setDueDate}
                      className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a] text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* 追加フィールド（習慣の頻度など） */}
                {renderAdditionalFields && renderAdditionalFields()}
              </div>

              {/* 詳細設定（スライドダウンパネル） */}
              <div className="border-t border-[#deb887] pt-3 sm:pt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors text-sm sm:text-base"
                >
                  {showDetails ? FaChevronUp({ className: "w-4 h-4" }) : FaChevronDown({ className: "w-4 h-4" })}
                  <span className="font-medium">詳細設定</span>
                </button>

                {showDetails && (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 bg-[#f5f5dc] rounded-lg p-3 sm:p-4 border border-[#deb887]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#8b4513] mb-2">
                          優先度
                        </label>
                        <PrioritySelector
                          value={priority}
                          onChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
                          label=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#8b4513] mb-2">
                          カテゴリ
                        </label>
                        <CategorySelector
                          value={category}
                          onChange={setCategory}
                        />
                      </div>
                    </div>

                    {/* 予想時間 */}
                    <div>
                      <label className="block text-sm font-medium text-[#8b4513] mb-2">
                        予想時間
                      </label>
                      <DurationInput
                        value={estimatedDuration}
                        onChange={setEstimatedDuration}
                        className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a] text-sm sm:text-base"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 完了切り替えボタン（既存タスクのみ） */}
              {isExistingTask && initialData && onComplete && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={getTaskStatus() === 'done' ? 'secondary' : 'primary'}
                    onClick={handleComplete}
                    size="sm"
                    className={`${getTaskStatus() === 'done' 
                      ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887] hover:bg-[#deb887]' 
                      : 'bg-[#7c5a2a] hover:bg-[#8b4513] text-white'
                    } text-sm sm:text-base`}
                  >
                    {getTaskStatus() === 'done' ? '未完了に戻す' : '完了にする'}
                  </Button>
                </div>
              )}
            </div>

            {/* エディターエリア */}
            <div className="bg-[#f5f5dc] rounded-lg border border-[#deb887] mb-4 sm:mb-6 mt-4 sm:mt-6">
              <div className="p-3 sm:p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={contentPlaceholder}
                  className={`w-full resize-none border-0 focus:ring-0 focus:outline-none text-[#8b4513] placeholder-[#7c5a2a] bg-transparent text-sm sm:text-base ${isMobile ? 'h-64' : 'h-96'}`}
                  style={{ fontFamily: 'Monaco, Menlo, monospace' }}
                  disabled={isPreviewMode}
                />
              </div>
            </div>

            {/* ヘルプテキスト */}
            <div className="text-xs text-[#7c5a2a] bg-[#f5f5dc] rounded-lg p-4 border border-[#deb887]">
              <p className="mb-2"><strong>Markdown対応:</strong> 太字、斜体、リスト、リンクなどが使えます</p>
              <p className="mb-2"><strong>チェックリスト:</strong> - [ ] でチェックボックスを作成できます</p>
              <p><strong>見出し:</strong> # ## ### で見出しを作成できます</p>
            </div>
          </div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                {FaExclamationTriangle({ className: "w-5 h-5 text-yellow-600" })}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#8b4513]">変更内容があります</h3>
                <p className="text-sm text-gray-600">入力内容が保存されていません</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleConfirmClose}
                className="w-full bg-[#7c5a2a] hover:bg-[#8b4513] text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                保存せずに閉じる
              </button>
              <button
                onClick={handleCancelClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 