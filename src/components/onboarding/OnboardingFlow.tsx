import React, { useState, useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  animation: any;
  animationType?: 'lottie' | 'icon' | 'gradient' | 'logo';
  icon?: string;
  gradient?: string;
  interaction?: {
    type: 'button' | 'input' | 'select' | 'complete' | 'goal' | 'habit' | 'time' | 'emotion' | 'message' | 'preview' | 'terms' | 'tasks-habits' | 'execution-log' | 'progress-archive' | 'ai-message';
    label?: string;
    placeholder?: string;
    options?: string[];
    goalOptions?: { value: string; label: string; description: string }[];
    habitOptions?: { value: string; label: string; description: string }[];
    timeOptions?: { value: number; label: string; description: string }[];
    emotionOptions?: { value: string; label: string; icon: string; color: string }[];
  };
  skipable: boolean;
  required: boolean;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

// アニメーション設定
const ANIMATIONS = {
  welcome: {
    type: 'logo' as const,
    icon: 'logo',
    gradient: 'from-[#deb887] to-[#f5e6d3]'
  },
  goal: {
    type: 'icon' as const,
    icon: '○',
    gradient: 'from-[#f5e6d3] to-[#deb887]'
  },
  task: {
    type: 'icon' as const,
    icon: '○',
    gradient: 'from-[#deb887] to-[#d4a574]'
  },
  habit: {
    type: 'icon' as const,
    icon: '○',
    gradient: 'from-[#d4a574] to-[#c19a6b]'
  },
  time: {
    type: 'icon' as const,
    icon: '○',
    gradient: 'from-[#c19a6b] to-[#b08968]'
  },
  emotion: {
    type: 'icon' as const,
    icon: '○',
    gradient: 'from-[#b08968] to-[#a67c52]'
  },
  ai: {
    type: 'icon' as const,
    icon: '○',
    gradient: 'from-[#a67c52] to-[#8b4513]'
  },
  growth: {
    type: 'icon' as const,
    icon: '○',
    gradient: 'from-[#8b4513] to-[#7c5a2a]'
  }
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'StepEasyへようこそ',
    description: 'AIと心理学の力で「継続できる自分」を育てるタスク管理アプリです。',
    animation: null,
    animationType: 'icon',
    icon: 'logo',
    gradient: 'from-[#deb887] to-[#f5e6d3]',
    skipable: true,
    required: false
  },
  {
    id: 'goal',
    title: 'あなたの目標を教えてください',
    description: '達成したい目標や身につけたい習慣を教えてください。',
    animation: null,
    animationType: 'icon',
    icon: '○',
    gradient: 'from-[#f5e6d3] to-[#deb887]',
    interaction: {
      type: 'goal',
      label: '目標を選択してください',
      goalOptions: [
        { value: 'health', label: '健康習慣を身につけたい', description: '運動、食事、睡眠など、健康的な生活習慣を整えたい' },
        { value: 'work', label: '仕事の効率を上げたい', description: '時間管理やタスク整理で、より効率的に仕事を進めたい' },
        { value: 'learning', label: '新しいスキルを習得したい', description: '語学、プログラミング、資格など、新しい知識やスキルを身につけたい' },
        { value: 'life', label: '生活を整理したい', description: '片付け、家事、お金の管理など、日常生活をより快適にしたい' },
        { value: 'custom', label: 'その他の目標', description: '上記以外の目標があります' }
      ]
    },
    skipable: false,
    required: true
  },
  {
    id: 'tasks-habits',
    title: 'タスクと習慣の管理',
    description: '通常のタスクと継続したい習慣を分けて管理できます。',
    animation: null,
    animationType: 'icon',
    icon: '○',
    gradient: 'from-[#deb887] to-[#d4a574]',
    interaction: {
      type: 'tasks-habits'
    },
    skipable: true,
    required: false
  },
  {
    id: 'execution-log',
    title: '実行ログと感情記録',
    description: 'タスクの実行時間と感情を記録できます。',
    animation: null,
    animationType: 'icon',
    icon: '○',
    gradient: 'from-[#d4a574] to-[#c19a6b]',
    interaction: {
      type: 'execution-log'
    },
    skipable: true,
    required: false
  },
  {
    id: 'progress-archive',
    title: '進捗とアーカイブ',
    description: 'ヒートマップで進捗を可視化し、完了したタスクは自動でアーカイブされます。',
    animation: null,
    animationType: 'icon',
    icon: '○',
    gradient: 'from-[#c19a6b] to-[#b08968]',
    interaction: {
      type: 'progress-archive'
    },
    skipable: true,
    required: false
  },
  {
    id: 'ai-message',
    title: 'AIメッセージ機能',
    description: '毎朝9時に、あなたの状況を分析したメッセージをお届けします。',
    animation: null,
    animationType: 'icon',
    icon: '○',
    gradient: 'from-[#b08968] to-[#a67c52]',
    interaction: {
      type: 'ai-message'
    },
    skipable: true,
    required: false
  },
  {
    id: 'emotion',
    title: '今の気持ちを記録',
    description: '朝・昼・晩の時間帯ごとに、今の気持ちを記録できます。',
    animation: null,
    animationType: 'icon',
    icon: '○',
    gradient: 'from-[#a67c52] to-[#8b4513]',
    interaction: {
      type: 'emotion',
      label: '今の気持ちは？',
      emotionOptions: [
        { value: 'joy', label: '達成', icon: '✓', color: '[#8b4513]' },
        { value: 'sadness', label: '挫折', icon: '×', color: '[#7c5a2a]' },
        { value: 'anger', label: 'イライラ', icon: '!', color: '[#a67c52]' },
        { value: 'surprise', label: '驚き', icon: '★', color: '[#b08968]' },
        { value: 'fear', label: '不安', icon: '?', color: '[#c19a6b]' },
        { value: 'calm', label: '平穏', icon: '○', color: '[#d4a574]' }
      ]
    },
    skipable: false,
    required: true
  },
  {
    id: 'terms',
    title: '利用規約への同意',
    description: '利用規約とプライバシーポリシーへの同意が必要です。',
    animation: null,
    animationType: 'icon',
    icon: '○',
    gradient: 'from-[#8b4513] to-[#7c5a2a]',
    interaction: {
      type: 'terms'
    },
    skipable: false,
    required: true
  }
];

export default function OnboardingFlow({ isOpen, onClose, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSkipOption, setShowSkipOption] = useState(false);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  // カスタム目標入力の表示判定
  const showCustomGoalInput = selectedGoal === 'custom';

  const handleNext = async () => {
    if (currentStep === ONBOARDING_STEPS.length - 1) {
      // オンボーディング完了時の処理
      await handleOnboardingComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // 利用規約同意画面（terms）へジャンプ
    const termsStepIndex = ONBOARDING_STEPS.findIndex(step => step.id === 'terms');
    setCurrentStep(termsStepIndex);
  };

  const handleInteraction = () => {
    // タスク完了の処理
    handleNext();
  };

  const isInteractionValid = () => {
    const step = currentStepData;
    if (!step.interaction) return true;

    switch (step.interaction.type) {
      case 'goal':
        return selectedGoal !== '' && (selectedGoal !== 'custom' || customGoal.trim() !== '');
      case 'input':
        return userInput.trim() !== '';
      case 'habit':
        return selectedHabit !== '';
      case 'time':
        return selectedTime > 0;
      case 'emotion':
        return selectedEmotion !== '';
      case 'terms':
        return termsAgreed;
      case 'tasks-habits':
      case 'execution-log':
      case 'progress-archive':
      case 'ai-message':
      case 'message':
      case 'preview':
        return true; // 説明のみのステップは常に有効
      default:
        return true;
    }
  };

  const getPersonalizedMessage = () => {
    const goalMessages = {
      health: '健康は人生の基盤です。小さな一歩から始めて、健康的な習慣を身につけていきましょう。今日も素晴らしい一日になりますように！',
      work: '効率的な仕事は、整理された心から始まります。一つずつタスクを片付けて、充実した一日にしましょう。',
      learning: '新しい知識は、あなたの世界を広げます。継続は力なり。今日も素晴らしい学びの時間を過ごしましょう。',
      life: '整理された生活は、心の余裕を生み出します。小さな改善が大きな変化につながります。',
      custom: customGoal ? `「${customGoal}」という素晴らしい目標ですね。一歩ずつ、確実に進んでいきましょう。` : 'あなたの目標に向かって、一緒に頑張りましょう。'
    };

    return goalMessages[selectedGoal as keyof typeof goalMessages] || '今日も素晴らしい一日になりますように！';
  };

    const handleOnboardingComplete = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザー情報が取得できません');
      }

      // 目標をデータベースに保存
      if (selectedGoal) {
        const goalText = selectedGoal === 'custom' ? customGoal : ONBOARDING_STEPS[1].interaction?.goalOptions?.find(opt => opt.value === selectedGoal)?.label || '';
        
        const { error } = await supabase
          .from('user_goals')
          .insert({
            goal_text: goalText,
            goal_type: selectedGoal
          });

        if (error) {
          console.error('Error saving goal:', error);
        }
      }

      // 利用規約同意をユーザー設定に保存（必須）
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          terms_agreed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (settingsError) {
        console.error('Error saving terms agreement:', settingsError);
        throw new Error('利用規約同意の保存に失敗しました');
      }

      console.log('✅ 利用規約同意を保存しました');

      // オンボーディング進捗を完了に更新（重要）
      const { error: progressError } = await supabase
        .from('onboarding_progress')
        .update({
          is_completed: true,
          completion_time: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (progressError) {
        console.error('Error updating onboarding progress:', progressError);
        throw new Error('オンボーディング進捗の更新に失敗しました');
      }

      console.log('✅ オンボーディング進捗を完了に更新しました');

      // 初回感情記録を保存（時間帯を自動判定）
      if (selectedEmotion) {
        const getCurrentTimePeriod = (): 'morning' | 'afternoon' | 'evening' => {
          const now = new Date();
          const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
          const hour = japanTime.getHours();
          
          if (hour >= 6 && hour < 12) return 'morning';
          if (hour >= 12 && hour < 18) return 'afternoon';
          return 'evening';
        };

        const currentTimePeriod = getCurrentTimePeriod();
        
        const { error: emotionError } = await supabase
          .from('emotions')
          .insert({
            user_id: user.id,
            emotion_type: selectedEmotion,
            time_period: currentTimePeriod,
            intensity: 3, // デフォルト値
            note: 'オンボーディング完了時の初回記録'
          });

        if (emotionError) {
          console.error('Error saving initial emotion:', emotionError);
        } else {
          console.log('✅ 初回感情記録を保存しました:', { emotion: selectedEmotion, timePeriod: currentTimePeriod });
        }
      }

      // オンボーディング完了をコールバックで通知
      if (onComplete) {
        onComplete();
      }
      
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderHeaderLogo = () => (
    <img src="/logo.png" alt="StepEasy" className="w-12 h-12 rounded-xl bg-white object-contain shadow-lg" />
  );

  const renderAnimation = () => {
    if (currentStepData.id === 'welcome') {
      return (
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="StepEasy" className="w-24 h-24 object-contain mx-auto" />
        </div>
      );
    }
    if (currentStepData.animationType === 'icon' && currentStepData.icon) {
      return (
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl"
        >
          {currentStepData.icon}
        </motion.div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${currentStepData.gradient})`
        }}
      >
        {/* ヘッダー */}
        <div className="relative p-6 border-b border-[#d4a574]/50 bg-gradient-to-r from-[#f5e6d3] to-[#deb887]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {renderHeaderLogo()}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#8b4513] rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] bg-clip-text text-transparent">
                  StepEasy
                </h1>
                <p className="text-sm text-[#7c5a2a] font-medium">新しい体験を始めましょう</p>
              </div>
            </div>
            
            {/* スキップオプション */}
            {currentStepData.skipable && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={showSkipOption}
                  onChange={(e) => setShowSkipOption(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="font-medium">スキップ</span>
              </label>
            )}
          </div>
          
          {/* プログレスインジケーター */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#7c5a2a] mb-1">
              <span className="font-medium">ステップ {currentStep + 1} / {ONBOARDING_STEPS.length}</span>
              <span className="font-medium">{Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full bg-[#d4a574] rounded-full h-1.5">
              <motion.div
                className="bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-[#8b4513] mb-3">
                  {currentStepData.title}
                </h2>
                <p className="text-[#7c5a2a] mb-6 leading-relaxed text-xs">
                  {currentStepData.description}
                </p>

                {/* インタラクション */}
                {currentStepData.interaction && (
                  <div className="mb-6">
                    {/* 目標選択 */}
                    {currentStepData.interaction.type === 'goal' && (
                      <div>
                        <label className="block text-sm font-medium text-[#8b4513] mb-4">
                          {currentStepData.interaction.label}
                        </label>
                        <div className="grid grid-cols-1 gap-3 mb-4">
                          {currentStepData.interaction.goalOptions?.map((option) => (
                            <motion.button
                              key={option.value}
                              onClick={() => setSelectedGoal(option.value)}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`w-full p-3 text-left rounded-lg border transition-all ${
                                selectedGoal === option.value
                                  ? 'border-[#8b4513] bg-[#f5e6d3] text-[#8b4513] shadow-sm'
                                  : 'border-[#d4a574] hover:border-[#c19a6b] hover:shadow-sm'
                              }`}
                            >
                              <div className="font-medium text-sm mb-1">{option.label}</div>
                              <div className="text-xs text-[#7c5a2a] leading-relaxed">{option.description}</div>
                            </motion.button>
                          ))}
                        </div>
                        
                        {/* カスタム目標入力 */}
                        {showCustomGoalInput && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              あなたの目標を教えてください
                            </label>
                            <input
                              type="text"
                              value={customGoal}
                              onChange={(e) => setCustomGoal(e.target.value)}
                              placeholder="例：新しい趣味を始めたい、人間関係を改善したい..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              具体的な目標を入力してください
                            </p>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* タスク入力 */}
                    {currentStepData.interaction.type === 'input' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {currentStepData.interaction.label}
                        </label>
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder={currentStepData.interaction.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2">5分でできることから始めるのがコツです</p>
                      </div>
                    )}

                    {/* 習慣設定 */}
                    {currentStepData.interaction.type === 'habit' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          {currentStepData.interaction.label}
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                          {currentStepData.interaction.habitOptions?.map((option) => (
                            <motion.button
                              key={option.value}
                              onClick={() => setSelectedHabit(option.value)}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`w-full p-3 text-left rounded-lg border transition-all ${
                                selectedHabit === option.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="font-medium text-base mb-1">{option.label}</div>
                              <div className="text-xs text-gray-600 leading-relaxed">{option.description}</div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 時間設定 */}
                    {currentStepData.interaction.type === 'time' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          {currentStepData.interaction.label}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {currentStepData.interaction.timeOptions?.map((option) => (
                            <motion.button
                              key={option.value}
                              onClick={() => setSelectedTime(option.value)}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`p-3 rounded-lg border transition-all ${
                                selectedTime === option.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="font-medium text-base mb-1">{option.label}</div>
                              <div className="text-xs text-gray-600 leading-relaxed">{option.description}</div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 感情選択 */}
                    {currentStepData.interaction.type === 'emotion' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          {currentStepData.interaction.label}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {currentStepData.interaction.emotionOptions?.map((option) => (
                            <motion.button
                              key={option.value}
                              onClick={() => setSelectedEmotion(option.value)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedEmotion === option.value
                                  ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700 shadow-sm`
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                              }`}
                            >
                              <div className={`text-2xl mb-2 font-bold ${selectedEmotion === option.value ? `text-${option.color}-600` : 'text-gray-600'}`}>
                                {option.icon}
                              </div>
                              <div className="text-xs font-medium">{option.label}</div>
                            </motion.button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">朝・昼・晩の時間帯ごとに記録できます。正直な気持ちが成長のヒントになります</p>
                      </div>
                    )}

                    {/* AIメッセージ体験 */}
                    {currentStepData.interaction.type === 'message' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-[#f5e6d3]/95 to-[#deb887]/95 backdrop-blur-md rounded-2xl border border-[#d4a574]/50 shadow-2xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-[#8b4513] flex items-center justify-center text-white text-sm font-bold">
                              AI
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-[#7c5a2a] leading-relaxed">
                              {getPersonalizedMessage()}
                            </p>
                            <p className="text-xs text-[#a67c52] mt-2">
                              このようなメッセージが、あなたのタスク状況や時間帯に応じて届きます
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* タスクと習慣の管理説明 */}
                    {currentStepData.interaction.type === 'tasks-habits' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-br from-[#f5e6d3] to-[#deb887] rounded-lg p-4 border border-[#d4a574]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">通常タスク</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            一度だけ完了すれば良いタスクです。期限を設定して、効率的に管理できます。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#deb887] to-[#d4a574] rounded-lg p-4 border border-[#c19a6b]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">習慣タスク</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            継続したい習慣を設定できます。毎日・週1回・月1回の頻度で、自動的に継続日数を記録します。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#d4a574] to-[#c19a6b] rounded-lg p-4 border border-[#b08968]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">継続日数管理</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            習慣の継続日数が自動で記録され、あなたの成長が可視化されます。
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* 実行ログと感情記録説明 */}
                    {currentStepData.interaction.type === 'execution-log' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-br from-[#f5e6d3] to-[#deb887] rounded-lg p-4 border border-[#d4a574]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">実行時間記録</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            タスクの実行時間を記録できます。予想時間と実際の時間を比較して、効率化のヒントにします。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#deb887] to-[#d4a574] rounded-lg p-4 border border-[#c19a6b]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">感情記録</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            朝・昼・晩の時間帯ごとに感情を記録。あなたの気持ちの変化を追跡して、継続のモチベーションにします。
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* 進捗とアーカイブ説明 */}
                    {currentStepData.interaction.type === 'progress-archive' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-br from-[#f5e6d3] to-[#deb887] rounded-lg p-4 border border-[#d4a574]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">ヒートマップ</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            カレンダー形式で進捗を可視化。毎日の活動が色で表示され、継続パターンが一目で分かります。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#deb887] to-[#d4a574] rounded-lg p-4 border border-[#c19a6b]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">統計データ</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            完了率、平均時間、継続日数などの統計を表示。あなたの成長を数値で確認できます。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#d4a574] to-[#c19a6b] rounded-lg p-4 border border-[#b08968]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">自動アーカイブ</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            完了したタスクは自動でアーカイブされます。過去の努力が形として残り、振り返りに活用できます。
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* AIメッセージ説明 */}
                    {currentStepData.interaction.type === 'ai-message' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-br from-[#f5e6d3] to-[#deb887] rounded-lg p-4 border border-[#d4a574]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">AIメッセージ</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            AIがあなたの成長を見守り、励ましてくれます。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#deb887] to-[#d4a574] rounded-lg p-4 border border-[#c19a6b]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">毎朝9時配信</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            毎朝9時に、あなたのタスク状況や感情記録を分析したパーソナライズされたメッセージをお届けします。
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#d4a574] to-[#c19a6b] rounded-lg p-4 border border-[#b08968]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513]">AI分析</h3>
                          </div>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            あなたの継続パターンや感情の変化を分析し、最適な励ましの言葉を選んでくれます。
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* プレビュー */}
                    {currentStepData.interaction.type === 'preview' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-[#f5e6d3] to-[#deb887] rounded-lg p-4 border border-[#d4a574]"
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-3 text-[#8b4513]">○</div>
                          <h3 className="font-medium text-[#8b4513] mb-2">成長の可視化</h3>
                          <p className="text-xs text-[#7c5a2a] leading-relaxed">
                            あなたの努力がグラフや統計で可視化され、継続のモチベーションになります。
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* 利用規約同意 */}
                    {currentStepData.interaction.type === 'terms' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-[#f5e6d3] to-[#deb887] rounded-lg p-6 border border-[#d4a574]"
                      >
                        <div className="space-y-4">
                          <div className="text-center mb-4">
                            <div className="text-3xl mb-3 text-[#8b4513]">○</div>
                            <h3 className="font-medium text-[#8b4513] mb-2">利用規約への同意</h3>
                            <p className="text-xs text-[#7c5a2a] leading-relaxed">
                              StepEasyをご利用いただくには、以下の規約への同意が必要です。
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={termsAgreed}
                                onChange={(e) => setTermsAgreed(e.target.checked)}
                                className="mt-1 w-5 h-5 text-[#8b4513] border-[#d4a574] rounded focus:ring-[#8b4513] focus:ring-2"
                              />
                              <div className="text-sm">
                                <span className="text-[#7c5a2a]">
                                  <a 
                                    href="/terms" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#8b4513] hover:text-[#7c5a2a] underline font-medium"
                                  >
                                    利用規約
                                  </a>
                                  と
                                  <a 
                                    href="/privacy" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#8b4513] hover:text-[#7c5a2a] underline font-medium"
                                  >
                                    プライバシーポリシー
                                  </a>
                                  を読み、同意します
                                </span>
                                <p className="text-xs text-[#a67c52] mt-1">
                                  規約の内容を必ずお読みください。同意いただけない場合は、アプリをご利用いただけません。
                                </p>
                              </div>
                            </label>
                          </div>
                          
                          <div className="bg-[#f5e6d3] rounded-lg p-4 border border-[#d4a574]">
                            <h4 className="font-medium text-[#8b4513] mb-2 text-sm">主な内容</h4>
                            <ul className="text-xs text-[#7c5a2a] space-y-1">
                              <li>• 個人情報の適切な取り扱いと保護</li>
                              <li>• サービスの利用に関する責任と制限</li>
                              <li>• 知的財産権に関する取り決め</li>
                              <li>• サービスの変更・終了に関する事項</li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* アニメーション */}
                {!currentStepData.interaction && (
                  <div className="flex justify-center mb-6">
                    {renderAnimation()}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-[#d4a574]/50 bg-[#f5e6d3]">
          {/* ボタン */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all ${
                currentStep === 0
                  ? 'text-[#a67c52] cursor-not-allowed'
                  : 'text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#deb887] border border-[#d4a574] hover:border-[#c19a6b]'
              }`}
            >
              ← 戻る
            </button>

            <div className="flex gap-3">
              {showSkipOption && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-sm font-medium text-[#7c5a2a] hover:text-[#8b4513] hover:bg-[#deb887] border border-[#d4a574] hover:border-[#c19a6b] rounded-xl transition-all"
                >
                  スキップ
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={!isInteractionValid() || isSaving}
                className={`px-8 py-3 text-sm font-medium rounded-xl transition-all ${
                  isInteractionValid() && !isSaving
                    ? 'bg-gradient-to-r from-[#8b4513] to-[#7c5a2a] text-white hover:from-[#7c5a2a] hover:to-[#8b4513] shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-[#d4a574] text-[#a67c52] cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    保存中...
                  </div>
                ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
                  '完了'
                ) : (
                  '次へ →'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 