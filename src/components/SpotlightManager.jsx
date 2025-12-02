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
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  console.log('SpotlightManager: Profiles count:', profiles?.length);

  // Calculate star position on screen
  const calculateStarPosition = useCallback((index) => {
    if (!containerRef.current || !gridConfig || !gridConfig.cols) {
      console.log('Cannot calculate position: missing container or grid config');
      return { x: 0, y: 0 };
    }
    
    try {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      console.log('Container rect:', containerRect);
      
      const row = Math.floor(index / gridConfig.cols);
      const col = index % gridConfig.cols;
      const spacing = 1;
      
      // Calculate star center position
      const starX = col * (gridConfig.tileSize + spacing) + gridConfig.tileSize / 2;
      const starY = row * (gridConfig.tileSize + spacing) + gridConfig.tileSize / 2;
      
      // Add container offset
      const absoluteX = containerRect.left + starX;
      const absoluteY = containerRect.top + starY;
      
      console.log(`Star position calculated: index=${index}, row=${row}, col=${col}, x=${absoluteX}, y=${absoluteY}`);
      
      return { x: absoluteX, y: absoluteY };
    } catch (error) {
      console.error('Error calculating star position:', error);
      return { x: 0, y: 0 };
    }
  }, [gridConfig]);

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
    
    console.log(`Chose random star index: ${randomIndex}`);
    return randomIndex;
  }, [profiles, spotlightIndex]);

  // Load spotlight profile
  const loadSpotlightProfile = useCallback(async (index) => {
    if (!profiles || index < 0 || index >= profiles.length) {
      console.log(`Invalid index for spotlight: ${index}`);
      return;
    }
    
    const profile = profiles[index];
    console.log(`Loading spotlight profile: ${profile.displayName} (index: ${index})`);
    
    try {
      const fullProfile = await fetchFullProfile(profile.id);
      if (fullProfile && mountedRef.current) {
        console.log(`Successfully loaded profile: ${profile.displayName}`);
        
        setFullProfileData(fullProfile);
        setSpotlightProfile(profile);
        setSpotlightIndex(index);
        
        // Calculate and set position
        const position = calculateStarPosition(index);
        setSpotlightPosition(position);
        
        // Notify parent component
        if (onSpotlightChange) {
          onSpotlightChange(index);
        }
        
        console.log(`✅ Spotlight ACTIVE for ${profile.displayName} - will switch in ${SPOTLIGHT_CONFIG.DURATION_MS/1000} seconds`);
      }
    } catch (error) {
      console.error('Error loading spotlight profile:', error);
    }
  }, [profiles, fetchFullProfile, calculateStarPosition, onSpotlightChange]);

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
    
    console.log('Starting new spotlight...');
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
      if (spotlightIndex >= 0) {
        console.log('Window resized, updating spotlight position');
        const position = calculateStarPosition(spotlightIndex);
        setSpotlightPosition(position);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [spotlightIndex, calculateStarPosition]);

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

  console.log('SpotlightManager render:', {
    hasProfile: !!spotlightProfile,
    shouldShowTooltip,
    tileSize: gridConfig?.tileSize,
    minSize: SPOTLIGHT_CONFIG.MIN_STAR_SIZE_FOR_TOOLTIP
  });

  if (!spotlightProfile || !fullProfileData || !shouldShowTooltip) {
    console.log('❌ Not rendering spotlight tooltip:', {
      reason: !spotlightProfile ? 'No spotlight profile' : 
              !fullProfileData ? 'No full profile data' : 
              !shouldShowTooltip ? 'Star too small for tooltip' : 'Unknown'
    });
    return null;
  }

  console.log('✅ Rendering spotlight tooltip for:', spotlightProfile.displayName);

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