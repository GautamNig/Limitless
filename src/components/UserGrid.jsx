import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StarTile from './StarTile';
import SpotlightManager from './SpotlightManager';

const UserGrid = memo(({ onProfileClick }) => {
  const { profiles } = useAuth();
  const containerRef = useRef(null);
  const [spotlightIndex, setSpotlightIndex] = useState(-1);
  const [gridConfig, setGridConfig] = useState({
    tileSize: 60,
    cols: 1,
    rows: 1,
    actualWidth: 0
  });

  const { profilesLoading } = useAuth();

  // FIXED: Calculate grid - Fill entire width exactly
  const calculateGrid = useCallback(() => {
    if (!containerRef.current || profiles.length === 0) {
      return { tileSize: 60, cols: 1, rows: 1, actualWidth: 0 };
    }

    const container = containerRef.current;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    if (containerWidth === 0 || containerHeight === 0) {
      return { tileSize: 60, cols: 1, rows: 1, actualWidth: 0 };
    }

    const totalTiles = profiles.length;
    
    // Calculate optimal columns to fill width exactly
    // Try different column counts to find the best fit
    let bestCols = 1;
    let bestTileSize = 0;
    let bestRows = 0;
    let bestError = Infinity;
    
    // Limit search to reasonable column counts
    const maxCols = Math.min(100, Math.ceil(containerWidth / 10)); // Minimum 10px per tile
    const minCols = Math.max(1, Math.floor(containerWidth / 200)); // Maximum 200px per tile
    
    for (let testCols = minCols; testCols <= maxCols; testCols++) {
      const testRows = Math.ceil(totalTiles / testCols);
      const tileWidth = containerWidth / testCols;
      const tileHeight = containerHeight / testRows;
      const testTileSize = Math.min(tileWidth, tileHeight);
      
      // Calculate how much width we actually use
      const usedWidth = testCols * testTileSize;
      const usedHeight = testRows * testTileSize;
      
      // Penalize unused space
      const widthError = containerWidth - usedWidth;
      const heightError = containerHeight - usedHeight;
      const error = Math.abs(widthError) + Math.abs(heightError);
      
      if (error < bestError) {
        bestError = error;
        bestCols = testCols;
        bestTileSize = testTileSize;
        bestRows = testRows;
      }
      
      // If we're within 1px of filling width, that's good enough
      if (Math.abs(widthError) < 1) break;
    }

    // Ensure integer rows and columns
    bestCols = Math.max(1, bestCols);
    bestRows = Math.max(1, Math.ceil(totalTiles / bestCols));
    
    // Recalculate tile size to fill width exactly
    const finalTileSize = containerWidth / bestCols;
    const actualWidth = bestCols * finalTileSize;

    console.log(`Grid calculation: cols=${bestCols}, rows=${bestRows}, tileSize=${finalTileSize.toFixed(1)}px, actualWidth=${actualWidth.toFixed(1)}px, containerWidth=${containerWidth.toFixed(1)}px`);

    return {
      tileSize: finalTileSize,
      cols: bestCols,
      rows: bestRows,
      actualWidth: actualWidth
    };
  }, [profiles.length]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setGridConfig(calculateGrid());
    };
    
    // Initial calculation with timeout to ensure DOM is ready
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

   if (profilesLoading) {
    return (
      <div style={loadingStateStyle}>
        <div style={loadingSpinnerStyle}></div>
        <div>Loading the galaxy...</div>
      </div>
    );
  }

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
      {/* Spotlight Manager */}
      {profiles.length > 0 && gridConfig.cols > 0 && (
        <SpotlightManager 
          profiles={profiles}
          containerRef={containerRef}
          gridConfig={gridConfig}
          onSpotlightChange={handleSpotlightChange}
        />
      )}

      <div style={{
        ...gridStyle,
        width: `${gridConfig.actualWidth}px` // Use exact calculated width
      }}>
        {profiles.map((profile, index) => {
          const row = Math.floor(index / gridConfig.cols);
          const col = index % gridConfig.cols;
          const top = row * gridConfig.tileSize;
          const left = col * gridConfig.tileSize;

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

// ============= STYLES =============

const gridContainerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: 'calc(100vh - 80px)',
  backgroundColor: 'transparent',
  overflow: 'hidden',
  margin: 0,
  padding: 0,
  display: 'flex',
  justifyContent: 'center' // Center the grid if needed
};

const gridStyle = {
  position: 'relative',
  height: '100%',
  margin: '0 auto', // Center the grid
  padding: 0
};


const loadingStateStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  padding: '3rem 1rem',
  color: '#bdc3c7',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  maxWidth: '500px'
};

const loadingSpinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid rgba(52, 152, 219, 0.3)',
  borderTop: '5px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '1rem'
};

const emptyStateStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  padding: '3rem 1rem',
  color: '#bdc3c7',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  maxWidth: '500px'
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

// Add animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes twinkle {
  0% { opacity: 0.3; transform: scale(0.95); }
  100% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes spin {  /* ADD THIS */
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

/* Ensure no horizontal scroll */
* {
  box-sizing: border-box;
}
`;
document.head.appendChild(styleSheet);

UserGrid.displayName = 'UserGrid';

export default UserGrid;