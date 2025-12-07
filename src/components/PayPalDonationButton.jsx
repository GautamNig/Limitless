import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { PAYPAL_CONFIG, DONATION_MESSAGES } from '../config/paypalConfig';

const PayPalDonationButton = ({ amount, onSuccess, onError, disabled }) => {
  const createOrder = (data, actions) => {
    const validAmount = Math.max(1, parseFloat(amount) || 1);
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: validAmount.toFixed(2),
          currency_code: PAYPAL_CONFIG.CURRENCY
        },
        description: `Donation to Limitless Galaxy - $${validAmount}`
      }],
      application_context: {
        shipping_preference: 'NO_SHIPPING'
      }
    });
  };

  const onApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      
      if (onSuccess) {
        onSuccess(parseFloat(amount), details);
      }
      
      return details;
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'pill',
          label: 'donate',
          height: 45,
          tagline: false
        }}
        disabled={disabled || !amount || amount < 1}
        fundingSource={undefined} // Let PayPal decide
      />
    </div>
  );
};

export default PayPalDonationButton;