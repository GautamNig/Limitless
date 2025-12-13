import { Ft, fn, ls, ft } from './firebase';
import { la } from './firebase';
import { on, pi } from './firebase';

class NotificationService {
  constructor() {
    this.firestore = on(pi);
  }

  /**
   * Create a notification for experience like
   */
  async createLikeNotification({ experienceId, experienceOwnerId, likerId, likerName, likerPhotoURL, experienceContent }) {
    if (experienceOwnerId === likerId) return; // Don't notify self
    
    const notification = {
      type: 'like_experience',
      senderId: likerId,
      senderName: likerName,
      senderPhotoURL: likerPhotoURL,
      experienceId,
      experiencePreview: this._truncateContent(experienceContent, 50),
      message: `${likerName} liked your life experience`,
      isRead: false,
      createdAt: ft(),
      expiresAt: this._getExpiryDate(30) // 30 days from now
    };

    return this._addNotification(experienceOwnerId, notification);
  }

  /**
   * Create notification for new comment on experience
   */
  async createCommentNotification({ experienceId, experienceOwnerId, commenterId, commenterName, commenterPhotoURL, commentContent, experienceContent }) {
    if (experienceOwnerId === commenterId) return; // Don't notify self
    
    const notification = {
      type: 'comment_experience',
      senderId: commenterId,
      senderName: commenterName,
      senderPhotoURL: commenterPhotoURL,
      experienceId,
      commentPreview: this._truncateContent(commentContent, 40),
      experiencePreview: this._truncateContent(experienceContent, 30),
      message: `${commenterName} commented on your life experience`,
      isRead: false,
      createdAt: ft(),
      expiresAt: this._getExpiryDate(30)
    };

    return this._addNotification(experienceOwnerId, notification);
  }

  /**
   * Create notification for reply to comment
   */
  async createReplyNotification({ 
    experienceId, 
    originalCommenterId, 
    replierId, 
    replierName, 
    replierPhotoURL, 
    replyContent,
    parentCommentId,
    experienceContent 
  }) {
    if (originalCommenterId === replierId) return; // Don't notify self
    
    const notification = {
      type: 'reply_comment',
      senderId: replierId,
      senderName: replierName,
      senderPhotoURL: replierPhotoURL,
      experienceId,
      parentCommentId,
      replyPreview: this._truncateContent(replyContent, 40),
      experiencePreview: this._truncateContent(experienceContent, 30),
      message: `${replierName} replied to your comment`,
      isRead: false,
      createdAt: ft(),
      expiresAt: this._getExpiryDate(30)
    };

    return this._addNotification(originalCommenterId, notification);
  }

  /**
   * Get user's notifications with real-time listener
   */
  subscribeToNotifications(userId, callback, limit = 20) {
    if (!userId) return () => {};
    
    const notificationsRef = fn(this.firestore, 'notifications', userId, 'userNotifications');
    const query = Bi(notificationsRef, ps('createdAt', 'desc'), us(limit));
    
    return fT(query, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
        expiresAt: doc.data().expiresAt?.toDate ? doc.data().expiresAt.toDate() : null
      }));
      callback(notifications);
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId, notificationId) {
    const notificationRef = Ft(this.firestore, 'notifications', userId, 'userNotifications', notificationId);
    return await ls(notificationRef, {
      isRead: true,
      readAt: ft()
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    // We'll implement this with a batch update
    const batch = la(this.firestore);
    const notificationsRef = fn(this.firestore, 'notifications', userId, 'userNotifications');
    const query = Bi(notificationsRef, Fl('isRead', '==', false), us(50));
    
    const snapshot = await ys(query);
    snapshot.docs.forEach(doc => {
      const notificationRef = Ft(this.firestore, 'notifications', userId, 'userNotifications', doc.id);
      batch.update(notificationRef, { 
        isRead: true, 
        readAt: ft() 
      });
    });
    
    return await batch.commit();
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    if (!userId) return 0;
    
    const notificationsRef = fn(this.firestore, 'notifications', userId, 'userNotifications');
    const query = Bi(notificationsRef, Fl('isRead', '==', false));
    
    // Note: This counts all unread. For performance, consider caching this count
    const snapshot = await ys(query);
    return snapshot.size;
  }

  /**
   * Delete old notifications (cleanup helper)
   */
  async cleanupOldNotifications(userId, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const notificationsRef = fn(this.firestore, 'notifications', userId, 'userNotifications');
    const query = Bi(notificationsRef, 
      Fl('createdAt', '<', cutoffDate),
      us(100) // Batch delete limit
    );
    
    const snapshot = await ys(query);
    if (snapshot.empty) return 0;
    
    const batch = la(this.firestore);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return snapshot.size;
  }

  // Private helper methods
  _addNotification(userId, notificationData) {
    const notificationsRef = fn(this.firestore, 'notifications', userId, 'userNotifications');
    return hp(notificationsRef, notificationData);
  }

  _truncateContent(content, maxLength) {
    if (!content || typeof content !== 'string') return '';
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  }

  _getExpiryDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}

export const notificationService = new NotificationService();