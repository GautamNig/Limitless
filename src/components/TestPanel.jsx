import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const TestPanel = ({ isOpen, onClose }) => {
  const { 
    user, 
    profiles, 
    profilesLoading, 
    addTestProfile, 
    createBulkTestProfiles, 
    clearAllProfiles,
    loadProfiles,  // Get loadProfiles from context
    deleteAllProfiles
  } = useAuth();

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

  const handleAddTestProfile = async () => {
    try {
      await addTestProfile();
      // alert('Test profile added successfully!');
    } catch (error) {
      console.error('Error adding test profile:', error);
      // alert('Failed to add test profile: ' + error.message);
    }
  };

  const handleBulkCreate = async () => {
    const count = 100;
    try {
      await createBulkTestProfiles(count);
      // alert(`Successfully created ${count} test profiles!`);
    } catch (error) {
      console.error('Error creating bulk profiles:', error);
      // alert('Failed to create bulk profiles: ' + error.message);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear ALL profiles? This cannot be undone!')) {
      try {
        await clearAllProfiles();
        // alert('All profiles cleared successfully!');
      } catch (error) {
        console.error('Error clearing profiles:', error);
        // alert('Failed to clear profiles: ' + error.message);
      }
    }
  };

  // NEW: Add Random Likes Function
  const handleAddRandomLikes = async () => {
    if (profiles.length === 0) {
      // alert('No profiles to add likes to');
      return;
    }
    
    try {
      console.log(`Adding random likes to ${profiles.length} profiles...`);
      
      const updates = profiles.map(async (profile) => {
        // Generate random like counts
        const thoughtLikesToAdd = Math.floor(Math.random() * 20); // 0-19
        const experienceLikesToAdd = Math.floor(Math.random() * 15); // 0-14
        
        const profileRef = doc(db, 'profiles', profile.id);
        
        // Prepare fake user IDs for likes
        const fakeThoughtLikers = [];
        const fakeExperienceLikers = [];
        
        // Generate fake user IDs
        for (let i = 0; i < thoughtLikesToAdd; i++) {
          fakeThoughtLikers.push(`fake_liker_${Math.random().toString(36).substr(2, 9)}`);
        }
        
        for (let i = 0; i < experienceLikesToAdd; i++) {
          fakeExperienceLikers.push(`fake_liker_${Math.random().toString(36).substr(2, 9)}`);
        }
        
        // Update the profile with random likes
        await updateDoc(profileRef, {
          thoughtLikes: thoughtLikesToAdd,
          thoughtLikers: arrayUnion(...fakeThoughtLikers),
          experienceLikes: experienceLikesToAdd,
          experienceLikers: arrayUnion(...fakeExperienceLikers),
          updatedAt: new Date()
        });
      });
      
      await Promise.all(updates);
      console.log(`✅ Added random likes to ${profiles.length} profiles!`);
      
      // Refresh profiles using the function from context
      if (loadProfiles) {
        await loadProfiles();
      }
      
    } catch (error) {
      console.error('Error adding random likes:', error);
      // alert('Failed to add random likes: ' + error.message);
    }
  };

  // NEW: Simulate Viral Content
  const simulateViralContent = async () => {
    if (profiles.length === 0) {
      // alert('No profiles to make viral');
      return;
    }
    
    try {
      // Pick 2-3 random profiles to go "viral"
      const viralCount = Math.min(3, profiles.length);
      const shuffled = [...profiles].sort(() => 0.5 - Math.random());
      const viralProfiles = shuffled.slice(0, viralCount);
      
      console.log(`Making ${viralProfiles.length} profiles go viral...`);
      
      const updates = viralProfiles.map(async (profile) => {
        const profileRef = doc(db, 'profiles', profile.id);
        
        // Generate high like counts (viral range)
        const thoughtLikes = Math.floor(Math.random() * 200 + 100); // 100-300
        const experienceLikes = Math.floor(Math.random() * 150 + 50); // 50-200
        
        // Generate fake liker IDs
        const fakeThoughtLikers = Array.from({length: thoughtLikes}, (_, i) => 
          `viral_liker_${i}_${Math.random().toString(36).substr(2, 5)}`
        );
        
        const fakeExperienceLikers = Array.from({length: experienceLikes}, (_, i) => 
          `viral_liker_${i}_${Math.random().toString(36).substr(2, 5)}`
        );
        
        await updateDoc(profileRef, {
          thoughtLikes: thoughtLikes,
          thoughtLikers: arrayUnion(...fakeThoughtLikers),
          experienceLikes: experienceLikes,
          experienceLikers: arrayUnion(...fakeExperienceLikers),
          updatedAt: new Date()
        });
      });
      
      await Promise.all(updates);
      console.log(`✅ ${viralProfiles.length} profiles now have viral like counts!`);
      
      // Refresh profiles
      if (loadProfiles) {
        await loadProfiles();
      }
      
    } catch (error) {
      console.error('Error simulating viral content:', error);
      // alert('Failed to simulate viral content: ' + error.message);
    }
  };

  // NEW: Clear All Likes
  const clearAllLikes = async () => {
    if (profiles.length === 0) {
      // alert('No profiles to clear likes from');
      return;
    }
    
    if (!window.confirm(`Clear ALL likes from ${profiles.length} profiles? This cannot be undone!`)) {
      return;
    }
    
    try {
      console.log('Clearing all likes...');
      
      const updates = profiles.map(async (profile) => {
        const profileRef = doc(db, 'profiles', profile.id);
        await updateDoc(profileRef, {
          thoughtLikes: 0,
          thoughtLikers: [],
          experienceLikes: 0,
          experienceLikers: [],
          updatedAt: new Date()
        });
      });
      
      await Promise.all(updates);
      console.log('✅ All likes cleared!');
      
      // Refresh profiles
      if (loadProfiles) {
        await loadProfiles();
      }
      
    } catch (error) {
      console.error('Error clearing likes:', error);
      // alert('Failed to clear likes: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>🧪 Test Panel</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        <div style={contentStyle}>
          {/* Stats Section */}
          <div style={statsSectionStyle}>
            <h3 style={sectionTitleStyle}>Current Stats</h3>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <div style={statValueStyle}>{profiles.length}</div>
                <div style={statLabelStyle}>Total Stars</div>
              </div>
              <div style={statCardStyle}>
                <div style={statValueStyle}>{user ? 'Yes' : 'No'}</div>
                <div style={statLabelStyle}>Signed In</div>
              </div>
            </div>
          </div>

          {/* Profile Management */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Profile Management</h3>
            <div style={buttonGridStyle}>
              <button 
                onClick={handleAddTestProfile}
                style={actionButtonStyle}
                disabled={profilesLoading}
              >
                Add Test Star
              </button>
              
              <button 
                onClick={handleBulkCreate}
                style={actionButtonStyle}
                disabled={profilesLoading}
              >
                Add 100 Stars
              </button>
              
              <button 
                onClick={handleClearAll}
                style={dangerButtonStyle}
                disabled={profilesLoading || profiles.length === 0}
              >
                Clear All Stars
              </button>
            </div>
          </div>

          {/* NEW: Like Management Section */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Like Management</h3>
            <div style={buttonGridStyle}>
              <button 
                onClick={handleAddRandomLikes}
                style={actionButtonStyle}
                disabled={profilesLoading || profiles.length === 0}
              >
                Add Random Likes
              </button>
              
              <button 
                onClick={simulateViralContent}
                style={actionButtonStyle}
                disabled={profilesLoading || profiles.length === 0}
              >
                Simulate Viral Content
              </button>
              
              <button 
                onClick={clearAllLikes}
                style={dangerButtonStyle}
                disabled={profilesLoading || profiles.length === 0}
              >
                Clear All Likes
              </button>
            </div>
            <div style={hintStyle}>
              Random likes: 0-19 for thoughts, 0-14 for experiences
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div style={userInfoStyle}>
              <h3 style={sectionTitleStyle}>Current User</h3>
              <div style={userCardStyle}>
                <img 
                  src={user.photoURL} 
                  alt={user.displayName}
                  style={userAvatarStyle}
                />
                <div style={userDetailsStyle}>
                  <div style={userNameStyle}>{user.displayName}</div>
                  <div style={userEmailStyle}>{user.email}</div>
                  <div style={userIdStyle}>ID: {user.uid.substring(0, 12)}...</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {profilesLoading && (
            <div style={loadingStyle}>
              <div style={spinnerStyle}></div>
              <div>Processing...</div>
            </div>
          )}

          {/* Warning */}
          <div style={warningStyle}>
            ⚠️ This panel is for testing only. Changes affect the live database.
          </div>
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

const panelStyle = {
  backgroundColor: '#2c3e50',
  border: '2px solid #34495e',
  borderRadius: '16px',
  padding: '2rem',
  width: '90%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
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
  color: '#ecf0f1'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '2rem',
  cursor: 'pointer',
  color: '#95a5a6',
  padding: '0.25rem',
  borderRadius: '4px',
  lineHeight: 1
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const statsSectionStyle = {
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid #34495e'
};

const sectionTitleStyle = {
  margin: '0 0 1rem 0',
  fontSize: '1.1rem',
  color: '#3498db',
  fontWeight: '600'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '1rem'
};

const statCardStyle = {
  backgroundColor: '#34495e',
  padding: '1rem',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px solid #2c3e50'
};

const statValueStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#FFD700',
  marginBottom: '0.5rem'
};

const statLabelStyle = {
  fontSize: '0.9rem',
  color: '#bdc3c7'
};

const sectionStyle = {
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid #34495e'
};

const buttonGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const actionButtonStyle = {
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#3498db',
  color: 'white',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: '#2980b9',
    transform: 'translateY(-2px)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const dangerButtonStyle = {
  ...actionButtonStyle,
  backgroundColor: '#e74c3c',
  '&:hover:not(:disabled)': {
    backgroundColor: '#c0392b'
  }
};

const hintStyle = {
  fontSize: '0.8rem',
  color: '#95a5a6',
  fontStyle: 'italic',
  marginTop: '0.5rem',
  textAlign: 'center'
};

const userInfoStyle = {
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid #34495e'
};

const userCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const userAvatarStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  border: '3px solid #3498db'
};

const userDetailsStyle = {
  flex: 1
};

const userNameStyle = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#ecf0f1',
  marginBottom: '0.25rem'
};

const userEmailStyle = {
  fontSize: '0.9rem',
  color: '#bdc3c7',
  marginBottom: '0.25rem'
};

const userIdStyle = {
  fontSize: '0.8rem',
  color: '#95a5a6',
  fontFamily: 'monospace'
};

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  borderRadius: '8px',
  border: '1px solid #34495e'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid rgba(52, 152, 219, 0.3)',
  borderTopColor: '#3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const warningStyle = {
  padding: '1rem',
  backgroundColor: 'rgba(243, 156, 18, 0.1)',
  border: '1px solid #f39c12',
  borderRadius: '8px',
  color: '#f39c12',
  fontSize: '0.9rem',
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

export default TestPanel;