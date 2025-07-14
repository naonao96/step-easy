import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 管理者キーが設定されているかチェック
    const adminKey = process.env.ADMIN_SECRET_KEY;
    const hasAdminKey = !!adminKey;
    const adminKeyLength = adminKey ? adminKey.length : 0;
    const adminKeyPrefix = adminKey ? adminKey.substring(0, 8) + '...' : 'not set';

    return NextResponse.json({
      success: true,
      debug: {
        hasAdminKey,
        adminKeyLength,
        adminKeyPrefix,
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('ADMIN') || key.includes('SUPABASE'))
      }
    });

  } catch (error) {
    console.error('デバッグエラー:', error);
    return NextResponse.json({ error: 'デバッグ情報の取得に失敗しました' }, { status: 500 });
  }
} 