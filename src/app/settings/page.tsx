'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FaUser, FaBell, FaLock, FaSignOutAlt, FaInfoCircle, FaGem, FaFileContract, FaShieldAlt, FaTrash, FaSave, FaKey, FaCrown, FaCreditCard, FaQuestionCircle, FaHeart, FaTasks, FaFire, FaRobot } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/templates/AppLayout';
import { useTaskStore } from '@/stores/taskStore';
import { PremiumComingSoonBanner } from '@/components/molecules/PremiumComingSoonBanner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// AuthContextと同じSupabaseクライアント作成方法を使用して認証状態を統一
const supabase = createClientComponentClient();

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut, isPremium, isGuest } = useAuth();
  const { tasks, fetchTasks } = useTaskStore();
  
  // URLパラメータからタブを取得、デフォルトは'profile'
  const initialTab = searchParams.get('tab') as 'profile' | 'notifications' | 'subscription' | 'security' || 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'subscription' | 'security'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);

  // デバッグ用ログ
  console.log('SettingsPage Debug:', {
    user,
    isPremium,
    isGuest,
    userIsPremium: user?.isPremium,
    userPlanType: user?.planType
  });

  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: '',
    characterName: '', // 小鳥の名前を追加
  });

  const [notificationSettings, setNotificationSettings] = useState<{ [key: string]: boolean }>({
    task: true,
    habit: true,
    subscription: true,
    system: true,
    ai: true,
  });

  // 通知カテゴリ定義
  const notificationCategories = [
    {
      key: 'task',
      label: 'タスク通知',
      icon: FaTasks,
      description: 'タスクの完了や期限に関する通知'
    },
    {
      key: 'habit',
      label: '習慣通知',
      icon: FaFire,
      description: '習慣の継続や達成に関する通知'
    },
    {
      key: 'subscription',
      label: 'サブスクリプション通知',
      icon: FaCrown,
      description: 'プレミアム・支払い・体験期間などの通知'
    },
    {
      key: 'system',
      label: 'システム通知',
      icon: FaShieldAlt,
      description: 'メンテナンスや重要なお知らせ'
    },
    {
      key: 'ai',
      label: 'AI通知',
      icon: FaRobot,
      description: 'AIメッセージや分析結果の通知'
    },
  ];



  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        bio: '', // bio情報は後で実装予定
        characterName: user.characterName || '', // 小鳥の名前を追加
      });
    }
  }, [user]);

  useEffect(() => {
    console.log('🔄 通知設定初期化チェック');
    console.log('👤 ユーザー:', user);
    console.log('📊 ユーザーの通知設定:', (user as any)?.notification_settings);
    
    if (user && (user as any).notification_settings) {
      console.log('✅ 通知設定を初期化:', (user as any).notification_settings);
      setNotificationSettings({ ...(user as any).notification_settings });
    } else {
      console.log('⚠️ 通知設定が見つからない、デフォルト値を使用');
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const displayName = profileData.displayName.trim();
      const characterName = profileData.characterName.trim();
      
      // 入力値の検証
      if (!displayName) {
        toast.error('ユーザー名を入力してください');
        return;
      }
      
      if (displayName.length > 50) {
        toast.error('ユーザー名は50文字以内で入力してください');
        return;
      }

      if (characterName.length > 15) {
        toast.error('小鳥の名前は15文字以内で入力してください');
        return;
      }

      // Usersテーブルのdisplay_nameとcharacter_nameを更新
      const { error: dbError } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          character_name: characterName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (dbError) {
        console.error('Database update error:', dbError);
        throw new Error(`プロフィールの更新に失敗しました: ${dbError.message}`);
      }

      toast.success('プロフィールを更新しました');
      
      // ページをリロードして新しい名前を反映
      window.location.reload();
      
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'プロフィールの更新に失敗しました';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    console.log('🔔 通知設定更新開始');
    console.log('📊 現在の通知設定:', notificationSettings);
    console.log('👤 ユーザーID:', user?.id);
    
    setIsLoading(true);
    try {
      console.log('💾 データベース更新リクエスト送信...');
      const { error } = await supabase
        .from('users')
        .update({ notification_settings: notificationSettings, updated_at: new Date().toISOString() })
        .eq('id', user?.id);
      
      console.log('📡 データベースレスポンス:', { error });
      
      if (error) {
        console.error('❌ データベースエラー:', error);
        throw error;
      }
      
      console.log('✅ 通知設定更新成功');
      toast.success('通知設定を更新しました');
      
      // AuthContextのユーザー情報を更新
      console.log('🔄 AuthContextのユーザー情報を更新中...');
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          plan_type,
          notification_settings
        `)
        .eq('id', user?.id)
        .single();
      
      if (fetchError) {
        console.error('❌ 更新されたユーザー情報の取得エラー:', fetchError);
      } else {
        console.log('✅ 更新されたユーザー情報:', updatedUser);
        // ユーザー情報を更新（AuthContextの再取得をトリガー）
        window.location.reload();
      }
      
    } catch (error) {
      console.error('❌ 通知設定更新エラー:', error);
      toast.error('通知設定の更新に失敗しました');
    } finally {
      console.log('🏁 通知設定更新処理完了');
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

      // emotions削除
      const { error: emotionsError } = await supabase
        .from('emotions')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (emotionsError) {
        console.error('emotions削除エラー:', emotionsError);
      }

      // notifications削除
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (notificationsError) {
        console.error('notifications削除エラー:', notificationsError);
      }

      // habits削除
      const { error: habitsError } = await supabase
        .from('habits')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (habitsError) {
        console.error('habits削除エラー:', habitsError);
      }

      // habit_completions削除
      const { error: habitCompletionsError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (habitCompletionsError) {
        console.error('habit_completions削除エラー:', habitCompletionsError);
      }

      // task_categories削除
      const { error: taskCategoriesError } = await supabase
        .from('task_categories')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (taskCategoriesError) {
        console.error('task_categories削除エラー:', taskCategoriesError);
      }

      // Stripeサブスクリプションのキャンセル
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', currentUser.id)
        .single();

      if (subscription?.stripe_subscription_id) {
        try {
          console.log('🔐 Stripeサブスクリプションキャンセル開始:', subscription.stripe_subscription_id);
          const response = await fetch('/api/stripe/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              subscriptionId: subscription.stripe_subscription_id 
            }),
          });
          
          if (!response.ok) {
            console.error('Stripeサブスクリプションキャンセルエラー:', response.status);
          } else {
            console.log('✅ Stripeサブスクリプションをキャンセルしました');
          }
        } catch (error) {
          console.error('Stripe API呼び出しエラー:', error);
        }
      }

      // subscriptions削除（Stripe側は保持、データベース側のみ削除）
      const { error: subscriptionsError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (subscriptionsError) {
        console.error('subscriptions削除エラー:', subscriptionsError);
      }

      // payment_history削除（Stripe側は保持、データベース側のみ削除）
      const { error: paymentHistoryError } = await supabase
        .from('payment_history')
        .delete()
        .eq('user_id', currentUser.id);
      
      if (paymentHistoryError) {
        console.error('payment_history削除エラー:', paymentHistoryError);
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

      // 2. Supabase Authユーザー本体をEdge Function経由で削除
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const projectRef = supabaseUrl?.replace('https://', '').replace('.supabase.co', '');
      const edgeFunctionUrl = `https://${projectRef}.supabase.co/functions/v1/delete-user`;
      console.log('🔐 Supabase Authユーザー本体削除リクエスト...');
      console.log('🌐 Edge Function URL:', edgeFunctionUrl);
      console.log('🆔 User ID:', currentUser.id);
      
      // ユーザーのアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('アクセストークンが取得できませんでした');
      }
      
      const res = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      console.log('📡 Response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Edge Function エラー:', errorText);
        throw new Error(`Edge Function エラー (${res.status}): ${errorText}`);
      }
      const result = await res.json();
      console.log('📋 Edge Function 結果:', result);
      if (!result.success) {
        throw new Error(result.error || 'Supabase Authユーザー削除に失敗しました');
      }

      console.log('🎉 アカウント削除完了');
      toast.success('アカウントを削除しました。ご利用ありがとうございました。');
      
      // サインアウトとリダイレクト
      await supabase.auth.signOut();
      router.push('/lp');
      
    } catch (error: any) {
      console.error('❌ アカウント削除エラー:', error);
      toast.error(`アカウントの削除に失敗しました: ${error.message || '不明なエラー'}`);
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
      <div className="px-4 sm:px-6 py-4 sm:py-6 mt-4">
        <div className="max-w-7xl mx-auto">
                    {/* モバイル用タブナビゲーション（上部固定） */}
          <div className="md:hidden mb-6">
            <div className="bg-[#f5f5dc] rounded-lg shadow-md p-2 sticky top-0 z-10 border border-[#deb887]">
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-[#deb887] text-[#8b4513]'
                      : 'text-[#7c5a2a] hover:bg-[#deb887]'
                  }`}
                >
                  {FaUser({ className: "w-4 h-4" })}
                  <span className="text-xs font-medium">プロフィール</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-[#deb887] text-[#8b4513]'
                      : 'text-[#7c5a2a] hover:bg-[#deb887]'
                  }`}
                >
                  {FaBell({ className: "w-4 h-4" })}
                  <span className="text-xs font-medium">通知</span>
                </button>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                    activeTab === 'subscription'
                      ? 'bg-[#deb887] text-[#8b4513]'
                      : 'text-[#7c5a2a] hover:bg-[#deb887]'
                  }`}
                >
                  {FaCrown({ className: "w-4 h-4" })}
                  <span className="text-xs font-medium">プレミアム</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                    activeTab === 'security'
                      ? 'bg-[#deb887] text-[#8b4513]'
                      : 'text-[#7c5a2a] hover:bg-[#deb887]'
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
              <div className="bg-[#f5f5dc] rounded-lg shadow-md p-6 border border-[#deb887]">
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-[#deb887] text-[#8b4513] border border-[#7c5a2a]'
                        : 'text-[#7c5a2a] hover:bg-[#deb887]'
                    }`}
                  >
                    {FaUser({ className: "w-5 h-5" })}
                    <span>プロフィール</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'notifications'
                        ? 'bg-[#deb887] text-[#8b4513] border border-[#7c5a2a]'
                        : 'text-[#7c5a2a] hover:bg-[#deb887]'
                    }`}
                  >
                    {FaBell({ className: "w-5 h-5" })}
                    <span>通知</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'subscription'
                        ? 'bg-[#deb887] text-[#8b4513] border border-[#7c5a2a]'
                        : 'text-[#7c5a2a] hover:bg-[#deb887]'
                    }`}
                  >
                    {FaCrown({ className: "w-5 h-5" })}
                    <span>プレミアム</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === 'security'
                        ? 'bg-[#deb887] text-[#8b4513] border border-[#7c5a2a]'
                        : 'text-[#7c5a2a] hover:bg-[#deb887]'
                    }`}
                  >
                    {FaLock({ className: "w-5 h-5" })}
                    <span>セキュリティ</span>
                  </button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-[#deb887]">
                  <button
                    onClick={signOut}
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
              
              <div className="bg-[#f5f5dc] rounded-lg shadow-md p-4 md:p-6 border border-[#deb887]">
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-xl font-semibold text-[#8b4513]">プロフィール設定</h2>
                    </div>
                    <Input
                      label="表示名"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      placeholder="キャラクターが呼びかける名前"
                    />
                    <Input
                      label="小鳥の名前"
                      value={profileData.characterName}
                      onChange={(e) => setProfileData({ ...profileData, characterName: e.target.value })}
                      placeholder="例: ピヨちゃん"
                      maxLength={15}
                    />
                    <Input
                      label="メールアドレス"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] transition-colors text-sm"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        FaSave({ className: "w-4 h-4" })
                      )}
                      保存
                    </button>
                  </form>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-[#8b4513]">通知設定</h2>
                    </div>
                      <p className="text-[#7c5a2a] text-sm mt-2">
                        通知の種類と表示方法をカスタマイズできます
                      </p>
                    </div>

                    {/* 通知カテゴリ設定 */}
                    <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
                      <h3 className="text-lg font-medium text-[#8b4513] mb-3">通知カテゴリ</h3>
                    <form
                      onSubmit={e => { 
                        console.log('📝 フォーム送信開始');
                        e.preventDefault(); 
                        console.log('🔄 handleNotificationUpdate呼び出し');
                        handleNotificationUpdate(); 
                      }}
                        className="space-y-3"
                    >
                      {notificationCategories.map(cat => (
                        <div
                          key={cat.key}
                            className="flex items-center justify-between bg-[#faf8f0] border border-[#deb887]/50 rounded-lg px-4 py-3 shadow-sm hover:bg-[#f0e8d8] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {cat.icon({ className: 'w-5 h-5 text-[#8b4513]' })}
                            <div>
                              <div className="font-medium text-[#8b4513]">{cat.label}</div>
                              <div className="text-xs text-[#7c5a2a]">{cat.description}</div>
                            </div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!notificationSettings[cat.key]}
                              onChange={e => {
                                console.log(`🔄 トグル変更: ${cat.key} = ${e.target.checked}`);
                                console.log('📊 変更前の設定:', notificationSettings);
                                setNotificationSettings(ns => {
                                  const newSettings = { ...ns, [cat.key]: e.target.checked };
                                  console.log('📊 変更後の設定:', newSettings);
                                  return newSettings;
                                });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#deb887] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8b4513] rounded-full peer peer-checked:bg-[#8b4513] transition-colors relative">
                              <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notificationSettings[cat.key] ? 'translate-x-5' : ''}`}></div>
                            </div>
                          </label>
                        </div>
                      ))}
                      <button
                        type="submit"
                        disabled={isLoading}
                        onClick={() => console.log('🔘 保存ボタンクリック')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] transition-colors text-sm disabled:opacity-50 w-full sm:w-auto"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          FaSave({ className: "w-4 h-4" })
                        )}
                          {isLoading ? '保存中...' : '設定を保存'}
                      </button>
                    </form>
                    </div>
                  </div>
                )}

                {activeTab === 'subscription' && (
                  <div className="space-y-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-[#8b4513]">プレミアム管理</h2>
                    </div>
                    
                    {isPremium ? (
                      /* プレミアムユーザー向け表示 */
                      <div className="space-y-6">
                        {/* サブスクリプション管理 */}
                        <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-6">
                          <div className="flex items-center gap-2 mb-4">
                            {FaCreditCard({ className: "w-5 h-5 text-[#8b4513]" })}
                            <h3 className="text-lg font-semibold text-[#8b4513]">サブスクリプション管理</h3>
                          </div>
                          <p className="text-[#7c5a2a] mb-4 text-sm">
                            支払い方法の変更、解約、請求履歴の確認などができます。
                          </p>
                          <div className="space-y-4">
                            <button
                              onClick={async () => {
                                if (!user?.id) return;
                                setIsLoading(true);
                                try {
                                  console.log('🔗 Creating portal session...');
                                  const response = await fetch('/api/stripe/create-portal-session', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: user.id }),
                                  });
                                  
                                  if (!response.ok) {
                                    console.error('❌ Stripe API failed:', response.status);
                                    throw new Error('Failed to create portal session');
                                  }
                                  
                                  const { url } = await response.json();
                                  window.location.href = url;
                                } catch (error: any) {
                                  console.error('Portal session error:', error);
                                  alert('サブスクリプション管理ページを開けませんでした。\n\nエラー: ' + (error.message || '不明なエラー'));
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              disabled={isLoading}
                              className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] transition-colors text-sm disabled:opacity-50"
                            >
                              {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                FaCreditCard({ className: "w-4 h-4" })
                              )}
                              サブスクリプション管理
                            </button>
                            <div className="space-y-2">
                              <button
                                onClick={() => window.open('/lp?section=faq', '_blank')}
                                className="flex items-center gap-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors text-sm"
                              >
                                {FaQuestionCircle({ className: "w-4 h-4" })}
                                <span>プレミアム機能の活用方法</span>
                              </button>
                              <button
                                onClick={() => window.open('/terms', '_blank')}
                                className="flex items-center gap-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors text-sm"
                              >
                                {FaFileContract({ className: "w-4 h-4" })}
                                <span>利用規約・課金について</span>
                              </button>
                              <button
                                onClick={() => window.open('mailto:stepeasytasks@gmail.com?subject=プレミアム機能について')}
                                className="flex items-center gap-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors text-sm"
                              >
                                {FaInfoCircle({ className: "w-4 h-4" })}
                                <span>お問い合わせ・サポート</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 未登録ユーザー向け表示 */
                      <div className="space-y-6">
                        {/* プレミアム機能説明 */}
                        <div className="bg-gradient-to-br from-[#f5f5dc] to-[#f0f0e0] border border-[#deb887] rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            {FaCrown({ className: "w-6 h-6 text-[#8b4513]" })}
                            <h3 className="text-lg font-semibold text-[#8b4513]">プレミアム機能</h3>
                            <span className="bg-[#deb887] text-[#8b4513] px-2 py-1 rounded-full text-xs font-medium">
                              月額200円
                            </span>
                          </div>
                          
                          <p className="text-[#7c5a2a] mb-4">
                            習慣の記録を"人生の記憶"として残せます。無制限の習慣管理、高度な分析機能、データの永続保存が可能です。
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-2">
                              {FaHeart({ className: "w-4 h-4 text-[#7c5a2a]" })}
                              <span className="text-sm text-[#7c5a2a]">無制限の習慣管理</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {FaHeart({ className: "w-4 h-4 text-[#7c5a2a]" })}
                              <span className="text-sm text-[#7c5a2a]">データの永続保存</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {FaHeart({ className: "w-4 h-4 text-[#7c5a2a]" })}
                              <span className="text-sm text-[#7c5a2a]">高度な分析機能</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {FaHeart({ className: "w-4 h-4 text-[#7c5a2a]" })}
                              <span className="text-sm text-[#7c5a2a]">無制限のタスク作成</span>
                            </div>
                          </div>
                          
                          {/* 安心感を与えるバッジ・注釈 */}
                          <div className="bg-white/50 rounded-lg p-4 border border-[#deb887]/30">
                            <div className="flex items-center gap-2 mb-2">
                              {FaHeart({ className: "w-4 h-4 text-[#8b4513]" })}
                              <span className="text-sm font-medium text-[#8b4513]">安心してご利用いただけます</span>
                            </div>
                            <div className="space-y-2 text-xs text-[#7c5a2a]">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#7c5a2a] rounded-full"></span>
                                <span>7日間の無料体験期間付き</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#7c5a2a] rounded-full"></span>
                                <span>いつでも解約可能（次回課金日まで利用可能）</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#7c5a2a] rounded-full"></span>
                                <span>安全な決済システム（Stripe）を使用</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#7c5a2a] rounded-full"></span>
                                <span>支払い情報は当方では保存しません</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* プレミアム申込ボタン */}
                          <div className="mt-6 pt-4 border-t border-[#deb887]/30">
                            <button 
                              disabled
                              className="w-full px-4 py-3 bg-[#8b4513] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                            >
                              {FaCrown({ className: "w-4 h-4" })}
                              Coming Soon
                            </button>
                            <p className="text-xs text-[#8b4513] text-center mt-3">
                              7日間の無料体験期間付き・いつでも解約可能
                            </p>
                          </div>
                        </div>
                        
                        {/* FAQ・サポート */}
                        <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            {FaQuestionCircle({ className: "w-5 h-5 text-[#8b4513]" })}
                            <h3 className="text-lg font-semibold text-[#8b4513]">よくある質問</h3>
                          </div>
                          <div className="space-y-3 text-sm">
                            <button
                              onClick={() => window.open('/terms', '_blank')}
                              className="flex items-center gap-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors"
                            >
                              {FaFileContract({ className: "w-3 h-3" })}
                              <span>利用規約・課金について</span>
                            </button>
                            <button
                              onClick={() => window.open('mailto:stepeasytasks@gmail.com?subject=プレミアム機能について')}
                              className="flex items-center gap-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors"
                            >
                              {FaInfoCircle({ className: "w-3 h-3" })}
                              <span>お問い合わせ・サポート</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-[#8b4513]">セキュリティ</h2>

                    {/* 法的情報セクション */}
                    <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[#8b4513] mb-2">
                        法的情報
                      </h3>
                      <p className="text-[#7c5a2a] mb-4 text-sm">
                        プライバシーポリシーと利用規約をご確認いただけます。
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => window.open('/privacy', '_blank')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] transition-colors text-sm"
                        >
                          {FaShieldAlt({ className: "w-4 h-4" })}
                          プライバシーポリシー
                        </button>
                        <button
                          onClick={() => window.open('/terms', '_blank')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] transition-colors text-sm"
                        >
                          {FaFileContract({ className: "w-4 h-4" })}
                          利用規約
                        </button>
                      </div>
                    </div>

                    <hr className="my-8 border-[#deb887]" />

                    {/* ログアウトセクション */}
                    <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[#8b4513] mb-2">
                        アカウント管理
                      </h3>
                      <p className="text-[#7c5a2a] mb-4 text-sm">
                        アカウントからログアウトします。
                      </p>
                      <button
                        onClick={signOut}
                        className="flex items-center gap-2 px-4 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] transition-colors text-sm"
                      >
                        {FaSignOutAlt({ className: "w-4 h-4" })}
                        ログアウト
                      </button>
                    </div>

                    <hr className="my-8 border-[#deb887]" />

                    <div className="bg-[#f5f5dc] border border-[#deb887] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[#8b4513] mb-2">
                        危険な操作
                      </h3>
                      <p className="text-[#7c5a2a] mb-4">
                        アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消すことができません。
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#7c5a2a] text-white rounded-lg hover:bg-[#8b4513] transition-colors text-sm"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          FaTrash({ className: "w-4 h-4" })
                        )}
                        アカウントを削除
                      </button>
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