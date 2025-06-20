import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaSearch, FaFire, FaClock, FaChartBar, FaQuestionCircle } from 'react-icons/fa';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  defaultTab = 'streak'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // 検索機能
  const filterContent = (content: any[], query: string) => {
    if (!query) return content;
    return content.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(query.toLowerCase());
      const descriptionMatch = item.description?.toLowerCase().includes(query.toLowerCase());
      
      // JSXコンテンツの場合、検索用テキストを用意
      let searchableText = '';
      if (item.searchText) {
        searchableText = item.searchText.toLowerCase();
      } else if (typeof item.content === 'string') {
        searchableText = item.content.toLowerCase();
      }
      
      const contentMatch = searchableText.includes(query.toLowerCase());
      
      return titleMatch || descriptionMatch || contentMatch;
    });
  };

  // タブ定義
  const tabs = [
    {
      id: 'streak',
      label: 'ストリーク',
      icon: FaFire,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'tasks',
      label: 'タスク',
      icon: FaClock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'stats',
      label: '統計',
      icon: FaChartBar,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: FaQuestionCircle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  // コンテンツ定義
  const content = {
    streak: [
      {
        title: '🏆 ストリークレベルシステム',
        description: '継続日数に応じてバッジが進化します',
        searchText: 'ストリークレベルシステム 継続日数 バッジ 進化 スタート 軌道に乗る 1週間達成 ベテラン マスター級 習慣 継続 1-2日 3-6日 7-13日 14-29日 30日以上',
        content: (
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-lg">✨</span>
                <div>
                  <div className="font-medium text-green-900">スタート (1-2日)</div>
                  <div className="text-sm text-green-700">習慣を始めたばかり。継続が大切です！</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="font-medium text-yellow-900">軌道に乗る (3-6日)</div>
                  <div className="text-sm text-yellow-700">習慣が定着し始めています。この調子！</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-lg">🔥</span>
                <div>
                  <div className="font-medium text-orange-900">1週間達成 (7-13日)</div>
                  <div className="text-sm text-orange-700">素晴らしい！習慣が身についてきました。</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-lg">🔥</span>
                <div>
                  <div className="font-medium text-red-900">ベテラン (14-29日)</div>
                  <div className="text-sm text-red-700">驚異的な継続力！習慣が完全に定着しています。</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-lg">👑</span>
                <div>
                  <div className="font-medium text-purple-900">マスター級 (30日以上)</div>
                  <div className="text-sm text-purple-700">あなたは習慣のマスターです！完璧な継続力！</div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: '🎯 ステータス表示',
        description: '継続の緊急度を色で表示します',
        searchText: 'ステータス表示 継続 緊急度 色 正常 注意 期限切れ 期限 80% 途切れた',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🟢</span>
              <div>
                <div className="font-medium text-gray-900">正常</div>
                <div className="text-sm text-gray-600">期限まで余裕があります</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🟡</span>
              <div>
                <div className="font-medium text-gray-900">注意</div>
                <div className="text-sm text-gray-600">期限の80%が経過。そろそろ取り組みましょう</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🔴</span>
              <div>
                <div className="font-medium text-gray-900">期限切れ</div>
                <div className="text-sm text-gray-600">継続が途切れました。再度取り組むと新しいストリークが開始</div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: '📅 習慣タイプ',
        description: '実行頻度に応じて期限が設定されます',
        searchText: '習慣タイプ 実行頻度 期限 毎日 週1回 月1回 24時間 7日 30日 運動 読書 日記 大掃除 振り返り 健康診断 家計簿',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📅</span>
              <div>
                <div className="font-medium text-gray-900">毎日</div>
                <div className="text-sm text-gray-600">24時間以内に実行。運動、読書、日記など</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📊</span>
              <div>
                <div className="font-medium text-gray-900">週1回</div>
                <div className="text-sm text-gray-600">7日以内に実行。大掃除、振り返り、友人との連絡</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">🗓️</span>
              <div>
                <div className="font-medium text-gray-900">月1回</div>
                <div className="text-sm text-gray-600">30日以内に実行。健康診断、家計簿まとめ、目標見直し</div>
              </div>
            </div>
          </div>
        )
      }
    ],
    tasks: [
      {
        title: '📝 タスクの作成',
        description: 'タスクを効率的に作成する方法',
        searchText: 'タスクの作成 効率的 新しいタスク タイトル 説明 Markdown 優先度 高 中 低 開始日 期限日 スケジュール 予想時間 プリセット カスタム 習慣設定 継続',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">「新しいタスク」ボタンから、以下の項目を設定できます：</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>タイトル</strong>: 分かりやすい名前</li>
              <li>• <strong>説明</strong>: Markdown記法で詳細説明</li>
              <li>• <strong>優先度</strong>: 高・中・低から選択</li>
              <li>• <strong>開始日・期限日</strong>: スケジュール管理</li>
              <li>• <strong>予想時間</strong>: プリセットまたはカスタム入力</li>
              <li>• <strong>習慣設定</strong>: 継続タスクとして設定</li>
            </ul>
          </div>
        )
      },
      {
        title: '⏰ タイマー機能',
        description: 'タスクの実行時間を計測します',
        searchText: 'タイマー機能 実行時間 計測 開始 一時停止 停止 休憩 完了 記録 進捗表示 予想時間 比較',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">各タスクで実行タイマーを使用できます：</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>開始</strong>: 「開始」ボタンでタイマースタート</li>
              <li>• <strong>一時停止</strong>: 休憩時に一時停止可能</li>
              <li>• <strong>停止</strong>: 完了時に停止して実行時間を記録</li>
              <li>• <strong>進捗表示</strong>: 予想時間との比較表示</li>
            </ul>
          </div>
        )
      }
    ],
    stats: [
      {
        title: '📊 進捗統計',
        description: '活動状況を可視化します',
        searchText: '進捗統計 活動状況 可視化 達成率 今日 今週 今月 継続状況 アクティブ ストリーク 曜日別傾向 活動的 カレンダー表示 日別 タスク状況',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">様々な統計で進捗を確認できます：</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>達成率</strong>: 今日・今週・今月の達成率</li>
              <li>• <strong>継続状況</strong>: アクティブなストリーク一覧</li>
              <li>• <strong>曜日別傾向</strong>: どの曜日に活動的か</li>
              <li>• <strong>カレンダー表示</strong>: 日別のタスク状況</li>
            </ul>
          </div>
        )
      }
    ],
    faq: [
      {
        title: '❓ よくある質問',
        description: 'ユーザーからの質問と回答',
        searchText: 'よくある質問 ユーザー 質問 回答 ストリーク 途切れた 継続 完璧 プラン 違い フリープラン プレミアムプラン 14日 制限 ゲスト 今日 データ 削除 30日後 自動削除 保持',
        content: (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-900 mb-1">Q: ストリークが途切れてしまいました</div>
              <div className="text-sm text-gray-600">A: 大丈夫です！再度タスクを完了すると新しいストリークが開始されます。完璧を求めず、継続することが大切です。</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-900 mb-1">Q: プランの違いは何ですか？</div>
              <div className="text-sm text-gray-600">A: フリープランは14日先まで、プレミアムプランは制限なしでタスクを作成できます。ゲストは今日のタスクのみ作成可能です。</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-900 mb-1">Q: データはいつ削除されますか？</div>
              <div className="text-sm text-gray-600">A: フリーユーザーのデータは30日後に自動削除されます。プレミアムユーザーのデータは保持されます。</div>
            </div>
          </div>
        )
      }
    ]
  };

  const currentContent = content[activeTab as keyof typeof content] || [];
  const filteredContent = filterContent(currentContent, searchQuery);

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40" />
      
      {/* パネル */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ height: 'calc(100vh - 40px)' }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              {FaQuestionCircle({ className: "w-4 h-4 text-blue-600" })}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ヘルプガイド</h2>
              <p className="text-sm text-gray-500">StepEasyの使い方</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {FaTimes({ className: "w-4 h-4 text-gray-500" })}
          </button>
        </div>

        {/* 検索バー */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            {FaSearch({ className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" })}
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-medium transition-colors ${
                  isActive
                    ? `${tab.color} bg-white border-b-2 border-current`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {Icon({ className: "w-4 h-4" })}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-6">
          {filteredContent.length > 0 ? (
            filteredContent.map((item, index) => (
              <div key={index} className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <div>{item.content}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">🔍</div>
              <p className="text-gray-500 text-sm">検索結果が見つかりませんでした</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            💡 他にご不明な点がございましたら、設定画面からお問い合わせください
          </div>
        </div>
      </div>
    </>
  );
}; 