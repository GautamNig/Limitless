import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserTile from './UserTile';

const UserGrid = ({onProfileClick}) => {
  const { profiles } = useAuth();
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  
  // State for optimized rendering
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [tileSize, setTileSize] = useState(0);
  const [cols, setCols] = useState(1);

  // Debounced resize handler
  const resizeTimeout = useRef(null);
  
  // Calculate optimal grid to fill container completely
  const calculateGrid = useCallback(() => {
    if (!containerRef.current || profiles.length === 0) {
      setTileSize(60);
      setCols(1);
      return;
    }

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    if (width === 0 || height === 0) return;
    
    setContainerSize({ width, height });
    
    const totalTiles = profiles.length;
    const availableHeight = height - 60; // Subtract info bar height
    
    // Calculate maximum possible tile size to fill the container
    let bestCols = 1;
    let bestTileSize = 0;
    let bestError = Infinity;
    
    // Try different column counts to find best fit
    const maxCols = Math.min(totalTiles, Math.floor(width / 2)); // At least 2px per tile
    
    for (let testCols = 1; testCols <= maxCols; testCols++) {
      const testRows = Math.ceil(totalTiles / testCols);
      
      // Calculate tile size for this column count
      const tileWidth = (width - (testCols - 1)) / testCols; // 1px gap between tiles
      const tileHeight = (availableHeight - (testRows - 1)) / testRows; // 1px gap
      const testTileSize = Math.min(tileWidth, tileHeight);
      
      // Calculate how well this fills the container
      const usedWidth = testCols * testTileSize + (testCols - 1);
      const usedHeight = testRows * testTileSize + (testRows - 1);
      
      const widthError = Math.abs(width - usedWidth);
      const heightError = Math.abs(availableHeight - usedHeight);
      const totalError = widthError + heightError;
      
      if (totalError < bestError) {
        bestError = totalError;
        bestCols = testCols;
        bestTileSize = testTileSize;
      }
      
      // Early exit if we're filling well
      if (totalError < 10) break;
    }
    
    // Ensure minimum tile size of 1px
    const finalTileSize = Math.max(1, bestTileSize);
    
    setCols(bestCols);
    setTileSize(finalTileSize);
    
    console.log(`Grid: ${bestCols} cols, ${Math.ceil(totalTiles / bestCols)} rows, ${finalTileSize.toFixed(1)}px tiles`);
  }, [profiles.length]);

  // Handle scroll for virtualization
  const handleScroll = useCallback(() => {
    if (!gridRef.current) return;
    
    requestAnimationFrame(() => {
      setScrollTop(gridRef.current.scrollTop);
    });
  }, []);

  // Initialize and handle resize
  useEffect(() => {
    const updateSize = () => {
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
      
      resizeTimeout.current = setTimeout(() => {
        calculateGrid();
      }, 100);
    };

    // Initial calculation
    updateSize();
    
    // Add resize listener
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, [calculateGrid]);

  // Recalculate on profiles change
  useEffect(() => {
    calculateGrid();
  }, [profiles.length, calculateGrid]);

  // Calculate visible tiles for virtualization
  const { visibleTiles, totalHeight, startRow } = useMemo(() => {
    if (profiles.length === 0) {
      return { visibleTiles: [], totalHeight: 0, startRow: 0 };
    }
    
    const rows = Math.ceil(profiles.length / cols);
    const rowHeight = tileSize + 1; // tile + gap
    const totalHeight = rows * rowHeight;
    
    // For performance, only virtualize when we have many tiles
    if (profiles.length <= 2000 || tileSize > 5) {
      return { 
        visibleTiles: profiles, 
        totalHeight: 'auto',
        startRow: 0 
      };
    }
    
    // Calculate visible rows
    const visibleRows = Math.ceil(containerSize.height / rowHeight);
    const bufferRows = 3;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferRows);
    const endRow = Math.min(rows, startRow + visibleRows + bufferRows * 2);
    
    const startIndex = startRow * cols;
    const endIndex = Math.min(profiles.length, endRow * cols);
    
    return {
      visibleTiles: profiles.slice(startIndex, endIndex),
      totalHeight,
      startRow
    };
  }, [profiles, cols, tileSize, scrollTop, containerSize.height]);

  if (profiles.length === 0) {
    return (
      <div style={emptyStateStyle}>
        <div style={emptyIconStyle}>👥</div>
        <h3 style={emptyTitleStyle}>No Profiles Yet</h3>
        <p style={emptyTextStyle}>Be the first to create a profile and join the community!</p>
      </div>
    );
  }

  const rows = Math.ceil(profiles.length / cols);
  const rowHeight = tileSize + 1;

  return (
    <div 
      ref={containerRef}
      style={gridContainerStyle}
    >
      {/* <div style={gridInfoStyle}>
        <span style={gridCountStyle}>
          {profiles.length.toLocaleString()} members • 
          Tile: {Math.floor(tileSize)}px • 
          Grid: {cols}×{rows}
        </span>
      </div> */}
      
      <div 
        ref={gridRef}
        style={{
          ...gridStyle,
          overflowY: totalHeight === 'auto' ? 'hidden' : 'auto'
        }}
        onScroll={handleScroll}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: totalHeight === 'auto' ? '100%' : `${totalHeight}px`,
          minHeight: containerSize.height - 60
        }}>
          {visibleTiles.map((profile, index) => {
            const absoluteIndex = totalHeight === 'auto' ? index : (startRow * cols + index);
            const row = Math.floor(absoluteIndex / cols);
            const col = absoluteIndex % cols;
            
            return (
              <div
                key={`${profile.id}-${absoluteIndex}`}
                style={{
                  position: 'absolute',
                  top: `${row * rowHeight}px`,
                  left: `${col * (tileSize + 1)}px`,
                  width: `${tileSize}px`,
                  height: `${tileSize}px`
                }}
              >
                <UserTile 
                  profile={profile} 
                  baseSize={Math.floor(tileSize)}
                  onProfileClick={onProfileClick} // Add this line
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Styles
const gridContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 180px)',
  minHeight: '500px',
  backgroundColor: '#1a1a1a',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const gridInfoStyle = {
  textAlign: 'center',
  padding: '0.75rem',
  backgroundColor: '#2c3e50',
  borderBottom: '1px solid #34495e',
  flexShrink: 0
};

const gridCountStyle = {
  color: '#bdc3c7',
  fontSize: '0.9rem',
  backgroundColor: '#34495e',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  display: 'inline-block'
};

const gridStyle = {
  flex: 1,
  width: '100%',
  overflowX: 'hidden',
  position: 'relative',
  contain: 'strict'
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
  fontSize: '3rem',
  marginBottom: '1rem',
  opacity: 0.5
};

const emptyTitleStyle = {
  fontSize: '1.5rem',
  margin: '0 0 0.75rem 0',
  color: '#ecf0f1'
};

const emptyTextStyle = {
  fontSize: '1rem',
  margin: 0,
  opacity: 0.7
};

export default UserGrid;