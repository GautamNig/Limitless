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
  deleteDoc
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
        thoughtOfTheDay: profile.thoughtOfTheDay || ''
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
        const fullData = { id: profileId, ...profileSnap.data() };
        
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
          location: data.location || ''
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

    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
    const randomInterests = testInterests[Math.floor(Math.random() * testInterests.length)];
    const randomThought = testThoughts[Math.floor(Math.random() * testThoughts.length)];
    const testProfile = {
      userId: testId,
      email: `${randomName.toLowerCase().replace(' ', '.')}@test.com`,
      displayName: randomName,
      photoURL: `https://i.pravatar.cc/150?u=${testId}`,
      thoughtOfTheDay: randomThought,
      website: 'https://example.com',
      location: randomLocation,
      interests: randomInterests,
      skills: randomSkills,
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
    const profilesToCreate = Math.min(count, 1000); // Lower limit for safety
    
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
    "The future belongs to those who believe in the beauty of their dreams.",
    "Don't watch the clock; do what it does. Keep going.",
    "The best time to plant a tree was 20 years ago. The second best time is now."
  ];

      const randomName = `${testNames[Math.floor(Math.random() * testNames.length)]} ${testLastNames[Math.floor(Math.random() * testLastNames.length)]}`;
      const randomLocation = `${testLocations[Math.floor(Math.random() * testLocations.length)]}, ${['USA', 'UK', 'Japan', 'Australia', 'Germany', 'Canada'][Math.floor(Math.random() * 6)]}`;
      const randomThought = testThoughts[Math.floor(Math.random() * testThoughts.length)];

      const testProfile = {
        userId: testId,
        email: `${randomName.toLowerCase().replace(' ', '.')}@test.com`,
        displayName: randomName,
        photoURL: `https://i.pravatar.cc/150?u=${testId}`,
        thoughtOfTheDay: randomThought,
        website: 'https://example.com',
        location: randomLocation,
        interests: 'Programming, Technology',
        skills: 'JavaScript, React, Node.js',
        createdAt: new Date(),
        updatedAt: new Date(),
        isTest: true
      };

      const profileRef = doc(db, 'profiles', testId);
      batch.set(profileRef, testProfile);
      createdCount++;
      
      // Commit in batches of 100 to avoid Firebase limits
      if (createdCount % 100 === 0) {
        await batch.commit();
        batch = writeBatch(db);
        console.log(`Committed ${createdCount} profiles...`);
      }
    }
    
    // Commit any remaining profiles
    if (createdCount % 100 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully created ${createdCount} test profiles!`);
    
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