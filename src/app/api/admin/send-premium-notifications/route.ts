import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 管理者認証用の秘密キー
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

interface NotificationRequest {
  subject: string;
  message: string;
  features?: string[];
}

interface Recipient {
  email: string;
  interested_features: string[];
  users: {
    display_name: string;
  };
}

// メール送信関数
async function sendReleaseEmail(params: {
  to: string;
  subject: string;
  message: string;
  userName: string;
  interestedFeatures: string[];
}) {
  console.log('📧 メール送信:', {
    to: params.to,
    subject: params.subject,
    userName: params.userName,
    interestedFeatures: params.interestedFeatures
  });
  
  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    // 1. 管理者認証
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin credentials' }, 
        { status: 401 }
      );
    }

    // 2. リクエストボディの検証
    const body: NotificationRequest = await request.json();
    const { subject, message, features = [] } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // 3. Supabase Admin Client（Service Role Key使用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. 通知対象者取得
    const { data: recipients, error } = await supabase
      .from('premium_waitlist')
      .select(`
        email,
        interested_features,
        users!inner(display_name)
      `)
      .eq('notification_enabled', true);

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({
        message: 'No recipients found',
        sent: 0,
        failed: 0,
        total: 0
      });
    }

    console.log(`📊 通知対象者: ${recipients.length}名`);

    // 5. メール送信処理
    const results = await Promise.all(
      recipients.map(async (recipient: any) => {
        try {
          await sendReleaseEmail({
            to: recipient.email,
            subject,
            message,
            userName: (recipient as any).users.display_name,
            interestedFeatures: recipient.interested_features
          });
          
          return { 
            email: recipient.email, 
            success: true,
            userName: recipient.users.display_name
          };
        } catch (err) {
          console.error(`メール送信エラー (${recipient.email}):`, err);
          return { 
            email: recipient.email, 
            success: false, 
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }
      })
    );

    // 6. 結果集計
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const failedEmails = results.filter(r => !r.success);

    console.log(`✅ 送信完了: ${successful}件成功, ${failed}件失敗`);

    return NextResponse.json({
      message: 'Notification sending completed',
      sent: successful,
      failed,
      total: recipients.length,
      timestamp: new Date().toISOString(),
      failedEmails: failed > 0 ? failedEmails : undefined
    });

  } catch (error) {
    console.error('❌ Notification send error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET メソッドで通知対象者数を確認
export async function GET(request: NextRequest) {
  try {
    // 管理者認証
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 通知対象者数を取得
    const { count, error } = await supabase
      .from('premium_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('notification_enabled', true);

    if (error) throw error;

    return NextResponse.json({
      recipientCount: count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get recipients error:', error);
    return NextResponse.json(
      { error: 'Failed to get recipient count' },
      { status: 500 }
    );
  }
} 