import { useState, useEffect, useRef } from 'react';
import { SPOTLIGHT_CONFIG, COLORS } from '../constants';

const SpotlightTooltip = ({ profile, starPosition, starIndex, onClick }) => {
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  // Calculate optimal tooltip position
  const calculatePosition = () => {
    if (!starPosition || !starPosition.x || !starPosition.y) {
      return { 
        position: { top: 100, left: '50%', transform: 'translateX(-50%)' },
        arrow: { display: 'none' }
      };
    }

    const starX = starPosition.x;
    const starY = starPosition.y;
    const tooltipWidth = SPOTLIGHT_CONFIG.MAX_TOOLTIP_WIDTH;
    const tooltipHeight = 180;
    const offset = SPOTLIGHT_CONFIG.TOOLTIP_OFFSET;
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const safeMargin = 20;

    // Try different positions in order of preference
    const positions = [
      // Try above star first
      () => {
        const left = Math.max(safeMargin, Math.min(starX - tooltipWidth / 2, screenWidth - tooltipWidth - safeMargin));
        const top = starY - tooltipHeight - offset;
        const arrowLeft = Math.min(tooltipWidth - 20, Math.max(20, starX - left));
        return {
          position: { top, left },
          arrow: { bottom: '-10px', left: `${arrowLeft}px` }
        };
      },
      // Try below star
      () => {
        const left = Math.max(safeMargin, Math.min(starX - tooltipWidth / 2, screenWidth - tooltipWidth - safeMargin));
        const top = starY + offset;
        const arrowLeft = Math.min(tooltipWidth - 20, Math.max(20, starX - left));
        return {
          position: { top, left },
          arrow: { top: '-10px', left: `${arrowLeft}px` }
        };
      },
      // Try right of star
      () => {
        const left = starX + offset;
        const top = Math.max(safeMargin, Math.min(starY - tooltipHeight / 2, screenHeight - tooltipHeight - safeMargin));
        const arrowTop = Math.min(tooltipHeight - 20, Math.max(20, starY - top));
        return {
          position: { top, left },
          arrow: { left: '-10px', top: `${arrowTop}px` }
        };
      },
      // Try left of star
      () => {
        const left = starX - tooltipWidth - offset;
        const top = Math.max(safeMargin, Math.min(starY - tooltipHeight / 2, screenHeight - tooltipHeight - safeMargin));
        const arrowTop = Math.min(tooltipHeight - 20, Math.max(20, starY - top));
        return {
          position: { top, left },
          arrow: { right: '-10px', top: `${arrowTop}px` }
        };
      }
    ];

    // Find first position that fits on screen
    for (const positionFn of positions) {
      const result = positionFn();
      const { position } = result;
      
      if (
        position.top >= safeMargin &&
        position.top + tooltipHeight <= screenHeight - safeMargin &&
        position.left >= safeMargin &&
        position.left + tooltipWidth <= screenWidth - safeMargin
      ) {
        return result;
      }
    }

    // Fallback: center of screen
    return {
      position: {
        top: screenHeight / 2 - tooltipHeight / 2,
        left: screenWidth / 2 - tooltipWidth / 2
      },
      arrow: { display: 'none' }
    };
  };

  // Calculate arrow rotation based on position relative to star
  const calculateArrowRotation = (position) => {
    if (!starPosition) return '0deg';
    
    const tooltipCenterX = position.left + SPOTLIGHT_CONFIG.MAX_TOOLTIP_WIDTH / 2;
    const tooltipCenterY = position.top + 90; // Middle of tooltip height
    
    const dx = starPosition.x - tooltipCenterX;
    const dy = starPosition.y - tooltipCenterY;
    
    // Calculate angle in radians, then convert to degrees
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * (180 / Math.PI);
    
    // Adjust for arrow pointing (arrow points from tooltip to star)
    return `${angleDeg + 90}deg`;
  };

  useEffect(() => {
    const { position, arrow: baseArrow } = calculatePosition();
    const arrowRotation = calculateArrowRotation(position);
    
    setTooltipStyle({
      position: 'fixed',
      top: `${position.top}px`,
      left: `${position.left}px`,
      width: `${SPOTLIGHT_CONFIG.MAX_TOOLTIP_WIDTH}px`,
      zIndex: 9999
    });
    
    setArrowStyle({
      position: 'absolute',
      width: '20px',
      height: '20px',
      backgroundColor: COLORS.TOOLTIP_BG,
      borderRight: `2px solid ${COLORS.TOOLTIP_BORDER}`,
      borderBottom: `2px solid ${COLORS.TOOLTIP_BORDER}`,
      transform: `rotate(${arrowRotation})`,
      ...baseArrow
    });

    // Show with fade-in animation
    const timer = setTimeout(() => setIsVisible(true), SPOTLIGHT_CONFIG.FADE_IN_MS);
    return () => clearTimeout(timer);
  }, [starPosition]);

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

  if (!isVisible) return null;

  return (
    <div
      ref={tooltipRef}
      style={{
        ...tooltipStyle,
        backgroundColor: COLORS.TOOLTIP_BG,
        backdropFilter: 'blur(10px)',
        border: `2px solid ${COLORS.TOOLTIP_BORDER}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)',
        cursor: 'pointer',
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${SPOTLIGHT_CONFIG.FADE_IN_MS}ms ease-out, transform ${SPOTLIGHT_CONFIG.FADE_IN_MS}ms ease-out`,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)';
      }}
    >
      {/* Arrow pointing to star */}
      <div style={arrowStyle} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: `1px solid ${COLORS.TOOLTIP_BORDER}`
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          overflow: 'hidden',
          marginRight: '12px',
          border: `3px solid ${COLORS.TOOLTIP_BORDER}`,
          padding: '2px',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        </div>
        <div>
          <h4 style={{
            margin: 0,
            color: COLORS.STAR_GLOW,
            fontSize: '18px',
            fontWeight: '700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            ⭐ {profile.displayName}
          </h4>
          {profile.location && (
            <p style={{
              margin: '6px 0 0 0',
              color: 'rgba(200, 220, 255, 0.9)',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              📍 {profile.location}
            </p>
          )}
        </div>
      </div>
      
      {/* Thought Of the Day */}
      <div style={{
  marginBottom: '12px'
}}>
  <p style={{
    margin: 0,
    color: COLORS.TOOLTIP_TEXT,
    fontSize: '14px',
    lineHeight: '1.6',
    fontStyle: profile.thoughtOfTheDay ? 'normal' : 'italic'
  }}>
    {truncateText(profile.thoughtOfTheDay) || 'No thought shared today.'}
  </p>
</div>

{/* Life Experience - NEW */}
{profile.shareLifeExperience && (
  <div style={{
    marginBottom: '12px',
    padding: '10px',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '8px',
    borderLeft: '3px solid rgba(255, 215, 0, 0.3)'
  }}>
    <p style={{
      margin: 0,
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '13px',
      lineHeight: '1.5',
      fontStyle: 'italic'
    }}>
      💫 {truncateText(profile.shareLifeExperience, 120)}
    </p>
  </div>
)}
      
      {/* Footer with timer */}
      <div style={{
        paddingTop: '10px',
        borderTop: `1px solid ${COLORS.TOOLTIP_BORDER.replace('0.5', '0.2')}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'rgba(255, 215, 0, 0.8)',
        fontWeight: '600'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>✨</span> Spotlight #{starIndex + 1}
        </span>
        
        {/* Timer indicator */}
        <div style={{
          width: '60px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div 
            style={{
              height: '100%',
              width: '100%',
              backgroundColor: COLORS.STAR_GLOW.replace('0.9', '0.7'),
              animation: `timer ${SPOTLIGHT_CONFIG.DURATION_MS}ms linear forwards`
            }} 
          />
        </div>
      </div>
    </div>
  );
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes timer {
  from { width: 100%; }
  to { width: 0%; }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;
document.head.appendChild(styleSheet);

export default SpotlightTooltip;