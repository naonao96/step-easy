'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTaskStore, type Task } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaSave, FaEye, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

export default function TaskEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
  
  // URLパラメータから編集モードを判定
  const taskId = searchParams.get('id');
  const isEditParam = searchParams.get('edit') === 'true';
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
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isHabit, setIsHabit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isExistingTask && tasks.length > 0) {
      const foundTask = tasks.find(t => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setContent(foundTask.description || '');
        setPriority(foundTask.priority);
        setIsHabit(foundTask.is_habit || false);
      }
    } else {
      // 新規作成モード
      setTitle('');
      setContent('');
      setPriority('medium');
      setIsHabit(false);
    }
  }, [isExistingTask, taskId, tasks]);

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

  const handleSave = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const taskData = {
        title: title.trim(),
        description: content,
        priority,
        is_habit: isHabit,
        status: 'todo' as const
      };

      if (isExistingTask && task) {
        await updateTask(task.id, taskData);
        // 保存後はプレビューモードに切り替え
        switchToPreviewMode();
      } else {
        await createTask(taskData as Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>);
        // エラーがある場合はストアのエラーを確認
        const error = useTaskStore.getState().error;
        if (error) {
          alert(error);
          return;
        }
      router.push('/menu');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

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

  if (loading) {
    return (
      <AppLayout>
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

  // プレビューモードの表示
  if (!isEditMode && isExistingTask && task) {
    const previewContextActions = [
      {
        label: 'メニューに戻る',
        action: () => router.push('/menu'),
        icon: FaArrowLeft
      },
      {
        label: '編集',
        action: switchToEditMode,
        icon: FaEdit,
        variant: 'primary' as const
      },
      {
        label: task.status === 'done' ? '未完了に戻す' : '完了',
        action: handleComplete,
        variant: task.status === 'done' ? 'default' as const : 'primary' as const
      },
      {
        label: '削除',
        action: handleDelete,
        icon: FaTrash,
        variant: 'danger' as const
      }
    ];

  return (
    <AppLayout
      title="タスク詳細"
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
      contextActions={previewContextActions}
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

              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 編集モードの表示
  const editContextActions = [
    {
      label: 'メニューに戻る',
      action: () => router.push('/menu'),
      icon: FaArrowLeft
    },
    ...(isExistingTask ? [{
      label: 'プレビュー',
      action: switchToPreviewMode,
      icon: FaEye,
      variant: 'default' as const
    }] : []),
    {
      label: '保存',
      action: handleSave,
      icon: FaSave,
      variant: 'primary' as const
    },
    ...(isExistingTask && task ? [{
      label: '削除',
      action: handleDelete,
      icon: FaTrash,
      variant: 'danger' as const
    }] : [])
  ];

  return (
    <AppLayout
      title={isExistingTask ? "タスクを編集" : "新しいタスク"}
      showBackButton={true}
      backUrl={isExistingTask ? `/tasks?id=${taskId}` : "/menu"}
      backLabel={isExistingTask ? "プレビューに戻る" : "メニューに戻る"}
      contextActions={editContextActions}
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
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先度
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isHabit}
                  onChange={(e) => setIsHabit(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">習慣タスク</span>
              </label>
            </div>

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