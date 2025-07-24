"use client";

import React from "react";
import { AppLayout } from "@/components/templates/AppLayout";

// 仮のリリースノートデータ（今後はDBやMDファイル管理も可）
const releaseNotes = [
  {
    date: "2025-07-24",
    title: "大規模アップデート - AI機能と習慣管理の大幅強化",
    items: [
      "AIキャラクターがさらに賢く！行動パターンや感情傾向を学習し、よりあなたに寄り添ったメッセージを届けます",
      "感情記録機能を追加。朝・昼・夜の気持ちを記録でき、よりパーソナライズされたサポートが可能になりました",
      "毎朝9時に自動でメッセージを配信。前日の活動をAIが分析し、励ましの一言をお届けします",
      "習慣管理機能を完全刷新。タスクと分離された独立設計で、継続日数や達成率の記録がより正確に",
      "モバイル専用レイアウトを新設。スマートフォンでの使いやすさを大幅に向上させました",
      "デザインを全面リニューアル。プレミアム感のある、やさしく洗練されたUIになりました",
      "初回設定のオンボーディングを改善。登録やキャラクター設定がよりスムーズに行えるようになりました",
      "アプリの動作を高速化＆安定化。日付処理を統一し、日本時間での表示精度を改善しました",
      "セキュリティを強化。API通信の暗号化やデータ保護レベルを引き上げました",
      "プレミアム機能の基盤を構築。Stripeによるサブスクリプション管理の導入を準備中です"
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