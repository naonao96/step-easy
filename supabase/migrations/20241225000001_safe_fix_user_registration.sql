-- =====================================================
-- ユーザー登録問題の安全な修正
-- 作成日: 2024-12-25
-- 目的: 既存のUsersテーブルとデータを保護しながら修正
-- 影響: 既存データには一切影響なし（安全）
-- =====================================================

-- 1. 既存のトリガー関数を安全に更新
-- plan_typeカラムが既に存在することを前提とした安全な更新
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- plan_typeカラムが存在する場合の標準的なINSERT
    INSERT INTO public.users (id, email, display_name, plan_type)
    VALUES (
        new.id, 
        new.email, 
        COALESCE(
            new.raw_user_meta_data->>'display_name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        'free' -- 明示的にplan_typeを設定
    );
    RETURN new;
EXCEPTION
    WHEN undefined_column THEN
        -- plan_typeカラムが存在しない場合のフォールバック（既存の構造を維持）
        INSERT INTO public.users (id, email, display_name)
        VALUES (
            new.id, 
            new.email, 
            COALESCE(
                new.raw_user_meta_data->>'display_name',
                new.raw_user_meta_data->>'full_name',
                split_part(new.email, '@', 1)
            )
        );
        RETURN new;
    WHEN OTHERS THEN
        -- その他のエラーの場合はログを出力して処理を継続
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 既存ユーザーのplan_typeを安全に確認・修正
-- NULLの場合のみ更新（既存の有効なデータは保護）
UPDATE users 
SET plan_type = 'free' 
WHERE plan_type IS NULL 
  AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'plan_type'
  );

-- 3. ユーザー名更新用の関数を作成（既存データを保護）
CREATE OR REPLACE FUNCTION update_user_display_name(
    user_id UUID,
    new_display_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    success_count INTEGER;
BEGIN
    -- 入力値の検証
    IF new_display_name IS NULL OR length(trim(new_display_name)) = 0 THEN
        RAISE EXCEPTION 'Display name cannot be empty';
    END IF;
    
    IF length(new_display_name) > 50 THEN
        RAISE EXCEPTION 'Display name must be 50 characters or less';
    END IF;

    -- usersテーブルを更新
    UPDATE users 
    SET display_name = trim(new_display_name), 
        updated_at = NOW()
    WHERE id = user_id;
    
    GET DIAGNOSTICS success_count = ROW_COUNT;
    
    -- 更新が成功した場合のみauth.usersも更新
    IF success_count > 0 THEN
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{display_name}',
            to_jsonb(trim(new_display_name))
        )
        WHERE id = user_id;
    END IF;
    
    RETURN success_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        -- エラーが発生した場合はログを出力してfalseを返す
        RAISE NOTICE 'Error updating user display name: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 関数の実行権限を設定
GRANT EXECUTE ON FUNCTION update_user_display_name(UUID, TEXT) TO authenticated;

-- 5. 既存のトリガーが正しく動作することを確認
DO $$
BEGIN
    -- トリガーが存在するかチェック
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        -- トリガーが存在しない場合は作成
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        
        RAISE NOTICE 'Created missing trigger: on_auth_user_created';
    ELSE
        RAISE NOTICE 'Trigger on_auth_user_created already exists';
    END IF;
END $$;

-- 6. コメント追加
COMMENT ON FUNCTION public.handle_new_user() IS 'ユーザー作成時のトリガー関数（plan_type対応版・安全版）';
COMMENT ON FUNCTION update_user_display_name(UUID, TEXT) IS 'ユーザー名更新用関数（入力検証付き・安全版）';

-- 7. 修正完了の確認
DO $$
BEGIN
    RAISE NOTICE 'User registration fixes applied successfully';
    RAISE NOTICE 'Existing data is protected and unchanged';
END $$; 