// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 環境変数からSupabaseプロジェクトURLとサービスロールキーを取得
// @ts-ignore
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Supabase URLまたはService Role Keyが設定されていません');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  console.log('🔍 Edge Function called');
  console.log('📡 Method:', req.method);
  console.log('🌐 URL:', req.url);
  
  // CORS設定を追加
  if (req.method === 'OPTIONS') {
    console.log('🔄 CORS preflight request');
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Authorizationヘッダーのチェック
  const authHeader = req.headers.get('authorization');
  console.log('🔐 Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader) {
    console.log('❌ Missing authorization header');
    return new Response(JSON.stringify({ 
      code: 401,
      message: 'Missing authorization header' 
    }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Bearer トークンの形式チェック
  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Invalid authorization header format');
    return new Response(JSON.stringify({ 
      code: 401,
      message: 'Invalid authorization header format' 
    }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('🔑 Token received:', token.substring(0, 20) + '...');

  // JWT認証の検証
  try {
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ JWT authentication failed:', authError);
      return new Response(JSON.stringify({ 
        code: 401,
        message: 'Invalid JWT token',
        details: authError 
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    console.log('✅ JWT authentication successful for user:', user.email);
  } catch (authError) {
    console.log('❌ JWT verification error:', authError);
    return new Response(JSON.stringify({ 
      code: 401,
      message: 'JWT verification failed',
      details: authError 
    }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let userId: string | undefined;
  try {
    const body = await req.json();
    userId = body.userId;
    console.log('🆔 User ID received:', userId);
    if (!userId) throw new Error('userId is required');
  } catch (e) {
    console.log('❌ Invalid request body:', e);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    console.log('🔐 Attempting to delete user:', userId);
    
    // 1. ユーザー存在確認
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError) {
      console.log('❌ User not found:', userError);
      return new Response(JSON.stringify({ 
        error: 'User not found',
        details: userError,
        userId: userId 
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    console.log('✅ User found:', userData.user?.email);

    // 2. 関連データを明示的に削除（念のため）
    const tables = ['execution_logs', 'active_executions', 'daily_messages', 'premium_waitlist', 'tasks', 'user_settings'];
    
    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (error) {
          console.log(`⚠️ ${table}削除エラー:`, error);
        } else {
          console.log(`✅ ${table}削除完了`);
        }
      } catch (e) {
        console.log(`❌ ${table}削除例外:`, e);
      }
    }

    // 3. usersテーブルから削除
    const { error: userTableError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userTableError) {
      console.log('❌ Users table deletion error:', userTableError);
    } else {
      console.log('✅ Users table deletion completed');
    }

    // 4. Authユーザー削除
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.log('❌ Delete user error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error,
        userId: userId 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    console.log('✅ User deleted successfully');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    console.log('❌ Unexpected error:', e);
    return new Response(JSON.stringify({ 
      error: e.message,
      details: e,
      userId: userId 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 