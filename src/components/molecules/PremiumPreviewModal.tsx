import React from 'react';
import { FaTimes, FaChartLine, FaRobot, FaStar, FaBrain, FaHeart, FaCalendarAlt, FaDatabase, FaChartBar, FaFire, FaBell, FaArchive, FaClock } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

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
  const { isGuest } = useAuth();
  
  if (!isOpen) return null;

  // ゲストユーザー向け機能（アカウント登録で解放される機能）
  const guestFeatures = [
    {
      icon: FaChartBar,
      title: '📊 進捗分析',
      description: '日々の達成状況をグラフで可視化し、成長を実感できます',
      preview: '今週の達成率: 75%\n完了タスク: 12個\n継続日数: 8日間'
    },
    {
      icon: FaFire,
      title: '🔥 習慣管理',
      description: '継続したい習慣を3個まで管理し、ストリークを記録',
      preview: '読書習慣: 15日継続中\n運動習慣: 8日継続中\n学習習慣: 新規開始'
    },
    {
      icon: FaDatabase,
      title: '💾 データ保存',
      description: 'タスクと進捗を永続的に保存し、いつでも確認可能',
      preview: '30日間のデータを安全に保存\nブラウザを閉じてもデータ維持\n複数デバイスで同期'
    },
    {
      icon: FaChartLine,
      title: '📈 統計機能',
      description: '詳細な統計とヒートマップで行動パターンを分析',
      preview: '月間統計・週間分析\nカテゴリ別達成率\n時間帯別パフォーマンス'
    },
    {
      icon: FaClock,
      title: '⏰ 期限設定',
      description: 'タスクに開始日・期限日を設定して計画的な管理',
      preview: '開始日・期限日の設定\n14日先までの計画\n過去日からの編集'
    },
    {
      icon: FaArchive,
      title: '📁 アーカイブ',
      description: '完了したタスクを整理・保存して達成記録を残す',
      preview: '過去の達成記録を確認\n完了タスクの検索\n達成感の振り返り'
    }
  ];

  // プレミアム機能（無料ユーザー向け）
  const premiumFeatures = [
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

  const features = isGuest ? guestFeatures : premiumFeatures;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isGuest ? '✨ StepEasy アカウント機能 プレビュー' : '✨ StepEasy Premium プレビュー'}
              </h2>
              <p className="text-gray-600 mt-1">
                {isGuest 
                  ? 'アカウント登録で利用できる機能をご紹介します'
                  : 'あなた専属のAIコーチが、より深い分析とサポートを提供します'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {FaTimes({className:"w-5 h-5 text-gray-500"})}
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

          {/* 開発進捗 / 機能説明 */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            {isGuest ? (
              <>
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  ✅ 今すぐ利用可能な機能
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">データ保存機能</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-blue-200 rounded-full h-2">
                        <div className="w-full bg-green-600 h-2 rounded-full"></div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">利用可能</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">進捗分析・統計</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-blue-200 rounded-full h-2">
                        <div className="w-full bg-green-600 h-2 rounded-full"></div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">利用可能</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">習慣管理（3個まで）</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-blue-200 rounded-full h-2">
                        <div className="w-full bg-green-600 h-2 rounded-full"></div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">利用可能</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* アクション */}
          <div className="text-center">
            {isGuest ? (
              <>
                <button
                  onClick={() => window.location.href = '/register'}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105"
                >
                  🚀 アカウント登録で利用開始
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  登録は無料です。現在の進捗は引き継がれます
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={onNotificationSignup}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  🔔 リリース通知を受け取る
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  ベータ版リリース時に優先的にご案内いたします
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 