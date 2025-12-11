// File: services/likeService.js
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

export const likeService = {
  // Like a thought
  likeThought: async (targetUserId, currentUserId) => {
    try {
      const profileRef = doc(db, 'profiles', targetUserId);
      
      await updateDoc(profileRef, {
        thoughtLikes: arrayUnion(currentUserId), // Add user to likers array
        thoughtLikesCount: arrayUnion(currentUserId).length // Calculate count
      });
      
      return true;
    } catch (error) {
      console.error('Error liking thought:', error);
      throw error;
    }
  },

  // Unlike a thought
  unlikeThought: async (targetUserId, currentUserId) => {
    try {
      const profileRef = doc(db, 'profiles', targetUserId);
      
      await updateDoc(profileRef, {
        thoughtLikers: arrayRemove(currentUserId),
        thoughtLikes: arrayRemove(currentUserId).length
      });
      
      return true;
    } catch (error) {
      console.error('Error unliking thought:', error);
      throw error;
    }
  },

  // Like an experience
  likeExperience: async (targetUserId, currentUserId) => {
    try {
      const profileRef = doc(db, 'profiles', targetUserId);
      
      await updateDoc(profileRef, {
        experienceLikers: arrayUnion(currentUserId),
        experienceLikes: arrayUnion(currentUserId).length
      });
      
      return true;
    } catch (error) {
      console.error('Error liking experience:', error);
      throw error;
    }
  },

  // Unlike an experience
  unlikeExperience: async (targetUserId, currentUserId) => {
    try {
      const profileRef = doc(db, 'profiles', targetUserId);
      
      await updateDoc(profileRef, {
        experienceLikers: arrayRemove(currentUserId),
        experienceLikes: arrayRemove(currentUserId).length
      });
      
      return true;
    } catch (error) {
      console.error('Error unliking experience:', error);
      throw error;
    }
  },

  // Toggle like (smart function that checks current state)
  toggleLike: async (targetUserId, currentUserId, contentType) => {
    // This will be implemented after we fetch current state
    console.log(`Toggling ${contentType} like for user ${targetUserId}`);
  }
};