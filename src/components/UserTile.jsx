import { useState, useRef, useCallback, memo, useEffect } from 'react';

const UserTile = memo(({ profile, baseSize = 20, onProfileClick }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const tileRef = useRef(null);
  const popupRef = useRef(null);
  const hoverTimer = useRef(null);

  // Calculate perfect popup position
  const calculatePopupPosition = useCallback(() => {
    if (!tileRef.current) return;

    const tileRect = tileRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Popup dimensions
    const popupWidth = 260;
    const popupHeight = 180;
    const margin = 10;
    const arrowSize = 8;
    
    // Calculate available space on all sides
    const space = {
      top: tileRect.top - popupHeight - margin - arrowSize,
      bottom: viewportHeight - tileRect.bottom - popupHeight - margin - arrowSize,
      left: tileRect.left - popupWidth - margin - arrowSize,
      right: viewportWidth - tileRect.right - popupWidth - margin - arrowSize
    };
    
    // Determine best position
    let position = 'top';
    let arrowStyle = {};
    let popupPosition = {};
    
    // Check each position with priority
    const checkPosition = (pos, condition, styles) => {
      if (condition && space[pos] > 0) {
        position = pos;
        popupPosition = styles.popup;
        arrowStyle = styles.arrow;
        return true;
      }
      return false;
    };
    
    // Priority: Check right for left-edge tiles, left for right-edge tiles
    const isNearLeftEdge = tileRect.left < popupWidth;
    const isNearRightEdge = viewportWidth - tileRect.right < popupWidth;
    const isNearTopEdge = tileRect.top < popupHeight;
    const isNearBottomEdge = viewportHeight - tileRect.bottom < popupHeight;
    
    // Try intelligently based on tile position
    if (isNearLeftEdge && checkPosition('right', true, {
      popup: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: margin },
      arrow: { left: -arrowSize, top: '50%', transform: 'translateY(-50%)', borderRightColor: '#34495e' }
    })) {
      // Positioned to the right
    } else if (isNearRightEdge && checkPosition('left', true, {
      popup: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: margin },
      arrow: { right: -arrowSize, top: '50%', transform: 'translateY(-50%)', borderLeftColor: '#34495e' }
    })) {
      // Positioned to the left
    } else if (isNearTopEdge && checkPosition('bottom', true, {
      popup: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: margin },
      arrow: { top: -arrowSize, left: '50%', transform: 'translateX(-50%)', borderBottomColor: '#34495e' }
    })) {
      // Positioned below
    } else if (isNearBottomEdge && checkPosition('top', true, {
      popup: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: margin },
      arrow: { bottom: -arrowSize, left: '50%', transform: 'translateX(-50%)', borderTopColor: '#34495e' }
    })) {
      // Positioned above
    } else {
      // Default to position with most space
      const bestSpace = Math.max(space.top, space.bottom, space.left, space.right);
      
      if (bestSpace === space.top) {
        position = 'top';
        popupPosition = { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: margin };
        arrowStyle = { bottom: -arrowSize, left: '50%', transform: 'translateX(-50%)', borderTopColor: '#34495e' };
      } else if (bestSpace === space.bottom) {
        position = 'bottom';
        popupPosition = { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: margin };
        arrowStyle = { top: -arrowSize, left: '50%', transform: 'translateX(-50%)', borderBottomColor: '#34495e' };
      } else if (bestSpace === space.left) {
        position = 'left';
        popupPosition = { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: margin };
        arrowStyle = { right: -arrowSize, top: '50%', transform: 'translateY(-50%)', borderLeftColor: '#34495e' };
      } else {
        position = 'right';
        popupPosition = { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: margin };
        arrowStyle = { left: -arrowSize, top: '50%', transform: 'translateY(-50%)', borderRightColor: '#34495e' };
      }
    }
    
    // Set the final popup style
    setPopupStyle({
      popup: popupPosition,
      arrow: arrowStyle,
      position: position
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    
    if (baseSize > 3) {
      hoverTimer.current = setTimeout(() => {
        setShowPopup(true);
        calculatePopupPosition();
      }, 100);
    }
  }, [baseSize, calculatePopupPosition]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setShowPopup(false);
    }, 150);
  }, []);

  const handleClick = useCallback(() => {
    if (onProfileClick) {
      onProfileClick(profile);
    }
  }, [profile, onProfileClick]);

  // Update popup position on resize
  useEffect(() => {
    const handleResize = () => {
      if (showPopup) {
        calculatePopupPosition();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showPopup, calculatePopupPosition]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const tileStyle = {
    width: `${baseSize}px`,
    height: `${baseSize}px`,
    borderRadius: baseSize > 10 ? '4px' : baseSize > 5 ? '3px' : '2px',
    backgroundColor: baseSize <= 3 ? '#3498db' : 'transparent',
    border: baseSize > 3 ? '1px solid rgba(52, 73, 94, 0.6)' : 'none',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease',
    transform: showPopup ? 'scale(1.1)' : 'scale(1)',
    boxShadow: showPopup ? '0 0 10px rgba(52, 152, 219, 0.7)' : 'none',
    zIndex: showPopup ? 100 : 1
  };

  return (
    <div
      ref={tileRef}
      style={{ position: 'relative', display: 'block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div style={tileStyle}>
        {baseSize > 4 ? (
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#3498db',
            borderRadius: baseSize > 2 ? '50%' : '0'
          }} />
        )}
      </div>

      {/* Hover Popup */}
      {showPopup && baseSize > 2 && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            backgroundColor: '#2c3e50',
            border: '1px solid #34495e',
            borderRadius: '8px',
            padding: '0.75rem',
            width: '260px',
            maxHeight: '180px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            color: '#ecf0f1',
            zIndex: 1000,
            pointerEvents: 'none',
            ...popupStyle.popup
          }}
        >
          {/* Arrow */}
          {popupStyle.arrow && (
            <div style={{
              position: 'absolute',
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: '8px',
              ...popupStyle.arrow
            }} />
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #3498db'
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                margin: '0 0 0.2rem 0',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#ecf0f1',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {profile.displayName}
              </h4>
              {profile.location && (
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: '#bdc3c7',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  📍 {profile.location}
                </p>
              )}
            </div>
          </div>
          
          {profile.bio && (
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              lineHeight: '1.3',
              color: '#bdc3c7',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {profile.bio}
            </p>
          )}
          
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(52, 73, 94, 0.5)',
            textAlign: 'center'
          }}>
            <span style={{
              fontSize: '0.7rem',
              color: '#3498db',
              fontStyle: 'italic'
            }}>
              Click for full profile
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

UserTile.displayName = 'UserTile';

export default UserTile;