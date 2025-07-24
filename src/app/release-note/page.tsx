"use client";

import React from "react";
import { AppLayout } from "@/components/templates/AppLayout";

// 仮のリリースノートデータ（今後はDBやMDファイル管理も可）
const releaseNotes = [
  {
    date: "2025-07-24",
    title: "大規模アップデート - AI機能と習慣管理の大幅強化",
    items: [
      "AIキャラクターがより賢くなりました！あなたの行動パターンを学習して、より寄り添ったメッセージをお届けします",
      "習慣管理機能を完全刷新。独立した習慣テーブルで、より正確な継続日数の管理ができるようになりました",
      "スマートフォンでの使いやすさが大幅向上。モバイル専用のレイアウトを新設しました",
      "デザインをより洗練されたスタイルに変更。プレミアム感のある美しいUIになりました",
      "アプリの動作がより安定・高速になりました。日付処理を統一し、日本時間対応を改善",
      "セキュリティを強化。API通信の安全性とデータ保護を向上させました",
      "プレミアム機能の基盤を構築。Stripe決済によるサブスクリプション管理を準備中です",
      "感情記録機能を追加。あなたの感情状態を記録して、よりパーソナライズされたサポートを提供",
      "毎朝9時に自動でメッセージを配信。AIがあなたの前日の活動を分析して励ましのメッセージをお届け",
      "オンボーディング機能を改善。初回利用時の設定がより簡単になりました"
    ]
  },
  // ここに今後のリリース情報を追加
];

export default function ReleaseNotePage() {
  return (
    <AppLayout
      title="リリースノート"
      showBackButton={true}
      backUrl="/menu"
      backLabel="メニューに戻る"
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#8b4513] mb-6 text-center">リリースノート</h1>
        <ul className="space-y-8">
          {releaseNotes.map((note, idx) => (
            <li key={idx} className="bg-[#f5f5dc] rounded-xl shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                <span className="text-sm text-[#b0a18b] font-medium">{note.date}</span>
                <span className="text-base sm:text-lg font-semibold text-[#8b4513] mt-1 sm:mt-0">{note.title}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[#7c5a2a] text-sm sm:text-base">
                {note.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
} 