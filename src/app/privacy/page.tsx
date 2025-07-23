import React from 'react';
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent';
import { CloudLayer } from '@/components/CloudLayer';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-50 relative overflow-hidden">
      {/* 青空と雲の背景 */}
      <CloudLayer />
      
      {/* シンプルなヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold text-[#8b4513]">StepEasy</span>
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/terms" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                利用規約
              </Link>
              <Link 
                href="/lp" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                ホーム
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        <PrivacyPolicyContent />
      </main>

      {/* シンプルなフッター */}
      <footer className="mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center">
            <span className="text-[#8b4513]">© 2024 StepEasy by naonao96</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 