import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePricing } from '../contexts/PricingContext';
import { LanguageSwitch } from './LanguageSwitch';
import { OnboardingWizard } from './OnboardingWizard';
import { UpgradeModal } from './UpgradeModal';
import { CreditBundleModal } from './CreditBundleModal';
import { ExitIntentPopup } from './ExitIntentPopup';
import { ViralPromptBanner } from './ViralPrompt';
import { Sparkles, LayoutDashboard, History, Settings, LogOut, Menu, X, Star, PenTool, Image, Palette, BarChart3, CreditCard, Target, CalendarClock, Gift } from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const DashboardLayout = () => {
  const { user, logout, token, checkAuth } = useAuth();
  const { t, language } = useLanguage();
  const { 
    upgradeModalOpen, 
    setUpgradeModalOpen, 
    upgradeModalFeature,
    bundleModalOpen,
    setBundleModalOpen 
  } = usePricing();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  // Check if we should show onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!token || !user) return;
      
      // Show onboarding if user hasn't completed it
      const hasCompletedOnboarding = user.onboarding_completed === true;
      
      if (!hasCompletedOnboarding) {
        // Double-check with API
        try {
          const response = await axios.get(`${API_URL}/api/user/preferences`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.data.onboarding_completed) {
            setShowOnboarding(true);
          }
        } catch (error) {
          // If API fails, show onboarding for safety
          console.error('Failed to check onboarding status:', error);
          setShowOnboarding(true);
        }
      }
    };

    checkOnboarding();
  }, [token, user]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Refresh user data to get updated onboarding status
    await checkAuth();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navItems = [
    { path: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { path: '/create', label: language === 'ru' ? 'Создать контент' : 'Create Content', icon: PenTool, highlight: true },
    { path: '/images', label: language === 'ru' ? 'Изображения' : 'Images', icon: Image },
    { path: '/campaigns', label: language === 'ru' ? 'Кампании' : 'Campaigns', icon: Target, proOnly: true, isNew: true },
    { path: '/scheduler', label: language === 'ru' ? 'Планировщик' : 'Scheduler', icon: CalendarClock, proOnly: true, isNew: true },
    { path: '/referrals', label: language === 'ru' ? 'Рефералы' : 'Referrals', icon: Gift },
    { path: '/brand', label: language === 'ru' ? 'Бренд' : 'Brand', icon: Palette, proOnly: true },
    { path: '/favorites', labelKey: 'favorites.title', icon: Star, proOnly: true },
    { path: '/analytics', label: language === 'ru' ? 'Аналитика' : 'Analytics', icon: BarChart3 },
    { path: '/history', labelKey: 'sidebar.history', icon: History },
    { path: '/pricing', label: language === 'ru' ? 'Тарифы' : 'Pricing', icon: CreditCard },
    { path: '/settings', labelKey: 'sidebar.settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Onboarding Wizard */}
      <OnboardingWizard 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#111113]/95 backdrop-blur-lg border-b border-white/10 z-40 flex items-center justify-between px-4 h-16" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'content-box' }}>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-[#FF3B30]" />
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Postify AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitch variant="minimal" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
            data-testid="mobile-menu-btn"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 z-40"
          style={{ top: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-[#111113] border-r border-white/10 z-50
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:top-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ top: window.innerWidth < 768 ? 'calc(4rem + env(safe-area-inset-top, 0px))' : undefined }}>
        <div className="flex flex-col h-full">
          {/* Logo - Desktop Only */}
          <div className="hidden md:flex p-6 border-b border-white/10 justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-[#FF3B30]" />
                <div className="absolute inset-0 bg-[#FF3B30]/30 blur-lg rounded-full" />
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Postify AI
              </span>
            </div>
            <LanguageSwitch variant="minimal" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 md:mt-0 mt-4 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    item.highlight && !isActive
                      ? 'bg-gradient-to-r from-[#FF3B30]/20 to-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30 hover:from-[#FF3B30]/30 hover:to-[#FF3B30]/20'
                      : isActive
                        ? 'bg-[#FF3B30] text-white shadow-lg shadow-[#FF3B30]/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
                data-testid={`nav-${item.path.slice(1)}`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>{item.label || t(item.labelKey)}</span>
                </div>
                {item.proOnly && !isPro && (
                  <span className="text-[10px] bg-[#FF3B30]/20 text-[#FF3B30] px-1.5 py-0.5 rounded font-medium">
                    PRO
                  </span>
                )}
                {item.isNew && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium animate-pulse">
                    NEW
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10 pb-safe">
            <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm font-medium text-white truncate">{user?.email}</div>
              <div className="text-xs text-gray-400 capitalize mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user?.subscription_plan === 'pro' || user?.subscription_plan === 'business' ? 'bg-[#FF3B30]' : 'bg-gray-500'}`} />
                {user?.subscription_plan || 'Free'} Plan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 pb-safe">
          <Outlet />
        </div>
      </div>

      {/* Global Modals */}
      <UpgradeModal 
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeModalFeature}
      />
      <CreditBundleModal 
        isOpen={bundleModalOpen}
        onClose={() => setBundleModalOpen(false)}
      />
      <ExitIntentPopup />
      <ViralPromptBanner />
    </div>
  );
};
