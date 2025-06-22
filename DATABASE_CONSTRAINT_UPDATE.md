# 📊 Database Message Length Constraint Update

## 🎯 概要

`daily_messages`テーブルの`message`カラムに文字数制限（350文字）を追加し、無料・プレミアムユーザーのメッセージ長制限をデータベースレベルで強制します。

## 📝 変更内容

### データベース制約
- **制限前**: `message TEXT` (無制限)
- **制限後**: `message TEXT` + `CHECK (LENGTH(message) <= 350)`

### 文字数設計
- **フリーユーザー**: 100文字目標 → 200文字バッファ → 350文字上限
- **プレミアムユーザー**: 200文字目標 → 300文字バッファ → 350文字上限
- **安全マージン**: 50文字 (300→350文字)

## 🚀 実行手順

### 1. 既存データの確認
```sql
-- 現在のメッセージ文字数分布を確認
SELECT 
  user_type,
  COUNT(*) as message_count,
  MIN(LENGTH(message)) as min_length,
  MAX(LENGTH(message)) as max_length,
  AVG(LENGTH(message))::INTEGER as avg_length
FROM daily_messages 
GROUP BY user_type
ORDER BY user_type;

-- 350文字超のメッセージがあるかチェック
SELECT COUNT(*) as over_limit_count
FROM daily_messages 
WHERE LENGTH(message) > 350;
```

### 2. マイグレーション実行
```bash
# Supabase環境で実行
supabase db push
```

または、手動でSQL実行：
```sql
-- messageカラムに文字数制限を追加
ALTER TABLE daily_messages 
ADD CONSTRAINT daily_messages_message_length_check 
CHECK (LENGTH(message) <= 350);

-- コメント追加
COMMENT ON COLUMN daily_messages.message IS 'AI生成メッセージ（最大350文字）: フリーユーザー100文字目標（200文字バッファ）、プレミアムユーザー200文字目標（300文字バッファ）';
```

### 3. 実行後の確認
```sql
-- 制約が追加されたことを確認
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'daily_messages'::regclass 
AND conname LIKE '%message%';
```

## ⚠️ 注意事項

### 既存データの影響
- 既存の350文字超メッセージがある場合、制約追加が失敗します
- その場合は事前にデータクリーンアップが必要です

### 対処法（350文字超がある場合）
```sql
-- 350文字超のメッセージを強制短縮
UPDATE daily_messages 
SET message = LEFT(message, 347) || '...'
WHERE LENGTH(message) > 350;
```

## 🔄 ロールバック手順

制約が問題を起こした場合：
```sql
-- 制約を削除
ALTER TABLE daily_messages 
DROP CONSTRAINT IF EXISTS daily_messages_message_length_check;
```

## 🎯 効果

### セキュリティ向上
- データベースレベルでの文字数制限強制
- 予期しない長文メッセージの防止

### パフォーマンス向上
- インデックス効率の向上
- メモリ使用量の予測可能性

### 一貫性確保
- API制限とデータベース制限の整合性
- フロントエンド表示の安定性

## 📊 監視

制約追加後、以下を定期的に監視：
```sql
-- 制約違反の監視
SELECT COUNT(*) as violations
FROM daily_messages 
WHERE LENGTH(message) > 350;

-- 平均文字数の推移
SELECT 
  DATE(generated_at) as date,
  user_type,
  AVG(LENGTH(message))::INTEGER as avg_length
FROM daily_messages 
WHERE generated_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(generated_at), user_type
ORDER BY date DESC, user_type;
``` 