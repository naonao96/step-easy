'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaUser, FaBell, FaLock, FaPalette, FaSignOutAlt, FaInfoCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/templates/AppLayout';
import { useTaskStore } from '@/stores/taskStore';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { tasks, fetchTasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    task_reminders: true,
    habit_reminders: true,
    ai_suggestions: true,
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    font_size: 'medium' as 'small' | 'medium' | 'large',
    compact_mode: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // ヘルプリンク用の関数
  const openHelp = (section: string) => {
    // window.postMessage を使って親のヘルプパネルを開く
    window.dispatchEvent(new CustomEvent('openHelp', { detail: { section } }));
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        bio: '', // bio情報は後で実装予定
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      
      // Supabaseでuser_metadataを更新
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: profileData.displayName.trim(),
        }
      });

      if (error) throw error;

      toast.success('プロフィールを更新しました');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsLoading(true);
    try {
      // TODO: 通知設定更新機能の実装
      toast.success('通知設定を更新しました');
    } catch (error) {
      toast.error('通知設定の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppearanceUpdate = async () => {
    setIsLoading(true);
    try {
      // TODO: 外観設定更新機能の実装
      toast.success('外観設定を更新しました');
    } catch (error) {
      toast.error('外観設定の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新しいパスワードが一致しません');
      return;
    }
    setIsLoading(true);
    try {
      // TODO: パスワード変更機能の実装
      toast.success('パスワードを変更しました');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('パスワードの変更に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('アカウントを削除してもよろしいですか？この操作は取り消せません。')) {
      return;
    }
    setIsLoading(true);
    try {
      // TODO: アカウント削除機能の実装
      toast.success('アカウントを削除しました');
      router.push('/');
    } catch (error) {
      toast.error('アカウントの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      toast.error('ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ゲストユーザーの場合は機能制限メッセージを表示
  if (user?.isGuest) {
    return (
      <AppLayout
        title="設定"
        showBackButton={true}
        backUrl="/menu"
        backLabel="メニューに戻る"
        tasks={tasks as any}
      >
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">設定機能</h2>
              <p className="text-gray-600 mb-6">
                設定機能を利用するには、アカウント登録が必要です。
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/register')}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新規登録
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ログイン
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ユーザーが読み込まれていない場合のローディング
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      title="設定"
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
      tasks={tasks as any}
    >
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* サイドバー */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-5 h-5">{FaUser({})}</span>
                    <span>プロフィール</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
                      activeTab === 'notifications'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-5 h-5">{FaBell({})}</span>
                    <span>通知</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('appearance')}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
                      activeTab === 'appearance'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-5 h-5">{FaPalette({})}</span>
                    <span>外観</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
                      activeTab === 'security'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-5 h-5">{FaLock({})}</span>
                    <span>セキュリティ</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <span className="w-5 h-5">{FaSignOutAlt({})}</span>
                    <span>ログアウト</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* メインコンテンツ */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">プロフィール設定</h2>
                      <button
                        type="button"
                        onClick={() => openHelp('tasks')}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="プロフィール設定のヘルプ"
                      >
                        {FaInfoCircle({ className: "w-4 h-4" })}
                      </button>
                    </div>
                    <Input
                      label="表示名"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      placeholder="キャラクターが呼びかける名前"
                    />
                    <Input
                      label="メールアドレス"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled
                    />
                    <Button type="submit" isLoading={isLoading}>
                      保存
                    </Button>
                  </form>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">通知設定</h2>
                      <button
                        type="button"
                        onClick={() => openHelp('tasks')}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="通知設定のヘルプ"
                      >
                        {FaInfoCircle({ className: "w-4 h-4" })}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_notifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              email_notifications: e.target.checked,
                            })
                          }
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>メール通知</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.push_notifications}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              push_notifications: e.target.checked,
                            })
                          }
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>プッシュ通知</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.task_reminders}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              task_reminders: e.target.checked,
                            })
                          }
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>タスクリマインダー</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.habit_reminders}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              habit_reminders: e.target.checked,
                            })
                          }
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>習慣リマインダー</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={notificationSettings.ai_suggestions}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              ai_suggestions: e.target.checked,
                            })
                          }
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>AI提案</span>
                      </label>
                    </div>
                    <Button onClick={handleNotificationUpdate} isLoading={isLoading}>
                      保存
                    </Button>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">外観設定</h2>
                      <button
                        type="button"
                        onClick={() => openHelp('faq')}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="外観設定のヘルプ"
                      >
                        {FaInfoCircle({ className: "w-4 h-4" })}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          テーマ
                        </label>
                        <select
                          value={appearanceSettings.theme}
                          onChange={(e) =>
                            setAppearanceSettings({
                              ...appearanceSettings,
                              theme: e.target.value as 'light' | 'dark' | 'system',
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="light">ライト</option>
                          <option value="dark">ダーク</option>
                          <option value="system">システム設定に従う</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          フォントサイズ
                        </label>
                        <select
                          value={appearanceSettings.font_size}
                          onChange={(e) =>
                            setAppearanceSettings({
                              ...appearanceSettings,
                              font_size: e.target.value as 'small' | 'medium' | 'large',
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="small">小</option>
                          <option value="medium">中</option>
                          <option value="large">大</option>
                        </select>
                      </div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={appearanceSettings.compact_mode}
                          onChange={(e) =>
                            setAppearanceSettings({
                              ...appearanceSettings,
                              compact_mode: e.target.checked,
                            })
                          }
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>コンパクトモード</span>
                      </label>
                    </div>
                    <Button onClick={handleAppearanceUpdate} isLoading={isLoading}>
                      保存
                    </Button>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">セキュリティ設定</h2>
                      <button
                        type="button"
                        onClick={() => openHelp('faq')}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="セキュリティ設定のヘルプ"
                      >
                        {FaInfoCircle({ className: "w-4 h-4" })}
                      </button>
                    </div>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <Input
                        label="現在のパスワード"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="新しいパスワード"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="新しいパスワード（確認）"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        required
                      />
                      <Button type="submit" isLoading={isLoading}>
                        パスワードを変更
                      </Button>
                    </form>

                    <hr className="my-8" />

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        危険な操作
                      </h3>
                      <p className="text-red-700 mb-4">
                        アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消すことができません。
                      </p>
                      <Button
                        onClick={handleDeleteAccount}
                        variant="danger"
                        isLoading={isLoading}
                      >
                        アカウントを削除
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 