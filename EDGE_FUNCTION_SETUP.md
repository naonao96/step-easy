# 🔧 Supabase Edge Functions設定ガイド

## 📋 概要
StepEasyのAIメッセージ機能（generate-daily-messages）のEdge Function設定手順

## ⚙️ 環境変数設定

### Supabaseダッシュボードでの設定手順

1. **ダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクトを選択

2. **Settings → Edge Functions に移動**
   - 左サイドバーから「Settings」をクリック
   - 「Edge Functions」を選択

3. **環境変数を追加**

#### 必須環境変数（SUPABASE_プレフィックス制限対応）
```bash
# Gemini API設定
GEMINI_API_KEY=your_gemini_api_key_here

# 環境判定（SUPABASE_プレフィックスを削除）
ENVIRONMENT=development  # または production
NODE_ENV=development     # または production
APP_ENV=development      # または production（SUPABASE_ENVの代替）

# プロジェクト設定（SUPABASE_プレフィックスを削除）
PROJECT_REF=your_project_ref          # SUPABASE_PROJECT_REFの代替
SERVICE_ROLE_KEY=your_service_role_key # SUPABASE_SERVICE_ROLE_KEYの代替
```

#### 開発環境用の設定例
```bash
GEMINI_API_KEY=AIzaSyC...your_actual_key
ENVIRONMENT=development
NODE_ENV=development
APP_ENV=development
PROJECT_REF=vcqumdrbalivowxggvmv
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 本番環境用の設定例
```bash
GEMINI_API_KEY=AIzaSyC...your_actual_key
ENVIRONMENT=production
NODE_ENV=production
APP_ENV=production
PROJECT_REF=your_production_project_ref
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Edge Functionのデプロイ

### 1. CLIでのデプロイ
```bash
# 開発環境
supabase functions deploy generate-daily-messages

# 本番環境（プロジェクト指定）
supabase functions deploy generate-daily-messages --project-ref your_production_project_ref
```

### 2. ダッシュボードでの確認
- **Edge Functions** → **generate-daily-messages** を選択
- ステータスが「Active」になっていることを確認
- ログでエラーがないことを確認

## 🔍 設定確認方法

### 1. 環境変数の確認
```bash
# CLIで環境変数を確認
supabase secrets list

# またはダッシュボードで確認
# Settings → Edge Functions → Environment Variables
```

### 2. 関数の動作確認
```bash
# 手動で関数をテスト
curl -X POST https://your-project-ref.supabase.co/functions/v1/generate-daily-messages \
  -H "Authorization: Bearer your_service_role_key" \
  -H "Content-Type: application/json" \
  -d '{"scheduled": false, "environment": "development"}'
```

### 3. ログの確認
- **Edge Functions** → **generate-daily-messages** → **Logs**
- 実行ログで環境変数が正しく読み込まれているか確認

## 🛡️ セキュリティ設定

### 1. 認証設定
```bash
# 関数の認証レベルを設定
supabase functions update generate-daily-messages --import-map ./import_map.json --no-verify-jwt
```

### 2. CORS設定
```typescript
// Edge Function内でCORSを設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## 📊 監視・ログ設定

### 1. ログレベルの設定
```typescript
// 環境別のログレベル
if (isDevelopment) {
  console.log('詳細なデバッグ情報');
} else if (isProduction) {
  console.log('重要なログのみ');
}
```

### 2. エラーハンドリング
```typescript
try {
  // メイン処理
} catch (error) {
  console.error('Error in generate-daily-messages:', error);
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500, headers: corsHeaders }
  );
}
```

## 🔄 環境別設定の切り替え

### 開発環境
```bash
# 開発環境の設定
ENVIRONMENT=development
NODE_ENV=development
APP_ENV=development
```

### 本番環境
```bash
# 本番環境の設定
ENVIRONMENT=production
NODE_ENV=production
APP_ENV=production
```

## ✅ 設定完了チェックリスト

- [ ] Gemini APIキーが正しく設定されている
- [ ] 環境変数（ENVIRONMENT, NODE_ENV, APP_ENV）が設定されている
- [ ] プロジェクト参照ID（PROJECT_REF）が正しく設定されている
- [ ] サービスロールキー（SERVICE_ROLE_KEY）が正しく設定されている
- [ ] Edge Functionが正常にデプロイされている
- [ ] 手動テストで関数が正常に動作する
- [ ] ログでエラーが発生していない
- [ ] CronJobが正しくスケジュールされている

## 🚨 トラブルシューティング

### よくある問題

#### 1. 環境変数が読み込まれない
```bash
# 環境変数を再設定
supabase secrets set GEMINI_API_KEY=your_new_key
supabase secrets set ENVIRONMENT=production
supabase secrets set APP_ENV=production
```

#### 2. 関数がデプロイされない
```bash
# 関数を再デプロイ
supabase functions deploy generate-daily-messages --no-verify-jwt
```

#### 3. 認証エラーが発生する
```bash
# サービスロールキーを確認
supabase projects api-keys --project-ref your_project_ref
```

#### 4. SUPABASE_プレフィックスエラー
```bash
# 正しい環境変数名を使用
# ❌ SUPABASE_PROJECT_REF
# ✅ PROJECT_REF

# ❌ SUPABASE_SERVICE_ROLE_KEY  
# ✅ SERVICE_ROLE_KEY

# ❌ SUPABASE_ENV
# ✅ APP_ENV
```

---

**注意**: 
- `SUPABASE_`プレフィックスは使用できません
- 本番環境では必ず適切なセキュリティ設定を行い、機密情報を保護してください 