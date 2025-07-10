import React from 'react';

export const CloudLayer: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
    {/* 奥の雲（ゆっくり・小さめ・淡い） */}
    <svg
      className="absolute top-10 left-[-15vw] w-[40vw] opacity-60 blur-sm animate-cloud-move-slow"
      viewBox="0 0 400 120"
      fill="none"
    >
      <ellipse cx="100" cy="60" rx="90" ry="40" fill="#f8fbfd" />
      <ellipse cx="220" cy="50" rx="70" ry="30" fill="#d6e2f0" />
      <ellipse cx="320" cy="70" rx="50" ry="22" fill="#c6d9ea" />
      <ellipse cx="200" cy="90" rx="120" ry="30" fill="#f8fbfd" fillOpacity="0.7" />
    </svg>
    {/* 中間の雲（中速・中サイズ） */}
    <svg
      className="absolute top-28 left-[-10vw] w-[55vw] opacity-80 blur-[2px] animate-cloud-move"
      viewBox="0 0 600 180"
      fill="none"
    >
      <ellipse cx="180" cy="90" rx="120" ry="50" fill="#f8fbfd" />
      <ellipse cx="350" cy="80" rx="100" ry="40" fill="#d6e2f0" />
      <ellipse cx="500" cy="110" rx="70" ry="30" fill="#c6d9ea" />
      <ellipse cx="300" cy="140" rx="180" ry="40" fill="#f8fbfd" fillOpacity="0.7" />
    </svg>
    {/* 手前の雲（速い・大きい・濃い） */}
    <svg
      className="absolute top-44 left-[-20vw] w-[70vw] opacity-95 blur-[1px] animate-cloud-move-fast"
      viewBox="0 0 800 220"
      fill="none"
    >
      <ellipse cx="250" cy="110" rx="170" ry="70" fill="#f8fbfd" />
      <ellipse cx="500" cy="100" rx="140" ry="60" fill="#d6e2f0" />
      <ellipse cx="700" cy="140" rx="100" ry="40" fill="#c6d9ea" />
      <ellipse cx="400" cy="180" rx="250" ry="50" fill="#f8fbfd" fillOpacity="0.7" />
    </svg>
  </div>
); 