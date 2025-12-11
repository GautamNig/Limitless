import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import MainContent from './components/MainContent';
import TestPanel from './components/TestPanel';
import DonationPopup from './components/DonationPopup';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

function App() {
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('galaxy'); // NEW: Tab state management

  useEffect(() => {
    const handleShowTestPanel = () => {
      setShowTestPanel(true);
    };

    const handleShowDonationPopup = () => {
      setShowDonationPopup(true);
    };

    window.addEventListener('showTestPanel', handleShowTestPanel);
    window.addEventListener('showDonationPopup', handleShowDonationPopup);
    
    return () => {
      window.removeEventListener('showTestPanel', handleShowTestPanel);
      window.removeEventListener('showDonationPopup', handleShowDonationPopup);
    };
  }, []);

  const paypalOptions = {
    'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX || 'test',
    currency: 'USD',
    intent: 'capture',
    components: 'buttons'
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <AuthProvider>
        <div style={appStyle}>
          {/* NEW: Pass tab state to Header */}
          <Header 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          
          {/* NEW: Pass activeTab to MainContent */}
          <MainContent activeTab={activeTab} />
          
          {/* Global Popups */}
          <TestPanel 
            isOpen={showTestPanel}
            onClose={() => setShowTestPanel(false)}
          />
          
          <DonationPopup 
            isOpen={showDonationPopup}
            onClose={() => setShowDonationPopup(false)}
          />
        </div>
      </AuthProvider>
    </PayPalScriptProvider>
  );
}

const appStyle = {
  minHeight: '100vh',
  backgroundColor: '#0a0a1a',
  color: '#ecf0f1',
  position: 'relative',
  width: '100vw',
  margin: 0,
  padding: 0,
  overflow: 'hidden'
};

export default App;