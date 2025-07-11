import React from 'react';
import { TermsOfServiceContent } from '@/components/legal/TermsOfServiceContent';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
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
                href="/privacy" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                プライバシーポリシー
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
        <TermsOfServiceContent />
      </main>

      {/* シンプルなフッター */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-gray-600">© 2024 StepEasy by naonao96</span>
            </div>
            <div className="flex space-x-6">
              <Link 
                href="/privacy" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                プライバシーポリシー
              </Link>
              <Link 
                href="/terms" 
                className="text-blue-600 font-medium"
              >
                利用規約
              </Link>
              <a 
                href="mailto:stepeasytasks@gmail.com" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 