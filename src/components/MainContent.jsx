import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreateProfilePopup from './CreateProfilePopup';
import ProfileModal from './ProfileModal';
import UserGrid from './UserGrid';
import TestPanel from './TestPanel';

const MainContent = () => {
  const { user, userProfile } = useAuth();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Listen for create/edit profile event from header
  useEffect(() => {
    const handleShowCreateProfile = (event) => {
      console.log('Create/Edit profile event received', event.detail);
      if (user) {
        setShowProfilePopup(true);
      }
    };

    window.addEventListener('showCreateProfile', handleShowCreateProfile);
    
    return () => {
      window.removeEventListener('showCreateProfile', handleShowCreateProfile);
    };
  }, [user]);

  const handleProfileClick = (profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  return (
    <main style={mainStyle}>
      <div style={containerStyle}>
        <div style={headerSectionStyle}>
          {/* <h2 style={titleStyle}>Community Profiles</h2>
          <p style={paragraphStyle}>
            Discover amazing people in our community
          </p> */}
        </div>

        {/* <TestPanel /> */}

        <UserGrid onProfileClick={handleProfileClick} />

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
  backgroundColor: '#1a1a1a',
  width: '100%',
  color: '#ecf0f1',
  position: 'relative'
};

const containerStyle = {
  width: '100%',
  margin: '0 auto',
  padding: '0 1rem'
};

const headerSectionStyle = {
  textAlign: 'center',
  marginBottom: '2rem',
  padding: '0 0.5rem'
};

const titleStyle = {
  fontSize: '2rem',
  margin: '0 0 0.5rem 0',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: '700'
};

const paragraphStyle = {
  fontSize: '1rem',
  lineHeight: '1.6',
  marginBottom: '0',
  color: '#bdc3c7',
  maxWidth: '600px',
  margin: '0 auto'
};

export default MainContent;