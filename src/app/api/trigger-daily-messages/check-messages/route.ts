import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Service Role Keyを使用してadmin権限でアクセス
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const today = new Date().toISOString().split('T')[0];

    // 今日生成されたメッセージを取得
    const { data: messages, error } = await supabase
      .from('daily_messages')
      .select('*')
      .eq('message_date', today)
      .eq('scheduled_type', 'morning')
      .order('generated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      count: messages?.length || 0,
      date: today,
      messages: messages || []
    });

  } catch (error) {
    console.error('Check messages failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 