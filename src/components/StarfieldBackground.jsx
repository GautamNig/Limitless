import { useEffect, useRef } from 'react';

const StarfieldBackground = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create background stars (far away, small)
    const stars = [];
    const numStars = Math.min(200, Math.floor((window.innerWidth * window.innerHeight) / 5000));
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.2 + 0.05,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }
    
    let time = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw gradient background (deep space)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#0a0a0a');
      gradient.addColorStop(1, '#000010');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw stars
      time += 0.016; // ~60fps
      
      stars.forEach(star => {
        // Twinkle effect
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();
        
        // Very slow movement
        star.x -= star.speed;
        if (star.x < -10) {
          star.x = canvas.width + 10;
          star.y = Math.random() * canvas.height;
        }
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    />
  );
};

export default StarfieldBackground;