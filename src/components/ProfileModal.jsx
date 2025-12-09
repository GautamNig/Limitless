import { useEffect } from 'react';

const ProfileModal = ({ profile, isOpen, onClose }) => {
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

  if (!isOpen || !profile) return null;

    return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={modalHeaderLeftStyle}>
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              style={modalAvatarStyle}
            />
            <div>
              <h2 style={modalNameStyle}>{profile.displayName}</h2>
              {profile.location && (
                <p style={modalLocationStyle}>📍 {profile.location}</p>
              )}
              <p style={modalEmailStyle}>{profile.email}</p>
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={websiteLinkStyle}
                >
                  🔗 {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} style={closeModalButtonStyle}>
            ✕
          </button>
        </div>

        <div style={modalContentStyle}>
        {/* Thought of the Day Section */}
{profile.thoughtOfTheDay && (
  <div style={sectionStyle}>
    <h3 style={sectionTitleStyle}>💭 Thought of the Day</h3>
    <p style={thoughtStyle}>{profile.thoughtOfTheDay}</p>
  </div>
)}
          {/* Details Grid */}
          <div style={detailsGridStyle}>
            {/* Interests */}
            {profile.interests && (
              <div style={detailCardStyle}>
                <h4 style={detailTitleStyle}>🎯 Interests</h4>
                <div style={tagsContainerStyle}>
                  {profile.interests.split(',').map((interest, idx) => (
                    <span key={idx} style={tagStyle}>
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Additional Info */}
          <div style={additionalInfoStyle}>
            {/* Member Since */}
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>⭐ Member Since:</span>
              <span style={infoValueStyle}>
                {profile.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Recently'}
              </span>
            </div>

            {/* Last Updated */}
            {profile.updatedAt && (
              <div style={infoItemStyle}>
                <span style={infoLabelStyle}>🔄 Last Updated:</span>
                <span style={infoValueStyle}>
                  {new Date(profile.updatedAt.seconds * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Test Profile Badge */}
          {profile.isTest && (
            <div style={testProfileBadgeStyle}>
              <span style={testBadgeIcon}>🧪</span>
              <span>Test Profile</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const tagsContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '8px'
};

const tagStyle = {
  backgroundColor: 'rgba(52, 152, 219, 0.2)',
  color: '#3498db',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: '500'
};

const additionalInfoStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: 'rgba(52, 73, 94, 0.2)',
  borderRadius: '8px',
  border: '1px solid rgba(52, 73, 94, 0.5)'
};

const infoItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid rgba(52, 73, 94, 0.3)'
};

const infoLabelStyle = {
  color: '#bdc3c7',
  fontSize: '14px',
  fontWeight: '500'
};

const infoValueStyle = {
  color: '#ecf0f1',
  fontSize: '14px',
  fontWeight: '600'
};

const testProfileBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '1rem',
  padding: '8px 12px',
  backgroundColor: 'rgba(243, 156, 18, 0.2)',
  border: '1px solid rgba(243, 156, 18, 0.3)',
  borderRadius: '6px',
  color: '#f39c12',
  fontSize: '14px',
  fontWeight: '500'
};

const testBadgeIcon = {
  fontSize: '16px'
};

// Styles
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
  zIndex: 10000,
  padding: '1rem'
};

const modalStyle = {
  backgroundColor: '#2c3e50',
  border: '1px solid #34495e',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  animation: 'modalFadeIn 0.3s ease'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '2rem 2rem 1.5rem 2rem',
  borderBottom: '1px solid #34495e',
  backgroundColor: '#1a252f'
};

const modalHeaderLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  flex: 1
};

const modalAvatarStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '4px solid #3498db'
};

const modalNameStyle = {
  margin: '0 0 0.5rem 0',
  fontSize: '1.8rem',
  color: '#ecf0f1',
  fontWeight: '700'
};

const modalLocationStyle = {
  margin: '0 0 0.25rem 0',
  fontSize: '1rem',
  color: '#bdc3c7'
};

const modalEmailStyle = {
  margin: 0,
  fontSize: '0.9rem',
  color: '#95a5a6'
};

const closeModalButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#95a5a6',
  fontSize: '1.5rem',
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: '4px',
  marginLeft: '1rem'
};

const modalContentStyle = {
  padding: '2rem',
  overflowY: 'auto',
  maxHeight: 'calc(90vh - 180px)'
};

const sectionStyle = {
  marginBottom: '2rem'
};

const sectionTitleStyle = {
  margin: '0 0 1rem 0',
  fontSize: '1.2rem',
  color: '#3498db',
  fontWeight: '600'
};

const thoughtStyle = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: '1.6',
  color: '#bdc3c7'
};

const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const detailCardStyle = {
  backgroundColor: '#34495e',
  padding: '1.25rem',
  borderRadius: '10px',
  border: '1px solid #2c3e50'
};

const detailTitleStyle = {
  margin: '0 0 0.75rem 0',
  fontSize: '1rem',
  color: '#3498db',
  fontWeight: '600'
};

const detailContentStyle = {
  margin: 0,
  fontSize: '0.95rem',
  lineHeight: '1.5',
  color: '#ecf0f1'
};

const websiteLinkStyle = {
  color: '#3498db',
  fontSize: '1rem',
  textDecoration: 'none',
  wordBreak: 'break-all'
};

const metaInfoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '1.5rem',
  borderTop: '1px solid #34495e',
  color: '#95a5a6',
  fontSize: '0.9rem'
};

const testBadgeStyle = {
  backgroundColor: '#f39c12',
  color: '#2c3e50',
  padding: '0.25rem 0.75rem',
  borderRadius: '12px',
  fontSize: '0.8rem',
  fontWeight: '600'
};

// Add animation
const styleSheet = document.createElement('style');
styleSheet.innerText = `
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

@keyframes modalFadeOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
}
`;
document.head.appendChild(styleSheet);

export default ProfileModal;