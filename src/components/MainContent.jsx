import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreateProfilePopup from './CreateProfilePopup';
import ProfileModal from './ProfileModal';
import UserGrid from './UserGrid';
import StarfieldBackground from './StarfieldBackground';
import LifeExperiencesTab from './LifeExperiencesTab';

const MainContent = ({ activeTab }) => { // NEW: Receive activeTab as prop
  const { user, userProfile, fetchFullProfile } = useAuth();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleProfileClick = useCallback(async (profile) => {
    setLoadingProfile(true);
    try {
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
  }, [user, handleProfileClick]);

  const handleCloseModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  }, []);

  return (
    <main style={mainStyle}>
      {/* Full-screen starfield background */}
      <StarfieldBackground />
      
      {/* Tab Content */}
      <div style={tabContentStyle}>
        {activeTab === 'galaxy' ? (
          /* Galaxy Tab: Full-screen user grid */
          <div style={userGridContainerStyle}>
            <UserGrid onProfileClick={handleProfileClick} />
          </div>
        ) : (
          /* Life Experiences Tab */
          <LifeExperiencesTab />
        )}
      </div>

      {/* Loading overlay */}
      {loadingProfile && (
        <div style={loadingOverlayStyle}>
          <div style={loadingSpinnerStyle}></div>
        </div>
      )}

      {/* Modals */}
      <CreateProfilePopup 
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
      />

      <ProfileModal 
        profile={selectedProfile}
        isOpen={showProfileModal}
        onClose={handleCloseModal}
      />
    </main>
  );
};

// ============= STYLES =============

const mainStyle = {
  position: 'fixed',
  top: '80px', // Header height
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: 'calc(100vh - 80px)',
  backgroundColor: 'transparent',
  margin: 0,
  padding: 0,
  overflow: 'hidden',
  zIndex: 0
};

const tabContentStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  zIndex: 1,
  overflow: 'hidden'
};

const userGridContainerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  zIndex: 1
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

/* Ensure no scrollbars */
body {
  overflow: hidden;
}
`;
document.head.appendChild(styleSheet);

export default MainContent;