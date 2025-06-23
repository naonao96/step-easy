import React from 'react';
import Image from 'next/image';
import { FaBrain, FaChartLine, FaHeart } from 'react-icons/fa';

interface HomeContentProps {
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  isLoading: boolean;
}

export const HomeContent: React.FC<HomeContentProps> = ({ onLogin, onRegister, onGuest, isLoading }) => {
  return (
    <div className="p-8">
      {/* ヒーローセクション */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[600px]">
          {/* 左側: メインコンテンツ */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-slate-900 leading-tight">
                小鳥の一声が、<br />
                あなたの習慣を<br />
                運んでいく
              </h1>
              
              <p className="text-xl text-slate-700 leading-relaxed">
                感情を理解し、あなたのペースで習慣を育てる
              </p>
              
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Google Gemini AI搭載</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>感情分析機能</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>習慣継続サポート</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onRegister}
                disabled={isLoading}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
              >
                無料で始める
              </button>
              <button
                onClick={onGuest}
                disabled={isLoading}
                className="px-8 py-4 border-2 border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
              >
                まずは体験
              </button>
            </div>
          </div>

          {/* 右側: キャラクター */}
          <div className="flex justify-center">
            <Image
              src="/TalkToTheBird.png"
              alt="StepEasy 小鳥キャラクター"
              width={400}
              height={400}
              className="drop-shadow-2xl"
            />
          </div>
        </div>

        {/* 特別体験セクション */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/70 backdrop-blur rounded-2xl p-8 shadow-xl border border-slate-200">
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

          <div className="bg-white/70 backdrop-blur rounded-2xl p-8 shadow-xl border border-slate-200">
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

          <div className="bg-white/70 backdrop-blur rounded-2xl p-8 shadow-xl border border-slate-200">
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
      </div>
    </div>
  );
}; 