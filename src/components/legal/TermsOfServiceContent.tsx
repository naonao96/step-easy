'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CloudLayer } from '@/components/CloudLayer';
import { FaHome, FaShieldAlt, FaFileContract } from 'react-icons/fa';
import Image from 'next/image';

export const TermsOfServiceContent: React.FC = () => {
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
              利用規約
            </h1>
          </div>
        </div>

        {/* 右側：ナビゲーションボタン */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/privacy')}
            className="p-2 text-[#7c5a2a] hover:text-[#8b4513] transition-colors duration-200 hover:scale-105"
            title="プライバシーポリシー"
          >
            {FaShieldAlt({ className: "w-5 h-5" })}
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
      
      <div className="relative z-10 py-8 pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/30">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#8b4513] mb-4">利用規約</h1>
              <div className="text-sm text-[#7c5a2a]">
                <span>公開日：{new Date().toLocaleDateString('ja-JP')} | バージョン：Ver1.0.0</span>
          </div>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          {/* 第1条 適用 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第1条（適用）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>
                本利用規約（以下「本規約」）は、naonao96（以下「当方」）が運営するタスク管理アプリケーション「StepEasy」（以下「本サービス」）の
                利用条件を定めるものです。
              </p>
              <p>
                ユーザーは、本サービスを利用することにより、本規約に同意したものとみなします。
                本規約に同意できない場合は、本サービスの利用をお控えください。
              </p>
              <p>
                本サービスは、18歳以上の方を対象としています。
                18歳未満の方は、保護者の同意を得た上でご利用ください。
                保護者の同意がない場合の利用は禁止いたします。
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

          {/* 第2条 利用登録 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第2条（利用登録）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>本サービスでは、以下の3つの利用形態を提供しています：</p>
              <div className="ml-6">
                <h3 className="font-medium mb-2">1. ゲストユーザー</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>アカウント登録不要で基本機能を体験可能</li>
                  <li>データはブラウザセッション中のみ保存</li>
                  <li>ブラウザ終了時にデータは削除されます</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">2. 無料ユーザー</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>メールアドレスとパスワードでアカウント作成</li>
                  <li>データは30日間保存</li>
                  <li>基本的なタスク管理機能を利用可能</li>
                </ul>
                
                <h3 className="font-medium mb-2 mt-4">3. プレミアムユーザー</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>月額200円のサブスクリプション</li>
                  <li>データは無制限保存</li>
                  <li>AI機能、詳細分析等の高度な機能を利用可能</li>
                </ul>
              </div>
              <p className="mt-4">
                利用登録時には、正確かつ最新の情報を提供していただく必要があります。
                虚偽の情報を提供した場合、アカウントを停止することがあります。
              </p>
            </div>
          </section>

          {/* 第3条 禁止事項 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第3条（禁止事項）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません：</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当方、他のユーザー、または第三者の知的財産権を侵害する行為</li>
                <li>当方、他のユーザー、または第三者を誹謗中傷する行為</li>
                <li>過度に暴力的または残虐な内容を含む行為</li>
                <li>性的表現を含む行為</li>
                <li>本サービスのネットワークまたはシステムに過度な負荷をかける行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>不正アクセスまたはこれに類する行為</li>
                <li>逆アセンブル、逆コンパイル、リバースエンジニアリング等の行為</li>
                <li>本サービスを商用目的で利用する行為（プレミアム機能除く）</li>
                <li>その他、当方が不適切と判断する行為</li>
              </ul>
            </div>
          </section>

          {/* 第4条 ユーザーデータの取扱い */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第4条（ユーザーデータの取扱い）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>
                ユーザーが本サービスに投稿、アップロード、入力したデータ（以下「ユーザーデータ」）の取扱いについては、
                別途定めるプライバシーポリシーに従います。
              </p>
              <p>
                ユーザーは、ユーザーデータについて適法な権利を有していることを保証し、
                第三者の権利を侵害するデータを投稿してはなりません。
              </p>
              <p>
                当方は、本サービスの改善や新機能の開発のため、統計的な目的でユーザーデータを分析することがあります。
                この場合、個人を特定できない形で処理を行います。
              </p>
            </div>
          </section>

          {/* 第5条 課金・支払い */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第5条（課金・支払い）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>プレミアム機能の利用料金は以下の通りです：</p>
                  <div className="bg-[#f5f5dc]/60 p-4 rounded-lg border border-[#deb887]/20">
                <ul className="space-y-2">
                  <li><strong>月額料金：</strong> 200円（税込）</li>
                  <li><strong>支払い方法：</strong> クレジットカード（Stripe経由）</li>
                  <li><strong>課金日：</strong> 初回登録日から毎月同日</li>
                  <li><strong>無料期間：</strong> 初回7日間無料</li>
                </ul>
              </div>
              <p>
                料金の支払いは、Stripe社の決済システムを通じて行われます。
                支払い情報は当方では保存せず、Stripe社が安全に管理します。
              </p>
              <p>
                プレミアム機能は現在準備中です。機能の提供開始時期については、
                本サービス内でお知らせいたします。
              </p>
              <p>
                ユーザーは、いつでもサブスクリプションを解約することができます。
                解約後も、次回課金日まではプレミアム機能を利用できます。
              </p>
            </div>
          </section>

          {/* 第6条 免責事項 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第6条（免責事項）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>当方は、以下の事項について一切の責任を負いません：</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>本サービスの内容、情報の正確性、有用性、安全性</li>
                <li>本サービスの利用によりユーザーに生じた損害</li>
                <li>ユーザー間またはユーザーと第三者との間で生じたトラブル</li>
                <li>本サービスの中断、停止、終了、利用不能または情報の削除</li>
                <li>本サービスの利用により第三者に生じた損害</li>
                <li>ユーザーデータの消失、破損</li>
                <li>外部サービス（Supabase、Stripe、Google等）の障害や停止</li>
              </ul>
              <p>
                本サービスは現状有姿で提供され、当方は本サービスの完全性、正確性、
                確実性、有用性等について何らの保証も行いません。
              </p>
            </div>
          </section>

          {/* 第7条 退会・データ削除 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第7条（退会・データ削除）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>
                ユーザーは、いつでも本サービスから退会することができます。
                退会手続きは、アプリ内の設定画面から行うことができます。
              </p>
              <p>
                退会時のデータ削除については、以下の通りです：
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>ゲストユーザー：</strong> ブラウザ終了時に自動削除</li>
                <li><strong>無料ユーザー：</strong> 退会後即座に削除</li>
                <li><strong>プレミアムユーザー：</strong> 退会後1年間は復旧可能、その後削除</li>
              </ul>
              <p>
                <strong>支払い情報について：</strong> 法的要件により、支払い履歴は会計・税務目的で保持されます。
                これらは個人を特定できない形で保存され、GDPR削除要求の対象外となります。
              </p>
              <p>
                当方は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除することができます。
              </p>
            </div>
          </section>

          {/* 第8条 本規約の変更 */}
          <section>
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">第8条（本規約の変更）</h2>
                <div className="space-y-4 text-[#4a3728]">
              <p>
                当方は、法令の変更やサービスの改善等に伴い、本規約を変更することがあります。
                重要な変更については、本サービス内での通知またはメールにてユーザーにお知らせします。
              </p>
              <p>
                変更後の利用規約は、本サービス内に掲載した時点で効力を生じるものとします。
              </p>
            </div>
          </section>

          {/* お問い合わせ */}
              <section className="bg-[#f5f5dc]/60 p-6 rounded-lg border border-[#deb887]/20">
                <h2 className="text-xl font-semibold text-[#8b4513] mb-4">お問い合わせ</h2>
                <div className="space-y-2 text-[#4a3728]">
              <p>本規約に関するお問い合わせは、以下までご連絡ください：</p>
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