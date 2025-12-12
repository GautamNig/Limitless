import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExperienceCard from './ExperienceCard';
import { SORT_OPTIONS } from '../constants';

const LifeExperiencesTab = React.memo(() => {
  const { user, fetchExperiences } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef(null);
  const experienceRefs = useRef([]);

  // Track which experience is currently being interacted with
  const [activeExperienceId, setActiveExperienceId] = useState(null);

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
          // Set first experience as active
          if (result.experiences?.[0]) {
            setActiveExperienceId(result.experiences[0].id);
          }
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
      setIsScrolling(true);
      experienceRefs.current[index].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setCurrentIndex(index);
      
      // Set active experience
      if (sortedExperiences[index]) {
        setActiveExperienceId(sortedExperiences[index].id);
      }
      
      // Reset scrolling flag after animation
      setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    }
  }, [sortedExperiences]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (sortedExperiences.length === 0 || isScrolling) return;
      
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
  }, [currentIndex, scrollToExperience, sortedExperiences.length, isScrolling]);

  // Handle wheel navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (sortedExperiences.length === 0 || isScrolling || !containerRef.current) return;
      
      // Get the current scroll position
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      
      // Check if user is trying to scroll within the current experience
      const currentExperience = experienceRefs.current[currentIndex];
      if (currentExperience) {
        const expRect = currentExperience.getBoundingClientRect();
        const expTop = expRect.top;
        const expHeight = expRect.height;
        
        // If the experience is taller than the viewport (has comments), allow internal scrolling
        const canScrollInternally = expHeight > containerHeight;
        
        if (canScrollInternally) {
          // Calculate if we're at the bottom or top of the current experience
          const expBottomRelative = expTop + expHeight - containerHeight;
          
          // If scrolling down and not at bottom of current experience
          if (e.deltaY > 0 && expTop > -100) {
            // Allow normal scrolling within the experience
            return;
          }
          
          // If scrolling up and not at top of current experience
          if (e.deltaY < 0 && expBottomRelative > 100) {
            // Allow normal scrolling within the experience
            return;
          }
        }
      }
      
      // Only navigate between experiences if we're at the edges
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          // Scroll down to next experience
          const nextIndex = Math.min(currentIndex + 1, sortedExperiences.length - 1);
          if (nextIndex !== currentIndex) {
            e.preventDefault();
            scrollToExperience(nextIndex);
          }
        } else {
          // Scroll up to previous experience
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
  }, [currentIndex, scrollToExperience, sortedExperiences.length, isScrolling]);

  // Update current index based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isScrolling) return;
      
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      
      // Find which experience is currently in view
      for (let i = 0; i < sortedExperiences.length; i++) {
        const experienceEl = experienceRefs.current[i];
        if (experienceEl) {
          const expRect = experienceEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Check if this experience is mostly in view
          if (expRect.top <= containerRect.top + containerHeight * 0.4 && 
              expRect.bottom >= containerRect.top + containerHeight * 0.6) {
            if (i !== currentIndex) {
              setCurrentIndex(i);
              setActiveExperienceId(sortedExperiences[i].id);
            }
            break;
          }
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentIndex, sortedExperiences, isScrolling]);

  const handleShareClick = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('showSignInPrompt'));
      return;
    }
    window.dispatchEvent(new CustomEvent('showCreateProfile', { 
      detail: { mode: 'edit' } 
    }));
  };

  // Function to handle when user wants to scroll within an experience
  const handleExperienceInteraction = useCallback((experienceId) => {
    setActiveExperienceId(experienceId);
  }, []);

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
      {/* Fixed Header - More Compact */}
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
              data-experience-id={experience.id}
              className={activeExperienceId === experience.id ? 'active-experience' : ''}
            >
              <ExperienceCard 
                experience={experience}
                currentUserId={user?.uid}
                isFullScreen={true}
                onInteraction={() => handleExperienceInteraction(experience.id)}
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

// ============= UPDATED STYLES FOR BETTER ZOOM/SPACING =============

const fullScreenContainerStyle = {
  position: 'fixed',
  top: '80px', // Header height
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: 'calc(100vh - 80px)',
  backgroundColor: '#0a1929',
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
  padding: '0.8rem 1.5rem', // Reduced padding
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const headerContentStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.5rem', // Reduced gap
  flexWrap: 'wrap',
};

const titleSectionStyle = {
  flex: 1,
  minWidth: '250px', // Reduced min-width
};

const titleStyle = {
  fontSize: '1.6rem', // Reduced from 1.8rem
  color: '#FFD700',
  margin: '0 0 0.2rem 0',
  fontWeight: '700',
};

const subtitleStyle = {
  fontSize: '0.85rem', // Reduced from 0.9rem
  color: '#bdc3c7',
  margin: 0,
  opacity: 0.8,
};

const actionsSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem', // Reduced from 1.5rem
  flexWrap: 'wrap',
};

const sortContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem', // Reduced gap
  backgroundColor: 'rgba(52, 73, 94, 0.7)',
  padding: '0.3rem 0.6rem', // Reduced padding
  borderRadius: '18px', // Slightly smaller
  border: '1px solid #34495e',
  backdropFilter: 'blur(5px)',
};

const sortLabelStyle = {
  color: '#bdc3c7',
  fontSize: '0.8rem', // Reduced
  fontWeight: '500',
  whiteSpace: 'nowrap',
};

const sortSelectStyle = {
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  color: '#ecf0f1',
  border: '1px solid #3498db',
  borderRadius: '12px', // Smaller
  padding: '0.25rem 0.5rem', // Reduced padding
  fontSize: '0.8rem', // Reduced
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '110px', // Slightly smaller
};

const shareExperienceButtonStyle = {
  backgroundColor: '#FFD700',
  color: '#2c3e50',
  border: 'none',
  padding: '0.5rem 1rem', // Reduced padding
  borderRadius: '22px', // Slightly smaller
  cursor: 'pointer',
  fontSize: '0.85rem', // Reduced
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem', // Reduced gap
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
};

const navIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem', // Reduced
  backgroundColor: 'rgba(52, 73, 94, 0.7)',
  padding: '0.3rem 0.8rem', // Reduced padding
  borderRadius: '18px', // Smaller
  border: '1px solid rgba(52, 152, 219, 0.3)',
};

const navTextStyle = {
  color: '#ecf0f1',
  fontSize: '0.85rem', // Reduced
  fontWeight: '600',
  minWidth: '55px', // Reduced
  textAlign: 'center',
};

const navButtonsStyle = {
  display: 'flex',
  gap: '0.2rem', // Reduced
};

const navButtonStyle = {
  backgroundColor: 'rgba(52, 152, 219, 0.2)',
  color: '#ecf0f1',
  border: '1px solid rgba(52, 152, 219, 0.3)',
  width: '26px', // Slightly smaller
  height: '26px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px', // Slightly smaller
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
  top: '60px', // Reduced from 70px (header is more compact)
  left: 0,
  right: 0,
  bottom: 0,
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  WebkitOverflowScrolling: 'touch',
  padding: '0',
  scrollSnapType: 'y proximity',
};

const experienceSectionStyle = {
  minHeight: 'calc(100vh - 140px)', // Reduced from 150px
  width: '100%',
  scrollSnapAlign: 'start',
  scrollSnapStop: 'normal',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '1.5rem 2rem', // Reduced top/bottom padding
  position: 'relative',
  borderBottom: '1px solid rgba(52, 73, 94, 0.3)',
};

const scrollHintStyle = {
  position: 'absolute',
  bottom: '1.5rem', // Reduced from 2rem
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  color: 'rgba(52, 152, 219, 0.7)',
  animation: 'bounce 2s infinite',
  zIndex: 10,
};

const scrollHintIcon = {
  fontSize: '1.8rem', // Reduced from 2rem
  marginBottom: '0.4rem', // Reduced
};

const scrollHintText = {
  fontSize: '0.85rem', // Reduced
  fontWeight: '500',
  backgroundColor: 'rgba(10, 25, 41, 0.8)',
  padding: '0.4rem 0.8rem', // Reduced
  borderRadius: '18px', // Smaller
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
  width: '50px', // Slightly smaller
  height: '50px',
  border: '4px solid rgba(52, 152, 219, 0.2)',
  borderTop: '4px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const emptyIconStyle = {
  fontSize: '4rem', // Reduced from 5rem
  marginBottom: '1.2rem', // Reduced
  opacity: 0.6,
  animation: 'pulse 2s infinite',
};

const emptyTitleStyle = {
  fontSize: '1.8rem', // Reduced from 2.2rem
  color: '#FFD700',
  margin: '0 0 0.8rem 0', // Reduced
  fontWeight: '700',
};

const emptyTextStyle = {
  fontSize: '1rem', // Reduced from 1.2rem
  color: '#bdc3c7',
  margin: '0 0 1.5rem 0', // Reduced
  maxWidth: '500px',
  lineHeight: '1.5', // Slightly tighter
};

const shareButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem', // Reduced
  borderRadius: '22px', // Slightly smaller
  cursor: 'pointer',
  fontSize: '1rem', // Reduced
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem', // Reduced
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
  gap: '0.8rem', // Reduced
  padding: '1.2rem', // Reduced
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  borderRadius: '12px',
  border: '1px solid rgba(52, 152, 219, 0.3)',
  maxWidth: '380px', // Slightly smaller
};

const signInButtonStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  padding: '0.6rem 1.2rem', // Reduced
  borderRadius: '22px', // Smaller
  cursor: 'pointer',
  fontSize: '0.9rem', // Reduced
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem', // Reduced
  '&:hover': {
    backgroundColor: '#2980b9',
    transform: 'translateY(-2px)',
  },
};

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'calc(100vh - 140px)', // Adjusted
  textAlign: 'center',
  padding: '2rem 1.5rem', // Reduced
  backgroundColor: 'rgba(44, 62, 80, 0.5)',
  borderRadius: '18px', // Smaller
  border: '2px dashed #34495e',
  margin: '1.5rem auto', // Reduced
  maxWidth: '550px', // Slightly smaller
  animation: 'fadeIn 0.5s ease',
};

// Add animations and CSS for better scrolling
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-8px); }
  60% { transform: translateX(-50%) translateY(-4px); }
}

/* Hide scrollbar but keep functionality */
.experiences-container::-webkit-scrollbar {
  display: none;
}

.experiences-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Active experience styling */
.active-experience {
  scroll-snap-align: start;
}

/* Better scroll snapping for experiences with content */
.experiences-container {
  scroll-snap-type: y proximity;
}

.experience-section {
  scroll-snap-stop: normal;
}

/* Make ExperienceCard content more compact */
.experience-card-compact {
  transform: scale(0.95);
  transform-origin: top center;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Adjust ExperienceCard styles */
.experience-card {
  font-size: 0.9rem;
  line-height: 1.4;
}

.experience-card .header {
  padding: 0.8rem 1rem;
}

.experience-card .content {
  padding: 0.8rem 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.experience-card .comments {
  max-height: 400px;
  overflow-y: auto;
}
`;
document.head.appendChild(styleSheet);

LifeExperiencesTab.displayName = 'LifeExperiencesTab';

export default LifeExperiencesTab;