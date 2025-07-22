import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { FaCheckCircle, FaHeart, FaClock, FaChartLine, FaBrain, FaArchive, FaArrowRight, FaTwitter, FaFileAlt, FaUsers, FaSmile, FaTasks, FaFire } from 'react-icons/fa';
import Lottie from 'lottie-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface HomeContentProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
}

export const HomeContent: React.FC<HomeContentProps> = ({ onLogin, onRegister, onGuest, isLoading }) => {
  const [currentUIIndex, setCurrentUIIndex] = useState(0);
  
  // タイプライター効果用の状態
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // タイプライター効果の関数
  const startTypewriter = useCallback((text: string) => {
    setIsTyping(true);
    setDisplayedMessage('');
    let i = 0;
    
    const type = () => {
      const currentText = text.slice(0, i);
      setDisplayedMessage(currentText);
      if (i < text.length) {
        i++;
        typewriterTimeoutRef.current = setTimeout(type, 30);
      } else {
        setIsTyping(false);
      }
    };
    
    type();
  }, []);
  
  const [isVisible, setIsVisible] = useState(false);
  const [showChirp, setShowChirp] = useState(false);

  // 各セクションのアニメーション
  const heroAnimation = useScrollAnimation();
  const featuresAnimation = useScrollAnimation();
  const statsAnimation = useScrollAnimation();
  const aiMessageAnimation = useScrollAnimation();
  const uiGalleryAnimation = useScrollAnimation();
  const targetAudienceAnimation = useScrollAnimation();
  const externalLinksAnimation = useScrollAnimation();
  const finalCtaAnimation = useScrollAnimation();

  useEffect(() => {
    // ページロード時のフェードインアニメーション
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800);

    // さえずりアニメーション（「ひと声」の部分で発動）
    const chirpTimer = setTimeout(() => {
      setShowChirp(true);
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearTimeout(chirpTimer);
    };
  }, []);
  
  // AIメッセージセクションが表示されたときにタイプライター効果を開始
  useEffect(() => {
    if (aiMessageAnimation.isVisible && !displayedMessage) {
      const message = "昨日は少しお疲れだったみたいですね😌 でも、習慣は4日も続いていてすごい👏 57%の全体完了率も素晴らしいですよ！";
      // アニメーションの遅延後にタイプライター開始
      setTimeout(() => {
        startTypewriter(message);
      }, 600); // delay-400 + 200ms の余裕
    }
  }, [aiMessageAnimation.isVisible, displayedMessage, startTypewriter]);

  const uiGalleryItems = [
    { title: "感情記録UI", description: "朝・昼・夜の感情を簡単記録", image: "/assets/emotion-ui.png" },
    { title: "習慣・タスク一覧", description: "継続状況を一目で確認", image: "/assets/task-list-ui.png" },
    { title: "AIメッセージ", description: "毎朝9時に応援メッセージ", image: "/assets/ai-message-ui.png" },
    { title: "統計ヒートマップ", description: "行動パターンを可視化", image: "/assets/heatmap-ui.png" },
    { title: "全体統計", description: "成長を数値で実感", image: "/assets/stats-ui.png" }
  ];

  const nextUI = () => {
    setCurrentUIIndex((prev) => (prev + 1) % uiGalleryItems.length);
  };

  const prevUI = () => {
    setCurrentUIIndex((prev) => (prev - 1 + uiGalleryItems.length) % uiGalleryItems.length);
  };

  return (
    <div className="min-h-screen">
      {/* 1. Heroセクション */}
      <section className="relative min-h-screen flex items-center justify-center px-8 py-16 bg-transparent" ref={heroAnimation.elementRef}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* 左側: テキスト領域 */}
            <div className="space-y-8 text-center lg:text-left">
              <div className={`transition-all duration-1000 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-6 relative">
                  {/* 背景レイヤー（影効果） */}
                  <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
                  
                  {/* メインテキスト */}
                  <div className="relative z-10 text-[#4a3728]" 
                       style={{ 
                         textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                         filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                       }}>
                    小鳥の
                    <span className="relative inline-block">
                      <span className="relative z-20 text-[#8b4513] font-extrabold"
                            style={{ 
                              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                            }}>
                        ひと声
                      </span>
                      {showChirp && (
                        <div className="absolute -top-2 -right-6 w-8 h-8 z-30">
                          <Lottie
                            animationData={require('/public/bird-chirp-animation.json')}
                            loop={true}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                      )}
                    </span>
                    が、<br />
                あなたの習慣を<br />
                    運んでいく。
                  </div>
              </h1>
                <p className="text-xl lg:text-2xl text-[#7c5a2a] leading-relaxed mt-6">
                  感情・タスク・習慣をひとつの流れで記録し、毎朝9時、AIキャラクターがあなたをやさしく応援します。
                </p>
              </div>
              
              <div className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-1000 delay-200 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <button
                  onClick={onRegister}
                  disabled={isLoading}
                  className="px-8 py-4 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  無料ではじめる
                </button>
                <button
                  onClick={onGuest}
                  disabled={isLoading}
                  className="px-8 py-4 bg-transparent hover:bg-[#f5f5dc] text-[#8b4513] border-2 border-[#8b4513] rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  まずは体験
                </button>
              </div>
            </div>

            {/* 右側: ビジュアル領域 */}
            <div className="relative">
              <div className={`flex justify-center items-center relative transition-all duration-1000 delay-200 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* PCフレーム（背景） */}
                <div className="relative">
                  <Image
                    src="/PCFrame.png"
                    alt="StepEasy PC版画面"
                    width={600}
                    height={450}
                    className="drop-shadow-xl"
                  />
                </div>

                {/* モバイルフレーム（前面・右寄り） */}
                <div className="absolute left-1/2 transform -translate-x-1/2 translate-x-8 top-8 z-10">
                  <Image
                    src="/MobileFrame.png"
                    alt="StepEasy モバイル版画面"
                    width={180}
                    height={360}
                    className="drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 機能紹介セクション */}
      <section className="py-20 px-8" ref={featuresAnimation.elementRef}>
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-1000 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                <span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>行動</span>も、<span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>感情</span>も、<span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>習慣</span>も ひとつの流れで。
              </div>
            </h2>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* 習慣記録 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
                  {FaFire({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4 group-hover:text-[#6d3d13] transition-colors duration-300">習慣記録</h3>
                <p className="text-[#7c5a2a] leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                  継続日数・頻度・状態を記録。ストリーク表示で習慣化アプリとしての効果を実感できます。
                </p>
              </div>
            </div>

            {/* タスク記録 */}
            <div className={`bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
                  {FaTasks({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4 group-hover:text-[#6d3d13] transition-colors duration-300">タスク記録</h3>
                <p className="text-[#7c5a2a] leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                  1日のやることを記録し、完了状況も管理。効率的なタスク管理で生産性向上をサポート。
                </p>
              </div>
            </div>

            {/* 実行時間記録 */}
            <div className={`bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
                  {FaClock({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4 group-hover:text-[#6d3d13] transition-colors duration-300">実行時間記録</h3>
                <p className="text-[#7c5a2a] leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                  各行動の実施時間を記録し、統計へ活用。時間の使い方を可視化して改善点を発見。
                </p>
              </div>
            </div>

            {/* 感情記録 */}
            <div className={`bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
                  {FaHeart({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4 group-hover:text-[#6d3d13] transition-colors duration-300">感情記録</h3>
                <p className="text-[#7c5a2a] leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                  朝・昼・夜に気持ちを簡単記録。感情記録により自分の心の状態を理解し、メンタルヘルスをサポート。
                </p>
              </div>
            </div>

            {/* AIメッセージ */}
            <div className={`bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
                  {FaBrain({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4 group-hover:text-[#6d3d13] transition-colors duration-300">AI応援メッセージ</h3>
                <p className="text-[#7c5a2a] leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                  毎朝9時に、前日の感情と行動をもとにした"応援のひとこと"が届く。AI応援メッセージで継続をサポート。
                </p>
              </div>
            </div>

            {/* アーカイブ */}
            <div className={`bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
                  {FaArchive({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4 group-hover:text-[#6d3d13] transition-colors duration-300">アーカイブ</h3>
                <p className="text-[#7c5a2a] leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                  すべての記録を保存・検索可能。過去の成長を振り返り、継続のモチベーションを維持。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 可視化・統計セクション */}
      <section className="py-20 px-8" ref={statsAnimation.elementRef}>
        <div className="max-w-[1400px] mx-auto">
          <div className={`transition-all duration-1000 ${statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                あなたの<span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>行動</span>が、カタチになる。
              </div>
            </h2>
          </div>
          
          <div className="space-y-16">
            {/* 日次達成度 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className={`space-y-6 transition-all duration-1000 delay-300 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <h3 className="text-2xl font-bold text-[#8b4513]">日次達成度</h3>
                <p className="text-lg text-[#7c5a2a] leading-relaxed">
                  習慣・タスクの完了率をグラフで表示。毎日の成果を可視化することで、継続のモチベーションを高めます。
                </p>
              </div>
              <div className={`flex justify-center items-center transition-all duration-1000 delay-600 min-w-[600px] ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <Image
                  src="/Strategy.png"
                  alt="統計グラフUI"
                  width={500}
                  height={320}
                  className="w-[500px] h-[320px]"
                />
              </div>
            </div>

            {/* ヒートマップ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className={`flex justify-center items-center lg:order-first transition-all duration-1000 delay-300 min-w-[600px] ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <Image
                  src="/HeatMap.png"
                  alt="ヒートマップUI"
                  width={500}
                  height={320}
                  className="w-[500px] h-[320px]"
                />
              </div>
              <div className={`space-y-6 transition-all duration-1000 delay-600 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <h3 className="text-2xl font-bold text-[#8b4513]">ヒートマップ</h3>
                <p className="text-lg text-[#7c5a2a] leading-relaxed">
                  実行時間帯（曜日×時間）の傾向を色で可視化。あなたの行動パターンを理解し、最適な時間帯を発見。
                </p>
              </div>
            </div>

            {/* カテゴリ別統計 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className={`space-y-6 transition-all duration-1000 delay-300 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <h3 className="text-2xl font-bold text-[#8b4513]">カテゴリ別統計</h3>
                <p className="text-lg text-[#7c5a2a] leading-relaxed">
                  タスク/習慣の分類と傾向を分析。どの分野で成長しているかを把握し、バランスの取れた生活をサポート。
                </p>
              </div>
              <div className={`flex justify-center items-center transition-all duration-1000 delay-600 min-w-[600px] ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <Image
                  src="/CategoryStrategy.png"
                  alt="カテゴリ統計UI"
                  width={500}
                  height={320}
                  className="w-[500px] h-[320px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AIメッセージの紹介 */}
      <section className="py-20 px-8" ref={aiMessageAnimation.elementRef}>
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-1000 ${aiMessageAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                気づいてくれる<span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>存在</span>がいる
              </div>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-12">
            <div className={`text-center transition-all duration-1000 delay-200 ${aiMessageAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-xl text-[#7c5a2a] leading-relaxed">
                StepEasyのAI応援メッセージは、達成率や感情の傾向を読み取り、<br />
                毎朝9時に小鳥キャラクターがあなたに"今必要なひとこと"を届けてくれます。
              </p>
            </div>
            
            <div className={`bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] transition-all duration-1000 delay-400 ${aiMessageAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src="/TalkToTheBird.png"
                    alt="StepEasy AIキャラクター"
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-[#f7ecd7] to-[#f5e9da] border border-[#deb887] rounded-2xl p-6 relative shadow-2xl">
                    <div className="absolute -left-3 top-6 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-[#f7ecd7]"></div>
                    <div className="text-[#7c5a2a] font-medium leading-relaxed text-lg">
                      "{displayedMessage}"
                      {isTyping && <span className="animate-pulse ml-1">|</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. UIギャラリー - 一時的に非表示 */}
      {/* <section className="py-20 px-8" ref={uiGalleryAnimation.elementRef}>
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-1000 ${uiGalleryAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 relative">
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                画面で見る <span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>StepEasy</span>
              </div>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className={`bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] transition-all duration-1000 delay-200 ${uiGalleryAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={prevUI}
                    className="p-2 rounded-full bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white transition-colors"
                  >
                    {(FaArrowRight as any)({ className: "w-5 h-5 transform rotate-180" })}
                  </button>
                  <h3 className="text-xl font-bold text-[#8b4513]">
                    {uiGalleryItems[currentUIIndex].title}
                  </h3>
                  <button
                    onClick={nextUI}
                    className="p-2 rounded-full bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white transition-colors"
                  >
                    {(FaArrowRight as any)({ className: "w-5 h-5" })}
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="w-full h-96 bg-[#f5f5dc] rounded-xl flex items-center justify-center mb-4">
                    <p className="text-[#7c5a2a]">{uiGalleryItems[currentUIIndex].title}（後で画像に置換）</p>
                  </div>
                  <p className="text-[#7c5a2a]">{uiGalleryItems[currentUIIndex].description}</p>
                </div>
              </div>
              
              <div className={`flex justify-center mt-6 space-x-2 transition-all duration-1000 delay-400 ${uiGalleryAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {uiGalleryItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentUIIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentUIIndex ? 'bg-[#8b4513]' : 'bg-[#deb887]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* 6. ターゲット訴求セクション */}
      <section className="py-20 px-8" ref={targetAudienceAnimation.elementRef}>
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-1000 ${targetAudienceAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                このアプリは、こんな<span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>あなた</span>へ
              </div>
            </h2>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 delay-200 ${targetAudienceAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] text-center">
              <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-6">
                {(FaUsers as any)({ className: "w-8 h-8 text-[#8b4513]" })}
              </div>
              <h3 className="text-lg font-bold text-[#8b4513] mb-4">習慣を"自分のペース"で続けたい人</h3>
              <p className="text-[#7c5a2a] text-sm">
                無理のないペースで、持続可能な習慣づくりをサポート
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] text-center">
              <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-6">
                {(FaSmile as any)({ className: "w-8 h-8 text-[#8b4513]" })}
              </div>
              <h3 className="text-lg font-bold text-[#8b4513] mb-4">感情も大事にしながら行動したい人</h3>
              <p className="text-[#7c5a2a] text-sm">
                感情記録で心の状態を理解し、バランスの取れた生活を実現
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] text-center">
              <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-6">
                {(FaHeart as any)({ className: "w-8 h-8 text-[#8b4513]" })}
              </div>
              <h3 className="text-lg font-bold text-[#8b4513] mb-4">自己肯定感を育てたい人</h3>
              <p className="text-[#7c5a2a] text-sm">
                小さな成功を積み重ね、自信を持って成長していける環境を提供
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] text-center">
              <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-6">
                {(FaChartLine as any)({ className: "w-8 h-8 text-[#8b4513]" })}
              </div>
              <h3 className="text-lg font-bold text-[#8b4513] mb-4">小さな前進を毎日感じたい人</h3>
              <p className="text-[#7c5a2a] text-sm">
                日々の成長を可視化し、継続のモチベーションを維持
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 外部リンクセクション */}
      <section className="py-20 px-8" ref={externalLinksAnimation.elementRef}>
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-1000 ${externalLinksAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                <span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>もっと詳しく</span>知りたい方へ
              </div>
            </h2>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-200 ${externalLinksAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <a
              href="https://note.com/preview/n179346d630b0"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center group-hover:bg-[#8b4513] transition-colors">
                  {(FaFileAlt as any)({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white" })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#8b4513] mb-2">note</h3>
                  <p className="text-[#7c5a2a]">開発ストーリーや使い方解説</p>
                </div>
              </div>
            </a>

            <a
              href="https://x.com/stepeasyjp"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-[#deb887] hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center group-hover:bg-[#8b4513] transition-colors">
                  {(FaTwitter as any)({ className: "w-8 h-8 text-[#8b4513] group-hover:text-white" })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#8b4513] mb-2">Twitter(X)</h3>
                  <p className="text-[#7c5a2a]">最新情報や運用</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 8. 最終CTAセクション */}
      <section className="py-20 px-8 relative" ref={finalCtaAnimation.elementRef}>
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${finalCtaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-center mb-8 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                今日から、<span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>小さなステップ</span>を
              </div>
            </h2>
            
            <p className="text-xl text-[#7c5a2a] leading-relaxed mb-12 max-w-3xl mx-auto">
              StepEasyは、あなたの「やってよかった」を毎日に変えていきます。<br />
              まずは、小鳥の一声からはじめてみませんか？
            </p>
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-1000 delay-200 ${finalCtaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <button
                onClick={onRegister}
                disabled={isLoading}
              className="px-8 py-4 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
              無料ではじめる
              </button>
              <button
                onClick={onGuest}
                disabled={isLoading}
              className="px-8 py-4 bg-transparent hover:bg-[#f5f5dc] text-[#8b4513] border-2 border-[#8b4513] rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                まずは体験
              </button>
          </div>

          {/* メインキャラクター（中央下） */}
          <div className={`flex justify-center mb-8 transition-all duration-1000 delay-400 ${finalCtaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Image
              src="/TalkToTheBird.png"
              alt="StepEasy AIキャラクター"
              width={160}
              height={160}
              className="drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* 9. フッター */}
      <footer className="py-12 pl-8 pr-4 bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm text-[#4a3728]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="StepEasy ロゴ"
                  width={80}
                  height={80}
                  className="h-10 w-auto"
                  quality={100}
                />
              </div>
              <p className="text-[#7c5a2a]">
                小鳥の一声が、あなたの習慣を運んでいく
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">リンク</h4>
              <ul className="space-y-2 text-[#7c5a2a]">
                <li><a href="/privacy" target="_blank" className="hover:text-[#8b4513] transition-colors">プライバシーポリシー</a></li>
                <li><a href="/terms" target="_blank" className="hover:text-[#8b4513] transition-colors">利用規約</a></li>
                <li><a href="mailto:stepeasytasks@gmail.com" className="hover:text-[#8b4513] transition-colors">お問い合わせ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4">SNS</h4>
              <div className="flex gap-4">
                <a href="https://x.com/stepeasyjp" target="_blank" rel="noopener noreferrer" className="text-[#7c5a2a] hover:text-[#8b4513] transition-colors">
                  {(FaTwitter as any)({ className: "w-6 h-6" })}
                </a>
                <a href="https://note.com/preview/n179346d630b0" target="_blank" rel="noopener noreferrer" className="text-[#7c5a2a] hover:text-[#8b4513] transition-colors">
                  {(FaFileAlt as any)({ className: "w-6 h-6" })}
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#deb887]/30 mt-8 pt-8 text-center text-[#7c5a2a]">
            <p>&copy; naonao96. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}; 