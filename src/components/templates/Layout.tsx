import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={twMerge(
      "relative z-10",
      className
    )}>
      <main className="container mx-auto px-4">
        {children}
      </main>
    </div>
  );
}; 