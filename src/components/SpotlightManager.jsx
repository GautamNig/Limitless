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
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  // Calculate star position on screen
  const calculateStarPosition = useCallback((index) => {
    if (!containerRef.current || !gridConfig || !gridConfig.cols) {
      return { x: 0, y: 0, row: 0, col: 0 };
    }
    
    try {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const row = Math.floor(index / gridConfig.cols);
      const col = index % gridConfig.cols;
      const spacing = 1;
      
      // Calculate star center position
      const starX = col * (gridConfig.tileSize + spacing) + gridConfig.tileSize / 2;
      const starY = row * (gridConfig.tileSize + spacing) + gridConfig.tileSize / 2;
      
      // Add container offset
      const absoluteX = containerRect.left + starX;
      const absoluteY = containerRect.top + starY;
      
      return { 
        x: absoluteX, 
        y: absoluteY,
        row,
        col,
        starCenterX: starX,
        starCenterY: starY
      };
    } catch (error) {
      console.error('Error calculating star position:', error);
      return { x: 0, y: 0, row: 0, col: 0 };
    }
  }, [gridConfig]);

  // Choose random star
  const chooseRandomStar = useCallback(() => {
    if (!profiles || profiles.length === 0) {
      console.log('No profiles available for spotlight');
      return null;
    }
    
    console.log(`Choosing random star from ${profiles.length} profiles`);
    
    let randomIndex;
    const maxAttempts = 10;
    let attempts = 0;
    
    // Try to find a star that's not too small (for better visibility)
    do {
      randomIndex = Math.floor(Math.random() * profiles.length);
      attempts++;
      
      // Check if star is big enough to show tooltip
      if (gridConfig && gridConfig.tileSize >= SPOTLIGHT_CONFIG.MIN_STAR_SIZE_FOR_TOOLTIP) {
        break;
      }
      
      // If all stars are too small, just pick any
      if (attempts >= maxAttempts) break;
      
    } while (randomIndex === spotlightIndex && profiles.length > 1);
    
    const profile = profiles[randomIndex];
    console.log(`Selected profile ${randomIndex}: ${profile.displayName}`);
    
    return { profile, index: randomIndex };
  }, [profiles, spotlightIndex, gridConfig]);

  // Load full profile data for spotlight
  const loadSpotlightProfile = useCallback(async (profile, index) => {
    if (!profile) return;
    
    console.log(`Loading spotlight profile: ${profile.displayName} (index: ${index})`);
    
    setIsLoading(true);
    try {
      const fullProfile = await fetchFullProfile(profile.id);
      if (fullProfile) {
        setFullProfileData(fullProfile);
        setSpotlightProfile(profile);
        setSpotlightIndex(index);
        
        // Calculate and set position
        const position = calculateStarPosition(index);
        setSpotlightPosition(position);
        
        // Notify parent component about spotlight change
        if (onSpotlightChange) {
          onSpotlightChange(index);
        }
        
        console.log(`Spotlight set on: ${profile.displayName} for ${SPOTLIGHT_CONFIG.DURATION_MS/1000} seconds`);
      }
    } catch (error) {
      console.error('Error loading spotlight profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFullProfile, calculateStarPosition, onSpotlightChange]);

  // Start the spotlight cycle
  const startSpotlightCycle = useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    const selection = chooseRandomStar();
    if (!selection) return;
    
    // Load the spotlight profile
    loadSpotlightProfile(selection.profile, selection.index);
    
    // Set timer for next spotlight
    timerRef.current = setTimeout(() => {
      console.log(`${SPOTLIGHT_CONFIG.DURATION_MS/1000} seconds passed, moving to next star...`);
      startSpotlightCycle();
    }, SPOTLIGHT_CONFIG.DURATION_MS);
  }, [chooseRandomStar, loadSpotlightProfile]);

  // Start spotlight timer on mount
  useEffect(() => {
    if (!profiles || profiles.length === 0) {
      console.log('No profiles, skipping spotlight');
      return;
    }
    
    console.log('Setting up spotlight timer...');
    
    // Initial delay to let grid render
    const initialDelay = setTimeout(() => {
      console.log('Starting spotlight cycle...');
      startSpotlightCycle();
    }, 2000);
    
    return () => {
      clearTimeout(initialDelay);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [profiles, startSpotlightCycle]);

  // Clear spotlight when profiles change significantly
  useEffect(() => {
    if (profiles.length === 0) {
      setSpotlightProfile(null);
      setFullProfileData(null);
      setSpotlightIndex(-1);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [profiles.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Handle window resize - recalculate position
  useEffect(() => {
    const handleResize = () => {
      if (spotlightIndex >= 0) {
        const position = calculateStarPosition(spotlightIndex);
        setSpotlightPosition(position);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [spotlightIndex, calculateStarPosition]);

  const handleTooltipClick = () => {
    if (spotlightProfile && fullProfileData) {
      // Dispatch event to open profile modal
      window.dispatchEvent(new CustomEvent('openProfileModal', {
        detail: { profile: fullProfileData }
      }));
      
      // Restart spotlight cycle after click
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      startSpotlightCycle();
    }
  };

  // If star is too small, don't show tooltip
  const shouldShowTooltip = gridConfig && 
    gridConfig.tileSize >= SPOTLIGHT_CONFIG.MIN_STAR_SIZE_FOR_TOOLTIP;

  if (!spotlightProfile || !fullProfileData || !shouldShowTooltip) {
    return null;
  }

  console.log(`Rendering spotlight for: ${spotlightProfile.displayName}`);

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