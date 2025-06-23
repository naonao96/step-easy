'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ModernLPLayout, ContentSection } from '@/components/lp/ModernLPLayout';
import { MobileLPLayout } from '@/components/lp/MobileLPLayout';
import { HomeContent } from '@/components/lp/HomeContent';
import { MobileHomeContent } from '@/components/lp/MobileHomeContent';
import { FeaturesContent } from '@/components/lp/FeaturesContent';
import { MobileFeaturesContent } from '@/components/lp/MobileFeaturesContent';
import { PlansContent } from '@/components/lp/PlansContent';
import { MobilePlansContent } from '@/components/lp/MobilePlansContent';
import { FeatureGuide } from '@/components/docs/FeatureGuide';
import { PrivacyPolicyContent, TermsOfServiceContent, FAQContent } from '@/components/lp/StaticContent';
import { MobileOthersContent } from '@/components/lp/MobileOthersContent';

export default function ModernLandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<ContentSection>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 認証済みユーザーはメニューページにリダイレクト
  useEffect(() => {
    if (user && !user.isGuest) {
      router.push('/menu');
    }
  }, [user, router]);

  // URLクエリパラメータを処理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    const tab = urlParams.get('tab');
    
    if (section === 'others') {
      setActiveSection('faq');
      // モバイル版の場合、特定のタブを開く処理は MobileOthersContent で処理
      if (tab && isMobile) {
        // タブ情報をlocalStorageに保存（MobileOthersContentで読み取り）
        localStorage.setItem('othersActiveTab', tab);
      }
    }
  }, [isMobile]);

  // モバイル検出
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    router.push('/login');
  };

  const handleRegister = async () => {
    setIsLoading(true);
    router.push('/register');
  };

  const handleGuest = async () => {
    setIsLoading(true);
    router.push('/guest');
  };

  const renderContent = () => {
    if (isMobile) {
      switch (activeSection) {
        case 'home':
          return <MobileHomeContent onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} />;
        case 'features':
          return <MobileFeaturesContent onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} />;
        case 'plans':
          return <MobilePlansContent onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} />;
        case 'guide':
          return <FeatureGuide />;
        case 'privacy':
          // 専用ページにリダイレクト
          window.open('/privacy', '_blank');
          return null;
        case 'terms':
          // 専用ページにリダイレクト
          window.open('/terms', '_blank');
          return null;
        case 'faq':
          return <MobileOthersContent />;
        default:
          return <MobileHomeContent onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} />;
      }
    } else {
      switch (activeSection) {
        case 'home':
          return <HomeContent onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} />;
        case 'features':
          return <FeaturesContent />;
        case 'plans':
          return <PlansContent onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} />;
        case 'guide':
          return <FeatureGuide />;
        case 'privacy':
          // 専用ページにリダイレクト
          window.open('/privacy', '_blank');
          return null;
        case 'terms':
          // 専用ページにリダイレクト
          window.open('/terms', '_blank');
          return null;
        case 'faq':
          return <FAQContent />;
        default:
          return <HomeContent onLogin={handleLogin} onRegister={handleRegister} onGuest={handleGuest} isLoading={isLoading} />;
      }
    }
  };

  if (isMobile) {
    return (
      <MobileLPLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGuest={handleGuest}
        isLoading={isLoading}
      >
        {renderContent()}
      </MobileLPLayout>
    );
  }

  return (
    <ModernLPLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onGuest={handleGuest}
      isLoading={isLoading}
    >
      {renderContent()}
    </ModernLPLayout>
  );
} 