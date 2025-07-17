import React from 'react';

// プライバシーポリシーコンテンツ
export const PrivacyPolicyContent: React.FC = () => {
  return (
    <div className="p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">プライバシーポリシー</h2>
            <div className="text-sm text-slate-600">
              <p>公開日：{new Date().toLocaleDateString('ja-JP')}</p>
              <p>バージョン：Ver1.0.0</p>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none text-slate-700 space-y-6">
            <p className="leading-relaxed">
              StepEasy（以下、「本サービス」といいます）は、naonao96（以下、「当方」といいます）が提供する、個人の習慣化を支援するAIタスク管理サービスです。
            </p>
            <p className="leading-relaxed">
              当方は、ユーザーのプライバシーを最大限尊重し、以下の方針に従って個人情報を取り扱います。
            </p>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">1. 取得する情報</h3>
              <p>本サービスでは、以下の情報を取得する場合があります：</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>ユーザーが登録・入力するタスク情報および自由記述メモ</li>
                <li>タスクの開始・完了などの行動ログ</li>
                <li>感情・ストレス・モチベーションなど、AIによる入力解析の内容</li>
                <li>認証・セッション管理に必要なCookie情報</li>
              </ul>
              <p className="text-sm text-slate-600 mt-2">※トラッキング目的のCookieは一切使用していません。</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">2. 利用目的</h3>
              <p>取得した情報は以下の目的で利用します：</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>タスクの保存・管理・表示などのサービス提供のため</li>
                <li>ユーザーへのパーソナライズされたAI応援・フィードバックを行うため</li>
                <li>不正利用防止やサービス改善のため</li>
                <li>有料プラン利用者への課金処理（Stripe連携）に必要なため</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">3. 保存期間</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>ゲストユーザー：セッション中のみ</li>
                <li>無料ログインユーザー：30日間</li>
                <li>プレミアムユーザー：無制限</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">4. 外部サービスへの提供</h3>
              <p>以下の外部サービスと連携しています。必要最小限のデータのみ連携し、プライバシー保護に十分配慮しています。</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Supabase（認証・DB）</li>
                <li>Stripe（課金処理）</li>
                <li>Gemini（AI処理）</li>
                <li>Vercel（ホスティング）</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">5. Cookieの利用について</h3>
              <p>本サービスでは、ログイン認証およびセッション管理のためにCookieを使用します。広告・マーケティング目的でのCookieは使用していません。</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">6. ユーザーの権利</h3>
              <p>ユーザーは、自己の個人情報について以下の権利を有します：</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>照会・訂正・削除の請求</li>
                <li>利用停止の請求</li>
              </ul>
              <p>ご希望の方は以下のメールアドレスまでご連絡ください。</p>
              <div className="bg-slate-50 p-4 rounded-lg mt-3">
                <p className="font-medium">お問い合わせ：stepeasytasks@gmail.com</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">7. 適用対象年齢</h3>
              <p>本サービスは、18歳以上の方を対象としています。未成年の方は、保護者の同意を得た上でご利用ください。</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">8. プライバシーポリシーの変更</h3>
              <p>内容は必要に応じて予告なく変更されることがあります。変更後も本サービスのご利用を続けた場合は、変更に同意したものとみなします。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// 利用規約コンテンツ
export const TermsOfServiceContent: React.FC = () => {
  return (
    <div className="p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">利用規約</h2>
            <div className="text-sm text-slate-600">
              <p>公開日：{new Date().toLocaleDateString('ja-JP')}</p>
              <p>バージョン：Ver1.0.0</p>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none text-slate-700 space-y-6">
            <p className="leading-relaxed">
              本利用規約（以下、「本規約」といいます）は、StepEasy（以下、「本サービス」といいます）の利用条件を定めるものです。ご利用の際には、本規約に同意いただく必要があります。
            </p>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第1条（適用）</h3>
              <p>本規約は、naonao96（以下、「当方」といいます）が提供する本サービスの利用に関して、当方とユーザーとの間に適用されます。</p>
              <p>本サービスは、18歳以上の方を対象としています。18歳未満の方は、保護者の同意を得た上でご利用ください。</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">事業者情報</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p><strong>運営者名：</strong> naonao96</p>
                <p><strong>連絡先：</strong> stepeasytasks@gmail.com</p>
                <p><strong>サービス名：</strong> StepEasy</p>
                <p><strong>サービス内容：</strong> タスク管理アプリケーション</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第2条（利用登録）</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>本サービスは、ゲスト・無料ログイン・プレミアム会員の3区分で利用可能です。</li>
                <li>利用者は正確な情報をもとに登録を行うものとします。</li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第3条（禁止事項）</h3>
              <p>以下の行為は禁止します：</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>法令違反または公序良俗に反する行為</li>
                <li>他者の権利を侵害する行為</li>
                <li>本サービスの不正利用（なりすまし、脆弱性の利用等）</li>
                <li>本サービスの運営を妨げる行為</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第4条（データの取扱い）</h3>
              <p>ユーザーが入力したデータ（タスク、行動ログ、AI関連入力など）は、プライバシーポリシーに基づき適切に管理されます。</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第5条（課金・支払い）</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>一部機能はプレミアム会員向けに提供されます。</li>
                <li>Stripeを通じて月額課金が行われます。</li>
                <li>利用者は決済情報を正しく入力する責任を負います。</li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第6条（免責事項）</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>本サービスは、完全な継続・成果を保証するものではありません。</li>
                <li>外部サービスの不具合による影響について、当方は責任を負いません。</li>
                <li>ユーザーデータの消失・漏洩等に対して、当方は可能な限り保護措置を講じますが、不可抗力による損害には責任を負いません。</li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第7条（退会・データ削除）</h3>
              <p>退会手続きにより、アカウントおよびデータは削除されます。ただし、一部のログデータは一定期間保存される場合があります（法令遵守のため）。</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第8条（規約変更）</h3>
              <p>当方は必要に応じて本規約を変更することがあります。変更後の規約は公開された時点で効力を持ちます。</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">第9条（準拠法・管轄）</h3>
              <p>本規約は日本法に基づき解釈され、ユーザーと当方の間で紛争が生じた場合は、当方の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</p>
            </section>

            <div className="mt-8 bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold text-slate-900">お問い合わせ先</p>
              <p className="text-slate-700">stepeasytasks@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// FAQ コンテンツ（枠組み）
export const FAQContent: React.FC = () => {
  const faqs = [
    {
      question: 'StepEasyは無料で使えますか？',
      answer: 'はい、基本的な機能は全て無料でご利用いただけます。プレミアム機能（月額200円）は準備中です。'
    },
    {
      question: 'ゲストモードと登録ユーザーの違いは？',
      answer: 'ゲストモードは当日限定のタスク管理のみ。登録ユーザーはデータ保存、AI機能、統計分析など全機能が利用できます。'
    },
    {
      question: 'データの安全性は大丈夫ですか？',
      answer: 'Supabaseを使用した安全なクラウドストレージでデータを保護しています。詳細はプライバシーポリシーをご確認ください。'
    },
    {
      question: 'プレミアム機能はいつリリースされますか？',
      answer: '2025年春のリリースを予定しています。事前通知をご希望の方は通知登録をお願いします。'
    },
    {
      question: 'AIはどのような情報を分析しますか？',
      answer: 'タスクの完了状況、実行時間、カテゴリ、優先度などから感情状態やモチベーションを分析し、個別化されたメッセージを生成します。'
    },
    {
      question: 'データのエクスポートはできますか？',
      answer: '現在準備中の機能です。将来的にはタスクデータや統計情報のエクスポート機能を提供予定です。'
    },
    {
      question: 'モバイルアプリはありますか？',
      answer: 'Webアプリとしてモバイルブラウザでもご利用いただけます。ネイティブアプリは今後の開発予定に含まれています。'
    },
    {
      question: 'アカウント削除はできますか？',
      answer: 'はい、設定画面からいつでもアカウントと全データを削除できます。削除後のデータ復旧はできませんのでご注意ください。'
    }
  ];

  return (
    <div className="p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-[#deb887]/30">
          <h2 className="text-2xl font-bold text-[#8b4513] mb-6">よくある質問</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-[#deb887]/40 rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-[#f5f5dc]/60 hover:bg-[#f5f5dc]/80">
                <h3 className="font-semibold text-[#8b4513] mb-2">{faq.question}</h3>
                <p className="text-[#4a3728] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-[#f5f5dc]/60 rounded-lg p-6 border border-[#deb887]/30">
            <h3 className="font-semibold text-[#8b4513] mb-2">他にご質問がありますか？</h3>
            <p className="text-[#4a3728] mb-4">
              上記以外のご質問やサポートが必要な場合は、お気軽にお問い合わせください。
            </p>
            <div className="text-sm text-[#7c5a2a]">
              <p>※ お問い合わせ機能は今後実装予定です</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 