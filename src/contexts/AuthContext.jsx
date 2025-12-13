import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  limit,
  orderBy,
  writeBatch,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  addDoc,
  onSnapshot,
  where,
  increment,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [fullProfileCache, setFullProfileCache] = useState({});
  const [profilesLoading, setProfilesLoading] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Helper functions for notifications
  const truncateContent = useCallback((content, maxLength) => {
    if (!content || typeof content !== 'string') return '';
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  }, []);

  const getExpiryDate = useCallback((days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }, []);

  // Get experience by ID (helper function)
  const getExperienceById = useCallback(async (experienceId) => {
    try {
      const experienceRef = doc(db, 'experiences', experienceId);
      const snapshot = await getDoc(experienceRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting experience:', error);
      return null;
    }
  }, []);

  // Get comment by ID (helper function)
  const getCommentById = useCallback(async (experienceId, commentId) => {
    try {
      const commentRef = doc(db, 'experiences', experienceId, 'comments', commentId);
      const snapshot = await getDoc(commentRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting comment:', error);
      return null;
    }
  }, []);

  // MARK NOTIFICATION AS READ
  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (!user?.uid) return;
    
    try {
      const notificationRef = doc(db, 'notifications', user.uid, 'userNotifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // MARK ALL NOTIFICATIONS AS READ
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const notificationsRef = collection(db, 'notifications', user.uid, 'userNotifications');
      const q = query(notificationsRef, where('isRead', '==', false), limit(50));
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        const notificationRef = doc.ref;
        batch.update(notificationRef, { 
          isRead: true, 
          readAt: serverTimestamp() 
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // CREATE LIKE NOTIFICATION
  const createLikeNotification = async ({ experienceId, experienceOwnerId, likerId, likerName, likerPhotoURL, experienceContent }) => {
    try {
      if (experienceOwnerId === likerId) return; // Don't notify self
      
      console.log('🔔 Creating like notification:', {
        experienceOwnerId,
        likerId,
        likerName
      });
      
      const notificationData = {
        type: 'like_experience',
        senderId: likerId,
        senderName: likerName,
        senderPhotoURL: likerPhotoURL,
        experienceId,
        experiencePreview: truncateContent(experienceContent, 50),
        message: `${likerName} liked your life experience`,
        isRead: false,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(getExpiryDate(30))
      };

      // Direct Firestore write
      const notificationsRef = collection(db, 'notifications', experienceOwnerId, 'userNotifications');
      await addDoc(notificationsRef, notificationData);
      
      console.log('✅ Like notification created successfully');
    } catch (error) {
      console.error('❌ Error creating like notification:', error);
    }
  };

  // CREATE COMMENT NOTIFICATION
  const createCommentNotification = async ({ experienceId, experienceOwnerId, commenterId, commenterName, commenterPhotoURL, commentContent, experienceContent }) => {
    try {
      if (experienceOwnerId === commenterId) return; // Don't notify self
      
      console.log('🔔 Creating comment notification:', {
        experienceOwnerId,
        commenterId,
        commenterName
      });
      
      const notificationData = {
        type: 'comment_experience',
        senderId: commenterId,
        senderName: commenterName,
        senderPhotoURL: commenterPhotoURL,
        experienceId,
        commentPreview: truncateContent(commentContent, 40),
        experiencePreview: truncateContent(experienceContent, 30),
        message: `${commenterName} commented on your life experience`,
        isRead: false,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(getExpiryDate(30))
      };

      const notificationsRef = collection(db, 'notifications', experienceOwnerId, 'userNotifications');
      await addDoc(notificationsRef, notificationData);
      
      console.log('✅ Comment notification created successfully');
    } catch (error) {
      console.error('❌ Error creating comment notification:', error);
    }
  };

  // CREATE REPLY NOTIFICATION
  const createReplyNotification = async ({ 
    experienceId, 
    originalCommenterId, 
    replierId, 
    replierName, 
    replierPhotoURL, 
    replyContent,
    parentCommentId,
    experienceContent 
  }) => {
    try {
      if (originalCommenterId === replierId) return; // Don't notify self
      
      console.log('🔔 Creating reply notification:', {
        originalCommenterId,
        replierId,
        replierName
      });
      
      const notificationData = {
        type: 'reply_comment',
        senderId: replierId,
        senderName: replierName,
        senderPhotoURL: replierPhotoURL,
        experienceId,
        parentCommentId,
        replyPreview: truncateContent(replyContent, 40),
        experiencePreview: truncateContent(experienceContent, 30),
        message: `${replierName} replied to your comment`,
        isRead: false,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(getExpiryDate(30))
      };

      const notificationsRef = collection(db, 'notifications', originalCommenterId, 'userNotifications');
      await addDoc(notificationsRef, notificationData);
      
      console.log('✅ Reply notification created successfully');
    } catch (error) {
      console.error('❌ Error creating reply notification:', error);
    }
  };

  // DEBUG FUNCTION TO CHECK NOTIFICATIONS
  const debugNotifications = useCallback(async () => {
    if (!user?.uid) return;
    
    console.log('🔍 DEBUG: Checking notifications...');
    
    const notificationsRef = collection(db, 'notifications', user.uid, 'userNotifications');
    const q = query(notificationsRef, limit(5));
    
    try {
      const snapshot = await getDocs(q);
      console.log(`📊 DEBUG: Found ${snapshot.size} notifications for user ${user.uid}`);
      
      snapshot.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.id}:`, doc.data());
      });
      
      if (snapshot.size === 0) {
        console.log('⚠️ No notifications found.');
      }
    } catch (error) {
      console.error('❌ DEBUG: Error checking notifications:', error);
    }
  }, [user]);

  // TEST FUNCTION
  const testNotification = async () => {
    if (!user) return;
    
    console.log('🧪 Testing notification creation...');
    
    const testNotificationData = {
      type: 'test',
      senderId: user.uid,
      senderName: 'Test User',
      senderPhotoURL: user.photoURL,
      experienceId: 'test-123',
      message: 'This is a test notification',
      isRead: false,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(getExpiryDate(30))
    };
    
    try {
      const notificationsRef = collection(db, 'notifications', user.uid, 'userNotifications');
      await addDoc(notificationsRef, testNotificationData);
      console.log('✅ Test notification created!');
    } catch (error) {
      console.error('❌ Test notification failed:', error);
    }
  };

  // Auth functions
  const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    setUserProfile(null);
    setProfiles([]);
    setFullProfileCache({});
    setNotifications([]);
    setUnreadCount(0);
    return signOut(auth);
  };

  // Profile functions
  const createUserProfile = async (profileData) => {
    if (!user) throw new Error('User must be logged in');

    const profile = {
      ...profileData,
      thoughtOfTheDay: profileData.thoughtOfTheDay || '',
      shareLifeExperience: profileData.shareLifeExperience || '',
      thoughtLikes: 0,
      thoughtLikers: [],
      experienceLikes: 0,
      commentCount: 0,
      experienceLikers: [],
      userId: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'profiles', user.uid), profile);

    // FIXED: Create experience if user shared one
    if (profile.shareLifeExperience && profile.shareLifeExperience.trim() !== '') {
      await addUserExperience(profile);
    }

    // Update local state
    const newUserProfile = {
      id: user.uid,
      ...profile
    };
    setUserProfile(newUserProfile);

    // FIXED: Add to profiles list with minimal data IMMEDIATELY
    const minimalProfile = {
      id: user.uid,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      location: profile.location || '',
      thoughtOfTheDay: profile.thoughtOfTheDay || '',
      shareLifeExperience: profile.shareLifeExperience || '',
      thoughtLikes: 0,
      experienceLikes: 0
    };

    setProfiles(prev => {
      const existingIndex = prev.findIndex(p => p.id === user.uid);
      if (existingIndex >= 0) {
        const newProfiles = [...prev];
        newProfiles[existingIndex] = minimalProfile;
        return newProfiles;
      }
      return [...prev, minimalProfile];
    });

    // FIXED: Also reload all profiles to ensure consistency
    await loadProfiles();

    return profile;
  };

  // Delete profile function
  const deleteUserProfile = async () => {
    if (!user) throw new Error('User must be logged in');

    try {
      await deleteDoc(doc(db, 'profiles', user.uid));
      setUserProfile(null);

      // Remove from profiles list
      setProfiles(prev => prev.filter(p => p.id !== user.uid));

      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  const getUserExperience = async (userId) => {
    try {
      // Query experiences for this user
      const q = query(
        collection(db, 'experiences'),
        where('userId', '==', userId),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user experience:', error);
      return null;
    }
  };

  // Update addUserExperience function to check for existing experience
  const addUserExperience = async (profileData) => {
    if (!user) throw new Error('User must be logged in');

    // Only add if user has a life experience
    if (!profileData.shareLifeExperience || profileData.shareLifeExperience.trim() === '') {
      return null;
    }

    // Check if user already has an experience
    const existingExperience = await getUserExperience(user.uid);
    
    if (existingExperience) {
      // Update existing experience
      const experienceRef = doc(db, 'experiences', existingExperience.id);
      
      await updateDoc(experienceRef, {
        content: profileData.shareLifeExperience,
        updatedAt: serverTimestamp(),
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL
      });
      
      return existingExperience.id;
    } else {
      // Create new experience
      const experience = {
        userId: user.uid,
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL,
        content: profileData.shareLifeExperience,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
        isActive: true
      };

      try {
        const expRef = await addDoc(collection(db, 'experiences'), experience);

        // Update the profile with the experience ID
        if (userProfile) {
          await updateDoc(doc(db, 'profiles', user.uid), {
            experienceId: expRef.id,
            updatedAt: serverTimestamp()
          });
        }

        return expRef.id;
      } catch (error) {
        console.error('Error adding experience:', error);
        throw error;
      }
    }
  };

  // Update user profile and experience
  const updateUserProfile = async (profileData) => {
    if (!user) throw new Error('User must be logged in');

    try {
      const updates = {
        ...profileData,
        updatedAt: serverTimestamp()
      };

      // Update profile
      await updateDoc(doc(db, 'profiles', user.uid), updates);

      // Update local user profile
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));

      // Update the specific profile in the profiles list
      setProfiles(prev => prev.map(p => {
        if (p.id === user.uid) {
          return {
            ...p,
            displayName: profileData.displayName || p.displayName,
            photoURL: profileData.photoURL || p.photoURL,
            location: profileData.location || p.location,
            thoughtOfTheDay: profileData.thoughtOfTheDay || p.thoughtOfTheDay,
            shareLifeExperience: profileData.shareLifeExperience || p.shareLifeExperience
          };
        }
        return p;
      }));

      // Handle life experience update
      if (profileData.shareLifeExperience && profileData.shareLifeExperience.trim() !== '') {
        await addUserExperience(profileData);
      }

      console.log('✅ Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Fetch all experiences for the Life Experiences tab
  const fetchExperiences = async (limitCount = 20, lastDoc = null, sortBy = 'newest') => {
    try {
      console.log('🔥 DEBUG fetchExperiences:', { limitCount, sortBy, hasLastDoc: !!lastDoc });
      console.log('🔥 DEBUG fetchExperiences - Sorting by:', sortBy);
      console.log('🔥 DEBUG - Will order by field:', 
        sortBy === 'most_commented' ? 'comments' : 
        sortBy === 'most_liked' ? 'likeCount' : 'createdAt');

      let q;
      let orderField = 'createdAt';
      let orderDirection = 'desc';
      
      // Set order based on sort type - DATABASE LEVEL SORTING
      switch(sortBy) {
        case 'most_liked':
          orderField = 'likeCount';
          orderDirection = 'desc';
          break;
        case 'most_commented':
          orderField = 'commentCount';  
          orderDirection = 'desc';
          break;
        case 'newest':
        default:
          orderField = 'createdAt';
          orderDirection = 'desc';
          break;
      }
      
      if (lastDoc) {
        q = query(
          collection(db, 'experiences'),
          where('isActive', '==', true),
          orderBy(orderField, orderDirection),
          startAfter(lastDoc),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, 'experiences'),
          where('isActive', '==', true),
          orderBy(orderField, orderDirection),
          limit(limitCount)
        );
      }
      
      console.log('🔥 DEBUG: Query created with order:', orderField, orderDirection);
      
      const snapshot = await getDocs(q);
      console.log(`🔥 DEBUG: Query returned ${snapshot.size} documents`);
      
      const experiences = [];
      let lastVisible = null;

      snapshot.forEach((doc, index) => {
        const data = doc.data();
        
        // Log each experience for debugging
        console.log(`🔥 DEBUG ${index + 1}. ${doc.id}:`, {
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          content: data.content?.substring(0, 50) + '...',
          likeCount: data.likeCount,
          commentCount: data.commentCount,
          createdAt: data.createdAt
        });
        
        // Convert Firestore timestamp to Date if needed
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
        
        experiences.push({
          id: doc.id,
          ...data,
          createdAt: createdAt,
          likeCount: Number(data.likeCount) || 0,
          commentCount: Number(data.commentCount) || 0
        });
        lastVisible = doc;
      });

      console.log(`🔥 DEBUG: Returning ${experiences.length} experiences`);
      console.log(`🔥 DEBUG: Has more? ${experiences.length === limitCount}`);
      
      return {
        experiences,
        lastDoc: lastVisible,
        hasMore: experiences.length === limitCount
      };
    } catch (error) {
      console.error('🔥 ERROR fetchExperiences:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Check for index error
      if (error.code === 'failed-precondition') {
        console.error('🚨 FIREBASE INDEX ERROR DETECTED!');
        console.error('You need to create composite indexes in Firebase Console:');
        console.error('1. Collection: experiences, Fields: isActive (Ascending), createdAt (Descending)');
        console.error('2. Collection: experiences, Fields: isActive (Ascending), likeCount (Descending)');
        console.error('3. Collection: experiences, Fields: isActive (Ascending), commentCount (Descending)');
      }
      
      return { experiences: [], lastDoc: null, hasMore: false };
    }
  };

  // Add real-time listener for experiences
  const subscribeToExperiences = (callback) => {
    const q = query(
      collection(db, 'experiences'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const experiences = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(experiences);
    });
  };

  // Fetch full profile data (only when clicked)
  const fetchFullProfile = useCallback(async (profileId) => {
    // Check cache first
    if (fullProfileCache[profileId]) {
      return fullProfileCache[profileId];
    }

    try {
      const profileRef = doc(db, 'profiles', profileId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const fullData = {
          id: profileId,
          ...data,
          // Ensure like fields exist
          thoughtLikes: data.thoughtLikes || 0,
          thoughtLikers: data.thoughtLikers || [],
          experienceLikes: data.experienceLikes || 0,
          experienceLikers: data.experienceLikers || []
        };

        // Cache the full data
        setFullProfileCache(prev => ({
          ...prev,
          [profileId]: fullData
        }));

        return fullData;
      }
    } catch (error) {
      console.error('Error fetching full profile:', error);
    }

    return null;
  }, [fullProfileCache]);

  // Load minimal profile data for grid
  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(
        profilesRef,
        orderBy('createdAt'),
        limit(10000)
      );

      const snapshot = await getDocs(q);
      const profilesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || 'Anonymous',
          photoURL: data.photoURL || 'https://i.pravatar.cc/150?u=default',
          location: data.location || '',
          thoughtOfTheDay: data.thoughtOfTheDay || '',
          shareLifeExperience: data.shareLifeExperience || '',
          thoughtLikes: data.thoughtLikes || 0,
          thoughtLikers: data.thoughtLikers || [],
          experienceLikes: data.experienceLikes || 0,
          experienceLikers: data.experienceLikers || []
        };
      });

      setProfiles(profilesData);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  // Clear all profiles
  const clearAllProfiles = async () => {
    if (profiles.length === 0) return 0;

    try {
      setProfilesLoading(true);
      const batch = writeBatch(db);

      // Limit batch size to avoid Firebase limits
      const batchSize = Math.min(profiles.length, 500);
      const profilesToDelete = profiles.slice(0, batchSize);

      profilesToDelete.forEach(profile => {
        const profileRef = doc(db, 'profiles', profile.id);
        batch.delete(profileRef);
      });

      await batch.commit();

      // Remove from local state
      setProfiles([]);
      setFullProfileCache({});

      return profilesToDelete.length;
    } catch (error) {
      console.error('Error clearing profiles:', error);
      throw error;
    } finally {
      setProfilesLoading(false);
    }
  };

  // Like functions
  const likeThought = async (targetUserId) => {
    if (!user) throw new Error('User must be logged in');

    try {
      const profileRef = doc(db, 'profiles', targetUserId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        throw new Error('Profile not found');
      }

      const profileData = profileSnap.data();
      const currentLikers = profileData.thoughtLikers || [];

      // Check if already liked
      const hasLiked = currentLikers.includes(user.uid);

      // Prepare updates
      const updates = {
        thoughtLikers: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      };

      // Calculate new like count
      const currentLikes = profileData.thoughtLikes || 0;
      updates.thoughtLikes = hasLiked ? currentLikes - 1 : currentLikes + 1;

      // Add updatedAt timestamp
      updates.updatedAt = serverTimestamp();

      await updateDoc(profileRef, updates);

      // Update local cache if it's the current user's profile
      if (targetUserId === user.uid && userProfile) {
        setUserProfile(prev => ({
          ...prev,
          thoughtLikers: hasLiked
            ? prev.thoughtLikers.filter(id => id !== user.uid)
            : [...prev.thoughtLikers, user.uid],
          thoughtLikes: hasLiked ? prev.thoughtLikes - 1 : prev.thoughtLikes + 1
        }));
      }

      // Update the specific profile in the profiles list
      setProfiles(prev => prev.map(p => {
        if (p.id === targetUserId) {
          return {
            ...p,
            thoughtLikers: hasLiked
              ? (p.thoughtLikers || []).filter(id => id !== user.uid)
              : [...(p.thoughtLikers || []), user.uid],
            thoughtLikes: hasLiked ? (p.thoughtLikes || 1) - 1 : (p.thoughtLikes || 0) + 1
          };
        }
        return p;
      }));

      // Update full profile cache if it exists
      if (fullProfileCache[targetUserId]) {
        setFullProfileCache(prev => ({
          ...prev,
          [targetUserId]: {
            ...prev[targetUserId],
            thoughtLikers: hasLiked
              ? prev[targetUserId].thoughtLikers.filter(id => id !== user.uid)
              : [...prev[targetUserId].thoughtLikers, user.uid],
            thoughtLikes: hasLiked ? prev[targetUserId].thoughtLikes - 1 : prev[targetUserId].thoughtLikes + 1
          }
        }));
      }

      console.log(`✅ Thought ${hasLiked ? 'unliked' : 'liked'} for user ${targetUserId}`);
      return !hasLiked; // Return new like state (true = now liked, false = now unliked)
    } catch (error) {
      console.error('Error toggling thought like:', error);
      throw error;
    }
  };

  const likeExperience = async (experienceId) => {
    if (!user) throw new Error('User must be logged in');

    try {
      const experienceRef = doc(db, 'experiences', experienceId);
      const experienceSnap = await getDoc(experienceRef);

      if (!experienceSnap.exists()) {
        throw new Error('Experience not found');
      }

      const experienceData = experienceSnap.data();
      const hasLiked = experienceData.likedBy?.includes(user.uid) || false;

      const updates = {
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likeCount: increment(hasLiked ? -1 : 1),
        updatedAt: serverTimestamp()
      };

      await updateDoc(experienceRef, updates);

      // Create notification if it's a new like
      if (!hasLiked && experienceData.userId !== user.uid) {
        console.log('🔔 Creating like notification for experience owner:', experienceData.userId);
        
        await createLikeNotification({
          experienceId,
          experienceOwnerId: experienceData.userId,
          likerId: user.uid,
          likerName: user.displayName,
          likerPhotoURL: user.photoURL,
          experienceContent: experienceData.content
        });
      }

      return !hasLiked;
    } catch (error) {
      console.error('Error toggling experience like:', error);
      throw error;
    }
  };

  const addTestExperience = async (profileData, profileId) => {
    try {
      const experience = {
        userId: profileId,
        userDisplayName: profileData.displayName,
        userPhotoURL: profileData.photoURL,
        content: profileData.shareLifeExperience || profileData.lifeExperience || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: profileData.experienceLikes || 0,
        commentCount: 0,
        isActive: true
      };

      const expRef = await addDoc(collection(db, 'experiences'), experience);

      // Update the profile with the experience ID
      await updateDoc(doc(db, 'profiles', profileId), {
        experienceId: expRef.id,
        updatedAt: serverTimestamp()
      });

      return expRef.id;
    } catch (error) {
      console.error('Error adding test experience:', error);
      throw error;
    }
  };

  // ============= UNIFIED COMMENT SYSTEM WITH NOTIFICATIONS =============
  const addComment = async (experienceId, commentText, parentCommentId = null) => {
    if (!user) throw new Error('User must be logged in');

    try {
      // Add comment to experiences/{experienceId}/comments
      const commentRef = await addDoc(
        collection(db, 'experiences', experienceId, 'comments'),
        {
          userId: user.uid,
          userDisplayName: user.displayName,
          userPhotoURL: user.photoURL,
          content: commentText,
          createdAt: serverTimestamp(),
          parentCommentId: parentCommentId,
          depth: parentCommentId ? 1 : 0,
          likeCount: 0,
          likedBy: []
        }
      );

      // Update experience comment count
      const experienceRef = doc(db, 'experiences', experienceId);
      await updateDoc(experienceRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp()
      });

      // Get experience details for notification
      const experience = await getExperienceById(experienceId);
      
      // Create notifications
      if (experience) {
        // Notify experience owner if it's a new comment (not reply)
        if (!parentCommentId && experience.userId !== user.uid) {
          await createCommentNotification({
            experienceId,
            experienceOwnerId: experience.userId,
            commenterId: user.uid,
            commenterName: user.displayName,
            commenterPhotoURL: user.photoURL,
            commentContent: commentText,
            experienceContent: experience.content
          });
        }

        // If it's a reply, notify the original commenter
        if (parentCommentId) {
          const parentComment = await getCommentById(experienceId, parentCommentId);
          if (parentComment && parentComment.userId !== user.uid) {
            await createReplyNotification({
              experienceId,
              originalCommenterId: parentComment.userId,
              replierId: user.uid,
              replierName: user.displayName,
              replierPhotoURL: user.photoURL,
              replyContent: commentText,
              parentCommentId,
              experienceContent: experience.content
            });
          }
        }
      }

      // Return the comment object for immediate UI update
      return {
        id: commentRef.id,
        userId: user.uid,
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL,
        content: commentText,
        createdAt: new Date(),
        parentCommentId: parentCommentId,
        depth: parentCommentId ? 1 : 0,
        likeCount: 0,
        likedBy: []
      };

    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Fetch comments for an experience
  const fetchComments = async (experienceId, limitCount = 10, lastDoc = null) => {
    try {
      console.log(`Fetching comments for experience: ${experienceId}, limit: ${limitCount}`);
      
      let q = query(
        collection(db, 'experiences', experienceId, 'comments'),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const comments = [];
      let lastVisible = null;

      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Ensure all required fields exist
        const comment = {
          id: doc.id,
          userId: data.userId || 'unknown_user',
          userDisplayName: data.userDisplayName || 'Anonymous',
          userPhotoURL: data.userPhotoURL || 'https://i.pravatar.cc/150',
          content: data.content || '',
          createdAt: data.createdAt,
          parentCommentId: data.parentCommentId || null,
          depth: data.depth || 0,
          likeCount: data.likeCount || 0,
          likedBy: data.likedBy || [],
          ...data
        };
        
        comments.push(comment);
        lastVisible = doc;
      });

      console.log(`Found ${comments.length} comments for experience ${experienceId}`);
      
      return {
        comments,
        lastDoc: lastVisible
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { comments: [], lastDoc: null };
    }
  };

  // Like/unlike a comment
  const likeComment = async (experienceId, commentId) => {
    if (!user) throw new Error('User must be logged in');

    try {
      const commentRef = doc(db, 'experiences', experienceId, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        console.log('Comment not found:', { experienceId, commentId });
        throw new Error('Comment not found');
      }

      const commentData = commentSnap.data();
      const hasLiked = commentData.likedBy?.includes(user.uid) || false;

      const updates = {
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likeCount: increment(hasLiked ? -1 : 1),
        updatedAt: serverTimestamp()
      };

      await updateDoc(commentRef, updates);

      return !hasLiked;
    } catch (error) {
      console.error('Error toggling comment like:', error, { experienceId, commentId });
      throw error;
    }
  };
  // ============= END UNIFIED COMMENT SYSTEM =============

  // TEST FUNCTIONS
  const addTestProfile = async () => {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testNames = ['Alex Johnson', 'Maria Garcia', 'James Smith', 'Sarah Chen', 'Mike Brown', 'Lisa Wang', 'David Kim', 'Emma Davis'];
    const testLocations = ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia', 'Berlin, Germany', 'Toronto, Canada'];
    const testInterests = ['Programming, Hiking, Music', 'Photography, Travel, Food', 'Gaming, AI, Robotics', 'Art, Design, Fashion', 'Sports, Cooking, Reading'];
    const testThoughts = [
      "The only way to do great work is to love what you do.",
      "Innovation distinguishes between a leader and a follower.",
      "The future belongs to those who believe in the beauty of their dreams.",
      "Don't watch the clock; do what it does. Keep going.",
      "The best time to plant a tree was 20 years ago. The second best time is now."
    ];
    const testLifeExperiences = [
      "Traveled across Asia for 6 months, learning about different cultures and philosophies. The journey taught me that happiness comes from within.",
      "Built my first startup at 22, failed, but learned invaluable lessons about resilience and perseverance that shaped my career.",
      "Survived a hiking accident in the Andes that taught me the true meaning of teamwork and trusting others in difficult situations.",
      "Volunteered in a remote village in Africa for a year, which completely changed my perspective on what really matters in life.",
      "Overcame a serious illness that made me appreciate every single day and find joy in the smallest moments."
    ];

    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
    const randomInterests = testInterests[Math.floor(Math.random() * testInterests.length)];
    const randomThought = testThoughts[Math.floor(Math.random() * testThoughts.length)];
    const randomLifeExperience = testLifeExperiences[Math.floor(Math.random() * testLifeExperiences.length)];

    const testProfile = {
      userId: testId,
      email: `${randomName.toLowerCase().replace(' ', '.')}@test.com`,
      displayName: randomName,
      photoURL: `https://i.pravatar.cc/150?u=${testId}`,
      thoughtOfTheDay: randomThought,
      shareLifeExperience: randomLifeExperience,
      thoughtLikes: Math.floor(Math.random() * 20),
      thoughtLikers: [],
      experienceLikes: Math.floor(Math.random() * 15),
      experienceLikers: [],
      website: 'https://example.com',
      location: randomLocation,
      interests: randomInterests,
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isTest: true
    };

    // Create profile
    await setDoc(doc(db, 'profiles', testId), testProfile);
    
    // Create experience if there's life experience content
    if (randomLifeExperience && randomLifeExperience.trim() !== '') {
      const experienceId = `exp_${testId}`;
      const experience = {
        userId: testId,
        userDisplayName: randomName,
        userPhotoURL: `https://i.pravatar.cc/150?u=${testId}`,
        content: randomLifeExperience,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: testProfile.experienceLikes || 0,
        commentCount: 0,
        likedBy: [], 
        isActive: true
      };
      
      await setDoc(doc(db, 'experiences', experienceId), experience);
      
      // Update profile with experience ID
      await updateDoc(doc(db, 'profiles', testId), {
        experienceId: experienceId,
        updatedAt: serverTimestamp()
      });
    }

    // Refresh profiles
    await loadProfiles();

    return testProfile;
  };

  const createBulkTestProfiles = async (count) => {
    setProfilesLoading(true);
    let profileBatch = writeBatch(db);
    let experienceBatch = writeBatch(db);
    
    const profilesToCreate = Math.min(count, 1000);
    console.log(`Starting bulk creation of ${profilesToCreate} profiles with experiences...`);

    let createdCount = 0;
    let experienceCount = 0;
    
    // Arrays to track profiles that need experiences
    const profilesNeedingExperiences = [];

    for (let i = 0; i < profilesToCreate; i++) {
      const testId = `test_bulk_${Date.now()}_${i}`;
      const testNames = ['Alex', 'Maria', 'James', 'Sarah', 'Mike', 'Lisa', 'David', 'Emma'];
      const testLastNames = ['Johnson', 'Garcia', 'Smith', 'Chen', 'Brown', 'Wang', 'Kim', 'Davis'];
      const testLocations = ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin', 'Toronto'];
      const testThoughts = [
        "The only way to do great work is to love what you do.",
        "Innovation distinguishes between a leader and a follower.",
        "The future belongs to those who believe in the beauty of their dreams."
      ];
      const testLifeExperiences = [
        "Traveled across Asia for 6 months, learning about different cultures and philosophies. The journey taught me that happiness comes from within.",
        "Built my first startup at 22, failed, but learned invaluable lessons about resilience and perseverance that shaped my career.",
        "Survived a hiking accident in the Andes that taught me the true meaning of teamwork and trusting others in difficult situations.",
        "Volunteered in a remote village in Africa for a year, which completely changed my perspective on what really matters in life.",
        "Overcame a serious illness that made me appreciate every single day and find joy in the smallest moments.",
        "Moved to a new country without knowing anyone, forcing me to grow and become more independent than I ever thought possible.",
        "Learned a new language in my 30s, proving that it's never too late to challenge yourself and acquire new skills.",
        "Witnessed the birth of my first child, an experience that redefined my understanding of love and responsibility.",
        "Failed an important exam multiple times before finally passing, teaching me that persistence is more important than talent.",
        "Helped a stranger in need during a storm, which led to a lifelong friendship and taught me about the value of human connection."
      ];

      const randomName = `${testNames[Math.floor(Math.random() * testNames.length)]} ${testLastNames[Math.floor(Math.random() * testLastNames.length)]}`;
      const randomLocation = `${testLocations[Math.floor(Math.random() * testLocations.length)]}, ${['USA', 'UK', 'Japan', 'Australia', 'Germany', 'Canada'][Math.floor(Math.random() * 6)]}`;
      const randomThought = testThoughts[Math.floor(Math.random() * testThoughts.length)];
      const randomLifeExperience = testLifeExperiences[Math.floor(Math.random() * testLifeExperiences.length)];

      const testProfile = {
        userId: testId,
        email: `${randomName.toLowerCase().replace(' ', '.')}@test.com`,
        displayName: randomName,
        photoURL: `https://i.pravatar.cc/150?u=${testId}`,
        thoughtOfTheDay: randomThought,
        shareLifeExperience: randomLifeExperience,
        thoughtLikes: Math.floor(Math.random() * 30),
        thoughtLikers: [],
        experienceLikes: Math.floor(Math.random() * 20),
        experienceLikers: [],
        website: 'https://example.com',
        location: randomLocation,
        interests: 'Programming, Technology',
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isTest: true
      };

      // Create profile document
      const profileRef = doc(db, 'profiles', testId);
      profileBatch.set(profileRef, testProfile);
      createdCount++;

      // Store profile data for experience creation
      if (randomLifeExperience && randomLifeExperience.trim() !== '') {
        profilesNeedingExperiences.push({
          profileId: testId,
          profileData: testProfile
        });
      }

      // Commit profile batch every 100 operations
      if (createdCount % 100 === 0) {
        await profileBatch.commit();
        profileBatch = writeBatch(db);
        console.log(`Committed ${createdCount} profiles...`);
      }
    }

    // Commit any remaining profiles
    if (createdCount % 100 !== 0) {
      await profileBatch.commit();
    }

    console.log(`✅ Successfully created ${createdCount} test profiles!`);
    console.log(`Creating experiences for ${profilesNeedingExperiences.length} profiles...`);

    // Now create experiences for profiles that have life experiences
    for (let i = 0; i < profilesNeedingExperiences.length; i++) {
      const { profileId, profileData } = profilesNeedingExperiences[i];
      const experienceId = `exp_${profileId}`;
      
      const experience = {
        userId: profileId,
        userDisplayName: profileData.displayName,
        userPhotoURL: profileData.photoURL,
        content: profileData.shareLifeExperience,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: profileData.experienceLikes || 0,
        commentCount: 0,
        likedBy: [], 
        isActive: true
      };

      // Create experience document
      const experienceRef = doc(db, 'experiences', experienceId);
      experienceBatch.set(experienceRef, experience);
      experienceCount++;

      // Update profile with experience ID (in a separate update since we can't modify same doc in different batch)
      const profileRef = doc(db, 'profiles', profileId);
      await updateDoc(profileRef, {
        experienceId: experienceId,
        updatedAt: serverTimestamp()
      });

      // Commit experience batch every 100 operations
      if (experienceCount % 100 === 0) {
        await experienceBatch.commit();
        experienceBatch = writeBatch(db);
        console.log(`Committed ${experienceCount} experiences...`);
      }
    }

    // Commit any remaining experiences
    if (experienceCount % 100 !== 0) {
      await experienceBatch.commit();
    }

    console.log(`✅ Successfully created ${createdCount} test profiles with ${experienceCount} experiences!`);

    // Refresh profiles
    await loadProfiles();

    return createdCount;
  };

  // REAL-TIME NOTIFICATIONS LISTENER
  useEffect(() => {
    let unsubscribe = null;
    
    if (user?.uid) {
      console.log('🔔 Setting up real-time notifications listener for user:', user.uid);
      setLoadingNotifications(true);
      
      const notificationsRef = collection(db, 'notifications', user.uid, 'userNotifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const notificationsList = [];
        let unread = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const notification = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : null
          };
          
          notificationsList.push(notification);
          if (!notification.isRead) unread++;
        });
        
        console.log(`📢 Real-time notifications updated: ${notificationsList.length} total, ${unread} unread`);
        setNotifications(notificationsList);
        setUnreadCount(unread);
        setLoadingNotifications(false);
      }, (error) => {
        console.error('❌ Error in real-time notifications:', error);
        setLoadingNotifications(false);
      });
    } else {
      console.log('🔕 No user, clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
    }
    
    return () => {
      if (unsubscribe) {
        console.log('🔕 Cleaning up notifications listener');
        unsubscribe();
      }
    };
  }, [user]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Load user's profile
        try {
          const profileRef = doc(db, 'profiles', user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setUserProfile({
              id: user.uid,
              ...profileData
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load profiles when auth state changes
  useEffect(() => {
    const loadProfilesOnAuthChange = async () => {
      // Only load profiles if not already loading
      if (!profilesLoading && user !== null) {
        await loadProfiles();
      }
    };

    loadProfilesOnAuthChange();
  }, [user]); // Trigger when user changes (login/logout)

  // Load initial profiles
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Context value
  const value = {
    user,
    userProfile,
    profiles,
    profilesLoading,
    // Notification states
    notifications,
    unreadCount,
    loadingNotifications,
    // Notification functions
    markNotificationAsRead,
    markAllNotificationsAsRead,
    // Debug functions (optional - you can remove these)
    debugNotifications,
    testNotification,
    // Auth functions
    signInWithGoogle,
    logout,
    // Profile functions
    createUserProfile,
    deleteUserProfile,
    fetchFullProfile,
    clearAllProfiles,
    loadProfiles,
    // Like functions
    likeThought,
    likeExperience,
    // Experience functions
    fetchExperiences,
    subscribeToExperiences,
    addUserExperience,
    // Comment functions
    addComment,
    fetchComments,
    likeComment,
    // Test functions
    addTestProfile,
    createBulkTestProfiles
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};