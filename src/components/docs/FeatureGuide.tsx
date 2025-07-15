import React, { useState, useEffect } from 'react';
import { FaTasks, FaFire, FaChartLine, FaRobot, FaClock, FaGem, FaSearch, FaBars, FaTimes, FaCog, FaHeart } from 'react-icons/fa';

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
  const [searchQuery, setSearchQuery] = useState('');
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
          howToUse: 'メニュー → タスク管理 → 新規作成ボタンから作成',
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
        },
        {
          name: 'キーワード検索',
          description: 'タスクのタイトル・説明文からキーワード検索が可能',
          howToUse: 'タスク一覧画面の検索バーにキーワードを入力',
          status: 'implemented'
        },
        {
          name: 'ステータス別フィルター',
          description: '未着手・進行中・完了の3段階でタスクを絞り込み',
          howToUse: 'タスク一覧画面のフィルターボタンから選択',
          status: 'implemented'
        },
        {
          name: 'カテゴリ別フィルター',
          description: '仕事・健康・学習・プライベート・趣味・その他の6カテゴリで分類',
          howToUse: 'タスク一覧画面のカテゴリフィルターから選択',
          status: 'implemented'
        },
        {
          name: '優先度別フィルター',
          description: '高・中・低の優先度でタスクを絞り込み',
          howToUse: 'タスク一覧画面の優先度フィルターから選択',
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
          name: 'ストリーク記録',
          description: '習慣タスクの継続日数を自動カウント、レベル別バッジ表示',
          howToUse: 'タスク作成時に「習慣タスク」をチェック、完了すると継続日数が増加',
          status: 'implemented'
        },
        {
          name: '習慣頻度設定',
          description: '毎日・週1回・月1回の頻度で習慣の期限を自動管理',
          howToUse: '習慣タスク作成時に頻度を選択、期限切れ前にアラート表示',
          status: 'implemented'
        },
        {
          name: 'ストリーク状態管理',
          description: '正常・注意・期限切れの3段階で継続状況を色分け表示',
          howToUse: 'タスク一覧でストリークバッジの色で状態確認',
          status: 'implemented'
        },
        {
          name: '期限切れ自動リセット',
          description: '設定した頻度を過ぎた習慣のストリークを自動リセット',
          howToUse: '自動実行、アプリ起動時に期限切れタスクをチェック',
          status: 'implemented'
        },
        {
          name: 'ストリークレベルシステム',
          description: '継続日数に応じてバッジが進化（スタート→軌道→1週間→ベテラン→マスター級）',
          howToUse: '継続するほど高レベルのバッジを獲得',
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
        },
        {
          name: '多層リセット機能',
          description: 'セッション・日次・全期間の時間データを選択的にリセット',
          howToUse: 'タスク詳細画面のリセットボタンから選択',
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
          name: 'パフォーマンス分析',
          description: '時間内完了率、平均精度、最適な時間帯の分析',
          howToUse: 'モバイル版の詳細分析機能で確認',
          status: 'implemented'
        },
        {
          name: '実行時間分析',
          description: 'タスクごとの予想時間vs実績時間の比較分析',
          howToUse: 'タスク詳細画面で実行時間の詳細を確認',
          status: 'implemented'
        },
        {
          name: 'カテゴリ別パフォーマンス',
          description: 'カテゴリごとの完了率・実行時間・効率性を分析',
          howToUse: 'プログレス画面 → カテゴリ別分析タブで確認',
          status: 'implemented'
        },
        {
          name: '習慣継続率分析',
          description: '習慣タスクの継続率・中断パターン・最適化提案',
          howToUse: '習慣タスクの統計画面で詳細分析を確認',
          status: 'implemented'
        },
        {
          name: '時間帯別生産性分析',
          description: '24時間×7曜日のマトリックスで最適な時間帯を分析',
          howToUse: 'プログレス画面 → ヒートマップタブで確認',
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
          name: 'フリー/プレミアム対応',
          description: 'プランに応じたメッセージの詳細度とパーソナライズ度の調整',
          howToUse: 'プラン設定に応じて自動調整',
          status: 'implemented'
        },
        {
          name: '日次メッセージ配信',
          description: '毎朝のモチベーション向上メッセージを自動生成・配信',
          howToUse: 'Edge Function による自動配信',
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
          name: '感情分析機能',
          description: 'ストレス・モチベーション・継続性の3要素を分析',
          howToUse: 'AIが自動判定、適切なメッセージを生成',
          status: 'implemented'
        },
        {
          name: 'データ保存期間制限',
          description: '無料プラン：30日間、プレミアム：無制限',
          howToUse: 'プラン設定に応じて自動制限',
          status: 'implemented'
        },
        {
          name: 'レート制限対応',
          description: 'API制限に応じたリトライ機能とエラーハンドリング',
          howToUse: '自動実行、エラー時は適切なフォールバック',
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
          name: '通知設定',
          description: 'カスタマイズ可能な通知設定',
          status: 'coming-soon'
        },
        {
          name: '外観設定',
          description: 'カスタマイズ可能な外観設定',
          status: 'coming-soon'
        },
        {
          name: 'パスワードリセット',
          description: 'パスワードリセット機能',
          status: 'coming-soon'
        }
      ]
    },
    {
      id: 'premium-features',
      title: 'プレミアム機能',
      icon: FaGem,
      description: '月額200円で利用できる高度な分析・サポート機能',
      features: [
        {
          name: '週次・月次詳細レポート',
          description: '行動パターンの詳細分析と成長の軌跡を可視化',
          status: 'coming-soon'
        },
        {
          name: '性格タイプ分析',
          description: '行動データから性格タイプを判定し、最適なアプローチを提案',
          status: 'coming-soon'
        },
        {
          name: 'AI専属コーチ強化',
          description: '個人の特性を学習した専属AIコーチによる高度なサポート',
          status: 'coming-soon'
        },
        {
          name: '習慣最適化提案',
          description: '個人の生活パターンに合わせた最適な習慣プランを提案',
          status: 'coming-soon'
        },
        {
          name: '感情パターン解析',
          description: 'メモから感情を読み取り、心理状態の変化を分析',
          status: 'coming-soon'
        },
        {
          name: '成長予測機能',
          description: '過去のデータから未来のパフォーマンスを予測',
          status: 'coming-soon'
        }
      ]
    }
  ];

  const filteredSections = featureSections.map(section => ({
    ...section,
    features: section.features.filter(feature => 
      searchQuery === '' ||
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.features.length > 0);

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
      {/* ヘッダー */}
      <div className="border-b border-[#deb887] p-6 bg-white/90 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white transition-colors"
            >
              {(FaBars as any)({ className: "w-5 h-5" })}
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#8b4513] mb-2">StepEasy 機能ガイド</h1>
            <p className="text-[#7c5a2a]">
              現在実装されている機能と今後追加予定の機能を詳しく説明します
            </p>
          </div>
        </div>
        
        {/* 検索バー */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {(FaSearch as any)({ className: "h-4 w-4 text-[#7c5a2a]" })}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="機能を検索..."
            className="block w-full pl-10 pr-3 py-2 border border-[#deb887] rounded-xl leading-5 bg-white placeholder-[#7c5a2a] focus:outline-none focus:placeholder-[#8b4513] focus:ring-2 focus:ring-[#8b4513] focus:border-[#8b4513]"
          />
        </div>
      </div>

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

        {/* メインコンテンツ */}
        <div className="flex-1 p-6 overflow-y-auto bg-transparent">
          {filteredSections.map((section) => {
            if (section.id !== activeSection) return null;
            
            return (
              <div key={section.id}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#8b4513] mb-2">{section.title}</h2>
                  <p className="text-[#7c5a2a]">{section.description}</p>
                </div>
                
                <div className="space-y-4">
                  {section.features.map((feature, index) => (
                    <div key={index} className="border border-[#deb887] rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-[#8b4513]">{feature.name}</h3>
                        {getStatusBadge(feature.status)}
                      </div>
                      
                      <p className="text-[#7c5a2a] mb-4 leading-relaxed">{feature.description}</p>
                      
                      {feature.howToUse && (
                        <div className="bg-[#deb887]/80 backdrop-blur rounded-xl p-4">
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
          <div className="w-80 bg-white/95 backdrop-blur border-l border-[#deb887] shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-[#deb887]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#8b4513]">機能一覧</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-[#deb887] text-[#7c5a2a] transition-colors"
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
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#deb887] border-2 border-[#8b4513] shadow-sm' 
                        : 'hover:bg-[#deb887] border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-[#8b4513]' : 'bg-[#deb887]'
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