# 🚀 StepEasy 環境分離・本番切り替えガイド

## 📋 概要
このガイドでは、StepEasyアプリケーションの本番環境への切り替えと、今後の開発・本番環境の完全分離を実現するための包括的な手順を説明します。

## 🎯 目標
- **本番環境への安全な切り替え**
- **開発・本番環境の完全分離**
- **継続的な開発・デプロイメントの確立**
- **データの安全性確保**

---

## 🔧 現在の環境構成

### 使用ツール
- **フロントエンド**: Next.js (Vercel)
- **バックエンド**: Supabase (Database, Auth, Edge Functions)
- **AI機能**: Google Gemini API
- **PWA**: next-pwa

### 現在の問題点
1. 環境変数の一元管理
2. 開発・本番環境の混在
3. データベースの環境分離
4. Edge Functionの環境分離

---

## 🚀 本番環境切り替え手順

### Phase 1: 本番環境プロジェクトの準備

#### 1.1 Supabase本番プロジェクトの作成
```bash
# 本番環境プロジェクトを作成
# https://supabase.com/dashboard で新規プロジェクト作成
# プロジェクト名: step-easy-production
# データベースパスワード: 強力なパスワードを設定
```

#### 1.2 本番環境プロジェクトの設定
```bash
# 本番環境プロジェクトにリンク
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF

# 本番環境の設定を確認
supabase projects list
```

#### 1.3 本番環境の環境変数設定
Supabaseダッシュボード → Settings → Edge Functions で以下を設定：

```bash
# 必須環境変数
GEMINI_API_KEY=your_production_gemini_api_key
ENVIRONMENT=production
NODE_ENV=production
APP_ENV=production
PROJECT_REF=your_production_project_ref
SERVICE_ROLE_KEY=your_production_service_role_key

# 追加設定
APP_NAME=StepEasy
APP_VERSION=1.0.0
```

### Phase 2: データベースマイグレーション

#### 2.1 開発環境での最終テスト
```bash
# 開発環境でマイグレーションをテスト
supabase db reset
supabase db push

# アプリケーションが正常に動作することを確認
npm run dev
```

#### 2.2 本番環境へのマイグレーション
```bash
# 本番環境プロジェクトにリンク
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF

# 本番環境にマイグレーションをプッシュ
supabase db push

# マイグレーションの実行状況を確認
supabase db diff
```

#### 2.3 本番環境の初期データ設定
```sql
-- 本番環境で必要な初期データを設定
-- カテゴリ、設定値など
INSERT INTO task_categories (name, color, icon) VALUES 
('仕事', '#3B82F6', '💼'),
('プライベート', '#10B981', '🏠'),
('学習', '#F59E0B', '📚'),
('健康', '#EF4444', '💪'),
('その他', '#6B7280', '📝');
```

### Phase 3: Edge Functionのデプロイ

#### 3.1 本番環境Edge Functionのデプロイ
```bash
# 本番環境にEdge Functionをデプロイ
supabase functions deploy generate-daily-messages --project-ref YOUR_PRODUCTION_PROJECT_REF

# デプロイ状況を確認
supabase functions list --project-ref YOUR_PRODUCTION_PROJECT_REF
```

#### 3.2 CronJobの設定
```sql
-- 本番環境でCronJobを設定
SELECT cron.schedule(
  'generate-daily-messages-prod',
  '0 0 * * *', -- 毎日午前0時（UTC）
  'SELECT generate_daily_messages();'
);
```

### Phase 4: Vercel本番環境の設定

#### 4.1 Vercelプロジェクトの設定
```bash
# Vercel CLIでログイン
vercel login

# 本番環境のプロジェクトを設定
vercel --prod
```

#### 4.2 Vercel環境変数の設定
Vercelダッシュボード → Settings → Environment Variables で以下を設定：

```bash
# 本番環境変数
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
GEMINI_API_KEY=your_production_gemini_api_key
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

---

## 🔄 開発・本番環境分離戦略

### 1. ブランチ戦略

#### 1.1 Git Flow の採用
```bash
# メインブランチ構成
main          # 本番環境（本番リリース用）
develop       # 開発環境（統合テスト用）
feature/*     # 機能開発用
hotfix/*      # 緊急修正用
release/*     # リリース準備用
```

#### 1.2 ブランチ命名規則
```bash
# 機能開発
git checkout -b feature/user-authentication
git checkout -b feature/premium-features

# バグ修正
git checkout -b fix/login-error
git checkout -b fix/data-sync-issue

# 緊急修正
git checkout -b hotfix/security-patch
```

### 2. 環境別設定ファイル

#### 2.1 環境変数ファイルの分離
```bash
# 開発環境
.env.development
.env.local (開発者固有)

# 本番環境
.env.production
.env.vercel (Vercel用)
```

#### 2.2 環境別設定ファイルの作成

**`.env.development`**
```bash
# 開発環境設定
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
GEMINI_API_KEY=your_dev_gemini_api_key
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**`.env.production`**
```bash
# 本番環境設定
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
GEMINI_API_KEY=your_production_gemini_api_key
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Supabase環境分離

#### 3.1 プロジェクト分離
```bash
# 開発環境プロジェクト
supabase link --project-ref YOUR_DEV_PROJECT_REF

# 本番環境プロジェクト
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
```

#### 3.2 環境別マイグレーション管理
```bash
# 開発環境でのマイグレーション
supabase db push --project-ref YOUR_DEV_PROJECT_REF

# 本番環境でのマイグレーション
supabase db push --project-ref YOUR_PRODUCTION_PROJECT_REF
```

### 4. Vercel環境分離

#### 4.1 プレビュー環境の活用
```bash
# 開発ブランチのプレビューデプロイ
vercel --target preview

# 本番ブランチの本番デプロイ
vercel --target production
```

#### 4.2 環境別ドメイン設定
```bash
# 開発環境
dev-step-easy.vercel.app

# 本番環境
step-easy.vercel.app
```

---

## 🛠️ 開発ワークフロー

### 1. 日常的な開発フロー

#### 1.1 機能開発
```bash
# 1. 開発ブランチを作成
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. 開発・テスト
npm run dev
# 開発環境でテスト

# 3. コミット・プッシュ
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 4. プルリクエスト作成
# GitHubでプルリクエストを作成
# developブランチにマージ
```

#### 1.2 リリース準備
```bash
# 1. リリースブランチを作成
git checkout develop
git checkout -b release/v1.1.0

# 2. バージョン更新
npm version patch  # または minor, major

# 3. 最終テスト
npm run build
npm run test

# 4. プルリクエスト作成
# mainブランチにマージ
```

### 2. デプロイメントフロー

#### 2.1 開発環境デプロイ
```bash
# 自動デプロイ（developブランチ）
# Vercelが自動的にプレビュー環境にデプロイ

# 手動デプロイ
vercel --target preview
```

#### 2.2 本番環境デプロイ
```bash
# 自動デプロイ（mainブランチ）
# Vercelが自動的に本番環境にデプロイ

# 手動デプロイ
vercel --target production
```

### 3. データベース管理

#### 3.1 開発環境でのテスト
```bash
# 開発環境でマイグレーションをテスト
supabase link --project-ref YOUR_DEV_PROJECT_REF
supabase db push

# テストデータの投入
supabase db seed
```

#### 3.2 本番環境への適用
```bash
# 本番環境にマイグレーションを適用
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
supabase db push

# バックアップの作成
supabase db dump --project-ref YOUR_PRODUCTION_PROJECT_REF
```

---

## 🔒 セキュリティ・バックアップ戦略

### 1. データバックアップ

#### 1.1 自動バックアップ設定
```sql
-- Supabaseで自動バックアップを有効化
-- ダッシュボード → Settings → Database → Backups
```

#### 1.2 手動バックアップ
```bash
# 本番データのエクスポート
supabase db dump --project-ref YOUR_PRODUCTION_PROJECT_REF > backup_$(date +%Y%m%d).sql

# 特定テーブルのエクスポート
pg_dump -h your-host -U postgres -t users -t tasks your_database > users_tasks_backup.sql
```

### 2. 環境変数の管理

#### 2.1 機密情報の保護
```bash
# .gitignoreに追加
.env*
!.env.example

# 環境変数の暗号化
# Vercel、Supabaseで環境変数を暗号化して保存
```

#### 2.2 アクセス制御
```bash
# 本番環境へのアクセス制限
# 必要最小限の権限のみ付与
# 定期的な権限レビュー
```

---

## 📊 監視・ログ管理

### 1. アプリケーション監視

#### 1.1 Vercel Analytics
```bash
# Vercel Analyticsの有効化
# パフォーマンス、エラー率の監視
```

#### 1.2 Supabase監視
```bash
# Supabaseダッシュボードでの監視
# データベースパフォーマンス
# API使用量
```

### 2. ログ管理

#### 2.1 アプリケーションログ
```typescript
// 環境別ログレベル
const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

// 構造化ログ
console.log(JSON.stringify({
  level: 'info',
  message: 'User action',
  userId: user.id,
  action: 'task_create',
  timestamp: new Date().toISOString()
}));
```

#### 2.2 エラー監視
```typescript
// エラーハンドリング
try {
  // 処理
} catch (error) {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });
}
```

---

## 🚨 トラブルシューティング

### 1. よくある問題と解決方法

#### 1.1 環境変数エラー
```bash
# 問題: 環境変数が読み込まれない
# 解決: Vercel/Supabaseで環境変数を再設定
# 確認: アプリケーションで環境変数をログ出力
```

#### 1.2 データベース接続エラー
```bash
# 問題: 本番環境に接続できない
# 解決: プロジェクト参照IDを確認
# 確認: supabase projects list
```

#### 1.3 Edge Functionエラー
```bash
# 問題: Edge Functionが動作しない
# 解決: 環境変数を再設定
# 確認: supabase functions logs
```

### 2. ロールバック手順

#### 2.1 アプリケーションロールバック
```bash
# Vercelで前のバージョンにロールバック
vercel --target production --rollback

# またはGitHubでタグを指定
git checkout v1.0.0
vercel --target production
```

#### 2.2 データベースロールバック
```bash
# バックアップから復元
supabase db reset --project-ref YOUR_PRODUCTION_PROJECT_REF
psql -h your-host -U postgres -d your_database < backup_20241225.sql
```

---

## ✅ 完了チェックリスト

### 本番環境切り替え
- [ ] 本番環境Supabaseプロジェクトの作成
- [ ] 本番環境の環境変数設定
- [ ] データベースマイグレーションの実行
- [ ] Edge Functionのデプロイ
- [ ] Vercel本番環境の設定
- [ ] 本番環境での動作確認
- [ ] ユーザーデータの移行（必要に応じて）

### 環境分離
- [ ] 開発・本番環境の分離
- [ ] 環境別設定ファイルの作成
- [ ] ブランチ戦略の確立
- [ ] デプロイメントフローの設定
- [ ] バックアップ戦略の実装
- [ ] 監視・ログの設定
- [ ] セキュリティ設定の確認

### 継続的開発
- [ ] 開発ワークフローの確立
- [ ] テスト環境の整備
- [ ] コードレビュープロセスの設定
- [ ] ドキュメントの更新
- [ ] チームメンバーへの説明

---

## 📞 サポート・連絡先

### 緊急時連絡先
- **開発チーム**: naonao96
- **お問い合わせ**: stepeasytasks@gmail.com

### 参考ドキュメント
- [PRODUCTION_MIGRATION_GUIDE.md](./PRODUCTION_MIGRATION_GUIDE.md)
- [EDGE_FUNCTION_SETUP.md](./EDGE_FUNCTION_SETUP.md)
- [AI_MESSAGE_SETUP_GUIDE.md](./AI_MESSAGE_SETUP_GUIDE.md)

---

**注意**: 
- 本番環境への切り替えは慎重に行い、必ずバックアップを取得してから実行してください
- 環境分離後は、開発環境でのテストを徹底してから本番環境にデプロイしてください
- セキュリティ設定は定期的に見直し、最新のベストプラクティスに従ってください 