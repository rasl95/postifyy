import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, Crown, X, ArrowRight, Clock, Users, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Switch } from './ui/switch';
import { usePricing, PRICING_CONFIG } from '../contexts/PricingContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// Feature comparison data
const FEATURE_COMPARISON = {
  en: [
    { feature: 'Monthly Generations', free: '3', pro: '200', business: '600' },
    { feature: 'AI Images', free: '2', pro: '30', business: '100' },
    { feature: 'All Content Types', free: true, pro: true, business: true },
    { feature: 'Extended Tones', free: false, pro: true, business: true },
    { feature: 'Favorites & History', free: false, pro: true, business: true },
    { feature: 'Brand AI Profile', free: false, pro: true, business: true },
    { feature: 'Marketing Sets', free: false, pro: true, business: true },
    { feature: 'Advanced Styles', free: false, pro: true, business: true },
    { feature: 'Analytics Dashboard', free: false, pro: true, business: true },
    { feature: 'Export (CSV/PDF)', free: false, pro: true, business: true },
    { feature: 'Priority Processing', free: false, pro: false, business: true },
    { feature: 'Batch Generation', free: false, pro: false, business: true },
    { feature: 'Priority Support', free: false, pro: true, business: true },
  ],
  ru: [
    { feature: 'Генерации в месяц', free: '3', pro: '200', business: '600' },
    { feature: 'AI Изображения', free: '2', pro: '30', business: '100' },
    { feature: 'Все типы контента', free: true, pro: true, business: true },
    { feature: 'Расширенные тона', free: false, pro: true, business: true },
    { feature: 'Избранное и история', free: false, pro: true, business: true },
    { feature: 'Brand AI профиль', free: false, pro: true, business: true },
    { feature: 'Маркетинг-наборы', free: false, pro: true, business: true },
    { feature: 'Продвинутые стили', free: false, pro: true, business: true },
    { feature: 'Панель аналитики', free: false, pro: true, business: true },
    { feature: 'Экспорт (CSV/PDF)', free: false, pro: true, business: true },
    { feature: 'Приоритетная обработка', free: false, pro: false, business: true },
    { feature: 'Пакетная генерация', free: false, pro: false, business: true },
    { feature: 'Приоритетная поддержка', free: false, pro: true, business: true },
  ]
};

const SOCIAL_PROOF = {
  en: {
    users: '10,000+ creators',
    rating: '4.9/5 average rating',
    generated: '500K+ content pieces generated',
  },
  ru: {
    users: '10,000+ создателей',
    rating: '4.9/5 средний рейтинг',
    generated: '500K+ созданного контента',
  }
};

// Main Pricing Page Component
export const PricingPage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { 
    billingPeriod, 
    setBillingPeriod, 
    createCheckout, 
    checkoutLoading,
    getYearlySavings 
  } = usePricing();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleUpgrade = async (planId) => {
    if (planId === 'free') {
      toast.info(language === 'ru' ? 'Вы уже на бесплатном плане' : 'You are already on the free plan');
      return;
    }
    
    if (user?.subscription_plan === planId) {
      toast.info(language === 'ru' ? 'Вы уже на этом плане' : 'You are already on this plan');
      return;
    }

    setLoadingPlan(planId);
    try {
      const checkoutUrl = await createCheckout(planId, billingPeriod);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка создания сессии оплаты' : 'Failed to create checkout session');
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = PRICING_CONFIG.plans;
  const currentPlan = user?.subscription_plan || 'free';

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {language === 'ru' ? 'Простые и честные цены' : 'Simple and honest pricing'}
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {language === 'ru' 
            ? 'Выберите план, который подходит вашему бизнесу. Отмена в любое время.'
            : 'Choose the plan that fits your business. Cancel anytime.'}
        </p>
        
        {/* Social Proof */}
        <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF3B30]" />
            <span>{SOCIAL_PROOF[language].users}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF3B30]" />
            <span>{SOCIAL_PROOF[language].generated}</span>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-gray-500'}`}>
          {language === 'ru' ? 'Ежемесячно' : 'Monthly'}
        </span>
        <Switch
          checked={billingPeriod === 'yearly'}
          onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
          className="data-[state=checked]:bg-[#FF3B30]"
        />
        <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
          {language === 'ru' ? 'Ежегодно' : 'Yearly'}
        </span>
        {billingPeriod === 'yearly' && (
          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium">
            {language === 'ru' ? 'Скидка 30%' : 'Save 30%'}
          </span>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* Free Plan */}
        <Card className="bg-[#111113] border-white/10 relative">
          <CardHeader className="pb-2">
            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-gray-400" />
            </div>
            <CardTitle className="text-white text-xl">{plans.free.name[language]}</CardTitle>
            <p className="text-gray-500 text-sm">
              {language === 'ru' ? 'Идеально для старта' : 'Perfect to get started'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-bold text-white">
                €0
                <span className="text-base font-normal text-gray-500">
                  /{language === 'ru' ? 'мес' : 'mo'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? '3 генерации в месяц' : '3 generations/month'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? '2 AI изображения' : '2 AI images'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Все типы контента' : 'All content types'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? '4 базовых тона' : '4 basic tones'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className={`w-full py-6 ${currentPlan === 'free' 
                ? 'bg-white/5 text-gray-400 border-white/10 cursor-default' 
                : 'border-white/20 text-white hover:bg-white/10'}`}
              disabled={currentPlan === 'free'}
              data-testid="pricing-free-btn"
            >
              {currentPlan === 'free' 
                ? (language === 'ru' ? 'Текущий план' : 'Current Plan')
                : (language === 'ru' ? 'Начать бесплатно' : 'Start Free')}
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan - Most Popular */}
        <Card className="bg-[#111113] border-2 border-[#FF3B30] relative transform md:scale-105 shadow-xl shadow-[#FF3B30]/10">
          {/* Popular Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-[#FF3B30] to-[#FF6B5B] text-white px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-4 h-4" />
              {language === 'ru' ? 'Популярный' : 'Most Popular'}
            </div>
          </div>
          
          <CardHeader className="pb-2 pt-8">
            <div className="w-12 h-12 rounded-xl bg-[#FF3B30]/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[#FF3B30]" />
            </div>
            <CardTitle className="text-white text-xl">{plans.pro.name[language]}</CardTitle>
            <p className="text-gray-500 text-sm">
              {language === 'ru' ? 'Для создателей контента' : 'For content creators'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-bold text-white">
                €{billingPeriod === 'yearly' ? Math.round(plans.pro.yearlyPrice / 12) : plans.pro.monthlyPrice}
                <span className="text-base font-normal text-gray-500">
                  /{language === 'ru' ? 'мес' : 'mo'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="text-sm text-green-400 mt-1">
                  {language === 'ru' 
                    ? `€${plans.pro.yearlyPrice}/год (экономия €${plans.pro.monthlyPrice * 12 - plans.pro.yearlyPrice})`
                    : `€${plans.pro.yearlyPrice}/year (save €${plans.pro.monthlyPrice * 12 - plans.pro.yearlyPrice})`}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? '200 генераций в месяц' : '200 generations/month'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? '30 AI изображений' : '30 AI images'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Все расширенные тона' : 'All extended tones'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Brand AI & Аналитика' : 'Brand AI & Analytics'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF3B30]" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Экспорт данных' : 'Data export'}
                </span>
              </div>
            </div>

            <Button
              className={`w-full py-6 ${currentPlan === 'pro'
                ? 'bg-white/5 text-gray-400 border border-white/10 cursor-default'
                : 'bg-[#FF3B30] hover:bg-[#FF4D42] text-white shadow-lg shadow-[#FF3B30]/30'}`}
              disabled={loadingPlan === 'pro' || currentPlan === 'pro' || checkoutLoading}
              onClick={() => handleUpgrade('pro')}
              data-testid="pricing-pro-btn"
            >
              {loadingPlan === 'pro' ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                </span>
              ) : currentPlan === 'pro' ? (
                language === 'ru' ? 'Текущий план' : 'Current Plan'
              ) : (
                <>
                  {language === 'ru' ? 'Перейти на Pro' : 'Upgrade to Pro'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Business Plan */}
        <Card className="bg-[#111113] border-white/10 relative">
          <CardHeader className="pb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <CardTitle className="text-white text-xl">{plans.business.name[language]}</CardTitle>
            <p className="text-gray-500 text-sm">
              {language === 'ru' ? 'Для команд и агентств' : 'For teams and agencies'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-bold text-white">
                €{billingPeriod === 'yearly' ? Math.round(plans.business.yearlyPrice / 12) : plans.business.monthlyPrice}
                <span className="text-base font-normal text-gray-500">
                  /{language === 'ru' ? 'мес' : 'mo'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="text-sm text-green-400 mt-1">
                  {language === 'ru' 
                    ? `€${plans.business.yearlyPrice}/год (экономия €${plans.business.monthlyPrice * 12 - plans.business.yearlyPrice})`
                    : `€${plans.business.yearlyPrice}/year (save €${plans.business.monthlyPrice * 12 - plans.business.yearlyPrice})`}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? '600 генераций в месяц' : '600 generations/month'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? '100 AI изображений' : '100 AI images'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Всё из Pro' : 'Everything in Pro'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Приоритетная обработка' : 'Priority processing'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">
                  {language === 'ru' ? 'Пакетная генерация' : 'Batch generation'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className={`w-full py-6 ${currentPlan === 'business'
                ? 'bg-white/5 text-gray-400 border-white/10 cursor-default'
                : 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500'}`}
              disabled={loadingPlan === 'business' || currentPlan === 'business' || checkoutLoading}
              onClick={() => handleUpgrade('business')}
              data-testid="pricing-business-btn"
            >
              {loadingPlan === 'business' ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  {language === 'ru' ? 'Загрузка...' : 'Loading...'}
                </span>
              ) : currentPlan === 'business' ? (
                language === 'ru' ? 'Текущий план' : 'Current Plan'
              ) : (
                <>
                  {language === 'ru' ? 'Перейти на Business' : 'Upgrade to Business'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {language === 'ru' ? 'Сравнение функций' : 'Feature Comparison'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-gray-400 font-medium">
                  {language === 'ru' ? 'Функция' : 'Feature'}
                </th>
                <th className="text-center py-4 px-4 text-gray-400 font-medium">Free</th>
                <th className="text-center py-4 px-4 text-[#FF3B30] font-medium">Pro</th>
                <th className="text-center py-4 px-4 text-purple-400 font-medium">Business</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON[language].map((row, index) => (
                <tr key={index} className="border-b border-white/5">
                  <td className="py-4 px-4 text-gray-300 text-sm">{row.feature}</td>
                  <td className="py-4 px-4 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-300 text-sm">{row.free}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <Check className="w-5 h-5 text-[#FF3B30] mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-[#FF3B30] text-sm font-medium">{row.pro}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof row.business === 'boolean' ? (
                      row.business ? (
                        <Check className="w-5 h-5 text-purple-400 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-purple-400 text-sm font-medium">{row.business}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Value Explanation */}
      <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          {language === 'ru' ? 'Что такое генерация?' : 'What is a generation?'}
        </h3>
        <p className="text-gray-400 text-sm">
          {language === 'ru' 
            ? 'Одна генерация = один AI-созданный контент (пост, идея видео или описание товара). Изображения считаются отдельно. Кредиты обновляются каждый месяц.'
            : 'One generation = one AI-created content piece (post, video idea, or product description). Images are counted separately. Credits reset each month.'}
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
