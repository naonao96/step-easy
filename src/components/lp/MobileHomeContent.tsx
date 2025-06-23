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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 opacity-60"></div>
        
        <div className="relative z-10 text-center">
          {/* メインコピー */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
              小鳥の一声が、
              <br />
              あなたの習慣を
              <br />
              運んでいく
            </h1>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              感情を理解し、あなたのペースで習慣を育てる
            </p>
            
            <div className="flex flex-col gap-2 text-sm text-slate-600 mb-8">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Google Gemini AI搭載</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>感情分析機能</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors disabled:opacity-50"
            >
              無料で始める
            </button>
            
            <button
              onClick={onGuest}
              disabled={isLoading}
              className="w-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold py-4 px-8 rounded-xl text-lg transition-colors disabled:opacity-50"
            >
              まずは体験
            </button>
          </div>
        </div>
      </section>

      {/* 特別体験セクション */}
      <section className="px-6 py-8 bg-white">
        <div className="space-y-6">
          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {(FaBrain as any)({ className: "w-8 h-8 text-blue-600" })}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">感情を理解するAI</h3>
              <p className="text-slate-600">
                "今日は疲れてるね、無理しなくていいよ"
              </p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {(FaChartLine as any)({ className: "w-8 h-8 text-green-600" })}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">行動パターンの可視化</h3>
              <p className="text-slate-600">
                "あなたは水曜日が一番集中できるタイプですね"
              </p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {(FaHeart as any)({ className: "w-8 h-8 text-purple-600" })}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">いつも寄り添うパートナー</h3>
              <p className="text-slate-600">
                "小さな一歩も、確実に前進です"
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}; 