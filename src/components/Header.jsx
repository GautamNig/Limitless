import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, userProfile, profiles, signInWithGoogle, logout } = useAuth();
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const infoPanelRef = useRef(null);
  const buttonRef = useRef(null);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleInfoPanel = () => {
    setShowInfoPanel(!showInfoPanel);
  };

  // Close info panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        infoPanelRef.current && 
        buttonRef.current &&
        !infoPanelRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowInfoPanel(false);
      }
    };

    if (showInfoPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfoPanel]);

  // Calculate grid info
  const calculateGridInfo = () => {
    if (profiles.length === 0) return null;
    
    const containerWidth = window.innerWidth - 40;
    const containerHeight = window.innerHeight - 280;
    
    let bestCols = 1;
    let bestTileSize = 0;
    let bestError = Infinity;
    
    for (let testCols = 1; testCols <= Math.min(profiles.length, 100); testCols++) {
      const testRows = Math.ceil(profiles.length / testCols);
      const tileWidth = (containerWidth - (testCols - 1)) / testCols;
      const tileHeight = (containerHeight - (testRows - 1)) / testRows;
      const testTileSize = Math.min(tileWidth, tileHeight);
      
      const usedWidth = testCols * testTileSize + (testCols - 1);
      const usedHeight = testRows * testTileSize + (testRows - 1);
      
      const error = Math.abs(containerWidth - usedWidth) + Math.abs(containerHeight - usedHeight);
      
      if (error < bestError) {
        bestError = error;
        bestCols = testCols;
        bestTileSize = testTileSize;
      }
    }
    
    const rows = Math.ceil(profiles.length / bestCols);
    return {
      members: profiles.length.toLocaleString(),
      tileSize: Math.floor(bestTileSize),
      grid: `${bestCols}×${rows}`,
      density: (profiles.length / (bestCols * rows)).toFixed(2)
    };
  };

  const gridInfo = calculateGridInfo();

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        {/* Logo */}
        <div style={logoSectionStyle}>
          <h1 style={logoStyle}>🌌 Limitless</h1>
        </div>

        {/* Center: Grid Info Button and Profile Button */}
        <div style={centerSectionStyle}>
          {gridInfo && (
            <div style={infoButtonContainerStyle}>
              <button 
                ref={buttonRef}
                onClick={toggleInfoPanel}
                style={infoButtonStyle}
                title="Show grid information"
              >
                📊 {gridInfo.members} members
              </button>
              
              {showInfoPanel && (
                <div ref={infoPanelRef} style={infoPanelStyle}>
                  <div style={infoPanelHeaderStyle}>
                    <h4 style={infoPanelTitleStyle}>Grid Information</h4>
                    <button 
                      onClick={() => setShowInfoPanel(false)}
                      style={closeButtonStyle}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={infoPanelContentStyle}>
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>Total Members:</span>
                      <span style={infoValueStyle}>{gridInfo.members}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>Tile Size:</span>
                      <span style={infoValueStyle}>{gridInfo.tileSize}px</span>
                    </div>
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>Grid Layout:</span>
                      <span style={infoValueStyle}>{gridInfo.grid}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>Grid Density:</span>
                      <span style={infoValueStyle}>{gridInfo.density}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <span style={infoLabelStyle}>Container:</span>
                      <span style={infoValueStyle}>
                        {Math.floor(window.innerWidth - 40)}×{Math.floor(window.innerHeight - 280)}px
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create/Edit Profile Button - Show when user is logged in */}
          {user && (
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('showCreateProfile', { 
                detail: { mode: userProfile ? 'edit' : 'create' } 
              }))}
              style={userProfile ? editProfileButtonStyle : createProfileButtonStyle}
              title={userProfile ? "Edit your profile" : "Create your profile"}
            >
              {userProfile ? '✏️ Edit Profile' : '✨ Create Profile'}
            </button>
          )}
        </div>

        {/* Right: Auth Section */}
        <div style={authSectionStyle}>
          {user ? (
            <div style={userInfoStyle}>
              <img 
                src={user.photoURL} 
                alt={user.displayName}
                style={avatarStyle}
              />
              <div style={userTextStyle}>
                <span style={userNameStyle}>{user.displayName}</span>
                {userProfile && (
                  <span style={profileStatusStyle} title="You have a profile">✓</span>
                )}
              </div>
              <button onClick={handleSignOut} style={signOutButtonStyle}>
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={handleSignIn} style={signInButtonStyle}>
              🔐 Sign In with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// Styles
const headerStyle = {
  backgroundColor: '#2c3e50',
  color: 'white',
  padding: '0.75rem 0',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  width: '100%',
  borderBottom: '1px solid #34495e',
  position: 'sticky',
  top: 0,
  zIndex: 1000
};

const containerStyle = {
  width: '100%',
  margin: '0 auto',
  padding: '0 1.5rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem'
};

const logoSectionStyle = {
  flexShrink: 0
};

const logoStyle = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: '700',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

const centerSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flex: 1,
  justifyContent: 'center'
};

const infoButtonContainerStyle = {
  position: 'relative'
};

const infoButtonStyle = {
  backgroundColor: '#34495e',
  color: '#bdc3c7',
  border: '1px solid #2c3e50',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const infoPanelStyle = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#2c3e50',
  border: '1px solid #34495e',
  borderRadius: '12px',
  padding: '1rem',
  width: '280px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
  zIndex: 2000,
  animation: 'fadeIn 0.2s ease'
};

const infoPanelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #34495e'
};

const infoPanelTitleStyle = {
  margin: 0,
  fontSize: '1rem',
  color: '#ecf0f1',
  fontWeight: '600'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#95a5a6',
  fontSize: '1.2rem',
  cursor: 'pointer',
  padding: '0',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px'
};

const infoPanelContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const infoItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.25rem 0'
};

const infoLabelStyle = {
  fontSize: '0.85rem',
  color: '#bdc3c7',
  fontWeight: '500'
};

const infoValueStyle = {
  fontSize: '0.9rem',
  color: '#ecf0f1',
  fontWeight: '600',
  backgroundColor: '#34495e',
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  minWidth: '60px',
  textAlign: 'center'
};

// FIX: Ensure editProfileButtonStyle is properly defined and used
const createProfileButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1.25rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const editProfileButtonStyle = {
  backgroundColor: '#3498db', // Blue color for edit
  color: 'white',
  border: 'none',
  padding: '0.5rem 1.25rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const authSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0
};

const userInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const avatarStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '2px solid #3498db'
};

const userTextStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const userNameStyle = {
  fontWeight: '500',
  color: '#ecf0f1',
  fontSize: '0.9rem'
};

const profileStatusStyle = {
  color: '#27ae60',
  fontSize: '1rem',
  fontWeight: 'bold'
};

const signInButtonStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const signOutButtonStyle = {
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: '500',
  transition: 'all 0.2s ease'
};

// Add animation
const styleSheet = document.createElement('style');
styleSheet.innerText = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
`;
document.head.appendChild(styleSheet);

export default Header;