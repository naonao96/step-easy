'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaHome, 
  FaTasks, 
  FaChartBar, 
  FaCog, 
  FaSignInAlt,
  FaSignOutAlt,
  FaPlus,
  FaTimes
} from 'react-icons/fa';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  // コンテキスト依存のアクション
  contextActions?: {
    label: string;
    action: () => void;
    icon?: any;
    variant?: 'default' | 'primary' | 'danger';
  }[];
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  contextActions = []
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navigationItems = [
    { 
      label: 'メニュー', 
      href: '/menu', 
      icon: FaHome,
      description: 'ホーム画面'
    },
    { 
      label: 'タスク', 
      href: '/tasks', 
      icon: FaTasks,
      description: 'タスク管理'
    },
    { 
      label: '進捗', 
      href: '/progress', 
      icon: FaChartBar,
      description: '統計とレポート'
    },
  ];

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/lp');
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* サイドメニュー */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <img src="/logo.png" alt="StepEasy" className="h-8" />
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-blue-100 rounded-lg"
              >
                {FaTimes({ className: "w-5 h-5" })}
              </button>
            </div>
          </div>

          {/* ユーザー情報 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-medium">
                  {user?.isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {user?.isGuest ? 'ゲストユーザー' : (user?.email?.split('@')[0] || 'ユーザー')}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {user?.isGuest ? '一時利用中' : user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* コンテキストアクション */}
          {contextActions.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-3">ページアクション</h4>
              <div className="space-y-2">
                {contextActions.map((action, index) => {
                  const Icon = action.icon;
                  const getButtonStyles = () => {
                    switch (action.variant) {
                      case 'primary':
                        return 'bg-blue-50 text-blue-700 hover:bg-blue-100';
                      case 'danger':
                        return 'bg-red-50 text-red-700 hover:bg-red-100';
                      default:
                        return 'bg-gray-50 text-gray-700 hover:bg-gray-100';
                    }
                  };

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        action.action();
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${getButtonStyles()}`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* クイックアクション */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-3">クイックアクション</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  router.push('/tasks');
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {FaPlus({ className: "w-4 h-4" })}
                <span>新しいタスクを作成</span>
              </button>
              <button
                onClick={() => {
                  router.push('/menu');
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {FaHome({ className: "w-4 h-4" })}
                <span>メニューに戻る</span>
              </button>
            </div>
          </div>

          {/* ナビゲーションアイテム */}
          <div className="flex-1 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className={`w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  {Icon({ className: `w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}` })}
                  <div>
                    <div className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                      {item.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* フッター */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button
              onClick={() => {
                router.push('/settings');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              {FaCog({ className: "w-5 h-5 text-gray-400" })}
              <span className="text-gray-700">設定</span>
            </button>
            
            {user?.isGuest ? (
              <button
                onClick={() => {
                  router.push('/login');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                {FaSignInAlt({ className: "w-5 h-5 text-green-500" })}
                <span className="text-green-600 font-medium">ログイン</span>
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                {FaSignOutAlt({ className: "w-5 h-5 text-red-500" })}
                <span className="text-red-600 font-medium">ログアウト</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}; 