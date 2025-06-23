'use client';

import React, { useState, useEffect } from 'react';
import { FaQuestionCircle, FaShieldAlt, FaFileContract, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export const MobileOthersContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'privacy' | 'terms'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // URLパラメータからタブを設定
  useEffect(() => {
    const savedTab = localStorage.getItem('othersActiveTab');
    if (savedTab === 'privacy' || savedTab === 'terms') {
      setActiveTab(savedTab);
      // 使用後は削除
      localStorage.removeItem('othersActiveTab');
    }
  }, []);

  const faqs = [
    {
      question: 'StepEasyは無料で使えますか？',
      answer: 'はい、基本的な機能は全て無料でご利用いただけます。プレミアム機能（月額400円）は現在開発中です。'
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
      answer: '現在開発中の機能です。将来的にはタスクデータや統計情報のエクスポート機能を提供予定です。'
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

  const tabs = [
    { id: 'faq' as const, label: 'FAQ', icon: FaQuestionCircle },
    { id: 'privacy' as const, label: 'プライバシーポリシー', icon: FaShieldAlt },
    { id: 'terms' as const, label: '利用規約', icon: FaFileContract },
  ];

  const renderFAQContent = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">よくある質問</h2>
        <p className="text-sm text-slate-600">StepEasyについてよくお寄せいただく質問と回答</p>
      </div>
      
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              className="w-full p-4 text-left bg-white hover:bg-slate-50 transition-colors flex justify-between items-center"
            >
              <span className="font-medium text-slate-900 text-sm pr-2">{faq.question}</span>
              {expandedFaq === index ? (
                FaChevronUp ({className:"w-4 h-4 text-slate-500 flex-shrink-0"})
              ) : (
                FaChevronDown ({className:"w-4 h-4 text-slate-500 flex-shrink-0"})
              )}
            </button>
            {expandedFaq === index && (
              <div className="p-4 pt-0 bg-slate-50 border-t border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 bg-slate-50 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-2 text-sm">他にご質問がありますか？</h3>
        <p className="text-slate-600 mb-3 text-sm">
          上記以外のご質問やサポートが必要な場合は、お気軽にお問い合わせください。
        </p>
        <div className="text-xs text-slate-500">
          <p>※ お問い合わせ機能は今後実装予定です</p>
        </div>
      </div>
    </div>
  );

  const renderPrivacyContent = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">プライバシーポリシー</h2>
        <div className="text-xs text-slate-600">
          <p>公開日：{new Date().toLocaleDateString('ja-JP')}</p>
          <p>バージョン：Ver1.0.0</p>
        </div>
      </div>
      
      <div className="space-y-4 text-sm text-slate-700">
        <p>StepEasyは、naonao96が提供する個人の習慣化を支援するAIタスク管理サービスです。</p>
        <p>当方は、ユーザーのプライバシーを最大限尊重し、以下の方針に従って個人情報を取り扱います。</p>
        
        <section>
          <h3 className="font-semibold text-slate-900 mb-2">1. 取得する情報</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>タスク情報および自由記述メモ</li>
            <li>タスクの開始・完了などの行動ログ</li>
            <li>感情・ストレス・モチベーションなどのAI解析内容</li>
            <li>認証・セッション管理に必要なCookie情報</li>
          </ul>
          <p className="text-xs text-slate-500 mt-1">※トラッキング目的のCookieは使用していません</p>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">2. 利用目的</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>タスクの保存・管理・表示などのサービス提供</li>
            <li>パーソナライズされたAI応援・フィードバック</li>
            <li>不正利用防止やサービス改善</li>
            <li>有料プラン利用者への課金処理（Stripe連携）</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">3. 保存期間</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>ゲストユーザー：セッション中のみ</li>
            <li>無料ログインユーザー：30日間</li>
            <li>プレミアムユーザー：無制限</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">4. 外部サービス連携</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Supabase（認証・DB）</li>
            <li>Stripe（課金処理）</li>
            <li>Gemini（AI処理）</li>
            <li>Vercel（ホスティング）</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">5. お問い合わせ窓口</h3>
          <div className="bg-slate-100 p-3 rounded">
            <p className="font-medium">お問い合わせ：stepeasytasks@gmail.com</p>
          </div>
        </section>
      </div>
    </div>
  );

  const renderTermsContent = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">利用規約</h2>
        <div className="text-xs text-slate-600">
          <p>公開日：{new Date().toLocaleDateString('ja-JP')}</p>
          <p>バージョン：Ver1.0.0</p>
        </div>
      </div>
      
      <div className="space-y-4 text-sm text-slate-700">
        <p>本利用規約は、StepEasyの利用条件を定めるものです。ご利用の際には、本規約に同意いただく必要があります。</p>
        
        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第1条（適用）</h3>
          <p>本規約は、naonao96（当方）が提供する本サービスの利用に関して、当方とユーザーとの間に適用されます。</p>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第2条（利用登録）</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>本サービスは、ゲスト・無料ログイン・プレミアム会員の3区分で利用可能です。</li>
            <li>利用者は正確な情報をもとに登録を行うものとします。</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第3条（禁止事項）</h3>
          <p>以下の行為は禁止します：</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>法令違反または公序良俗に反する行為</li>
            <li>他者の権利を侵害する行為</li>
            <li>本サービスの不正利用（なりすまし、脆弱性の利用等）</li>
            <li>本サービスの運営を妨げる行為</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第4条（データの取扱い）</h3>
          <p>ユーザーが入力したデータ（タスク、行動ログ、AI関連入力など）は、プライバシーポリシーに基づき適切に管理されます。</p>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第5条（課金・支払い）</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>一部機能はプレミアム会員向けに提供されます。</li>
            <li>Stripeを通じて月額課金が行われます。</li>
            <li>利用者は決済情報を正しく入力する責任を負います。</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第6条（免責事項）</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>本サービスは、完全な継続・成果を保証するものではありません。</li>
            <li>外部サービスの不具合による影響について、当方は責任を負いません。</li>
            <li>ユーザーデータの消失・漏洩等に対して、当方は可能な限り保護措置を講じますが、不可抗力による損害には責任を負いません。</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第7条（退会・データ削除）</h3>
          <p>退会手続きにより、アカウントおよびデータは削除されます。ただし、一部のログデータは一定期間保存される場合があります（法令遵守のため）。</p>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第8条（規約変更）</h3>
          <p>当方は必要に応じて本規約を変更することがあります。変更後の規約は公開された時点で効力を持ちます。</p>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-2">第9条（準拠法・管轄）</h3>
          <p>本規約は日本法に基づき解釈され、ユーザーと当方の間で紛争が生じた場合は、当方の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>

        <div className="bg-slate-100 p-3 rounded">
          <p className="font-medium text-slate-900">お問い合わせ先</p>
          <p>stepeasytasks@gmail.com</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {/* タブナビゲーション */}
      <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {IconComponent ({className:"w-3 h-3"})}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'faq' ? 'FAQ' : tab.id === 'privacy' ? 'プライバシー' : '利用規約'}</span>
            </button>
          );
        })}
      </div>

      {/* コンテンツ */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        {activeTab === 'faq' && renderFAQContent()}
        {activeTab === 'privacy' && renderPrivacyContent()}
        {activeTab === 'terms' && renderTermsContent()}
      </div>
    </div>
  );
}; 