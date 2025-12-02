import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestPanel = () => {
  const { 
    profiles, 
    profilesLoading,
    addTestProfile, 
    createBulkTestProfiles, 
    clearAllProfiles,
    loadProfiles
  } = useAuth();
  
  const [bulkCount, setBulkCount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddSingleTest = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      await addTestProfile();
      setMessage('✅ 1 test profile added to Firestore!');
    } catch (error) {
      setMessage('❌ Error adding test profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBulkTest = async () => {
    if (bulkCount < 1 || bulkCount > 1000) {
      setMessage('❌ Please enter a number between 1 and 1,000');
      return;
    }

    setIsLoading(true);
    setMessage(`🔄 Creating ${bulkCount.toLocaleString()} test profiles in Firestore... This may take a moment.`);
    
    try {
      const createdCount = await createBulkTestProfiles(bulkCount);
      setMessage(`✅ Successfully created ${createdCount.toLocaleString()} test profiles in Firestore!`);
    } catch (error) {
      setMessage('❌ Error creating bulk profiles: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllProfiles = async () => {
    if (!window.confirm('⚠️ This will delete ALL profiles from Firestore (including real ones)! Are you sure?')) {
      return;
    }

    setIsLoading(true);
    setMessage('🔄 Clearing all profiles from Firestore...');
    
    try {
      const deletedCount = await clearAllProfiles();
      setMessage(`✅ Cleared ${deletedCount} profiles from Firestore!`);
    } catch (error) {
      setMessage('❌ Error clearing profiles: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshProfiles = async () => {
    setIsLoading(true);
    setMessage('🔄 Refreshing profiles from Firestore...');
    try {
      await loadProfiles();
      setMessage(`✅ Refreshed! Now showing ${profiles.length.toLocaleString()} profiles.`);
    } catch (error) {
      setMessage('❌ Error refreshing profiles: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate estimated tile size
  const calculateTileSize = () => {
    if (profiles.length === 0) return 0;
    
    // Estimate tile size based on square grid
    const containerWidth = window.innerWidth - 100;
    const containerHeight = window.innerHeight - 250;
    const cols = Math.ceil(Math.sqrt(profiles.length * (containerWidth / containerHeight)));
    const tileSize = Math.max(1, containerWidth / cols);
    
    return Math.floor(tileSize);
  };

  const tileSize = calculateTileSize();

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>🧪 Test Panel</h3>
        <div style={statsStyle}>
          <span style={statItemStyle}>Total: {profiles.length.toLocaleString()}</span>
          <span style={statItemStyle}>Tile: ~{tileSize}px</span>
          <span style={statItemStyle}>
            <button 
              onClick={handleRefreshProfiles}
              disabled={isLoading}
              style={refreshButtonStyle}
              title="Refresh from Firestore"
            >
              🔄
            </button>
          </span>
        </div>
      </div>

      <div style={controlsStyle}>
        {/* Single Test Profile */}
        <div style={controlGroupStyle}>
          <button 
            onClick={handleAddSingleTest}
            disabled={isLoading || profilesLoading}
            style={buttonStyle}
          >
            ➕ Add Single Test Profile
          </button>
          <span style={hintStyle}>Adds 1 random test profile to Firestore</span>
        </div>

        {/* Bulk Test Profiles */}
        <div style={controlGroupStyle}>
          <div style={inputGroupStyle}>
            <input
              type="number"
              value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
              min="1"
              max="1000"
              style={inputStyle}
              disabled={isLoading || profilesLoading}
            />
            <button 
              onClick={handleAddBulkTest}
              disabled={isLoading || profilesLoading}
              style={buttonStyle}
            >
              🚀 Create Bulk Profiles
            </button>
          </div>
          <span style={hintStyle}>Create multiple test profiles in Firestore (max 1,000)</span>
        </div>

        {/* Clear Button */}
        <div style={controlGroupStyle}>
          <div style={buttonGroupStyle}>
            <button 
              onClick={handleClearAllProfiles}
              disabled={isLoading || profilesLoading || profiles.length === 0}
              style={dangerButtonStyle}
            >
              ⚠️ Clear All Profiles
            </button>
            <button 
              onClick={handleRefreshProfiles}
              disabled={isLoading || profilesLoading}
              style={secondaryButtonStyle}
            >
              🔄 Refresh
            </button>
          </div>
          <span style={hintStyle}>Remove all profiles from Firestore (use with caution!)</span>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      {/* Loading Indicator */}
      {(isLoading || profilesLoading) && (
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          Processing... {profilesLoading ? 'Loading profiles' : 'Updating Firestore'}
        </div>
      )}

      {/* Performance Info */}
      <div style={infoStyle}>
        <p style={infoTextStyle}>
          <strong>How it works:</strong> All tiles fit on one screen - no scrolling! 
          As more profiles are added, tiles automatically shrink to maintain the "all visible" view.
        </p>
        <p style={infoTextStyle}>
          <strong>Current:</strong> {profiles.length.toLocaleString()} tiles • ~{tileSize}px each • 
          <strong> Grid:</strong> ~{Math.ceil(Math.sqrt(profiles.length))}×{Math.ceil(Math.sqrt(profiles.length))}
        </p>
        <p style={warningTextStyle}>
          ⚠️ <strong>Note:</strong> Bulk creation (1000+) may take several seconds. 
          Clear All deletes EVERYTHING from Firestore - be careful!
        </p>
      </div>
    </div>
  );
};

// Styles
const panelStyle = {
  backgroundColor: '#2c3e50',
  border: '1px solid #34495e',
  borderRadius: '12px',
  padding: '1.5rem',
  margin: '1rem 0',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem'
};

const titleStyle = {
  margin: 0,
  color: '#ecf0f1',
  fontSize: '1.3rem'
};

const statsStyle = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  fontSize: '0.9rem'
};

const statItemStyle = {
  backgroundColor: '#34495e',
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  color: '#bdc3c7',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
};

const refreshButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#3498db',
  cursor: 'pointer',
  fontSize: '1rem',
  padding: '0.25rem',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    backgroundColor: 'rgba(52, 152, 219, 0.1)'
  }
};

const controlsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const controlGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const inputGroupStyle = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const inputStyle = {
  padding: '0.75rem',
  border: '1px solid #34495e',
  borderRadius: '6px',
  backgroundColor: '#1a1a1a',
  color: '#ecf0f1',
  fontSize: '1rem',
  width: '120px',
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#3498db',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  flexShrink: 0,
  '&:hover:not(:disabled)': {
    backgroundColor: '#2980b9',
    transform: 'translateY(-1px)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none'
  }
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#34495e',
  '&:hover:not(:disabled)': {
    backgroundColor: '#2c3e50'
  }
};

const dangerButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#e74c3c',
  '&:hover:not(:disabled)': {
    backgroundColor: '#c0392b'
  }
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap'
};

const hintStyle = {
  fontSize: '0.8rem',
  color: '#95a5a6',
  fontStyle: 'italic'
};

const messageStyle = {
  padding: '1rem',
  backgroundColor: '#34495e',
  borderRadius: '6px',
  color: '#ecf0f1',
  marginTop: '1rem',
  borderLeft: '4px solid #3498db',
  animation: 'fadeIn 0.3s ease'
};

const loadingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: '#34495e',
  borderRadius: '6px',
  color: '#ecf0f1',
  marginTop: '1rem',
  justifyContent: 'center',
  animation: 'fadeIn 0.3s ease'
};

const spinnerStyle = {
  width: '20px',
  height: '20px',
  border: '2px solid #3498db',
  borderTop: '2px solid transparent',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const infoStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: '#34495e',
  borderRadius: '6px',
  borderLeft: '4px solid #27ae60',
  animation: 'fadeIn 0.3s ease'
};

const infoTextStyle = {
  margin: '0.5rem 0',
  fontSize: '0.9rem',
  color: '#bdc3c7',
  lineHeight: '1.4'
};

const warningTextStyle = {
  margin: '0.5rem 0',
  fontSize: '0.9rem',
  color: '#e74c3c',
  lineHeight: '1.4',
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid rgba(231, 76, 60, 0.3)'
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.innerText = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(styleSheet);

export default TestPanel;