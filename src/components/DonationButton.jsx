import React, { useState } from 'react';

const DonationButton = ({ amount, onDonate, disabled = false, isSelected = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled || isAnimating) return;
    
    setIsAnimating(true);
    // Trigger animation
    setTimeout(() => {
      setIsAnimating(false);
      if (onDonate) {
        onDonate(amount);
      }
    }, 200);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        backgroundColor: isSelected ? '#FFD700' : '#27ae60',
        color: isSelected ? '#2c3e50' : 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '25px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s ease',
        transform: isAnimating ? 'scale(0.95)' : isSelected ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isSelected 
          ? '0 0 20px rgba(255, 215, 0, 0.6), 0 4px 15px rgba(39, 174, 96, 0.3)' 
          : '0 4px 15px rgba(39, 174, 96, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: '100px'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isSelected) {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(39, 174, 96, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isSelected) {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(39, 174, 96, 0.3)';
        }
      }}
    >
      <span style={{ fontSize: '20px' }}>💰</span>
      ${amount}
    </button>
  );
};

export default DonationButton;