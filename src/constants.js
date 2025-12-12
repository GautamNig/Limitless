// constants.js
export const SPOTLIGHT_CONFIG = {
  DURATION_MS: 5000, // 10 seconds
  FADE_IN_MS: 500,    // 0.5 second fade in
  FADE_OUT_MS: 500,   // 0.5 second fade out
  MIN_STAR_SIZE_FOR_TOOLTIP: 3, // Minimum star size to show tooltip
  TOOLTIP_OFFSET: 50, // Offset from star in pixels
  MAX_TOOLTIP_WIDTH: 300,
  MIN_TOOLTIP_WIDTH: 200
};

export const FORM_CONFIG = {
  MAX_THOUGHT_LENGTH: 500,
  MAX_LIFE_EXPERIENCE_LENGTH: 1000,
  MAX_INTERESTS_LENGTH: 200,
  MAX_LOCATION_LENGTH: 100
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
  TOOLTIP_TEXT: 'rgba(240, 240, 255, 0.95)',
    EXPERIENCE_CARD_BG: 'rgba(44, 62, 80, 0.9)',
  EXPERIENCE_CARD_BORDER: '#34495e',
  COMMENT_BG: 'rgba(52, 73, 94, 0.6)',
  COMMENT_BORDER: '#2c3e50',
  REPLY_BG: 'rgba(26, 37, 47, 0.6)',
  REPLY_BORDER: '#1a252f'
};

export const EXPERIENCE_CONFIG = {
  INITIAL_LOAD_COUNT: 10,
  LOAD_MORE_COUNT: 10,
  COMMENT_DEPTH_LIMIT: 2,
  INITIAL_COMMENTS_TO_SHOW: 3,
  LOAD_MORE_COMMENTS_COUNT: 5
};

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  MOST_LIKED: 'mostLiked',
  MOST_COMMENTED: 'mostCommented',
  TRENDING: 'trending'
};
// Debug log
console.log('Spotlight duration configured:', SPOTLIGHT_CONFIG.DURATION_MS, 'ms');