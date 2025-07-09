import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


interface FeedbackData {
  overallRating: number;
  usabilityRating: number;
  functionalityRating: number;
  satisfactionRating: number;
  comments: string;
  suggestions: string[];
  wouldRecommend: boolean;
  favoriteFeature: string;
  improvementAreas: string[];
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackData) => void;
  type: 'onboarding' | 'weekly' | 'monthly';
}

const FEEDBACK_QUESTIONS = {
  onboarding: {
    title: 'StepEasyの1日目の体験はいかがでしたか？',
    subtitle: '実際に使ってみて感じたことをお聞かせください',
    questions: [
      {
        id: 'overall',
        label: '全体的な使いやすさ',
        description: 'StepEasyの使いやすさを評価してください'
      },
      {
        id: 'usability',
        label: '機能の分かりやすさ',
        description: '機能の説明は分かりやすかったですか？'
      },
      {
        id: 'satisfaction',
        label: '期待値との比較',
        description: '期待していた内容と比べてどうでしたか？'
      }
    ]
  },
  weekly: {
    title: '1週間の使用体験をお聞かせください',
    subtitle: 'あなたの声がStepEasyをより良くします',
    questions: [
      {
        id: 'overall',
        label: '全体的な満足度',
        description: 'StepEasyの使用体験はいかがでしたか？'
      },
      {
        id: 'usability',
        label: '使いやすさ',
        description: '日常的な使用で使いやすかったですか？'
      },
      {
        id: 'functionality',
        label: '機能の充実度',
        description: '必要な機能は揃っていましたか？'
      }
    ]
  },
  monthly: {
    title: '1ヶ月の使用体験を振り返って',
    subtitle: '長期間の使用を通じて感じたことをお聞かせください',
    questions: [
      {
        id: 'overall',
        label: '総合評価',
        description: 'StepEasyの総合的な評価をお聞かせください'
      },
      {
        id: 'usability',
        label: '継続的な使いやすさ',
        description: '長期間使用して使いやすさは維持されましたか？'
      },
      {
        id: 'functionality',
        label: '機能の価値',
        description: 'StepEasyの機能は価値がありましたか？'
      }
    ]
  }
};

const IMPROVEMENT_AREAS = [
  'タスク管理機能',
  '習慣管理機能',
  'AIサポート機能',
  '進捗分析機能',
  '時間管理機能',
  'UI/UXデザイン',
  'パフォーマンス',
  'その他'
];

const FAVORITE_FEATURES = [
  'タスクの作成・管理',
  '習慣タスクの継続',
  'AIキャラクターのサポート',
  '進捗の可視化',
  'ヒートマップ',
  '時間管理',
  'バッジシステム',
  'その他'
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    overallRating: 0,
    usabilityRating: 0,
    functionalityRating: 0,
    satisfactionRating: 0,
    comments: '',
    suggestions: [],
    wouldRecommend: false,
    favoriteFeature: '',
    improvementAreas: []
  });

  const questions = FEEDBACK_QUESTIONS[type].questions;
  const totalSteps = type === 'onboarding' ? 3 : 4;

  const handleRatingChange = (questionId: string, rating: number) => {
    setFeedbackData(prev => ({
      ...prev,
      [`${questionId}Rating`]: rating
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(feedbackData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSuggestionToggle = (suggestion: string) => {
    setFeedbackData(prev => ({
      ...prev,
      suggestions: prev.suggestions.includes(suggestion)
        ? prev.suggestions.filter(s => s !== suggestion)
        : [...prev.suggestions, suggestion]
    }));
  };

  const handleImprovementToggle = (area: string) => {
    setFeedbackData(prev => ({
      ...prev,
      improvementAreas: prev.improvementAreas.includes(area)
        ? prev.improvementAreas.filter(a => a !== area)
        : [...prev.improvementAreas, area]
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return feedbackData.overallRating > 0;
      case 1:
        return type === 'onboarding' ? feedbackData.usabilityRating > 0 : feedbackData.usabilityRating > 0;
      case 2:
        return type === 'onboarding' ? true : feedbackData.functionalityRating > 0;
      case 3:
        return type === 'onboarding' ? true : feedbackData.comments.trim().length > 0;
      default:
        return true;
    }
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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="relative p-6 pb-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
          
          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {FEEDBACK_QUESTIONS[type].title}
          </h2>
          <p className="text-sm text-gray-600">
            {FEEDBACK_QUESTIONS[type].subtitle}
          </p>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: 基本評価 */}
              {currentStep === 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {questions[0].label}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {questions[0].description}
                  </p>
                  
                  <div className="flex justify-center space-x-2 mb-6">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRatingChange('overall', rating)}
                        className={`p-3 rounded-lg transition-all ${
                          feedbackData.overallRating >= rating
                            ? 'text-yellow-400 bg-yellow-50'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-center text-sm text-gray-500">
                    {feedbackData.overallRating > 0 && (
                      <span>
                        {feedbackData.overallRating === 1 && 'とても悪い'}
                        {feedbackData.overallRating === 2 && '悪い'}
                        {feedbackData.overallRating === 3 && '普通'}
                        {feedbackData.overallRating === 4 && '良い'}
                        {feedbackData.overallRating === 5 && 'とても良い'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: 詳細評価 */}
              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {questions[1].label}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {questions[1].description}
                  </p>
                  
                  <div className="flex justify-center space-x-2 mb-6">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRatingChange('usability', rating)}
                        className={`p-3 rounded-lg transition-all ${
                          feedbackData.usabilityRating >= rating
                            ? 'text-yellow-400 bg-yellow-50'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: 機能評価（週次・月次のみ） */}
              {currentStep === 2 && type !== 'onboarding' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {questions[2].label}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {questions[2].description}
                  </p>
                  
                  <div className="flex justify-center space-x-2 mb-6">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRatingChange('functionality', rating)}
                        className={`p-3 rounded-lg transition-all ${
                          feedbackData.functionalityRating >= rating
                            ? 'text-yellow-400 bg-yellow-50'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: 詳細フィードバック */}
              {currentStep === (type === 'onboarding' ? 2 : 3) && (
                <div className="space-y-6">
                  {/* お気に入り機能 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      最も気に入った機能
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {FAVORITE_FEATURES.map((feature) => (
                        <button
                          key={feature}
                          onClick={() => setFeedbackData(prev => ({ ...prev, favoriteFeature: feature }))}
                          className={`p-3 rounded-lg border transition-all ${
                            feedbackData.favoriteFeature === feature
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 改善希望エリア */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      改善してほしい機能
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {IMPROVEMENT_AREAS.map((area) => (
                        <button
                          key={area}
                          onClick={() => handleImprovementToggle(area)}
                          className={`p-3 rounded-lg border transition-all ${
                            feedbackData.improvementAreas.includes(area)
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* コメント */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      その他のご意見・ご要望
                    </h3>
                    <textarea
                      value={feedbackData.comments}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                      placeholder="StepEasyについて感じたこと、改善してほしい点など、自由にお聞かせください。"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  {/* 推薦意向 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      友人にStepEasyを推薦したいですか？
                    </h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setFeedbackData(prev => ({ ...prev, wouldRecommend: true }))}
                        className={`flex-1 p-4 rounded-lg border transition-all ${
                          feedbackData.wouldRecommend
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        ❤️
                        はい
                      </button>
                      <button
                        onClick={() => setFeedbackData(prev => ({ ...prev, wouldRecommend: false }))}
                        className={`flex-1 p-4 rounded-lg border transition-all ${
                          feedbackData.wouldRecommend === false
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        ✕
                        いいえ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ナビゲーション */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              前へ
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === totalSteps - 1 ? '送信' : '次へ'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}; 