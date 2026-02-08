import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UpgradeConfirmation } from './OnboardingScreens';

export const OnboardingFlow = ({ children }) => {
  const { showOnboarding, onboardingStep, setOnboardingStep, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if showing upgrade confirmation after successful payment
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true' && params.get('upgraded') === 'true') {
      setOnboardingStep('upgradeConfirmation');
    }
  }, [location, setOnboardingStep]);

  // Show upgrade confirmation after successful payment
  if (onboardingStep === 'upgradeConfirmation') {
    return (
      <UpgradeConfirmation
        onContinue={() => {
          completeOnboarding();
          navigate('/dashboard');
        }}
      />
    );
  }

  // New users now get OnboardingWizard in DashboardLayout instead
  // This provides a better UX with 3-step wizard
  if (showOnboarding && (onboardingStep === 'welcome' || onboardingStep === 'firstAction')) {
    // Complete old onboarding and let the new wizard handle it
    completeOnboarding();
  }

  // Show normal app - OnboardingWizard will be shown in DashboardLayout if needed
  return children;
};
