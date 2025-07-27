"use client";

import React from "react";
import { AppLayout } from "@/components/templates/AppLayout";

// 仮のリリースノートデータ（今後はDBやMDファイル管理も可）
const releaseNotes = [
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
    date: "2024-06-20",
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