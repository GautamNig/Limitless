import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useDonations from '../hooks/useDonations';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { DONATION_AMOUNTS, DONATION_MESSAGES, DONATION_GOAL } from '../config/paypalConfig';

const DonationPopup = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { totalAmount, recentDonations, addDonation, loading } = useDonations();
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const progressPercentage = Math.min((totalAmount / DONATION_GOAL) * 100, 100);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handlePresetClick = (amount) => {
    setSelectedAmount(amount);
    setShowCustomInput(false);
    setCustomAmount('');
  };

  const handleCustomClick = () => {
    setShowCustomInput(true);
    setSelectedAmount(null);
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
    }
  };

  const handlePayPalSuccess = async (amount, details) => {
    setIsProcessing(true);
    setStatus(DONATION_MESSAGES.PROCESSING);
    
    try {
      await addDonation(amount, details);
      setStatus(DONATION_MESSAGES.SUCCESS);
      
      if (user) {
        window.dispatchEvent(new CustomEvent('donationSuccess', {
          detail: { userId: user.uid, amount }
        }));
      }
      
      setTimeout(() => {
        setStatus('');
        setSelectedAmount(10);
        setCustomAmount('');
        setShowCustomInput(false);
        setIsProcessing(false);
        onClose();
      }, 3000);
    } catch (error) {
      setStatus(DONATION_MESSAGES.ERROR);
      setIsProcessing(false);
    }
  };

  const createOrder = (data, actions) => {
    const amount = showCustomInput && customAmount ? parseFloat(customAmount) : selectedAmount;
    const validAmount = Math.max(1, amount || 1);
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: validAmount.toFixed(2),
          currency_code: 'USD'
        },
        description: `Donation to Limitless Galaxy - $${validAmount}`
      }]
    });
  };

  const onApprove = async (data, actions) => {
    const amount = showCustomInput && customAmount ? parseFloat(customAmount) : selectedAmount;
    const validAmount = Math.max(1, amount || 1);
    
    try {
      const details = await actions.order.capture();
      await handlePayPalSuccess(validAmount, details);
      return details;
    } catch (error) {
      setStatus('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const onError = (error) => {
    setStatus('Payment error. Please try again.');
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  const currentAmount = showCustomInput && customAmount ? parseFloat(customAmount) : selectedAmount;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={popupStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>✨ Support the Galaxy ✨</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        {/* Progress Section */}
        <div style={progressSectionStyle}>
          <div style={totalRaisedStyle}>
            <div style={totalAmountStyle}>${totalAmount.toLocaleString()}</div>
            <div style={totalLabelStyle}>Total Raised</div>
          </div>
          
          <div style={progressContainerStyle}>
            <div style={progressBarStyle}>
              <div 
                style={{
                  ...progressFillStyle,
                  width: `${progressPercentage}%`
                }}
              />
            </div>
            <div style={progressTextStyle}>
              <span>Goal: ${DONATION_GOAL.toLocaleString()}</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Amount Selection */}
        <div style={amountsSectionStyle}>
          <h3 style={sectionTitleStyle}>Choose Amount</h3>
          <div style={amountButtonsStyle}>
            {DONATION_AMOUNTS.map(amount => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                style={{
                  ...amountButtonStyle,
                  backgroundColor: selectedAmount === amount && !showCustomInput ? '#FFD700' : '#34495e',
                  color: selectedAmount === amount && !showCustomInput ? '#2c3e50' : '#ecf0f1'
                }}
              >
                ${amount}
              </button>
            ))}
            <button
              onClick={handleCustomClick}
              style={{
                ...amountButtonStyle,
                backgroundColor: showCustomInput ? '#3498db' : '#34495e',
                color: showCustomInput ? 'white' : '#3498db',
                border: `2px solid ${showCustomInput ? '#3498db' : '#3498db'}`
              }}
            >
              Custom
            </button>
          </div>

          {/* Custom Input */}
          {showCustomInput && (
            <div style={customInputStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#ecf0f1', fontSize: '18px' }}>$</span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Enter amount"
                  style={customInputFieldStyle}
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* PayPal Button */}
        <div style={paypalSectionStyle}>
          {currentAmount >= 1 ? (
            <>
              <div style={selectedAmountDisplayStyle}>
                Donating: <strong style={{ color: '#FFD700' }}>${currentAmount.toFixed(2)}</strong>
              </div>
              <PayPalButtons
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
                style={{
                  layout: 'vertical',
                  color: 'gold',
                  shape: 'pill',
                  label: 'donate',
                  height: 45
                }}
                disabled={isProcessing || loading}
              />
            </>
          ) : (
            <div style={amountErrorStyle}>
              Please select an amount of $1 or more
            </div>
          )}
        </div>

        {/* Status Message */}
        {status && (
          <div style={statusMessageStyle(status)}>
            {status}
          </div>
        )}

        {/* Recent Donations */}
        {recentDonations.length > 0 && (
          <div style={recentDonationsStyle}>
            <h3 style={sectionTitleStyle}>Recent Supporters</h3>
            <div style={donationsListStyle}>
              {recentDonations.slice(0, 3).map((donation, index) => (
                <div key={donation.id || index} style={donationItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#bdc3c7' }}>
                      {donation.displayName || donation.userEmail?.split('@')[0] || 'Anonymous'}
                    </span>
                    <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                      ${donation.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={footerStyle}>
          <p style={footerTextStyle}>
            Your donation helps keep the galaxy shining bright! ✨
            {user ? ` Donating as: ${user.displayName || user.email}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============= STYLES =============

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 11000,
  padding: '1rem'
};

const popupStyle = {
  backgroundColor: '#2c3e50',
  border: '2px solid #34495e',
  borderRadius: '16px',
  padding: '2rem',
  width: '90%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(255, 215, 0, 0.2)',
  animation: 'modalFadeIn 0.3s ease'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #34495e'
};

const titleStyle = {
  margin: 0,
  fontSize: '1.5rem',
  color: '#FFD700',
  textAlign: 'center',
  flex: 1
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '2rem',
  cursor: 'pointer',
  color: '#95a5a6',
  padding: '0.25rem',
  borderRadius: '4px',
  lineHeight: 1,
  marginLeft: '1rem'
};

const progressSectionStyle = {
  textAlign: 'center',
  marginBottom: '2rem'
};

const totalRaisedStyle = {
  marginBottom: '1rem'
};

const totalAmountStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: '#FFD700',
  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
};

const totalLabelStyle = {
  fontSize: '0.9rem',
  color: '#bdc3c7',
  marginTop: '0.25rem'
};

const progressContainerStyle = {
  marginTop: '1rem'
};

const progressBarStyle = {
  height: '12px',
  backgroundColor: '#34495e',
  borderRadius: '6px',
  overflow: 'hidden',
  marginBottom: '8px'
};

const progressFillStyle = {
  height: '100%',
  borderRadius: '6px',
  background: 'linear-gradient(90deg, #FFD700, #FF6B6B)',
  transition: 'width 0.5s ease'
};

const progressTextStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: '#95a5a6'
};

const amountsSectionStyle = {
  marginBottom: '2rem'
};

const sectionTitleStyle = {
  margin: '0 0 1rem 0',
  fontSize: '1.1rem',
  color: '#ecf0f1',
  fontWeight: '600'
};

const amountButtonsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'center'
};

const amountButtonStyle = {
  padding: '12px 20px',
  border: 'none',
  borderRadius: '25px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '80px'
};

const customInputStyle = {
  marginTop: '1rem'
};

const customInputFieldStyle = {
  flex: 1,
  padding: '12px',
  border: '2px solid #3498db',
  borderRadius: '8px',
  backgroundColor: '#1a252f',
  color: '#ecf0f1',
  fontSize: '16px',
  outline: 'none'
};

const paypalSectionStyle = {
  marginBottom: '1.5rem'
};

const selectedAmountDisplayStyle = {
  textAlign: 'center',
  color: '#ecf0f1',
  fontSize: '1.1rem',
  marginBottom: '1rem',
  padding: '12px',
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  borderRadius: '8px'
};

const amountErrorStyle = {
  textAlign: 'center',
  color: '#e74c3c',
  padding: '15px',
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  borderRadius: '8px',
  fontSize: '0.9rem'
};

const statusMessageStyle = (status) => ({
  padding: '12px',
  backgroundColor: status.includes('Thank you') ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
  border: `1px solid ${status.includes('Thank you') ? '#2ecc71' : '#e74c3c'}`,
  borderRadius: '8px',
  color: status.includes('Thank you') ? '#2ecc71' : '#e74c3c',
  textAlign: 'center',
  marginBottom: '1rem'
});

const recentDonationsStyle = {
  marginBottom: '1.5rem'
};

const donationsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const donationItemStyle = {
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  padding: '10px 15px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 215, 0, 0.1)'
};

const footerStyle = {
  marginTop: '1.5rem',
  paddingTop: '1.5rem',
  borderTop: '1px solid #34495e'
};

const footerTextStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#95a5a6',
  lineHeight: '1.4',
  textAlign: 'center'
};

// Add animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;
document.head.appendChild(styleSheet);

export default DonationPopup;