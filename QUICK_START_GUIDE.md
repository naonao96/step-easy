# 🚀 StepEasy 環境分離 クイックスタートガイド

## 📋 概要
このガイドでは、StepEasyの環境分離を素早く設定する手順を説明します。

## ⚡ 5分で環境分離を完了

### Step 1: 環境設定ファイルの作成

```bash
# 開発環境用の設定ファイルを作成
npm run setup:dev

# 本番環境用の設定ファイルを作成
npm run setup:prod
```

### Step 2: 環境変数の設定

#### 開発環境 (`.env.development`)
```bash
# Supabase設定（開発プロジェクト）
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key

# AI設定
GEMINI_API_KEY=your_dev_gemini_api_key

# 環境設定
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEBUG_MODE=true
```

#### 本番環境 (`.env.production`)
```bash
# Supabase設定（本番プロジェクト）
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# AI設定
GEMINI_API_KEY=your_production_gemini_api_key

# 環境設定
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_DEBUG_MODE=false
```

### Step 3: 開発環境での動作確認

```bash
# 開発環境でアプリケーションを起動
npm run dev:development

# ブラウザで http://localhost:3000 にアクセス
# 正常に動作することを確認
```

### Step 4: 本番環境へのデプロイ

```bash
# 本番環境にデプロイ
npm run deploy:prod

# または手動で段階的にデプロイ
npm run db:push:prod        # データベースマイグレーション
npm run functions:deploy:prod # Edge Functionデプロイ
npm run build:production    # アプリケーションビルド
```

## 🔧 日常的な開発フロー

### 機能開発
```bash
# 1. 開発ブランチを作成
git checkout -b feature/new-feature

# 2. 開発環境で開発
npm run dev:development

# 3. テスト・コミット
npm run lint
git add .
git commit -m "feat: add new feature"

# 4. プルリクエスト作成
git push origin feature/new-feature
```

### 本番リリース
```bash
# 1. リリースブランチを作成
git checkout -b release/v1.1.0

# 2. 最終テスト
npm run build:production
npm run lint

# 3. 本番デプロイ
npm run deploy:prod

# 4. タグ付け
git tag v1.1.0
git push origin v1.1.0
```

## 🛠️ 便利なコマンド

### 環境別コマンド
```bash
# 開発環境
npm run dev:development      # 開発サーバー起動
npm run build:development    # 開発環境用ビルド
npm run db:push:dev         # 開発DBマイグレーション
npm run functions:deploy:dev # 開発Edge Functionデプロイ

# 本番環境
npm run dev:production       # 本番設定で開発サーバー起動
npm run build:production     # 本番環境用ビルド
npm run db:push:prod        # 本番DBマイグレーション
npm run functions:deploy:prod # 本番Edge Functionデプロイ
```

### デプロイコマンド
```bash
# 一括デプロイ
npm run deploy:dev          # 開発環境にデプロイ
npm run deploy:prod         # 本番環境にデプロイ

# 手動デプロイ
./scripts/deploy.sh development  # 開発環境
./scripts/deploy.sh production   # 本番環境
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. 環境変数エラー
```bash
# エラー: Missing required environment variables
# 解決: .env.development または .env.production を確認
cat .env.development
```

#### 2. Supabase接続エラー
```bash
# エラー: Failed to connect to Supabase
# 解決: プロジェクト参照IDを確認
npm run supabase:dev
npm run supabase:prod
```

#### 3. Edge Functionエラー
```bash
# エラー: Edge Function not found
# 解決: Edge Functionを再デプロイ
npm run functions:deploy:dev
npm run functions:deploy:prod
```

### ログの確認
```bash
# アプリケーションログ
npm run dev:development

# Supabaseログ
supabase functions logs generate-daily-messages

# Vercelログ
vercel logs
```

## 📊 環境別URL

### 開発環境
- **アプリケーション**: http://localhost:3000
- **Supabase**: https://your-dev-project-ref.supabase.co
- **Vercel**: https://dev-step-easy.vercel.app

### 本番環境
- **アプリケーション**: https://step-easy.vercel.app
- **Supabase**: https://your-production-project-ref.supabase.co
- **Vercel**: https://step-easy.vercel.app

## ✅ 完了チェックリスト

### 初期設定
- [ ] 環境設定ファイルの作成
- [ ] 環境変数の設定
- [ ] 開発環境での動作確認
- [ ] 本番環境の準備

### デプロイ
- [ ] データベースマイグレーション
- [ ] Edge Functionデプロイ
- [ ] アプリケーションデプロイ
- [ ] 動作確認

### 継続的開発
- [ ] ブランチ戦略の理解
- [ ] 開発ワークフローの確立
- [ ] デプロイプロセスの理解

## 📞 サポート

問題が発生した場合は、以下のドキュメントを参照してください：

- [環境分離ガイド](./ENVIRONMENT_SEPARATION_GUIDE.md)
- [本番環境マイグレーションガイド](./PRODUCTION_MIGRATION_GUIDE.md)
- [Edge Function設定ガイド](./EDGE_FUNCTION_SETUP.md)

**緊急時連絡先**: stepeasytasks@gmail.com

---

**注意**: 
- 本番環境へのデプロイは慎重に行ってください
- 必ず開発環境でテストしてから本番環境にデプロイしてください
- 環境変数は機密情報なので、Gitにコミットしないでください 