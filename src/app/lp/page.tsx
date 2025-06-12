'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // ログイン済みの場合はメニュー画面にリダイレクト
  if (isLoggedIn) {
    router.replace('/menu');
  }

  const handleStart = () => {
    router.push('/register-select');
  };

  return (
    <div className="h-screen">
      {/* Hero */}
      <section className="bg-blue-100 py-16 px-4 text-center">
        <div className="container mx-auto">
          <Image
            src="/SilentBird.png"
            alt="StepEasy アイコン"
            width={96}
            height={96}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-4xl font-bold text-blue-800">三日坊主を卒業しよう</h1>
          <p className="text-lg mt-2">AIとセキセイインコがあなたの習慣づくりをサポート</p>
          <a
            href="#start"
            onClick={handleStart}
            className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
          >
            無料で始める
          </a>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">StepEasyが選ばれる理由</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">🐥 AIと会話するようにタスク管理</h3>
              <p>インコがあなたに寄り添い、今日の調子にあわせて声をかけます。</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">✅ 見える進捗、続く達成感</h3>
              <p>毎日のタスク完了率がサークルで可視化。モチベーションを維持。</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">📅 カレンダー連携</h3>
              <p>1週間の予定を一目で把握でき、継続のリズムが作りやすい。</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg mb-2">📈 続ける人ほど、インサイトが深まる</h3>
              <p>あなたの行動パターンに基づき、AIが最適な習慣戦略を提案。</p>
            </div>
          </div>
        </div>
      </section>

      {/* UI紹介 */}
      <section className="py-12 px-6 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">かんたん操作。だけど、奥が深い。</h2>
          <Image
            src="/menu.png"
            alt="StepEasy画面"
            width={600}
            height={400}
            className="rounded-xl shadow-lg mx-auto mb-4"
          />
          <p className="text-gray-700">直感的なUIと、会話するようなタスク体験。</p>
        </div>
      </section>

      {/* ペルソナへの共感 */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">"どうせまた続かない"と思っていませんか？</h2>
          <p className="text-gray-700">StepEasyは、あなたの毎日に「寄り添うAI」で習慣化を支えます。<br />
            「毎日、ちょっとだけ頑張れた」そんな気持ちを育てます。</p>
        </div>
      </section>

      {/* プラン比較 */}
      <section className="py-12 px-6 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">無料でも、たっぷり体験できます</h2>
          <table className="w-full border border-blue-200 rounded-lg overflow-hidden">
            <thead className="bg-blue-200 text-blue-800">
              <tr>
                <th className="py-2 px-4">機能</th>
                <th className="py-2 px-4">無料</th>
                <th className="py-2 px-4">プレミアム</th>
              </tr>
            </thead>
            <tbody className="bg-white text-gray-700">
              <tr>
                <td className="py-3 px-4 border-t">タスク管理</td>
                <td className="text-center">✅</td>
                <td className="text-center">✅</td>
              </tr>
              <tr>
                <td className="py-3 px-4 border-t">AIサポート</td>
                <td className="text-center">3回/日</td>
                <td className="text-center">無制限</td>
              </tr>
              <tr>
                <td className="py-3 px-4 border-t">習慣パターン提案</td>
                <td className="text-center">❌</td>
                <td className="text-center">✅</td>
              </tr>
              <tr>
                <td className="py-3 px-4 border-t">行動データ分析</td>
                <td className="text-center">❌</td>
                <td className="text-center">✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">今すぐ、新しい習慣を始めよう</h2>
        <p className="mb-6">インコがあなたを応援します。まずは無料ではじめてみませんか？</p>
        <a
          href="#start"
          onClick={handleStart}
          className="inline-block bg-white text-blue-600 font-bold px-6 py-3 rounded-full hover:bg-blue-100 transition"
        >
          無料で使ってみる
        </a>
      </section>

      <footer className="text-center py-6 text-sm text-gray-500 bg-white">
        © 2025 StepEasy. All rights reserved.
      </footer>
    </div>
  );
}