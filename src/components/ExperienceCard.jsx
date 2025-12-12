
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Comment from './Comment';

// Self-contained ExperienceCard that doesn't depend on parent re-renders
const ExperienceCard = memo(({ experience: initialExperience, currentUserId }) => {
  const { user, addComment, fetchComments, likeComment: likeExperienceComment } = useAuth();
  
  // Local state - doesn't depend on parent
  const [experience, setExperience] = useState(initialExperience);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(initialExperience.likedBy?.includes(currentUserId) || false);
  const [likeCount, setLikeCount] = useState(initialExperience.likeCount || 0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentsLastDoc, setCommentsLastDoc] = useState(null);
  
  // Use refs to prevent re-renders
  const mountedRef = useRef(true);
  const experienceRef = useRef(initialExperience);
  const showCommentsRef = useRef(false);

  // Update refs when props change (but don't cause re-render)
  useEffect(() => {
    experienceRef.current = initialExperience;
  }, [initialExperience]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoize stable functions
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'Recently';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Recently';
      
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
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
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
      visited: false  // Track if we've already processed this comment
    });
  });
  
  // Second pass: build tree
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.id);
    
    // If this comment has a parent, add it to parent's replies
    if (comment.parentCommentId) {
      const parentNode = commentMap.get(comment.parentCommentId);
      if (parentNode && !parentNode.replies.some(reply => reply.id === comment.id)) {
        parentNode.replies.push(commentNode);
        commentNode.visited = true;
      }
    } 
    // If no parent and not visited yet, it's a root
    else if (!commentNode.visited) {
      roots.push(commentNode);
      commentNode.visited = true;
    }
  });
  
  // Clean up visited flag
  roots.forEach(root => cleanVisitedFlag(root));
  
  return roots;
}, []);

// Helper function to clean visited flags
const cleanVisitedFlag = (node) => {
  delete node.visited;
  if (node.replies) {
    node.replies.forEach(reply => cleanVisitedFlag(reply));
  }
};

  const loadComments = useCallback(async (reset = false) => {
    if (!showCommentsRef.current || !mountedRef.current) return;
    
    setLoadingComments(true);
    try {
      const result = await fetchComments(
        experienceRef.current.id, 
        10, 
        reset ? null : commentsLastDoc
      );
      
      const commentsResult = result?.comments || result || [];
      
      if (reset) {
        setComments(commentsResult);
      } else {
        setComments(prev => [...(prev || []), ...commentsResult]);
      }
      
      setCommentsLastDoc(result?.lastDoc || null);
      setHasMoreComments(commentsResult.length === 10);
    } catch (error) {
      console.error('Error loading comments:', error);
      if (mountedRef.current) setComments([]);
    } finally {
      if (mountedRef.current) setLoadingComments(false);
    }
  }, [fetchComments, commentsLastDoc]);

  useEffect(() => {
    showCommentsRef.current = showComments;
    if (showComments) {
      loadComments(true);
    }
  }, [showComments, loadComments]);

  const handleLike = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      // Optimistic update
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
      
      // Update experience in Firestore
      await likeExperienceComment(experience.id);
      
      // Update local experience state
      setExperience(prev => ({
        ...prev,
        likeCount: newLikedState ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
        likedBy: newLikedState 
          ? [...(prev.likedBy || []), currentUserId]
          : (prev.likedBy || []).filter(id => id !== currentUserId)
      }));
      
    } catch (error) {
      console.error('Error liking experience:', error);
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  }, [currentUserId, isLiked, experience.id, likeExperienceComment]);

  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!currentUserId || !commentInput.trim()) return;
    
    setSubmitting(true);
    try {
      const newComment = await addComment(experience.id, commentInput);
      
      // Clear input immediately
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
      
      // Update experience comment count
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

  return (
    <div style={cardStyle}>
      {/* User Header */}
      <div style={headerStyle}>
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

      {/* Experience Content */}
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
            backgroundColor: isLiked ? 'rgba(231, 76, 60, 0.1)' : 'transparent'
          }}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </button>
        
        <button 
          onClick={toggleComments}
          style={{
            ...actionButtonStyle,
            backgroundColor: showComments ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
          }}
          title={showComments ? 'Hide Comments' : 'Show Comments'}
        >
          💬 {experience.commentCount || 0}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={commentsSectionStyle}>
          {/* Comment Input */}
          {currentUserId ? (
            <form onSubmit={handleCommentSubmit} style={commentFormStyle}>
              <textarea
                value={commentInput}
                onChange={handleInputChange}
                placeholder="Share your thoughts on this experience..."
                style={commentInputStyle}
                rows="3"
                maxLength="500"
                disabled={submitting}
              />
              <div style={commentSubmitRowStyle}>
                <div style={charCountStyle}>
                  {commentInput.length}/500
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
              <span>🔒</span>
              <div>
                <div style={loginPromptTitle}>Sign in to join the conversation</div>
                <div style={loginPromptText}>Share your thoughts and connect with others</div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div style={commentsListStyle}>
            {commentTree.length > 0 ? (
              <>
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
                
                {hasMoreComments && (
                  <button 
                    onClick={() => loadComments(false)}
                    style={loadMoreButtonStyle}
                    disabled={loadingComments}
                  >
                    {loadingComments ? 'Loading...' : 'Load More Comments'}
                  </button>
                )}
              </>
            ) : (
              <div style={noCommentsStyle}>
                <div style={noCommentsIcon}>💬</div>
                <div style={noCommentsText}>No comments yet. Be the first to share your thoughts!</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if experience ID changes or like/comment counts change
  return (
    prevProps.experience.id === nextProps.experience.id &&
    prevProps.experience.likeCount === nextProps.experience.likeCount &&
    prevProps.experience.commentCount === nextProps.experience.commentCount &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

// ============= STYLES =============

const cardStyle = {
  backgroundColor: 'rgba(44, 62, 80, 0.9)',
  border: '1px solid #34495e',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
    borderColor: '#3498db'
  }
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '1rem'
};

const avatarStyle = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #3498db',
  marginRight: '1rem'
};

const userInfoStyle = {
  flex: 1
};

const userNameStyle = {
  fontWeight: '600',
  color: '#ecf0f1',
  fontSize: '1.1rem',
  marginBottom: '0.25rem'
};

const dateStyle = {
  color: '#95a5a6',
  fontSize: '0.85rem'
};

const contentStyle = {
  marginBottom: '1rem'
};

const experienceTextStyle = {
  color: '#bdc3c7',
  fontSize: '1rem',
  lineHeight: '1.6',
  margin: 0,
  whiteSpace: 'pre-wrap'
};

const actionBarStyle = {
  display: 'flex',
  gap: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid #34495e'
};

const actionButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '20px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 73, 94, 0.5)',
    color: '#ecf0f1'
  }
};

const commentsSectionStyle = {
  marginTop: '1.5rem',
  paddingTop: '1.5rem',
  borderTop: '1px solid #34495e'
};

const commentFormStyle = {
  marginBottom: '1.5rem'
};

const commentInputStyle = {
  width: '100%',
  backgroundColor: 'rgba(52, 73, 94, 0.5)',
  border: '1px solid #2c3e50',
  borderRadius: '8px',
  color: '#ecf0f1',
  padding: '0.75rem',
  fontSize: '0.95rem',
  resize: 'vertical',
  marginBottom: '0.75rem',
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
  alignItems: 'center'
};

const charCountStyle = {
  fontSize: '0.8rem',
  color: '#95a5a6'
};

const submitButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1.5rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  '&:hover:not(:disabled)': {
    backgroundColor: '#229954'
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
  padding: '1rem',
  borderRadius: '8px',
  textAlign: 'center',
  marginBottom: '1.5rem',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  justifyContent: 'center'
};

const loginPromptTitle = {
  fontWeight: '600',
  color: '#3498db',
  fontSize: '0.95rem',
  marginBottom: '0.25rem'
};

const loginPromptText = {
  fontSize: '0.85rem',
  color: '#bdc3c7'
};

const commentsListStyle = {
  maxHeight: '400px',
  overflowY: 'auto',
  paddingRight: '0.5rem'
};

const loadMoreButtonStyle = {
  width: '100%',
  backgroundColor: 'rgba(52, 73, 94, 0.5)',
  border: '1px solid #34495e',
  color: '#bdc3c7',
  padding: '0.75rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  marginTop: '1rem',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    color: '#ecf0f1'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const noCommentsStyle = {
  textAlign: 'center',
  padding: '2rem 1rem',
  color: '#95a5a6'
};

const noCommentsIcon = {
  fontSize: '2.5rem',
  marginBottom: '1rem',
  opacity: 0.5
};

const noCommentsText = {
  fontStyle: 'italic',
  fontSize: '0.95rem'
};

// Add animation to the styleSheet
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

ExperienceCard.displayName = 'ExperienceCard';

export default ExperienceCard;
