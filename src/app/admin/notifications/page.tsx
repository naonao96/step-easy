'use client';

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ToggleSwitch } from '@/components/atoms/ToggleSwitch';
import { FaBell, FaUsers, FaCrown, FaUser, FaUserFriends, FaPaperPlane } from 'react-icons/fa';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState<'system' | 'task' | 'habit' | 'subscription' | 'ai'>('system');
  const [targetUsers, setTargetUsers] = useState<'all' | 'premium' | 'free' | 'guest'>('all');
  const [adminKey, setAdminKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    totalUsers?: number;
    successful?: number;
    failed?: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim() || !adminKey.trim()) {
      alert('すべての必須フィールドを入力してください');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority,
          category,
          targetUsers,
          adminKey: adminKey.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          totalUsers: data.totalUsers,
          successful: data.successful,
          failed: data.failed
        });
        
        // 成功時はフォームをクリア
        setTitle('');
        setMessage('');
      } else {
        setResult({
          success: false,
          message: data.error || '通知送信に失敗しました'
        });
      }
    } catch (error) {
      console.error('通知送信エラー:', error);
      setResult({
        success: false,
        message: 'ネットワークエラーが発生しました'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetUsersLabel = () => {
    switch (targetUsers) {
      case 'all': return '全ユーザー';
      case 'premium': return 'プレミアムユーザーのみ';
      case 'free': return '無料ユーザーのみ';
      case 'guest': return 'ゲストユーザーのみ';
      default: return '全ユーザー';
    }
  };

  const getTargetUsersIcon = () => {
    switch (targetUsers) {
      case 'all': return <span className="text-lg">👥</span>;
      case 'premium': return <span className="text-lg">👑</span>;
      case 'free': return <span className="text-lg">👤</span>;
      case 'guest': return <span className="text-lg">👥</span>;
      default: return <span className="text-lg">👥</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5dc] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-[#faf8f0] rounded-lg shadow-md p-6 border border-[#deb887]">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🐦</span>
            <h1 className="text-2xl font-bold text-[#8b4513]">管理者通知送信</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 管理者キー */}
            <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
              <label className="block text-sm font-medium text-[#8b4513] mb-2">
                🔐 管理者キー *
              </label>
              <Input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="管理者キーを入力"
                required
                className="w-full border-[#deb887] focus:border-[#8b4513] focus:ring-[#8b4513]"
              />
            </div>

            {/* 通知内容 */}
            <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
              <h3 className="text-lg font-medium text-[#8b4513] mb-3">📝 通知内容</h3>

            {/* タイトル */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#8b4513] mb-2">
                通知タイトル *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="通知のタイトルを入力"
                required
                  className="w-full border-[#deb887] focus:border-[#8b4513] focus:ring-[#8b4513]"
              />
            </div>

            {/* メッセージ */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#8b4513] mb-2">
                通知メッセージ *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="通知の内容を入力"
                required
                rows={4}
                  className="w-full px-3 py-2 border border-[#deb887] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513] bg-[#faf8f0]"
              />
              </div>
            </div>

            {/* 通知設定 */}
            <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
              <h3 className="text-lg font-medium text-[#8b4513] mb-3">⚙️ 通知設定</h3>

            {/* 優先度 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#8b4513] mb-2">
                優先度
              </label>
              <div className="flex gap-4">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <label key={p} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={(e) => setPriority(e.target.value as any)}
                        className="text-[#8b4513] focus:ring-[#8b4513]"
                    />
                      <span className="text-sm text-[#7c5a2a] capitalize">
                      {p === 'low' ? '低' : p === 'medium' ? '中' : '高'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* カテゴリ */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#8b4513] mb-2">
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#deb887] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513] bg-[#faf8f0]"
              >
                  <option value="system">🛡️ システム</option>
                  <option value="task">📝 タスク</option>
                  <option value="habit">🔥 習慣</option>
                  <option value="subscription">👑 サブスクリプション</option>
                  <option value="ai">🤖 AI</option>
              </select>
            </div>

            {/* 対象ユーザー */}
            <div>
                <label className="block text-sm font-medium text-[#8b4513] mb-2">
                対象ユーザー
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['all', 'premium', 'free', 'guest'] as const).map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setTargetUsers(target)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      targetUsers === target
                          ? 'border-[#8b4513] bg-[#f0e8d8] text-[#8b4513]'
                          : 'border-[#deb887] bg-[#faf8f0] text-[#7c5a2a] hover:border-[#8b4513] hover:bg-[#f0e8d8]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {getTargetUsersIcon()}
                      <span className="text-xs font-medium">
                        {target === 'all' ? '全ユーザー' :
                         target === 'premium' ? 'プレミアム' :
                         target === 'free' ? '無料' : 'ゲスト'}
                      </span>
                    </div>
                  </button>
                ))}
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                leftIcon={FaPaperPlane}
                fullWidth
                disabled={!title.trim() || !message.trim() || !adminKey.trim()}
                className="bg-[#7c5a2a] hover:bg-[#8b4513] text-white border-[#deb887]"
              >
                {isLoading ? '送信中...' : '📤 通知を送信'}
              </Button>
            </div>
          </form>

          {/* 結果表示 */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg border ${
              result.success 
                ? 'bg-[#f0f8f0] border-[#90ee90] text-[#006400]' 
                : 'bg-[#fff0f0] border-[#ffcccb] text-[#8b0000]'
            }`}>
              <div className="font-medium flex items-center gap-2">
                {result.success ? <span>✅</span> : <span>❌</span>}
                {result.message}
              </div>
              {result.success && result.totalUsers && (
                <div className="mt-2 text-sm space-y-1">
                  <div>👥 対象ユーザー数: {result.totalUsers}人</div>
                  <div>✅ 成功: {result.successful}件</div>
                  <div>❌ 失敗: {result.failed}件</div>
                </div>
              )}
            </div>
          )}

          {/* 使用例 */}
          <div className="mt-8 p-4 bg-[#f0e8d8] rounded-lg border border-[#deb887]">
            <h3 className="text-sm font-medium text-[#8b4513] mb-3 flex items-center gap-2">
              <span>💡</span>
              使用例
            </h3>
            <div className="space-y-3 text-sm text-[#7c5a2a]">
              <div className="bg-[#faf8f0] p-3 rounded border border-[#deb887]/50">
                <div className="font-medium text-[#8b4513] mb-1">🛠️ メンテナンス通知:</div>
                <div className="text-xs space-y-1">
                  <div><strong>タイトル:</strong> 「システムメンテナンスのお知らせ」</div>
                  <div><strong>メッセージ:</strong> 「明日の午前2時から4時までメンテナンスを実施します。ご不便をおかけしますが、ご理解ください。」</div>
                </div>
              </div>
              <div className="bg-[#faf8f0] p-3 rounded border border-[#deb887]/50">
                <div className="font-medium text-[#8b4513] mb-1">✨ 新機能のお知らせ:</div>
                <div className="text-xs space-y-1">
                  <div><strong>タイトル:</strong> 「新機能が追加されました！」</div>
                  <div><strong>メッセージ:</strong> 「タスクの一括編集機能が追加されました。より効率的にタスク管理ができるようになりました。」</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 