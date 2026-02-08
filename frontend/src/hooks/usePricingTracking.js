import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Hook for tracking pricing events
export const usePricingTracking = () => {
  const { token } = useAuth();

  const trackEvent = useCallback(async (eventType, plan = null, metadata = {}) => {
    if (!token) return;
    
    try {
      await axios.post(
        `${API_URL}/api/email/track-pricing`,
        {
          event_type: eventType,
          plan,
          metadata
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Failed to track pricing event:', error);
    }
  }, [token]);

  const trackPricingViewed = useCallback(() => {
    trackEvent('pricing_viewed');
  }, [trackEvent]);

  const trackPlanSelected = useCallback((plan) => {
    trackEvent('plan_selected', plan);
  }, [trackEvent]);

  const trackCheckoutStarted = useCallback((plan) => {
    trackEvent('checkout_started', plan);
  }, [trackEvent]);

  const trackCheckoutCompleted = useCallback((plan) => {
    trackEvent('checkout_completed', plan);
  }, [trackEvent]);

  return {
    trackEvent,
    trackPricingViewed,
    trackPlanSelected,
    trackCheckoutStarted,
    trackCheckoutCompleted
  };
};

// Hook for abandonment status
export const useAbandonmentStatus = () => {
  const { token, user } = useAuth();
  const [abandonmentStatus, setAbandonmentStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!token || !user) return;
    
    // Only check for free users
    if (user.subscription_plan && user.subscription_plan !== 'free') {
      setAbandonmentStatus({ is_abandoned: false, show_reminder_banner: false });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/email/abandonment-status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAbandonmentStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch abandonment status:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { abandonmentStatus, loading, refetch: fetchStatus };
};

// Hook for email preferences
export const useEmailPreferences = () => {
  const { token } = useAuth();
  const [emailStatus, setEmailStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/email/status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEmailStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch email status:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const unsubscribe = useCallback(async (reason = null) => {
    if (!token) return;
    
    try {
      await axios.post(
        `${API_URL}/api/email/unsubscribe`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchStatus();
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }, [token, fetchStatus]);

  const resubscribe = useCallback(async () => {
    if (!token) return;
    
    try {
      await axios.post(
        `${API_URL}/api/email/resubscribe`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchStatus();
      return true;
    } catch (error) {
      console.error('Failed to resubscribe:', error);
      return false;
    }
  }, [token, fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { emailStatus, loading, unsubscribe, resubscribe, refetch: fetchStatus };
};

export default usePricingTracking;
