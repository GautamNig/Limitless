
import React, { useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExperienceCard from './ExperienceCard';
import { SORT_OPTIONS } from '../constants';

const LifeExperiencesTab = memo(() => {
  const { user, fetchExperiences } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);

  // Load experiences once
  useEffect(() => {
    const loadInitialExperiences = async () => {
      try {
        const result = await fetchExperiences(50);
        setExperiences(result.experiences || []);
      } catch (error) {
        console.error('Error loading experiences:', error);
        setExperiences([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialExperiences();
  }, [fetchExperiences]);

  // Sort experiences - memoized to prevent re-sorting on every render
  const sortedExperiences = useMemo(() => {
    console.log('🔄 Sorting experiences (memoized)');
    return [...experiences].sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.MOST_LIKED:
          return (b.likeCount || 0) - (a.likeCount || 0);
        case SORT_OPTIONS.MOST_COMMENTED:
          return (b.commentCount || 0) - (a.commentCount || 0);
        case SORT_OPTIONS.NEWEST:
        default:
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
      }
    });
  }, [experiences, sortBy]);

  const handleShareClick = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('showSignInPrompt'));
      return;
    }
    window.dispatchEvent(new CustomEvent('showCreateProfile', { 
      detail: { mode: 'edit' } 
    }));
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading life experiences...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleSectionStyle}>
          <h2 style={titleStyle}>🌟 Life Experiences</h2>
          <p style={subtitleStyle}>
            Real stories from real people. Share your journey and connect with others.
          </p>
        </div>
        
        <div style={actionsSectionStyle}>
          {/* Sorting Controls */}
          <div style={sortContainerStyle}>
            <label style={sortLabelStyle}>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={sortSelectStyle}
              title="Sort experiences"
            >
              <option value={SORT_OPTIONS.NEWEST}>Newest</option>
              <option value={SORT_OPTIONS.MOST_LIKED}>Most Liked</option>
              <option value={SORT_OPTIONS.MOST_COMMENTED}>Most Discussed</option>
            </select>
          </div>
          
          {/* Share Button */}
          <button 
            onClick={handleShareClick}
            style={shareExperienceButtonStyle}
            title="Share your life experience"
          >
            ✨ Share Your Story
          </button>
        </div>
      </div>

      {/* Experiences Grid */}
      {sortedExperiences.length > 0 ? (
        <div style={experiencesGridStyle}>
          {sortedExperiences.map(experience => (
            <ExperienceCard 
              key={`exp-${experience.id}`}
              experience={experience}
              currentUserId={user?.uid}
            />
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>📖</div>
          <h3 style={emptyTitleStyle}>No Experiences Shared Yet</h3>
          <p style={emptyTextStyle}>
            Be the first to share your life experience and inspire others with your story.
          </p>
          {user ? (
            <button 
              onClick={handleShareClick}
              style={shareButtonStyle}
            >
              ✨ Share Your First Experience
            </button>
          ) : (
            <div style={signInPromptStyle}>
              <p>Sign in to share your life experience</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('showSignInPrompt'))}
                style={signInButtonStyle}
              >
                🔐 Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============= STYLES =============

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 80px)',
  backgroundColor: 'rgba(26, 37, 47, 0.95)',
  backdropFilter: 'blur(10px)',
  padding: '2rem',
  overflowY: 'auto',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1.5rem',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: 'rgba(26, 37, 47, 0.95)',
  padding: '1rem 0',
  backdropFilter: 'blur(5px)'
};

const titleSectionStyle = {
  flex: 1,
  minWidth: '300px'
};

const titleStyle = {
  fontSize: '2.5rem',
  color: '#FFD700',
  margin: '0 0 0.5rem 0',
  fontWeight: '700',
  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
};

const subtitleStyle = {
  fontSize: '1.1rem',
  color: '#bdc3c7',
  margin: 0,
  maxWidth: '600px',
  lineHeight: '1.5'
};

const actionsSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap'
};

const sortContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: 'rgba(52, 73, 94, 0.7)',
  padding: '0.5rem 1rem',
  borderRadius: '25px',
  border: '1px solid #34495e',
  backdropFilter: 'blur(5px)'
};

const sortLabelStyle = {
  color: '#bdc3c7',
  fontSize: '0.9rem',
  fontWeight: '500',
  whiteSpace: 'nowrap'
};

const sortSelectStyle = {
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  color: '#ecf0f1',
  border: '1px solid #3498db',
  borderRadius: '20px',
  padding: '0.4rem 0.8rem',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#2980b9',
    backgroundColor: 'rgba(41, 128, 185, 0.1)'
  },
  '&:focus': {
    outline: 'none',
    boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.3)'
  }
};

const shareExperienceButtonStyle = {
  backgroundColor: '#FFD700',
  color: '#2c3e50',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
    backgroundColor: '#FFC800'
  }
};

const experiencesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem',
  animation: 'fadeIn 0.5s ease',
  flex: 1
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 80px)',
  gap: '1.5rem',
  padding: '3rem'
};

const spinnerStyle = {
  width: '60px',
  height: '60px',
  border: '5px solid rgba(52, 152, 219, 0.2)',
  borderTop: '5px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  textAlign: 'center',
  padding: '3rem 2rem',
  backgroundColor: 'rgba(44, 62, 80, 0.5)',
  borderRadius: '20px',
  border: '2px dashed #34495e',
  margin: '2rem 0',
  animation: 'fadeIn 0.5s ease'
};

const emptyIconStyle = {
  fontSize: '5rem',
  marginBottom: '1.5rem',
  opacity: 0.6,
  animation: 'pulse 2s infinite'
};

const emptyTitleStyle = {
  fontSize: '2.2rem',
  color: '#FFD700',
  margin: '0 0 1rem 0',
  fontWeight: '700'
};

const emptyTextStyle = {
  fontSize: '1.2rem',
  color: '#bdc3c7',
  margin: '0 0 2rem 0',
  maxWidth: '500px',
  lineHeight: '1.6'
};

const shareButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '1rem 2rem',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '1.1rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(39, 174, 96, 0.4)',
    backgroundColor: '#229954'
  }
};

const signInPromptStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.5rem',
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  borderRadius: '12px',
  border: '1px solid rgba(52, 152, 219, 0.3)',
  maxWidth: '400px'
};

const signInButtonStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  '&:hover': {
    backgroundColor: '#2980b9',
    transform: 'translateY(-2px)'
  }
};

// Add animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.6; }
}
`;
document.head.appendChild(styleSheet);

LifeExperiencesTab.displayName = 'LifeExperiencesTab';

export default LifeExperiencesTab;
