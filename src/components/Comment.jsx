import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Configuration - easily adjustable
const COMMENT_CONFIG = {
  MAX_DEPTH: 4, // Maximum nesting depth (0 = root, 4 = 5 levels total)
  SHOW_REPLY_INDICATOR: true, // Show "Replying to @username"
  SHOW_THREAD_LINES: true, // Show vertical connecting lines
  ENABLE_COLLAPSE: true, // Enable collapse/expand threads
  AVATAR_SIZE: 32, // Avatar size in pixels
  AVATAR_ALIGNMENT: 'vertical', // 'vertical' or 'horizontal' thread alignment
  MOBILE_BREAKPOINT: 768, // Screen width for mobile adjustments
};

const Comment = ({ comment, experienceId, depth = 0, replies = [], onReply }) => {
  const { user, likeComment } = useAuth();
  const [isLiked, setIsLiked] = useState(comment.likedBy?.includes(user?.uid) || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [liking, setLiking] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check if we can reply further
  const canReply = depth < COMMENT_CONFIG.MAX_DEPTH;
  
  const formatDate = (timestamp) => {
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
  };
  
  const handleLike = async () => {
    if (!user) return;
    
    setLiking(true);
    try {
      const newLikeState = await likeComment(experienceId, comment.id);
      setIsLiked(newLikeState);
      setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setLiking(false);
    }
  };
  
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !user || replying) return;
    
    setReplying(true);
    try {
      if (onReply) {
        await onReply(replyText, comment.id);
        setReplyText('');
        setShowReplyForm(false);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setReplying(false);
    }
  };
  
  // Toggle thread collapse/expand
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Facebook/Reddit style thread design
  const isRootComment = depth === 0;
  const isReply = depth > 0;
  const hasReplies = replies && replies.length > 0;
  
  // Calculate visual thread indicators
  const showThreadLine = COMMENT_CONFIG.SHOW_THREAD_LINES && isReply && depth > 0;
  const showReplyIndicator = COMMENT_CONFIG.SHOW_REPLY_INDICATOR && isReply;
  
  // Avatar thread alignment - vertical stack for Facebook style
  const threadStyle = COMMENT_CONFIG.AVATAR_ALIGNMENT === 'vertical' ? {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    marginLeft: isRootComment ? 0 : `${COMMENT_CONFIG.AVATAR_SIZE / 2}px`,
    paddingLeft: isRootComment ? 0 : `${COMMENT_CONFIG.AVATAR_SIZE / 2 + 8}px`,
    borderLeft: showThreadLine ? '2px solid rgba(52, 152, 219, 0.3)' : 'none',
  } : {
    marginLeft: isRootComment ? 0 : `${depth * 30}px`,
  };
  
  // Main comment container style
  const commentStyle = {
    backgroundColor: isRootComment ? 'rgba(52, 73, 94, 0.6)' : 'rgba(52, 73, 94, 0.4)',
    border: '1px solid #2c3e50',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '0.75rem',
    transition: 'all 0.2s ease',
    position: 'relative',
    width: '100%',
    ...threadStyle,
  };
  
  // Collapsed state style
  const collapsedStyle = isCollapsed ? {
    maxHeight: '60px',
    overflow: 'hidden',
    opacity: 0.8,
  } : {};
  
  // Generate unique key
  const commentKey = `comment-${comment.id}-depth-${depth}`;
  
  return (
    <div key={commentKey} style={{ ...commentStyle, ...collapsedStyle }}>
      {/* Thread connector line for visual hierarchy */}
      {showThreadLine && (
        <div style={threadConnectorStyle}>
          <div style={threadLineStyle}></div>
        </div>
      )}
      
      {/* Collapse/Expand toggle for threads with replies */}
      {COMMENT_CONFIG.ENABLE_COLLAPSE && hasReplies && (
        <button 
          onClick={toggleCollapse}
          style={collapseToggleStyle}
          title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
      )}
      
      {/* Reply indicator for nested comments */}
      {showReplyIndicator && (
        <div style={replyingToContainerStyle}>
          <span style={replyingToIcon}>↪️</span>
          <span style={replyingToText}>
            Replying to <strong>{comment.userDisplayName}</strong>
          </span>
        </div>
      )}
      
      {/* Comment Header with Avatar */}
      <div style={commentHeaderStyle}>
        <div style={avatarContainerStyle}>
          <img 
            src={comment.userPhotoURL} 
            alt={comment.userDisplayName}
            style={commentAvatarStyle}
          />
          {/* Online status indicator (optional) */}
          <div style={onlineIndicatorStyle}></div>
        </div>
        
        <div style={commentUserInfoStyle}>
          <div style={commentUserNameStyle}>
            {comment.userDisplayName}
            {isReply && (
              <span style={replyBadgeStyle}>
                Reply #{depth}
              </span>
            )}
          </div>
          <div style={commentDateStyle}>{formatDate(comment.createdAt)}</div>
        </div>
      </div>
      
      {/* Comment Content */}
      <div style={commentContentStyle}>
        <p style={commentTextStyle}>{comment.content}</p>
      </div>
      
      {/* Comment Actions - Facebook style */}
      <div style={commentActionsStyle}>
        <button 
          onClick={handleLike}
          style={{
            ...commentActionButtonStyle,
            color: isLiked ? '#e74c3c' : '#bdc3c7',
            backgroundColor: isLiked ? 'rgba(231, 76, 60, 0.1)' : 'transparent',
            fontWeight: isLiked ? '600' : 'normal',
          }}
          disabled={liking}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          {liking ? (
            <span style={likeSpinnerStyle}></span>
          ) : isLiked ? '❤️' : '🤍'} 
          {likeCount > 0 && ` ${likeCount}`}
        </button>
        
        {canReply && (
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            style={{
              ...commentActionButtonStyle,
              backgroundColor: showReplyForm ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
              fontWeight: showReplyForm ? '600' : 'normal',
            }}
            title="Reply to this comment"
          >
            {showReplyForm ? '✕ Cancel' : '💬 Reply'}
          </button>
        )}
        
        {/* Share button (optional - Facebook style) */}
        <button 
          style={commentActionButtonStyle}
          title="Share comment"
        >
          ↗️ Share
        </button>
      </div>
      
      {/* Reply Form */}
      {showReplyForm && canReply && (
        <form onSubmit={handleReply} style={replyFormStyle}>
          <div style={replyFormHeaderStyle}>
            <img 
              src={user?.photoURL} 
              alt={user?.displayName}
              style={replyAvatarStyle}
            />
            <div style={replyFormInfoStyle}>
              <div style={replyFormUserName}>{user?.displayName}</div>
              <div style={replyFormHint}>Replying to {comment.userDisplayName}</div>
            </div>
          </div>
          
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.userDisplayName}...`}
            style={replyInputStyle}
            rows="3"
            maxLength="500"
            disabled={replying}
          />
          
          <div style={replyButtonsStyle}>
            <button 
              type="button"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
              style={replyCancelButtonStyle}
              disabled={replying}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={replySubmitButtonStyle}
              disabled={replying || !replyText.trim()}
            >
              {replying ? (
                <>
                  <div style={smallSpinnerStyle}></div>
                  Posting...
                </>
              ) : 'Reply'}
            </button>
          </div>
        </form>
      )}
      
      {/* Render Replies (Nested) - Facebook vertical style */}
      {!isCollapsed && hasReplies && (
        <div style={repliesContainerStyle}>
          {replies.map((reply, index) => (
            <Comment
              key={`reply-${reply.id}-${index}`}
              comment={reply}
              experienceId={experienceId}
              depth={depth + 1}
              replies={reply.replies || []}
              onReply={onReply}
            />
          ))}
        </div>
      )}
      
      {/* Show "Show X replies" when collapsed */}
      {isCollapsed && hasReplies && (
        <button 
          onClick={toggleCollapse}
          style={showRepliesButtonStyle}
        >
          ▶ Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </div>
  );
};

// ============= UPDATED STYLES FOR FACEBOOK/REDDIT DESIGN =============

const threadConnectorStyle = {
  position: 'absolute',
  left: '-1px',
  top: '0',
  bottom: '0',
  width: '2px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const threadLineStyle = {
  width: '2px',
  height: '100%',
  background: 'linear-gradient(to bottom, rgba(52, 152, 219, 0.3), rgba(52, 152, 219, 0.1))',
};

const collapseToggleStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  backgroundColor: 'rgba(52, 73, 94, 0.8)',
  border: '1px solid #34495e',
  color: '#bdc3c7',
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '10px',
  zIndex: 2,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    color: '#ecf0f1',
  }
};

const replyingToContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.75rem',
  padding: '0.4rem 0.8rem',
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  borderRadius: '6px',
  fontSize: '0.85rem',
  color: '#3498db',
  fontStyle: 'italic',
  borderLeft: '3px solid #3498db',
};

const replyingToIcon = {
  fontSize: '0.9rem',
};

const replyingToText = {
  fontWeight: '500',
};

const replyBadgeStyle = {
  fontSize: '0.7rem',
  backgroundColor: 'rgba(52, 152, 219, 0.2)',
  color: '#3498db',
  padding: '2px 8px',
  borderRadius: '10px',
  marginLeft: '0.75rem',
  fontWeight: '600',
};

const commentHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.75rem',
};

const avatarContainerStyle = {
  position: 'relative',
  width: `${COMMENT_CONFIG.AVATAR_SIZE}px`,
  height: `${COMMENT_CONFIG.AVATAR_SIZE}px`,
};

const commentAvatarStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #3498db',
};

const onlineIndicatorStyle = {
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: '8px',
  height: '8px',
  backgroundColor: '#27ae60',
  borderRadius: '50%',
  border: '2px solid #2c3e50',
};

const commentUserInfoStyle = {
  flex: 1,
};

const commentUserNameStyle = {
  fontWeight: '600',
  color: '#ecf0f1',
  fontSize: '0.95rem',
  marginBottom: '0.1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const commentDateStyle = {
  color: '#95a5a6',
  fontSize: '0.8rem',
};

const commentContentStyle = {
  marginBottom: '0.75rem',
};

const commentTextStyle = {
  color: '#bdc3c7',
  fontSize: '0.95rem',
  lineHeight: '1.5',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const commentActionsStyle = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  paddingTop: '0.75rem',
  borderTop: '1px solid rgba(52, 73, 94, 0.5)',
};

const commentActionButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.8rem',
  borderRadius: '15px',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    color: '#ecf0f1',
    transform: 'translateY(-1px)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const likeSpinnerStyle = {
  width: '14px',
  height: '14px',
  border: '2px solid rgba(231, 76, 60, 0.3)',
  borderTop: '2px solid #e74c3c',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const smallSpinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid #27ae60',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const replyFormStyle = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: 'rgba(26, 37, 47, 0.5)',
  borderRadius: '8px',
  border: '1px solid #34495e',
};

const replyFormHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.75rem',
};

const replyAvatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #3498db',
};

const replyFormInfoStyle = {
  flex: 1,
};

const replyFormUserName = {
  fontWeight: '600',
  color: '#ecf0f1',
  fontSize: '0.9rem',
  marginBottom: '0.1rem',
};

const replyFormHint = {
  color: '#95a5a6',
  fontSize: '0.8rem',
  fontStyle: 'italic',
};

const replyInputStyle = {
  width: '100%',
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  border: '1px solid #2c3e50',
  borderRadius: '6px',
  color: '#ecf0f1',
  padding: '0.75rem',
  fontSize: '0.9rem',
  resize: 'vertical',
  marginBottom: '0.75rem',
  minHeight: '80px',
  fontFamily: 'inherit',
  '&:focus': {
    outline: 'none',
    borderColor: '#3498db',
    boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)'
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};

const replyButtonsStyle = {
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'flex-end',
  alignItems: 'center',
};

const replySubmitButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '0.6rem 1.25rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  '&:hover:not(:disabled)': {
    backgroundColor: '#229954',
    transform: 'translateY(-1px)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const replyCancelButtonStyle = {
  backgroundColor: 'transparent',
  color: '#95a5a6',
  border: '1px solid #95a5a6',
  padding: '0.6rem 1.25rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(149, 165, 166, 0.1)',
    color: '#ecf0f1'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const repliesContainerStyle = {
  marginTop: '1rem',
  position: 'relative',
};

const showRepliesButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#3498db',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '600',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  marginTop: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
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
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.comment-enter {
  animation: fadeIn 0.3s ease;
}

/* Thread line animation */
@keyframes drawLine {
  from { height: 0; }
  to { height: 100%; }
}

.thread-line {
  animation: drawLine 0.5s ease-out;
}
`;
document.head.appendChild(styleSheet);

export default Comment;