import { useAuth } from '../contexts/AuthContext';
import ExperienceCard from './ExperienceCard';
import { SORT_OPTIONS } from '../constants';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const LifeExperiencesTab = React.memo(() => {
  const { user, fetchExperiences } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef(null);
  const experienceRefs = useRef([]);

  // Load experiences once with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialExperiences = async () => {
      if (hasLoaded && experiences.length > 0) return;
      
      try {
        const result = await fetchExperiences(50);
        if (isMounted) {
          setExperiences(result.experiences || []);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error('Error loading experiences:', error);
        if (isMounted) {
          setExperiences([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    if (!hasLoaded) {
      loadInitialExperiences();
    }
    
    return () => {
      isMounted = false;
    };
  }, [fetchExperiences, hasLoaded, experiences.length]);

  // Sort experiences
  const sortedExperiences = useMemo(() => {
    if (!experiences || experiences.length === 0) return [];
    
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

  // Handle scroll to experience
  const scrollToExperience = useCallback((index) => {
    if (experienceRefs.current[index] && containerRef.current) {
      experienceRefs.current[index].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setCurrentIndex(index);
    }
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (sortedExperiences.length === 0) return;
      
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, sortedExperiences.length - 1);
        scrollToExperience(nextIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        scrollToExperience(prevIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, scrollToExperience, sortedExperiences.length]);

  // Handle wheel navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (sortedExperiences.length === 0) return;
      
      if (Math.abs(e.deltaY) > 50) { // Prevent too sensitive scrolling
        if (e.deltaY > 0) {
          // Scroll down
          const nextIndex = Math.min(currentIndex + 1, sortedExperiences.length - 1);
          if (nextIndex !== currentIndex) {
            e.preventDefault();
            scrollToExperience(nextIndex);
          }
        } else {
          // Scroll up
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (prevIndex !== currentIndex) {
            e.preventDefault();
            scrollToExperience(prevIndex);
          }
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentIndex, scrollToExperience, sortedExperiences.length]);

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
    <div style={fullScreenContainerStyle}>
      {/* Fixed Header */}
      <div style={fixedHeaderStyle}>
        <div style={headerContentStyle}>
          <div style={titleSectionStyle}>
            <h2 style={titleStyle}>🌟 Life Experiences</h2>
            <p style={subtitleStyle}>
              Scroll to explore stories. Press ↓ or Space to navigate.
            </p>
          </div>
          
          <div style={actionsSectionStyle}>
            {/* Sorting Controls */}
            <div style={sortContainerStyle}>
              <label style={sortLabelStyle}>Sort:</label>
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

            {/* Navigation Indicator */}
            {sortedExperiences.length > 0 && (
              <div style={navIndicatorStyle}>
                <span style={navTextStyle}>
                  {currentIndex + 1} / {sortedExperiences.length}
                </span>
                <div style={navButtonsStyle}>
                  <button 
                    onClick={() => scrollToExperience(Math.max(currentIndex - 1, 0))}
                    disabled={currentIndex === 0}
                    style={navButtonStyle}
                    title="Previous story"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => scrollToExperience(Math.min(currentIndex + 1, sortedExperiences.length - 1))}
                    disabled={currentIndex === sortedExperiences.length - 1}
                    style={navButtonStyle}
                    title="Next story"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen Scrollable Experiences */}
      <div 
        ref={containerRef}
        style={experiencesContainerStyle}
        className="experiences-container"
      >
        {sortedExperiences.length > 0 ? (
          sortedExperiences.map((experience, index) => (
            <div 
              key={`exp-${experience.id}`}
              ref={el => experienceRefs.current[index] = el}
              style={experienceSectionStyle}
              data-index={index}
            >
              <ExperienceCard 
                experience={experience}
                currentUserId={user?.uid}
                isFullScreen={true}
              />
              
              {/* Scroll hint for first experience */}
              {index === 0 && sortedExperiences.length > 1 && (
                <div style={scrollHintStyle}>
                  <div style={scrollHintIcon}>↓</div>
                  <div style={scrollHintText}>Scroll down for more stories</div>
                </div>
              )}
            </div>
          ))
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
    </div>
  );
});

const fullScreenContainerStyle = {
  position: 'fixed',
  top: '80px', // Header height
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: 'calc(100vh - 80px)',
  backgroundColor: '#0a1929', // Darker background for full-screen
  overflow: 'hidden',
  zIndex: 1,
};

const fixedHeaderStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(10, 25, 41, 0.95)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(52, 152, 219, 0.2)',
  zIndex: 1000,
  padding: '1rem 2rem',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const headerContentStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
};

const titleSectionStyle = {
  flex: 1,
  minWidth: '300px',
};

const titleStyle = {
  fontSize: '1.8rem',
  color: '#FFD700',
  margin: '0 0 0.25rem 0',
  fontWeight: '700',
};

const subtitleStyle = {
  fontSize: '0.9rem',
  color: '#bdc3c7',
  margin: 0,
  opacity: 0.8,
};

const actionsSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const sortContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: 'rgba(52, 73, 94, 0.7)',
  padding: '0.4rem 0.8rem',
  borderRadius: '20px',
  border: '1px solid #34495e',
  backdropFilter: 'blur(5px)',
};

const sortLabelStyle = {
  color: '#bdc3c7',
  fontSize: '0.85rem',
  fontWeight: '500',
  whiteSpace: 'nowrap',
};

const sortSelectStyle = {
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  color: '#ecf0f1',
  border: '1px solid #3498db',
  borderRadius: '15px',
  padding: '0.3rem 0.6rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '120px',
};

const shareExperienceButtonStyle = {
  backgroundColor: '#FFD700',
  color: '#2c3e50',
  border: 'none',
  padding: '0.6rem 1.2rem',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
};

const navIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  backgroundColor: 'rgba(52, 73, 94, 0.7)',
  padding: '0.4rem 1rem',
  borderRadius: '20px',
  border: '1px solid rgba(52, 152, 219, 0.3)',
};

const navTextStyle = {
  color: '#ecf0f1',
  fontSize: '0.9rem',
  fontWeight: '600',
  minWidth: '60px',
  textAlign: 'center',
};

const navButtonsStyle = {
  display: 'flex',
  gap: '0.25rem',
};

const navButtonStyle = {
  backgroundColor: 'rgba(52, 152, 219, 0.2)',
  color: '#ecf0f1',
  border: '1px solid rgba(52, 152, 219, 0.3)',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(52, 152, 219, 0.4)',
    transform: 'scale(1.1)',
  },
  '&:disabled': {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
};

const experiencesContainerStyle = {
  position: 'absolute',
  top: '70px', // Header height + padding
  left: 0,
  right: 0,
  bottom: 0,
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  scrollSnapType: 'y mandatory',
  WebkitOverflowScrolling: 'touch',
  padding: '0',
};

const experienceSectionStyle = {
  minHeight: 'calc(100vh - 150px)', // Full viewport minus header
  width: '100%',
  scrollSnapAlign: 'start',
  scrollSnapStop: 'always',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '2rem',
  position: 'relative',
  borderBottom: '1px solid rgba(52, 73, 94, 0.3)',
};

const scrollHintStyle = {
  position: 'absolute',
  bottom: '2rem',
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  color: 'rgba(52, 152, 219, 0.7)',
  animation: 'bounce 2s infinite',
  zIndex: 10,
};

const scrollHintIcon = {
  fontSize: '2rem',
  marginBottom: '0.5rem',
};

const scrollHintText = {
  fontSize: '0.9rem',
  fontWeight: '500',
  backgroundColor: 'rgba(10, 25, 41, 0.8)',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  border: '1px solid rgba(52, 152, 219, 0.3)',
};

const loadingContainerStyle = {
  position: 'fixed',
  top: '80px',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(10, 25, 41, 0.95)',
  backdropFilter: 'blur(10px)',
  zIndex: 1000,
  padding: '2rem',
  textAlign: 'center',
  gap: '1.5rem',
};

const spinnerStyle = {
  width: '60px',
  height: '60px',
  border: '5px solid rgba(52, 152, 219, 0.2)',
  borderTop: '5px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

// Also need these styles that were referenced but might be missing:
const emptyIconStyle = {
  fontSize: '5rem',
  marginBottom: '1.5rem',
  opacity: 0.6,
  animation: 'pulse 2s infinite',
};

const emptyTitleStyle = {
  fontSize: '2.2rem',
  color: '#FFD700',
  margin: '0 0 1rem 0',
  fontWeight: '700',
};

const emptyTextStyle = {
  fontSize: '1.2rem',
  color: '#bdc3c7',
  margin: '0 0 2rem 0',
  maxWidth: '500px',
  lineHeight: '1.6',
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
    backgroundColor: '#229954',
  },
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
  maxWidth: '400px',
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
    transform: 'translateY(-2px)',
  },
};

// ... (keep all other styles from previous version, just updating container styles)

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'calc(100vh - 150px)',
  textAlign: 'center',
  padding: '3rem 2rem',
  backgroundColor: 'rgba(44, 62, 80, 0.5)',
  borderRadius: '20px',
  border: '2px dashed #34495e',
  margin: '2rem auto',
  maxWidth: '600px',
  animation: 'fadeIn 0.5s ease',
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

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-10px); }
  60% { transform: translateX(-50%) translateY(-5px); }
}

/* Hide scrollbar but keep functionality */
.experiences-container::-webkit-scrollbar {
  display: none;
}

.experiences-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
`;
document.head.appendChild(styleSheet);

LifeExperiencesTab.displayName = 'LifeExperiencesTab';

export default LifeExperiencesTab;