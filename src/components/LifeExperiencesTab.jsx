import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExperienceCard from './ExperienceCard';
import { SORT_OPTIONS } from '../constants';

const LifeExperiencesTab = React.memo(() => {
  const { user, fetchExperiences } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(false); // Start as false
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Infinite scroll states
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const containerRef = useRef(null);
  const experienceRefs = useRef([]);

  // Track which experience is currently being interacted with
  const [activeExperienceId, setActiveExperienceId] = useState(null);

  // Load experiences with infinite scroll
  const loadInitialExperiences = useCallback(async () => {
  console.log('🔄 loadInitialExperiences called');
  
  setLoading(true);
  try {
    console.log('📡 Fetching experiences with sort:', sortBy);
    const result = await fetchExperiences(20, null, sortBy);
    
    console.log('✅ Fetch successful, got:', result.experiences?.length || 0, 'experiences');
    setExperiences(result.experiences || []);
    setLastDoc(result.lastDoc);
    setHasMore(result.hasMore);
    setHasLoaded(true);
    
    // Set first experience as active
    if (result.experiences?.[0]) {
      setActiveExperienceId(result.experiences[0].id);
    }
    
  } catch (error) {
    console.error('❌ Error loading experiences:', error);
    setExperiences([]);
    setHasLoaded(true);
  } finally {
    console.log('🏁 Setting loading to false');
    setLoading(false);
  }
}, [fetchExperiences, sortBy]);

  // Load more experiences for infinite scroll
  const loadMoreExperiences = useCallback(async () => {
    if (!hasMore || isFetchingMore || !lastDoc) return;
    
    setIsFetchingMore(true);
    try {
      console.log('🔄 Loading more experiences...');
      const result = await fetchExperiences(20, lastDoc, sortBy);
      
      setExperiences(prev => [...prev, ...result.experiences]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      
      console.log(`✅ Added ${result.experiences.length} more experiences`);
      
    } catch (error) {
      console.error('Error loading more experiences:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [fetchExperiences, hasMore, isFetchingMore, lastDoc, sortBy]);

  // Initial load on mount
  useEffect(() => {
    console.log('🚀 Component mounted, starting initial load');
    if (!hasLoaded && !loading) {
      loadInitialExperiences();
    }
  }, []); // Run only once on mount

  // Reset and reload when sort changes
useEffect(() => {
  console.log('🔄 Sort changed to:', sortBy, '- Reloading...');
  setExperiences([]);
  setLastDoc(null);
  setHasMore(true);
  setHasLoaded(false);
  setCurrentIndex(0);
  
  // Load directly
  loadInitialExperiences();
}, [sortBy]);


  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isFetchingMore || !hasMore || loading) return;
      
      const container = containerRef.current;
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      
      // Load more when 300px from bottom
      if (scrollBottom < 300) {
        loadMoreExperiences();
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isFetchingMore, hasMore, loadMoreExperiences, loading]);

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
      if (experiences[index]) {
        setActiveExperienceId(experiences[index].id);
      }
      
      // Reset scrolling flag after animation
      setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    }
  }, [experiences]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputFocused = 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.isContentEditable;
      
      if (isInputFocused) return;
      
      if (experiences.length === 0 || isScrolling) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, experiences.length - 1);
        scrollToExperience(nextIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        scrollToExperience(prevIndex);
      } else if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, experiences.length - 1);
        scrollToExperience(nextIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, scrollToExperience, experiences.length, isScrolling]);

  // Handle wheel navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (experiences.length === 0 || isScrolling || !containerRef.current) return;
      
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      
      const currentExperience = experienceRefs.current[currentIndex];
      if (currentExperience) {
        const expRect = currentExperience.getBoundingClientRect();
        const expTop = expRect.top;
        const expHeight = expRect.height;
        
        const canScrollInternally = expHeight > containerHeight;
        
        if (canScrollInternally) {
          const expBottomRelative = expTop + expHeight - containerHeight;
          
          if (e.deltaY > 0 && expTop > -100) return;
          if (e.deltaY < 0 && expBottomRelative > 100) return;
        }
      }
      
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          const nextIndex = Math.min(currentIndex + 1, experiences.length - 1);
          if (nextIndex !== currentIndex) {
            e.preventDefault();
            scrollToExperience(nextIndex);
            
            // Load more if we're near the end
            if (nextIndex >= experiences.length - 5 && hasMore && !isFetchingMore) {
              loadMoreExperiences();
            }
          }
        } else {
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
  }, [currentIndex, scrollToExperience, experiences.length, isScrolling, hasMore, isFetchingMore, loadMoreExperiences]);

  // Update current index based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isScrolling) return;
      
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      
      for (let i = 0; i < experiences.length; i++) {
        const experienceEl = experienceRefs.current[i];
        if (experienceEl) {
          const expRect = experienceEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          if (expRect.top <= containerRect.top + containerHeight * 0.4 && 
              expRect.bottom >= containerRect.top + containerHeight * 0.6) {
            if (i !== currentIndex) {
              setCurrentIndex(i);
              setActiveExperienceId(experiences[i].id);
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
  }, [currentIndex, experiences, isScrolling]);

  // Handle share click
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

  // Simple client-side sorting for the loaded batch (optional, since database sorts)
  const displayedExperiences = useMemo(() => {
    return experiences; // Already sorted by database
  }, [experiences]);

  console.log('📊 LifeExperiencesTab state:', {
    loading,
    hasLoaded,
    experiencesCount: experiences.length,
    sortBy,
    hasMore
  });

  return (
    <div style={fullScreenContainerStyle}>
      {/* Fixed Header */}
      <div style={fixedHeaderStyle}>
        <div style={headerContentStyle}>
          <div style={titleSectionStyle}>
            <h2 style={titleStyle}>🌟 Life Experiences</h2>
            <p style={subtitleStyle}>
              Scroll to explore stories. Press ↓ or Space to navigate.
              {hasMore && ` (Loaded ${experiences.length}, more available)`}
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
            {displayedExperiences.length > 0 && (
              <div style={navIndicatorStyle}>
                <span style={navTextStyle}>
                  {currentIndex + 1} / {displayedExperiences.length}
                  {hasMore && '+'}
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
                    onClick={() => {
                      const nextIndex = Math.min(currentIndex + 1, displayedExperiences.length - 1);
                      scrollToExperience(nextIndex);
                      // Load more if near end
                      if (nextIndex >= displayedExperiences.length - 3 && hasMore && !isFetchingMore) {
                        loadMoreExperiences();
                      }
                    }}
                    disabled={currentIndex === displayedExperiences.length - 1 && !hasMore}
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
        {displayedExperiences.length > 0 ? (
          <>
            {displayedExperiences.map((experience, index) => (
              <div 
                key={`exp-${experience.id}-${index}`}
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
                {index === 0 && displayedExperiences.length > 1 && (
                  <div style={scrollHintStyle}>
                    <div style={scrollHintIcon}>↓</div>
                    <div style={scrollHintText}>Scroll down for more stories</div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading more indicator */}
            {isFetchingMore && (
              <div style={loadingMoreStyle}>
                <div style={smallSpinnerStyle}></div>
                <div>Loading more stories...</div>
              </div>
            )}
            
            {/* End of list message */}
            {!hasMore && displayedExperiences.length > 0 && (
              <div style={endOfListStyle}>
                <div style={endOfListIcon}>🌟</div>
                <div style={endOfListText}>You've reached the end of the stories</div>
                <div style={endOfListSubtext}>
                  {displayedExperiences.length} stories loaded
                  {user && !displayedExperiences.some(exp => exp.userId === user.uid) && 
                    " (Your story might be in a different sort order)"}
                </div>
              </div>
            )}
          </>
        ) : (loading ? (
          // Show loading spinner when loading
          <div style={loadingContainerStyle}>
            <div style={spinnerStyle}></div>
            <p>Loading life experiences...</p>
          </div>
        ) : (
          // Show empty state when not loading
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
        ))}
      </div>
    </div>
  );
});

// ============= STYLES =============

const fullScreenContainerStyle = {
  position: 'fixed',
  top: '80px',
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
  padding: '0.8rem 1.5rem',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const headerContentStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.5rem',
  flexWrap: 'wrap',
};

const titleSectionStyle = {
  flex: 1,
  minWidth: '250px',
};

const titleStyle = {
  fontSize: '1.6rem',
  color: '#FFD700',
  margin: '0 0 0.2rem 0',
  fontWeight: '700',
};

const subtitleStyle = {
  fontSize: '0.85rem',
  color: '#bdc3c7',
  margin: 0,
  opacity: 0.8,
};

const actionsSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
};

const sortContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  backgroundColor: 'rgba(52, 73, 94, 0.7)',
  padding: '0.3rem 0.6rem',
  borderRadius: '18px',
  border: '1px solid #34495e',
  backdropFilter: 'blur(5px)',
};

const sortLabelStyle = {
  color: '#bdc3c7',
  fontSize: '0.8rem',
  fontWeight: '500',
  whiteSpace: 'nowrap',
};

const sortSelectStyle = {
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  color: '#ecf0f1',
  border: '1px solid #3498db',
  borderRadius: '12px',
  padding: '0.25rem 0.5rem',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '110px',
};

const shareExperienceButtonStyle = {
  backgroundColor: '#FFD700',
  color: '#2c3e50',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '22px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
};

const navIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  backgroundColor: 'rgba(52, 73, 94, 0.7)',
  padding: '0.3rem 0.8rem',
  borderRadius: '18px',
  border: '1px solid rgba(52, 152, 219, 0.3)',
};

const navTextStyle = {
  color: '#ecf0f1',
  fontSize: '0.85rem',
  fontWeight: '600',
  minWidth: '55px',
  textAlign: 'center',
};

const navButtonsStyle = {
  display: 'flex',
  gap: '0.2rem',
};

const navButtonStyle = {
  backgroundColor: 'rgba(52, 152, 219, 0.2)',
  color: '#ecf0f1',
  border: '1px solid rgba(52, 152, 219, 0.3)',
  width: '26px',
  height: '26px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
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
  top: '60px',
  left: 0,
  right: 0,
  bottom: 0,
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  WebkitOverflowScrolling: 'touch',
  padding: '0',
};

const experienceSectionStyle = {
  minHeight: 'calc(100vh - 140px)',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '1.5rem 2rem',
  position: 'relative',
  borderBottom: '1px solid rgba(52, 73, 94, 0.3)',
};

const scrollHintStyle = {
  position: 'absolute',
  bottom: '1.5rem',
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  color: 'rgba(52, 152, 219, 0.7)',
  animation: 'bounce 2s infinite',
  zIndex: 10,
};

const scrollHintIcon = {
  fontSize: '1.8rem',
  marginBottom: '0.4rem',
};

const scrollHintText = {
  fontSize: '0.85rem',
  fontWeight: '500',
  backgroundColor: 'rgba(10, 25, 41, 0.8)',
  padding: '0.4rem 0.8rem',
  borderRadius: '18px',
  border: '1px solid rgba(52, 152, 219, 0.3)',
};

const loadingMoreStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem',
  color: '#95a5a6',
  textAlign: 'center',
};

const smallSpinnerStyle = {
  width: '30px',
  height: '30px',
  border: '3px solid rgba(52, 152, 219, 0.2)',
  borderTop: '3px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '1rem',
};

const endOfListStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: '#95a5a6',
  backgroundColor: 'rgba(44, 62, 80, 0.3)',
  margin: '1rem',
  borderRadius: '12px',
  border: '2px dashed #34495e',
};

const endOfListIcon = {
  fontSize: '3rem',
  marginBottom: '1rem',
  opacity: 0.5,
};

const endOfListText = {
  fontSize: '1.2rem',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: '#bdc3c7',
};

const endOfListSubtext = {
  fontSize: '0.9rem',
  opacity: 0.7,
  maxWidth: '400px',
  margin: '0 auto',
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
  width: '50px',
  height: '50px',
  border: '4px solid rgba(52, 152, 219, 0.2)',
  borderTop: '4px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const emptyIconStyle = {
  fontSize: '4rem',
  marginBottom: '1.2rem',
  opacity: 0.6,
  animation: 'pulse 2s infinite',
};

const emptyTitleStyle = {
  fontSize: '1.8rem',
  color: '#FFD700',
  margin: '0 0 0.8rem 0',
  fontWeight: '700',
};

const emptyTextStyle = {
  fontSize: '1rem',
  color: '#bdc3c7',
  margin: '0 0 1.5rem 0',
  maxWidth: '500px',
  lineHeight: '1.5',
};

const shareButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '22px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
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
  gap: '0.8rem',
  padding: '1.2rem',
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  borderRadius: '12px',
  border: '1px solid rgba(52, 152, 219, 0.3)',
  maxWidth: '380px',
};

const signInButtonStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  padding: '0.6rem 1.2rem',
  borderRadius: '22px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
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
  height: 'calc(100vh - 140px)',
  textAlign: 'center',
  padding: '2rem 1.5rem',
  backgroundColor: 'rgba(44, 62, 80, 0.5)',
  borderRadius: '18px',
  border: '2px dashed #34495e',
  margin: '1.5rem auto',
  maxWidth: '550px',
  animation: 'fadeIn 0.5s ease',
};

// Add animations and CSS
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

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
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
  background: linear-gradient(to right, rgba(52, 152, 219, 0.05), transparent);
}

/* Smooth transitions */
.experience-section {
  transition: background-color 0.3s ease;
}
`;
document.head.appendChild(styleSheet);

LifeExperiencesTab.displayName = 'LifeExperiencesTab';

export default LifeExperiencesTab;
