import React from 'react';
import { FaTimes, FaChartLine, FaRobot, FaStar, FaBrain, FaHeart, FaCalendarAlt } from 'react-icons/fa';

interface PremiumPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationSignup?: () => void;
}

export const PremiumPreviewModal: React.FC<PremiumPreviewModalProps> = ({
  isOpen,
  onClose,
  onNotificationSignup
}) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: FaChartLine,
      title: '📊 週次・月次レポート',
      description: 'あなたの行動パターンを詳細に分析し、成長の軌跡を可視化します',
      preview: '今週の達成率: 85% (先週比 +12%)\n最高パフォーマンス: 水曜日の午前\n改善ポイント: 木曜日の集中力向上'
    },
    {
      icon: FaRobot,
      title: '🤖 AI専属コーチ',
      description: 'あなたの性格やパターンを学習し、最適なタイミングでアドバイスを提供',
      preview: '田中さんは朝型集中タイプですね。今日は9-11時に重要タスクを配置してみては？'
    },
    {
      icon: FaBrain,
      title: '🧠 行動パターン分析',
      description: '時間帯別の効率性や曜日別パフォーマンスを科学的に分析',
      preview: 'あなたの黄金時間: 火曜日 9:00-11:00\n集中力が高い日: 月・水・金\n要注意時間: 木曜日午後'
    },
    {
      icon: FaStar,
      title: '⭐ 成長予測',
      description: '過去のデータから未来のパフォーマンスを予測し、目標達成をサポート',
      preview: '来週の予測達成率: 82%\nチャンス日: 火曜日\n注意日: 木曜日'
    },
    {
      icon: FaHeart,
      title: '💝 感情サポート',
      description: 'メモから感情を読み取り、心理状態に寄り添ったメッセージを提供',
      preview: '今日は少し疲れているようですね。無理せず軽めのタスクから始めましょう'
    },
    {
      icon: FaCalendarAlt,
      title: '📅 習慣最適化',
      description: '個人の生活パターンに合わせた最適な習慣を提案し、継続をサポート',
      preview: 'あなたには「朝の読書習慣」がおすすめです。9時からの15分間はいかがですか？'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                ✨ StepEasy Premium プレビュー
              </h2>
              <p className="text-gray-600 mt-1">
                あなた専属のAIコーチが、より深い分析とサポートを提供します
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {FaTimes ({className:"w-5 h-5 text-gray-500"})}
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* 機能一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    {feature.icon ({className:"w-5 h-5 text-blue-600"})}
                  </div>
                  <h3 className="font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {feature.description}
                </p>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">プレビュー例:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {feature.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 開発進捗 */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              🚀 開発進捗状況
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">データ分析エンジン</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-blue-200 rounded-full h-2">
                    <div className="w-4/5 bg-blue-600 h-2 rounded-full"></div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">80%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">AIメッセージ強化</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-blue-200 rounded-full h-2">
                    <div className="w-3/5 bg-blue-600 h-2 rounded-full"></div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">60%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">レポート機能</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-blue-200 rounded-full h-2">
                    <div className="w-2/5 bg-blue-600 h-2 rounded-full"></div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">40%</span>
                </div>
              </div>
            </div>
          </div>

          {/* アクション */}
          <div className="text-center">
            <button
              onClick={onNotificationSignup}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              🔔 リリース通知を受け取る
            </button>
            <p className="text-sm text-gray-500 mt-3">
              ベータ版リリース時に優先的にご案内いたします
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 