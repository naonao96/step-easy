'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useUserStore } from '@/stores/userStore';
import { FaUser, FaBell, FaLock, FaPalette, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, settings, updateUser, updateSettings, changePassword, deleteAccount, signOut } = useUserStore();
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

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setNotificationSettings({
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        task_reminders: settings.task_reminders,
        habit_reminders: settings.habit_reminders,
        ai_suggestions: settings.ai_suggestions,
      });
      setAppearanceSettings({
        theme: settings.theme,
        font_size: settings.font_size,
        compact_mode: settings.compact_mode,
      });
    }
  }, [settings]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUser(profileData);
      toast.success('プロフィールを更新しました');
    } catch (error) {
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsLoading(true);
    try {
      await updateSettings(notificationSettings);
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
      await updateSettings(appearanceSettings);
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
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
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
      await deleteAccount();
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

  if (!user || !settings) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">設定</h1>

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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">プロフィール設定</h2>
                  <Input
                    label="表示名"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  />
                  <Input
                    label="メールアドレス"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                  <Input
                    label="自己紹介"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    multiline
                  />
                  <Button type="submit" isLoading={isLoading}>
                    保存
                  </Button>
                </form>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h2>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">外観設定</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">テーマ</label>
                      <select
                        value={appearanceSettings.theme}
                        onChange={(e) =>
                          setAppearanceSettings({
                            ...appearanceSettings,
                            theme: e.target.value as 'light' | 'dark' | 'system',
                          })
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="light">ライト</option>
                        <option value="dark">ダーク</option>
                        <option value="system">システム設定に従う</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">フォントサイズ</label>
                      <select
                        value={appearanceSettings.font_size}
                        onChange={(e) =>
                          setAppearanceSettings({
                            ...appearanceSettings,
                            font_size: e.target.value as 'small' | 'medium' | 'large',
                          })
                        }
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">セキュリティ設定</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input
                      label="現在のパスワード"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                    <Input
                      label="新しいパスワード"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                    <Input
                      label="新しいパスワード（確認）"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                    <Button type="submit" isLoading={isLoading}>
                      パスワードを変更
                    </Button>
                  </form>
                  <div className="pt-6 border-t">
                    <Button variant="danger" onClick={handleDeleteAccount} isLoading={isLoading}>
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
  );
} 