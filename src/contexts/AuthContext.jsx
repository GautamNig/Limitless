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
  arrayRemove      
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

  // Auth functions
  const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    setUserProfile(null);
    setProfiles([]);
    setFullProfileCache({});
    return signOut(auth);
  };

  // Profile functions
  const createUserProfile = async (profileData) => {
  if (!user) throw new Error('User must be logged in');
  
  const profile = {
    ...profileData,
    thoughtOfTheDay: profileData.thoughtOfTheDay || '',
    shareLifeExperience: profileData.shareLifeExperience || '',
    
    // NEW LIKE FIELDS
    thoughtLikes: 0,
    thoughtLikers: [], // Array of user IDs who liked thought
    experienceLikes: 0,
    experienceLikers: [], // Array of user IDs who liked experience
    
    // Existing fields
    userId: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(doc(db, 'profiles', user.uid), profile);
  
  // Update local state
  setUserProfile({
    id: user.uid,
    ...profile
  });
  
  // Add to profiles list with minimal data
  setProfiles(prev => {
    const existingIndex = prev.findIndex(p => p.id === user.uid);
    const minimalProfile = {
      id: user.uid,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      location: profile.location || '',
      thoughtOfTheDay: profile.thoughtOfTheDay || '',
      shareLifeExperience: profile.shareLifeExperience || '',
      // Include like counts in minimal profile
      thoughtLikes: 0,
      experienceLikes: 0
    };
    
    if (existingIndex >= 0) {
      const newProfiles = [...prev];
      newProfiles[existingIndex] = minimalProfile;
      return newProfiles;
    }
    return [...prev, minimalProfile];
  });
  
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
        
        // NEW: Like fields
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
    updates.updatedAt = new Date();
    
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

const likeExperience = async (targetUserId) => {
  if (!user) throw new Error('User must be logged in');
  
  try {
    const profileRef = doc(db, 'profiles', targetUserId);
    const profileSnap = await getDoc(profileRef);
    
    if (!profileSnap.exists()) {
      throw new Error('Profile not found');
    }
    
    const profileData = profileSnap.data();
    const currentLikers = profileData.experienceLikers || [];
    
    // Check if already liked
    const hasLiked = currentLikers.includes(user.uid);
    
    // Prepare updates
    const updates = {
      experienceLikers: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    };
    
    // Calculate new like count
    const currentLikes = profileData.experienceLikes || 0;
    updates.experienceLikes = hasLiked ? currentLikes - 1 : currentLikes + 1;
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    await updateDoc(profileRef, updates);
    
    // Update local cache if it's the current user's profile
    if (targetUserId === user.uid && userProfile) {
      setUserProfile(prev => ({
        ...prev,
        experienceLikers: hasLiked 
          ? prev.experienceLikers.filter(id => id !== user.uid)
          : [...prev.experienceLikers, user.uid],
        experienceLikes: hasLiked ? prev.experienceLikes - 1 : prev.experienceLikes + 1
      }));
    }
    
    // Update the specific profile in the profiles list
    setProfiles(prev => prev.map(p => {
      if (p.id === targetUserId) {
        return {
          ...p,
          experienceLikers: hasLiked 
            ? (p.experienceLikers || []).filter(id => id !== user.uid)
            : [...(p.experienceLikers || []), user.uid],
          experienceLikes: hasLiked ? (p.experienceLikes || 1) - 1 : (p.experienceLikes || 0) + 1
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
          experienceLikers: hasLiked 
            ? prev[targetUserId].experienceLikers.filter(id => id !== user.uid)
            : [...prev[targetUserId].experienceLikers, user.uid],
          experienceLikes: hasLiked ? prev[targetUserId].experienceLikes - 1 : prev[targetUserId].experienceLikes + 1
        }
      }));
    }
    
    console.log(`✅ Experience ${hasLiked ? 'unliked' : 'liked'} for user ${targetUserId}`);
    return !hasLiked; // Return new like state
  } catch (error) {
    console.error('Error toggling experience like:', error);
    throw error;
  }
};

  // TEST FUNCTIONS - Add these back
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
    "Traveled across Asia for 6 months, learning about different cultures and philosophies.",
    "Built my first startup at 22, failed, but learned invaluable lessons about resilience.",
    "Survived a hiking accident in the Andes that taught me the true meaning of teamwork.",
    "Volunteered in a remote village in Africa for a year, changed my perspective on life.",
    "Overcame a serious illness that made me appreciate every single day."
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
    
    // NEW: Random like counts for testing
    thoughtLikes: Math.floor(Math.random() * 20), // 0-19 random likes
    thoughtLikers: [],
    experienceLikes: Math.floor(Math.random() * 15), // 0-14 random likes
    experienceLikers: [],
    
    website: 'https://example.com',
    location: randomLocation,
    interests: randomInterests,
    createdAt: new Date(),
    updatedAt: new Date(),
    isTest: true
  };

  await setDoc(doc(db, 'profiles', testId), testProfile);
  
  // Refresh profiles
  await loadProfiles();
  
  return testProfile;
};

  const createBulkTestProfiles = async (count) => {
  setProfilesLoading(true);
  let batch = writeBatch(db);
  const profilesToCreate = Math.min(count, 1000);
  
  console.log(`Starting bulk creation of ${profilesToCreate} profiles...`);
  
  let createdCount = 0;
  
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
      "Traveled across Asia for 6 months.",
      "Built my first startup at 22.",
      "Survived a hiking accident in the Andes."
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
      
      // NEW: Random like counts
      thoughtLikes: Math.floor(Math.random() * 30),
      thoughtLikers: [],
      experienceLikes: Math.floor(Math.random() * 20),
      experienceLikers: [],
      
      website: 'https://example.com',
      location: randomLocation,
      interests: 'Programming, Technology',
      createdAt: new Date(),
      updatedAt: new Date(),
      isTest: true
    };

    const profileRef = doc(db, 'profiles', testId);
    batch.set(profileRef, testProfile);
    createdCount++;
    
    // Commit in batches of 100
    if (createdCount % 100 === 0) {
      await batch.commit();
      batch = writeBatch(db);
      console.log(`Committed ${createdCount} profiles...`);
    }
  }
  
  // Commit remaining
  if (createdCount % 100 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ Successfully created ${createdCount} test profiles with like counts!`);
  
  // Refresh profiles
  await loadProfiles();
  
  return createdCount;
};

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
    signInWithGoogle,
    logout,
    createUserProfile,
    deleteUserProfile,
    fetchFullProfile,
    clearAllProfiles,
    loadProfiles,
    likeThought,
    likeExperience,
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