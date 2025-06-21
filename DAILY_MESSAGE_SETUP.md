# 📘 StepEasy Daily Message System セットアップガイド

## 🎯 概要

StepEasyにおいて、Gemini APIの利用制限とコスト削減の観点から、ユーザーごとのAI応援メッセージ生成を「1日1回の定時実行」に変更しました。

- **実行時間**: 毎朝9時（JST）
- **保存先**: Supabase `daily_messages` テーブル
- **表示**: ホーム画面のキャラクターメッセージエリア
- **既存機能**: 全てのプロンプトと感情分析機能を保持

---

## 🛠️ セットアップ手順

### 1. データベースマイグレーション実行

```bash
# 新しいテーブルとスケジューラーを作成
supabase db push
```

### 2. Edge Function デプロイ

```bash
# Edge Functionをデプロイ
supabase functions deploy generate-daily-messages
```

### 3. 環境変数設定

Supabaseダッシュボードで以下の環境変数を設定：

```
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Cron Job設定の調整

`supabase/migrations/20240320000007_setup_daily_message_scheduler.sql` で、
URLを実際のプロジェクトURLに変更：

```sql
-- your-project-ref を実際のプロジェクト参照に変更
'https://your-project-ref.supabase.co/functions/v1/generate-daily-messages'
```

---

## 🔄 動作フロー

### 毎朝9時の自動実行
1. **Supabase Cron Job** が Edge Function を呼び出し
2. **Edge Function** が全ユーザーのデータを取得
3. **Gemini API** でユーザー別にメッセージ生成
4. **daily_messages テーブル** に保存

### フロントエンドでの表示
1. **useCharacterMessage Hook** がDBからメッセージ取得
2. メッセージが見つからない場合は既存API呼び出しにフォールバック
3. **キャラクター表示エリア** にメッセージ表示

---

## 🧪 テスト方法

### 手動実行（開発環境のみ）

```bash
# 開発サーバーを起動
npm run dev

# 手動トリガーAPI呼び出し
curl -X POST http://localhost:3000/api/trigger-daily-messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token"
```

### データベース直接確認

```sql
-- 生成されたメッセージ確認
SELECT * FROM daily_messages 
ORDER BY generated_at DESC 
LIMIT 10;

-- Cron Job状態確認
SELECT * FROM daily_message_job_status;

-- 手動実行
SELECT trigger_daily_message_generation();
```

---

## 📊 既存機能の保持

### プロンプト機能
- ✅ **フリーユーザー**: 100文字以内の優しいメッセージ
- ✅ **プレミアムユーザー**: 200文字以内の詳細分析付きメッセージ
- ✅ **感情分析**: ストレス、モチベーション、進捗状況の分析
- ✅ **パーソナライゼーション**: ユーザー名、統計データ活用

### フォールバック機能
- ✅ **DB取得失敗時**: 既存API呼び出しにフォールバック
- ✅ **API失敗時**: 静的フォールバックメッセージ表示
- ✅ **ゲストユーザー**: 従来通りの静的メッセージ

---

## 🚀 将来の拡張予定

| 拡張項目 | 実装方法 |
|---------|----------|
| **夜のメッセージ** | `scheduled_type = 'evening'` で分岐 |
| **ユーザー指定時間** | user_settings テーブルに通知時間追加 |
| **キャラ吹き出し強化** | UI コンポーネント改良 |
| **感情履歴分析** | 過去のメッセージ反映 |

---

## 🔧 トラブルシューティング

### メッセージが生成されない場合

1. **Cron Job確認**:
   ```sql
   SELECT * FROM daily_message_job_status;
   ```

2. **Edge Function ログ確認**:
   Supabaseダッシュボード > Functions > Logs

3. **手動実行テスト**:
   ```sql
   SELECT trigger_daily_message_generation();
   ```

### フロントエンドでメッセージが表示されない場合

1. **ブラウザコンソール確認**
2. **ネットワークタブでAPI呼び出し確認**
3. **フォールバックメッセージが表示されているか確認**

---

## 📈 コスト削減効果

- **API呼び出し回数**: 1日あたりユーザー数分のみ（従来は無制限）
- **レート制限回避**: 定時実行により分散処理
- **キャッシュ効果**: 同一メッセージを1日中使用

---

## 🔐 セキュリティ

- **RLS有効**: ユーザーは自分のメッセージのみ閲覧可能
- **サービスロールキー**: Edge Function実行時のみ使用
- **開発限定API**: 本番環境では手動トリガー無効 