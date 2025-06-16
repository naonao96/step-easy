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
        <header className="relative bg-gradient-to-br from-blue-100 to-blue-50 py-16 px-8 text-center" id="top">
        <Image
              src="/logo.png"
              alt="StepEasy ロゴ"
              width={120}
              height={120}
              className="cursor-pointer"
            />
          <h1 className="text-4xl font-bold mb-4">小鳥の一声が、あなたの習慣を運んでいく</h1>
          <p className="text-xl mb-4">小鳥が、今日もそっと背中を押してくれる</p>
        </header>

        <div className="text-center -mt-8 relative z-2">
          <button 
            onClick={handleStart}
            className="bg-blue-600 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300"
          >
            無料で始める
          </button>
          <p className="mt-2">登録は60秒、すぐに使えます</p>
        </div>

        <section className="fade-section translate-y-8 transition-all duration-600 py-16 px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl mb-4 border-l-4 border-blue-300 pl-4">なぜ「小鳥」なのか？</h2>
          <p className="text-lg">StepEasyは、忙しいあなたの毎日に、静かでやさしい相棒「小鳥」をお届けします。<br />
          小鳥の声はあなたの状況に共感し、無理なく続けられるよう寄り添います。</p>
        </section>

        <section className="fade-section translate-y-8 transition-all duration-600 py-16 px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl mb-4 border-l-4 border-blue-300 pl-4">あなたにも、こんな悩みありませんか？</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>✔ 習慣が続かずに落ち込む</li>
            <li>✔ 「またできなかった」と自己嫌悪</li>
            <li>✔ タスクアプリや手帳が続かない</li>
          </ul>
          <p className="mt-4"><strong>StepEasy</strong>は、小鳥のやさしい声と共に、あなたの「できた！」を少しずつ育てていきます。</p>
        </section>

        <section className="fade-section translate-y-8 transition-all duration-600 py-16 px-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl mb-4 border-l-4 border-blue-300 pl-4">StepEasyの主な機能</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>タスクのシンプルな管理：</strong>見る・タップするだけの簡単操作</li>
            <li><strong>達成度や曜日別分析：</strong>習慣の傾向を視覚化</li>
            <li><strong>未来予測：</strong>続けた場合の成果を予測表示</li>
            <li><strong>詰め込みすぎアラート：</strong>「無理しすぎ」を防止</li>
            <li><strong>小鳥の学習：</strong>継続に応じてあなたに合った提案へ</li>
          </ul>
        </section>

        <section className="fade-section translate-y-8 transition-all duration-600 py-16 px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl mb-4 border-l-4 border-blue-300 pl-4">プレミアムで得られること</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>あなたに最適な週間習慣プランの提案</li>
            <li>行動データからの成功・失敗パターン分析</li>
            <li>心理的変化の可視化でモチベーションUP</li>
            <li>小鳥の応援スタイルを選べる（短期／長期／癒し型）</li>
          </ul>
        </section>

        <section className="fade-section translate-y-8 transition-all duration-600 py-16 px-8 max-w-4xl mx-auto">
          <h2 className="text-3xl mb-4 border-l-4 border-blue-300 pl-4">利用者の声</h2>
          <blockquote className="italic my-4 border-l-4 border-blue-300 pl-4 text-gray-700">「小鳥の声に癒されて、続けるのが楽しくなった」 – 30代女性</blockquote>
          <blockquote className="italic my-4 border-l-4 border-blue-300 pl-4 text-gray-700">「習慣が初めて1ヶ月以上続いた。すごい」 – 20代男性</blockquote>
          <blockquote className="italic my-4 border-l-4 border-blue-300 pl-4 text-gray-700">「"今日は休んでいいよ"って小鳥が言ってくれるの、うれしい」 – 40代男性</blockquote>
        </section>

        <div className="text-center py-8">
          <button 
            onClick={handleStart}
            className="bg-blue-600 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300"
          >
            今すぐ無料で始める
          </button>
          <p className="mt-2">登録不要・お試しOK</p>
        </div>

        <section className="fade-section translate-y-8 transition-all duration-600 py-16 px-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-lg">
          <h2 className="text-3xl mb-4 border-l-4 border-blue-300 pl-4">正式リリースを見逃さないように</h2>
          <p className="mb-4">あなたのメールアドレスを登録すると、リリース時に小鳥が最初にお知らせします。</p>
          <input 
            type="email" 
            placeholder="メールアドレスを入力" 
            className="w-3/5 max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <br />
          <button 
            onClick={() => router.push('/register')}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
          >
            ウェイティングリストに登録
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

        <footer className="text-center py-8 bg-blue-100 text-gray-700">
          <p>&copy; 2025 StepEasy - あなた専属の習慣コーチ（小鳥つき）</p>
        </footer>
      </div>
    </Layout>
  );
} 