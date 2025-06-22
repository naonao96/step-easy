# 🤖 AIメッセージ機能 セットアップガイド

## 🎯 概要

StepEasyのAIメッセージ機能が正常に動作するために必要な設定手順を説明します。

## ❌ 現在の問題

AIメッセージが表示されない主な原因：
1. **環境変数が設定されていない**
2. **Supabase Edge Functionがデプロイされていない**
3. **Gemini APIキーが設定されていない**

## 🛠️ セットアップ手順

### 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を追加：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Development Settings
NODE_ENV=development
```

#### 1.1 Supabase設定の取得

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** → **API** に移動
4. 以下の値をコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### 1.2 Gemini APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. **Create API Key** をクリック
4. 生成されたキーをコピー → `GEMINI_API_KEY`

### 2. Supabase CLIのインストール

#### Windows (PowerShell)
```powershell
# PowerShellを管理者として実行
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm https://get.scoop.sh | iex
scoop install supabase
```

#### 代替方法（手動ダウンロード）
1. [Supabase CLI Releases](https://github.com/supabase/cli/releases) にアクセス
2. `supabase_windows_amd64.exe` をダウンロード
3. ファイル名を `supabase.exe` に変更
4. システムPATHに追加

### 3. データベースマイグレーション

```bash
# Supabaseプロジェクトにログイン
supabase login

# プロジェクトをリンク
supabase link --project-ref your-project-ref

# マイグレーションを実行
supabase db push
```

### 4. Edge Functionのデプロイ

```bash
# Edge Functionをデプロイ
supabase functions deploy generate-daily-messages
```

### 5. 環境変数をSupabaseに設定

Supabaseダッシュボードで以下を設定：

1. **Settings** → **Edge Functions**
2. 以下の環境変数を追加：
   - `GEMINI_API_KEY` = your_gemini_api_key
   - `SUPABASE_SERVICE_ROLE_KEY` = your_service_role_key

## 🧪 テスト方法

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. テストページにアクセス

ブラウザで `http://localhost:3000/test-daily-messages` にアクセス

### 3. 環境変数チェック

「🔍 環境変数チェック」ボタンをクリックして設定状況を確認

### 4. 手動メッセージ生成

「🚀 Daily Message Generator 実行」ボタンをクリックしてテスト

## 🔍 トラブルシューティング

### 環境変数エラー

**症状**: 「GEMINI_API_KEYが設定されていません」エラー

**解決方法**:
1. `.env.local` ファイルが正しく作成されているか確認
2. 開発サーバーを再起動
3. 環境変数名のスペルミスがないか確認

### Supabase接続エラー

**症状**: 「Failed to fetch users」エラー

**解決方法**:
1. Supabase URLとキーが正しいか確認
2. プロジェクトが有効になっているか確認
3. RLSポリシーが正しく設定されているか確認

### Gemini APIエラー

**症状**: 「Missing Gemini API key」エラー

**解決方法**:
1. Google AI StudioでAPIキーが正しく生成されているか確認
2. APIキーが有効になっているか確認
3. クォータ制限に達していないか確認

## 📊 動作確認

### 正常に動作している場合

1. **環境変数チェック**: 全て緑色で表示
2. **手動生成**: 成功メッセージが表示
3. **メッセージ確認**: 生成されたメッセージが表示
4. **ホーム画面**: キャラクターがAIメッセージを表示

### フォールバック動作

環境変数が設定されていない場合：
- ゲストユーザー: 静的メッセージを表示
- 認証ユーザー: 統一されたフォールバックメッセージを表示

## 🚀 本番環境での設定

### 1. Vercel環境変数の設定

1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables**
4. 上記の環境変数を追加

### 2. Supabase本番環境の設定

1. Supabaseダッシュボードで本番プロジェクトを選択
2. Edge Functionの環境変数を設定
3. Cron Jobが正しく設定されているか確認

## 📝 注意事項

- **APIキーの管理**: 環境変数ファイルはGitにコミットしない
- **クォータ制限**: Gemini APIの使用量を監視
- **セキュリティ**: Service Role Keyは機密情報として扱う
- **バックアップ**: 重要な設定は安全な場所にバックアップ

## 🆘 サポート

問題が解決しない場合：

1. ブラウザの開発者ツールでコンソールエラーを確認
2. テストページのデバッグ情報を確認
3. Supabaseダッシュボードのログを確認
4. 必要に応じて開発チームに相談 