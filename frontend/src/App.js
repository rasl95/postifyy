import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { PricingProvider } from './contexts/PricingContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { OnboardingFlow } from './components/OnboardingFlow';
import { AuthCallback } from './components/AuthCallback';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ContentGenerator } from './pages/ContentGenerator';
import { ImageGenerator } from './pages/ImageGenerator';
import { BrandSettings } from './pages/BrandSettings';
import { History } from './pages/History';
import { Favorites } from './pages/Favorites';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import { Pricing } from './pages/Pricing';
import { MarketingCampaigns } from './pages/MarketingCampaigns';
import { SharedCampaign } from './pages/SharedCampaign';
import { Scheduler } from './pages/Scheduler';
import { Referrals } from './pages/Referrals';
import { Toaster } from './components/ui/sonner';
import './App.css';

/**
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 * AppRouter handles OAuth callback detection synchronously during render
 * to prevent race conditions with ProtectedRoute.
 */
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id (OAuth callback) - MUST be synchronous
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <OnboardingFlow>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/shared/:shareToken" element={<SharedCampaign />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<ContentGenerator />} />
          <Route path="/images" element={<ImageGenerator />} />
          <Route path="/campaigns" element={<MarketingCampaigns />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/brand" element={<BrandSettings />} />
          <Route path="/history" element={<History />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OnboardingFlow>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PricingProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster position="top-center" offset="80px" duration={3000} />
        </PricingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;