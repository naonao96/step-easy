'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CloudLayer } from '@/components/CloudLayer';
import { FaHome, FaShieldAlt, FaFileContract } from 'react-icons/fa';

// 仮のリリースノートデータ（今後はDBやMDファイル管理も可）
const releaseNotes = [
  {
    date: "2025-08-02",
    title: "パフォーマンス＆操作性をさらに向上！",
    items: [
      "画面の切り替えがなめらかに（フェードイン演出を追加）",
      "モーダル表示がより使いやすくなりました",
      "スマホ画面の見た目とボタンの大きさを調整",
      "習慣データの読み込みが早く・軽く",
      "朝9時のメッセージ配信のタイミングを安定化",
      "タスクのスワイプ操作がスムーズに",
      "スマホ版の操作ボタンの挙動を改善",
      "全体的に画面や処理の動作がスピードアップ",
      "アプリがより軽く安定して動作するように",
      "内部の仕組みを見直して安心・安全に",
    ]
  },
  {
    date: "2025-07-27",
    title: " セキュリティ強化＆システム安定性向上アップデート",
    items: [
      "個人情報の保護を強化し、より安全な環境を整えました",
      "万が一のエラーが起きても、アプリが安定して動作するよう改善しました",
      "システム内部の設定を見直し、安心してお使いいただける仕組みにアップデートしました",
      "セキュリティを高めるため、システムの構成管理を最適化しました",
      "不正アクセスを防止する「アクセス制限機能」を追加しました",
      "エラー発生時の処理を改善し、よりスムーズな操作が可能になりました"
    ]
  },
  {
    date: "2025-07-24",
    title: "本番切替＆大規模アップデート",
    items: [
      "通知機能やデータ管理が進化しました。30日超の記録は自動削除されるようになります（事前通知あり）",
      "アーカイブやUIもより使いやすく改善。カード全体タップで詳細プレビューが開きます。",
      "プレミアム案内・設定画面・LPのデザインを統一し、法的情報もアプリ内から確認可能に。",
      "不要な機能や古いファイルを整理し、アプリ全体の動作がより快適に。"
    ]
  },
  // ここに今後のリリース情報を追加
];

export const ReleaseNoteContent: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-50 relative overflow-hidden">
      {/* 青空と雲の背景 */}
      <CloudLayer />
      
      {/* ヘッダー */}
      <header className="h-16 md:h-20 flex justify-between items-center px-4 sm:px-6 flex-shrink-0 bg-gradient-to-b from-[#f7ecd7] to-[#f5e9da] border-b border-[#deb887]/30 backdrop-blur-sm shadow-none fixed top-0 left-0 right-0 z-40 pt-safe">
        {/* 左側：ロゴ */}
        <div className="flex items-center gap-3">
          <div 
            className="cursor-pointer flex items-center gap-3"
            onClick={() => router.push('/menu')}
          >
            <img 
              src="/logo.png" 
              alt="StepEasy" 
              className="h-8 sm:h-10 w-auto"
              style={{ width: 'auto' }}
              loading="eager"
              decoding="sync"
            />
            <h1 className="text-lg sm:text-xl font-bold text-[#8b4513] truncate">
              リリースノート
            </h1>
          </div>
        </div>

        {/* 右側：ナビゲーションボタン */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/privacy')}
            className="p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 hover:scale-105"
            title="プライバシーポリシー"
          >
            {FaShieldAlt({ className: "w-5 h-5" })}
          </button>
          <button
            onClick={() => router.push('/terms')}
            className="p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 hover:scale-105"
            title="利用規約"
          >
            {FaFileContract({ className: "w-5 h-5" })}
          </button>
          <button
            onClick={() => router.push('/lp')}
            className="p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 hover:scale-105"
            title="ホーム"
          >
            {FaHome({ className: "w-5 h-5" })}
          </button>
        </div>
      </header>
      
      <div className="relative z-20 py-8 pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/30">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#8b4513] mb-4">リリースノート</h1>
              <div className="text-sm text-[#7c5a2a]">
                <span>StepEasyの最新アップデート情報をお届けします</span>
              </div>
            </div>

            <div className="space-y-8">
              {releaseNotes.map((note, idx) => (
                <div key={idx} className="bg-[#f5f5dc] rounded-xl shadow p-4 sm:p-6">
                  <div className="mb-2">
                    <div className="text-sm text-[#b0a18b] font-medium mb-1">{note.date}</div>
                    <div className="text-base sm:text-lg font-semibold text-[#8b4513]">{note.title}</div>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[#7c5a2a] text-sm sm:text-base">
                    {note.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 