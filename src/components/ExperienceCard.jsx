import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Comment from './Comment';

const ExperienceCard = memo(({ experience: initialExperience, currentUserId, isFullScreen = false }) => {
  const { user, addComment, fetchComments, likeComment: likeExperienceComment } = useAuth();
  
  // Local state
  const [experience, setExperience] = useState(initialExperience);
  const [showComments, setShowComments] = useState(isFullScreen); // Auto-show in full screen
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(initialExperience.likedBy?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(initialExperience.likeCount || 0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentsLastDoc, setCommentsLastDoc] = useState(null);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  
  // Use refs
  const mountedRef = useRef(true);
  const experienceRef = useRef(initialExperience);
  const showCommentsRef = useRef(showComments);
  const loadingRef = useRef(false);

  // Update refs
  useEffect(() => {
    experienceRef.current = initialExperience;
    setExperience(initialExperience);
    // Reset comments when experience changes
    setComments([]);
    setHasLoadedComments(false);
    setCommentsLastDoc(null);
  }, [initialExperience]);

  useEffect(() => {
    showCommentsRef.current = showComments;
  }, [showComments]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      loadingRef.current = false;
    };
  }, []);

  // Auto-load comments in full-screen mode - FIXED: Only load once
  useEffect(() => {
    if (isFullScreen && comments.length === 0 && !loadingComments && !hasLoadedComments) {
      loadComments(true);
    }
  }, [isFullScreen, comments.length, loadingComments, hasLoadedComments]);

  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }, []);
  
  const buildCommentTree = useCallback((comments) => {
    if (!comments || comments.length === 0) return [];
    
    const commentMap = new Map();
    const roots = [];
    
    // First pass: store all comments in map
    comments.forEach(comment => {
      commentMap.set(comment.id, { 
        ...comment, 
        replies: [],
        visited: false
      });
    });
    
    // Second pass: build tree
    comments.forEach(comment => {
      const commentNode = commentMap.get(comment.id);
      
      if (comment.parentCommentId) {
        const parentNode = commentMap.get(comment.parentCommentId);
        if (parentNode && !parentNode.replies.some(reply => reply.id === comment.id)) {
          parentNode.replies.push(commentNode);
          commentNode.visited = true;
        }
      } 
      else if (!commentNode.visited) {
        roots.push(commentNode);
        commentNode.visited = true;
      }
    });
    
    // Clean up visited flag
    roots.forEach(root => cleanVisitedFlag(root));
    
    return roots;
  }, []);

  const cleanVisitedFlag = (node) => {
    delete node.visited;
    if (node.replies) {
      node.replies.forEach(reply => cleanVisitedFlag(reply));
    }
  };

  const loadComments = useCallback(async (reset = false) => {
    if (!mountedRef.current || loadingRef.current) return;
    
    loadingRef.current = true;
    setLoadingComments(true);
    try {
      const result = await fetchComments(
        experienceRef.current.id, 
        10, 
        reset ? null : commentsLastDoc
      );
      
      console.log('Loaded comments:', result?.comments?.length || 0); // Debug log
      
      const commentsResult = result?.comments || result || [];
      
      if (reset) {
        setComments(commentsResult);
      } else {
        setComments(prev => [...(prev || []), ...commentsResult]);
      }
      
      setCommentsLastDoc(result?.lastDoc || null);
      setHasMoreComments(commentsResult.length === 10);
      setHasLoadedComments(true);
    } catch (error) {
      console.error('Error loading comments:', error);
      if (mountedRef.current) {
        setComments([]);
        setHasLoadedComments(true);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingComments(false);
        loadingRef.current = false;
      }
    }
  }, [fetchComments, commentsLastDoc]);

  // Load comments when showComments changes - FIXED: Only load if not already loaded
  useEffect(() => {
    if (showComments && comments.length === 0 && !loadingComments && !hasLoadedComments) {
      loadComments(true);
    }
  }, [showComments, comments.length, loadingComments, hasLoadedComments, loadComments]);

  const handleLike = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const newLikeState = await likeExperienceComment(experience.id, experience.id);
      setIsLiked(newLikeState);
      setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
      
      // Update experience
      setExperience(prev => ({
        ...prev,
        likeCount: newLikeState ? (prev.likeCount || 0) + 1 : Math.max(0, (prev.likeCount || 1) - 1)
      }));
    } catch (error) {
      console.error('Error liking experience:', error);
    }
  }, [currentUserId, isLiked, experience.id, likeExperienceComment]);

  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!currentUserId || !commentInput.trim()) return;
    
    setSubmitting(true);
    try {
      const newComment = await addComment(experience.id, commentInput);
      
      setCommentInput('');
      
      // Add to local state
      setComments(prev => [newComment, ...prev]);
      
      // Update experience comment count
      setExperience(prev => ({
        ...prev,
        commentCount: (prev.commentCount || 0) + 1
      }));
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [currentUserId, commentInput, addComment, experience.id]);

  const handleReply = useCallback(async (replyText, parentCommentId) => {
    try {
      const newReply = await addComment(experience.id, replyText, parentCommentId);
      
      setComments(prev => [newReply, ...prev]);
      
      setExperience(prev => ({
        ...prev,
        commentCount: (prev.commentCount || 0) + 1
      }));
      
      return newReply;
    } catch (error) {
      console.error('Error posting reply:', error);
      throw error;
    }
  }, [addComment, experience.id]);

  const toggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  const handleInputChange = useCallback((e) => {
    setCommentInput(e.target.value);
  }, []);

  const commentTree = comments && comments.length > 0 ? buildCommentTree(comments) : [];

  // Debug log to see what's happening
  console.log('ExperienceCard debug:', {
    experienceId: experience.id,
    showComments,
    isFullScreen,
    commentsCount: comments.length,
    commentTreeCount: commentTree.length,
    commentCount: experience.commentCount,
    hasLoadedComments,
    loadingComments
  });

  // Full screen styles
  const fullScreenCardStyle = isFullScreen ? {
    width: '100%',
    maxWidth: 'none',
    margin: '0',
    padding: '2rem',
    backgroundColor: 'rgba(10, 25, 41, 0.9)',
    border: '1px solid rgba(52, 152, 219, 0.2)',
    borderRadius: '0',
    minHeight: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column',
  } : {};

  return (
    <div style={{ ...cardStyle, ...fullScreenCardStyle }}>
      {/* Header Section */}
      <div style={headerStyle}>
        <div style={userInfoContainerStyle}>
          <img 
            src={experience.userPhotoURL} 
            alt={experience.userDisplayName}
            style={avatarStyle}
          />
          <div style={userInfoStyle}>
            <div style={userNameStyle}>{experience.userDisplayName}</div>
            <div style={dateStyle}>{formatDate(experience.createdAt)}</div>
          </div>
        </div>
        
        <button 
          onClick={handleLike}
          style={{
            ...headerLikeButtonStyle,
            color: isLiked ? '#e74c3c' : '#bdc3c7',
            backgroundColor: isLiked ? 'rgba(231, 76, 60, 0.1)' : 'transparent',
          }}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked ? '❤️' : '🤍'} 
          {likeCount > 0 && ` ${likeCount}`}
        </button>
      </div>

      {/* Content Section */}
      <div style={contentStyle}>
        <p style={experienceTextStyle}>{experience.content}</p>
      </div>

      {/* Action Bar */}
      <div style={actionBarStyle}>
        <button 
          onClick={handleLike}
          style={{
            ...actionButtonStyle,
            color: isLiked ? '#e74c3c' : '#bdc3c7',
          }}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked ? '❤️' : '🤍'} 
          {likeCount > 0 ? ` ${likeCount}` : ' Like'}
        </button>
        
        <button 
          onClick={toggleComments}
          style={{
            ...actionButtonStyle,
            backgroundColor: showComments ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
          }}
          title={showComments ? 'Hide comments' : 'Show comments'}
        >
          💬 {experience.commentCount || 0}
        </button>
      </div>

      {/* Comments Section */}
      {(showComments || isFullScreen) && (
        <div style={commentsSectionStyle}>
          {/* Comment Input */}
          {currentUserId ? (
            <form onSubmit={handleCommentSubmit} style={commentFormStyle}>
              <div style={commentInputHeaderStyle}>
                <img 
                  src={user?.photoURL} 
                  alt={user?.displayName}
                  style={commentUserAvatarStyle}
                />
                <div style={commentInputInfoStyle}>
                  <div style={commentInputUserName}>{user?.displayName}</div>
                </div>
              </div>
              
              <textarea
                value={commentInput}
                onChange={handleInputChange}
                placeholder="Share your thoughts on this story..."
                style={commentInputStyle}
                rows="3"
                maxLength="500"
                disabled={submitting}
              />
              
              <div style={commentSubmitRowStyle}>
                <div style={charCountStyle}>
                  {commentInput.length}/500 characters
                </div>
                <button 
                  type="submit" 
                  style={submitButtonStyle}
                  disabled={submitting || !commentInput.trim()}
                >
                  {submitting ? (
                    <>
                      <div style={smallSpinnerStyle}></div>
                      Posting...
                    </>
                  ) : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div style={loginPromptStyle}>
              <div style={{textAlign: 'center', flex: 1}}>
                <div style={loginPromptTitle}>Sign in to join the conversation</div>
                <div style={loginPromptText}>Share your thoughts and connect with others</div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('showSignInPrompt'))}
                style={{
                  ...signInButtonStyle,
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem'
                }}
              >
                🔐 Sign In
              </button>
            </div>
          )}

          {/* Comments List */}
          <div style={commentsListStyle}>
            {loadingComments && comments.length === 0 ? (
              <div style={loadingCommentsStyle}>
                <div style={smallSpinnerStyle}></div>
                <div>Loading comments...</div>
              </div>
            ) : commentTree.length > 0 ? (
              <>
                <div style={commentsHeaderStyle}>
                  <h4 style={commentsTitleStyle}>
                    💬 Comments ({experience.commentCount || 0})
                  </h4>
                  {hasMoreComments && (
                    <button 
                      onClick={() => loadComments(false)}
                      style={loadMoreButtonStyle}
                      disabled={loadingComments}
                    >
                      {loadingComments ? 'Loading...' : 'Load More'}
                    </button>
                  )}
                </div>
                
                {commentTree.map(rootComment => (
                  <Comment
                    key={rootComment.id}
                    comment={rootComment}
                    experienceId={experience.id}
                    depth={0}
                    replies={rootComment.replies || []}
                    onReply={handleReply}
                  />
                ))}
              </>
            ) : !loadingComments && (
              <div style={noCommentsStyle}>
                <div style={noCommentsIcon}>💬</div>
                <div style={noCommentsText}>No comments yet. Be the first to share your thoughts!</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show Comments toggle for non-full screen */}
      {!isFullScreen && !showComments && (
        <div style={showCommentsPromptStyle} onClick={toggleComments}>
          <span style={showCommentsIcon}>💬</span>
          <span style={showCommentsText}>
            {experience.commentCount > 0 
              ? `Show ${experience.commentCount} ${experience.commentCount === 1 ? 'comment' : 'comments'}`
              : 'View experience & add comments'
            }
          </span>
          <span style={showCommentsArrow}>▼</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
     prevProps.experience.id === nextProps.experience.id &&
    prevProps.experience.likeCount === nextProps.experience.likeCount &&
    prevProps.experience.commentCount === nextProps.experience.commentCount &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.isFullScreen === nextProps.isFullScreen
  );
});

// ============= UPDATED STYLES FOR FULL-WIDTH =============
const loadingCommentsStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 1rem',
  color: '#95a5a6',
  gap: '1rem',
};

const cardStyle = {
  backgroundColor: 'rgba(44, 62, 80, 0.9)',
  border: '1px solid #34495e',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
  transition: 'all 0.3s ease',
  width: '100%',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const userInfoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flex: 1,
};

const avatarStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid #3498db',
};

const userInfoStyle = {
  flex: 1,
};

const userNameStyle = {
  fontWeight: '700',
  color: '#ecf0f1',
  fontSize: '1.3rem',
  marginBottom: '0.25rem',
};

const dateStyle = {
  color: '#95a5a6',
  fontSize: '0.9rem',
};

const headerLikeButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '1.1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '25px',
  transition: 'all 0.2s ease',
  fontWeight: '600',
  border: '2px solid rgba(52, 73, 94, 0.5)',
};

const contentStyle = {
  marginBottom: '1.5rem',
  lineHeight: '1.7',
};

const experienceTextStyle = {
  color: '#ecf0f1',
  fontSize: '1.1rem',
  lineHeight: '1.7',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const actionBarStyle = {
  display: 'flex',
  gap: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid #34495e',
};

const actionButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '25px',
  transition: 'all 0.2s ease',
  fontWeight: '600',
  '&:hover': {
    backgroundColor: 'rgba(52, 73, 94, 0.5)',
    color: '#ecf0f1'
  }
};

const commentsSectionStyle = {
  marginTop: '2rem',
  paddingTop: '1.5rem',
  borderTop: '1px solid #34495e',
};

const commentFormStyle = {
  marginBottom: '1.5rem',
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #2c3e50',
};

const commentInputHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1rem',
};

const commentUserAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #3498db',
};

const commentInputInfoStyle = {
  flex: 1,
};

const commentInputUserName = {
  fontWeight: '600',
  color: '#ecf0f1',
  fontSize: '0.95rem',
  marginBottom: '0.5rem',
};

const commentInputStyle = {
  width: '100%',
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  border: '1px solid #2c3e50',
  borderRadius: '8px',
  color: '#ecf0f1',
  padding: '0.75rem',
  fontSize: '1rem',
  resize: 'vertical',
  fontFamily: 'inherit',
  '&:focus': {
    outline: 'none',
    borderColor: '#3498db'
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};

const commentSubmitRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1rem',
};

const charCountStyle = {
  fontSize: '0.85rem',
  color: '#95a5a6',
  fontWeight: '500',
};

const submitButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.75rem',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  '&:hover:not(:disabled)': {
    backgroundColor: '#229954',
    transform: 'translateY(-2px)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const smallSpinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const loginPromptStyle = {
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  border: '1px solid rgba(52, 152, 219, 0.3)',
  color: '#3498db',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '1.5rem',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  justifyContent: 'space-between',
  textAlign: 'center',
};

const loginPromptTitle = {
  fontWeight: '600',
  color: '#3498db',
  fontSize: '1.1rem',
  marginBottom: '0.25rem',
};

const loginPromptText = {
  fontSize: '0.9rem',
  color: '#bdc3c7',
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

const commentsListStyle = {
  width: '100%',
};

const commentsHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '2px solid #34495e',
};

const commentsTitleStyle = {
  margin: 0,
  fontSize: '1.3rem',
  color: '#FFD700',
  fontWeight: '700',
};

const loadMoreButtonStyle = {
  backgroundColor: 'rgba(52, 73, 94, 0.5)',
  border: '1px solid #34495e',
  color: '#bdc3c7',
  padding: '0.75rem 1.5rem',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    color: '#ecf0f1',
    transform: 'translateY(-2px)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const noCommentsStyle = {
  textAlign: 'center',
  padding: '3rem 1rem',
  color: '#95a5a6',
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  borderRadius: '12px',
  border: '2px dashed #34495e',
};

const noCommentsIcon = {
  fontSize: '3rem',
  marginBottom: '1rem',
  opacity: 0.5,
};

const noCommentsText = {
  fontStyle: 'italic',
  fontSize: '1.1rem',
  maxWidth: '400px',
  margin: '0 auto',
};

const showCommentsPromptStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  border: '1px solid rgba(52, 152, 219, 0.2)',
  borderRadius: '10px',
  color: '#3498db',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    transform: 'translateY(-2px)',
  },
};

const showCommentsIcon = {
  fontSize: '1.2rem',
};

const showCommentsText = {
  fontWeight: '600',
  fontSize: '1rem',
};

const showCommentsArrow = {
  fontSize: '0.9rem',
  opacity: 0.7,
};

ExperienceCard.displayName = 'ExperienceCard';

export default ExperienceCard;