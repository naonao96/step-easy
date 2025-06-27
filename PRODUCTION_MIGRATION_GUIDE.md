# 🚀 StepEasy 本番環境マイグレーションガイド

## 📋 概要
このガイドでは、StepEasyアプリケーションを本番環境に安全に移行する手順を説明します。

## ✅ 事前準備

### 1. 本番環境プロジェクトの確認
```bash
# 本番環境プロジェクトが正しくリンクされているか確認
supabase projects list

# 本番環境プロジェクトにリンク
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
```

### 2. 環境変数の設定
本番環境のSupabaseダッシュボードで以下の環境変数を設定：
- `GEMINI_API_KEY`: Gemini APIキー
- `app.environment`: `production`
- `app.settings.project_ref`: 本番プロジェクトの参照ID
- `app.settings.service_role_key`: 本番環境のサービスロールキー

## 🔄 マイグレーション実行手順

### Step 1: 開発環境での最終テスト
```bash
# 開発環境でマイグレーションをテスト
supabase db reset
supabase db push

# アプリケーションが正常に動作することを確認
npm run dev
```

### Step 2: 本番環境への移行
```bash
# 本番環境プロジェクトにリンク
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF

# 本番環境にマイグレーションをプッシュ
supabase db push

# マイグレーションの実行状況を確認
supabase db diff
```

### Step 3: Edge Functionのデプロイ
```bash
# 本番環境にEdge Functionをデプロイ
supabase functions deploy generate-daily-messages --project-ref YOUR_PRODUCTION_PROJECT_REF
```

## 🛡️ 安全対策

### 1. バックアップの作成
```sql
-- 本番環境のデータをバックアップ
-- 以下のテーブルのデータをエクスポート
-- - users
-- - user_settings
-- - tasks
-- - daily_messages
-- - execution_logs
-- - active_executions
-- - premium_waitlist
```

### 2. 段階的デプロイ
1. **Phase 1**: データベースマイグレーションのみ実行
2. **Phase 2**: Edge Functionをデプロイ
3. **Phase 3**: フロントエンドアプリケーションをデプロイ

### 3. ロールバック手順
```bash
# 問題が発生した場合のロールバック
supabase db reset --linked
# または
supabase db push --dry-run
```

## 🔍 移行後の確認項目

### 1. データベース構造の確認
```sql
-- テーブルが正しく作成されているか確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- RLSポリシーが正しく設定されているか確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 2. CronJobの確認
```sql
-- CronJobが正しくスケジュールされているか確認
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname LIKE '%daily-messages%';
```

### 3. ユーザー登録機能のテスト
- 新規ユーザー登録が正常に動作するか
- `plan_type`カラムが正しく設定されるか
- 関連テーブルにデータが正しく挿入されるか

### 4. AIメッセージ機能のテスト
```bash
# 手動でメッセージ生成をテスト
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-messages \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scheduled": false, "environment": "production"}'
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. マイグレーションエラー
```bash
# エラーログを確認
supabase db push --debug

# 特定のマイグレーションをスキップ
supabase db push --include-all
```

#### 2. RLSポリシーエラー
```sql
-- RLSポリシーを手動で確認・修正
SELECT * FROM pg_policies WHERE tablename = 'daily_messages';

-- 必要に応じてポリシーを再作成
DROP POLICY IF EXISTS "daily_messages_authenticated_select" ON daily_messages;
CREATE POLICY "daily_messages_authenticated_select" ON daily_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

#### 3. CronJobエラー
```sql
-- CronJobの状態を確認
SELECT jobname, schedule, active, last_run, next_run 
FROM cron.job 
WHERE jobname LIKE '%daily-messages%';

-- CronJobを手動で実行
SELECT cron.run_job('generate-daily-messages-prod');
```

## 📞 サポート

問題が発生した場合は、以下の手順で対応：

1. **ログの確認**: Supabaseダッシュボードでログを確認
2. **バックアップからの復元**: 必要に応じてバックアップから復元
3. **開発チームへの連絡**: 重大な問題の場合は開発チームに連絡

## ✅ 完了チェックリスト

- [ ] 本番環境プロジェクトが正しくリンクされている
- [ ] 環境変数が正しく設定されている
- [ ] マイグレーションが正常に実行された
- [ ] Edge Functionが正常にデプロイされた
- [ ] ユーザー登録機能が正常に動作する
- [ ] AIメッセージ機能が正常に動作する
- [ ] CronJobが正しくスケジュールされている
- [ ] アプリケーション全体が正常に動作する

---

**注意**: 本番環境への移行は慎重に行い、必ずバックアップを取得してから実行してください。 