import { createContext, useContext, useEffect, useState } from 'react';
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
  onSnapshot,
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

  // Auth functions
  const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  // Profile functions
  const createUserProfile = async (profileData) => {
    if (!user) throw new Error('User must be logged in');
    
    // Check if user already has a profile
    const existingProfile = profiles.find(p => p.userId === user.uid);
    
    const profile = {
      ...profileData,
      userId: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: new Date(),
      // Only set createdAt for new profiles
      ...(!existingProfile && { createdAt: new Date() }),
      // Keep existing createdAt if updating
      ...(existingProfile && { createdAt: existingProfile.createdAt })
    };

    await setDoc(doc(db, 'profiles', user.uid), profile);
    
    // Update local state
    setUserProfile({
      id: user.uid,
      ...profile
    });
    
    return profile;
  };

  // Add delete profile function
  const deleteUserProfile = async () => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await deleteDoc(doc(db, 'profiles', user.uid));
      setUserProfile(null);
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  // Add get user profile function
  const getUserProfile = () => {
    return userProfile;
  };

  const fetchUserProfile = async (userId) => {
    try {
      const profileDoc = await getDocs(collection(db, 'profiles'));
      const userProfileDoc = profileDoc.docs.find(doc => doc.id === userId);
      
      if (userProfileDoc) {
        setUserProfile({
          id: userProfileDoc.id,
          ...userProfileDoc.data()
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Test profile functions
  const addTestProfile = async () => {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testNames = ['Alex Johnson', 'Maria Garcia', 'James Smith', 'Sarah Chen', 'Mike Brown', 'Lisa Wang', 'David Kim', 'Emma Davis'];
    const testLocations = ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia', 'Berlin, Germany', 'Toronto, Canada'];
    const testInterests = ['Programming, Hiking, Music', 'Photography, Travel, Food', 'Gaming, AI, Robotics', 'Art, Design, Fashion', 'Sports, Cooking, Reading'];
    const testSkills = ['JavaScript, React, Node.js', 'Python, Django, ML', 'Java, Spring, AWS', 'Swift, iOS, Mobile', 'C#, .NET, SQL'];
    
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
    const randomInterests = testInterests[Math.floor(Math.random() * testInterests.length)];
    const randomSkills = testSkills[Math.floor(Math.random() * testSkills.length)];
    
    const testProfile = {
      userId: testId,
      email: `${randomName.toLowerCase().replace(' ', '.')}@test.com`,
      displayName: randomName,
      photoURL: `https://i.pravatar.cc/150?u=${testId}`,
      bio: `Hello! I'm ${randomName}, a passionate developer from ${randomLocation}. Love creating amazing things!`,
      website: 'https://example.com',
      location: randomLocation,
      interests: randomInterests,
      skills: randomSkills,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTest: true
    };

    await setDoc(doc(db, 'profiles', testId), testProfile);
    return testProfile;
  };

  // Bulk create test profiles
  const createBulkTestProfiles = async (count) => {
    let batch = writeBatch(db);
    const profilesToCreate = Math.min(count, 1000000);
    
    console.log(`Starting bulk creation of ${profilesToCreate} profiles...`);
    
    for (let i = 0; i < profilesToCreate; i++) {
      const testId = `test_bulk_${Date.now()}_${i}`;
      const testNames = ['Alex', 'Maria', 'James', 'Sarah', 'Mike', 'Lisa', 'David', 'Emma', 'John', 'Anna', 'Chris', 'Laura', 'Daniel', 'Sophia', 'Robert'];
      const testLastNames = ['Johnson', 'Garcia', 'Smith', 'Chen', 'Brown', 'Wang', 'Kim', 'Davis', 'Wilson', 'Taylor', 'Miller', 'Anderson', 'Thomas', 'Jackson', 'White'];
      const testLocations = ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin', 'Toronto', 'Paris', 'Singapore', 'Dubai', 'Mumbai', 'San Francisco', 'Shanghai', 'Seoul', 'Moscow', 'São Paulo'];
      const testInterests = ['Programming', 'Hiking', 'Music', 'Photography', 'Travel', 'Food', 'Gaming', 'AI', 'Robotics', 'Art', 'Sports', 'Reading', 'Movies', 'Cooking', 'Dancing'];
      const testSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'Django', 'ML', 'Java', 'Spring', 'AWS', 'Swift', 'TypeScript', 'Vue', 'Angular', 'PHP', 'Ruby'];
      
      const randomName = `${testNames[Math.floor(Math.random() * testNames.length)]} ${testLastNames[Math.floor(Math.random() * testLastNames.length)]}`;
      const randomLocation = `${testLocations[Math.floor(Math.random() * testLocations.length)]}, ${['USA', 'UK', 'Japan', 'Australia', 'Germany', 'Canada', 'France', 'Singapore', 'UAE', 'India', 'China', 'Brazil', 'Russia', 'South Korea', 'Mexico'][Math.floor(Math.random() * 15)]}`;
      
      const randomInterests = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => 
        testInterests[Math.floor(Math.random() * testInterests.length)]
      ).join(', ');
      
      const randomSkills = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => 
        testSkills[Math.floor(Math.random() * testSkills.length)]
      ).join(', ');

      const testProfile = {
        userId: testId,
        email: `${randomName.toLowerCase().replace(' ', '.')}@test.com`,
        displayName: randomName,
        photoURL: `https://i.pravatar.cc/150?u=${testId}`,
        bio: `Hello! I'm ${randomName}, a passionate developer from ${randomLocation}. Love creating amazing things with technology!`,
        website: 'https://example.com',
        location: randomLocation,
        interests: randomInterests,
        skills: randomSkills,
        createdAt: new Date(),
        updatedAt: new Date(),
        isTest: true
      };

      const profileRef = doc(db, 'profiles', testId);
      batch.set(profileRef, testProfile);
      
      if (i % 500 === 0 && i > 0) {
        await batch.commit();
        batch = writeBatch(db);
        console.log(`Committed batch up to ${i} profiles...`);
      }
      
      if (i % 10000 === 0 && i > 0) {
        console.log(`Progress: ${i}/${profilesToCreate} profiles created...`);
      }
    }
    
    const remaining = profilesToCreate % 500;
    if (remaining > 0 || profilesToCreate === 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully created ${profilesToCreate} test profiles!`);
    return profilesToCreate;
  };

  // Clear all test profiles
  const clearTestProfiles = async () => {
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    profiles.forEach(profile => {
      if (profile.isTest || profile.id.startsWith('test_')) {
        const profileRef = doc(db, 'profiles', profile.id);
        batch.delete(profileRef);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      await batch.commit();
    }
    
    return deletedCount;
  };

  // Clear all profiles (including real ones - use with caution)
  const clearAllProfiles = async () => {
    const batch = writeBatch(db);
    
    profiles.forEach(profile => {
      const profileRef = doc(db, 'profiles', profile.id);
      batch.delete(profileRef);
    });
    
    await batch.commit();
    return profiles.length;
  };

  // Effects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Real-time listener for profiles
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProfiles(profilesData);
    }, (error) => {
      console.error('Error in profiles snapshot:', error);
    });

    return unsubscribe;
  }, []);

  // Context value - MAKE SURE deleteUserProfile IS INCLUDED
  const value = {
    user,
    userProfile,
    profiles,
    signInWithGoogle,
    logout,
    createUserProfile,
    deleteUserProfile, // This must be included
    getUserProfile,
    addTestProfile,
    createBulkTestProfiles,
    clearTestProfiles,
    clearAllProfiles
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};