import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      message, 
      priority = 'medium', 
      category = 'system', 
      targetUsers = 'all', // 'all' | 'premium' | 'free' | 'guest' | string[] (user IDs)
      adminKey 
    } = body;

    // 管理者キーの検証
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ 
        error: '管理者権限がありません'
      }, { status: 403 });
    }

    // 必須フィールドの検証
    if (!title || !message) {
      return NextResponse.json({ error: 'タイトルとメッセージは必須です' }, { status: 400 });
    }

    // 対象ユーザーを取得
    let targetUserIds: string[] = [];

    if (targetUsers === 'all') {
      // 全ユーザー
      const { data: users, error } = await supabase
        .from('users')
        .select('id');
      
      if (error) {
        console.error('ユーザー取得エラー:', error);
        return NextResponse.json({ error: 'ユーザー取得に失敗しました' }, { status: 500 });
      }
      
      targetUserIds = users.map(user => user.id);
    } else if (targetUsers === 'premium') {
      // プレミアムユーザーのみ
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('plan_type', 'premium');
      
      if (error) {
        console.error('プレミアムユーザー取得エラー:', error);
        return NextResponse.json({ error: 'プレミアムユーザー取得に失敗しました' }, { status: 500 });
      }
      
      targetUserIds = users.map(user => user.id);
    } else if (targetUsers === 'free') {
      // 無料ユーザーのみ
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('plan_type', 'free');
      
      if (error) {
        console.error('無料ユーザー取得エラー:', error);
        return NextResponse.json({ error: '無料ユーザー取得に失敗しました' }, { status: 500 });
      }
      
      targetUserIds = users.map(user => user.id);
    } else if (targetUsers === 'guest') {
      // ゲストユーザーのみ
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('plan_type', 'guest');
      
      if (error) {
        console.error('ゲストユーザー取得エラー:', error);
        return NextResponse.json({ error: 'ゲストユーザー取得に失敗しました' }, { status: 500 });
      }
      
      targetUserIds = users.map(user => user.id);
    } else if (Array.isArray(targetUsers)) {
      // 特定のユーザーID配列
      targetUserIds = targetUsers;
    } else {
      return NextResponse.json({ error: '無効な対象ユーザー指定です' }, { status: 400 });
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: '対象ユーザーが見つかりません' }, { status: 404 });
    }

    // 各ユーザーに通知を直接データベースに作成
    const results = await Promise.allSettled(
      targetUserIds.map(async (userId) => {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'system_info',
              title,
              message,
              priority,
              category: category as any,
              is_read: false,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (error) {
            console.error(`通知作成エラー (user: ${userId}):`, error);
            return { success: false, error: error.message };
          }
          
          return { success: true, data };
        } catch (err) {
          console.error(`通知作成エラー (user: ${userId}):`, err);
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      })
    );

    // 結果を集計
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `通知送信完了: ${successful}件成功, ${failed}件失敗`,
      totalUsers: targetUserIds.length,
      successful,
      failed
    });

  } catch (error) {
    console.error('管理者通知送信エラー:', error);
    return NextResponse.json({ error: '通知送信に失敗しました' }, { status: 500 });
  }
} 