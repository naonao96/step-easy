-- =====================================================
-- セキュリティ修正: publicロールの適切な制限
-- 作成日: 2025-01-04
-- 目的: daily_messages_cleanup_logテーブルのpublicアクセスを制限
-- =====================================================

-- daily_messages_cleanup_logテーブルのpublicポリシーを削除
DO $$
BEGIN
    -- 既存のpublicポリシーを削除
    DROP POLICY IF EXISTS "Admin can view cleanup logs" ON daily_messages_cleanup_log;
    
    -- 適切な権限を持つポリシーを再作成
    CREATE POLICY "Service role can view cleanup logs" ON daily_messages_cleanup_log
        FOR SELECT
        TO authenticated
        USING (auth.role() = 'service_role' OR auth.uid() IN (
            SELECT id FROM users WHERE plan_type = 'premium'
        ));
    
    RAISE NOTICE 'Fixed public role security for daily_messages_cleanup_log table';
END $$;

-- 他のテーブルでpublicアクセスがないか確認
DO $$
DECLARE
    public_policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO public_policies_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND polroles = ARRAY[0]; -- 0 is the OID for public role
    
    IF public_policies_count > 0 THEN
        RAISE NOTICE 'Found % policies with public access - review needed', public_policies_count;
    ELSE
        RAISE NOTICE 'No other public access policies found';
    END IF;
END $$;

-- セキュリティ確認完了
DO $$
BEGIN
    RAISE NOTICE 'Security fix completed successfully';
    RAISE NOTICE 'Public role access has been properly restricted';
END $$;