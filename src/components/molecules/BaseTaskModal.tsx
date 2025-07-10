import React, { useState, useEffect } from 'react';
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
import { TaskExecutionHistory } from './TaskExecutionHistory';
import { FaTimes, FaSave, FaEdit, FaTrash, FaCheck, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

// 定数
const DEFAULT_PRIORITY: 'low' | 'medium' | 'high' = 'medium';
const DEFAULT_CATEGORY = 'other';
const SAVE_DELAY_MS = 100;

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
}

export const BaseTaskModal: React.FC<BaseTaskModalProps> = ({
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
  enableSwipeToClose = false
}) => {
  const { createTask, updateTask } = useTaskStore();
  const { planType, canEditTaskOnDate } = useAuth();
  
  // 編集中のタスクデータ
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(DEFAULT_PRIORITY);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isExistingTask = !!initialData?.id;
  const isPreviewMode = mode === 'preview';
  const isEditMode = mode === 'edit';

  // 初期データの設定
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.description || '');
      setPriority(initialData.priority || DEFAULT_PRIORITY);
      setStartDate(initialData.start_date ? new Date(initialData.start_date) : new Date());
      setDueDate(initialData.due_date ? new Date(initialData.due_date) : null);
      setEstimatedDuration(initialData.estimated_duration);
      setCategory(initialData.category || DEFAULT_CATEGORY);
    } else {
      // 新規作成モード
      setTitle('');
      setContent('');
      setPriority(DEFAULT_PRIORITY);
      setStartDate(new Date());
      setDueDate(null);
      setEstimatedDuration(undefined);
      setCategory(DEFAULT_CATEGORY);
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
      }, SAVE_DELAY_MS);
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
    
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
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

  // 完了処理
  const handleComplete = async () => {
    if (!isExistingTask || !initialData?.id || !onComplete || !onRefresh) return;
    
    try {
      await onComplete(initialData.id);
      onRefresh();
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータス更新に失敗しました');
    }
  };

  if (!isOpen) return null;

  // プレビューモードの表示
  if (isPreviewMode && initialData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* ヘッダー */}
          <div className="bg-[#f5f5dc] border-b border-[#deb887] px-6 py-4">
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
                      initialData.status === 'done' 
                        ? 'text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc]' 
                        : 'text-[#8b4513] hover:text-[#7c5a2a] hover:bg-[#f5f5dc]'
                    }`}
                  >
                    {FaCheck({ className: "w-3 h-3" })}
                    {initialData.status === 'done' ? '未完了に戻す' : '完了'}
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
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
                >
                  {FaTimes({ className: "w-3 h-3" })}
                  閉じる
                </button>
              </div>
            </div>
          </div>
          
          {/* メインコンテンツ */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6">
              {/* タスクタイトル */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#8b4513] mb-2">{initialData.title}</h1>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    initialData.priority === 'high' ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                    initialData.priority === 'medium' ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]' :
                    'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                  }`}>
                    優先度: {initialData.priority === 'high' ? '高' : initialData.priority === 'medium' ? '中' : '低'}
                  </span>
                  {initialData.is_habit && (
                    <span className="px-3 py-1 text-sm rounded-full bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]">
                      習慣タスク
                    </span>
                  )}
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    initialData.status === 'done' ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887]' :
                    initialData.status === 'doing' ? 'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]' :
                    'bg-[#f5f5dc] text-[#7c5a2a] border border-[#deb887]'
                  }`}>
                    {initialData.status === 'done' ? '完了' : initialData.status === 'doing' ? '進行中' : '未着手'}
                  </span>
                </div>
              </div>

              {/* タスク内容 */}
              <div className="bg-[#f5f5dc] rounded-lg p-6 mb-6 border border-[#deb887]">
                <div className="prose prose-sm max-w-none text-[#8b4513]">
                  <ReactMarkdown>
                    {initialData.description || '*メモが入力されていません*'}
                  </ReactMarkdown>
                </div>
              </div>

              {/* 実行タイマー */}
              <div>
                <h3 className="text-lg font-semibold text-[#8b4513] mb-3">実行ログ</h3>
                <div className="space-y-4">
                  <TaskTimer 
                    task={initialData as Task} 
                    onExecutionComplete={() => {
                      if (onRefresh) onRefresh();
                    }}
                  />
                  <TaskExecutionHistory task={initialData as Task} />
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
      <div className={`bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${contentClassName} ${isFullScreen ? 'max-w-none max-h-none rounded-none' : ''}`}>
        {/* ヘッダー */}
        <div className="bg-[#f5f5dc] border-b border-[#deb887] px-6 py-4">
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
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#f5f5dc] rounded-lg transition-all duration-200"
              >
                {FaTimes({ className: "w-3 h-3" })}
                閉じる
              </button>
            </div>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8b4513] mb-2">
                    タイトル *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={titlePlaceholder}
                    className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a]"
                    disabled={isPreviewMode}
                  />
                </div>

                {/* 日付設定（必須項目） */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8b4513] mb-2">
                      開始日
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={setStartDate}
                      className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8b4513] mb-2">
                      期限日
                    </label>
                    <DatePicker
                      selected={dueDate}
                      onChange={setDueDate}
                      className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a]"
                    />
                  </div>
                </div>

                {/* 追加フィールド（習慣の頻度など） */}
                {renderAdditionalFields && renderAdditionalFields()}
              </div>

              {/* 詳細設定（スライドダウンパネル） */}
              <div className="border-t border-[#deb887] pt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors"
                >
                  {showDetails ? FaChevronUp({ className: "w-4 h-4" }) : FaChevronDown({ className: "w-4 h-4" })}
                  <span className="font-medium">詳細設定</span>
                </button>

                {showDetails && (
                  <div className="mt-4 space-y-4 bg-[#f5f5dc] rounded-lg p-4 border border-[#deb887]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full border-[#deb887] focus:border-[#7c5a2a] focus:ring-[#7c5a2a]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 完了切り替えボタン（既存タスクのみ） */}
              {isExistingTask && initialData && onComplete && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={initialData.status === 'done' ? 'secondary' : 'primary'}
                    onClick={handleComplete}
                    size="sm"
                    className={initialData.status === 'done' 
                      ? 'bg-[#f5f5dc] text-[#8b4513] border border-[#deb887] hover:bg-[#deb887]' 
                      : 'bg-[#7c5a2a] hover:bg-[#8b4513] text-white'
                    }
                  >
                    {initialData.status === 'done' ? '未完了に戻す' : '完了にする'}
                  </Button>
                </div>
              )}
            </div>

            {/* エディターエリア */}
            <div className="bg-[#f5f5dc] rounded-lg border border-[#deb887] mb-6 mt-6">
              <div className="p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={contentPlaceholder}
                  className="w-full h-96 resize-none border-0 focus:ring-0 focus:outline-none text-[#8b4513] placeholder-[#7c5a2a] bg-transparent"
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
    </div>
  );
}; 