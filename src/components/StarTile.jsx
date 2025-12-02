import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { SPOTLIGHT_CONFIG, COLORS, ANIMATION_DURATIONS } from '../constants';

const StarTile = memo(({ profile, baseSize, onProfileClick, isSpotlight = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const animationRef = useRef(null);
  
  // Spotlight pulsing animation
  useEffect(() => {
    if (isSpotlight) {
      let startTime = null;
      
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const phase = (elapsed % ANIMATION_DURATIONS.STAR_PULSE) / ANIMATION_DURATIONS.STAR_PULSE;
        setPulsePhase(phase);
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setPulsePhase(0);
      };
    }
  }, [isSpotlight]);
  
  const handleClick = useCallback(() => {
    if (onProfileClick) {
      onProfileClick(profile);
    }
  }, [profile, onProfileClick]);
  
  // Calculate spotlight intensity
  const getSpotlightIntensity = () => {
    if (!isSpotlight) return 0;
    // Sin wave for smooth pulsing
    return 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);
  };
  
  // Create a star shape
  const getStarContent = () => {
    const starSize = baseSize;
    const intensity = getSpotlightIntensity();
    const isGlowing = isSpotlight && intensity > 0.7;
    
    const starColor = isGlowing ? COLORS.STAR_GLOW : COLORS.STAR_NORMAL;
    
    if (starSize <= 2) {
      // Micro star
      return (
        <div style={{
          width: '70%',
          height: '70%',
          backgroundColor: starColor,
          borderRadius: '50%',
          margin: '15%',
          opacity: 0.8,
          animation: isSpotlight ? `pulseGlow ${ANIMATION_DURATIONS.STAR_PULSE}ms infinite alternate` : 'none',
          filter: isGlowing ? `brightness(${1 + intensity})` : 'none',
          transition: `filter ${ANIMATION_DURATIONS.GLOW_TRANSITION}ms ease`
        }} />
      );
    } else if (starSize <= 5) {
      // Small cross star
      return (
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          opacity: 0.7,
          animation: isSpotlight ? `pulseGlow ${ANIMATION_DURATIONS.STAR_PULSE}ms infinite alternate` : 'none',
          filter: isGlowing ? `brightness(${1 + intensity})` : 'none',
          transition: `filter ${ANIMATION_DURATIONS.GLOW_TRANSITION}ms ease`
        }}>
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '45%',
            width: '10%',
            height: '60%',
            backgroundColor: starColor,
            borderRadius: '1px'
          }} />
          <div style={{
            position: 'absolute',
            top: '45%',
            left: '20%',
            width: '60%',
            height: '10%',
            backgroundColor: starColor,
            borderRadius: '1px'
          }} />
        </div>
      );
    } else {
      // SVG star for larger sizes
      const adjustedGlowColor = isGlowing 
        ? COLORS.STAR_GLOW.replace('0.9', `${0.9 + intensity * 0.1}`)
        : COLORS.STAR_NORMAL;
      
      return (
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          opacity: 0.9,
          transform: isHovered ? 'scale(1.2)' : isSpotlight ? `scale(${1 + intensity * 0.2})` : 'scale(1)',
          transition: `transform ${ANIMATION_DURATIONS.GLOW_TRANSITION}ms ease, filter ${ANIMATION_DURATIONS.GLOW_TRANSITION}ms ease`,
          animation: isSpotlight ? `starPulse ${ANIMATION_DURATIONS.STAR_PULSE}ms infinite ease-in-out` : 'none',
          filter: isGlowing ? `brightness(${1 + intensity}) drop-shadow(0 0 ${5 + intensity * 10}px ${COLORS.STAR_GLOW.replace('0.9', `${0.3 + intensity * 0.5}`)})` : 'none'
        }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            <polygon
              points="50,10 61,35 88,35 66,52 72,78 50,63 28,78 34,52 12,35 39,35"
              fill={adjustedGlowColor}
              stroke={isGlowing ? COLORS.STAR_GLOW.replace('0.9', '0.8') : 'rgba(255, 255, 255, 0.5)'}
              strokeWidth={isGlowing ? '3' : '2'}
            />
          </svg>
        </div>
      );
    }
  };

  const tileStyle = {
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    position: 'relative',
    zIndex: isHovered || isSpotlight ? 1000 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div
      style={tileStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title={baseSize > 10 ? profile.displayName || 'User' : ''}
    >
      {getStarContent()}
    </div>
  );
});

// Add CSS animations
const starTileStyleSheet = document.createElement('style');
starTileStyleSheet.textContent = `
@keyframes pulseGlow {
  0% { filter: brightness(1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.3)); }
  50% { filter: brightness(1.8) drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)); }
  100% { filter: brightness(1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.3)); }
}

@keyframes starPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
`;
document.head.appendChild(starTileStyleSheet);

StarTile.displayName = 'StarTile';
export default StarTile;    