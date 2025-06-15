import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../atoms/Button';
import { FaSignOutAlt } from 'react-icons/fa';

interface MenuLayoutProps {
  children: React.ReactNode;
}

export const MenuLayout: React.FC<MenuLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">StepEasy</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={signOut}
                leftIcon={() => <span>{FaSignOutAlt({})}</span>}
              >
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children}
        </div>
      </main>
    </div>
  );
}; 