'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTaskStore, type Task } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaSave, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

export default function TaskEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
  
  // URLパラメータから編集モードを判定
  const taskId = searchParams.get('id');
  const isEditing = !!taskId;
  
  // 編集中のタスクデータ
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isHabit, setIsHabit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isEditing && tasks.length > 0) {
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
  }, [isEditing, taskId, tasks]);

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

      if (isEditing && task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
      }
      
      router.push('/menu');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !task) return;
    
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
    if (!isEditing || !task) return;
    
    try {
      await updateTask(task.id, { 
        status: task.status === 'done' ? 'todo' : 'done',
        completed_at: task.status === 'done' ? undefined : new Date().toISOString()
      });
      router.push('/menu');
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータス更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <AppLayout
        title="読み込み中..."
        showBackButton={true}
        backUrl="/menu"
        backLabel="メニューに戻る"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isEditing ? "タスクを編集" : "新しいタスク"}
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* プレビュー・保存ボタン（タイトルの上の行に配置） */}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              leftIcon={showPreview ? FaEdit : FaEye}
            >
              {showPreview ? '編集' : 'プレビュー'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              leftIcon={FaSave}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>

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

            {isEditing && task && (
              <div className="flex items-center gap-2">
                <Button
                  variant={task.status === 'done' ? 'secondary' : 'primary'}
                  onClick={handleComplete}
                  size="sm"
                >
                  {task.status === 'done' ? '未完了に戻す' : '完了にする'}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  leftIcon={FaTrash}
                  size="sm"
                >
                  削除
                </Button>
              </div>
            )}
          </div>

          {/* エディター/プレビューエリア */}
          <div className="bg-white rounded-lg shadow-sm border">
            {showPreview ? (
              // プレビューモード
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{content || '*ここにメモを書いてください...*'}</ReactMarkdown>
                </div>
              </div>
            ) : (
              // 編集モード
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
                  className="w-full h-96 resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400"
                  style={{ fontFamily: 'Monaco, Menlo, monospace' }}
                />
              </div>
            )}
          </div>

          {/* ヘルプテキスト */}
          <div className="mt-4 text-sm text-gray-500">
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
    </AppLayout>
  );
} 