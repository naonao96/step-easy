import React, { useState, useEffect } from 'react';
import { FaTasks, FaFire, FaChartLine, FaRobot, FaClock, FaGem, FaBars, FaTimes, FaCog, FaHeart, FaArchive } from 'react-icons/fa';

interface FeatureGuideProps {
  className?: string;
}

interface FeatureSection {
  id: string;
  title: string;
  icon: any; // React Iconsの型問題を回避
  description: string;
  features: Feature[];
}

interface Feature {
  name: string;
  description: string;
  howToUse?: string;
  status: 'implemented' | 'premium' | 'coming-soon';
  category?: string;
}

export const FeatureGuide: React.FC<FeatureGuideProps> = ({ className = '' }) => {
  const [activeSection, setActiveSection] = useState('task-management');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const featureSections: FeatureSection[] = [
    {
      id: 'task-management',
      title: 'タスク管理',
      icon: FaTasks,
      description: '日々のタスクを効率的に管理する基本機能',
      features: [
        {
          name: 'タスクの作成・編集・削除',
          description: 'タイトル、説明、優先度、期限、カテゴリを設定してタスクを管理',
          howToUse: 'メニュー → 新規作成ボタンから作成',
          status: 'implemented'
        },
        {
          name: '優先度設定',
          description: '高・中・低の3段階でタスクの重要度を設定',
          howToUse: 'タスク作成時に優先度を選択、色分けで表示',
          status: 'implemented'
        },
        {
          name: 'カテゴリ分類',
          description: '仕事・健康・学習・プライベート・趣味・その他の6カテゴリで整理',
          howToUse: 'タスク作成時にカテゴリを選択、統計画面で分析可能',
          status: 'implemented'
        },
        {
          name: 'ステータス管理',
          description: '未着手・進行中・完了の3段階でタスクの進捗を管理',
          howToUse: 'チェックボックスで完了、編集画面でステータス変更',
          status: 'implemented'
        },
        {
          name: '期限日設定',
          description: 'タスクの期限日を設定（ゲスト：不可、無料・プレミアム：可能）',
          howToUse: 'タスク作成・編集時に期限日を設定',
          status: 'implemented'
        },
        {
          name: 'プラン別日付制限',
          description: 'ゲスト：今日のみ｜無料：今日〜14日先｜プレミアム：無制限',
          howToUse: 'プランに応じて自動制限、プレミアムで制限解除',
          status: 'implemented'
        },
        {
          name: 'フィルター・検索',
          description: 'ステータス、優先度、カテゴリ、キーワードでタスクを絞り込み',
          howToUse: 'タスク一覧画面の検索バーとフィルターを使用',
          status: 'implemented'
        },
        {
          name: 'ソート機能',
          description: '優先度、期限、作成日、継続日数など複数条件で並び替え',
          howToUse: 'タスク一覧画面のソートドロップダウンから選択',
          status: 'implemented'
        }
      ]
    },
    {
      id: 'habit-tracking',
      title: '習慣継続機能',
      icon: FaFire,
      description: '継続的な習慣形成をサポートする機能群',
      features: [
        {
          name: '習慣タスク作成',
          description: '通常のタスクを習慣として設定、継続的な管理が可能',
          howToUse: 'タスク作成時に「習慣タスク」をチェック',
          status: 'implemented'
        },
        {
          name: 'ストリーク記録',
          description: '習慣タスクの継続日数を自動カウント、レベル別バッジ表示',
          howToUse: '習慣タスクを完了すると継続日数が増加',
          status: 'implemented'
        },
        {
          name: 'ストリークレベルシステム',
          description: '継続日数に応じてバッジが進化（スタート→軌道→1週間→ベテラン→マスター級）',
          howToUse: '継続するほど高レベルのバッジを獲得',
          status: 'implemented'
        },
        {
          name: 'プラン別習慣制限',
          description: 'ゲスト：不可｜無料：3個まで｜プレミアム：無制限',
          howToUse: 'プランに応じて自動制限、プレミアムで制限解除',
          status: 'implemented'
        },
        {
          name: '期限切れ自動リセット',
          description: '設定した頻度を過ぎた習慣のストリークを自動リセット',
          howToUse: '自動実行、アプリ起動時に期限切れタスクをチェック',
          status: 'implemented'
        }
      ]
    },
    {
      id: 'time-tracking',
      title: '時間管理',
      icon: FaClock,
      description: 'タスクの実行時間を記録・分析する機能',
      features: [
        {
          name: 'タスクタイマー',
          description: 'タスク実行時間を計測、開始・一時停止・完了が可能',
          howToUse: 'タスク詳細画面でタイマー開始、実行中は他画面でも継続',
          status: 'implemented'
        },
        {
          name: '予想時間設定',
          description: 'タスクの予想所要時間を設定、実績と比較',
          howToUse: 'タスク作成・編集時に予想時間を入力',
          status: 'implemented'
        },
        {
          name: '実行履歴記録',
          description: 'タスクごとの実行セッション履歴を保存',
          howToUse: 'タスク詳細画面で過去の実行履歴を確認',
          status: 'implemented'
        },
        {
          name: '累積時間統計',
          description: '今日・今週・今月・全期間の累積実行時間を表示',
          howToUse: 'タスク詳細画面やプロフィール画面で確認',
          status: 'implemented'
        }
      ]
    },
    {
      id: 'analytics',
      title: '統計・分析',
      icon: FaChartLine,
      description: 'タスクの実行パターンを可視化・分析する機能',
      features: [
        {
          name: 'ヒートマップ表示',
          description: '24時間×7曜日のマトリックスでタスク完了パターンを可視化',
          howToUse: 'プログレス画面 → ヒートマップタブで確認',
          status: 'implemented'
        },
        {
          name: 'カテゴリ別統計',
          description: 'カテゴリごとの完了率、実行時間、ランキングを表示',
          howToUse: 'プログレス画面 → カテゴリ別分析タブで確認',
          status: 'implemented'
        },
        {
          name: '日次達成率',
          description: '今日のタスク完了率と進捗状況をリアルタイム表示',
          howToUse: 'ホーム画面とプログレス画面で確認',
          status: 'implemented'
        },
        {
          name: '全体統計',
          description: '総タスク数、完了率、進行中タスク、習慣達成率を一覧表示',
          howToUse: 'プログレス画面 → 全体統計タブで確認',
          status: 'implemented'
        },
        {
          name: '実行時間分析',
          description: 'タスクごとの予想時間vs実績時間の比較分析',
          howToUse: 'タスク詳細画面で実行時間の詳細を確認',
          status: 'implemented'
        },
        {
          name: '習慣継続率分析',
          description: '習慣タスクの継続率・中断パターン・最適化提案',
          howToUse: '習慣タスクの統計画面で詳細分析を確認',
          status: 'implemented'
        },
        {
          name: 'プラン別アクセス制限',
          description: 'ゲスト：統計画面アクセス不可｜無料・プレミアム：利用可能',
          howToUse: 'プランに応じて自動制限、ログインで制限解除',
          status: 'implemented'
        }
      ]
    },
    {
      id: 'emotion-recording',
      title: '感情記録機能',
      icon: FaHeart,
      description: '朝・昼・晩の感情を記録し、AIメッセージに反映する心理サポート機能',
      features: [
        {
          name: '朝・昼・晩の感情記録',
          description: '1日3回（朝・昼・晩）の感情を記録し、心理状態を把握',
          howToUse: 'キャラクターをクリックして感情メニューを開き、現在の気持ちを選択',
          status: 'implemented'
        },
        {
          name: '感情分析とAIメッセージ反映',
          description: '記録した感情データをAIメッセージ生成に活用し、より適切なサポートを提供',
          howToUse: '感情記録後、AIが自動的に感情状態を分析してメッセージを調整',
          status: 'implemented'
        },
        {
          name: '感情パターンの可視化',
          description: 'ポジティブ/ネガティブ感情の傾向分析と連続日数の計算',
          howToUse: '感情データから行動パターンと心理状態の変化を分析',
          status: 'implemented'
        },
        {
          name: '心理サポート機能',
          description: 'ストレスレベル判定、モチベーション分析、休息提案による心理的サポート',
          howToUse: '感情記録に基づいてAIが適切な心理的サポートを提供',
          status: 'implemented'
        },
        {
          name: 'プラン別アクセス制限',
          description: 'ゲスト：感情記録不可｜無料・プレミアム：利用可能',
          howToUse: 'プランに応じて自動制限、ログインで制限解除',
          status: 'implemented'
        }
      ]
    },
    {
      id: 'ai-support',
      title: 'AIサポート',
      icon: FaRobot,
      description: 'Google Gemini搭載のAIがパーソナライズされたサポートを提供',
      features: [
        {
          name: '感情分析AI',
          description: 'タスクの進捗状況と感情記録から感情状態を分析し、適切なメッセージを生成',
          howToUse: 'ホーム画面でキャラクターからのメッセージを確認',
          status: 'implemented'
        },
        {
          name: 'パーソナライズメッセージ',
          description: 'ユーザーの行動パターン、感情状態、時間帯・曜日を考慮した個別化されたアドバイス',
          howToUse: '毎日自動更新、ユーザーの状況に応じてメッセージが変化',
          status: 'implemented'
        },
        {
          name: '心理的サポート',
          description: 'ストレス高・モチベーション低時の配慮、休息提案、感情状態に寄り添ったサポート',
          howToUse: 'AIが自動判定、優しい口調でのメッセージ提供',
          status: 'implemented'
        },
        {
          name: '毎朝9時自動配信',
          description: 'CronJobによる毎朝9時の自動メッセージ配信',
          howToUse: '自動実行、ユーザーの状況に応じてメッセージが生成',
          status: 'implemented'
        },
        {
          name: 'プラン別メッセージ制限',
          description: '無料プラン：100文字まで、プレミアム：200文字まで',
          howToUse: 'プラン設定に応じて自動調整',
          status: 'implemented'
        },
        {
          name: 'データ保存期間制限',
          description: '無料プラン：30日間、プレミアム：無制限',
          howToUse: 'プラン設定に応じて自動制限',
          status: 'implemented'
        }
      ]
    },
    {
      id: 'archive',
      title: 'アーカイブ機能',
      icon: FaArchive,
      description: '過去のタスクとデータを管理・閲覧する機能',
      features: [
        {
          name: '完了タスクアーカイブ',
          description: '完了したタスクを自動的にアーカイブに保存',
          howToUse: 'タスク完了時に自動的にアーカイブに移動',
          status: 'implemented'
        },
        {
          name: 'アーカイブ閲覧',
          description: '過去の完了タスクを日付・カテゴリ別に閲覧',
          howToUse: 'アーカイブ画面で過去のタスクを確認',
          status: 'implemented'
        },
        {
          name: 'プラン別表示制限',
          description: '無料プラン：30日間表示｜プレミアム：無制限表示',
          howToUse: 'プランに応じて自動制限、プレミアムで制限解除',
          status: 'implemented'
        },
        {
          name: 'プラン別アクセス制限',
          description: 'ゲスト：アーカイブアクセス不可｜無料・プレミアム：利用可能',
          howToUse: 'プランに応じて自動制限、ログインで制限解除',
          status: 'implemented'
        }
      ]
    },
    {
      id: 'settings-account',
      title: '設定・アカウント',
      icon: FaCog,
      description: 'アカウント設定とカスタマイズ機能',
      features: [
        {
          name: 'プロフィール設定',
          description: 'ユーザー名の変更とプロフィール管理',
          howToUse: '設定画面 → プロフィールタブから編集',
          status: 'implemented'
        },
        {
          name: 'Googleログイン',
          description: 'Googleアカウントでの簡単ログイン',
          howToUse: 'ログイン画面でGoogleボタンをクリック',
          status: 'implemented'
        },
        {
          name: 'ゲスト→正式アカウント移行',
          description: 'ゲストデータを正式アカウントに引き継ぎ',
          howToUse: 'ゲスト利用中に登録ボタンで移行',
          status: 'implemented'
        },
        {
          name: 'アカウント削除',
          description: 'アカウントとデータの完全削除',
          howToUse: '設定画面 → セキュリティタブから削除',
          status: 'implemented'
        },
        {
          name: 'プラン別アクセス制限',
          description: 'ゲスト：設定画面アクセス不可｜無料・プレミアム：利用可能',
          howToUse: 'プランに応じて自動制限、ログインで制限解除',
          status: 'implemented'
        },
        {
          name: '通知設定',
          description: 'タスク・習慣・サブスクリプション・システム・AIの5カテゴリの通知設定',
          howToUse: '設定画面 → 通知タブから各カテゴリのON/OFFを設定',
          status: 'implemented'
        }
      ]
    }
  ];

  const getStatusBadge = (status: Feature['status']) => {
    switch (status) {
      case 'implemented':
        return null; // バッジを表示しない
      case 'premium':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">プレミアム</span>;
      case 'coming-soon':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Coming Soon</span>;
    }
  };

  const selectSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={`bg-transparent rounded-lg shadow-md ${className} relative h-screen flex flex-col`}>
      {/* モバイル用ハンバーガーボタン */}
      {isMobile && (
        <div className="p-6 pb-2 bg-transparent z-10 flex-shrink-0">
          <div className="bg-[#f5f5dc]/40 rounded-lg shadow-sm border border-[#deb887]/40 p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="relative p-2 rounded-lg bg-gradient-to-br from-[#f5e9da] to-[#ecd9c6] hover:from-[#ecd9c6] hover:to-[#deb887] text-[#8b4513] hover:text-[#7c5a2a] transition-all duration-300 shadow-md hover:shadow-lg border border-[#deb887]/30 hover:border-[#deb887]/60 group"
              >
                {/* ハンバーガーアイコンの3本線 */}
                <div className="flex flex-col gap-1 items-center justify-center w-4 h-4">
                  <div className="w-4 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:bg-[#7c5a2a]"></div>
                  <div className="w-4 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:bg-[#7c5a2a]"></div>
                  <div className="w-4 h-0.5 bg-current rounded-full transition-all duration-300 group-hover:bg-[#7c5a2a]"></div>
                </div>
                
                {/* ホバー時の光沢効果 */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* アクティブ状態のインジケーター */}
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#deb887] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              {/* 現在のセクションタイトルとサブタイトル */}
              <div className="flex-1">
                {(() => {
                  const currentSection = featureSections.find(section => section.id === activeSection);
                  if (!currentSection) return null;
                  
                  return (
                    <div>
                      <h1 className="text-lg font-bold text-[#8b4513] mb-1">{currentSection.title}</h1>
                      <p className="text-sm text-[#7c5a2a] leading-tight">{currentSection.description}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* デスクトップサイドバー */}
        {!isMobile && (
          <div className="w-64 border-r border-[#deb887] p-4 flex-shrink-0 overflow-y-auto bg-white/90 backdrop-blur-sm">
            <nav className="space-y-2">
              {featureSections.map((section) => {
                const IconComponent = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[#deb887] text-[#8b4513] border-2 border-[#8b4513] shadow-sm'
                        : 'text-[#7c5a2a] hover:bg-[#deb887] border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-[#8b4513]' : 'bg-[#deb887]'
                    }`}>
                      {(IconComponent as any)({ 
                        className: `w-4 h-4 ${isActive ? 'text-white' : 'text-[#8b4513]'}` 
                      })}
                    </div>
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* メインコンテンツ - 青空と雲の背景を透過して表示 */}
        <div className="flex-1 p-6 pb-20 overflow-y-auto bg-transparent">
          {featureSections.map((section) => {
            if (section.id !== activeSection) return null;
            
            return (
              <div key={section.id}>
                <div className="space-y-4">
                  {section.features.map((feature, index) => (
                    <div key={index} className="border border-[#deb887]/40 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-[#f5f5dc]/90 via-[#f5e9da]/85 to-[#ecd9c6]/90 backdrop-blur-sm hover:from-[#f5f5dc]/95 hover:via-[#f5e9da]/90 hover:to-[#ecd9c6]/95 hover:scale-[1.02] hover:border-[#deb887]/60">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-[#8b4513]">{feature.name}</h3>
                        {getStatusBadge(feature.status)}
                      </div>
                      
                      <p className="text-[#7c5a2a] mb-4 leading-relaxed">{feature.description}</p>
                      
                      {feature.howToUse && (
                        <div className="bg-gradient-to-br from-[#deb887]/60 via-[#cd853f]/50 to-[#deb887]/60 backdrop-blur-sm rounded-xl p-4 border border-[#deb887]/30">
                          <h4 className="text-sm font-bold text-[#8b4513] mb-2">使い方</h4>
                          <p className="text-sm text-[#7c5a2a] leading-relaxed">{feature.howToUse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* モバイルサイドバーオーバーレイ */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* 背景オーバーレイ */}
          <div 
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* サイドバー */}
          <div className="w-80 bg-gradient-to-br from-[#f7ecd7]/95 via-[#f5e9da]/90 to-[#ecd9c6]/95 backdrop-blur-sm border-l border-[#deb887]/40 shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-[#deb887]/40 bg-gradient-to-r from-[#f5e9da]/80 to-[#ecd9c6]/80">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#8b4513]">機能一覧</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-[#deb887]/60 text-[#7c5a2a] transition-all duration-300 hover:scale-110"
                >
                  {(FaTimes as any)({ className: "w-5 h-5" })}
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {featureSections.map((section) => {
                const IconComponent = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-[#deb887]/80 to-[#cd853f]/70 border-2 border-[#8b4513] shadow-lg' 
                        : 'hover:bg-gradient-to-br hover:from-[#deb887]/40 hover:to-[#cd853f]/30 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-[#8b4513]' : 'bg-[#deb887]/60'
                      }`}>
                        {(IconComponent as any)({ 
                          className: `w-5 h-5 ${isActive ? 'text-white' : 'text-[#8b4513]'}` 
                        })}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isActive ? 'text-[#8b4513]' : 'text-[#8b4513]'}`}>
                          {section.title}
                        </h4>
                        <p className={`text-sm ${isActive ? 'text-[#7c5a2a]' : 'text-[#7c5a2a]'}`}>
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 