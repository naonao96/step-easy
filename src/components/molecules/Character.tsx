import React from 'react';
import Image from 'next/image';

interface CharacterProps {
  mood: 'happy' | 'normal' | 'sad';
  message?: string;
}

export const Character: React.FC<CharacterProps> = ({ mood, message }) => {
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <div className="relative w-32 h-32 mb-4">
        <Image
          src="/TalkToTheBird.png"
          alt="Character"
          fill
          sizes="(max-width: 768px) 100vw, 128px"
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
      {message && (
        <div className="text-center text-gray-700 bg-blue-50 p-3 rounded-lg">
          {message}
        </div>
      )}
    </div>
  );
}; 