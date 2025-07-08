import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // サーバーサイドで環境変数にアクセス
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: '必要な環境変数が設定されていません。Supabase URLとService Role Keyを確認してください。' },
        { status: 500 }
      );
    }

    console.log('EdgeFunction直接呼び出しを開始...');
    console.log('Supabase URL:', supabaseUrl ? '設定済み' : '未設定');
    console.log('Service Role Key:', serviceRoleKey ? '設定済み' : '未設定');

    // EdgeFunction URL構築
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-daily-messages`;
    console.log('EdgeFunction URL:', edgeFunctionUrl);

    // EdgeFunctionに直接リクエスト
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`EdgeFunctionレスポンス: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EdgeFunctionエラー:', errorText);
      return NextResponse.json(
        { error: `EdgeFunction HTTP ${response.status}: ${response.statusText}\n${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('EdgeFunction実行成功:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('EdgeFunction呼び出しエラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 