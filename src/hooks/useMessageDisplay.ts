import { useState, useRef, useEffect, useCallback } from 'react';

interface UseMessageDisplayProps {
  characterMessage: string;
  messageParts: string[];
  isGuest: boolean;
  user?: any;
  mounted?: boolean;
}

interface UseMessageDisplayReturn {
  showMessage: boolean;
  isTyping: boolean;
  displayedMessage: string;
  isShowingParts: boolean;
  currentPartIndex: number;
  handleAutoDisplay: () => void;
  handleManualDisplay: () => void;
  handleMessageClick: () => void;
  handleCharacterClick: () => void;
  clearMessage: () => void;
}

export const useMessageDisplay = ({
  characterMessage,
  messageParts,
  isGuest,
  user,
  mounted = true
}: UseMessageDisplayProps): UseMessageDisplayReturn => {
  const [showMessage, setShowMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isShowingParts, setIsShowingParts] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownInitialMessage = useRef(false);

  // タイプライター効果の共通関数
  const startTypewriter = useCallback((text: string, onComplete?: () => void) => {
    setIsTyping(true);
    let i = 0;
    
    const type = () => {
      const currentText = text.slice(0, i);
      setDisplayedMessage(currentText);
      if (i < text.length) {
        i++;
        typewriterTimeoutRef.current = setTimeout(type, 30);
      } else {
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    };
    
    type();
  }, []);

  // メッセージをクリアする関数
  const clearMessage = useCallback(() => {
    setShowMessage(false);
    setDisplayedMessage('');
    setIsTyping(false);
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
  }, []);

  // 自動表示の共通関数
  const handleAutoDisplay = useCallback(() => {
    if (characterMessage && !showMessage && (isGuest || user?.displayName || user?.email)) {
      // 初期表示制限を統一（一度表示したら再表示しない）
      if (!mounted || hasShownInitialMessage.current) {
        return;
      }
      
      hasShownInitialMessage.current = true;
      
      setShowMessage(true);
      startTypewriter(characterMessage, () => {
        // 5秒後に自動非表示
        typewriterTimeoutRef.current = setTimeout(() => {
          clearMessage();
        }, 5000);
      });
    }
  }, [characterMessage, showMessage, isGuest, user, mounted, startTypewriter, clearMessage]);

  // 手動表示の共通関数（キャラクタークリック時）
  const handleManualDisplay = useCallback(() => {
    if (characterMessage && !isTyping) {
      // 既存のタイマーをクリア
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
        typewriterTimeoutRef.current = null;
      }
      
      setShowMessage(true);
      startTypewriter(characterMessage, () => {
        // 5秒後に自動非表示
        typewriterTimeoutRef.current = setTimeout(() => {
          clearMessage();
        }, 5000);
      });
    }
  }, [characterMessage, isTyping, startTypewriter, clearMessage]);

  // メッセージクリック時の共通関数（分割表示対応）
  const handleMessageClick = useCallback(() => {
    if (isTyping) {
      return;
    }
    
    // 既存のタイマーをクリア
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    
    if (!isShowingParts) {
      // 初回クリックまたは全文表示からのクリック：分割メッセージを開始
      if (messageParts && messageParts.length > 1) {
        setCurrentPartIndex(0);
        setIsShowingParts(true);
        setShowMessage(true);
        
        const currentPart = messageParts[0];
        startTypewriter(currentPart, () => {
          // 分割メッセージ表示中は自動非表示タイマーを無効にする
          // ユーザーのクリックで次の分割メッセージに進む
        });
      }
    } else {
      // 分割表示中
      if (currentPartIndex < messageParts.length - 1) {
        // 次の分割メッセージを表示
        const nextIndex = currentPartIndex + 1;
        setCurrentPartIndex(nextIndex);
        setShowMessage(true);
        
        const currentPart = messageParts[nextIndex];
        startTypewriter(currentPart, () => {
          // 分割メッセージ表示中は自動非表示タイマーを無効にする
          // ユーザーのクリックで次の分割メッセージに進む
        });
      } else {
        // 最後の分割メッセージまで表示済み：全文表示に戻す
        setIsShowingParts(false);
        setCurrentPartIndex(0);
        setShowMessage(true);
        
        startTypewriter(characterMessage, () => {
          // 全文表示時は5秒後に自動非表示
          typewriterTimeoutRef.current = setTimeout(() => {
            clearMessage();
          }, 5000);
        });
      }
    }
  }, [
    isTyping,
    isShowingParts,
    currentPartIndex,
    messageParts,
    characterMessage,
    startTypewriter,
    clearMessage
  ]);

  // キャラクタークリック時の共通関数（デスクトップ版用）
  const handleCharacterClick = useCallback(() => {
    handleManualDisplay();
  }, [handleManualDisplay]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
        typewriterTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    showMessage,
    isTyping,
    displayedMessage,
    isShowingParts,
    currentPartIndex,
    handleAutoDisplay,
    handleManualDisplay,
    handleMessageClick,
    handleCharacterClick,
    clearMessage
  };
}; 