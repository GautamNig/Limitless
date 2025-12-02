import { useState, useRef, useCallback, memo, useEffect } from 'react';

const UserTile = memo(({ profile, baseSize = 20, onProfileClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimer = useRef(null);

  // Only show hover effects for larger tiles
  const shouldShowEffects = baseSize > 2;

  const handleMouseEnter = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    
    if (shouldShowEffects) {
      hoverTimer.current = setTimeout(() => {
        setIsHovered(true);
      }, 50);
    }
  }, [shouldShowEffects]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setIsHovered(false);
    }, 30);
  }, []);

  const handleClick = useCallback(() => {
    if (onProfileClick) {
      onProfileClick(profile);
    }
  }, [profile, onProfileClick]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  // Generate a consistent color based on user ID
  const getColorFromId = (id) => {
    const colors = [
      '#3498db', '#2ecc71', '#9b59b6', '#1abc9c', '#34495e',
      '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
      '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Determine visual representation based on size - FOCUS ON VISIBILITY
  const getTileContent = () => {
    const userColor = getColorFromId(profile.id);
    
    if (baseSize <= 1) {
      // Single pixel - make it brighter and more visible
      return (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: userColor,
          borderRadius: '50%',
          boxShadow: `0 0 1px ${userColor}`,
          opacity: 0.9
        }} />
      );
    } else if (baseSize <= 2) {
      // 2px tile - slightly larger bright dot
      return (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: userColor,
          borderRadius: '50%',
          boxShadow: `0 0 2px ${userColor}`,
          opacity: 0.9
        }} />
      );
    } else if (baseSize <= 3) {
      // 3px tile - small colored dot with glow
      return (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: userColor,
          borderRadius: '50%',
          boxShadow: `0 0 3px ${userColor}`,
          opacity: 0.9
        }} />
      );
    } else if (baseSize <= 5) {
      // 4-5px tile - colored square with initial
      const initial = profile.displayName?.[0]?.toUpperCase() || 'U';
      return (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: userColor,
          borderRadius: '15%',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${Math.max(6, baseSize * 0.8)}px`,
          fontWeight: 'bold',
          boxShadow: isHovered ? `0 0 6px ${userColor}` : 'none',
          transition: 'all 0.1s ease',
          border: '0.5px solid rgba(255,255,255,0.3)'
        }}>
          {initial}
        </div>
      );
    } else if (baseSize <= 8) {
      // 6-8px tile - tiny avatar with color overlay
      const initial = profile.displayName?.[0]?.toUpperCase() || 'U';
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${userColor}, ${adjustColor(userColor, -20)})`,
          borderRadius: '20%',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: isHovered ? `0 0 8px ${userColor}` : '0 0.5px 2px rgba(0,0,0,0.3)',
          transition: 'all 0.1s ease'
        }}>
          <img
            src={profile.photoURL}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.6,
              mixBlendMode: 'overlay'
            }}
            loading="lazy"
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: `${Math.max(8, baseSize * 0.6)}px`,
            fontWeight: 'bold',
            textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.5)'
          }}>
            {initial}
          </div>
        </div>
      );
    } else if (baseSize <= 15) {
      // 9-15px tile - circular avatar
      return (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: isHovered 
            ? `0 0 10px ${userColor}` 
            : '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'all 0.15s ease',
          border: `1px solid ${userColor}`
        }}>
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
              transition: 'filter 0.15s ease'
            }}
            loading="lazy"
          />
        </div>
      );
    } else {
      // >15px tile - detailed avatar
      return (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: isHovered 
            ? `0 0 15px ${userColor}, 0 2px 6px rgba(0,0,0,0.3)` 
            : '0 2px 6px rgba(0,0,0,0.2)',
          transition: 'all 0.15s ease',
          border: `2px solid ${userColor}`
        }}>
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isHovered ? 'brightness(1.1) saturate(1.2)' : 'brightness(1) saturate(1)',
              transition: 'filter 0.15s ease'
            }}
            loading="lazy"
          />
          {isHovered && baseSize > 20 && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              color: 'white',
              padding: '3px',
              fontSize: `${Math.max(10, baseSize * 0.07)}px`,
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {profile.displayName}
            </div>
          )}
        </div>
      );
    }
  };

  // Helper to adjust color brightness
  const adjustColor = (color, amount) => {
    let usePound = false;
    if (color[0] === "#") {
      color = color.slice(1);
      usePound = true;
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amount;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  };

  const tileStyle = {
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    position: 'relative',
    transition: shouldShowEffects ? 'transform 0.15s ease, box-shadow 0.15s ease' : 'none',
    transform: isHovered && shouldShowEffects ? 'scale(1.2)' : 'scale(1)',
    zIndex: isHovered ? 100 : 1
  };

  return (
    <div
      style={tileStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={shouldShowEffects && baseSize > 8 ? `${profile.displayName}${profile.location ? ` - ${profile.location}` : ''}` : ''}
    >
      {getTileContent()}
    </div>
  );
});

UserTile.displayName = 'UserTile';

export default UserTile;