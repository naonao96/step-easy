import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={twMerge(
      "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100",
      className
    )}>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}; 