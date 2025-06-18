'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/templates/Layout';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const { signInAsGuest } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          router.replace('/menu');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-section').forEach(section => {
      observer.observe(section);
    });
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  const handleStart = () => {
    setShowModal(true);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleGuest = async () => {
    try {
      await signInAsGuest();
      router.push('/menu');
    } catch (error) {
      console.error('Guest mode error:', error);
    }
  };

  return (
    <Layout>
      <div className="h-screen bg-blue-50 text-blue-900 overflow-y-auto scrollbar-hide">
        {/* ヘッダー部 */}
        <section className="text-center bg-blue-50 py-12">
        <Image
              src="/logo.png"
              alt="StepEasy ロゴ"
              width={120}
              height={120}
            className="mx-auto mb-4"
            />
          <h1 className="text-2xl font-bold text-blue-900 mb-2">小鳥の一声が、あなたの習慣を運んでいく</h1>
          <p className="text-blue-800 mb-4">小鳥が、今日もそっと背中を押してくれる</p>
          <button 
            onClick={handleStart}
            className="bg-blue-600 text-white px-6 py-2 rounded-full mb-2 hover:bg-blue-700 transition"
          >
            無料で始める
          </button>
          <p className="text-sm text-gray-600">登録は60秒、すぐに使えます</p>
        </section>

        {/* なぜ「小鳥」なのか？ */}
        <section className="bg-white px-6 py-12">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">なぜ「小鳥」なのか？</h2>
          <p className="text-gray-700 leading-relaxed">
            StepEasyは、忙しいあなたの毎日に、静かでやさしい相棒「小鳥」をお届けします。
            小鳥は、あなたの状況や気分に共感し、「ちょっとだけ頑張ろう」と背中を押してくれる存在。
            毎日の習慣が続くよう、そっと寄り添ってくれます。
          </p>
        </section>

        {/* ユーザーの悩み */}
        <section className="bg-blue-100 px-6 py-12">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">あなたにも、こんな悩みありませんか？</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>習慣が続かずに落ち込む</li>
            <li>「またできなかった」と自己嫌悪してしまう</li>
            <li>タスク管理アプリや手帳が続かない</li>
            <li>自分のペースがつかめずに挫折を繰り返す</li>
          </ul>
        </section>

        {/* StepEasyでできること */}
        <section className="bg-white px-6 py-12">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">StepEasyでできること</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>小鳥のひとことで気持ちに寄り添う（定型／AI）</li>
            <li>タスク継続日数・曜日傾向を自動で可視化</li>
            <li>「今日は休んでいいよ」など、やさしいアラート</li>
            <li>AIが習慣のリズムを提案（プレミアム）</li>
            <li>応援スタイルを選べる（達成型／癒し型／継続型）</li>
          </ul>
        </section>

        {/* 利用者の声 */}
        <section className="bg-blue-50 px-6 py-12">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">利用者の声</h2>
          <div className="space-y-4 text-gray-700">
            <p>「小鳥の声に癒されて、続けるのが楽しくなった」 – 30代女性</p>
            <p>「習慣が初めて1ヶ月以上続いた。すごい」 – 20代男性</p>
            <p>「"今日は休んでいいよ"って小鳥が言ってくれるの、うれしい」 – 40代男性</p>
          </div>
        </section>

        {/* 今すぐ体験を */}
        <section className="bg-white text-center px-6 py-12">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">今すぐStepEasyを試してみませんか？</h2>
          <p className="text-gray-700 mb-6">1日続けば、それはもう「変化」の始まり。StepEasyで、やさしいリズムを整えてみましょう。</p>
          <button 
            onClick={handleGuest}
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
          >
            ゲストモードで始める（登録不要）
          </button>
          <p className="text-sm text-gray-500 mt-2">※メール登録でリリース通知も受け取れます</p>
          <button 
            onClick={() => router.push('/register')}
            className="mt-4 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition block mx-auto"
          >
            メール登録でリリース通知を受け取る
          </button>
        </section>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-6 text-center">StepEasyを始める</h3>
              <div className="space-y-4">
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
                >
                  ログイン / 新規登録
                </button>
                <button
                  onClick={handleGuest}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 transition-colors duration-300"
                >
                  ゲストモードで始める
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 transition-colors duration-300"
                >
                  キャンセル
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500 text-center">
                ゲストモードでは一部機能が制限されます
              </p>
            </div>
          </div>
        )
        }

        {/* フッター */}
        <footer className="bg-blue-100 text-center text-sm text-gray-600 py-6">
          © 2025 StepEasy - あなた専属の習慣コーチ（小鳥つき）
        </footer>
      </div>
    </Layout>
  );
} 