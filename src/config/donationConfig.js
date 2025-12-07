// Add to src/constants/index.js or create src/config/donationConfig.js
export const DONATION_CONFIG = {
  PRESET_AMOUNTS: [5, 10, 25, 50, 100],
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 10000,
  CURRENCY: 'USD',
  GOAL_AMOUNT: 1000000000 // 1 billion for space theme
};

export const ANIMATIONS = {
  DONATION_ANIMATIONS: {
    STAR_PULSE: 'starPulse 1s ease-in-out infinite',
    STAR_EXPLOSION: 'starExplosion 0.8s ease-out forwards',
    STAR_GLOW: 'starGlow 2s ease-in-out infinite',
    MONEY_RAIN: 'moneyRain 3s linear forwards'
  }
};