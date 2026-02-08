import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PricingContext = createContext();
const API_URL = process.env.REACT_APP_BACKEND_URL;

// Centralized pricing configuration - Single source of truth
export const PRICING_CONFIG = {
  plans: {
    free: {
      id: 'free',
      name: { en: 'Free', ru: 'Бесплатный' },
      monthlyPrice: 0,
      yearlyPrice: 0,
      credits: 3,
      imageCredits: 2,
      features: {
        basicGeneration: true,
        allContentTypes: true,
        basicTones: true,
        extendedTones: false,
        favorites: false,
        postGoals: false,
        brandAI: false,
        marketingSets: false,
        advancedStyles: false,
        analytics: false,
        export: false,
        prioritySupport: false,
        priorityProcessing: false,
      },
      limits: {
        monthlyGenerations: 3,
        monthlyImages: 2,
        maxTokens: 250,
      }
    },
    pro: {
      id: 'pro',
      name: { en: 'Pro', ru: 'Pro' },
      monthlyPrice: 15,
      yearlyPrice: 126, // 30% discount (was 180)
      credits: 200,
      imageCredits: 30,
      popular: true,
      features: {
        basicGeneration: true,
        allContentTypes: true,
        basicTones: true,
        extendedTones: true,
        favorites: true,
        postGoals: true,
        brandAI: true,
        marketingSets: true,
        advancedStyles: true,
        analytics: true,
        export: true,
        prioritySupport: true,
        priorityProcessing: false,
      },
      limits: {
        monthlyGenerations: 200,
        monthlyImages: 30,
        maxTokens: 350,
      }
    },
    business: {
      id: 'business',
      name: { en: 'Business', ru: 'Бизнес' },
      monthlyPrice: 39,
      yearlyPrice: 327, // 30% discount (was 468)
      credits: 600,
      imageCredits: 100,
      features: {
        basicGeneration: true,
        allContentTypes: true,
        basicTones: true,
        extendedTones: true,
        favorites: true,
        postGoals: true,
        brandAI: true,
        marketingSets: true,
        advancedStyles: true,
        analytics: true,
        export: true,
        prioritySupport: true,
        priorityProcessing: true,
        batchGeneration: true,
        teamAccess: true,
      },
      limits: {
        monthlyGenerations: 600,
        monthlyImages: 100,
        maxTokens: 500,
      }
    }
  },
  creditBundles: [
    { id: 'bundle_100', credits: 100, price: 9, savings: '10%' },
    { id: 'bundle_300', credits: 300, price: 24, savings: '20%' },
    { id: 'bundle_1000', credits: 1000, price: 69, savings: '31%' },
  ],
  trialConfig: {
    bonusCredits: 50,
    trialDays: 7,
    trialPlan: 'pro',
  },
  lockedFeatures: {
    brandAI: { requiredPlan: 'pro', icon: 'Palette' },
    marketingSets: { requiredPlan: 'pro', icon: 'Layout' },
    advancedStyles: { requiredPlan: 'pro', icon: 'Wand2' },
    analytics: { requiredPlan: 'pro', icon: 'BarChart3' },
    batchGeneration: { requiredPlan: 'business', icon: 'Layers' },
  }
};

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within PricingProvider');
  }
  return context;
};

export const PricingProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState(null);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly or yearly
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const currentPlan = user?.subscription_plan || 'free';
  const currentPlanConfig = PRICING_CONFIG.plans[currentPlan];

  // Check if user has access to a feature
  const hasFeatureAccess = useCallback((featureKey) => {
    const planConfig = PRICING_CONFIG.plans[currentPlan];
    return planConfig?.features?.[featureKey] ?? false;
  }, [currentPlan]);

  // Check if a feature is locked and return required plan
  const getFeatureLock = useCallback((featureKey) => {
    if (hasFeatureAccess(featureKey)) return null;
    const lockInfo = PRICING_CONFIG.lockedFeatures[featureKey];
    return lockInfo || { requiredPlan: 'pro' };
  }, [hasFeatureAccess]);

  // Get current usage stats
  const getUsageStats = useCallback(() => {
    return {
      currentUsage: user?.current_usage || 0,
      monthlyLimit: user?.monthly_limit || currentPlanConfig?.limits?.monthlyGenerations || 3,
      bonusCredits: user?.bonus_credits || 0,
      remainingCredits: Math.max(0, (user?.monthly_limit || 3) - (user?.current_usage || 0) + (user?.bonus_credits || 0)),
      percentUsed: Math.min(100, ((user?.current_usage || 0) / (user?.monthly_limit || 3)) * 100),
    };
  }, [user, currentPlanConfig]);

  // Check if credits are low (< 10 remaining)
  const isCreditsLow = useCallback(() => {
    const stats = getUsageStats();
    return stats.remainingCredits < 10 && stats.remainingCredits > 0;
  }, [getUsageStats]);

  // Check if credits are exhausted
  const isCreditsExhausted = useCallback(() => {
    const stats = getUsageStats();
    return stats.remainingCredits <= 0;
  }, [getUsageStats]);

  // Show upgrade modal for a locked feature
  const showUpgradeModal = useCallback((featureKey = null) => {
    setUpgradeModalFeature(featureKey);
    setUpgradeModalOpen(true);
  }, []);

  // Track pricing event
  const trackPricingEvent = useCallback(async (eventType, plan = null) => {
    if (!token) return;
    try {
      await axios.post(
        `${API_URL}/api/email/track-pricing`,
        { event_type: eventType, plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to track pricing event:', error);
    }
  }, [token]);

  // Create Stripe checkout session
  const createCheckout = useCallback(async (plan, period = 'monthly') => {
    if (!token) return null;
    setCheckoutLoading(true);
    
    // Track checkout started
    await trackPricingEvent('checkout_started', plan);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/subscriptions/create-checkout`,
        { plan, billing_period: period },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.checkout_url;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    } finally {
      setCheckoutLoading(false);
    }
  }, [token]);

  // Purchase credit bundle
  const purchaseCreditBundle = useCallback(async (bundleId) => {
    if (!token) return null;
    setCheckoutLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/credits/purchase`,
        { bundle_id: bundleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.checkout_url;
    } catch (error) {
      console.error('Bundle purchase error:', error);
      throw error;
    } finally {
      setCheckoutLoading(false);
    }
  }, [token]);

  // Calculate yearly savings
  const getYearlySavings = useCallback((planId) => {
    const plan = PRICING_CONFIG.plans[planId];
    if (!plan || plan.monthlyPrice === 0) return 0;
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return Math.round((savings / monthlyTotal) * 100);
  }, []);

  const value = {
    // Config
    PRICING_CONFIG,
    currentPlan,
    currentPlanConfig,
    billingPeriod,
    setBillingPeriod,
    
    // Feature access
    hasFeatureAccess,
    getFeatureLock,
    
    // Usage
    getUsageStats,
    isCreditsLow,
    isCreditsExhausted,
    
    // Modals
    upgradeModalOpen,
    setUpgradeModalOpen,
    upgradeModalFeature,
    showUpgradeModal,
    bundleModalOpen,
    setBundleModalOpen,
    
    // Checkout
    createCheckout,
    purchaseCreditBundle,
    checkoutLoading,
    getYearlySavings,
  };

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
};
