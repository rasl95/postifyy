import React, { useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePricing } from '../contexts/PricingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Sparkles, TrendingUp, Package, ArrowRight, Zap, PenTool, MessageSquare, Video, Clock, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LowCreditsBanner } from '../components/UpgradeModal';
import { AbandonmentBanner } from '../components/AbandonmentBanner';
import { usePricingTracking } from '../hooks/usePricingTracking';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Dashboard = () => {
  const { user, checkAuth, token } = useAuth();
  const { t, language } = useLanguage();
  const { showUpgradeModal, isCreditsLow, isCreditsExhausted } = usePricing();
  const navigate = useNavigate();
  const { trackCheckoutCompleted } = usePricingTracking();
  const [hoursSaved, setHoursSaved] = React.useState(null);

  useEffect(() => {
    checkAuth();
    
    // Check for successful checkout redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true' && urlParams.get('upgraded') === 'true') {
      trackCheckoutCompleted('pro');
      window.history.replaceState({}, '', '/dashboard');
    }
    
    // Fetch hours saved
    if (token) {
      axios.get(`${API_URL}/api/scheduler/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setHoursSaved(res.data.hours_saved)).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = (user?.monthly_limit || 3) - (user?.current_usage || 0);
  const usagePercent = Math.min((user?.current_usage || 0) / (user?.monthly_limit || 3) * 100, 100);
  const firstName = user?.full_name?.split(' ')[0] || '';
  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  return (
    <div className="max-w-5xl mx-auto space-y-10" data-testid="dashboard">
      {/* Abandonment Banner - for users who viewed pricing but didn't convert */}
      {!isPro && <AbandonmentBanner />}
      
      {/* Low Credits Banner */}
      {!isPro && <LowCreditsBanner onUpgrade={() => showUpgradeModal('low_credits')} />}
      
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#151517] via-[#111113] to-[#0D0D0F] border border-white/10 p-8 md:p-12">
        {/* Background glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF3B30]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#FF3B30]/5 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {language === 'ru' 
                ? <>Привет{firstName ? `, ${firstName}` : ''}! <span className="inline-block animate-wave">👋</span></>
                : <>Hey{firstName ? `, ${firstName}` : ''}! <span className="inline-block animate-wave">👋</span></>
              }
            </h1>
            <p className="text-gray-400 text-lg max-w-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
              {language === 'ru' 
                ? 'Создавайте контент, который привлекает внимание и конвертирует'
                : 'Create content that captures attention and converts'
              }
            </p>
            
            {/* Main CTA */}
            <Button
              onClick={() => navigate('/create')}
              className="mt-4 h-14 px-8 bg-gradient-to-r from-[#FF3B30] to-[#FF5545] hover:from-[#FF4D42] hover:to-[#FF6655] text-white font-bold text-lg shadow-[0_0_40px_rgba(255,59,48,0.4)] transition-all hover:scale-[1.02]"
            >
              <PenTool className="w-5 h-5 mr-2" />
              {language === 'ru' ? 'Создать контент' : 'Create Content'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          {/* Usage Counter - Enhanced */}
          <div className="flex-shrink-0 bg-gradient-to-br from-[#1A1A1C] to-[#0A0A0B] rounded-2xl p-6 border border-white/10 min-w-[260px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">{language === 'ru' ? 'Ваш баланс' : 'Your balance'}</span>
              <div className="flex items-center gap-1 text-[#FF3B30]">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold">{isPro ? 'Pro' : 'Free'}</span>
              </div>
            </div>
            <div className="text-6xl font-black text-white mb-3 tracking-tight">
              {remaining}
            </div>
            <Progress value={100 - usagePercent} className="h-2 mb-3" />
            <p className="text-sm text-gray-400">
              {user?.current_usage || 0} / {user?.monthly_limit || 3} {language === 'ru' ? 'использовано' : 'used'}
            </p>
            {!isPro && (
              <button 
                onClick={() => navigate('/settings')}
                className="mt-3 text-xs text-[#FF3B30] hover:underline flex items-center gap-1"
              >
                {language === 'ru' ? 'Pro — без ограничений' : 'Pro — unlimited'}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hours Saved Counter */}
      {hoursSaved !== null && hoursSaved > 0 && (
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10" data-testid="hours-saved-counter">
          <div className="w-12 h-12 rounded-xl bg-[#FF3B30]/15 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-[#FF3B30]" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{hoursSaved}</span>
              <span className="text-sm text-gray-400">
                {language === 'ru' ? 'часов сэкономлено с Postify AI' : 'hours saved with Postify AI'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'ru' 
                ? `= ${Math.round(hoursSaved * 15)}$ экономии (если 15$/час)`
                : `= $${Math.round(hoursSaved * 15)} saved (at $15/hr)`}
            </p>
          </div>
          {isPro && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/scheduler')}
              className="text-[#FF3B30] hover:bg-[#FF3B30]/10"
            >
              <CalendarClock className="w-4 h-4 mr-1" />
              {language === 'ru' ? 'Планировщик' : 'Scheduler'}
            </Button>
          )}
        </div>
      )}

      {/* Low Usage / Limit Warnings */}
      {remaining <= 1 && remaining > 0 && user?.subscription_plan === 'free' && (
        <div className="bg-gradient-to-r from-[#FF3B30]/20 via-[#FF3B30]/10 to-transparent rounded-2xl p-6 border border-[#FF3B30]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF3B30]/20 flex items-center justify-center animate-pulse">
              <Zap className="w-6 h-6 text-[#FF3B30]" />
            </div>
            <div>
              <h3 className="text-white font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {language === 'ru' ? 'Последняя бесплатная генерация!' : 'Last free generation!'}
              </h3>
              <p className="text-gray-400 text-sm">
                {language === 'ru' ? 'Перейдите на Pro для 200 генераций/месяц' : 'Upgrade to Pro for 200 generations/month'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/settings')}
            className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-bold shadow-lg shadow-[#FF3B30]/30"
          >
            {language === 'ru' ? 'Перейти на Pro' : 'Upgrade to Pro'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {remaining <= 0 && user?.subscription_plan === 'free' && (
        <div className="bg-gradient-to-r from-[#FF3B30]/30 via-[#FF3B30]/20 to-[#FF3B30]/10 rounded-2xl p-10 border border-[#FF3B30]/40 text-center">
          <h3 className="text-3xl text-white font-bold mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Не останавливайтесь!' : "Don't stop now!"}
          </h3>
          <p className="text-gray-300 mb-4 max-w-md mx-auto">
            {language === 'ru' 
              ? 'Вы уже создали 3 единицы контента — это отличный старт.'
              : "You've already created 3 pieces of content — great start."
            }
          </p>
          {hoursSaved > 0 && (
            <p className="text-sm text-[#FF3B30] mb-4 font-medium">
              {language === 'ru' 
                ? `Postify AI уже сэкономил вам ${hoursSaved} часов. С Pro будет ещё больше.`
                : `Postify AI already saved you ${hoursSaved} hours. Pro unlocks even more.`}
            </p>
          )}
          <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm">
            {language === 'ru'
              ? 'Pro = 200 генераций/мес. Это ~1 пост каждый день + AI-изображения + кампании.'
              : 'Pro = 200 generations/mo. That\'s ~1 post every day + AI images + campaigns.'}
          </p>
          <Button
            onClick={() => navigate('/pricing')}
            className="bg-[#FF3B30] hover:bg-[#FF4D42] text-white font-bold px-10 py-7 text-lg shadow-[0_0_50px_rgba(255,59,48,0.5)] hover:scale-[1.02] transition-all"
            data-testid="smart-upgrade-cta"
          >
            {language === 'ru' ? 'Продолжить без лимитов' : 'Continue without limits'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Quick Content Types */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {language === 'ru' ? 'Быстрый выбор' : 'Quick select'}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Social Posts */}
          <Card
            className="group cursor-pointer bg-gradient-to-br from-[#151517] to-[#0D0D0F] border-white/10 hover:border-[#FF3B30]/50 transition-all duration-300 hover:shadow-[0_0_50px_rgba(255,59,48,0.15)] hover:-translate-y-1"
            onClick={() => navigate('/create?tab=social_post')}
          >
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/5 border border-[#FF3B30]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                <MessageSquare className="w-7 h-7 text-[#FF3B30]" />
              </div>
              <CardTitle className="text-white text-xl group-hover:text-[#FF3B30] transition-colors" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {language === 'ru' ? 'Посты' : 'Posts'}
              </CardTitle>
              <CardDescription className="text-gray-500">
                Instagram, TikTok, Telegram
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-[#FF3B30] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {language === 'ru' ? 'Создать' : 'Create'}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Video Ideas */}
          <Card
            className="group cursor-pointer bg-gradient-to-br from-[#151517] to-[#0D0D0F] border-white/10 hover:border-[#FF3B30]/50 transition-all duration-300 hover:shadow-[0_0_50px_rgba(255,59,48,0.15)] hover:-translate-y-1"
            onClick={() => navigate('/create?tab=video_idea')}
          >
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B4A]/20 to-[#FF6B4A]/5 border border-[#FF6B4A]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                <Video className="w-7 h-7 text-[#FF6B4A]" />
              </div>
              <CardTitle className="text-white text-xl group-hover:text-[#FF3B30] transition-colors" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {language === 'ru' ? 'Видео' : 'Video'}
              </CardTitle>
              <CardDescription className="text-gray-500">
                Reels, TikTok, Shorts
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-[#FF3B30] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {language === 'ru' ? 'Создать' : 'Create'}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Product Description */}
          <Card
            className="group cursor-pointer bg-gradient-to-br from-[#151517] to-[#0D0D0F] border-white/10 hover:border-[#FF3B30]/50 transition-all duration-300 hover:shadow-[0_0_50px_rgba(255,59,48,0.15)] hover:-translate-y-1"
            onClick={() => navigate('/create?tab=product_description')}
          >
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8C69]/20 to-[#FF8C69]/5 border border-[#FF8C69]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                <Package className="w-7 h-7 text-[#FF8C69]" />
              </div>
              <CardTitle className="text-white text-xl group-hover:text-[#FF3B30] transition-colors" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {language === 'ru' ? 'Продукт' : 'Product'}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {language === 'ru' ? 'Продающие описания' : 'Sales descriptions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-[#FF3B30] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {language === 'ru' ? 'Создать' : 'Create'}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pro Benefits - Show only for free users */}
      {user?.subscription_plan === 'free' && remaining > 0 && (
        <Card className="bg-gradient-to-br from-[#151517] via-[#111113] to-[#0D0D0F] border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-8 md:p-10">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF3B30]/20 to-[#FF3B30]/10 text-[#FF3B30] px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  PRO
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {language === 'ru' ? 'Создавайте без ограничений' : 'Create without limits'}
                </h3>
                <ul className="space-y-3 text-gray-400 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                    {language === 'ru' ? '200 генераций в месяц' : '200 generations per month'}
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                    {language === 'ru' ? 'Расширенные тоны и CTA-цели' : 'Extended tones and CTA goals'}
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                    {language === 'ru' ? 'Избранное и экспорт истории' : 'Favorites and history export'}
                  </li>
                </ul>
                <Button
                  onClick={() => navigate('/settings')}
                  className="bg-gradient-to-r from-[#FF3B30] to-[#FF5545] hover:from-[#FF4D42] hover:to-[#FF6655] text-white font-bold shadow-lg shadow-[#FF3B30]/30"
                >
                  {language === 'ru' ? 'Узнать о Pro' : 'Learn about Pro'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="hidden md:block w-64 bg-gradient-to-br from-[#FF3B30]/20 via-[#FF3B30]/10 to-transparent" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
