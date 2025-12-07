// src/config/paypalConfig.js
export const PAYPAL_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX || 
             'test', // For testing, replace with your PayPal Client ID
  CURRENCY: 'USD',
  INTENT: 'capture',
  COMMIT: true,
  VAULT: false
};

export const DONATION_AMOUNTS = [5, 10, 25, 50, 100];

export const DONATION_GOAL = 1000000000; // 1 billion for space theme

export const DONATION_MESSAGES = {
  SUCCESS: 'Thank you for your donation! Your star will now glow in the galaxy! ✨',
  ERROR: 'There was an issue processing your donation. Please try again.',
  PROCESSING: 'Processing your donation...'
};