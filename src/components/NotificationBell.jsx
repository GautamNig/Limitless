import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const NotificationBell = () => {
  const { user, unreadCount, notifications, loadingNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const dropdownRef = useRef(null);
  
  const prevUnreadCountRef = useRef(0);

  // Animation for new notifications
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 1000);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    
    // Navigate to experience
    if (notification.experienceId) {
      window.dispatchEvent(new CustomEvent('navigateToExperience', { 
        detail: { experienceId: notification.experienceId } 
      }));
    }
    
    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleViewAll = () => {
    // Navigate to notifications page or show all
    window.dispatchEvent(new CustomEvent('showAllNotifications'));
    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like_experience': return '❤️';
      case 'comment_experience': return '💬';
      case 'reply_comment': return '↪️';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'like_experience': return '#e74c3c';
      case 'comment_experience': return '#3498db';
      case 'reply_comment': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
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

  if (!user) return null;

  return (
    <div style={containerStyle} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        style={{
          ...bellButtonStyle,
          backgroundColor: showDropdown ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
          animation: hasNewNotification ? 'pulse 0.6s ease-in-out' : 'none'
        }}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <span style={bellIconStyle}>🔔</span>
        {unreadCount > 0 && (
          <span style={badgeStyle}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div style={dropdownStyle}>
          <div style={dropdownHeaderStyle}>
            <h4 style={dropdownTitleStyle}>
              🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={markAllReadStyle}
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={notificationsListStyle}>
            {loadingNotifications ? (
              <div style={loadingStyle}>
                <div style={spinnerStyle}></div>
                <div>Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>🔔</div>
                <div style={emptyTextStyle}>No notifications yet</div>
                <div style={emptySubtextStyle}>Your notifications will appear here</div>
              </div>
            ) : (
              <>
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      ...notificationItemStyle,
                      backgroundColor: notification.isRead ? 'transparent' : 'rgba(52, 152, 219, 0.08)',
                      borderLeft: `4px solid ${getNotificationColor(notification.type)}`
                    }}
                  >
                    <div style={notificationHeaderStyle}>
                      <div style={notificationIconStyle}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div style={notificationContentStyle}>
                        <div style={notificationMessageStyle}>
                          {notification.message}
                        </div>
                        {notification.commentPreview && (
                          <div style={previewStyle}>
                            "{notification.commentPreview}"
                          </div>
                        )}
                        <div style={notificationTimeStyle}>
                          {formatTimeAgo(notification.createdAt)}
                          {!notification.isRead && (
                            <span style={unreadDotStyle}>●</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {notification.senderPhotoURL && (
                      <img
                        src={notification.senderPhotoURL}
                        alt={notification.senderName}
                        style={senderAvatarStyle}
                      />
                    )}
                  </div>
                ))}
                
                {notifications.length > 10 && (
                  <button
                    onClick={handleViewAll}
                    style={viewAllButtonStyle}
                  >
                    View all notifications ({notifications.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Add CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

// ============= STYLES =============
const containerStyle = {
  position: 'relative',
  display: 'inline-block',
};

const bellButtonStyle = {
  position: 'relative',
  background: 'transparent',
  border: 'none',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '1.3rem',
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    color: '#3498db',
    transform: 'scale(1.05)',
  }
};

const bellIconStyle = {
  fontSize: '1.3rem',
};

const badgeStyle = {
  position: 'absolute',
  top: '4px',
  right: '4px',
  backgroundColor: '#e74c3c',
  color: 'white',
  borderRadius: '50%',
  minWidth: '18px',
  height: '18px',
  fontSize: '0.65rem',
  fontWeight: '700',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'pulse 0.6s ease-in-out',
};

const dropdownStyle = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  width: '360px',
  maxHeight: '500px',
  backgroundColor: 'rgba(20, 25, 45, 0.98)',
  backdropFilter: 'blur(20px)',
  border: '1px solid #34495e',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  zIndex: 1000,
  overflow: 'hidden',
  animation: 'fadeIn 0.2s ease',
};

const dropdownHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 1.2rem',
  borderBottom: '1px solid #34495e',
  backgroundColor: 'rgba(44, 62, 80, 0.5)',
};

const dropdownTitleStyle = {
  margin: 0,
  fontSize: '1rem',
  color: '#FFD700',
  fontWeight: '600',
};

const markAllReadStyle = {
  backgroundColor: 'transparent',
  border: '1px solid #34495e',
  color: '#95a5a6',
  padding: '0.3rem 0.8rem',
  borderRadius: '18px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    color: '#3498db',
  }
};

const notificationsListStyle = {
  maxHeight: '400px',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(52, 73, 94, 0.3)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#3498db',
    borderRadius: '3px',
  }
};

const notificationItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '1rem 1.2rem',
  borderBottom: '1px solid rgba(52, 73, 94, 0.3)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  }
};

const notificationHeaderStyle = {
  display: 'flex',
  gap: '0.8rem',
  flex: 1,
};

const notificationIconStyle = {
  fontSize: '1.2rem',
  marginTop: '2px',
};

const notificationContentStyle = {
  flex: 1,
};

const notificationMessageStyle = {
  color: '#ecf0f1',
  fontSize: '0.9rem',
  fontWeight: '500',
  marginBottom: '0.3rem',
  lineHeight: '1.4',
};

const previewStyle = {
  color: '#bdc3c7',
  fontSize: '0.8rem',
  fontStyle: 'italic',
  margin: '0.2rem 0',
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  padding: '0.3rem 0.5rem',
  borderRadius: '6px',
  borderLeft: '2px solid #3498db',
};

const notificationTimeStyle = {
  color: '#95a5a6',
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const unreadDotStyle = {
  color: '#3498db',
  fontSize: '0.6rem',
  animation: 'pulse 1s infinite',
};

const senderAvatarStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #3498db',
  marginLeft: '0.8rem',
};

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  color: '#95a5a6',
  gap: '1rem',
};

const spinnerStyle = {
  width: '30px',
  height: '30px',
  border: '3px solid rgba(52, 152, 219, 0.2)',
  borderTop: '3px solid #3498db',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  color: '#95a5a6',
  textAlign: 'center',
};

const emptyIconStyle = {
  fontSize: '2.5rem',
  marginBottom: '1rem',
  opacity: 0.5,
};

const emptyTextStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: '#bdc3c7',
};

const emptySubtextStyle = {
  fontSize: '0.85rem',
  opacity: 0.7,
  maxWidth: '200px',
};

const viewAllButtonStyle = {
  width: '100%',
  backgroundColor: 'rgba(52, 73, 94, 0.5)',
  border: '1px solid #34495e',
  color: '#bdc3c7',
  padding: '0.8rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    color: '#ecf0f1',
  }
};

export default NotificationBell;    