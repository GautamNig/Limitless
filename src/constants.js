// constants.js
export const SPOTLIGHT_CONFIG = {
  DURATION_MS: 3000, // 10 seconds
  FADE_IN_MS: 500,    // 0.5 second fade in
  FADE_OUT_MS: 500,   // 0.5 second fade out
  MIN_STAR_SIZE_FOR_TOOLTIP: 3, // Minimum star size to show tooltip
  TOOLTIP_OFFSET: 50, // Offset from star in pixels
  MAX_TOOLTIP_WIDTH: 300,
  MIN_TOOLTIP_WIDTH: 200
};

export const ANIMATION_DURATIONS = {
  STAR_PULSE: 2000,
  TOOLTIP_FADE: 300,
  GLOW_TRANSITION: 500
};

export const COLORS = {
  STAR_GLOW: '#FFFF00', // Bright yellow instead of rgba
  STAR_NORMAL: 'rgba(255, 255, 255, 0.9)',
  TOOLTIP_BG: 'rgba(20, 25, 45, 0.95)',
  TOOLTIP_BORDER: '#FFFF00', // Bright yellow border
  TOOLTIP_TEXT: 'rgba(240, 240, 255, 0.95)'
};

// Debug log
console.log('Spotlight duration configured:', SPOTLIGHT_CONFIG.DURATION_MS, 'ms');