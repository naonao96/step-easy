'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CloudLayer } from '@/components/CloudLayer';
import { FaHome, FaFileContract, FaNewspaper } from 'react-icons/fa';

export const PrivacyPolicyContent: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-50 relative overflow-hidden">
      {/* 青空と雲の背景 */}
      <CloudLayer />
      
      {/* ヘッダー */}
      <header className="h-16 md:h-20 flex justify-between items-center px-4 sm:px-6 flex-shrink-0 bg-gradient-to-b from-[#f7ecd7] to-[#f5e9da] border-b border-[#deb887]/30 backdrop-blur-sm shadow-none fixed top-0 left-0 right-0 z-40 pt-safe">
        {/* 左側：ロゴ */}
        <div className="flex items-center gap-3">
          <div 
            className="cursor-pointer flex items-center gap-3"
            onClick={() => router.push('/menu')}
          >
            <img 
              src="/logo.png" 
              alt="StepEasy" 
              className="h-8 sm:h-10 w-auto"
              style={{ width: 'auto' }}
              loading="eager"
              decoding="sync"
            />
            <h1 className="text-lg sm:text-xl font-bold text-[#8b4513] truncate">
              プライバシーポリシー
            </h1>
          </div>
        </div>

        {/* 右側：ナビゲーションボタン */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/release-note')}
            className="p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 hover:scale-105"
            title="リリースノート"
          >
            {FaNewspaper({ className: "w-5 h-5" })}
          </button>
          <button
            onClick={() => router.push('/terms')}
            className="p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 hover:scale-105"
            title="利用規約"
          >
            {FaFileContract({ className: "w-5 h-5" })}
          </button>
          <button
            onClick={() => router.push('/lp')}
            className="p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 hover:scale-105"
            title="ホーム"
          >
            {FaHome({ className: "w-5 h-5" })}
          </button>
        </div>
      </header>
      
      <div className="relative z-20 py-8 pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/30">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#8b4513] mb-4">プライバシーポリシー</h1>
              <div className="text-sm text-[#7c5a2a]">
                <span>公開日：{new Date().toLocaleDateString('ja-JP')} | バージョン：Ver1.0.0</span>
          </div>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
              {/* 基本方針 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">基本方針</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>
                    naonao96（以下「当方」）は、タスク管理アプリケーション「StepEasy」（以下「本サービス」）において、
                    ユーザーの個人情報の保護を最重要事項と考えています。
              </p>
              <p>
                    本プライバシーポリシーでは、本サービスにおける個人情報の収集、利用、管理について定めています。
                    ユーザーは、本サービスを利用することにより、本プライバシーポリシーに同意したものとみなします。
              </p>
            </div>
          </section>

              {/* 事業者情報 */}
              <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">事業者情報</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <div className="bg-[#f5f5dc]/60 p-4 rounded-lg border border-[#deb887]/20">
                    <p><strong>運営者名：</strong> naonao96</p>
                    <p><strong>連絡先：</strong> stepeasytasks@gmail.com</p>
                    <p><strong>サービス名：</strong> StepEasy</p>
                    <p><strong>サービス内容：</strong> タスク管理アプリケーション</p>
                  </div>
                </div>
              </section>

              {/* 収集する情報 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">収集する情報</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>本サービスでは、以下の情報を収集します：</p>
                  
                  <h3 className="font-medium text-[#8b4513] mt-6 mb-3">1. アカウント情報（無料・プレミアムユーザー）</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>メールアドレス（認証・連絡用）</li>
                    <li>パスワード（ハッシュ化して保存）</li>
                    <li>ユーザー名（表示名）</li>
                    <li>アカウント作成日時</li>
                    <li>最終ログイン日時</li>
                  </ul>

                  <h3 className="font-medium text-[#8b4513] mt-6 mb-3">2. タスク・習慣データ</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>タスクのタイトル、説明、期限、優先度</li>
                    <li>タスクの実行履歴（開始・完了時刻）</li>
                    <li>習慣の設定情報</li>
                    <li>習慣の実行記録</li>
                    <li>感情記録（プレミアム機能）</li>
                  </ul>

                  <h3 className="font-medium text-[#8b4513] mt-6 mb-3">3. 利用統計情報</h3>
                <ul className="list-disc ml-6 space-y-1">
                    <li>ページビュー、機能利用回数</li>
                    <li>エラー発生時のログ</li>
                    <li>デバイス情報（ブラウザ、OS等）</li>
                    <li>IPアドレス（セキュリティ目的）</li>
                </ul>
                
                  <h3 className="font-medium text-[#8b4513] mt-6 mb-3">4. 決済情報（プレミアムユーザー）</h3>
                <ul className="list-disc ml-6 space-y-1">
                    <li>サブスクリプション状態</li>
                    <li>支払い履歴（Stripe経由）</li>
                    <li>決済方法（カード情報はStripeが管理）</li>
                </ul>
                
                  <h3 className="font-medium text-[#8b4513] mt-6 mb-3">5. ゲストユーザー</h3>
                <ul className="list-disc ml-6 space-y-1">
                    <li>ブラウザセッション中のタスクデータ</li>
                    <li>IPアドレス（セキュリティ目的）</li>
                </ul>
            </div>
          </section>

              {/* 情報の利用目的 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">情報の利用目的</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>収集した情報は、以下の目的で利用します：</p>
              <ul className="list-disc ml-6 space-y-2">
                    <li>本サービスの提供・運営</li>
                    <li>ユーザー認証・セキュリティ確保</li>
                    <li>タスク・習慣データの保存・同期</li>
                    <li>AI機能による分析・提案（プレミアム機能）</li>
                    <li>サービス改善・新機能開発</li>
                    <li>お問い合わせ対応</li>
                    <li>不正利用の防止</li>
                    <li>法的要件への対応</li>
              </ul>
            </div>
          </section>

              {/* 情報の共有 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">情報の共有</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>
                    当方は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません：
                  </p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>ユーザーの事前の同意がある場合</li>
                    <li>法令に基づく場合</li>
                    <li>人の生命、身体、財産の保護のために必要な場合</li>
                    <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要な場合</li>
                  </ul>
                  
                  <h3 className="font-medium text-[#8b4513] mt-6 mb-3">外部サービスとの連携</h3>
                  <p>本サービスでは、以下の外部サービスを利用しています：</p>
                  <div className="bg-[#f5f5dc]/60 p-4 rounded-lg border border-[#deb887]/20">
                <ul className="space-y-2">
                      <li><strong>Supabase：</strong> データベース・認証サービス</li>
                      <li><strong>Stripe：</strong> 決済処理サービス</li>
                      <li><strong>Google：</strong> 認証・分析サービス</li>
                      <li><strong>Vercel：</strong> ホスティングサービス</li>
                </ul>
              </div>
              <p>
                    これらのサービスは、当方との間で適切なデータ保護契約を締結しており、
                    ユーザーの個人情報を適切に保護します。
              </p>
            </div>
          </section>

              {/* データの保存期間 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">データの保存期間</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>データの保存期間は、利用形態により異なります：</p>
                  
                  <div className="bg-[#f5f5dc]/60 p-4 rounded-lg border border-[#deb887]/20">
                    <ul className="space-y-2">
                      <li><strong>ゲストユーザー：</strong> ブラウザセッション終了時まで</li>
                      <li><strong>無料ユーザー：</strong> アカウント作成から30日間</li>
                      <li><strong>プレミアムユーザー：</strong> 退会後1年間（復旧可能期間）</li>
                      <li><strong>決済情報：</strong> 法的要件により7年間保存</li>
                </ul>
              </div>
                  
                  <p>
                    保存期間を経過したデータは、自動的に削除されます。
                    ただし、法的要件により保存が必要な場合は、この限りではありません。
              </p>
            </div>
          </section>

              {/* ユーザーの権利 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">ユーザーの権利</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>ユーザーは、以下の権利を有します：</p>
              <ul className="list-disc ml-6 space-y-2">
                    <li>個人情報の開示請求</li>
                    <li>個人情報の訂正・追加・削除請求</li>
                    <li>個人情報の利用停止・消去請求</li>
                    <li>個人情報の第三者提供停止請求</li>
                    <li>データの可搬性（エクスポート）</li>
              </ul>
              <p>
                    これらの権利の行使については、stepeasytasks@gmail.comまでご連絡ください。
                    本人確認の上、適切に対応いたします。
              </p>
            </div>
          </section>

              {/* セキュリティ対策 */}
              <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">セキュリティ対策</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>当方は、ユーザーの個人情報を保護するため、以下の対策を実施しています：</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>SSL暗号化通信の使用</li>
                    <li>パスワードのハッシュ化保存</li>
                    <li>データベースアクセス制御</li>
                    <li>定期的なセキュリティ監査</li>
                    <li>外部サービスの適切な選択・監視</li>
                    <li>従業員への個人情報保護教育</li>
                  </ul>
                </div>
              </section>

              {/* Cookieの使用 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">Cookieの使用</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>
                    本サービスでは、ユーザーエクスペリエンスの向上とセキュリティ確保のため、
                    Cookieを使用しています。
                  </p>
                  <p>使用するCookieの種類：</p>
              <ul className="list-disc ml-6 space-y-2">
                    <li><strong>認証Cookie：</strong> ログイン状態の維持</li>
                    <li><strong>セッションCookie：</strong> セキュリティ確保</li>
                    <li><strong>分析Cookie：</strong> サービス改善（Google Analytics）</li>
              </ul>
              <p>
                    ブラウザの設定でCookieを無効にすることも可能ですが、
                    その場合、一部の機能が正常に動作しない可能性があります。
              </p>
            </div>
          </section>

              {/* プライバシーポリシーの変更 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">プライバシーポリシーの変更</h2>
                <div className="space-y-4 text-[#4a3728]">
                  <p>
                    当方は、法令の変更やサービスの改善等に伴い、
                    本プライバシーポリシーを変更することがあります。
                  </p>
                  <p>
                    重要な変更については、本サービス内での通知またはメールにて
                    ユーザーにお知らせします。
              </p>
              <p>
                    変更後のプライバシーポリシーは、本サービス内に掲載した時点で
                    効力を生じるものとします。
              </p>
            </div>
          </section>

          {/* お問い合わせ */}
              <section className="bg-[#f5f5dc]/60 p-6 rounded-lg border border-[#deb887]/20">
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">お問い合わせ</h2>
                <div className="space-y-2 text-[#4a3728]">
                  <p>本プライバシーポリシーに関するお問い合わせは、以下までご連絡ください：</p>
              <div className="mt-4">
                <p><strong>運営者：</strong> naonao96</p>
                <p><strong>連絡先：</strong> stepeasytasks@gmail.com</p>
              </div>
            </div>
          </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 