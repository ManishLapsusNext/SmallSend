import { useEffect } from 'react';

export function useKeyboardControls(onPrev, onNext) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        onPrev();
      }
      if (e.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [onPrev, onNext]); // Dependencies are stable thanks to useCallback
}