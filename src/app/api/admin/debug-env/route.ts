import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 本番環境ではデバッグAPIを無効化
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: '本番環境では利用できません' }, { status: 403 });
    }

    // 管理者キーが設定されているかチェック（最小限の情報のみ）
    const hasAdminKey = !!process.env.ADMIN_SECRET_KEY;

    return NextResponse.json({
      success: true,
      debug: {
        hasAdminKey,
        nodeEnv: process.env.NODE_ENV,
        // 機密情報のキー名は露出しない
        envCount: Object.keys(process.env).length
      }
    });

  } catch (error) {
    console.error('デバッグエラー:', error);
    return NextResponse.json({ error: 'デバッグ情報の取得に失敗しました' }, { status: 500 });
  }
} 