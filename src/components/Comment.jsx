
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Comment = ({ comment, experienceId, depth = 0, replies = [], onReply }) => {
  const { user, likeComment } = useAuth();
  const [isLiked, setIsLiked] = useState(comment.likedBy?.includes(user?.uid) || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [liking, setLiking] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  
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
    
    console.log('Liking comment:', { 
      experienceId, 
      commentId: comment.id,
      user: user.uid 
    });
    
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
  
  // Calculate indentation based on depth
  const indentStyle = depth > 0 ? {
    marginLeft: `${Math.min(depth, 3) * 30}px`,
    borderLeft: '2px solid #3498db',
    paddingLeft: '15px',
    backgroundColor: depth === 1 
      ? 'rgba(52, 73, 94, 0.3)' 
      : depth === 2 
        ? 'rgba(52, 73, 94, 0.2)' 
        : 'rgba(52, 73, 94, 0.6)'
  } : {};
  
  // Show parent comment info for replies
  const isReply = depth > 0;
  
  // Generate unique key for this comment
  const commentKey = `comment-${comment.id}-depth-${depth}-${comment.createdAt?.seconds || '0'}`;
  
  return (
    <div key={commentKey} style={{ ...commentStyle, ...indentStyle }}>
      {/* Show "Replying to" indicator for nested comments */}
      {isReply && depth === 1 && (
        <div style={replyingToStyle}>
          <span style={replyingToIcon}>↪️</span>
          <span style={replyingToText}>Replying to {comment.userDisplayName}</span>
        </div>
      )}
      
      {/* Comment Header */}
      <div style={commentHeaderStyle}>
        <img 
          src={comment.userPhotoURL} 
          alt={comment.userDisplayName}
          style={commentAvatarStyle}
        />
        <div style={commentUserInfoStyle}>
          <div style={commentUserNameStyle}>
            {comment.userDisplayName}
            {isReply && depth > 0 && (
              <span style={replyBadgeStyle}>
                ↪️ Reply {depth > 1 ? `(Level ${depth})` : ''}
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
      
      {/* Comment Actions */}
      <div style={commentActionsStyle}>
        <button 
          onClick={handleLike}
          style={{
            ...commentActionButtonStyle,
            color: isLiked ? '#e74c3c' : '#bdc3c7',
            backgroundColor: isLiked ? 'rgba(231, 76, 60, 0.1)' : 'transparent'
          }}
          disabled={liking}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          {liking ? (
            <span style={likeSpinnerStyle}></span>
          ) : isLiked ? '❤️' : '🤍'} 
          {likeCount > 0 && ` ${likeCount}`}
        </button>
        
        {depth < 2 && (
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            style={{
              ...commentActionButtonStyle,
              backgroundColor: showReplyForm ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
            }}
            title="Reply to this comment"
          >
            {showReplyForm ? '✕ Cancel' : '💬 Reply'}
          </button>
        )}
      </div>
      
      {/* Reply Form */}
      {showReplyForm && depth < 2 && (
        <form onSubmit={handleReply} style={replyFormStyle}>
          <textarea
            id={`reply-input-${comment.id}`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.userDisplayName}...`}
            style={replyInputStyle}
            rows="2"
            maxLength="500"
            disabled={replying}
          />
          <div style={replyButtonsStyle}>
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
              ) : 'Post Reply'}
            </button>
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
          </div>
        </form>
      )}
      
      {/* Render Replies (Nested) */}
      {replies.length > 0 && (
        <div style={repliesContainerStyle}>
          {replies.map((reply, index) => (
            <Comment
              key={`reply-${reply.id}-${index}-${depth}`}
              comment={reply}
              experienceId={experienceId}
              depth={depth + 1}
              replies={reply.replies || []}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============= STYLES =============

const commentStyle = {
  backgroundColor: 'rgba(52, 73, 94, 0.6)',
  border: '1px solid #2c3e50',
  borderRadius: '8px',
  padding: '1rem',
  marginBottom: '0.75rem',
  transition: 'all 0.2s ease',
  position: 'relative'
};

const replyingToStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid rgba(52, 152, 219, 0.2)',
  fontSize: '0.8rem',
  color: '#3498db',
  fontStyle: 'italic'
};

const replyingToIcon = {
  fontSize: '0.9rem'
};

const replyingToText = {
  fontWeight: '500'
};

const replyBadgeStyle = {
  fontSize: '0.7rem',
  backgroundColor: 'rgba(52, 152, 219, 0.2)',
  color: '#3498db',
  padding: '2px 6px',
  borderRadius: '10px',
  marginLeft: '0.5rem',
  fontWeight: '500'
};

const commentHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '0.75rem'
};

const commentAvatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #3498db',
  marginRight: '0.75rem'
};

const commentUserInfoStyle = {
  flex: 1
};

const commentUserNameStyle = {
  fontWeight: '600',
  color: '#ecf0f1',
  fontSize: '0.95rem',
  marginBottom: '0.1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const commentDateStyle = {
  color: '#95a5a6',
  fontSize: '0.8rem'
};

const commentContentStyle = {
  marginBottom: '0.75rem'
};

const commentTextStyle = {
  color: '#bdc3c7',
  fontSize: '0.95rem',
  lineHeight: '1.5',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

const commentActionsStyle = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center'
};

const commentActionButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.25rem 0.75rem',
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
  marginTop: '0.75rem',
  paddingTop: '0.75rem',
  borderTop: '1px solid #34495e'
};

const replyInputStyle = {
  width: '100%',
  backgroundColor: 'rgba(26, 37, 47, 0.8)',
  border: '1px solid #2c3e50',
  borderRadius: '6px',
  color: '#ecf0f1',
  padding: '0.5rem 0.75rem',
  fontSize: '0.9rem',
  resize: 'vertical',
  marginBottom: '0.5rem',
  minHeight: '60px',
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
  gap: '0.5rem',
  justifyContent: 'flex-end'
};

const replySubmitButtonStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '0.4rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
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
  padding: '0.4rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
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
  marginTop: '0.75rem',
  marginLeft: '1.5rem',
  paddingLeft: '1rem',
  borderLeft: '2px solid rgba(52, 152, 219, 0.3)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '-2px',
    top: '0',
    bottom: '0',
    width: '2px',
    background: 'linear-gradient(to bottom, rgba(52, 152, 219, 0.3), rgba(52, 152, 219, 0.1))'
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
`;
document.head.appendChild(styleSheet);

export default Comment;
