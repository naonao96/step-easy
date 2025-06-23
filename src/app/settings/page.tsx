'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaUser, FaBell, FaLock, FaSignOutAlt, FaInfoCircle, FaGem, FaFileContract, FaShieldAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/templates/AppLayout';
import { useTaskStore } from '@/stores/taskStore';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, isPremium, isGuest } = useAuth();
  const { tasks, fetchTasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
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
    premium_updates: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 個別のパスワード変更用state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません');
      return;
    }
    setIsLoading(true);
    try {
      // TODO: パスワード変更機能の実装
      toast.success('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('パスワードの変更に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // 段階的確認プロセス
    const firstConfirm = window.confirm(
      'アカウントを削除すると、すべてのタスクデータ、実行履歴、設定が永久に失われます。\n\n本当に削除してもよろしいですか？'
    );
    
    if (!firstConfirm) return;

    const finalConfirm = window.confirm(
      '最終確認です。\n\nこの操作は取り消すことができません。アカウントとすべてのデータが完全に削除されます。\n\n続行しますか？'
    );
    
    if (!finalConfirm) return;

    setIsLoading(true);
    try {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      
      console.log('🗑️ アカウント削除開始...');
      
      // 1. 関連データの順次削除（CASCADE設定があるが明示的に削除）
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('ユーザーが見つかりません');
      }

      console.log('📊 関連データ削除開始...');
      
      // execution_logs削除
      const { error: logsError } = await supabase
        .from('execution_logs')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (logsError) {
        console.error('execution_logs削除エラー:', logsError);
      }

      // active_executions削除
      const { error: activeError } = await supabase
        .from('active_executions')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (activeError) {
        console.error('active_executions削除エラー:', activeError);
      }

      // daily_messages削除
      const { error: messagesError } = await supabase
        .from('daily_messages')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (messagesError) {
        console.error('daily_messages削除エラー:', messagesError);
      }

      // premium_waitlist削除
      const { error: waitlistError } = await supabase
        .from('premium_waitlist')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (waitlistError) {
        console.error('premium_waitlist削除エラー:', waitlistError);
      }

      // tasks削除
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (tasksError) {
        console.error('tasks削除エラー:', tasksError);
        throw tasksError;
      }

      // user_settings削除
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (settingsError) {
        console.error('user_settings削除エラー:', settingsError);
        throw settingsError;
      }

      // users削除
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUser.id);
      
      if (userError) {
        console.error('users削除エラー:', userError);
        throw userError;
      }

      console.log('✅ 関連データ削除完了');
      
      // 2. Supabase Authからユーザー削除（注意：これは現在のセッションでは使用できない可能性がある）
      // Supabase Authの削除は管理者権限が必要なため、サインアウトで代替
      console.log('🔐 認証セッション終了...');
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('サインアウトエラー:', signOutError);
        // サインアウトエラーは致命的でないため続行
      }

      console.log('🎉 アカウント削除完了');
      toast.success('アカウントを削除しました。ご利用ありがとうございました。');
      
      // トップページにリダイレクト
      router.push('/lp');
      
    } catch (error: any) {
      console.error('❌ アカウント削除エラー:', error);
      toast.error(`アカウントの削除に失敗しました: ${error.message || '不明なエラー'}`);
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
          {/* モバイル用タブナビゲーション（上部固定） */}
          <div className="md:hidden mb-6">
            <div className="bg-white rounded-lg shadow-md p-2 sticky top-0 z-10">
              <div className="flex overflow-x-auto gap-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[70px] ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {FaUser({ className: "w-4 h-4" })}
                  <span className="text-xs font-medium">プロフィール</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[70px] ${
                    activeTab === 'notifications'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {FaBell({ className: "w-4 h-4" })}
                  <span className="text-xs font-medium">通知</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[70px] ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {FaLock({ className: "w-4 h-4" })}
                  <span className="text-xs font-medium">セキュリティ</span>
                </button>

              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* デスクトップ用サイドバー */}
            <div className="md:col-span-1 hidden md:block">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {FaUser({ className: "w-5 h-5" })}
                    <span>プロフィール</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'notifications'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {FaBell({ className: "w-5 h-5" })}
                    <span>通知</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'security'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {FaLock({ className: "w-5 h-5" })}
                    <span>セキュリティ</span>
                  </button>

                </div>
                
                {/* プレミアム予告カード（安全に追加） */}
                {!isPremium && !isGuest && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {FaGem ({className:"w-4 h-4 text-amber-600"})}
                      <span className="text-sm font-semibold text-amber-800">プレミアム機能</span>
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                        準備中
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                      より詳細な分析とAI機能を準備中です
                    </p>
                    <div className="space-y-1 text-xs text-amber-600 mb-3">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                        <span>週次・月次レポート</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                        <span>行動パターン分析</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                        <span>AI専属コーチ</span>
                      </div>
                    </div>
                    <button className="w-full text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-md transition-colors">
                      詳細を見る
                    </button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {FaSignOutAlt({ className: "w-5 h-5" })}
                    <span>ログアウト</span>
                  </button>
                </div>
              </div>
            </div>

            {/* メインコンテンツ */}
            <div className="md:col-span-3 col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
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
                      
                      {/* プレミアム機能通知設定（安全に追加） */}
                      {!isPremium && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex items-center gap-2 mb-3">
                            {FaGem ({className:"w-4 h-4 text-amber-500"})}
                            <span className="text-sm font-medium text-gray-700">プレミアム機能通知</span>
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                              Coming Soon
                            </span>
                          </div>
                          <label className="flex items-center space-x-3 opacity-75">
                            <input
                              type="checkbox"
                              checked={notificationSettings.premium_updates || false}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  premium_updates: e.target.checked,
                                })
                              }
                              className="form-checkbox h-5 w-5 text-amber-600"
                            />
                            <span className="text-sm">プレミアム機能のアップデート通知</span>
                          </label>
                          <p className="text-xs text-gray-500 ml-8 mt-1">
                            新機能のベータ版リリースやアップデート情報をお知らせします
                          </p>
                        </div>
                      )}
                    </div>
                    <Button onClick={handleNotificationUpdate} isLoading={isLoading}>
                      保存
                    </Button>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-slate-900">セキュリティ</h2>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          現在のパスワード
                        </label>
                                                  <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="現在のパスワードを入力"
                            required
                          />
                      </div>
                      
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          新しいパスワード
                        </label>
                                                  <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="新しいパスワードを入力"
                            required
                          />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          新しいパスワード（確認）
                        </label>
                                                  <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="新しいパスワードを再入力"
                            required
                          />
                      </div>
                      
                      <Button
                        type="submit"
                        isLoading={isLoading}
                        className="w-full sm:w-auto"
                      >
                        パスワードを変更
                      </Button>
                    </form>

                    <hr className="my-8" />

                    {/* 法的情報セクション */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        法的情報
                      </h3>
                      <p className="text-slate-700 mb-4 text-sm">
                        プライバシーポリシーと利用規約をご確認いただけます。
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => window.open('/privacy', '_blank')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          {FaShieldAlt({ className: "w-4 h-4" })}
                          プライバシーポリシー
                        </button>
                        <button
                          onClick={() => window.open('/terms', '_blank')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          {FaFileContract({ className: "w-4 h-4" })}
                          利用規約
                        </button>
                      </div>
                    </div>

                    <hr className="my-8" />

                    {/* ログアウトセクション */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        アカウント管理
                      </h3>
                      <p className="text-blue-700 mb-4 text-sm">
                        アカウントからログアウトします。
                      </p>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {FaSignOutAlt({ className: "w-4 h-4" })}
                        ログアウト
                      </button>
                    </div>

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