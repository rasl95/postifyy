import React, { useEffect } from 'react';
import { PricingPage } from '../components/PricingPage';
import { UpgradeModal } from '../components/UpgradeModal';
import { CreditBundleModal } from '../components/CreditBundleModal';
import { usePricing } from '../contexts/PricingContext';
import { usePricingTracking } from '../hooks/usePricingTracking';

export const Pricing = () => {
  const { 
    upgradeModalOpen, 
    setUpgradeModalOpen, 
    upgradeModalFeature,
    bundleModalOpen,
    setBundleModalOpen
  } = usePricing();
  
  const { trackPricingViewed } = usePricingTracking();

  // Track pricing page view
  useEffect(() => {
    trackPricingViewed();
  }, [trackPricingViewed]);

  return (
    <div className="min-h-screen bg-[#0B0B0D] py-8 px-4 md:px-8">
      <PricingPage />
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeModalFeature}
      />
      
      {/* Credit Bundle Modal */}
      <CreditBundleModal 
        isOpen={bundleModalOpen}
        onClose={() => setBundleModalOpen(false)}
      />
    </div>
  );
};

export default Pricing;