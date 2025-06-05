'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    // ローディングが完了したら、認証状態に応じてリダイレクト
    if (isLoading)　return;
    
    if (isLoggedIn){
      router.replace('/menu');
    }
    else{
      router.replace('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  // ローディング中は簡単なローディング表示
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>
  );
} 