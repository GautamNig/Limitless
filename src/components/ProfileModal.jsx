// File: ProfileModal.jsx (COMPLETE UPDATED VERSION)
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfileModal = ({ profile, isOpen, onClose }) => {
  const { user, likeThought, likeExperience } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
const [thoughtLikeLoading, setThoughtLikeLoading] = useState(false);
const [experienceLikeLoading, setExperienceLikeLoading] = useState(false);
  // Update local profile when prop changes
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  // Handle escape key
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

  // Handle thought like
  const handleLikeThought = async () => {
  if (!user || thoughtLikeLoading) return;
  
  setThoughtLikeLoading(true);
  try {
    const newLikeState = await likeThought(profile.id);
    
    // Update local state immediately for instant feedback
    setLocalProfile(prev => {
      const hasLiked = prev.thoughtLikers?.includes(user.uid);
      return {
        ...prev,
        thoughtLikers: hasLiked 
          ? prev.thoughtLikers.filter(id => id !== user.uid)
          : [...(prev.thoughtLikers || []), user.uid],
        thoughtLikes: hasLiked ? prev.thoughtLikes - 1 : (prev.thoughtLikes || 0) + 1
      };
    });
    
    console.log(`Thought ${newLikeState ? 'liked' : 'unliked'}`);
  } catch (error) {
    console.error('Failed to like thought:', error);
  } finally {
    setThoughtLikeLoading(false);
  }
};

  // Handle experience like
  // Modify the handleLikeExperience function:
const handleLikeExperience = async () => {
  if (!user || experienceLikeLoading) return;
  
  setExperienceLikeLoading(true);
  try {
    const newLikeState = await likeExperience(profile.id);
    
    // Update local state immediately
    setLocalProfile(prev => {
      const hasLiked = prev.experienceLikers?.includes(user.uid);
      return {
        ...prev,
        experienceLikers: hasLiked 
          ? prev.experienceLikers.filter(id => id !== user.uid)
          : [...(prev.experienceLikers || []), user.uid],
        experienceLikes: hasLiked ? prev.experienceLikes - 1 : (prev.experienceLikes || 0) + 1
      };
    });
    
    console.log(`Experience ${newLikeState ? 'liked' : 'unliked'}`);
  } catch (error) {
    console.error('Failed to like experience:', error);
  } finally {
    setExperienceLikeLoading(false);
  }
};

  // Check if current user has liked
  const hasLikedThought = user && localProfile?.thoughtLikers?.includes(user.uid);
  const hasLikedExperience = user && localProfile?.experienceLikers?.includes(user.uid);

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={sectionTitleStyle}>💭 Thought of the Day</h3>
                {user ? (
                  <LikeButton
                    onClick={handleLikeThought}
                    isLiked={hasLikedThought}
                    count={localProfile?.thoughtLikes || 0}
                    disabled={isLiking}
                    label={hasLikedThought ? "Unlike this thought" : "Like this thought"}
                    isLoading={thoughtLikeLoading}
                  />
                ) : (
                  <LoginPrompt />
                )}
              </div>
              <p style={thoughtStyle}>{profile.thoughtOfTheDay}</p>
            </div>
          )}

          {/* Share Life Experience Section */}
          {profile.shareLifeExperience && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={sectionTitleStyle}>🌟 Life Experience</h3>
                {user ? (
                  <LikeButton
                    onClick={handleLikeExperience}
                    isLiked={hasLikedExperience}
                    count={localProfile?.experienceLikes || 0}
                    disabled={isLiking}
                    label={hasLikedExperience ? "Unlike this experience" : "Like this experience"}
                    isLoading={experienceLikeLoading} 
                  />
                ) : (
                  <LoginPrompt />
                )}
              </div>
              <p style={experienceStyle}>{profile.shareLifeExperience}</p>
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

          {/* Simulated Profile Badge */}
          {profile.isSimulated && (
            <div style={simulatedBadgeStyle}>
              <span style={simBadgeIcon}>⚡</span>
              <span>Simulated Profile (in-memory only)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============= COMPONENT SUB-COMPONENTS =============

// Like Button Component
const LikeButton = ({ onClick, isLiked, count, disabled, label, isLoading }) => {
  const spinnerColor = isLiked ? '#2c3e50' : '#FFD700'; // Dark for liked, gold for unliked
  const spinnerBorderColor = isLiked ? 'rgba(44, 62, 80, 0.3)' : 'rgba(255, 215, 0, 0.3)';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        ...likeButtonStyle,
        backgroundColor: isLoading 
          ? (isLiked ? 'rgba(255, 215, 0, 0.3)' : 'rgba(52, 73, 94, 0.7)')
          : (isLiked ? '#FFD700' : 'rgba(52, 73, 94, 0.5)'),
        color: isLoading 
          ? (isLiked ? '#2c3e50' : '#bdc3c7')
          : (isLiked ? '#2c3e50' : '#ecf0f1'),
        border: isLoading 
          ? `2px solid ${isLiked ? 'rgba(255, 215, 0, 0.5)' : '#34495e'}`
          : (isLiked ? '2px solid #FFD700' : '2px solid #34495e'),
        minWidth: '80px',
        opacity: (disabled || isLoading) ? 0.8 : 1,
        cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
        position: 'relative'
      }}
      title={isLoading ? 'Processing...' : label}
    >
      {isLoading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${spinnerBorderColor}`,
            borderTop: `2px solid ${spinnerColor}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ 
            fontSize: '14px',
            color: isLiked ? '#2c3e50' : '#ecf0f1'
          }}>
            {isLiked ? 'Unliking...' : 'Liking...'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>
            {isLiked ? '❤️' : '🤍'}
          </span>
          {count > 0 && (
            <span style={{
              backgroundColor: isLiked ? 'rgba(44, 62, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {count}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

// Login Prompt Component
const LoginPrompt = () => (
  <div style={loginPromptStyle}>
    <span>🔒 Sign in to like content</span>
  </div>
);

// ============= STYLES =============

// Add this style with your existing styles:
const smallSpinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid #FFD700',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

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
  margin: 0,
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

const experienceStyle = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: '1.6',
  color: '#ecf0f1',
  backgroundColor: 'rgba(26, 37, 47, 0.7)',
  padding: '1.25rem',
  borderRadius: '10px',
  borderLeft: '4px solid #FFD700',
  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
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

const simulatedBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '1rem',
  padding: '8px 12px',
  backgroundColor: 'rgba(155, 89, 182, 0.2)',
  border: '1px solid rgba(155, 89, 182, 0.3)',
  borderRadius: '6px',
  color: '#9b59b6',
  fontSize: '14px',
  fontWeight: '500'
};

const simBadgeIcon = {
  fontSize: '16px'
};

const websiteLinkStyle = {
  color: '#3498db',
  fontSize: '1rem',
  textDecoration: 'none',
  wordBreak: 'break-all'
};

const likeButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  border: 'none',
  '&:hover:not(:disabled)': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const loginPromptStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  color: '#3498db',
  borderRadius: '25px',
  fontSize: '14px',
  fontWeight: '500',
  border: '1px solid rgba(52, 152, 219, 0.3)'
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

@keyframes likePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.liking {
  animation: likePulse 0.3s ease;
}
`;
document.head.appendChild(styleSheet);

export default ProfileModal;