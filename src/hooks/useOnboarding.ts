import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface OnboardingProgress {
  id: string;
  userId: string;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  startTime: Date;
  completionTime: Date | null;
  isCompleted: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  planType: 'guest' | 'free' | 'premium';
}

interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  habitReminders: boolean;
  aiSuggestions: boolean;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  termsAgreed: boolean;
}

interface FeedbackData {
  userId: string;
  type: 'onboarding' | 'weekly' | 'monthly';
  overallRating: number;
  usabilityRating: number;
  functionalityRating: number;
  satisfactionRating: number;
  comments: string;
  suggestions: string[];
  wouldRecommend: boolean;
  favoriteFeature: string;
  improvementAreas: string[];
  timestamp: Date;
}

export const useOnboarding = (userId: string) => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'onboarding' | 'weekly' | 'monthly'>('onboarding');
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  // ユーザープロフィール情報の読み込み
  const loadUserProfile = async () => {
    if (!userId) {
      setIsProfileLoading(false);
      return;
    }

    console.log('👤 ユーザープロフィール情報を読み込み中...', { userId });
    setIsProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, plan_type')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('ユーザープロフィール読み込みエラー:', error);
        setIsProfileLoading(false);
        return;
      }

      const profile: UserProfile = {
        id: data.id,
        email: data.email,
        displayName: data.display_name || '',
        planType: data.plan_type || 'free'
      };

      setUserProfile(profile);
      console.log('✅ ユーザープロフィール読み込み完了:', profile);
    } catch (error) {
      console.error('ユーザープロフィール読み込みエラー:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // ユーザー設定の読み込み
  const loadUserSettings = async () => {
    if (!userId) {
      setIsSettingsLoading(false);
      return;
    }

    console.log('⚙️ ユーザー設定を読み込み中...', { userId });
    setIsSettingsLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('ユーザー設定読み込みエラー:', error);
        setIsSettingsLoading(false);
        return;
      }

      if (data) {
        const settings: UserSettings = {
          id: data.id,
          userId: data.user_id,
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          taskReminders: data.task_reminders,
          habitReminders: data.habit_reminders,
          aiSuggestions: data.ai_suggestions,
          theme: data.theme,
          fontSize: data.font_size,
          compactMode: data.compact_mode,
          termsAgreed: data.terms_agreed || false
        };

        setUserSettings(settings);
        console.log('✅ ユーザー設定読み込み完了:', settings);
      } else {
        // ユーザー設定が存在しない場合はデフォルト設定を作成
        await createDefaultUserSettings();
      }
    } catch (error) {
      console.error('ユーザー設定読み込みエラー:', error);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  // デフォルトユーザー設定の作成
  const createDefaultUserSettings = async () => {
    console.log('🆕 デフォルトユーザー設定を作成中...', { userId });

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          task_reminders: true,
          habit_reminders: true,
          ai_suggestions: true,
          theme: 'light',
          font_size: 'medium',
          compact_mode: false,
          terms_agreed: false
        })
        .select()
        .single();

      if (error) {
        console.error('デフォルトユーザー設定作成エラー:', error);
        return;
      }

      const settings: UserSettings = {
        id: data.id,
        userId: data.user_id,
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        taskReminders: data.task_reminders,
        habitReminders: data.habit_reminders,
        aiSuggestions: data.ai_suggestions,
        theme: data.theme,
        fontSize: data.font_size,
        compactMode: data.compact_mode,
        termsAgreed: data.terms_agreed || false
      };

      setUserSettings(settings);
      console.log('✅ デフォルトユーザー設定作成完了:', settings);
    } catch (error) {
      console.error('デフォルトユーザー設定作成エラー:', error);
    }
  };

  // 必須設定項目の完了確認（オンボーディング表示前）
  const checkRequiredSettings = (): boolean => {
    if (!userProfile || !userSettings) return false;

    // オンボーディング表示前の必須項目チェック
    // termsAgreedはオンボーディング内で設定されるため除外
    const requiredChecks = [
      userProfile.displayName.trim() !== '', // 表示名が設定されている
    ];

    const allRequiredCompleted = requiredChecks.every(check => check);
    
    console.log('🔍 オンボーディング表示前の必須設定項目チェック:', {
      displayName: userProfile.displayName,
      termsAgreed: userSettings.termsAgreed,
      allRequiredCompleted
    });

    return allRequiredCompleted;
  };

  // オンボーディング状態の初期化
  useEffect(() => {
    if (userId) {
      // 並行してユーザープロフィールと設定を読み込み
      loadUserProfile();
      loadUserSettings();
      loadOnboardingProgress();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  // 全データの読み込み完了を監視
  useEffect(() => {
    const allDataLoaded = !isProfileLoading && !isSettingsLoading && !isLoading;
    if (allDataLoaded) {
      console.log('📊 全データ読み込み完了');
    }
  }, [isProfileLoading, isSettingsLoading, isLoading]);

  // オンボーディング表示の自動制御（改善版）
  useEffect(() => {
    const allDataLoaded = !isProfileLoading && !isSettingsLoading && !isLoading;
    
    if (allDataLoaded && userProfile && userSettings && onboardingProgress) {
      const shouldShow = shouldShowOnboarding();
      
      console.log('🎯 オンボーディング表示判定:', {
        allDataLoaded,
        userProfileExists: !!userProfile,
        userSettingsExists: !!userSettings,
        onboardingProgressExists: !!onboardingProgress,
        shouldShow,
        isOnboardingOpen
      });

      if (shouldShow && !isOnboardingOpen) {
        console.log('🚀 オンボーディングを表示します');
        setIsOnboardingOpen(true);
      }
    }
  }, [isProfileLoading, isSettingsLoading, isLoading, userProfile, userSettings, onboardingProgress, isOnboardingOpen]);

  // オンボーディング進捗の読み込み
  const loadOnboardingProgress = async () => {
    console.log('🔍 オンボーディング進捗を読み込み中...', { userId });
    setIsLoading(true);

    try {
      // 複数レコードが存在する可能性を考慮して、最新の1件を取得
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('オンボーディング進捗読み込みエラー:', error);
        // エラーの場合は新規作成を試行
        await createOnboardingProgress();
        return;
      }

      if (data) {
        const progress: OnboardingProgress = {
          id: data.id,
          userId: data.user_id,
          currentStep: data.current_step || 0,
          completedSteps: data.completed_steps || [],
          skippedSteps: data.skipped_steps || [],
          startTime: new Date(data.start_time),
          completionTime: data.completion_time ? new Date(data.completion_time) : null,
          isCompleted: data.is_completed || false
        };

        setOnboardingProgress(progress);
        console.log('✅ オンボーディング進捗読み込み完了:', progress);

        // オンボーディング完了済みの場合、1日後フィードバックをチェック
        if (progress.isCompleted) {
          checkDailyFeedback(progress.completionTime);
        }

        // 重複レコードが存在する場合は古いレコードを削除
        await cleanupDuplicateRecords(userId, data.id);
      } else {
        // 新規ユーザーの場合、オンボーディング進捗を作成
        await createOnboardingProgress();
      }
    } catch (error) {
      console.error('オンボーディング進捗読み込みエラー:', error);
      // エラーの場合は新規作成を試行
      await createOnboardingProgress();
    } finally {
      setIsLoading(false);
    }
  };

  // 重複レコードのクリーンアップ
  const cleanupDuplicateRecords = async (userId: string, keepRecordId: string) => {
    try {
      const { data: duplicates, error } = await supabase
        .from('onboarding_progress')
        .select('id')
        .eq('user_id', userId)
        .neq('id', keepRecordId);

      if (error) {
        console.error('重複レコード確認エラー:', error);
        return;
      }

      if (duplicates && duplicates.length > 0) {
        console.log(`🗑️ 重複レコードを削除中: ${duplicates.length}件`);
        
        const { error: deleteError } = await supabase
          .from('onboarding_progress')
          .delete()
          .in('id', duplicates.map(d => d.id));

        if (deleteError) {
          console.error('重複レコード削除エラー:', deleteError);
        } else {
          console.log('✅ 重複レコード削除完了');
        }
      }
    } catch (error) {
      console.error('重複レコードクリーンアップエラー:', error);
    }
  };

  // 新規ユーザーのオンボーディング進捗作成
  const createOnboardingProgress = async () => {
    console.log('🆕 新規ユーザーのオンボーディング進捗を作成中...', { userId });

    try {
      // 既存のレコードがあるかチェック（重複作成を防ぐ）
      const { data: existingData, error: checkError } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error('既存レコード確認エラー:', checkError);
      }

      if (existingData) {
        // 既存レコードがある場合はそれを使用
        console.log('📋 既存のオンボーディング進捗を使用');
        const progress: OnboardingProgress = {
          id: existingData.id,
          userId: existingData.user_id,
          currentStep: existingData.current_step || 0,
          completedSteps: existingData.completed_steps || [],
          skippedSteps: existingData.skipped_steps || [],
          startTime: new Date(existingData.start_time),
          completionTime: existingData.completion_time ? new Date(existingData.completion_time) : null,
          isCompleted: existingData.is_completed || false
        };

        setOnboardingProgress(progress);
        console.log('✅ 既存オンボーディング進捗読み込み完了:', progress);
        return;
      }

      // 新規レコードを作成
      const { data, error } = await supabase
        .from('onboarding_progress')
        .insert({
          user_id: userId,
          current_step: 0,
          completed_steps: [],
          skipped_steps: [],
          start_time: new Date().toISOString(),
          is_completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('オンボーディング進捗作成エラー:', error);
        return;
      }

      const progress: OnboardingProgress = {
        id: data.id,
        userId: data.user_id,
        currentStep: data.current_step,
        completedSteps: data.completed_steps || [],
        skippedSteps: data.skipped_steps || [],
        startTime: new Date(data.start_time),
        completionTime: null,
        isCompleted: false
      };

      setOnboardingProgress(progress);
      console.log('✅ オンボーディング進捗作成完了:', progress);
    } catch (error) {
      console.error('オンボーディング進捗作成エラー:', error);
    }
  };

  // 1日後フィードバックのチェック
  const checkDailyFeedback = (completionTime: Date | null) => {
    if (!completionTime) return;

    const now = new Date();
    const timeDiff = now.getTime() - completionTime.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    console.log('📅 1日後フィードバックチェック:', {
      completionTime,
      now,
      daysDiff,
      shouldShow: daysDiff >= 1 && daysDiff < 2
    });

    // 1日後〜2日以内の場合にフィードバックを表示
    if (daysDiff >= 1 && daysDiff < 2) {
      // 既にフィードバックを送信済みかチェック
      checkExistingFeedback();
    }
  };

  // 既存フィードバックのチェック
  const checkExistingFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .eq('feedback_type', 'onboarding')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('フィードバック確認エラー:', error);
        return;
      }

      // フィードバックが未送信の場合のみ表示
      if (!data) {
        console.log('📝 1日後フィードバックを表示');
        setFeedbackType('onboarding');
        setIsFeedbackOpen(true);
      } else {
        console.log('✅ 既にフィードバックを送信済み');
      }
    } catch (error) {
      console.error('フィードバック確認エラー:', error);
    }
  };

  // オンボーディング完了
  const completeOnboarding = async () => {
    if (!onboardingProgress) return;

    try {
      const updatedProgress = {
        ...onboardingProgress,
        isCompleted: true,
        completionTime: new Date()
      };

      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          is_completed: true,
          completion_time: updatedProgress.completionTime.toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('オンボーディング完了エラー:', error);
        return;
      }

      setOnboardingProgress(updatedProgress);
      setIsOnboardingOpen(false);

      // オンボーディング完了直後のフィードバック表示を削除
      // 1日後に自動的にチェックされる
      console.log('✅ オンボーディング完了。1日後にフィードバックを表示予定');
    } catch (error) {
      console.error('オンボーディング完了エラー:', error);
    }
  };

  // オンボーディングスキップ
  const skipOnboarding = async () => {
    if (!onboardingProgress) return;

    try {
      const updatedProgress = {
        ...onboardingProgress,
        isCompleted: true,
        completionTime: new Date(),
        skippedSteps: [...onboardingProgress.skippedSteps, 'onboarding']
      };

      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          is_completed: true,
          completion_time: updatedProgress.completionTime.toISOString(),
          skipped_steps: updatedProgress.skippedSteps
        })
        .eq('user_id', userId);

      if (error) {
        console.error('オンボーディングスキップエラー:', error);
        return;
      }

      setOnboardingProgress(updatedProgress);
      setIsOnboardingOpen(false);
    } catch (error) {
      console.error('オンボーディングスキップエラー:', error);
    }
  };

  // フィードバック送信
  const submitFeedback = async (feedbackData: Omit<FeedbackData, 'userId' | 'timestamp'>) => {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          feedback_type: feedbackData.type,
          overall_rating: feedbackData.overallRating,
          usability_rating: feedbackData.usabilityRating,
          functionality_rating: feedbackData.functionalityRating,
          satisfaction_rating: feedbackData.satisfactionRating,
          comments: feedbackData.comments,
          suggestions: feedbackData.suggestions,
          would_recommend: feedbackData.wouldRecommend,
          favorite_feature: feedbackData.favoriteFeature,
          improvement_areas: feedbackData.improvementAreas,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('フィードバック送信エラー:', error);
        return false;
      }

      setIsFeedbackOpen(false);
      console.log('✅ フィードバック送信完了');
      return true;
    } catch (error) {
      console.error('フィードバック送信エラー:', error);
      return false;
    }
  };

  // 週次フィードバックの表示
  const showWeeklyFeedback = () => {
    setFeedbackType('weekly');
    setIsFeedbackOpen(true);
  };

  // 月次フィードバックの表示
  const showMonthlyFeedback = () => {
    setFeedbackType('monthly');
    setIsFeedbackOpen(true);
  };

  // オンボーディングが必要かどうかの判定（改善版）
  const shouldShowOnboarding = () => {
    // 全データの読み込みが完了していない場合は表示しない
    const allDataLoaded = !isProfileLoading && !isSettingsLoading && !isLoading;
    if (!allDataLoaded) {
      console.log('⏳ データ読み込み中、オンボーディング表示を待機');
      return false;
    }
    
    // ユーザープロフィールまたは設定が取得できていない場合は表示しない
    if (!userProfile || !userSettings) {
      console.log('❌ ユーザー情報が不完全、オンボーディング表示をスキップ');
      return false;
    }
    
    // オンボーディング進捗がない場合は新規ユーザーとして扱う
    if (!onboardingProgress) {
      console.log('🆕 新規ユーザーとしてオンボーディングを表示');
      return true;
    }
    
    // 必須設定項目が完了していない場合は表示しない
    const requiredSettingsCompleted = checkRequiredSettings();
    if (!requiredSettingsCompleted) {
      console.log('⚠️ 必須設定項目が未完了、オンボーディング表示を待機');
      return false;
    }
    
    // 完了していない場合のみ表示
    const shouldShow = !onboardingProgress.isCompleted;
    console.log('🤔 オンボーディング表示判定:', { 
      shouldShow, 
      onboardingProgress, 
      isCompleted: onboardingProgress?.isCompleted,
      allDataLoaded,
      requiredSettingsCompleted
    });
    return shouldShow;
  };

  // フィードバックが必要かどうかの判定
  const shouldShowFeedback = (type: 'weekly' | 'monthly') => {
    // 実装: 最後のフィードバックから一定期間経過しているかチェック
    return true; // 仮実装
  };

  // オンボーディング完了後の利用規約同意確認
  const checkTermsAgreementAfterOnboarding = (): boolean => {
    if (!userSettings) return false;
    
    const isAgreed = userSettings.termsAgreed === true;
    console.log('📋 オンボーディング完了後の利用規約同意確認:', {
      termsAgreed: userSettings.termsAgreed,
      isAgreed
    });
    
    return isAgreed;
  };

  return {
    // オンボーディング関連
    isOnboardingOpen,
    setIsOnboardingOpen,
    onboardingProgress,
    completeOnboarding,
    skipOnboarding,
    shouldShowOnboarding,
    isLoading: isLoading || isProfileLoading || isSettingsLoading,

    // ユーザー情報関連
    userProfile,
    userSettings,
    isProfileLoading,
    isSettingsLoading,
    checkRequiredSettings,
    checkTermsAgreementAfterOnboarding,

    // フィードバック関連
    isFeedbackOpen,
    setIsFeedbackOpen,
    feedbackType,
    submitFeedback,
    showWeeklyFeedback,
    showMonthlyFeedback,
    shouldShowFeedback
  };
}; 