import React from 'react';

export const PrivacyPolicyContent: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">プライバシーポリシー</h1>
          <div className="text-sm text-gray-600">
            <span>公開日：{new Date().toLocaleDateString('ja-JP')} | バージョン：Ver1.0.0</span>
          </div>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          {/* 第1条 定義 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第1条（定義）</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                本プライバシーポリシー（以下「本ポリシー」）は、naonao96（以下「当方」）が運営するタスク管理アプリケーション「StepEasy」（以下「本サービス」）において、
                ユーザーの個人情報をどのように収集、利用、管理するかについて定めるものです。
              </p>
              <p>
                本ポリシーにおいて「個人情報」とは、個人情報保護法に定める個人情報を指し、生存する個人に関する情報であって、
                当該情報に含まれる氏名、メールアドレス、その他の記述により特定の個人を識別できるもの、
                または個人識別符号が含まれるものを指します。
              </p>
            </div>
          </section>

          {/* 第2条 収集する情報 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第2条（収集する情報）</h2>
            <div className="space-y-4 text-gray-700">
              <p>当方は、ユーザーから以下の情報を収集する場合があります：</p>
              <div className="ml-6">
                <h3 className="font-medium mb-2">1. アカウント情報</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>メールアドレス</li>
                  <li>表示名（ユーザーが設定する名前）</li>
                  <li>パスワード（暗号化して保存）</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">2. サービス利用情報</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>作成したタスクの内容、カテゴリ、優先度</li>
                  <li>タスクの実行履歴、完了状況</li>
                  <li>アプリの使用統計情報</li>
                  <li>AIアシスタント機能との会話履歴</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">3. 技術情報</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>IPアドレス</li>
                  <li>ブラウザの種類とバージョン</li>
                  <li>デバイス情報</li>
                  <li>アクセス日時</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 第3条 利用目的 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第3条（利用目的）</h2>
            <div className="space-y-4 text-gray-700">
              <p>当方は、収集した個人情報を以下の目的で利用します：</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>本サービスの提供、運営、維持、改善</li>
                <li>ユーザーアカウントの管理と認証</li>
                <li>タスク管理機能、進捗追跡機能の提供</li>
                <li>AIによる個人化されたタスク提案とアドバイス</li>
                <li>サービスの利用状況分析と機能改善</li>
                <li>カスタマーサポートの提供</li>
                <li>重要なお知らせやサービス変更の通知</li>
                <li>不正利用の防止とセキュリティの確保</li>
              </ul>
            </div>
          </section>

          {/* 第4条 保存期間 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第4条（情報の保存期間）</h2>
            <div className="space-y-4 text-gray-700">
              <p>当方は、以下の期間、ユーザーの個人情報を保存します：</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2">
                  <li><strong>無料ユーザー：</strong> アカウント作成から30日間</li>
                  <li><strong>プレミアムユーザー：</strong> サブスクリプション有効期間中および解約後1年間</li>
                  <li><strong>ゲストユーザー：</strong> ブラウザセッション中のみ（ブラウザ終了と同時に削除）</li>
                </ul>
              </div>
              <p>
                ただし、法令により保存が義務付けられている場合（支払い履歴等）や、紛争解決のために必要な場合は、
                上記期間を超えて保存することがあります。
              </p>
              <p>
                <strong>支払い情報について：</strong> 法的要件により、支払い履歴は会計・税務目的で保持されます。
                これらは個人を特定できない形で保存され、GDPR削除要求の対象外となります。
              </p>
            </div>
          </section>

          {/* 第5条 第三者提供 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第5条（第三者への提供）</h2>
            <div className="space-y-4 text-gray-700">
              <p>当方は、以下の外部サービスと連携してサービスを提供しています：</p>
              <div className="ml-6">
                <h3 className="font-medium mb-2">1. データベース・認証基盤</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Supabase：</strong> ユーザーデータの保存、認証機能</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">2. 決済処理</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Stripe：</strong> プレミアム機能の課金処理</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">3. AI機能</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Google Gemini：</strong> AIアシスタント機能、タスク分析</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">4. ホスティング</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Vercel：</strong> アプリケーションの配信・運営</li>
                </ul>
              </div>
              <p className="mt-4">
                これらのサービスは、それぞれのプライバシーポリシーに従って個人情報を取り扱います。
                当方は、信頼できるサービスプロバイダーのみと連携し、適切なデータ保護措置を講じています。
              </p>
            </div>
          </section>

          {/* 第6条 Cookie等の利用 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第6条（Cookie等の利用）</h2>
            <div className="space-y-4 text-gray-700">
              <p>本サービスでは、以下の目的でCookieおよび類似技術を使用します：</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>ユーザー認証状態の維持</li>
                <li>ログイン情報の保存（JWTトークン）</li>
                <li>ユーザー設定の記憶</li>
                <li>サービス利用状況の分析</li>
              </ul>
              <p>
                ユーザーは、ブラウザの設定によりCookieを無効にすることができますが、
                その場合、本サービスの一部機能が利用できなくなる可能性があります。
              </p>
            </div>
          </section>

          {/* 第7条 ユーザーの権利 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第7条（ユーザーの権利）</h2>
            <div className="space-y-4 text-gray-700">
              <p>ユーザーは、自身の個人情報について以下の権利を有します：</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>開示請求：</strong> 保存されている個人情報の開示を求める権利</li>
                <li><strong>訂正・削除：</strong> 個人情報の訂正・削除を求める権利</li>
                <li><strong>利用停止：</strong> 個人情報の利用停止を求める権利</li>
                <li><strong>データポータビリティ：</strong> 個人情報の他サービスへの移行を求める権利</li>
              </ul>
              <p>
                これらの権利を行使したい場合は、本ポリシー末尾記載の連絡先までお問い合わせください。
                当方は、法令に従い、合理的な期間内に対応いたします。
              </p>
            </div>
          </section>

          {/* 第8条 本ポリシーの変更 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">第8条（本ポリシーの変更）</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                当方は、法令の変更やサービスの改善等に伴い、本ポリシーを変更することがあります。
                重要な変更については、本サービス内での通知またはメールにてユーザーにお知らせします。
              </p>
              <p>
                変更後のプライバシーポリシーは、本サービス内に掲載した時点で効力を生じるものとします。
              </p>
            </div>
          </section>

          {/* お問い合わせ */}
          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">お問い合わせ</h2>
            <div className="space-y-2 text-gray-700">
              <p>本ポリシーに関するお問い合わせは、以下までご連絡ください：</p>
              <div className="mt-4">
                <p><strong>運営者：</strong> naonao96</p>
                <p><strong>連絡先：</strong> stepeasytasks@gmail.com</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}; 