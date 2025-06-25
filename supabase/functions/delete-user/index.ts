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
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.log('❌ Delete user error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
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
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 