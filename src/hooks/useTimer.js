// Create a new file: hooks/useTimer.js
import { useEffect, useRef } from 'react';

const useTimer = (callback, delay, dependencies = []) => {
  const savedCallback = useRef();
  const timerId = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timer
  useEffect(() => {
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    if (delay !== null) {
      timerId.current = setInterval(tick, delay);
      return () => {
        if (timerId.current) {
          clearInterval(timerId.current);
        }
      };
    }
  }, [delay, ...dependencies]);

  // Return cleanup function
  const clearTimer = () => {
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    }
  };

  return { clearTimer };
};

export default useTimer;