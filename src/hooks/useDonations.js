// src/hooks/useDonations.js
import { useState, useEffect, useCallback } from 'react';
import donationService from '../services/donationService';
import { useAuth } from '../contexts/AuthContext';

export default function useDonations() {
  const { user } = useAuth();
  const [totalAmount, setTotalAmount] = useState(0);
  const [recentDonations, setRecentDonations] = useState([]);
  const [donationCount, setDonationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [total, recent, count] = await Promise.all([
          donationService.getTotalAmount(),
          donationService.getRecentDonations(5),
          donationService.getDonationCount()
        ]);
        
        // Ensure total is a number
        setTotalAmount(Number(total) || 0);
        setRecentDonations(recent || []);
        setDonationCount(Number(count) || 0);
      } catch (error) {
        console.error('Error loading donation data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Set up real-time listener
  useEffect(() => {
    const unsubscribe = donationService.subscribeToDonations(({ donations }) => {
      if (donations && donations.length > 0) {
        setRecentDonations(donations.slice(0, 5));
        
        // Recalculate total
        const newTotal = donations.reduce((sum, donation) => {
          return sum + (Number(donation.amount) || 0);
        }, 0);
        setTotalAmount(newTotal);
        setDonationCount(donations.length);
      }
    });

    return () => unsubscribe();
  }, []);

  // Add a donation
  const addDonation = useCallback(async (amount, paypalDetails = {}) => {
    try {
      const donationData = await donationService.addDonation(
        amount,
        user?.uid,
        user?.email,
        user?.displayName
      );

      return donationData;
    } catch (error) {
      console.error('Error adding donation:', error);
      throw error;
    }
  }, [user]);

  // Refresh data manually
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [total, recent, count] = await Promise.all([
        donationService.getTotalAmount(),
        donationService.getRecentDonations(5),
        donationService.getDonationCount()
      ]);
      
      setTotalAmount(Number(total) || 0);
      setRecentDonations(recent || []);
      setDonationCount(Number(count) || 0);
    } catch (error) {
      console.error('Error refreshing donation data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    totalAmount,
    recentDonations,
    donationCount,
    loading,
    addDonation,
    refreshData
  };
}