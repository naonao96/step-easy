# StepEasy

<div align="center">
  <img src="public/logo.png" alt="StepEasy Logo" width="200"/>
  
  **タスクを完了へ導く、心理的サポート付き目標管理アプリ**
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
</div>

## 🌟 概要

StepEasyは、単なるタスク管理を超越した次世代の生産性管理アプリケーションです。AIキャラクターによる心理的サポートと習慣形成機能により、ユーザーの継続的な成長を支援します。

### 🎯 主要な特徴

- **🤖 AIキャラクターサポート**: 進捗に応じたパーソナライズメッセージ
- **🔥 習慣継続管理**: ストリーク機能による習慣形成支援
- **📊 詳細進捗分析**: 日次・週次・月次での多角的分析
- **🔔 インテリジェントアラート**: 適切なタイミングでの通知
- **📱 レスポンシブデザイン**: あらゆるデバイスでの最適な体験

## 🚀 主要機能

### ✅ 実装済み機能

#### 📋 タスク管理
- タスクのCRUD操作（作成・読取・更新・削除）
- 優先度設定（高・中・低）
- カテゴリ分類（仕事・健康・学習・プライベート・趣味・その他）
- 期限日・開始日設定
- Markdown形式でのメモ機能
- ステータス管理（Todo・進行中・完了）

#### 🎯 習慣管理
- 習慣タスクの設定と管理
- ストリーク（連続記録）機能
- 継続リスク検知とアラート
- 習慣継続統計

#### 📈 進捗分析
- 今日の詳細分析（達成率・カテゴリ別進捗）
- 曜日別パフォーマンス分析
- 全体統計（完了率・習慣継続状況）
- 視覚的レポート（グラフ・ヒートマップ）

#### 🤖 AIサポート
- 表情変化するキャラクター（嬉しい・普通・悲しい）
- 進捗状況に応じたパーソナライズメッセージ
- 期限切れ・継続リスクの自動検知
- 達成時の励ましメッセージ

#### 📅 カレンダー・スケジュール
- 月次カレンダー表示
- 日付選択によるタスクフィルタリング
- 習慣継続状況の視覚的表示
- プラン別の将来日付設定制限

#### 🗂️ アーカイブ・履歴
- 完了タスクの自動アーカイブ
- 期間別フィルタリング（7日・14日・30日）
- 完了履歴の詳細表示
- タスク復元機能

#### 👤 ユーザー管理
- 新規登録・ログイン・パスワードリセット
- ゲストモード（機能制限付き体験版）
- プラン別機能制限（ゲスト・フリー・プレミアム）
- ゲストタスクの正式アカウント移行

#### ⚙️ 設定・カスタマイゼーション
- プロフィール管理
- 通知設定
- 外観設定（テーマ・フォントサイズ）
- セキュリティ設定

### 🔄 開発中・計画中機能

- AIサポートスタイル選択（習慣化・やる気維持・短期集中）
- 統計データのエクスポート（CSV・PDF）
- 感情ベースアラート
- AIメモサポート機能

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Zustand** - 状態管理
- **React Hook Form** - フォーム管理
- **React Icons** - アイコンライブラリ

### バックエンド・インフラ
- **Supabase** - Backend as a Service
  - PostgreSQL データベース
  - 認証システム
  - リアルタイム機能
- **Vercel** - デプロイメント・ホスティング

### 開発ツール
- **ESLint** - コード品質管理
- **Prettier** - コードフォーマット
- **TypeScript** - 型チェック

## 🏗️ プロジェクト構造

```
step-easy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証関連ページ
│   │   ├── api/               # API エンドポイント
│   │   └── [pages]/           # 各機能ページ
│   ├── components/            # UIコンポーネント
│   │   ├── atoms/             # 基本コンポーネント
│   │   ├── molecules/         # 複合コンポーネント
│   │   ├── organisms/         # 複雑なコンポーネント
│   │   └── templates/         # レイアウトテンプレート
│   ├── contexts/              # React Context
│   ├── hooks/                 # カスタムフック
│   ├── lib/                   # ユーティリティ関数
│   ├── stores/                # Zustand ストア
│   └── types/                 # TypeScript 型定義
├── public/                    # 静的ファイル
├── supabase/                  # データベースマイグレーション
└── StepEasyの開発/           # 開発ドキュメント
```

## 🚀 クイックスタート

### 前提条件
- Node.js 18.0 以上
- npm または yarn
- Supabase アカウント

### インストール

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-username/step-easy.git
cd step-easy
```

2. **依存関係のインストール**
```bash
npm install
# または
yarn install
```

3. **環境変数の設定**
```bash
cp .env.example .env.local
```

`.env.local` に以下の環境変数を設定：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **開発サーバーの起動**
```bash
npm run dev
# または
yarn dev
```

5. **ブラウザでアクセス**
[http://localhost:3000](http://localhost:3000) を開く

## 📊 データベース設定

### Supabase セットアップ

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. `supabase/migrations/` のSQLファイルを順番に実行
3. Row Level Security (RLS) ポリシーの設定

### 主要テーブル
- `users` - ユーザー情報
- `user_settings` - ユーザー設定
- `tasks` - タスクデータ
- `task_categories` - タスクカテゴリ

## 🧪 テスト

```bash
# テストの実行
npm run test

# E2Eテストの実行
npm run test:e2e
```

## 🚀 デプロイ

### Vercel へのデプロイ

1. [Vercel](https://vercel.com) でプロジェクトをインポート
2. 環境変数を設定
3. 自動デプロイの設定

```bash
# Vercel CLI を使用
npm i -g vercel
vercel --prod
```

## 📚 ドキュメント

- [機能説明書](./StepEasyの開発/機能説明書/StepEasy機能説明書.md) - 詳細な機能説明
- [アーキテクチャ設計書](./StepEasyの開発/アーキテクチャ設計書/) - システム設計
- [事業計画書](./StepEasyの開発/事業計画書/) - プロダクト戦略

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📋 ロードマップ

### 2024年Q4
- [x] MVP機能の実装
- [x] 基本的なタスク管理機能
- [x] AIキャラクターサポート
- [x] 習慣継続機能

### 2025年Q1
- [ ] プレミアム機能の拡充
- [ ] AIサポートスタイル選択
- [ ] データエクスポート機能
- [ ] モバイルアプリ対応検討

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

- **Issue**: [GitHub Issues](https://github.com/your-username/step-easy/issues)
- **Email**: support@stepeasy.example.com

---

<div align="center">
  <p>Made with ❤️ by StepEasy Team</p>
  <p>© 2024 StepEasy. All rights reserved.</p>
</div>
