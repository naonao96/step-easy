'use client';

import React, { useState } from 'react';
import { Character } from '@/components/molecules/Character';
import { useInteractiveMessage } from '@/hooks/useInteractiveMessage';
import { Button } from '@/components/atoms/Button';

export default function TestInteractivePage() {
  const [context, setContext] = useState('初回ログイン');
  const [userName, setUserName] = useState('テストユーザー');
  const [userType, setUserType] = useState<'free' | 'premium'>('free');
  
  const {
    message,
    isLoading,
    error,
    generateMessage,
    handleOptionSelect,
    clearMessage
  } = useInteractiveMessage();

  const handleGenerateMessage = async () => {
    await generateMessage(context, userType, userName);
  };

  const handleOptionClick = (option: any) => {
    console.log('Selected option:', option);
    handleOptionSelect(option);
    
    // オプションに応じた次のメッセージを生成
    let nextContext = '';
    switch (option.action) {
      case 'feeling_great':
        nextContext = 'ユーザーが調子が良いと回答';
        break;
      case 'feeling_normal':
        nextContext = 'ユーザーが普通と回答';
        break;
      case 'feeling_tired':
        nextContext = 'ユーザーが疲れていると回答';
        break;
      case 'add_task':
        nextContext = 'ユーザーが新しいタスクを追加したい';
        break;
      case 'view_stats':
        nextContext = 'ユーザーが統計を見たい';
        break;
      default:
        nextContext = 'ユーザーが選択肢を選んだ';
    }
    
    // 少し遅延してから次のメッセージを生成
    setTimeout(() => {
      generateMessage(nextContext, userType, userName);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#8b4513] mb-8 text-center">
          インタラクティブ機能テスト
        </h1>

        {/* コントロールパネル */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#8b4513]">テスト設定</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#7c5a2a] mb-2">
                コンテキスト
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="初回ログイン">初回ログイン</option>
                <option value="タスク完了">タスク完了</option>
                <option value="朝の挨拶">朝の挨拶</option>
                <option value="夜の振り返り">夜の振り返り</option>
                <option value="週末の振り返り">週末の振り返り</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#7c5a2a] mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザータイプ
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as 'free' | 'premium')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">無料版</option>
                <option value="premium">プレミアム版</option>
              </select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button
                onClick={handleGenerateMessage}
                disabled={isLoading}
                className="px-6 py-2"
              >
                {isLoading ? '生成中...' : 'メッセージ生成'}
              </Button>
              
              <Button
                onClick={clearMessage}
                variant="outline"
                className="px-6 py-2"
              >
                クリア
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* キャラクター表示エリア */}
        <div className="flex justify-center">
          {message ? (
            <Character
              mood="happy"
              message={message.text}
              layout="vertical"
              isInteractive={true}
              options={message.options}
              onOptionSelect={handleOptionClick}
            />
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>メッセージを生成してください</p>
            </div>
          )}
        </div>

        {/* デバッグ情報 */}
        {message && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">デバッグ情報</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(message, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 