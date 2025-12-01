import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestPanel = () => {
  const { 
    profiles, 
    addTestProfile, 
    createBulkTestProfiles, 
    clearTestProfiles, 
    clearAllProfiles 
  } = useAuth();
  
  const [bulkCount, setBulkCount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddSingleTest = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      await addTestProfile();
      setMessage('✅ 1 test profile added!');
    } catch (error) {
      setMessage('❌ Error adding test profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBulkTest = async () => {
    if (bulkCount < 1 || bulkCount > 1000000) {
      setMessage('❌ Please enter a number between 1 and 1,000,000');
      return;
    }

    setIsLoading(true);
    setMessage(`🔄 Creating ${bulkCount.toLocaleString()} test profiles... This may take a while for large numbers.`);
    
    try {
      const createdCount = await createBulkTestProfiles(bulkCount);
      setMessage(`✅ Successfully created ${createdCount.toLocaleString()} test profiles!`);
    } catch (error) {
      setMessage('❌ Error creating bulk profiles: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTestProfiles = async () => {
    setIsLoading(true);
    setMessage('🔄 Clearing test profiles...');
    
    try {
      const deletedCount = await clearTestProfiles();
      setMessage(`✅ Cleared ${deletedCount} test profiles!`);
    } catch (error) {
      setMessage('❌ Error clearing test profiles: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllProfiles = async () => {
    if (!window.confirm('⚠️ This will delete ALL profiles (including real ones)! Are you sure?')) {
      return;
    }

    setIsLoading(true);
    setMessage('🔄 Clearing all profiles...');
    
    try {
      const deletedCount = await clearAllProfiles();
      setMessage(`✅ Cleared all ${deletedCount} profiles!`);
    } catch (error) {
      setMessage('❌ Error clearing profiles: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testProfilesCount = profiles.filter(p => p.isTest || p.id.startsWith('test_')).length;
  const realProfilesCount = profiles.length - testProfilesCount;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>🧪 Test Panel</h3>
        <div style={statsStyle}>
          <span style={statItemStyle}>Total: {profiles.length.toLocaleString()}</span>
          <span style={statItemStyle}>Test: {testProfilesCount.toLocaleString()}</span>
          <span style={statItemStyle}>Real: {realProfilesCount}</span>
        </div>
      </div>

      <div style={controlsStyle}>
        {/* Single Test Profile */}
        <div style={controlGroupStyle}>
          <button 
            onClick={handleAddSingleTest}
            disabled={isLoading}
            style={buttonStyle}
          >
            ➕ Add Single Test Profile
          </button>
          <span style={hintStyle}>Adds 1 random test profile</span>
        </div>

        {/* Bulk Test Profiles */}
        <div style={controlGroupStyle}>
          <div style={inputGroupStyle}>
            <input
              type="number"
              value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
              min="1"
              max="1000000"
              style={inputStyle}
              disabled={isLoading}
            />
            <button 
              onClick={handleAddBulkTest}
              disabled={isLoading}
              style={buttonStyle}
            >
              🚀 Create Bulk Profiles
            </button>
          </div>
          <span style={hintStyle}>Create multiple test profiles at once (max 1,000,000)</span>
        </div>

        {/* Clear Buttons */}
        <div style={controlGroupStyle}>
          <div style={buttonGroupStyle}>
            <button 
              onClick={handleClearTestProfiles}
              disabled={isLoading || testProfilesCount === 0}
              style={clearButtonStyle}
            >
              🧹 Clear Test Profiles
            </button>
            <button 
              onClick={handleClearAllProfiles}
              disabled={isLoading || profiles.length === 0}
              style={dangerButtonStyle}
            >
              ⚠️ Clear All Profiles
            </button>
          </div>
          <span style={hintStyle}>Remove profiles (be careful with "Clear All")</span>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          Processing... (This may take several minutes for large numbers)
        </div>
      )}

      {/* Performance Info */}
      <div style={infoStyle}>
        <p style={infoTextStyle}>
          <strong>Tile Behavior:</strong> Tiles automatically resize to fit the screen. 
          With more profiles, tiles become smaller. No scrollbars - everything fits perfectly!
        </p>
        <p style={infoTextStyle}>
          <strong>Current Tile Count:</strong> {profiles.length.toLocaleString()} | 
          <strong> Recommended Tests:</strong> Try 100, 1,000, 10,000, or even 100,000 profiles to see extreme scaling!
        </p>
        <p style={warningTextStyle}>
          ⚠️ <strong>Warning:</strong> Creating 100,000+ profiles will take significant time and may impact browser performance. 
          Start with smaller numbers first!
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
  margin: '2rem 0',
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
  gap: '1rem',
  fontSize: '0.9rem'
};

const statItemStyle = {
  backgroundColor: '#34495e',
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  color: '#bdc3c7'
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
  width: '120px'
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
  flexShrink: 0
};

const clearButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#f39c12'
};

const dangerButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#e74c3c'
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
  borderLeft: '4px solid #3498db'
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
  justifyContent: 'center'
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
  borderLeft: '4px solid #27ae60'
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

// Add CSS animation for spinner
const spinnerStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject the styles
const styleSheet = document.createElement('style');
styleSheet.innerText = spinnerStyles;
document.head.appendChild(styleSheet);

export default TestPanel;