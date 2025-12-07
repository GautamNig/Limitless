import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SpotlightTooltip from './SpotlightTooltip';
import { SPOTLIGHT_CONFIG } from '../constants';

const SpotlightManager = ({ profiles, containerRef, gridConfig, onSpotlightChange }) => {
  const { fetchFullProfile } = useAuth();
  const [spotlightProfile, setSpotlightProfile] = useState(null);
  const [fullProfileData, setFullProfileData] = useState(null);
  const [spotlightIndex, setSpotlightIndex] = useState(-1);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0 });
  const [isPositionCalculated, setIsPositionCalculated] = useState(false);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const prevSpotlightIndexRef = useRef(-1);

  console.log('SpotlightManager: Profiles count:', profiles?.length);

  // FIXED: Calculate star position with DOM synchronization
  const calculateStarPosition = useCallback((index, forceRetry = false) => {
    if (!containerRef.current || !gridConfig || !gridConfig.cols || !profiles) {
      console.log('Cannot calculate position: missing container or grid config');
      return { x: 0, y: 0 };
    }
    
    try {
      const container = containerRef.current;
      
      // WAIT for DOM to update with new spotlight
      setTimeout(() => {
        // Find star by data-index - this is the most reliable
        const starElement = container.querySelector(`div[data-index="${index}"]`);
        
        if (!starElement) {
          console.log(`❌ Star element with data-index="${index}" not found. Retrying...`);
          
          // Try alternative selectors
          const allStars = container.querySelectorAll('div[style*="position: absolute"]');
          if (index < allStars.length) {
            const starElementAlt = allStars[index];
            if (starElementAlt) {
              const starRect = starElementAlt.getBoundingClientRect();
              const starCenterX = starRect.left + starRect.width / 2;
              const starCenterY = starRect.top + starRect.height / 2;
              
              console.log(`✅ Found star ${index} via array index: x=${starCenterX.toFixed(1)}, y=${starCenterY.toFixed(1)}`);
              setSpotlightPosition({ x: starCenterX, y: starCenterY });
              setIsPositionCalculated(true);
              return;
            }
          }
          
          // If still not found and we haven't retried too many times
          if (forceRetry && mountedRef.current) {
            setTimeout(() => calculateStarPosition(index, false), 100);
          }
          return;
        }
        
        const starRect = starElement.getBoundingClientRect();
        const starCenterX = starRect.left + starRect.width / 2;
        const starCenterY = starRect.top + starRect.height / 2;
        
        console.log(`✅ Star ${index} position calculated: x=${starCenterX.toFixed(1)}, y=${starCenterY.toFixed(1)}`);
        console.log(`   Element found: ${starElement ? 'YES' : 'NO'}, Rect:`, {
          left: starRect.left.toFixed(1),
          top: starRect.top.toFixed(1),
          width: starRect.width.toFixed(1),
          height: starRect.height.toFixed(1)
        });
        
        setSpotlightPosition({ x: starCenterX, y: starCenterY });
        setIsPositionCalculated(true);
      }, 50); // Small delay to ensure DOM is updated
      
    } catch (error) {
      console.error('Error calculating star position:', error);
    }
  }, [gridConfig, profiles]);

  // Choose a random star
  const chooseRandomStarIndex = useCallback(() => {
    if (!profiles || profiles.length === 0) {
      console.log('No profiles to choose from');
      return -1;
    }
    
    let randomIndex;
    const maxAttempts = 10;
    let attempts = 0;
    
    do {
      randomIndex = Math.floor(Math.random() * profiles.length);
      attempts++;
      
      if (attempts >= maxAttempts) break;
      
    } while (randomIndex === spotlightIndex && profiles.length > 1);
    
    console.log(`🎯 Chose random star index: ${randomIndex}`);
    return randomIndex;
  }, [profiles, spotlightIndex]);

  // Load spotlight profile - FIXED with synchronization
  const loadSpotlightProfile = useCallback(async (index) => {
    if (!profiles || index < 0 || index >= profiles.length) {
      console.log(`Invalid index for spotlight: ${index}`);
      return;
    }
    
    const profile = profiles[index];
    console.log(`🔦 Loading spotlight profile: ${profile.displayName} (index: ${index})`);
    
    // RESET position calculation flag
    setIsPositionCalculated(false);
    
    try {
      const fullProfile = await fetchFullProfile(profile.id);
      if (fullProfile && mountedRef.current) {
        console.log(`✅ Successfully loaded profile: ${profile.displayName}`);
        
        // Store previous index for comparison
        prevSpotlightIndexRef.current = spotlightIndex;
        
        // Update spotlight state
        setFullProfileData(fullProfile);
        setSpotlightProfile(profile);
        setSpotlightIndex(index);
        
        // Notify parent component IMMEDIATELY
        if (onSpotlightChange) {
          onSpotlightChange(index);
        }
        
        // Calculate position AFTER state update and DOM render
        setTimeout(() => {
          console.log(`📐 Calculating position for new spotlight index: ${index}`);
          calculateStarPosition(index, true);
        }, 100); // Give React time to update the DOM
        
        console.log(`✨ Spotlight ACTIVE for ${profile.displayName} at index ${index}`);
      }
    } catch (error) {
      console.error('Error loading spotlight profile:', error);
    }
  }, [profiles, fetchFullProfile, calculateStarPosition, onSpotlightChange, spotlightIndex]);

  // Start a new spotlight
  const startNewSpotlight = useCallback(() => {
    if (!mountedRef.current) {
      console.log('Component not mounted, skipping spotlight');
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No profiles available for spotlight');
      return;
    }
    
    console.log('🚀 Starting new spotlight...');
    const randomIndex = chooseRandomStarIndex();
    if (randomIndex >= 0) {
      loadSpotlightProfile(randomIndex);
    }
  }, [profiles, chooseRandomStarIndex, loadSpotlightProfile]);

  // Set up the spotlight interval
  useEffect(() => {
    mountedRef.current = true;
    
    if (!profiles || profiles.length === 0) {
      console.log('No profiles, skipping spotlight setup');
      return;
    }
    
    console.log(`🎬 Setting up spotlight interval for ${SPOTLIGHT_CONFIG.DURATION_MS}ms (${SPOTLIGHT_CONFIG.DURATION_MS/1000}s)`);
    
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Start first spotlight after delay
    timerRef.current = setTimeout(() => {
      console.log('⏰ Initial spotlight starting...');
      startNewSpotlight();
      
      // Set up repeating interval
      intervalRef.current = setInterval(() => {
        console.log('🔄 Spotlight interval triggered - switching stars');
        startNewSpotlight();
      }, SPOTLIGHT_CONFIG.DURATION_MS);
    }, 2000); // Initial 2 second delay
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up spotlight timers');
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [profiles]); // Only depend on profiles

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (spotlightIndex >= 0 && isPositionCalculated) {
        console.log('Window resized, updating spotlight position');
        calculateStarPosition(spotlightIndex);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [spotlightIndex, calculateStarPosition, isPositionCalculated]);

  // DEBUG: Log when spotlight changes
  useEffect(() => {
    if (spotlightIndex !== -1 && spotlightIndex !== prevSpotlightIndexRef.current) {
      console.log(`🔄 Spotlight index changed: ${prevSpotlightIndexRef.current} → ${spotlightIndex}`);
      console.log(`   Profile: ${spotlightProfile?.displayName}`);
      console.log(`   Position calculated: ${isPositionCalculated ? 'YES' : 'NO'}`);
      prevSpotlightIndexRef.current = spotlightIndex;
    }
  }, [spotlightIndex, spotlightProfile, isPositionCalculated]);

  const handleTooltipClick = () => {
    if (spotlightProfile && fullProfileData) {
      console.log('Tooltip clicked, opening profile modal');
      window.dispatchEvent(new CustomEvent('openProfileModal', {
        detail: { profile: fullProfileData }
      }));
    }
  };

  // Don't show tooltip for very small stars
  const shouldShowTooltip = gridConfig && 
    gridConfig.tileSize >= SPOTLIGHT_CONFIG.MIN_STAR_SIZE_FOR_TOOLTIP;

  // Only show tooltip when position is calculated
  const canShowTooltip = shouldShowTooltip && spotlightProfile && fullProfileData && isPositionCalculated;

  console.log('SpotlightManager render:', {
    spotlightIndex,
    prevIndex: prevSpotlightIndexRef.current,
    profileName: spotlightProfile?.displayName,
    positionCalculated: isPositionCalculated,
    canShowTooltip,
    tileSize: gridConfig?.tileSize
  });

  if (!canShowTooltip) {
    console.log('❌ Not rendering spotlight tooltip:', {
      reason: !spotlightProfile ? 'No spotlight profile' : 
              !fullProfileData ? 'No full profile data' : 
              !shouldShowTooltip ? 'Star too small' : 
              !isPositionCalculated ? 'Position not calculated yet' : 'Unknown'
    });
    return null;
  }

  console.log(`✅ RENDERING tooltip for index ${spotlightIndex}:`, spotlightProfile.displayName);

  return (
    <SpotlightTooltip
      profile={fullProfileData}
      starPosition={spotlightPosition}
      starIndex={spotlightIndex}
      onClick={handleTooltipClick}
    />
  );
};

export default SpotlightManager;