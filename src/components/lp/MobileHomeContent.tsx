'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { FaCheckCircle, FaHeart, FaClock, FaChartLine, FaBrain, FaArchive, FaArrowRight, FaTwitter, FaFileAlt, FaUsers, FaSmile, FaTasks, FaFire, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import Lottie from 'lottie-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface MobileHomeContentProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
}

export const MobileHomeContent: React.FC<MobileHomeContentProps> = ({
  onLogin,
  onRegister,
  onGuest,
  isLoading
}) => {
  const [currentUIIndex, setCurrentUIIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showChirp, setShowChirp] = useState(false);
  
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
    <div className="pb-0 mb-0">
      {/* 1. Heroセクション */}
      <section className="flex flex-col justify-center px-6 py-8 relative bg-transparent" ref={heroAnimation.elementRef}>
        <div className="text-center space-y-8">
          {/* キャッチフレーズ */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className={`transition-all duration-1000 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight relative">
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
                      <div className="absolute -top-1 -right-4 w-6 h-6 z-30">
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
              <p className="text-lg text-[#7c5a2a] leading-relaxed px-4 mt-6">
                感情・タスク・習慣をひとつの流れで記録し、毎朝9時、AIキャラクターがあなたをやさしく応援します。
              </p>
            </div>
          </div>

          {/* アプリ画面（PCとモバイル） */}
          <div className={`flex justify-center items-center my-4 relative px-1 mb-8 transition-all duration-1000 delay-200 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* PCフレーム（背景） */}
            <div className="relative">
            <Image
                src="/PCFrame.png"
                alt="StepEasy PC版画面"
                width={400}
              height={300}
                className="drop-shadow-xl w-full max-w-[400px]"
              />
            </div>
            {/* モバイルフレーム（前面・右寄り） */}
            <div className="absolute left-1/2 transform -translate-x-1/2 translate-x-6 top-10 z-10">
              <Image
                src="/MobileFrame.png"
                alt="StepEasy モバイル版画面"
                width={80}
                height={160}
                className="drop-shadow-2xl"
              />
            </div>
          </div>

          <div className={`flex flex-col gap-4 px-4 mt-8 transition-all duration-1000 delay-200 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={onRegister}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              無料ではじめる
            </button>
            <button
              onClick={onGuest}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-transparent hover:bg-[#f5f5dc] text-[#8b4513] border-2 border-[#8b4513] rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              まずは体験
            </button>
          </div>
        </div>
      </section>

      {/* 2. 機能紹介セクション */}
      <section className="py-16 px-6" ref={featuresAnimation.elementRef}>
        <div className="max-w-2xl mx-auto">
          <div className={`transition-all duration-1000 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 relative">
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
                      }}>習慣</span>も<br />ひとつの流れで。
              </div>
            </h2>
          </div>
          
          <div className={`space-y-6 transition-all duration-1000 delay-200 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* 習慣記録 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center transition-all duration-300">
                  {(FaFire as any)({ className: "w-6 h-6 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513] group-hover:text-[#6d3d13] transition-colors duration-300">習慣記録</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                継続日数・頻度・状態を記録。ストリーク表示で習慣化アプリとしての効果を実感できます。
              </p>
            </div>

            {/* タスク記録 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center transition-all duration-300">
                  {(FaTasks as any)({ className: "w-6 h-6 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513] group-hover:text-[#6d3d13] transition-colors duration-300">タスク記録</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                1日のやることを記録し、完了状況も管理。効率的なタスク管理で生産性向上をサポート。
              </p>
            </div>

            {/* 実行時間記録 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center transition-all duration-300">
                  {(FaClock as any)({ className: "w-6 h-6 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513] group-hover:text-[#6d3d13] transition-colors duration-300">実行時間記録</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                各行動の実施時間を記録し、統計へ活用。時間の使い方を可視化して改善点を発見。
              </p>
            </div>

            {/* 感情記録 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center transition-all duration-300">
                  {(FaHeart as any)({ className: "w-6 h-6 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513] group-hover:text-[#6d3d13] transition-colors duration-300">感情記録</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                朝・昼・夜に気持ちを簡単記録。感情記録により自分の心の状態を理解し、メンタルヘルスをサポート。
              </p>
            </div>

            {/* AIメッセージ */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center transition-all duration-300">
                  {(FaBrain as any)({ className: "w-6 h-6 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513] group-hover:text-[#6d3d13] transition-colors duration-300">AI応援メッセージ</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                毎朝9時に、前日の感情と行動をもとにした"応援のひとこと"が届く。AI応援メッセージで継続をサポート。
              </p>
            </div>

            {/* アーカイブ */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-2xl hover:scale-105 hover:border-[#8b4513] transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] group-hover:bg-[#8b4513] rounded-full flex items-center justify-center transition-all duration-300">
                  {(FaArchive as any)({ className: "w-6 h-6 text-[#8b4513] group-hover:text-white transition-colors duration-300" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513] group-hover:text-[#6d3d13] transition-colors duration-300">アーカイブ</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm leading-relaxed group-hover:text-[#5d4037] transition-colors duration-300">
                すべての記録を保存・検索可能。過去の成長を振り返り、継続のモチベーションを維持。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 可視化・統計セクション */}
      <section className="py-16 px-6" ref={statsAnimation.elementRef}>
        <div className="max-w-2xl mx-auto">
          <div className={`transition-all duration-1000 ${statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 relative">
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
                      }}>行動</span>が、<br /><span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>カタチ</span>になる。
              </div>
            </h2>
          </div>
          
          <div className="space-y-12">
            {/* 日次達成度 */}
            <div className="space-y-6">
              <div className={`text-center transition-all duration-1000 delay-300 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4">日次達成度</h3>
                <p className="text-[#7c5a2a] leading-relaxed">
                  習慣・タスクの完了率をグラフで表示。毎日の成果を可視化することで、継続のモチベーションを高めます。
                </p>
              </div>
              <div className={`transition-all duration-1000 delay-600 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <Image
                  src="/Strategy.png"
                  alt="統計グラフUI"
                  width={500}
                  height={240}
                  className="max-w-full h-auto mx-auto"
                />
              </div>
            </div>

            {/* ヒートマップ */}
            <div className="space-y-6">
              <div className={`text-center transition-all duration-1000 delay-300 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4">ヒートマップ</h3>
                <p className="text-[#7c5a2a] leading-relaxed">
                  実行時間帯（曜日×時間）の傾向を色で可視化。あなたの行動パターンを理解し、最適な時間帯を発見。
                </p>
              </div>
              <div className={`transition-all duration-1000 delay-600 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <Image
                  src="/HeatMap.png"
                  alt="ヒートマップUI"
                  width={500}
                  height={240}
                  className="max-w-full h-auto mx-auto"
                />
              </div>
            </div>

            {/* カテゴリ別統計 */}
            <div className="space-y-6">
              <div className={`text-center transition-all duration-1000 delay-300 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <h3 className="text-xl font-bold text-[#8b4513] mb-4">カテゴリ別統計</h3>
                <p className="text-[#7c5a2a] leading-relaxed">
                  タスク/習慣の分類と傾向を分析。どの分野で成長しているかを把握し、バランスの取れた生活をサポート。
                </p>
              </div>
              <div className={`transition-all duration-1000 delay-600 ${statsAnimation.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <Image
                  src="/CategoryStrategy.png"
                  alt="カテゴリ統計UI"
                  width={500}
                  height={240}
                  className="max-w-full h-auto mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AIメッセージの紹介 */}
      <section className="py-16 px-6" ref={aiMessageAnimation.elementRef}>
        <div className="max-w-2xl mx-auto">
          <div className={`transition-all duration-1000 ${aiMessageAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 relative">
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
          
          <div className="space-y-8">
            <div className={`text-center transition-all duration-1000 delay-200 ${aiMessageAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-lg text-[#7c5a2a] leading-relaxed">
                StepEasyのAI応援メッセージは、達成率や感情の傾向を読み取り、毎朝9時に小鳥キャラクターがあなたに"今必要なひとこと"を届けてくれます。
              </p>
            </div>
            
            <div className={`bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] transition-all duration-1000 delay-400 ${aiMessageAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Image
                    src="/TalkToTheBird.png"
                    alt="StepEasy AIキャラクター"
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-[#f7ecd7] to-[#f5e9da] border border-[#deb887] rounded-2xl p-4 relative shadow-2xl">
                    <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-[#f7ecd7]"></div>
                    <div className="text-[#7c5a2a] font-medium leading-relaxed text-sm">
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

      {/* 5. UIギャラリー */}
      <section className="py-16 px-6" ref={uiGalleryAnimation.elementRef}>
        <div className="max-w-2xl mx-auto">
          <div className={`transition-all duration-1000 ${uiGalleryAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
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

          <div className={`bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] transition-all duration-1000 delay-200 ${uiGalleryAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevUI}
                className="p-2 rounded-full bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white transition-colors"
              >
                {(FaChevronUp as any)({ className: "w-4 h-4" })}
              </button>
              <h3 className="text-lg font-bold text-[#8b4513] text-center">
                {uiGalleryItems[currentUIIndex].title}
              </h3>
              <button
                onClick={nextUI}
                className="p-2 rounded-full bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white transition-colors"
              >
                {(FaChevronDown as any)({ className: "w-4 h-4" })}
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-full h-64 bg-[#f5f5dc] rounded-xl flex items-center justify-center mb-4">
                <p className="text-[#7c5a2a] text-sm">{uiGalleryItems[currentUIIndex].title}（後で画像に置換）</p>
              </div>
              <p className="text-[#7c5a2a] text-sm">{uiGalleryItems[currentUIIndex].description}</p>
            </div>
            
            <div className="flex justify-center mt-6 space-x-2">
              {uiGalleryItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentUIIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentUIIndex ? 'bg-[#8b4513]' : 'bg-[#deb887]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. ターゲット訴求セクション */}
      <section className="py-16 px-6" ref={targetAudienceAnimation.elementRef}>
        <div className="max-w-2xl mx-auto">
          <div className={`transition-all duration-1000 ${targetAudienceAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                このアプリは、<br />こんな<span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>あなた</span>へ
              </div>
            </h2>
          </div>
          
          <div className={`space-y-6 transition-all duration-1000 delay-200 ${targetAudienceAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] rounded-full flex items-center justify-center">
                  {(FaUsers as any)({ className: "w-6 h-6 text-[#8b4513]" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513]">習慣を"自分のペース"で続けたい人</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm">
                無理のないペースで、持続可能な習慣づくりをサポート
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] rounded-full flex items-center justify-center">
                  {(FaSmile as any)({ className: "w-6 h-6 text-[#8b4513]" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513]">感情も大事にしながら行動したい人</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm">
                感情記録で心の状態を理解し、バランスの取れた生活を実現
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] rounded-full flex items-center justify-center">
                  {(FaHeart as any)({ className: "w-6 h-6 text-[#8b4513]" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513]">自己肯定感を育てたい人</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm">
                小さな成功を積み重ね、自信を持って成長していける環境を提供
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#deb887] rounded-full flex items-center justify-center">
                  {(FaChartLine as any)({ className: "w-6 h-6 text-[#8b4513]" })}
                </div>
                <h3 className="text-lg font-bold text-[#8b4513]">小さな前進を毎日感じたい人</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm">
                日々の成長を可視化し、継続のモチベーションを維持
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 外部リンクセクション */}
      <section className="py-16 px-6" ref={externalLinksAnimation.elementRef}>
        <div className="max-w-2xl mx-auto">
          <div className={`transition-all duration-1000 ${externalLinksAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 relative">
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
          
          <div className={`space-y-4 transition-all duration-1000 delay-200 ${externalLinksAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <a
              href="#"
              className="block bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#deb887] rounded-full flex items-center justify-center">
                  {(FaFileAlt as any)({ className: "w-6 h-6 text-[#8b4513]" })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#8b4513] mb-1">note</h3>
                  <p className="text-[#7c5a2a] text-sm">開発ストーリーや使い方解説</p>
                </div>
              </div>
            </a>

            <a
              href="#"
              className="block bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-[#deb887] hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#deb887] rounded-full flex items-center justify-center">
                  {(FaTwitter as any)({ className: "w-6 h-6 text-[#8b4513]" })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#8b4513] mb-1">Twitter(X)</h3>
                  <p className="text-[#7c5a2a] text-sm">最新情報や運用</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 8. 最終CTAセクション */}
      <section className="py-16 px-6 relative" ref={finalCtaAnimation.elementRef}>
        <div className="max-w-2xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${finalCtaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl font-bold text-center mb-8 relative">
              {/* 背景レイヤー（影効果） */}
              <div className="absolute inset-0 bg-white/30 rounded-2xl transform translate-x-1 translate-y-1 blur-sm"></div>
              
              {/* メインテキスト */}
              <div className="relative z-10 text-[#4a3728]" 
                   style={{ 
                     textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), 2px 2px 4px rgba(139, 69, 19, 0.3)',
                     filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                   }}>
                今日から、<br /><span className="relative z-20 text-[#8b4513] font-extrabold"
                      style={{ 
                        textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(139, 69, 19, 0.4)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                      }}>小さなステップ</span>を
              </div>
            </h2>
            
            <p className="text-lg text-[#7c5a2a] leading-relaxed mb-12">
              StepEasyは、あなたの「やってよかった」を毎日に変えていきます。まずは、小鳥の一声からはじめてみませんか？
            </p>
          </div>
          
          <div className={`flex flex-col gap-4 mb-12 transition-all duration-1000 delay-200 ${finalCtaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={onRegister}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-[#8b4513] hover:bg-[#7c5a2a] text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              無料ではじめる
            </button>
            <button
              onClick={onGuest}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-transparent hover:bg-[#f5f5dc] text-[#8b4513] border-2 border-[#8b4513] rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              まずは体験
            </button>
          </div>

          {/* メインキャラクター（中央下） */}
          <div className={`flex justify-center mb-8 transition-all duration-1000 delay-400 ${finalCtaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Image
              src="/TalkToTheBird.png"
              alt="StepEasy AIキャラクター"
              width={120}
              height={120}
              className="drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* 9. フッター */}
      <footer className="py-6 px-6 pb-20 bg-gradient-to-br from-[#f5f5dc]/60 to-[#deb887]/30 backdrop-blur-sm text-[#4a3728]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-4">
            <div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="StepEasy ロゴ"
                  width={80}
                  height={80}
                  className="h-8 w-auto"
                  quality={100}
                />
                <h3 className="text-lg font-bold">StepEasy</h3>
              </div>
              <p className="text-[#7c5a2a] text-sm">
                小鳥の一声が、あなたの習慣を運んでいく
              </p>
            </div>
            
            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-bold mb-2">リンク</h4>
                <div className="flex flex-wrap justify-center gap-4 text-[#7c5a2a] text-sm">
                  <a href="/privacy" target="_blank" className="hover:text-[#8b4513] transition-colors">プライバシーポリシー</a>
                  <a href="/terms" target="_blank" className="hover:text-[#8b4513] transition-colors">利用規約</a>
                  <a href="mailto:stepeasytasks@gmail.com" className="hover:text-[#8b4513] transition-colors">お問い合わせ</a>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold mb-2">SNS</h4>
                <div className="flex justify-center gap-4">
                  <a href="#" className="text-[#7c5a2a] hover:text-[#8b4513] transition-colors">
                    {(FaTwitter as any)({ className: "w-5 h-5" })}
                  </a>
                  <a href="#" className="text-[#7c5a2a] hover:text-[#8b4513] transition-colors">
                    {(FaFileAlt as any)({ className: "w-5 h-5" })}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#deb887]/30 pt-3">
              <p className="text-[#7c5a2a] text-sm">&copy; naonao96. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 