// src/services/donationService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  getCountFromServer,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

class DonationService {
  
  // Add a new donation
  async addDonation(amount, userId = null, userEmail = null, displayName = null) {
    try {
      const donationRef = collection(db, 'donations');
      const donationData = {
        amount: parseFloat(amount),
        userId,
        userEmail,
        displayName,
        timestamp: Timestamp.now(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(donationRef, donationData);
      
      return {
        id: docRef.id,
        ...donationData
      };
    } catch (error) {
      console.error('Error adding donation:', error);
      throw error;
    }
  }

  // Get total amount collected
  async getTotalAmount() {
    try {
      const donationsRef = collection(db, 'donations');
      const snapshot = await getDocs(donationsRef);
      
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += data.amount || 0;
      });
      
      return total;
    } catch (error) {
      console.error('Error getting total amount:', error);
      return 0;
    }
  }

  // Get recent donations
  async getRecentDonations(count = 5) {
    try {
      const donationsRef = collection(db, 'donations');
      const q = query(
        donationsRef,
        orderBy('timestamp', 'desc'),
        limit(count)
      );
      
      const snapshot = await getDocs(q);
      const donations = [];
      
      snapshot.forEach(doc => {
        donations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return donations;
    } catch (error) {
      console.error('Error getting recent donations:', error);
      return [];
    }
  }

  // Get all donations for history
  async getAllDonations() {
    try {
      const donationsRef = collection(db, 'donations');
      const q = query(donationsRef, orderBy('timestamp', 'desc'));
      
      const snapshot = await getDocs(q);
      const donations = [];
      
      snapshot.forEach(doc => {
        donations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return donations;
    } catch (error) {
      console.error('Error getting all donations:', error);
      return [];
    }
  }

  // Get donation count
  async getDonationCount() {
    try {
      const donationsRef = collection(db, 'donations');
      const snapshot = await getCountFromServer(donationsRef);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting donation count:', error);
      return 0;
    }
  }

  // Subscribe to real-time donations updates
  subscribeToDonations(callback) {
    const donationsRef = collection(db, 'donations');
    const q = query(donationsRef, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const donations = [];
      snapshot.forEach(doc => {
        donations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      callback({
        donations,
        changes: snapshot.docChanges()
      });
    });
  }
}

// Create and export a single instance
const donationService = new DonationService();
export default donationService;