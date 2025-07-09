import { useState, useCallback } from 'react';

export const useMessageDisplay = () => {
  const [state, setState] = useState({
    showMessage: false,
    isTyping: false,
    displayedMessage: '',
    currentMessage: ''
  });

  const startMessage = useCallback((message: string) => {
    if (!message) return;
    
    setState(prev => ({ 
      ...prev, 
      showMessage: true, 
      isTyping: true, 
      currentMessage: message 
    }));
    
    let i = 0;
    const startTime = Date.now();
    const typeSpeed = 50; // 1文字あたり50ms
    
    const type = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const targetLength = Math.floor(elapsed / typeSpeed);
      
      if (targetLength < message.length) {
        setState(prev => ({ ...prev, displayedMessage: message.slice(0, targetLength) }));
        requestAnimationFrame(type);
      } else {
        setState(prev => ({ ...prev, displayedMessage: message, isTyping: false }));
        setTimeout(() => {
          setState(prev => ({ 
            ...prev, 
            showMessage: false, 
            displayedMessage: '' 
          }));
        }, 5000);
      }
    };
    
    requestAnimationFrame(type);
  }, []);

  const hideMessage = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showMessage: false, 
      displayedMessage: '' 
    }));
  }, []);

  return {
    showMessage: state.showMessage,
    isTyping: state.isTyping,
    displayedMessage: state.displayedMessage,
    startMessage,
    hideMessage
  };
}; 