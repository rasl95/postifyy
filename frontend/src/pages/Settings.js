import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Check, CreditCard, ExternalLink, Loader2, Settings as SettingsIcon, Zap, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Settings = () => {
  const { user, token } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleUpgrade = async (plan) => {
    if (plan === 'free') {
      toast.info(language === 'ru' ? 'Вы уже на бесплатном плане' : 'You are already on the free plan');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/subscriptions/create-checkout`,
        { plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка создания сессии оплаты' : 'Failed to create checkout session');
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/subscriptions/customer-portal`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      window.location.href = response.data.portal_url;
    } catch (error) {
      const message = error.response?.data?.detail || (language === 'ru' ? 'Ошибка открытия портала' : 'Failed to open billing portal');
      toast.error(message);
      setPortalLoading(false);
    }
  };

  const isPaidPlan = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
          <SettingsIcon className="w-7 h-7 text-[#FF3B30]" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {t('settings.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-[#111113] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">{t('settings.currentPlan')}</CardTitle>
          <CardDescription className="text-gray-500">{t('settings.activeSubscription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#FF3B30]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white capitalize">{user?.subscription_plan || 'Free'}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.current_usage || 0} {t('settings.usedOf')} {user?.monthly_limit || 3} {t('settings.generationsUsed')}
                </p>
              </div>
            </div>
            {isPaidPlan && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                data-testid="manage-billing-btn"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {t('settings.manageBilling')}
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
          {isPaidPlan && (
            <p className="text-xs text-gray-600 mt-4">
              {t('settings.billingHint')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('settings.upgradePlans')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Free Plan */}
          <Card className="bg-[#111113] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Free</CardTitle>
              <div className="text-3xl font-bold mt-4 text-white">
                €0<span className="text-base font-normal text-gray-500">{t('pricing.month')}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.free.generations')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.free.allTools')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{language === 'ru' ? 'Базовая поддержка' : 'Basic support'}</span>
                </div>
              </div>
              <Button
                className={`w-full ${user?.subscription_plan === 'free' ? 'bg-white/10 text-gray-400' : 'border-white/20 text-white hover:bg-white/10'}`}
                variant={user?.subscription_plan === 'free' ? 'secondary' : 'outline'}
                disabled={user?.subscription_plan === 'free'}
                onClick={() => handleUpgrade('free')}
              >
                {user?.subscription_plan === 'free' ? t('settings.currentPlanBadge') : t('pricing.free.cta')}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan - Popular */}
          <Card className="bg-[#111113] border-2 border-[#FF3B30] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF3B30] text-white px-4 py-1 rounded-full text-sm font-medium">
              {t('pricing.popular')}
            </div>
            <CardHeader>
              <CardTitle className="text-white">Pro</CardTitle>
              <div className="text-3xl font-bold mt-4 text-white">
                €15<span className="text-base font-normal text-gray-500">{t('pricing.month')}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.pro.generations')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.pro.tones')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.pro.export')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{language === 'ru' ? 'Приоритетная поддержка' : 'Priority support'}</span>
                </div>
              </div>
              <Button
                className={`w-full ${user?.subscription_plan === 'pro' ? 'bg-white/10 text-gray-400' : 'bg-[#FF3B30] hover:bg-[#FF4D42] shadow-lg shadow-[#FF3B30]/30'}`}
                disabled={loading || user?.subscription_plan === 'pro'}
                onClick={() => handleUpgrade('pro')}
              >
                {user?.subscription_plan === 'pro' ? t('settings.currentPlanBadge') : t('pricing.pro.cta')}
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card className="bg-[#111113] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Business</CardTitle>
              <div className="text-3xl font-bold mt-4 text-white">
                €39<span className="text-base font-normal text-gray-500">{t('pricing.month')}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.business.generations')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.business.priority')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{t('pricing.business.analytics')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF3B30]" />
                  <span className="text-sm text-gray-300">{language === 'ru' ? 'Выделенная поддержка' : 'Dedicated support'}</span>
                </div>
              </div>
              <Button
                className={`w-full ${user?.subscription_plan === 'business' ? 'bg-white/10 text-gray-400' : user?.subscription_plan === 'pro' ? 'bg-[#FF3B30] hover:bg-[#FF4D42] shadow-lg shadow-[#FF3B30]/30' : 'border-white/20 text-white hover:bg-white/10'}`}
                variant={user?.subscription_plan === 'business' ? 'secondary' : user?.subscription_plan === 'pro' ? 'default' : 'outline'}
                disabled={loading || user?.subscription_plan === 'business'}
                onClick={() => handleUpgrade('business')}
              >
                {user?.subscription_plan === 'business' 
                  ? t('settings.currentPlanBadge') 
                  : user?.subscription_plan === 'pro' 
                    ? (language === 'ru' ? 'Улучшить до Business' : 'Upgrade to Business')
                    : t('pricing.business.cta')}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Account Info */}
      <Card className="bg-[#111113] border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#FF3B30]" />
            </div>
            <CardTitle className="text-white">{language === 'ru' ? 'Информация об аккаунте' : 'Account Information'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">{language === 'ru' ? 'Имя' : 'Name'}</span>
            <span className="font-medium text-white">{user?.full_name || (language === 'ru' ? 'Не указано' : 'Not set')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
