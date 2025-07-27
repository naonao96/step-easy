import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// GET: ユーザーの通知を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = supabase
      .from('notifications')
      .select(`
        id, user_id, type, title, message, priority, category,
        is_read, created_at, read_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('通知取得エラー:', error);
      return NextResponse.json({ error: '通知の取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('通知取得エラー:', error);
    return NextResponse.json({ error: '通知の取得に失敗しました' }, { status: 500 });
  }
}

// POST: 通知を作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, priority = 'medium', category } = body;

    // 必須フィールドの検証
    if (!type || !title || !message) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        priority,
        category: category || getCategoryFromType(type),
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('通知作成エラー:', error);
      return NextResponse.json({ error: '通知の作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('通知作成エラー:', error);
    return NextResponse.json({ error: '通知の作成に失敗しました' }, { status: 500 });
  }
}

// PUT: 通知を更新（既読など）
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, is_read } = body;

    if (!notificationId) {
      return NextResponse.json({ error: '通知IDが必要です' }, { status: 400 });
    }

    const updateData: any = {};
    if (is_read !== undefined) {
      updateData.is_read = is_read;
      if (is_read) {
        updateData.read_at = new Date().toISOString();
      }
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('通知更新エラー:', error);
      return NextResponse.json({ error: '通知の更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('通知更新エラー:', error);
    return NextResponse.json({ error: '通知の更新に失敗しました' }, { status: 500 });
  }
}

// DELETE: 通知を削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: '通知IDが必要です' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('通知削除エラー:', error);
      return NextResponse.json({ error: '通知の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('通知削除エラー:', error);
    return NextResponse.json({ error: '通知の削除に失敗しました' }, { status: 500 });
  }
}

// 通知タイプからカテゴリを自動判定
function getCategoryFromType(type: string): string {
  if (type.startsWith('task_')) return 'task';
  if (type.startsWith('habit_')) return 'habit';
  if (type.startsWith('subscription_') || type === 'trial_ending' || type === 'trial_started') return 'subscription';
  if (type.startsWith('ai_')) return 'ai';
  if (type.startsWith('system_')) return 'system';
  return 'system';
} 