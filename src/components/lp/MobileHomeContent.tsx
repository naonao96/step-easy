'use client';

import React from 'react';
import Image from 'next/image';
import { FaBrain, FaChartLine, FaHeart } from 'react-icons/fa';

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
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヒーローセクション */}
      <section className="flex-1 flex flex-col justify-center px-6 py-8 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5dc] via-[#deb887] to-[#f5f5dc] opacity-60"></div>
        
        <div className="relative z-10 text-center">
          {/* メインコピー */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#8b4513] mb-4 leading-tight">
              小鳥の一声が、
              <br />
              あなたの習慣を
              <br />
              運んでいく
            </h1>
            <p className="text-lg text-[#7c5a2a] mb-6 leading-relaxed">
              感情を理解し、あなたのペースで習慣を育てる
            </p>
            
            <div className="flex flex-col gap-2 text-sm text-[#7c5a2a] mb-8">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[#8b4513] rounded-full"></div>
                <span>Google Gemini AI搭載</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[#7c5a2a] rounded-full"></div>
                <span>感情分析機能</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[#deb887] rounded-full"></div>
                <span>習慣継続サポート</span>
              </div>
            </div>
          </div>

          {/* キャラクター */}
          <div className="mb-8">
            <Image
              src="/TalkToTheBird.png"
              alt="StepEasy 小鳥キャラクター"
              width={300}
              height={300}
              className="mx-auto drop-shadow-2xl"
            />
          </div>

          {/* メインCTA */}
          <div className="space-y-4 mb-8">
            <button
              onClick={onRegister}
              disabled={isLoading}
              className="w-full bg-[#8b4513] hover:bg-[#7c5a2a] text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors disabled:opacity-50"
            >
              無料で始める
            </button>
            
            <button
              onClick={onGuest}
              disabled={isLoading}
              className="w-full bg-[#deb887] hover:bg-[#8b4513] text-[#8b4513] hover:text-white border-2 border-[#8b4513] font-bold py-4 px-8 rounded-xl text-lg transition-colors disabled:opacity-50"
            >
              まずは体験
            </button>
          </div>
        </div>
      </section>

      {/* 特別体験セクション */}
      <section className="px-6 py-8 bg-[#f5f5dc]">
        <div className="space-y-6">
          <div className="bg-[#f5f5dc]/70 backdrop-blur rounded-2xl p-6 shadow-xl border border-[#deb887]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-4">
                {(FaBrain as any)({ className: "w-8 h-8 text-[#8b4513]" })}
              </div>
              <h3 className="text-xl font-bold text-[#8b4513] mb-3">感情を理解するAI</h3>
              <p className="text-[#7c5a2a]">
                "今日は疲れてるね、無理しなくていいよ"
              </p>
            </div>
          </div>

          <div className="bg-[#f5f5dc]/70 backdrop-blur rounded-2xl p-6 shadow-xl border border-[#deb887]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-4">
                {(FaChartLine as any)({ className: "w-8 h-8 text-[#8b4513]" })}
              </div>
              <h3 className="text-xl font-bold text-[#8b4513] mb-3">行動パターンの可視化</h3>
              <p className="text-[#7c5a2a]">
                "あなたは水曜日が一番集中できるタイプですね"
              </p>
            </div>
          </div>

          <div className="bg-[#f5f5dc]/70 backdrop-blur rounded-2xl p-6 shadow-xl border border-[#deb887]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#deb887] rounded-full flex items-center justify-center mx-auto mb-4">
                {(FaHeart as any)({ className: "w-8 h-8 text-[#8b4513]" })}
              </div>
              <h1 className="text-xl font-bold text-[#8b4513] mb-3">いつも寄り添うパートナー</h1>
              <p className="text-[#7c5a2a]">
                "小さな一歩も、確実に前進です"
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}; 