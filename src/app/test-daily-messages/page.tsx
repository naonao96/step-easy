'use client';

import { useState } from 'react';

export default function TestDailyMessagesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [envCheck, setEnvCheck] = useState<any>(null);

  const addDebug = (message: string) => {
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkEnvironment = async () => {
    try {
      addDebug('環境変数チェックを開始...');
      const response = await fetch('/api/trigger-daily-messages/check-env', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnvCheck(data);
        addDebug('環境変数チェック完了');
        addDebug(`Supabase URL: ${data.supabaseUrl}`);
        addDebug(`Gemini API Key: ${data.hasGeminiApiKey ? '設定済み' : '未設定'}`);
        addDebug(`Service Role Key: ${data.hasSupabaseServiceKey ? '設定済み' : '未設定'}`);
      } else {
        setEnvCheck({ error: 'Environment check endpoint not found' });
        addDebug('環境変数チェックエンドポイントが見つかりません');
      }
    } catch (err) {
      setEnvCheck({ error: 'Failed to check environment' });
      addDebug('環境変数チェックに失敗しました');
    }
  };

  const triggerDailyMessages = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setDebug([]);

    addDebug('ボタンがクリックされました');

    try {
      addDebug('APIリクエストを送信中...');
      
      const response = await fetch('/api/trigger-daily-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      addDebug(`レスポンス受信: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        addDebug(`エラーレスポンス: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      addDebug('JSONパース成功');
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addDebug(`エラー発生: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
      addDebug('処理完了');
    }
  };

  // 新しいEdgeFunction直接実行機能
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);
  const [edgeFunctionResult, setEdgeFunctionResult] = useState<any>(null);
  const [edgeFunctionError, setEdgeFunctionError] = useState<string | null>(null);

  const triggerEdgeFunction = async () => {
    setEdgeFunctionLoading(true);
    setEdgeFunctionError(null);
    setEdgeFunctionResult(null);
    setDebug([]);

    addDebug('🚀 EdgeFunction直接実行を開始...');

    try {
      // クライアントサイドでは環境変数にアクセスできないため、
      // サーバーサイドのAPIを経由してEdgeFunctionを呼び出す
      addDebug('サーバーサイドAPI経由でEdgeFunctionを呼び出し中...');
      
      const response = await fetch('/api/trigger-daily-messages/edge-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      addDebug(`EdgeFunctionレスポンス: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        addDebug(`EdgeFunctionエラーレスポンス: ${errorText}`);
        throw new Error(`EdgeFunction HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      addDebug('EdgeFunction JSONパース成功');
      setEdgeFunctionResult(data);
      addDebug(`処理完了: ${data.successCount || 0}件成功, ${data.errorCount || 0}件エラー`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addDebug(`EdgeFunctionエラー発生: ${errorMessage}`);
      setEdgeFunctionError(errorMessage);
    } finally {
      setEdgeFunctionLoading(false);
      addDebug('EdgeFunction処理完了');
    }
  };

  // 生成されたメッセージを確認する関数
  const [generatedMessages, setGeneratedMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // クイックメッセージ生成用の状態
  const [quickMessage, setQuickMessage] = useState<any>(null);
  const [loadingQuick, setLoadingQuick] = useState(false);

  const checkGeneratedMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch('/api/trigger-daily-messages/check-messages', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedMessages(data.messages || []);
      } else {
        setGeneratedMessages([]);
      }
    } catch (err) {
      console.error('Failed to check messages:', err);
      setGeneratedMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // クイック生成機能
  const generateQuickMessage = async (userType: 'free' | 'premium') => {
    setLoadingQuick(true);
    setQuickMessage(null);
    
    try {
      const response = await fetch('/api/generate-single-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType,
          userName: userType === 'premium' ? 'テストユーザー' : undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuickMessage(data);
      } else {
        const errorData = await response.json();
        setQuickMessage({ 
          success: false, 
          error: errorData.error || 'Failed to generate message' 
        });
      }
    } catch (err) {
      setQuickMessage({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    } finally {
      setLoadingQuick(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            📧 Daily Message Generator Test
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              このページは開発・テスト用です。手動でdaily messageの生成をトリガーできます。
            </p>

            <div className="mb-4 space-y-2">
              <button
                onClick={checkEnvironment}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔍 環境設定チェック
              </button>
              
              <button
                onClick={checkGeneratedMessages}
                disabled={loadingMessages}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loadingMessages ? '読み込み中...' : '📋 生成されたメッセージ確認'}
              </button>
              
              {/* クイック生成ボタン */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => generateQuickMessage('free')}
                  disabled={loadingQuick}
                  className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loadingQuick ? '生成中...' : '⚡ フリー版テスト'}
                </button>
                <button
                  onClick={() => generateQuickMessage('premium')}
                  disabled={loadingQuick}
                  className="py-2 px-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {loadingQuick ? '生成中...' : '⚡ プレミアム版テスト'}
                </button>
              </div>
              
              {envCheck && (
                <div className="mt-2 p-3 bg-gray-50 border rounded text-sm">
                  <pre>{JSON.stringify(envCheck, null, 2)}</pre>
                </div>
              )}
            </div>
            
            {/* 既存のAPI経由実行ボタン */}
            <button
              onClick={triggerDailyMessages}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-3 ${
                loading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : (
                '🚀 Daily Message生成を実行（API経由）'
              )}
            </button>

            {/* 新しいEdgeFunction直接実行ボタン */}
            <button
              onClick={triggerEdgeFunction}
              disabled={edgeFunctionLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                edgeFunctionLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {edgeFunctionLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  EdgeFunction実行中...
                </span>
              ) : (
                '🚀 EdgeFunction直接実行（DB保存まで）'
              )}
            </button>
          </div>

          {/* EdgeFunction実行結果表示 */}
          {edgeFunctionResult && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">✅ EdgeFunction実行成功</h3>
              <pre className="text-sm text-orange-700 whitespace-pre-wrap">
                {JSON.stringify(edgeFunctionResult, null, 2)}
              </pre>
            </div>
          )}

          {/* EdgeFunctionエラー表示 */}
          {edgeFunctionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ EdgeFunction実行エラー</h3>
              <pre className="text-red-700 whitespace-pre-wrap text-sm">{edgeFunctionError}</pre>
            </div>
          )}

          {/* 結果表示 */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ 成功</h3>
              <pre className="text-sm text-green-700 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ エラー</h3>
              <pre className="text-red-700 whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}

          {/* デバッグ情報 */}
          {debug.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">🔍 デバッグ情報</h3>
              <div className="text-sm text-blue-700 space-y-1">
                {debug.map((msg, index) => (
                  <div key={index} className="font-mono">{msg}</div>
                ))}
              </div>
            </div>
          )}

          {/* クイック生成結果表示 */}
          {quickMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${quickMessage.success ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className={`text-lg font-semibold mb-2 ${quickMessage.success ? 'text-blue-800' : 'text-red-800'}`}>
                {quickMessage.success ? '⚡ クイック生成結果' : '❌ 生成エラー'}
              </h3>
              {quickMessage.success ? (
                <div>
                  <p className="text-gray-800 mb-3 p-3 bg-white border rounded">
                    "{quickMessage.message}"
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>ユーザータイプ: {quickMessage.userType}</div>
                    <div>ユーザー名: {quickMessage.userName}</div>
                    <div>生成時刻: {new Date(quickMessage.generated_at).toLocaleString('ja-JP')}</div>
                    <div>DB保存: {quickMessage.savedToDb ? '✅ 成功' : '❌ 失敗（権限不足）'}</div>
                  </div>
                </div>
              ) : (
                <pre className="text-red-700 whitespace-pre-wrap text-sm">{quickMessage.error}</pre>
              )}
            </div>
          )}

          {/* 生成されたメッセージ表示 */}
          {generatedMessages.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 今日生成されたメッセージ</h3>
              <div className="space-y-3">
                {generatedMessages.map((msg, index) => (
                  <div key={index} className="p-3 bg-white border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-700">
                        {msg.user_name || 'ユーザー'} ({msg.user_type})
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.generated_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      "{msg.message}"
                    </p>
                    {msg.user_type === 'premium' && (
                      <div className="mt-2 text-xs text-gray-500">
                        統計: 今日 {msg.stats_today_completed}/{msg.stats_today_total} ({msg.stats_today_percentage}%), 
                        全体 {msg.stats_overall_percentage}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 環境変数チェック結果 */}
          {envCheck && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🔧 環境変数チェック結果</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>Node Environment:</div>
                  <div className={`font-mono ${envCheck.nodeEnv === 'development' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {envCheck.nodeEnv || 'Not set'}
                  </div>
                  
                  <div>Supabase URL:</div>
                  <div className={`font-mono ${envCheck.hasSupabaseUrl ? 'text-green-600' : 'text-red-600'}`}>
                    {envCheck.hasSupabaseUrl ? envCheck.supabaseUrl : 'Not set'}
                  </div>
                  
                  <div>Supabase Anon Key:</div>
                  <div className={`font-mono ${envCheck.hasSupabaseAnonKey ? 'text-green-600' : 'text-red-600'}`}>
                    {envCheck.hasSupabaseAnonKey ? 'Set' : 'Not set'}
                  </div>
                  
                  <div>Service Role Key:</div>
                  <div className={`font-mono ${envCheck.hasSupabaseServiceKey ? 'text-green-600' : 'text-yellow-600'}`}>
                    {envCheck.hasSupabaseServiceKey ? 'Set' : 'Not set'}
                  </div>
                  
                  <div>Gemini API Key:</div>
                  <div className={`font-mono ${envCheck.hasGeminiApiKey ? 'text-green-600' : 'text-red-600'}`}>
                    {envCheck.hasGeminiApiKey ? 'Set' : 'Not set'}
                  </div>
                </div>
                
                {!envCheck.hasGeminiApiKey && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                    <strong>⚠️ 重要な設定が不足しています:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>GEMINI_API_KEYが設定されていません</li>
                      <li>Google AI StudioでAPIキーを取得してください</li>
                      <li>.env.localファイルに設定を追加してください</li>
                    </ul>
                  </div>
                )}
                
                {!envCheck.hasSupabaseServiceKey && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                    <strong>⚠️ 推奨設定が不足しています:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>SUPABASE_SERVICE_ROLE_KEYが設定されていません</li>
                      <li>Supabaseダッシュボード → Settings → API で取得できます</li>
                      <li>完全な機能のためには設定を推奨します</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 説明 */}
          <div className="text-sm text-gray-500">
            <h4 className="font-medium mb-2">📝 このテストについて：</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>開発環境でのみ動作します</li>
              <li>認証が必要です（ログイン状態で実行）</li>
              <li>「API経由」: Next.js API Routes経由で実行</li>
              <li>「EdgeFunction直接実行」: Supabase EdgeFunctionを直接呼び出し（DB保存まで）</li>
              <li>成功すると全ユーザーのメッセージが生成されます（最大5人まで）</li>
              <li>各ユーザーに個別のパーソナライズされたメッセージが生成されます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 