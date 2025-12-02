import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StarTile from './StarTile';
import SpotlightManager from './SpotlightManager';
import DebugTimer from '../DebugTimer';

const UserGrid = memo(({ onProfileClick }) => {
  const { profiles } = useAuth();
  const containerRef = useRef(null);
  const [spotlightIndex, setSpotlightIndex] = useState(-1);
  const [gridConfig, setGridConfig] = useState({
    tileSize: 60,
    cols: 1,
    rows: 1
  });

  // Calculate grid
  const calculateGrid = useCallback(() => {
    if (!containerRef.current || profiles.length === 0) {
      return { tileSize: 60, cols: 1, rows: 1 };
    }

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    if (width === 0 || height === 0) {
      return { tileSize: 60, cols: 1, rows: 1 };
    }

    const totalTiles = profiles.length;
    const spacing = 1;
    
    // Simplified calculation
    const aspectRatio = width / height;
    const estimatedCols = Math.ceil(Math.sqrt(totalTiles * aspectRatio));
    const estimatedRows = Math.ceil(totalTiles / estimatedCols);
    
    // Calculate tile size with spacing
    const tileWidth = (width - (estimatedCols - 1) * spacing) / estimatedCols;
    const tileHeight = (height - (estimatedRows - 1) * spacing) / estimatedRows;
    const tileSize = Math.min(tileWidth, tileHeight);

    const finalTileSize = Math.max(0.5, tileSize);

    return {
      tileSize: finalTileSize,
      cols: estimatedCols,
      rows: estimatedRows
    };
  }, [profiles.length]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setGridConfig(calculateGrid());
    };
    
    // Initial calculation
    const timer = setTimeout(handleResize, 100);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [calculateGrid]);

  // Recalculate when profiles change
  useEffect(() => {
    const timer = setTimeout(() => {
      setGridConfig(calculateGrid());
    }, 100);
    
    return () => clearTimeout(timer);
  }, [profiles.length, calculateGrid]);

  // Listen for profile modal events
  useEffect(() => {
    const handleOpenProfileModal = (event) => {
      if (onProfileClick) {
        onProfileClick(event.detail.profile);
      }
    };

    window.addEventListener('openProfileModal', handleOpenProfileModal);
    
    return () => {
      window.removeEventListener('openProfileModal', handleOpenProfileModal);
    };
  }, [onProfileClick]);

  // Handle spotlight change
  const handleSpotlightChange = useCallback((index) => {
    console.log(`Spotlight changed to index: ${index}`);
    setSpotlightIndex(index);
  }, []);

  if (profiles.length === 0) {
    return (
      <div style={emptyStateStyle}>
        <div style={emptyIconStyle}>⭐</div>
        <h3 style={emptyTitleStyle}>No Stars Yet</h3>
        <p style={emptyTextStyle}>Be the first to create a profile and shine in the galaxy!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={gridContainerStyle}
    >
       <DebugTimer />
      {/* Spotlight Manager */}
      {profiles.length > 0 && gridConfig.cols > 0 && (
        <SpotlightManager 
          profiles={profiles}
          containerRef={containerRef}
          gridConfig={gridConfig}
          onSpotlightChange={handleSpotlightChange}
        />
      )}

      <div style={gridStyle}>
        {profiles.map((profile, index) => {
          const row = Math.floor(index / gridConfig.cols);
          const col = index % gridConfig.cols;
          const spacing = 1;
          const top = row * (gridConfig.tileSize + spacing);
          const left = col * (gridConfig.tileSize + spacing);

          return (
            <div
              key={`${profile.id}-${index}`}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                width: `${gridConfig.tileSize}px`,
                height: `${gridConfig.tileSize}px`,
                padding: '0px',
              }}
              data-index={index}
            >
              <StarTile
                profile={profile}
                baseSize={gridConfig.tileSize}
                onProfileClick={onProfileClick}
                isSpotlight={index === spotlightIndex}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Styles
const gridContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 180px)',
  minHeight: '500px',
  backgroundColor: 'transparent',
  position: 'relative',
  overflow: 'hidden'
};

const gridStyle = {
  position: 'relative',
  width: '100%',
  height: '100%'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem 1rem',
  color: '#bdc3c7',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#1a1a1a'
};

const emptyIconStyle = {
  fontSize: '4rem',
  marginBottom: '1rem',
  opacity: 0.5,
  animation: 'twinkle 3s infinite alternate'
};

const emptyTitleStyle = {
  fontSize: '1.8rem',
  margin: '0 0 0.75rem 0',
  color: '#FFD700',
  fontWeight: '700'
};

const emptyTextStyle = {
  fontSize: '1.1rem',
  margin: 0,
  opacity: 0.7
};

// Add more animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes twinkle {
  0% { opacity: 0.3; transform: scale(0.95); }
  100% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(styleSheet);

UserGrid.displayName = 'UserGrid';

export default UserGrid;