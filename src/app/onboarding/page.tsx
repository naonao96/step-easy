'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { FeaturesStep } from '@/components/onboarding/FeaturesStep';
import { PaceStep } from '@/components/onboarding/PaceStep';
import { SetupStep } from '@/components/onboarding/SetupStep';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useAuth } from '@/contexts/AuthContext';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

const supabase = createClientComponentClient();

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, refreshUser } = useAuth();

  // オンボーディング完了状況をチェック
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('onboarding_completed_at')
            .eq('id', user.id)
            .single();

          if (!error && userData && userData.onboarding_completed_at) {
            // オンボーディング完了済みの場合はメニュー画面にリダイレクト
            router.push('/menu');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (!userName.trim() || !characterName.trim() || !agreedToTerms) {
      return;
    }

    try {
      // ユーザー名を更新する処理
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({
            display_name: userName.trim(),
            character_name: characterName.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user name:', error);
          throw error;
        }
        // 保存直後にContextを最新化
        if (refreshUser) await refreshUser();
      }
      
      console.log('Onboarding completed:', { userName, characterName, agreedToTerms });
      
      // メニュー画面に遷移
      router.push('/menu');
    } catch (error) {
      console.error('Onboarding completion error:', error);
    }
  };

  const handleSkip = () => {
    router.push('/menu');
  };

  // オンボーディング状況チェック中はローディング表示
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep 
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case 2:
        return (
          <FeaturesStep 
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case 3:
        return (
          <PaceStep 
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case 4:
        return (
          <SetupStep 
            userName={userName}
            setUserName={setUserName}
            characterName={characterName}
            setCharacterName={setCharacterName}
            agreedToTerms={agreedToTerms}
            setAgreedToTerms={setAgreedToTerms}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout currentStep={currentStep}>
      {renderStep()}
    </OnboardingLayout>
  );
} 