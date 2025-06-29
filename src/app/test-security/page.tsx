'use client';

import React, { useState } from 'react';
import { Input } from '@/components/atoms/Input';
import { sanitizeInput, validateTaskInput } from '@/lib/security';

export default function SecurityTestPage() {
  const [testInput, setTestInput] = useState('');
  const [sanitizedResult, setSanitizedResult] = useState('');
  const [validationResult, setValidationResult] = useState('');

  const handleTestSanitize = () => {
    const result = sanitizeInput(testInput);
    setSanitizedResult(result);
  };

  const handleTestValidation = () => {
    const result = validateTaskInput(testInput);
    setValidationResult(JSON.stringify(result, null, 2));
  };

  const testCases = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="alert(\'XSS\')">',
    'data:text/html,<script>alert("XSS")</script>',
    'Normal text without any issues',
    'Text with <b>HTML</b> tags',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">セキュリティ機能テスト</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 入力テスト */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">入力値テスト</h2>
            <Input
              label="テスト入力"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="テスト用の文字列を入力してください"
              className="mb-4"
            />
            <div className="space-y-2">
              <button
                onClick={handleTestSanitize}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                サニタイズテスト
              </button>
              <button
                onClick={handleTestValidation}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
              >
                バリデーションテスト
              </button>
            </div>
          </div>

          {/* 結果表示 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">結果</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">サニタイズ結果:</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  {sanitizedResult || '結果がここに表示されます'}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">バリデーション結果:</h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  {validationResult || '結果がここに表示されます'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* テストケース */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">テストケース</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCases.map((testCase, index) => (
              <div key={index} className="border p-3 rounded">
                <h3 className="font-medium text-gray-700 mb-2">ケース {index + 1}:</h3>
                <div className="bg-gray-100 p-2 rounded text-sm mb-2">
                  {testCase}
                </div>
                <div className="text-xs text-gray-600">
                  サニタイズ後: {sanitizeInput(testCase)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 法的要件チェック */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">法的要件チェック</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span>特定商取引法対応: 運営者情報が明記済み</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span>未成年利用制限: 年齢制限が明記済み</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span>XSS対策: 基本的なサニタイズ機能実装済み</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
              <span>セキュリティヘッダー: 基本的なヘッダー設定済み</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 