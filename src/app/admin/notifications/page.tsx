'use client';

import React, { useState, useEffect } from 'react';
import { FaBell, FaUsers, FaEnvelope, FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface NotificationResult {
  message: string;
  sent: number;
  failed: number;
  total: number;
  timestamp: string;
  failedEmails?: Array<{
    email: string;
    error: string;
  }>;
}

interface RecipientInfo {
  recipientCount: number;
  timestamp: string;
}

export default function AdminNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NotificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // 管理者認証キー（環境変数から取得）
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;

  // 通知対象者数を取得
  const fetchRecipientCount = async () => {
    if (!adminSecret) {
      setError('管理者認証キーが設定されていません');
      return;
    }

    setLoadingRecipients(true);
    try {
      const response = await fetch('/api/admin/send-premium-notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RecipientInfo = await response.json();
      setRecipientInfo(data);
    } catch (err) {
      console.error('通知対象者取得エラー:', err);
      setError(err instanceof Error ? err.message : '通知対象者の取得に失敗しました');
    } finally {
      setLoadingRecipients(false);
    }
  };

  // ページ読み込み時に通知対象者数を取得
  useEffect(() => {
    fetchRecipientCount();
  }, []);

  // リリース通知送信
  const sendNotifications = async () => {
    if (!adminSecret) {
      setError('管理者認証キーが設定されていません');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-premium-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSecret}`
        },
        body: JSON.stringify({
          subject: 'StepEasy プレミアム機能 ベータ版リリース！',
          message: `
StepEasyをご利用いただき、ありがとうございます！

お待たせいたしました！StepEasyプレミアム機能のベータ版がついにリリースされました🎉

🚀 新機能のご紹介:
✨ 週次・月次詳細レポート - あなたの成長を可視化
🤖 AI専属コーチ強化 - より深い分析とアドバイス
🧠 行動パターン分析 - 最適な習慣形成をサポート
📈 成長の可視化 - 進歩を実感できるグラフ表示

今すぐログインして、新しい機能をお試しください！
${process.env.NEXT_PUBLIC_SITE_URL || 'https://step-easy.vercel.app'}/login

ベータ版期間中は特別価格でご提供いたします。
ご質問やフィードバックがございましたら、お気軽にお知らせください。

StepEasyチーム
          `,
          features: ['analytics', 'ai_coach', 'pattern_analysis', 'growth_visualization']
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: NotificationResult = await response.json();
      setResult(data);
      
      // 成功時は通知対象者数を再取得
      if (data.sent > 0) {
        await fetchRecipientCount();
      }

    } catch (err) {
      console.error('通知送信エラー:', err);
      setError(err instanceof Error ? err.message : '通知の送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {FaBell ({className:"w-6 h-6 text-blue-600"})}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">プレミアム機能リリース通知</h1>
              <p className="text-gray-600">登録ユーザーにベータ版リリースをお知らせします</p>
            </div>
          </div>

          {/* 通知対象者情報 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {FaUsers ({className:"w-4 h-4 text-blue-600"})}
              <span className="font-medium text-blue-900">通知対象者</span>
              {loadingRecipients && FaSpinner ({className:"w-4 h-4 text-blue-600 animate-spin"})}
            </div>
            {recipientInfo ? (
              <p className="text-blue-800">
                {recipientInfo.recipientCount}名のユーザーが通知を受け取ります
              </p>
            ) : (
              <p className="text-blue-600">読み込み中...</p>
            )}
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={sendNotifications}
            disabled={isLoading || !recipientInfo}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                {FaSpinner ({className:"w-5 h-5 animate-spin"})}
                <span>送信中...</span>
              </>
            ) : (
              <>
                {FaEnvelope ({className:"w-5 h-5"})}
                <span>リリース通知を送信</span>
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-3">
            ※ この操作は取り消すことができません。慎重に実行してください。
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              {FaExclamationTriangle ({className:"w-4 h-4 text-red-600"})}
              <span className="font-medium text-red-900">エラー</span>
            </div>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 送信結果 */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              {FaCheck ({className:"w-5 h-5 text-green-600"})}
              <h2 className="text-lg font-semibold text-gray-900">送信結果</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">{result.sent}</div>
                <div className="text-sm text-green-700">送信成功</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-900">{result.failed}</div>
                <div className="text-sm text-red-700">送信失敗</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">{result.total}</div>
                <div className="text-sm text-blue-700">総対象者数</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              送信完了時刻: {new Date(result.timestamp).toLocaleString('ja-JP')}
            </div>

            {/* 失敗したメール一覧 */}
            {result.failedEmails && result.failedEmails.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2">送信失敗一覧</h3>
                <div className="space-y-2">
                  {result.failedEmails.map((failed, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-red-800">{failed.email}</span>
                      <span className="text-red-600 ml-2">- {failed.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 使用方法 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">使用方法</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. 通知対象者数を確認してください</p>
            <p>2. 「リリース通知を送信」ボタンをクリックします</p>
            <p>3. 送信結果を確認し、必要に応じて失敗したメールを個別対応してください</p>
          </div>
        </div>
      </div>
    </div>
  );
} 