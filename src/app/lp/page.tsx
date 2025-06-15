"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  // IntersectionObserverによるfade-inアニメーション
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new window.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade').forEach(section => {
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  // CTAボタンの遷移
  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push("/register-select");
  };

  return (
    <div className="h-screen" style={{ background: "var(--blue-light)", minHeight: "100vh"}}>
      {/* ヘッダー */}
      <header id="top" style={{ position: "relative", background: "linear-gradient(145deg, #bbdefb, #e3f2fd)", padding: "4em 2em 6em", textAlign: "center", color: "var(--blue-dark)" }}>
        <a href="#top" className="logo" style={{ position: "absolute", top: "0.5em", left: "0.5em", zIndex: 10 }}>
          <img src="/logo.png" alt="StepEasy ロゴ" style={{ width: 120, height: "auto", cursor: "pointer" }} />
        </a>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5em", fontWeight: "bold" }}>小鳥の一声が、あなたの習慣を運んでいく</h1>
        <p style={{ fontSize: "1.2rem", marginBottom: "1em" }}>小鳥が、今日もそっと背中を押してくれる</p>
        {/* 鳥イラスト */}
        <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, opacity: 0.9, pointerEvents: "none", zIndex: 1, background: "url('/DontTalkToTheBird.png') no-repeat center bottom / 200px" }} />
      </header>

      <div className="cta" style={{ textAlign: "center", marginTop: "-2em", zIndex: 2, position: "relative" }}>
        <button 
          onClick={handleStart}
          style={{ 
            background: "var(--blue-main)", 
            color: "white", 
            border: "none", 
            padding: "1em 2em", 
            fontSize: "1.1rem", 
            borderRadius: "2em", 
            cursor: "pointer", 
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)", 
            transition: "transform 0.3s ease, background 0.3s ease" 
          }}
          onMouseOver={e => e.currentTarget.style.background = "#0f5bb5"}
          onMouseOut={e => e.currentTarget.style.background = "var(--blue-main)"}
        >
          無料で始める
        </button>
        <p>登録は60秒、すぐに使えます</p>
      </div>

      {/* なぜ「小鳥」なのか */}
      <section className="fade" style={{ padding: "4em 2em", maxWidth: 900, margin: "auto" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1em", borderLeft: "6px solid var(--accent)", paddingLeft: "0.5em" }}>なぜ「小鳥」なのか？</h2>
        <p>StepEasyは、忙しいあなたの毎日に、静かでやさしい相棒「小鳥」をお届けします。<br />
        小鳥の声はあなたの状況に共感し、無理なく続けられるよう寄り添います。</p>
      </section>

      {/* こんな悩みありませんか？ */}
      <section className="fade" style={{ padding: "4em 2em", maxWidth: 900, margin: "auto" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1em", borderLeft: "6px solid var(--accent)", paddingLeft: "0.5em" }}>あなたにも、こんな悩みありませんか？</h2>
        <ul style={{ paddingLeft: "1.5em" }}>
          <li style={{ marginBottom: "0.75em" }}>✔ 習慣が続かずに落ち込む</li>
          <li style={{ marginBottom: "0.75em" }}>✔ 「またできなかった」と自己嫌悪</li>
          <li style={{ marginBottom: "0.75em" }}>✔ タスクアプリや手帳が続かない</li>
        </ul>
        <p><strong>StepEasy</strong>は、小鳥のやさしい声と共に、あなたの「できた！」を少しずつ育てていきます。</p>
      </section>

      {/* 主な機能 */}
      <section className="features fade" style={{ padding: "4em 2em", maxWidth: 900, margin: "auto", background: "var(--white)", borderRadius: "1em", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", paddingTop: "2em", paddingBottom: "2em" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1em", borderLeft: "6px solid var(--accent)", paddingLeft: "0.5em" }}>StepEasyの主な機能</h2>
        <ul style={{ paddingLeft: "1.5em" }}>
          <li style={{ marginBottom: "0.75em" }}><strong>タスクのシンプルな管理：</strong>見る・タップするだけの簡単操作</li>
          <li style={{ marginBottom: "0.75em" }}><strong>達成度や曜日別分析：</strong>習慣の傾向を視覚化</li>
          <li style={{ marginBottom: "0.75em" }}><strong>未来予測：</strong>続けた場合の成果を予測表示</li>
          <li style={{ marginBottom: "0.75em" }}><strong>詰め込みすぎアラート：</strong>「無理しすぎ」を防止</li>
          <li style={{ marginBottom: "0.75em" }}><strong>小鳥の学習：</strong>継続に応じてあなたに合った提案へ</li>
        </ul>
      </section>

      {/* プレミアムで得られること */}
      <section className="fade" style={{ padding: "4em 2em", maxWidth: 900, margin: "auto" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1em", borderLeft: "6px solid var(--accent)", paddingLeft: "0.5em" }}>プレミアムで得られること</h2>
        <ul style={{ paddingLeft: "1.5em" }}>
          <li style={{ marginBottom: "0.75em" }}>あなたに最適な週間習慣プランの提案</li>
          <li style={{ marginBottom: "0.75em" }}>行動データからの成功・失敗パターン分析</li>
          <li style={{ marginBottom: "0.75em" }}>心理的変化の可視化でモチベーションUP</li>
          <li style={{ marginBottom: "0.75em" }}>小鳥の応援スタイルを選べる（短期／長期／癒し型）</li>
        </ul>
      </section>

      {/* 利用者の声 */}
      <section className="fade" style={{ padding: "4em 2em", maxWidth: 900, margin: "auto" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1em", borderLeft: "6px solid var(--accent)", paddingLeft: "0.5em" }}>利用者の声</h2>
        <blockquote style={{ fontStyle: "italic", margin: "1em 0", borderLeft: "4px solid var(--accent)", paddingLeft: "1em", color: "#333" }}>「小鳥の声に癒されて、続けるのが楽しくなった」 – 30代女性</blockquote>
        <blockquote style={{ fontStyle: "italic", margin: "1em 0", borderLeft: "4px solid var(--accent)", paddingLeft: "1em", color: "#333" }}>「習慣が初めて1ヶ月以上続いた。すごい」 – 20代男性</blockquote>
        <blockquote style={{ fontStyle: "italic", margin: "1em 0", borderLeft: "4px solid var(--accent)", paddingLeft: "1em", color: "#333" }}>「"今日は休んでいいよ"って小鳥が言ってくれるの、うれしい」 – 40代男性</blockquote>
      </section>

      <div className="cta" style={{ textAlign: "center", marginTop: "2em", zIndex: 2, position: "relative" }}>
        <button 
          onClick={handleStart}
          style={{ 
            background: "var(--blue-main)", 
            color: "white", 
            border: "none", 
            padding: "1em 2em", 
            fontSize: "1.1rem", 
            borderRadius: "2em", 
            cursor: "pointer", 
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)", 
            transition: "transform 0.3s ease, background 0.3s ease" 
          }}
          onMouseOver={e => e.currentTarget.style.background = "#0f5bb5"}
          onMouseOut={e => e.currentTarget.style.background = "var(--blue-main)"}
        >
          今すぐ無料で始める
        </button>
        <p>登録不要・お試しOK</p>
      </div>

      {/* メールアドレス登録 */}
      <section className="waiting fade" style={{ padding: "4em 2em", maxWidth: 900, margin: "auto", background: "var(--white)", borderRadius: "1em", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", paddingTop: "2em", paddingBottom: "2em" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1em", borderLeft: "6px solid var(--accent)", paddingLeft: "0.5em" }}>正式リリースを見逃さないように</h2>
        <p>あなたのメールアドレスを登録すると、リリース時に小鳥が最初にお知らせします。</p>
        <input 
          type="email" 
          placeholder="メールアドレスを入力" 
          style={{ 
            padding: "0.6em", 
            fontSize: "1rem", 
            width: "60%", 
            maxWidth: 300, 
            marginTop: "1em", 
            border: "1px solid #ccc", 
            borderRadius: 4 
          }} 
        />
        <br />
        <button 
          style={{ 
            marginTop: "1em", 
            background: "var(--blue-main)", 
            color: "white", 
            border: "none", 
            padding: "0.8em 1.5em", 
            fontSize: "1rem", 
            borderRadius: "0.5em", 
            cursor: "pointer", 
            boxShadow: "0 3px 8px rgba(0,0,0,0.1)" 
          }}
        >
          ウェイティングリストに登録
        </button>
      </section>

      <footer style={{ textAlign: "center", padding: "2em", background: "#dceeff", color: "#333" }}>
        <p>© 2025 StepEasy - あなた専属の習慣コーチ（小鳥つき）</p>
      </footer>

      {/* グローバルスタイル */}
      <style jsx global>{`
        :root {
          --blue-light: #e9f4fb;
          --blue-main: #1976d2;
          --blue-dark: #0d3b66;
          --accent: #90caf9;
          --white: #ffffff;
        }
        body {
          font-family: 'Helvetica Neue', sans-serif;
          background: var(--blue-light);
          color: var(--blue-dark);
          line-height: 1.6;
          scroll-behavior: smooth;
        }
        .fade {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease-out;
        }
        .fade.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}