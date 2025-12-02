import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreateProfilePopup from './CreateProfilePopup';
import ProfileModal from './ProfileModal';
import UserGrid from './UserGrid';
import TestPanel from './TestPanel';
import StarfieldBackground from './StarfieldBackground'; // Make sure this exists

const MainContent = () => {
  const { user, userProfile, fetchFullProfile } = useAuth();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Define handleProfileClick first
  const handleProfileClick = useCallback(async (profile) => {
    setLoadingProfile(true);
    try {
      // Fetch full profile data only when clicked
      const fullProfile = await fetchFullProfile(profile.id);
      if (fullProfile) {
        setSelectedProfile(fullProfile);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  }, [fetchFullProfile]);

  // THEN use it in useEffect
  useEffect(() => {
    const handleShowCreateProfile = () => {
      if (user) {
        setShowProfilePopup(true);
      }
    };

    const handleOpenProfileModal = (event) => {
      console.log('MainContent: Opening profile from event', event.detail.profile);
      handleProfileClick(event.detail.profile);
    };

    window.addEventListener('showCreateProfile', handleShowCreateProfile);
    window.addEventListener('openProfileModal', handleOpenProfileModal);
    
    return () => {
      window.removeEventListener('showCreateProfile', handleShowCreateProfile);
      window.removeEventListener('openProfileModal', handleOpenProfileModal);
    };
  }, [user, handleProfileClick]); // Add handleProfileClick to dependencies

  const handleCloseModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  }, []);

  const toggleTestPanel = useCallback(() => {
    setShowTestPanel(!showTestPanel);
  }, [showTestPanel]);

  return (
    <main style={mainStyle}>
      {/* Starfield Background */}
      <StarfieldBackground />
      
      <div style={containerStyle}>
        {/* Test Panel Toggle Button */}
        <div style={testPanelToggleStyle}>
          <button 
            onClick={toggleTestPanel}
            style={testPanelButtonStyle}
          >
            {showTestPanel ? '▼ Hide Test Panel' : '▲ Show Test Panel'}
          </button>
        </div>

        {/* Test Panel */}
        {showTestPanel && <TestPanel />}

        <UserGrid onProfileClick={handleProfileClick} />

        {/* Loading overlay */}
        {loadingProfile && (
          <div style={loadingOverlayStyle}>
            <div style={loadingSpinnerStyle}></div>
          </div>
        )}

        <CreateProfilePopup 
          isOpen={showProfilePopup}
          onClose={() => setShowProfilePopup(false)}
        />

        <ProfileModal 
          profile={selectedProfile}
          isOpen={showProfileModal}
          onClose={handleCloseModal}
        />
      </div>
    </main>
  );
};

// Styles
const mainStyle = {
  padding: '1rem 0',
  minHeight: 'calc(100vh - 80px)',
  backgroundColor: 'transparent', // Transparent to show starfield
  width: '100%',
  color: '#ecf0f1',
  position: 'relative'
};

const containerStyle = {
  width: '100%',
  margin: '0 auto',
  padding: '0 1rem',
  position: 'relative',
  zIndex: 1 // Above starfield background
};

const testPanelToggleStyle = {
  textAlign: 'center',
  marginBottom: '1rem'
};

const testPanelButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'rgba(52, 73, 94, 0.8)',
  color: '#ecf0f1',
  border: '1px solid rgba(44, 62, 80, 0.8)',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(44, 62, 80, 0.9)',
    transform: 'translateY(-1px)'
  }
};

const loadingOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000
};

const loadingSpinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid rgba(255, 215, 0, 0.3)',
  borderTop: '5px solid rgba(255, 215, 0, 0.9)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

// Add animation
const styleSheet = document.createElement('style');
styleSheet.innerText = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Add these for starfield */
@keyframes twinkle {
  0% { opacity: 0.1; }
  100% { opacity: 0.6; }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
`;
document.head.appendChild(styleSheet);

export default MainContent;