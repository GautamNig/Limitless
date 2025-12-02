// DebugTimer.jsx - Add this to help debug
import { useEffect, useRef } from 'react';

const DebugTimer = () => {
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    console.log('DEBUG: Timer component mounted at', new Date().toLocaleTimeString());
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      console.log(`DEBUG: ${elapsed}ms elapsed since mount (${Math.floor(elapsed/1000)}s)`);
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default DebugTimer;