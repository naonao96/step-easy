'use client';

import React from 'react';
import { Layout } from '@/components/templates/Layout';
import { LoginForm } from '@/components/organisms/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      console.error('Email login error:', error);
    }
  };

  return (
    <Layout>
      <LoginForm
        onGoogleLogin={handleGoogleLogin}
        onEmailLogin={handleEmailLogin}
      />
    </Layout>
  );
} 